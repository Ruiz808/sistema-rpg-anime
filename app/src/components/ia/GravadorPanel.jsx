import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore'; 
import { useAIForm } from './AIFormContext'; // 🔥 Puxamos o cérebro da Lore

export default function GravadorPanel() {
    const [gravando, setGravando] = useState(false);
    const [logs, setLogs] = useState(['Módulo de Escuta Contínua (Auto-Fatiador) inicializado...']);
    
    // Referências para o motor contínuo
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const logsEndRef = useRef(null);
    const pedacoContadorRef = useRef(1);

    const cenario = useStore(s => s.cenario);
    const nomesAtivos = Array.isArray(cenario?.tavernaAtivos) ? cenario.tavernaAtivos : [];

    // 🔥 AS MAGIAS DA LORE 🔥
    const ctx = useAIForm();
    const { capitulosPresente, capitulosFuturo, salvarNoRegistro, loreFoco } = ctx || {};
    const [destinoLore, setDestinoLore] = useState('novo');

    const addLog = (msg) => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${hora}] ${msg}`]);
    };

    useEffect(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const iniciarMediaRecorder = () => {
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
        let localChunks = [];
        const numeroPedaco = pedacoContadorRef.current;
        pedacoContadorRef.current++; 

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) localChunks.push(event.data);
        };

        recorder.onstop = async () => {
            if (localChunks.length === 0) return;
            const audioBlob = new Blob(localChunks, { type: 'audio/webm' });
            localChunks = []; 
            
            addLog(`⏳ Processando Parte ${numeroPedaco}... Iniciando upload silencioso.`);
            
            try {
                const nomeArquivo = `sessao_${Date.now()}_pt${numeroPedaco}.webm`;
                const audioRef = ref(storage, `audios_mesa/${nomeArquivo}`);
                
                await uploadBytes(audioRef, audioBlob);
                addLog(`✅ Parte ${numeroPedaco} enviada. Sexta-Feira iniciou a transcrição...`);

                if (!functions) return addLog("❌ Erro: Firebase Functions offline.");

                const transcrever = httpsCallable(functions, 'transcreverAudioSextaFeira');
                
                const resultado = await transcrever({ 
                    fileName: nomeArquivo,
                    nomesParticipantes: nomesAtivos 
                });

                const textoGerado = resultado.data?.texto;

                if (textoGerado) {
                    addLog(`📜 Legendas da Parte ${numeroPedaco} geradas com sucesso! Salvando no Arco selecionado...`);
                    if (salvarNoRegistro) {
                        const dataHoje = new Date().toLocaleDateString('pt-BR');
                        // Injeta o resumo da gravação diretamente no arco!
                        salvarNoRegistro(textoGerado, `Sessão ${dataHoje} - Parte ${numeroPedaco}`, destinoLore, loreFoco);
                    }
                } else {
                    addLog(`⚠️ Parte ${numeroPedaco}: A IA não conseguiu extrair palavras.`);
                }

            } catch (erro) {
                addLog(`❌ ERRO na Parte ${numeroPedaco}: ${erro.message}`);
            }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
    };

    const iniciarGravacao = async () => {
        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            pedacoContadorRef.current = 1;
            iniciarMediaRecorder();
            setGravando(true);
            addLog("🎙️ Gravação contínua iniciada! O sistema fará cortes automáticos a cada 20 minutos.");

            // 20 minutos de corte
            const TEMPO_CORTE = 20 * 60 * 1000;
            
            timerRef.current = setInterval(() => {
                addLog("✂️ 20 minutos atingidos. Fechando o bloco atual e abrindo o próximo sem perder áudio...");
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.stop(); 
                }
                iniciarMediaRecorder(); 
            }, TEMPO_CORTE);

        } catch (err) {
            addLog(`❌ Erro de microfone: ${err.message}`);
        }
    };

    const pararGravacao = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop(); 
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setGravando(false);
        addLog("⏹️ Gravação total encerrada pelo Mestre.");
    };

    const arcosDisponiveis = loreFoco === 'presente' ? (capitulosPresente || []) : (capitulosFuturo || []);

    return (
        <div className="def-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <h3 style={{ color: '#00ffcc', margin: 0 }}>🎙️ Escuta Contínua (Sessão Longa)</h3>
                <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>
                    O áudio será fatiado a cada 20 minutos e injetado diretamente no Arco que você escolher abaixo.
                </p>
            </div>

            {/* 🔥 NOVO: SELETOR DE ARCOS DO GRAVADOR 🔥 */}
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#00ffcc' }}>Destino das Gravações:</strong>
                <select className="input-neon" value={destinoLore} onChange={e => setDestinoLore(e.target.value)} style={{ flex: 1, minWidth: '200px', borderColor: '#00ffcc', color: '#fff' }}>
                    <option value="novo">➕ Criar Novo Arco a cada gravação</option>
                    <optgroup label="Injetar Gravações no Arco Existente:">
                        {arcosDisponiveis.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                    </optgroup>
                </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', padding: '10px 0' }}>
                {!gravando ? (
                    <button className="btn-neon btn-green" onClick={iniciarGravacao} style={{ padding: '15px 30px', fontWeight: 'bold' }}>▶ INICIAR SESSÃO</button>
                ) : (
                    <button className="btn-neon btn-red" onClick={pararGravacao} style={{ padding: '15px 30px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>⏹ ENCERRAR SESSÃO</button>
                )}
            </div>

            <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '5px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#00ffcc', fontSize: '0.8em', borderBottom: '1px solid #222', paddingBottom: '5px', marginBottom: '10px', fontFamily: 'monospace' }}>&gt; AUTO_SLICER_LOGS</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'monospace', fontSize: '0.85em', color: '#00ff00' }}>
                    {logs.map((log, i) => <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.7 }}>{log}</div>)}
                    <div ref={logsEndRef} />
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(255, 0, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0); } }`}} />
        </div>
    );
}