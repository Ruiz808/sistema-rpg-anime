import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '../../services/firebase-config';

export default function GravadorPanel({ onTranscricaoCompleta }) {
    const [gravando, setGravando] = useState(false);
    const [logs, setLogs] = useState(['Módulo de Gravação e Escuta inicializado. Aguardando comando...']);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const logsEndRef = useRef(null);

    // Função para adicionar mensagens na telinha de log
    const addLog = (msg) => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${hora}] ${msg}`]);
    };

    // Rola os logs automaticamente para o final
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
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // A MÁGICA ACONTECE AQUI: Quando a gravação para, faz o upload!
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = []; // Limpa a memória para a próxima gravação
                
                addLog("Áudio processado. Iniciando upload secreto para os servidores...");
                
                try {
                    // Cria um nome único com a data atual
                    const nomeArquivo = `sessao_${Date.now()}.webm`;
                    // Aponta para a pasta "audios_mesa" no Firebase Storage
                    const audioRef = ref(storage, `audios_mesa/${nomeArquivo}`);
                    
                    await uploadBytes(audioRef, audioBlob);
                    addLog(`✅ Upload concluído com sucesso: ${nomeArquivo}`);

                    if (!functions) {
                        addLog("❌ Firebase Functions indisponível. Transcrição cancelada.");
                        return;
                    }

                    addLog("🧠 Enviando para a Sexta-Feira transcrever...");
                    const transcrever = httpsCallable(functions, 'transcreverAudioSextaFeira');
                    const resultado = await transcrever({ fileName: nomeArquivo });
                    const textoGerado = resultado.data?.texto;

                    if (textoGerado) {
                        addLog("✅ Registro Akáshico gerado com sucesso!");
                        if (onTranscricaoCompleta) {
                            const dataHoje = new Date().toLocaleDateString('pt-BR');
                            onTranscricaoCompleta(`Sessão ${dataHoje}`, textoGerado);
                        }
                    } else {
                        addLog("⚠️ A Sexta-Feira não conseguiu gerar um resumo.");
                    }

                } catch (erro) {
                    addLog(`❌ ERRO: ${erro.message}`);
                    console.error("Erro no Gravador:", erro);
                }
            };

            mediaRecorderRef.current.start();
            setGravando(true);
            addLog("🎙️ Gravação de áudio iniciada. Captando vozes dos jogadores...");
        } catch (err) {
            addLog(`❌ Erro ao acessar microfone: ${err.message}`);
            console.error(err);
        }
    };

    const pararGravacao = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setGravando(false);
            addLog("⏹️ Gravação interrompida. Finalizando arquivo de áudio...");
            
            // Desliga a luzinha vermelha do microfone no navegador
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    return (
        <div className="def-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <h3 style={{ color: '#ff003c', margin: 0, textShadow: '0 0 5px rgba(255,0,60,0.5)' }}>
                    🎙️ Terminal de Escuta da Sexta-Feira
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>
                    O áudio captado aqui será enviado diretamente para a nuvem para ser transcrito e resumido pela IA.
                </p>
            </div>

            {/* BOTÕES DE CONTROLE */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', padding: '20px 0' }}>
                {!gravando ? (
                    <button 
                        className="btn-neon btn-green" 
                        onClick={iniciarGravacao}
                        style={{ padding: '15px 30px', fontSize: '1.1em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <span style={{ fontSize: '1.5em' }}>▶</span> INICIAR ESCUTA
                    </button>
                ) : (
                    <button 
                        className="btn-neon btn-red" 
                        onClick={pararGravacao}
                        style={{ padding: '15px 30px', fontSize: '1.1em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', animation: 'pulse 1.5s infinite' }}
                    >
                        <span style={{ fontSize: '1.5em' }}>⏹</span> PARAR E ENVIAR
                    </button>
                )}
            </div>

            {/* TERMINAL DE LOGS */}
            <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '5px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#00ffcc', fontSize: '0.8em', borderBottom: '1px solid #222', paddingBottom: '5px', marginBottom: '10px', fontFamily: 'monospace' }}>
                    &gt; SEXTA_FEIRA_SYSTEM_LOGS
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'monospace', fontSize: '0.85em', color: '#00ff00' }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.7 }}>
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* CSS inline para a animação de pulsar o botão de gravação */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(255, 0, 60, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 0, 60, 0); }
                }
            `}} />
        </div>
    );
}