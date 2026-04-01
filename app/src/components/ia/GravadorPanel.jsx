import React, { useState, useRef, useEffect } from 'react';

export default function GravadorPanel() {
    const [gravando, setGravando] = useState(false);
    const [tempo, setTempo] = useState(0);
    const [logs, setLogs] = useState([]);

    // Referências para guardar os gravadores sem perder os dados quando a tela atualizar
    const recVideoRef = useRef(null);
    const recAudioRef = useRef(null);
    const timerRef = useRef(null);
    const fatiadorRef = useRef(null);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // O TEMPO DA FATIA (Coloquei 1 minuto para vocês testarem rápido, depois mudem para 30)
    const MINUTOS_POR_FATIA = 1; 
    const TEMPO_MS = MINUTOS_POR_FATIA * 60 * 1000;

    useEffect(() => {
        if (gravando) {
            timerRef.current = setInterval(() => setTempo(t => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
            setTempo(0);
        }
        return () => clearInterval(timerRef.current);
    }, [gravando]);

    const formatarTempo = (segundos) => {
        const m = Math.floor(segundos / 60).toString().padStart(2, '0');
        const s = (segundos % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const iniciarGravacao = async () => {
        try {
            addLog("Solicitando permissão para capturar tela e microfone...");
            
            // 1. Pega a tela (com o áudio do sistema/Discord)
            const telaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            // 2. Pega o microfone do Mestre
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            addLog("Permissões concedidas. Iniciando matriz de gravação dupla...");

            // Mistura os áudios (Discord + Microfone)
            const audioContext = new AudioContext();
            const dest = audioContext.createMediaStreamDestination();
            
            if (telaStream.getAudioTracks().length > 0) {
                audioContext.createMediaStreamSource(new MediaStream([telaStream.getAudioTracks()[0]])).connect(dest);
            }
            audioContext.createMediaStreamSource(new MediaStream([micStream.getAudioTracks()[0]])).connect(dest);

            const mixedAudioStream = dest.stream;

            // Stream 1: Vídeo Completo (Para o PC)
            const finalVideoStream = new MediaStream([telaStream.getVideoTracks()[0], ...mixedAudioStream.getAudioTracks()]);
            // Stream 2: Apenas Áudio (Para a IA / Firebase)
            const finalAudioStream = new MediaStream([...mixedAudioStream.getAudioTracks()]);

            iniciarFatia(finalVideoStream, finalAudioStream);
            setGravando(true);

            // Inicia o "Fatiador" que vai cortar a gravação a cada X minutos
            fatiadorRef.current = setInterval(() => {
                addLog(`Fatia de ${MINUTOS_POR_FATIA} min concluída. Reiniciando ciclo...`);
                pararGravadores(); 
                setTimeout(() => iniciarFatia(finalVideoStream, finalAudioStream), 500);
            }, TEMPO_MS);

            // Se o usuário cancelar o compartilhamento de tela, para tudo
            telaStream.getVideoTracks()[0].onended = () => pararTudo();

        } catch (err) {
            addLog(`ERRO: ${err.message}`);
            console.error(err);
        }
    };

    const iniciarFatia = (videoStream, audioStream) => {
        // --- GRAVADOR DE VÍDEO (HD LOCAL) ---
        recVideoRef.current = new MediaRecorder(videoStream, { mimeType: 'video/webm' });
        let videoChunks = [];
        recVideoRef.current.ondataavailable = e => { if (e.data.size > 0) videoChunks.push(e.data); };
        recVideoRef.current.onstop = () => {
            const blob = new Blob(videoChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Mesa_RPG_Video_${new Date().getTime()}.webm`;
            a.click();
            addLog("Vídeo baixado para o computador com sucesso.");
        };
        recVideoRef.current.start();

        // --- GRAVADOR DE ÁUDIO (FIREBASE/IA) ---
        recAudioRef.current = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
        let audioChunks = [];
        recAudioRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        recAudioRef.current.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            addLog("Áudio isolado extraído. (Em breve: enviando para a Sexta-Feira...)");
            
            // TODO: Aqui entrará o código do Passo 3 para enviar o 'blob' para o Firebase!
        };
        recAudioRef.current.start();
    };

    const pararGravadores = () => {
        if (recVideoRef.current && recVideoRef.current.state !== 'inactive') recVideoRef.current.stop();
        if (recAudioRef.current && recAudioRef.current.state !== 'inactive') recAudioRef.current.stop();
    };

    const pararTudo = () => {
        pararGravadores();
        clearInterval(fatiadorRef.current);
        setGravando(false);
        addLog("Gravação total encerrada.");
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', borderBottom: '2px solid #00ffcc', paddingBottom: 10, margin: 0 }}>
                🎙️ Escuta da Sexta-Feira
            </h2>

            <div className="def-box" style={{ borderLeft: `4px solid ${gravando ? '#ff003c' : '#00ffcc'}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', color: gravando ? '#ff003c' : '#fff' }}>
                        {gravando ? '🔴 Gravando Sessão (Tela + Áudio)' : 'Status: Aguardando'}
                    </h3>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '0.9em' }}>
                        A IA irá fatiar a gravação a cada {MINUTOS_POR_FATIA} minuto(s), salvar o vídeo no seu PC e enviar o áudio para resumo.
                    </p>
                </div>
                
                <div style={{ fontSize: '2em', fontFamily: 'monospace', color: gravando ? '#ff003c' : '#555', fontWeight: 'bold' }}>
                    {formatarTempo(tempo)}
                </div>

                {!gravando ? (
                    <button className="btn-neon btn-green" onClick={iniciarGravacao} style={{ padding: '15px 30px', fontSize: '1.2em' }}>
                        ▶ INICIAR GRAVAÇÃO
                    </button>
                ) : (
                    <button className="btn-neon btn-red" onClick={pararTudo} style={{ padding: '15px 30px', fontSize: '1.2em' }}>
                        ⏹ PARAR TUDO
                    </button>
                )}
            </div>

            <div className="def-box" style={{ background: 'rgba(0,0,0,0.8)', minHeight: '150px', maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                <h4 style={{ color: '#555', marginTop: 0 }}>Logs do Sistema</h4>
                {logs.map((log, i) => (
                    <div key={i} style={{ color: '#00ffcc', fontSize: '0.85em', marginBottom: '4px', fontFamily: 'monospace' }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}