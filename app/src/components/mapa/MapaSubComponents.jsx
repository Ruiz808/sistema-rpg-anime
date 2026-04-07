import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { useMapaForm, urlSeguraParaCss, calcularCA, MAP_SIZE } from './MapaFormContext';
import Tabuleiro3D from './Tabuleiro3D';
import DummieToken from '../combat/DummieToken';
import { salvarDummie, salvarCenarioCompleto } from '../../services/firebase-sync'; 
import { getClassIconById } from '../../core/classIcons';

import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '../../services/firebase-config';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Mapa provider não encontrado</div>;

// ============================================================================
// 🔥 O OLHO DE SAURON COM MESA DE MISTURA DIGITAL 🔥
// ============================================================================
export function MapaOlhoSextaFeira() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    const { meuNome, personagens, minhaFicha, cenario, meuStream, conexoes } = ctx;

    const [gravando, setGravando] = useState(false);
    const [expandido, setExpandido] = useState(false);
    const [logs, setLogs] = useState(['Sexta-Feira: Olho de Escuta pronto.']);
    const [destinoLore, setDestinoLore] = useState('novo_capitulo');
    const [arcosCache, setArcosCache] = useState([]);

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    
    const audioContextRef = useRef(null);
    const mixerCtxRef = useRef(null);
    const mixedStreamRef = useRef(null);
    
    const animationFrameRef = useRef(null);
    const olhoRef = useRef(null);
    const pedacoContadorRef = useRef(1);

    const nomesAtivos = Array.isArray(cenario?.tavernaAtivos) ? cenario.tavernaAtivos : [];
    const perfisJogadores = nomesAtivos.map(nome => {
        const ficha = nome === meuNome ? minhaFicha : personagens?.[nome];
        const classe = ficha?.bio?.classe || 'Mundano';
        const raca = ficha?.bio?.raca || 'Desconhecida';
        return `${nome} (Classe: ${classe}, Raça: ${raca})`;
    });

    useEffect(() => {
        if (expandido) {
            try {
                const salvos = localStorage.getItem('rpgSextaFeira_capitulos');
                if (salvos) setArcosCache(JSON.parse(salvos));
            } catch(e) {}
        }
    }, [expandido]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
            if (audioContextRef.current) audioContextRef.current.close();
            if (mixerCtxRef.current) mixerCtxRef.current.close();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const addLog = (msg) => {
        const hora = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-4), `[${hora}] ${msg}`]);
    };

    const salvarLoreMap = (textoGerado, tituloBloco) => {
        try {
            let caps = JSON.parse(localStorage.getItem('rpgSextaFeira_capitulos')) || [];
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            const separador = `\n\n================================\n[${tituloBloco} - ${timestamp}]\n================================\n\n`;

            if (destinoLore === 'novo_capitulo') {
                const newCapId = Date.now();
                const newArcId = Date.now() + 1;
                const nomeCap = "Capítulo (Mapa) - " + new Date().toLocaleDateString('pt-BR');
                caps.push({ id: newCapId, titulo: nomeCap, tierList: [], arcos: [{ id: newArcId, titulo: tituloBloco, texto: textoGerado }] });
                localStorage.setItem('rpgSextaFeira_capituloAtivo', newCapId);
                localStorage.setItem('rpgSextaFeira_arcoAtivoPresente', newArcId);
            } else if (destinoLore.startsWith('novo_arco_')) {
                const capId = Number(destinoLore.replace('novo_arco_', ''));
                const newArcId = Date.now();
                caps = caps.map(c => {
                    if (c.id === capId) return { ...c, arcos: [...(c.arcos || []), { id: newArcId, titulo: tituloBloco, texto: textoGerado }] };
                    return c;
                });
                localStorage.setItem('rpgSextaFeira_capituloAtivo', capId);
                localStorage.setItem('rpgSextaFeira_arcoAtivoPresente', newArcId);
            } else {
                const [capIdStr, arcIdStr] = destinoLore.split('_');
                const capId = Number(capIdStr); const arcId = Number(arcIdStr);
                caps = caps.map(c => {
                    if (c.id === capId) {
                        return { ...c, arcos: (c.arcos || []).map(a => {
                            if (a.id === arcId) {
                                const textoAntigo = a.texto || '';
                                const novoTexto = textoAntigo.trim() ? textoAntigo + separador + textoGerado : textoGerado;
                                return { ...a, texto: novoTexto };
                            }
                            return a;
                        })};
                    }
                    return c;
                });
            }
            
            localStorage.setItem('rpgSextaFeira_capitulos', JSON.stringify(caps));
            addLog(`✅ Salvo com sucesso! Abra os Registros para ler.`); 
            
        } catch(e) { addLog(`❌ Erro ao salvar no disco: ${e.message}`); }
    };

    const iniciarVisualizador = (stream) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const desenhar = () => {
            analyser.getByteFrequencyData(dataArray);
            let soma = 0;
            for (let i = 0; i < dataArray.length; i++) soma += dataArray[i];
            const media = Math.min(100, Math.max(0, (soma / dataArray.length) / 80 * 100));

            if (olhoRef.current) {
                const scale = 1 + (media / 300);
                let cor = '#00ffcc';
                if (media > 85) cor = '#ff003c';
                else if (media > 50) cor = '#ffcc00';

                olhoRef.current.style.transform = `scale(${scale})`;
                olhoRef.current.style.boxShadow = `0 0 ${15 + media}px ${cor}, inset 0 0 ${10 + media/2}px ${cor}`;
                olhoRef.current.style.borderColor = cor;
                olhoRef.current.style.color = cor;
            }
            animationFrameRef.current = requestAnimationFrame(desenhar);
        };
        desenhar();
    };

    const pararVisualizador = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (olhoRef.current) {
            olhoRef.current.style.transform = 'scale(1)';
            olhoRef.current.style.boxShadow = '0 0 10px #0088ff';
            olhoRef.current.style.borderColor = '#0088ff';
            olhoRef.current.style.color = '#0088ff';
        }
    };

    const iniciarMediaRecorder = (streamParaGravar) => {
        const recorder = new MediaRecorder(streamParaGravar, { mimeType: 'audio/webm' });
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
            
            addLog(`⏳ Processando P${numeroPedaco}... Iniciando upload.`);
            
            try {
                const nomeArquivo = `sessao_mapa_${Date.now()}_pt${numeroPedaco}.webm`;
                const audioRef = ref(storage, `audios_mesa/${nomeArquivo}`);
                
                await uploadBytes(audioRef, audioBlob);
                addLog(`✅ P${numeroPedaco} enviada. Transcrevendo...`);

                if (!functions) return addLog("❌ Erro: Functions offline.");

                const transcrever = httpsCallable(functions, 'transcreverAudioSextaFeira');
                const resultado = await transcrever({ 
                    fileName: nomeArquivo,
                    nomesParticipantes: perfisJogadores,
                    gravadorPrincipal: meuNome 
                });

                const textoGerado = resultado.data?.texto;

                if (textoGerado) {
                    addLog(`📜 P${numeroPedaco} gerada! Salvando na Lore...`);
                    salvarLoreMap(textoGerado, `Gravação do Mapa - Parte ${numeroPedaco}`);
                } else {
                    addLog(`⚠️ P${numeroPedaco}: Vazia.`);
                }

            } catch (erro) {
                addLog(`❌ ERRO P${numeroPedaco}: ${erro.message}`);
            }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
    };

    const iniciarGravacao = () => {
        try {
            if (!meuStream) return addLog("❌ Erro: O microfone (Rádio) não está inicializado. Tente dar F5.");
            
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            mixerCtxRef.current = audioCtx;
            const destination = audioCtx.createMediaStreamDestination();
            
            audioCtx.createMediaStreamSource(meuStream).connect(destination);
            
            let vozesExtras = 0;
            if (conexoes && conexoes.length > 0) {
                conexoes.forEach(c => {
                    if (c.stream) {
                        audioCtx.createMediaStreamSource(c.stream).connect(destination);
                        vozesExtras++;
                    }
                });
            }
            
            mixedStreamRef.current = destination.stream;
            
            iniciarVisualizador(mixedStreamRef.current); 
            pedacoContadorRef.current = 1;
            iniciarMediaRecorder(mixedStreamRef.current); 
            
            setGravando(true);
            setExpandido(false); 
            addLog(`🎙️ Escuta Ativa! Misturando microfone + ${vozesExtras} jogador(es).`);

            const TEMPO_CORTE = 20 * 60 * 1000; 
            timerRef.current = setInterval(() => {
                addLog("✂️ 20m. Fechando e abrindo novo bloco...");
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop(); 
                iniciarMediaRecorder(mixedStreamRef.current); 
            }, TEMPO_CORTE);

        } catch (err) { addLog(`❌ Erro mic: ${err.message}`); }
    };

    const pararGravacao = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop(); 
        
        if (mixerCtxRef.current) {
            mixerCtxRef.current.close();
            mixerCtxRef.current = null;
        }
        mixedStreamRef.current = null;

        pararVisualizador();
        setGravando(false);
        addLog("⏹️ Gravação encerrada.");
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            {expandido && (
                <div className="fade-in" style={{ background: 'rgba(10,10,15,0.95)', border: `2px solid ${gravando ? '#ff003c' : '#0088ff'}`, borderRadius: '10px', padding: '15px', width: '300px', boxShadow: `0 0 20px ${gravando ? 'rgba(255,0,60,0.4)' : 'rgba(0,136,255,0.4)'}`, display: 'flex', flexDirection: 'column', gap: '10px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: gravando ? '#ff003c' : '#0088ff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9em' }}>
                            {gravando ? '🔴 Gravando...' : '📡 Sexta-Feira'}
                        </span>
                        <button onClick={() => setExpandido(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>
                    
                    <div>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Destino na Lore:</span>
                        <select className="input-neon" value={destinoLore} onChange={e => setDestinoLore(e.target.value)} style={{ width: '100%', padding: '5px', marginTop: '3px', fontSize: '0.85em' }}>
                            <option value="novo_capitulo">➕ Criar Novo Capítulo Inteiro</option>
                            {arcosCache.map(cap => (
                                <optgroup key={cap.id} label={`📖 ${cap.titulo}`}>
                                    <option value={`novo_arco_${cap.id}`}>➕ Novo Arco aqui</option>
                                    {cap.arcos.map(a => <option key={a.id} value={`${cap.id}_${a.id}`}>📂 {a.titulo}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {!gravando ? (
                        <button className="btn-neon btn-green" onClick={iniciarGravacao} style={{ padding: '8px', fontSize: '0.9em' }}>▶ INICIAR ESCUTA</button>
                    ) : (
                        <button className="btn-neon btn-red" onClick={pararGravacao} style={{ padding: '8px', fontSize: '0.9em', animation: 'pulse 1.5s infinite' }}>⏹ ENCERRAR</button>
                    )}

                    <div style={{ background: '#000', borderRadius: '5px', padding: '8px', fontSize: '0.7em', color: '#0f0', fontFamily: 'monospace', height: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid #222' }}>
                        {logs.map((l, i) => <span key={i} style={{ opacity: i === logs.length -1 ? 1 : 0.6 }}>{l}</span>)}
                    </div>
                </div>
            )}

            <div 
                ref={olhoRef}
                onClick={() => setExpandido(!expandido)}
                title={gravando ? "Sexta-Feira na escuta! Clique para gerir." : "Ativar Sexta-Feira no Mapa"}
                style={{
                    width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(10,10,15,0.9)', 
                    border: '2px solid #0088ff', boxShadow: '0 0 10px #0088ff', color: '#0088ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    cursor: 'pointer', transition: gravando ? 'none' : 'all 0.3s', backdropFilter: 'blur(3px)'
                }}
            >
                {gravando ? '🎙️' : '👁️'}
            </div>
        </div>
    );
}

// ============================================================================
// 🔥 A SESSÃO RP QUE SE TRANSFORMOU NUM DISCORD! 🔥
// ============================================================================
export function MapaSessaoRP() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { 
        meuNome, playersNaTaverna, isPresenteNaTaverna, togglePresencaTaverna, getAvatarInfo, fmt,
        conexoes, mutado, surdo, voiceStatus, toggleMute, toggleDeafen, fazerChamada 
    } = ctx;

    const playerCount = playersNaTaverna.length;
    let cardSize = '280px'; 
    if (playerCount === 1) cardSize = '400px';
    else if (playerCount === 2) cardSize = '350px';
    else if (playerCount === 3 || playerCount === 4) cardSize = '280px';
    else cardSize = '220px';

    return (
        <div className="fade-in" style={{ minHeight: '60vh', background: 'radial-gradient(circle, rgba(30,10,20,0.9) 0%, rgba(0,0,0,1) 100%)', borderRadius: 5, border: '2px solid #ffcc00', boxShadow: '0 0 30px rgba(255, 204, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 50px 20px', marginBottom: 15 }}>
            
            {/* CABEÇALHO */}
            <div style={{ fontSize: '3em', marginBottom: 10, filter: 'drop-shadow(0 0 10px #ffcc00)' }}>🎲</div>
            <h1 style={{ color: '#ffcc00', textShadow: '0 0 15px #ffcc00', margin: 0, letterSpacing: 3 }}>SESSÃO RP</h1>
            <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: 10, fontSize: '1.1em' }}>{playersNaTaverna.length} Lenda(s) Presente(s). O Mestre está a moldar o tecido da realidade...</p>
            <div style={{ color: '#00ffcc', fontSize: '0.85em', marginBottom: '20px', fontFamily: 'monospace' }}>📡 Status da Rede: {voiceStatus}</div>
            
            {/* BOTÕES ESTILO DISCORD (PARTY CALL) */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', background: 'rgba(0,0,0,0.6)', padding: '10px 25px', borderRadius: '30px', border: '1px solid #333' }}>
                <button onClick={toggleMute} title={mutado ? "Desmutar" : "Mutar"} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: mutado ? '#ff003c' : '#00ffcc', color: mutado ? '#fff' : '#000', fontSize: '1.2em', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${mutado ? '#ff003c' : '#00ffcc'}` }}>
                    {mutado ? '🔇' : '🎙️'}
                </button>
                <button onClick={toggleDeafen} title={surdo ? "Ouvir" : "Ensurdecer"} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: surdo ? '#ff003c' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.2em', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {surdo ? '🔕' : '🎧'}
                </button>
                <button className={`btn-neon ${isPresenteNaTaverna ? 'btn-red' : 'btn-green'}`} onClick={togglePresencaTaverna} style={{ borderRadius: '25px', margin: 0, padding: '0 20px', fontSize: '0.9em', fontWeight: 'bold' }}>
                    {isPresenteNaTaverna ? 'SAIR DA TAVERNA' : 'SENTAR NA MESA'}
                </button>
            </div>

            {/* AS CARTAS / AVATARES DE VOZ */}
            {playersNaTaverna.length > 0 && (
                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px' }}>
                    {playersNaTaverna.map(([n, f]) => {
                        const info = getAvatarInfo(f);
                        const isMe = n === meuNome;
                        const expectedIdTelefone = `anime-rpg-${n.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                        const conRemota = conexoes.find(c => c.id === expectedIdTelefone);
                        const isConnected = isMe || !!conRemota;

                        let boxShadowCard = '0 0 15px rgba(0,0,0,0.8)';
                        let borderCard = '2px solid #333';
                        let iconMic = '⏳';
                        
                        if (isConnected) {
                            if (isMe && mutado) { borderCard = '2px solid #ff003c'; boxShadowCard = '0 0 20px rgba(255,0,60,0.4)'; iconMic = '🔇'; }
                            else { borderCard = '2px solid #00ffcc'; boxShadowCard = '0 0 25px rgba(0,255,204,0.3)'; iconMic = '🎙️'; }
                        }

                        return (
                            <div key={n} className="fade-in" style={{ position: 'relative', width: cardSize, aspectRatio: '4/3', background: '#111', border: borderCard, borderRadius: 6, overflow: 'hidden', backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center', boxShadow: boxShadowCard, transition: 'all 0.3s' }}>
                                
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '5px 8px', fontSize: '1.2em', border: borderCard }}>
                                    {iconMic}
                                </div>

                                {/* 🔥 CORREÇÃO: ÁUDIO FORÇADO PARA IGNORAR BLOQUEIOS DO NAVEGADOR 🔥 */}
                                {conRemota && (
                                    <audio 
                                        autoPlay 
                                        playsInline
                                        muted={surdo} 
                                        ref={el => { 
                                            if (el && el.srcObject !== conRemota.stream) {
                                                el.srcObject = conRemota.stream;
                                                el.play().catch(e => console.warn("Aguardando interação para tocar o áudio...", e));
                                            } 
                                        }} 
                                    />
                                )}

                                {!isConnected && !isMe && (
                                    <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                        <button className="btn-neon btn-blue" onClick={() => fazerChamada(n)} style={{ padding: '10px 25px', fontSize: '1.1em', fontWeight: 'bold', boxShadow: '0 0 15px #0088ff' }}>
                                            📞 LIGAR
                                        </button>
                                    </div>
                                )}

                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,15,0.9)', borderTop: '2px solid #222', padding: '6px 10px', backdropFilter: 'blur(3px)' }}>
                                    <span style={{ color: isConnected ? '#00ffcc' : '#fff', fontWeight: 'bold', fontSize: '0.8em', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1, textShadow: '1px 1px 2px #000', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                        <span style={{ color: '#ff003c', fontSize: '0.6em', fontWeight: 'bold', width: '15px' }}>HP</span>
                                        <div style={{ flex: 1, background: '#300', height: 6, border: '1px solid #000', position: 'relative' }}><div style={{ width: '100%', height: '100%', background: '#ff003c', boxShadow: '0 0 5px #ff003c' }}></div></div>
                                        <span style={{ color: '#fff', fontSize: '0.6em', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' }}>{fmt(f?.vida?.atual)}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 6px', fontSize: '0.55em', fontWeight: 'bold' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0088ff', textShadow: '0 0 3px #0088ff' }}><span>MP</span> <span>{fmt(f?.mana?.atual)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa00ff', textShadow: '0 0 3px #aa00ff' }}><span>AU</span> <span>{fmt(f?.aura?.atual)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffaa', textShadow: '0 0 3px #00ffaa' }}><span>CK</span> <span>{fmt(f?.chakra?.atual)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff8800', textShadow: '0 0 3px #ff8800' }}><span>CP</span> <span>{fmt(f?.corpo?.atual)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', textShadow: '0 0 3px #fff' }}><span>PV</span> <span>{fmt(f?.pontosVitais?.atual)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff3333', textShadow: '0 0 3px #ff3333' }}><span>PM</span> <span>{fmt(f?.pontosMortais?.atual)}</span></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function MapaControlesSuperiores() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { modo3D, setModo3D, alterarZoom, tamanhoCelula, isMestre, cenaVisualizadaId, cenaAtivaIdGlobal, cenaAtual, altitudeInput, setAltitudeInput, mutado, toggleMute } = ctx;
    
    return (
        <div style={{ display: 'flex', gap: 15, marginBottom: 10, alignItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85em', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: modo3D ? 0.3 : 1 }}>
                <button className="btn-neon" onClick={() => alterarZoom(-1)} style={{ padding: '2px 8px', margin: 0 }} disabled={modo3D}>-</button>
                <span style={{ color: '#aaa', minWidth: '80px', textAlign: 'center' }}>Zoom: {tamanhoCelula}px</span>
                <button className="btn-neon" onClick={() => alterarZoom(1)} style={{ padding: '2px 8px', margin: 0 }} disabled={modo3D}>+</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderLeft: '1px solid #444', paddingLeft: 15 }}>
                <span style={{ color: isMestre && cenaVisualizadaId && cenaVisualizadaId !== cenaAtivaIdGlobal ? '#0088ff' : '#ffcc00', fontWeight: 'bold' }}>
                    {isMestre && cenaVisualizadaId && cenaVisualizadaId !== cenaAtivaIdGlobal ? '👁️ Previsão:' : 'Cena:'}
                </span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{cenaAtual.nome} <span style={{color: '#888', fontWeight: 'normal'}}>(1Q = {cenaAtual.escala}{cenaAtual.unidade})</span></span>
            </div>
            
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', borderLeft: '1px solid #444', paddingLeft: 15 }}>
                <button onClick={toggleMute} title={mutado ? "Desmutar Mic" : "Mutar Mic"} style={{ background: mutado ? '#ff003c' : 'none', color: mutado ? '#fff' : '#00ffcc', border: `1px solid ${mutado ? '#ff003c' : '#00ffcc'}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
                    {mutado ? '🔇' : '🎙️'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: 5, alignItems: 'center', borderLeft: '1px solid #444', paddingLeft: 15, marginLeft: 'auto' }}>
                <span style={{ color: '#00ccff', fontWeight: 'bold' }}>Z:</span>
                <input className="input-neon" type="number" value={altitudeInput} onChange={e => setAltitudeInput(e.target.value)} style={{ width: 50, padding: 2, height: 24, borderColor: '#00ccff', color: '#fff', margin: 0 }} title="Altitude" />
                <span style={{ color: '#888' }}>m</span>
            </div>
            <button className={`btn-neon ${modo3D ? 'btn-gold' : ''}`} onClick={() => setModo3D(!modo3D)} style={{ padding: '2px 10px', margin: 0, borderColor: modo3D ? '#ffcc00' : '#00ffcc' }}>
                {modo3D ? '🌌 2D' : '🌌 3D'}
            </button>
        </div>
    );
}

export function MapaDadoAnimado() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { dadoAnim } = ctx;

    if (!dadoAnim.ativo) return null;

    return createPortal(
        <>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes d20-spin {
                    0% { transform: rotate(0deg) scale(1); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                    25% { transform: rotate(90deg) scale(1.1); filter: brightness(1.2) drop-shadow(0 0 20px #00ffcc); }
                    50% { transform: rotate(180deg) scale(0.9); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                    75% { transform: rotate(270deg) scale(1.1); filter: brightness(1.2) drop-shadow(0 0 20px #00ffcc); }
                    100% { transform: rotate(360deg) scale(1); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                }
                @keyframes d20-land {
                    0% { transform: scale(1.5); filter: brightness(2) drop-shadow(0 0 40px var(--land-color)); }
                    100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 15px var(--land-color)); }
                }
                .d20-spinning { animation: d20-spin 0.2s infinite linear; }
                .d20-landed { animation: d20-land 0.4s ease-out forwards; }
            `}} />
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(3px)', zIndex: 999999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <div className={dadoAnim.finalResult ? 'd20-landed' : 'd20-spinning'} style={{ '--land-color': dadoAnim.cor }}>
                    <svg viewBox="0 0 100 100" style={{ width: '250px', height: '250px' }}>
                        <polygon points="50,5 95,30 95,75 50,95 5,75 5,30" fill="rgba(10,10,15,0.95)" stroke={dadoAnim.cor} strokeWidth="4" strokeLinejoin="round" />
                        <polygon points="50,85 20,35 80,35" fill="none" stroke={dadoAnim.cor} strokeWidth="3" strokeLinejoin="round" opacity="0.8" />
                        <line x1="50" y1="5" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="50" y1="5" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="30" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="75" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="50" y1="95" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="75" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="30" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="bold" fontFamily="sans-serif">
                            {dadoAnim.numero}
                        </text>
                    </svg>
                </div>
                {dadoAnim.finalResult && (
                    <div style={{ marginTop: '30px', color: dadoAnim.cor, fontSize: '2em', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', textShadow: `0 0 20px ${dadoAnim.cor}` }}>
                        {dadoAnim.cor === '#ff003c' ? 'CRÍTICO FATAL!' : dadoAnim.cor === '#ffcc00' ? 'CRÍTICO!' : dadoAnim.cor === '#660000' ? 'FALHA CRÍTICA' : 'ROLADO!'}
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}

export function MapaFerramentasMestre() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    
    const { isMestre, isModoRP, mestreVendoRP } = ctx;
    const [abaMestre, setAbaMestre] = useState('');

    if (!isMestre) return null;

    return (
        <div style={{ marginBottom: 15, background: 'rgba(0,0,0,0.4)', borderRadius: 5, border: '1px solid #333', overflow: 'hidden' }}>
            <MapaMestreRPToggle />
            
            {(!isModoRP || mestreVendoRP) && (
                <div style={{ padding: '10px 15px' }}>
                    <MapaMestreCenaVisualizada />
                    
                    <div style={{ display: 'flex', gap: 5, marginBottom: abaMestre ? 15 : 0, overflowX: 'auto', paddingBottom: 5 }}>
                        <button className={`btn-neon ${abaMestre === 'cenas' ? 'btn-gold' : ''}`} onClick={() => setAbaMestre(a => a === 'cenas' ? '' : 'cenas')} style={{ padding: '4px 10px', fontSize: '0.85em', margin: 0, flex: 1, whiteSpace: 'nowrap' }}>🎬 Cenas</button>
                        <button className={`btn-neon ${abaMestre === 'tokens' ? 'btn-gold' : ''}`} onClick={() => setAbaMestre(a => a === 'tokens' ? '' : 'tokens')} style={{ padding: '4px 10px', fontSize: '0.85em', margin: 0, flex: 1, whiteSpace: 'nowrap' }}>📦 Gaveta</button>
                        <button className={`btn-neon ${abaMestre === 'dummies' ? 'btn-gold' : ''}`} onClick={() => setAbaMestre(a => a === 'dummies' ? '' : 'dummies')} style={{ padding: '4px 10px', fontSize: '0.85em', margin: 0, flex: 1, whiteSpace: 'nowrap' }}>🤖 Entidades</button>
                        <button className={`btn-neon ${abaMestre === 'zonas' ? 'btn-gold' : ''}`} onClick={() => setAbaMestre(a => a === 'zonas' ? '' : 'zonas')} style={{ padding: '4px 10px', fontSize: '0.85em', margin: 0, flex: 1, whiteSpace: 'nowrap' }}>🌪️ Zonas</button>
                    </div>

                    {abaMestre === 'cenas' && <MapaMestreGerenciadorCenas />}
                    {abaMestre === 'tokens' && <MapaMestreGavetaTokens />}
                    {abaMestre === 'dummies' && <MapaMestreGeradorDummies />}
                    {abaMestre === 'zonas' && <MapaMestreGerenciadorZonas />}
                </div>
            )}
        </div>
    );
}

export function MapaMestreRPToggle() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isMestre, isModoRP, mestreVendoRP, setMestreVendoRP, toggleModoRP } = ctx;
    
    if (!isMestre) return null;
    
    return (
        <div style={{ background: isModoRP ? 'rgba(255, 0, 255, 0.15)' : 'rgba(0, 255, 136, 0.15)', padding: '8px 15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: isModoRP ? '#ff00ff' : '#00ff88', fontWeight: 'bold', fontSize: '0.9em' }}>
                {isModoRP ? '🍻 MODO TAVERNA (Oculto dos Jogadores)' : '🌍 MODO COMBATE (Mapa Visível)'}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
                {isModoRP && (
                    <button className={`btn-neon ${mestreVendoRP ? 'btn-blue' : 'btn-gold'}`} onClick={() => setMestreVendoRP(!mestreVendoRP)} style={{ padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>
                        {mestreVendoRP ? '🗺️ OCULTAR' : '👁️ ESPIAR RP'}
                    </button>
                )}
                <button className={`btn-neon ${isModoRP ? 'btn-green' : 'btn-purple'}`} onClick={toggleModoRP} style={{ padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>
                    {isModoRP ? '🌍 REVELAR MAPA' : '🍻 MODO TAVERNA'}
                </button>
            </div>
        </div>
    );
}

export function MapaMestreCenaVisualizada() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isMestre, cenaVisualizadaId, cenaAtivaIdGlobal, cenaAtual, cenaRenderId, ativarCena } = ctx;
    if (!isMestre || !cenaVisualizadaId || cenaVisualizadaId === cenaAtivaIdGlobal) return null;
    return (
        <div style={{ background: 'rgba(0, 136, 255, 0.2)', border: '2px dashed #0088ff', padding: '10px 15px', borderRadius: '5px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: '#0088ff', fontWeight: 'bold', fontSize: '1.1em' }}>👁️ MODO EDIÇÃO OCULTA: Apenas você vê a cena "{cenaAtual.nome}".</span>
            <button className="btn-neon btn-green" onClick={() => ativarCena(cenaRenderId)} style={{ padding: '5px 15px', margin: 0 }}>
                🌍 PUBLICAR ESTA CENA PARA TODOS
            </button>
        </div>
    );
}

export function MapaMestreGerenciadorCenas() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isMestre, isModoRP, mestreVendoRP, cenario, cenaAtivaIdGlobal, cenaRenderId, setCenaVisualizadaId, ativarCena, deletarCena, novaCenaNome, setNovaCenaNome, novaCenaEscala, setNovaCenaEscala, novaCenaUnidade, setNovaCenaUnidade, uploadingMap, handleUploadNovaCena } = ctx;
    if (!isMestre || (isModoRP && !mestreVendoRP)) return null;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 5, border: '1px solid #ffcc00' }}>
            <h3 style={{ color: '#ffcc00', margin: 0 }}>🎬 Gerenciador de Cenas</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: '#0a0a0a', padding: 10, borderRadius: 5 }}>
                {Object.entries(cenario?.lista || {}).map(([id, cena]) => {
                    const isAtivaGlobal = cenaAtivaIdGlobal === id;
                    const isVisualizada = cenaRenderId === id;
                    return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: isAtivaGlobal ? 'rgba(0, 255, 136, 0.2)' : isVisualizada ? 'rgba(0, 136, 255, 0.2)' : '#222', border: `1px solid ${isAtivaGlobal ? '#00ff88' : isVisualizada ? '#0088ff' : '#555'}`, padding: '5px 10px', borderRadius: 4, flexWrap: 'wrap' }}>
                            <span style={{ color: isAtivaGlobal ? '#00ff88' : isVisualizada ? '#0088ff' : '#fff', fontWeight: 'bold' }}>{cena.nome}</span>
                            {isAtivaGlobal && <span style={{ fontSize: '0.6em', background: '#00ff88', color: '#000', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold', marginLeft: 4 }}>🌍 PUBLICA</span>}
                            {isVisualizada && !isAtivaGlobal && <span style={{ fontSize: '0.6em', background: '#0088ff', color: '#fff', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold', marginLeft: 4 }}>👁️ VENDO</span>}
                            {!isVisualizada && <button className="btn-neon btn-blue btn-small" onClick={() => setCenaVisualizadaId(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: '0 0 0 5px' }}>Ver Cena Oculta</button>}
                            {!isAtivaGlobal && <button className="btn-neon btn-green btn-small" onClick={() => ativarCena(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: '0 0 0 5px' }}>Publicar para Todos</button>}
                            <button className="btn-neon btn-red btn-small" onClick={() => deletarCena(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>X</button>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #444', paddingTop: 10 }}>
                <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>Nova Cena:</span>
                <input className="input-neon" type="text" placeholder="Nome (Ex: Taverna)" value={novaCenaNome} onChange={e => setNovaCenaNome(e.target.value)} style={{ width: 150, padding: 5 }}/>
                <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, opacity: uploadingMap ? 0.5 : 1 }}>
                    {uploadingMap ? 'Enviando...' : '📁 Anexar Fundo'}
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleUploadNovaCena} style={{ display: 'none' }} disabled={uploadingMap} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8em' }}>Escala:</span>
                    <input className="input-neon" type="number" min="0.1" step="0.1" value={novaCenaEscala} onChange={e => setNovaCenaEscala(e.target.value)} style={{ width: 60, padding: 4, margin: 0 }} />
                    <select className="input-neon" value={novaCenaUnidade} onChange={e => setNovaCenaUnidade(e.target.value)} style={{ padding: 4, margin: 0 }}>
                        <option value="m">m</option><option value="km">km</option><option value="milhas">mi</option><option value="anos-luz">Ly</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export function MapaMestreGavetaTokens() {
    return (
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 5, border: '1px solid #00ff88' }}>
            <h3 style={{ color: '#00ff88', margin: 0 }}>📦 Gaveta de Tokens</h3>
            <p style={{ color: '#888', fontStyle: 'italic' }}>Componente da Gaveta preservado.</p>
        </div>
    );
}

export function MapaMestreGeradorDummies() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isMestre, isModoRP, mestreVendoRP, cenaRenderId } = ctx;
    if (!isMestre || (isModoRP && !mestreVendoRP)) return null;
    return (
        <div style={{ padding: 10, border: '1px solid #0088ff', borderRadius: 5, background: 'rgba(0, 136, 255, 0.1)' }}>
            <h3 style={{ color: '#0088ff', marginTop: 0, marginBottom: 10 }}>🤖 Gerador de Entidades (Nesta Cena)</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input-neon" type="text" placeholder="Nome" id="dummieNome" defaultValue="Boneco" style={{ width: 100, padding: 5 }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8em' }}>HP Base:</span>
                    <input className="input-neon" type="number" id="dummieHp" defaultValue="100" style={{ width: 60, padding: 4, margin: 0 }} />
                    <span style={{ color: '#0f0', fontSize: '0.8em', fontWeight: 'bold' }}>+Vit:</span>
                    <input className="input-neon" type="number" id="dummieVitalidade" defaultValue="0" min="0" max="15" style={{ width: 45, padding: 4, margin: 0, borderColor: '#0f0', color: '#0f0' }} title="Ex: Vit 3 = adiciona 3 zeros" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                    <select className="input-neon" id="dummieDefTipo" style={{ width: 90, padding: 4, margin: 0 }}>
                        <option value="evasiva">Evasiva</option><option value="resistencia">Resistência</option>
                    </select>
                    <span style={{ color: '#0088ff', fontSize: '0.8em', fontWeight: 'bold' }}>CA:</span>
                    <input className="input-neon" type="number" id="dummieDef" defaultValue="10" style={{ width: 50, padding: 4, margin: 0 }} title="Classe de Armadura (5 + Base)"/>
                </div>
                <select className="input-neon" id="dummieVisivel" style={{ width: 110, padding: 5 }} title="Visibilidade do HP">
                    <option value="todos">HP Visível</option><option value="mestre">HP Oculto</option>
                </select>
                <button className="btn-neon btn-blue" onClick={() => {
                    const n = document.getElementById('dummieNome').value || 'Entidade';
                    const hBase = parseInt(document.getElementById('dummieHp').value) || 100;
                    const vit = parseInt(document.getElementById('dummieVitalidade').value) || 0;
                    const h = hBase * Math.pow(10, vit);
                    const dt = document.getElementById('dummieDefTipo').value;
                    const dv = parseInt(document.getElementById('dummieDef').value) || 10;
                    const vHp = document.getElementById('dummieVisivel').value;
                    const id = 'dummie_' + Date.now();
                    salvarDummie(id, { nome: n, hpMax: h, hpAtual: h, tipoDefesa: dt, valorDefesa: dv, visibilidadeHp: vHp, cenaId: cenaRenderId, posicao: { x: 0, y: 0 } });
                }} style={{ padding: '5px 15px', margin: 0 }}>+ Injetar na Cena</button>
            </div>
        </div>
    );
}

export function MapaMestreGerenciadorZonas() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isMestre, isModoRP, mestreVendoRP, cenario, deletarZona } = ctx;
    if (!isMestre || (isModoRP && !mestreVendoRP)) return null;

    const zonas = cenario?.zonas || [];
    if (zonas.length === 0) return (
        <div style={{ background: 'rgba(255, 0, 100, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #ff00ff' }}>
            <h3 style={{ color: '#ff00ff', margin: 0 }}>🌪️ Zonas e Anomalias</h3>
            <p style={{ color: '#888', fontStyle: 'italic', margin: '5px 0 0' }}>O mapa está limpo. Nenhuma zona ativa.</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255, 0, 100, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #ff00ff' }}>
            <h3 style={{ color: '#ff00ff', margin: 0 }}>🌪️ Zonas e Anomalias no Campo</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {zonas.map(z => (
                    <div key={z.id} style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(${z.rgb}, 0.8)`, padding: '5px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: `rgb(${z.rgb})`, fontWeight: 'bold', fontSize: '0.85em' }}>{z.nome} (Raio {z.raio}Q | {z.duracao}T)</span>
                        <button className="btn-neon btn-red btn-small" onClick={() => deletarZona(z.id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>Dissipar</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MapaRolagemRapida() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { 
        mapStat, setMapStat, mapQD, setMapQD, mapFD, setMapFD, mapBonus, setMapBonus, 
        mapVantagens, changeVantagem, mapDesvantagens, changeDesvantagem, mapUsarProf, 
        setMapUsarProf, alvoSelecionado, dummies, fichaSegura, cenaAtual, rolarAcertoRapido, isModoRP
    } = ctx;

    if (isModoRP) return null;

    let dQuad = 0; let alcanceEf = 1; let maxArea = 0; let foraAlc = false;
    const alvoD = alvoSelecionado && dummies?.[alvoSelecionado] ? dummies[alvoSelecionado] : null;

    if (alvoD) {
        const dx = Math.abs((fichaSegura?.posicao?.x || 0) - (alvoD.posicao?.x || 0));
        const dy = Math.abs((fichaSegura?.posicao?.y || 0) - (alvoD.posicao?.y || 0));
        const dz = Math.abs((fichaSegura?.posicao?.z || 0) - (alvoD.posicao?.z || 0)) / (cenaAtual.escala || 1.5);
        dQuad = Math.max(dx, dy, Math.floor(dz));
        
        const armasEq = (fichaSegura?.inventario || []).filter(i => i.tipo === 'arma' && i.equipado);
        const maxAlcArmas = armasEq.length > 0 ? Math.max(...armasEq.map(a => a.alcance || 1)) : 1;
        const maxAreaArmas = armasEq.length > 0 ? Math.max(...armasEq.map(a => a.areaQuad || a.area || 0)) : 0;
        
        const podAt = (fichaSegura?.poderes || []).filter(p => p.ativa);
        const maxAlcPoderes = podAt.length > 0 ? Math.max(...podAt.map(p => p.alcance || 1)) : 1;
        const maxAreaPoderes = podAt.length > 0 ? Math.max(...podAt.map(p => p.areaQuad || p.area || 0)) : 0;
        
        const magiasEq = (fichaSegura?.ataquesElementais || []).filter(m => m.equipado);
        const maxAlcMagias = magiasEq.length > 0 ? Math.max(...magiasEq.map(m => m.alcanceQuad || 1)) : 1;
        const maxAreaMagias = magiasEq.length > 0 ? Math.max(...magiasEq.map(m => m.areaQuad || 0)) : 0;

        alcanceEf = Math.max(maxAlcArmas, maxAlcPoderes, maxAlcMagias);
        maxArea = Math.max(maxAreaArmas, maxAreaPoderes, maxAreaMagias);
        foraAlc = dQuad > alcanceEf;
    }

    return (
        <div className="def-box" style={{ marginTop: 15, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap', border: '1px solid #f90' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ color: '#f90', margin: 0, whiteSpace: 'nowrap' }}>🎯 Ação Rápida</h4>
                <select className="input-neon" value={mapStat} onChange={e => setMapStat(e.target.value)} style={{ padding: '2px 4px', width: 90, height: 26, margin: 0 }}>
                    <option value="forca">Força</option><option value="destreza">Des</option><option value="inteligencia">Int</option><option value="sabedoria">Sab</option>
                    <option value="energiaEsp">Aura</option><option value="carisma">Carisma</option><option value="stamina">Stamina</option><option value="constituicao">Const</option>
                </select>
                <input className="input-neon" type="number" value={mapQD} onChange={e => setMapQD(e.target.value)} style={{ width: 40, padding: 2, height: 26, margin: 0 }} />
                <span style={{ color: '#aaa', fontWeight: 'bold' }}>D</span>
                <input className="input-neon" type="number" value={mapFD} onChange={e => setMapFD(e.target.value)} style={{ width: 45, padding: 2, height: 26, margin: 0 }} />
                <span style={{ color: '#aaa', fontWeight: 'bold' }}>+</span>
                <input className="input-neon" type="number" value={mapBonus} onChange={e => setMapBonus(e.target.value)} style={{ width: 45, padding: 2, height: 26, margin: 0 }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #444', paddingLeft: 15 }}>
                <span style={{ color: '#0f0', fontWeight: 'bold', fontSize: '0.85em' }}>V:</span>
                <input className="input-neon" type="number" min="0" value={mapVantagens} onChange={changeVantagem} style={{ width: 40, padding: 2, height: 26, margin: 0, borderColor: '#0f0', color: '#0f0' }} />
                <span style={{ color: '#f00', fontWeight: 'bold', fontSize: '0.85em' }}>D:</span>
                <input className="input-neon" type="number" min="0" value={mapDesvantagens} onChange={changeDesvantagem} style={{ width: 40, padding: 2, height: 26, margin: 0, borderColor: '#f00', color: '#f00' }} />
                <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 5 }}>
                    <input type="checkbox" checked={mapUsarProf} onChange={e => setMapUsarProf(e.target.checked)} /> Prof
                </label>
            </div>

            <div style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                {alvoD && (
                    <span style={{ fontSize: '0.85em', color: foraAlc ? '#ff003c' : '#0f0', fontWeight: 'bold' }}>
                        Alvo a {dQuad}Q (Alcance: {alcanceEf}Q) {foraAlc ? '❌' : '✅'}
                    </span>
                )}
                {!alvoD && <span style={{ fontSize: '0.85em', color: '#888', fontStyle: 'italic' }}>Livre</span>}
                <button className="btn-neon btn-gold" onClick={() => !foraAlc && rolarAcertoRapido()} disabled={foraAlc} style={{ margin: 0, padding: '4px 15px', opacity: foraAlc ? 0.5 : 1, borderColor: foraAlc ? '#555' : '#ffcc00' }}>
                    🎲 ROLAR
                </button>
            </div>
        </div>
    );
}

export function MapaVisao() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { 
        modo3D, tamanhoCelula, cenaAtual, cells, tokenMap, dummies, 
        cenaRenderId, tokens3D, handleCellClick, getAvatarInfo, 
        meuNome, corDoJogador, overridesCompendio, cenario, isMestre 
    } = ctx;

    const zonasCena = (cenario?.zonas || []).filter(z => (z.cenaId || 'default') === cenaRenderId);

    if (modo3D) {
        return (
            <div style={{ height: '60vh', background: '#000', borderRadius: 5, overflow: 'hidden', border: '2px solid #0088ff', boxShadow: '0 0 20px rgba(0, 136, 255, 0.4)' }}>
                <Tabuleiro3D mapSize={MAP_SIZE} tokens={tokens3D} moverJogador={handleCellClick} mapUrl={cenaAtual.img} />
            </div>
        );
    }

    return (
        <div id="combat-grid" style={{
            display: 'grid', gridTemplateColumns: `repeat(${MAP_SIZE}, ${tamanhoCelula}px)`, gap: 1,
            overflow: 'auto', maxHeight: '60vh', background: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 5,
            backgroundImage: urlSeguraParaCss(cenaAtual.img), backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative'
        }}>
            {zonasCena.map(z => (
                <div key={z.id} style={{
                    position: 'absolute', pointerEvents: 'none', zIndex: 3,
                    left: (z.x - z.raio) * tamanhoCelula,
                    top: (z.y - z.raio) * tamanhoCelula,
                    width: (z.raio * 2 + 1) * tamanhoCelula + (z.raio * 2), 
                    height: (z.raio * 2 + 1) * tamanhoCelula + (z.raio * 2),
                    background: `rgba(${z.rgb || '255,0,0'}, 0.2)`,
                    border: `3px dashed rgba(${z.rgb || '255,0,0'}, 0.9)`,
                    boxShadow: `inset 0 0 20px rgba(${z.rgb}, 0.5)`,
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center'
                }}>
                    <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7em', padding: '2px 8px', borderRadius: '0 0 8px 8px', borderBottom: `1px solid rgba(${z.rgb}, 0.8)`, borderLeft: `1px solid rgba(${z.rgb}, 0.8)`, borderRight: `1px solid rgba(${z.rgb}, 0.8)`, fontWeight: 'bold' }}>
                        {z.nome}
                    </span>
                </div>
            ))}

            {cells.map((cell) => {
                const key = `${cell.x},${cell.y}`;
                
                const tokensNestaCelula = tokenMap[key] || [];
                const visivelTokens = tokensNestaCelula.filter(tk => isMestre || !(cenario?.tokensOcultos?.includes(tk.nome)));

                const cellDummies = Object.entries(dummies || {}).filter(([id, d]) => {
                    const isOculto = cenario?.tokensOcultos?.includes(id);
                    if (!isMestre && isOculto) return false; 
                    const dCena = d.cenaId || 'default';
                    return d.posicao?.x === cell.x && d.posicao?.y === cell.y && dCena === cenaRenderId;
                });

                return (
                    <div key={key} className="map-cell" data-x={cell.x} data-y={cell.y} onClick={() => handleCellClick(cell.x, cell.y)} style={{ width: tamanhoCelula, height: tamanhoCelula, border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                        
                        {cellDummies.map(([id, d]) => (
                            <div key={id} style={{ opacity: cenario?.tokensOcultos?.includes(id) ? 0.4 : 1 }}>
                                <DummieToken id={id} dummie={d} />
                            </div>
                        ))}
                        
                        {visivelTokens.map((tk) => {
                            const info = getAvatarInfo(tk.ficha);
                            const isMe = tk.nome === meuNome;
                            const isOculto = cenario?.tokensOcultos?.includes(tk.nome);
                            const altitude = tk.ficha?.posicao?.z || 0;
                            const isFlying = altitude > 0;
                            const tkMesa = tk.ficha?.bio?.mesa || 'presente';
                            let tkClass = tk.ficha?.bio?.classe;
                            if ((tkClass === 'pretender' || tkClass === 'alterego') && tk.ficha?.bio?.subClasse) tkClass = tk.ficha?.bio?.subClasse;
                            const tkGrand = tkClass && overridesCompendio?.grands?.[`${tkClass}_${tkMesa}`] === tk.nome;
                            const tkCand = tkClass && !tkGrand && (overridesCompendio?.grands?.[`${tkClass}_${tkMesa}_candidatos`] || []).includes(tk.nome);
                            
                            let bordaToken = isFlying ? '3px solid #00ccff' : (isMe ? '2px solid #00ffcc' : '1px solid rgba(255,255,255,0.3)');
                            let sombraToken = isFlying ? '0 10px 15px rgba(0, 204, 255, 0.5)' : 'none';
                            if (tkGrand) { bordaToken = '3px solid #ffcc00'; sombraToken = '0 0 15px #ff003c, inset 0 0 10px #ffcc00'; } 
                            else if (tkCand) { bordaToken = '2px solid #0088ff'; sombraToken = '0 0 10px #00ccff'; }

                            const style = {
                                position: 'absolute', top: 2, left: 2, width: tamanhoCelula - 4, height: tamanhoCelula - 4,
                                borderRadius: '50%', backgroundColor: corDoJogador(tk.nome), display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '0.7em', fontWeight: 'bold', border: bordaToken, boxShadow: sombraToken,
                                transform: isFlying ? 'translateY(-5px)' : 'none', backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                zIndex: isFlying ? 10 : (tkGrand ? 5 : 1),
                                opacity: isOculto ? 0.4 : 1 
                            };
                            return (
                                <div key={tk.nome} className={`player-token${isMe ? ' my-token' : ''}`} title={`${tk.nome} | Altura: ${altitude}m`} style={style}>
                                    {!info.img && tk.nome.charAt(0).toUpperCase()}
                                    {isFlying && <div style={{ position: 'absolute', bottom: '-15px', background: '#00ccff', color: '#000', fontSize: '0.8em', padding: '0 4px', borderRadius: '4px', fontWeight: 'bold' }}>{altitude}m</div>}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export function MapaAreaCentral() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { isModoRP, isMestre, mestreVendoRP } = ctx;
    
    if (isModoRP && (!isMestre || mestreVendoRP)) return <MapaSessaoRP />;
    
    return (
        <>
            <MapaControlesSuperiores />
            <MapaVisao />
        </>
    );
}

export function MapaIniciativaTracker() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    
    const { 
        minhaFicha, iniciativaInput, setIniciativaInput, isMestre, sairDoCombate, encerrarCombate, 
        setMinhaIniciativa, avancarTurno, ordemIniciativa, turnoAtualIndex, jogadorHistory, 
        setJogadorHistory, feedCombate, getAvatarInfo, fmt, jogadorDaVez, infoDaVez, meuNome, 
        jogadores, dummies, cenaRenderId, cenario
    } = ctx;

    const todasEntidades = useMemo(() => {
        const js = Object.entries(jogadores).filter(([n, f]) => (f.posicao?.cenaId || 'default') === cenaRenderId).map(([n, f]) => ({ id: n, nome: n, ficha: f, isDummie: false, init: f.iniciativa || 0 }));
        const ds = Object.entries(dummies || {}).filter(([id, d]) => (d.cenaId || 'default') === cenaRenderId).map(([id, d]) => ({ id, nome: d.nome, ficha: d, isDummie: true, init: d.iniciativa || 0 }));
        
        return [...js, ...ds].sort((a, b) => b.init - a.init);
    }, [jogadores, dummies, cenaRenderId]);

    const toggleVisibilidadeToken = (e, idOuNome) => {
        e.stopPropagation();
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        if (!novoCenario.tokensOcultos) novoCenario.tokensOcultos = [];
        if (novoCenario.tokensOcultos.includes(idOuNome)) {
            novoCenario.tokensOcultos = novoCenario.tokensOcultos.filter(t => t !== idOuNome);
        } else {
            novoCenario.tokensOcultos.push(idOuNome);
        }
        salvarCenarioCompleto(novoCenario);
    };

    return (
        <div className="def-box" style={{ marginTop: 15, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '1.1em' }}>⚡ Iniciativa & Entidades</h3>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <input className="input-neon" type="number" value={iniciativaInput} onChange={e => setIniciativaInput(e.target.value)} style={{ width: 50, padding: 4, height: 26, margin: 0 }} title="Sua Iniciativa" />
                        <button className="btn-neon btn-gold" onClick={setMinhaIniciativa} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>Rolar</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-neon" onClick={avancarTurno} style={{ borderColor: '#00ffcc', color: '#00ffcc', padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Passar Turno</button>
                    {minhaFicha?.iniciativa > 0 && <button className="btn-neon btn-red" onClick={sairDoCombate} style={{ padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Sair</button>}
                    {isMestre && <button className="btn-neon" onClick={encerrarCombate} style={{ borderColor: '#ff003c', color: '#ff003c', padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Zerar</button>}
                </div>
            </div>

            <div id="lista-turnos" style={{ display: 'flex', gap: 8, marginTop: 15, overflowX: 'auto', paddingBottom: 5, minHeight: 50 }}>
                {todasEntidades.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.8em', margin: 0 }}>Nenhuma entidade encontra-se neste mapa.</p>
                ) : (
                    todasEntidades.map((entidade) => {
                        const isOculto = cenario?.tokensOcultos?.includes(entidade.id);
                        if (!isMestre && isOculto) return null;

                        const info = getAvatarInfo(entidade.ficha);
                        const isRolled = entidade.init > 0;
                        const isActive = isRolled && ordemIniciativa.length > 0 && (ordemIniciativa[turnoAtualIndex % ordemIniciativa.length]?.nome === entidade.nome);

                        return (
                            <div key={entidade.id} style={{ position: 'relative' }}>
                                <div title={`Clique para ver o Histórico de ${entidade.nome}`} onClick={() => setJogadorHistory(entidade.nome)} style={{ 
                                    cursor: 'pointer', minWidth: 40, height: 40, borderRadius: '50%', 
                                    border: isActive ? '3px solid #00ffcc' : (isRolled ? '2px solid #aaa' : '2px dashed #444'), 
                                    opacity: isActive ? 1 : (isOculto ? 0.3 : (isRolled ? 0.8 : 0.5)), 
                                    backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7em', color: 'white', textShadow: '1px 1px 2px black', transition: 'transform 0.2s' 
                                }}>
                                    {!info.img && entidade.nome.charAt(0)}
                                </div>
                                {isMestre && (
                                    <button 
                                        onClick={(e) => toggleVisibilidadeToken(e, entidade.id)}
                                        title={isOculto ? "Oculto dos Jogadores. Clique para Revelar." : "Visível. Clique para Ocultar."}
                                        style={{ position: 'absolute', top: -5, right: -5, background: isOculto ? '#ff003c' : '#000', borderRadius: '50%', padding: '2px 4px', fontSize: '10px', cursor: 'pointer', border: '1px solid #fff' }}
                                    >
                                        {isOculto ? '👻' : '👁️'}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {jogadorHistory && (
                <div style={{ marginTop: 15, padding: 15, background: 'rgba(0, 20, 40, 0.8)', border: '1px solid #0088ff', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <h4 style={{ margin: 0, color: '#0088ff' }}>Histórico de Ações: {jogadorHistory}</h4>
                        <button className="btn-neon btn-red" onClick={() => setJogadorHistory(null)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>X Fechar</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 5 }}>
                        {feedCombate.filter(f => f.nome === jogadorHistory).slice(-6).reverse().map((h, i) => (
                            <div key={i} style={{ fontSize: '0.85em', color: '#ccc', background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 5, borderLeft: `3px solid ${h.tipo === 'dano' ? '#ff003c' : '#f90'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ color: h.tipo === 'dano' ? '#ff003c' : h.tipo === 'acerto' ? '#f90' : '#0088ff', textTransform: 'uppercase' }}>[{h.tipo}]</strong>{h.acertoTotal && <strong style={{ color: '#fff' }}>Total: {fmt(h.acertoTotal)}</strong>}{h.dano && <strong style={{ color: '#fff' }}>Dano Bruto: {fmt(h.dano)}</strong>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {jogadorDaVez && (
                <div style={{ marginTop: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div id="turno-destaque" style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #00ffcc', backgroundImage: urlSeguraParaCss(infoDaVez?.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold', color: '#fff' }}>{(!infoDaVez || !infoDaVez.img) && jogadorDaVez.nome.charAt(0)}</div>
                    <div>
                        <div id="turno-nome" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1em' }}>{jogadorDaVez.nome}</div>
                        {infoDaVez && infoDaVez.forma && (<div id="turno-forma" style={{ color: '#00ffcc', fontSize: '0.8em' }}>{infoDaVez.forma}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export function MapaHologramaAcao() {
    const ctx = useMapaForm();
    if (!ctx) return FALLBACK;
    const { dadoAnim, ordemIniciativa, feedCombate, feedIndexTurnoAtual, jogadorDaVez, jogadores, overridesCompendio, getAvatarInfo, fmt, meuNome, minhaFicha } = ctx;

    const emCombate = ordemIniciativa.length > 0;
    const acaoNovaNoTurno = feedCombate.length > feedIndexTurnoAtual ? feedCombate[feedCombate.length - 1] : null;
    const acaoGeralForaDeCombate = feedCombate.length > 0 ? feedCombate[feedCombate.length - 1] : null;
    const acaoExibir = emCombate ? acaoNovaNoTurno : acaoGeralForaDeCombate;

    if (!emCombate && !acaoExibir) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontStyle: 'italic', border: '2px dashed #333', borderRadius: 8 }}>O campo de batalha aguarda o primeiro movimento...</div>
        );
    }

    let nomeBase = jogadorDaVez ? jogadorDaVez.nome : (acaoExibir ? acaoExibir.nome : '');
    let fichaBase = jogadorDaVez ? jogadorDaVez.ficha : (acaoExibir ? jogadores[acaoExibir.nome] : null);
    let infoBase = getAvatarInfo(fichaBase);

    let classId = fichaBase?.bio?.classe;
    if ((classId === 'pretender' || classId === 'alterego') && fichaBase?.bio?.subClasse) classId = fichaBase?.bio?.subClasse;
    let mesaBase = fichaBase?.bio?.mesa || 'presente';
    const isGrand = classId && overridesCompendio?.grands?.[`${classId}_${mesaBase}`] === nomeBase;
    const listaCands = overridesCompendio?.grands?.[`${classId}_${mesaBase}_candidatos`] || [];
    const isCandidato = classId && !isGrand && listaCands.includes(nomeBase);
    const grandIconUrl = overridesCompendio?.grands?.[`${classId}_${mesaBase}_icone`];
    const customClassIcon = classId ? overridesCompendio[classId]?.iconeUrl : null;
    const defaultClassSymbol = getClassIconById(classId);

    let isCritNormal = false, isCritFatal = false, isFalha = false;
    if (acaoExibir && acaoExibir.rolagem && (acaoExibir.tipo === 'acerto' || acaoExibir.tipo === 'dano')) {
        let maxDado = 0;
        let regexStrong = /<strong>(\d+)<\/strong>/g;
        let match;
        while ((match = regexStrong.exec(acaoExibir.rolagem)) !== null) {
            let v = parseInt(match[1]);
            if (v > maxDado) maxDado = v;
        }
        if (maxDado === 0) {
            let regexArr = /\[(.*?)\]/;
            let mArr = regexArr.exec(acaoExibir.rolagem);
            if (mArr) {
                let clean = mArr[1].replace(/<[^>]*>?/gm, ''); 
                let nums = clean.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                if (nums.length > 0) maxDado = Math.max(...nums);
            }
        }
        const acCfg = fichaBase?.ataqueConfig || minhaFicha?.ataqueConfig || {};
        const cNMin = acCfg.criticoNormalMin || 16, cNMax = acCfg.criticoNormalMax || 18;
        const cFMin = acCfg.criticoFatalMin || 19, cFMax = acCfg.criticoFatalMax || 20;
        if (maxDado >= cFMin && maxDado <= cFMax) isCritFatal = true;
        else if (maxDado >= cNMin && maxDado <= cNMax) isCritNormal = true;
        else if (maxDado === 1) isFalha = true;

        if (acaoExibir.tipo === 'dano') {
            if (acaoExibir.armaStr?.includes('FATAL')) { isCritFatal = true; isCritNormal = false; }
            else if (acaoExibir.armaStr?.includes('CRÍTICO')) { isCritNormal = true; isCritFatal = false; }
        }
    }

    const isForaDeCombate = acaoExibir && emCombate && (!ordemIniciativa.find(j => j.nome === acaoExibir.nome));
    const isForaDeTurno = acaoExibir && emCombate && !isForaDeCombate && acaoExibir.nome !== nomeBase;

    let corImpacto = '#333', corHeader = '#00ffcc', corTextoHeader = '#000', tituloImpacto = 'AÇÃO', valorImpacto = 0;
    if (acaoExibir) {
        switch (acaoExibir.tipo) {
            case 'dano': corImpacto = '#ff003c'; tituloImpacto = 'DANO'; valorImpacto = acaoExibir.dano; break;
            case 'acerto': corImpacto = '#f90'; tituloImpacto = 'ACERTO'; valorImpacto = acaoExibir.acertoTotal; break;
            case 'evasiva': corImpacto = '#0088ff'; tituloImpacto = 'ESQUIVA'; valorImpacto = acaoExibir.total; break;
            case 'resistencia': corImpacto = '#ccc'; tituloImpacto = 'BLOQUEIO'; valorImpacto = acaoExibir.total; break;
            case 'escudo': corImpacto = '#f0f'; tituloImpacto = 'ESCUDO'; valorImpacto = acaoExibir.escudoReduzido; break;
            case 'sistema': corImpacto = '#ffcc00'; tituloImpacto = 'AVISO DO SISTEMA'; valorImpacto = 0; break;
            default: break;
        }
    }

    if (isCritFatal) { corImpacto = '#ff003c'; corHeader = '#ff003c'; corTextoHeader = '#fff'; tituloImpacto = '🔥 CRÍTICO FATAL 🔥'; }
    else if (isCritNormal) { corImpacto = '#ffcc00'; corHeader = '#ffcc00'; corTextoHeader = '#000'; tituloImpacto = '⚡ CRÍTICO NORMAL ⚡'; }
    else if (isFalha) { corImpacto = '#660000'; corHeader = '#660000'; corTextoHeader = '#ff003c'; tituloImpacto = '☠️ FALHA CRÍTICA ☠️'; }
    else if (acaoExibir) {
        corHeader = corImpacto; corTextoHeader = '#000';
        if (acaoExibir.tipo === 'sistema') tituloImpacto = 'AVISO DO SISTEMA';
        else if (jogadorDaVez && !isForaDeTurno && !isForaDeCombate) tituloImpacto = `TURNO DE ${nomeBase}`;
        else tituloImpacto = 'AÇÃO LIVRE';
    } else {
        tituloImpacto = `⚡ TURNO DE ${nomeBase} ⚡`;
    }

    return (
        <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: isGrand ? `3px solid #ffcc00` : (isCandidato ? `2px solid #00ccff` : `2px solid ${corImpacto}`), boxShadow: isGrand ? `0 0 30px rgba(255,0,60,0.6), inset 0 0 20px rgba(255,204,0,0.3)` : (isCandidato ? `0 0 20px rgba(0,204,255,0.4)` : `0 0 20px ${corImpacto}40`) }}>
            <div style={{ background: corHeader, color: corTextoHeader, padding: '10px', textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: '1.2em', textTransform: 'uppercase' }}>{tituloImpacto}</div>
            {acaoExibir?.tipo === 'sistema' ? (
                 <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <h2 style={{ color: '#ffcc00', textShadow: '0 0 20px #ffcc00' }}>{acaoExibir.texto}</h2>
                 </div>
            ) : (
                <>
                    <div style={{ flex: '1', minHeight: '250px', backgroundImage: urlSeguraParaCss(infoBase.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'inset 0 -100px 50px -20px rgba(0,0,0,0.9)' }}>
                        <div style={{ padding: '20px', zIndex: 2, background: isGrand ? 'linear-gradient(to top, rgba(255,0,60,0.9), transparent)' : (isCandidato ? 'linear-gradient(to top, rgba(0,136,255,0.8), transparent)' : 'none') }}>
                            {isGrand && <div style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #ff003c', letterSpacing: 2, marginBottom: '5px' }}>👑 GRAND {classId?.toUpperCase()}</div>}
                            {isCandidato && <div style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #0088ff', letterSpacing: 2, marginBottom: '5px' }}>🌟 CANDIDATO A {classId?.toUpperCase()}</div>}
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '2em', textShadow: isGrand ? '0 0 15px #ffcc00, 2px 2px 0px #000' : '0 0 10px #000, 2px 2px 0px #000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isGrand && grandIconUrl ? <img src={grandIconUrl} alt="Grand" style={{ height: '1.5em', width: '1.5em', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ffcc00', boxShadow: '0 0 10px #ff003c' }} /> : customClassIcon ? <img src={customClassIcon} alt={classId} style={{ height: '1.2em', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }} /> : defaultClassSymbol ? <span style={{ fontSize: '0.9em', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }}>{defaultClassSymbol}</span> : null}
                                {nomeBase}
                            </h2>
                            {infoBase.forma && <div style={{ color: '#00ffcc', fontSize: '1.2em', fontWeight: 'bold', textShadow: '0 0 5px #000' }}>☄️ {infoBase.forma}</div>}
                        </div>
                    </div>
                    {acaoExibir && (
                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.85)', textAlign: 'center', borderTop: `1px solid ${corImpacto}` }}>
                            {isForaDeCombate && <div style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid #ffcc00', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>⚠️ Rolagem Fora de Combate (Feita por: {acaoExibir.nome})</div>}
                            {isForaDeTurno && <div style={{ background: 'rgba(255,0,60,0.1)', color: '#ff003c', border: '1px solid #ff003c', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>❌ Ação Fora de Turno (Feita por: {acaoExibir.nome})</div>}
                            <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '-10px', textTransform: 'uppercase' }}>{tituloImpacto} {(!isForaDeCombate && !isForaDeTurno) ? '' : `(${acaoExibir.nome})`}</div>
                            <h1 style={{ margin: 0, fontSize: '4em', color: corImpacto, textShadow: `0 0 20px ${corImpacto}` }}>{fmt(valorImpacto)}</h1>
                            {acaoExibir.tipo === 'dano' && acaoExibir.letalidade !== undefined && <div style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px', textShadow: '0 0 5px #ffcc00' }}>LETALIDADE: +{acaoExibir.letalidade}</div>}
                            
                            {acaoExibir.alvosArea && acaoExibir.alvosArea.length > 0 && (
                                <div style={{ marginTop: 15, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, borderLeft: `3px solid ${acaoExibir.alvosArea.some(a=>a.acertou) ? '#0f0' : '#f00'}`, textAlign: 'left' }}>
                                    {acaoExibir.areaEf > 0 && <div style={{ color: '#00ccff', fontSize: '0.85em', marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase' }}>💥 Explosão em Área ({acaoExibir.areaEf} Quadrados) atingiu {acaoExibir.alvosArea.length} alvo(s):</div>}
                                    {acaoExibir.alvosArea.map((a, i) => (
                                        <div key={i} style={{ color: a.acertou ? '#0f0' : '#f00', fontWeight: 'bold', fontSize: '0.9em', marginBottom: 2 }}>
                                            {a.acertou ? `🎯 Superou ${a.nome} (Def: ${a.defesa})!` : `❌ Falhou vs ${a.nome} (Def: ${a.defesa})!`}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {fichaBase && (
                        <div style={{ padding: '15px', background: '#050505' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4d', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>HP</span><span>{fmt(fichaBase.vida?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4dffff', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>MP</span><span>{fmt(fichaBase.mana?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffff4d', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>AU</span><span>{fmt(fichaBase.aura?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CK</span><span>{fmt(fichaBase.chakra?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff66ff', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CP</span><span>{fmt(fichaBase.corpo?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ color: '#0088ff', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #0088ff' }}>🛡️ EVA: {calcularCA(fichaBase, 'evasiva')}</div>
                                    <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #ccc' }}>🛡️ RES: {calcularCA(fichaBase, 'resistencia')}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}