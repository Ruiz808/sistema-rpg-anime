import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '../../services/firebase-config';

export function MapaOlhoSextaFeira({ meuNome, personagens, minhaFicha, tavernaAtivos, meuStream, conexoes }) {
    const [gravando, setGravando] = useState(false);
    const [expandido, setExpandido] = useState(false);
    const [logs, setLogs] = useState(['Sexta-Feira: Olho de Escuta pronto.']);

    const [mascaraMestre, setMascaraMestre] = useState('narrador'); 
    const [nomeNpc, setNomeNpc] = useState('');

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const mixerCtxRef = useRef(null);
    const pedacoContadorRef = useRef(1);

    const perfisJogadores = (Array.isArray(tavernaAtivos) ? tavernaAtivos : []).map(nome => {
        const ficha = nome === meuNome ? minhaFicha : personagens?.[nome];
        return `${nome} (Classe: ${ficha?.bio?.classe || 'Mundano'}, Raça: ${ficha?.bio?.raca || 'Desconhecida'})`;
    });

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
            if (mixerCtxRef.current) mixerCtxRef.current.close();
        };
    }, []);

    const addLog = (msg) => { const hora = new Date().toLocaleTimeString(); setLogs(prev => [...prev.slice(-4), `[${hora}] ${msg}`]); };

    const iniciarGravacao = () => {
        if (!meuStream) return addLog("❌ Erro: Microfone offline.");
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            mixerCtxRef.current = audioCtx;
            const destination = audioCtx.createMediaStreamDestination();
            
            audioCtx.createMediaStreamSource(meuStream).connect(destination);
            let vozesExtras = 0;
            conexoes.forEach(c => { if (c.stream) { audioCtx.createMediaStreamSource(c.stream).connect(destination); vozesExtras++; } });
            
            const recorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
            let chunks = [];
            pedacoContadorRef.current = 1;

            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            
            recorder.onstop = async () => {
                if (chunks.length === 0) return;
                const audioBlob = new Blob(chunks, { type: 'audio/webm' }); chunks = [];
                const num = pedacoContadorRef.current; pedacoContadorRef.current++;
                try {
                    const nomeArquivo = `sessao_mapa_${Date.now()}_pt${num}.webm`;
                    await uploadBytes(ref(storage, `audios_mesa/${nomeArquivo}`), audioBlob);
                    
                    const instrucaoMestre = (mascaraMestre === 'npc' && nomeNpc.trim())
                        ? `[ATENÇÃO IA: O usuário (${meuNome}) está interpretando o NPC/Personagem "${nomeNpc.trim()}" nesta gravação. Atribua as falas e emoções a ele.]` 
                        : `[ATENÇÃO IA: O usuário (${meuNome}) está atuando como o Narrador do mundo. Contudo, se ele usar vozes ou mencionar nomes diferentes em diálogos, formate inteligentemente no padrão "[NPC - Nome]: Fala".]`;

                    const transcrever = httpsCallable(functions, 'transcreverAudioSextaFeira');
                    await transcrever({ 
                        fileName: nomeArquivo, 
                        nomesParticipantes: perfisJogadores, 
                        gravadorPrincipal: meuNome,
                        instrucaoMestre: instrucaoMestre 
                    });
                    addLog(`✅ P${num} gravada e salva!`);
                } catch(e) { addLog(`❌ Erro P${num}`); }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setGravando(true); setExpandido(false);
            addLog(`🎙️ A gravar Mic + ${vozesExtras} amigos!`);

            timerRef.current = setInterval(() => {
                if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
                recorder.start();
            }, 20 * 60 * 1000);
        } catch(e) { addLog("❌ Erro ao iniciar."); }
    };

    const pararGravacao = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
        if (mixerCtxRef.current) mixerCtxRef.current.close();
        setGravando(false); addLog("⏹️ Gravação parada.");
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            {expandido && (
                <div className="fade-in" style={{ background: 'rgba(10,10,15,0.95)', border: `2px solid ${gravando ? '#ff003c' : '#0088ff'}`, borderRadius: '10px', padding: '15px', width: '300px', boxShadow: `0 0 20px ${gravando ? 'rgba(255,0,60,0.4)' : 'rgba(0,136,255,0.4)'}` }}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: gravando ? '#ff003c' : '#0088ff', fontWeight: 'bold' }}>{gravando ? '🔴 Gravando...' : '📡 Sexta-Feira'}</span>
                        <button onClick={() => setExpandido(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>

                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px dashed #ffcc00' }}>
                        <span style={{ color: '#ffcc00', fontSize: '0.8em', fontWeight: 'bold', display: 'block', marginBottom: '5px', textAlign: 'center' }}>🎭 MÁSCARA DE GRAVAÇÃO</span>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: mascaraMestre === 'npc' ? '8px' : '0' }}>
                            <button className={`btn-neon ${mascaraMestre === 'narrador' ? 'btn-gold' : ''}`} onClick={() => setMascaraMestre('narrador')} style={{ flex: 1, padding: '5px', fontSize: '0.75em', margin: 0, borderColor: '#ffcc00', color: mascaraMestre === 'narrador' ? '#fff' : '#ffcc00' }}>📖 Narrador</button>
                            <button className={`btn-neon ${mascaraMestre === 'npc' ? 'btn-blue' : ''}`} onClick={() => setMascaraMestre('npc')} style={{ flex: 1, padding: '5px', fontSize: '0.75em', margin: 0, borderColor: '#00aaff', color: mascaraMestre === 'npc' ? '#fff' : '#00aaff' }}>👺 NPC</button>
                        </div>
                        {mascaraMestre === 'npc' && (
                            <input className="input-neon fade-in" type="text" placeholder="Qual o nome do NPC agora?" value={nomeNpc} onChange={e => setNomeNpc(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '0.85em', borderColor: '#00aaff', color: '#00aaff', margin: 0, boxSizing: 'border-box' }} />
                        )}
                    </div>

                    {!gravando ? <button className="btn-neon btn-green" onClick={iniciarGravacao} style={{ marginTop: 10, width: '100%' }}>▶ INICIAR ESCUTA</button> : <button className="btn-neon btn-red" onClick={pararGravacao} style={{ marginTop: 10, width: '100%', animation: 'pulse 1.5s infinite' }}>⏹ ENCERRAR</button>}
                    
                    <div style={{ background: '#000', marginTop: 10, borderRadius: '5px', padding: '8px', fontSize: '0.7em', color: '#0f0', fontFamily: 'monospace', height: '80px', overflowY: 'auto', border: '1px solid #222' }}>
                        {logs.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </div>
            )}
            <div onClick={() => setExpandido(!expandido)} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(10,10,15,0.9)', border: '2px solid #0088ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', boxShadow: gravando ? '0 0 15px #ff003c' : 'none' }}>{gravando ? '🎙️' : '👁️'}</div>
        </div>
    );
}