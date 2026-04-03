import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore'; // 🔥 Importamos o acesso aos dados globais

export default function GravadorPanel({ onTranscricaoCompleta }) {
    const [gravando, setGravando] = useState(false);
    const [logs, setLogs] = useState(['Módulo de Escuta por Locutor inicializado. Pronto para legendar...']);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const logsEndRef = useRef(null);

    // 🔥 BUSCAMOS OS JOGADORES ATIVOS NA SESSÃO RP 🔥
    const cenario = useStore(s => s.cenario);
    const nomesAtivos = Array.isArray(cenario?.tavernaAtivos) ? cenario.tavernaAtivos : [];

    const addLog = (msg) => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${hora}] ${msg}`]);
    };

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const iniciarGravacao = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                
                addLog("Áudio processado. Iniciando upload para análise de voz...");
                
                try {
                    const nomeArquivo = `sessao_${Date.now()}.webm`;
                    const audioRef = ref(storage, `audios_mesa/${nomeArquivo}`);
                    
                    await uploadBytes(audioRef, audioBlob);
                    addLog(`✅ Upload concluído: ${nomeArquivo}`);

                    if (!functions) return addLog("❌ Erro: Firebase Functions offline.");

                    addLog(`🧠 Sexta-Feira está a identificar as vozes de: ${nomesAtivos.join(', ') || 'Vozes Ocultas'}...`);
                    
                    const transcrever = httpsCallable(functions, 'transcreverAudioSextaFeira');
                    
                    // 🔥 ENVIAMOS A LISTA DE NOMES PARA A IA USAR COMO LEGENDA 🔥
                    const resultado = await transcrever({ 
                        fileName: nomeArquivo,
                        nomesParticipantes: nomesAtivos 
                    });

                    const textoGerado = resultado.data?.texto;

                    if (textoGerado) {
                        addLog("✅ Legendas por locutor geradas com sucesso!");
                        if (onTranscricaoCompleta) {
                            const dataHoje = new Date().toLocaleDateString('pt-BR');
                            onTranscricaoCompleta(`Legendas da Sessão - ${dataHoje}`, textoGerado);
                        }
                    } else {
                        addLog("⚠️ A IA não conseguiu separar as vozes.");
                    }

                } catch (erro) {
                    addLog(`❌ ERRO: ${erro.message}`);
                }
            };

            mediaRecorderRef.current.start();
            setGravando(true);
            addLog("🎙️ Gravando... A Sexta-Feira está atenta aos locutores.");
        } catch (err) {
            addLog(`❌ Erro microfone: ${err.message}`);
        }
    };

    const pararGravacao = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setGravando(false);
            addLog("⏹️ Parando escuta e gerando transcrição...");
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    return (
        <div className="def-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <h3 style={{ color: '#00ffcc', margin: 0 }}>🎙️ Legendas Dinâmicas (Speaker ID)</h3>
                <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>
                    A IA tentará diferenciar quem fala com base nos jogadores sentados à mesa.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', padding: '20px 0' }}>
                {!gravando ? (
                    <button className="btn-neon btn-green" onClick={iniciarGravacao} style={{ padding: '15px 30px', fontWeight: 'bold' }}>▶ INICIAR ESCUTA</button>
                ) : (
                    <button className="btn-neon btn-red" onClick={pararGravacao} style={{ padding: '15px 30px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>⏹ PARAR E LEGENDAR</button>
                )}
            </div>

            <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '5px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#00ffcc', fontSize: '0.8em', borderBottom: '1px solid #222', paddingBottom: '5px', marginBottom: '10px', fontFamily: 'monospace' }}>&gt; VOICE_ID_SYSTEM_LOGS</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'monospace', fontSize: '0.85em', color: '#00ff00' }}>
                    {logs.map((log, i) => <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.7 }}>{log}</div>)}
                    <div ref={logsEndRef} />
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(255, 0, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0); } }`}} />
        </div>
    );
}