import { useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'peerjs';

export function useVoiceChat(meuNome, tavernaAtivos, isPresenteNaTaverna) {
    const [peerObj, setPeerObj] = useState(null);
    const [meuStream, setMeuStream] = useState(null); // Cabo A: Vai para a rede (Com AEC do Chrome)
    const [streamAnalisador, setStreamAnalisador] = useState(null); // Cabo B: Clone para a barra/Gate
    const [conexoes, setConexoes] = useState([]);
    
    const [voiceStatus, setVoiceStatus] = useState('Fora da Taverna');
    const [mics, setMics] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [mutado, setMutado] = useState(false);
    const [surdo, setSurdo] = useState(false);
    const [supressorAtivo, setSupressorAtivo] = useState(true);
    const [sensibilidadeVoz, setSensibilidadeVoz] = useState(() => {
        const saved = localStorage.getItem('rpg_sensibilidade_voz');
        return saved !== null ? parseInt(saved, 10) : 10;
    });

    const [euEstouFalandoState, setEuEstouFalandoState] = useState(false);
    
    const meuStreamRef = useRef(null);
    const conexoesRef = useRef([]);
    const chamadasEmAndamento = useRef(new Set());
    const rtcLigado = useRef(false);
    const mutadoRef = useRef(mutado);
    const sensibilidadeRef = useRef(sensibilidadeVoz);
    const euEstouFalandoRef = useRef(false);

    const meuIDTelefone = meuNome ? meuNome.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    useEffect(() => { conexoesRef.current = conexoes; }, [conexoes]);
    useEffect(() => { mutadoRef.current = mutado; }, [mutado]);
    useEffect(() => { 
        sensibilidadeRef.current = sensibilidadeVoz; 
        localStorage.setItem('rpg_sensibilidade_voz', sensibilidadeVoz); 
    }, [sensibilidadeVoz]);

    // 1. INICIALIZA A ANTENA PEERJS
    useEffect(() => {
        if (!meuIDTelefone || peerObj) return;

        const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`, {
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] }
        });
        
        novoPeer.on('open', () => setPeerObj(novoPeer));

        novoPeer.on('call', (call) => {
            const attemptAnswer = () => {
                if (meuStreamRef.current) {
                    call.answer(meuStreamRef.current);
                    call.on('stream', (remoteStream) => {
                        setConexoes(prev => {
                            if (prev.find(c => c.id === call.peer)) return prev.map(c => c.id === call.peer ? { ...c, stream: remoteStream } : c);
                            return [...prev, { id: call.peer, stream: remoteStream }];
                        });
                    });
                    call.on('close', () => setConexoes(prev => prev.filter(c => c.id !== call.peer)));
                    call.on('error', () => setConexoes(prev => prev.filter(c => c.id !== call.peer)));
                } else { setTimeout(attemptAnswer, 500); }
            };
            attemptAnswer();
        });

        return () => novoPeer.destroy();
    }, [meuIDTelefone]);

    // 2. LIGAR/DESLIGAR O MICROFONE
    useEffect(() => {
        if (isPresenteNaTaverna && !rtcLigado.current) {
            rtcLigado.current = true;
            setVoiceStatus('A ligar Microfone...');
            
            navigator.mediaDevices.getUserMedia({ 
                audio: { noiseSuppression: supressorAtivo, echoCancellation: true, autoGainControl: true } 
            }).then(stream => {
                meuStreamRef.current = stream;
                setMeuStream(stream);

                const cloneTrack = stream.getAudioTracks()[0].clone();
                setStreamAnalisador(new MediaStream([cloneTrack]));

                navigator.mediaDevices.enumerateDevices().then(devices => {
                    const audioInputs = devices.filter(d => d.kind === 'audioinput');
                    setMics(audioInputs);
                    let bestMic = audioInputs[0]?.deviceId;
                    for (let mic of audioInputs) {
                        if (mic.label && !['mixagem', 'stereo mix'].some(bw => mic.label.toLowerCase().includes(bw))) {
                            bestMic = mic.deviceId; break;
                        }
                    }
                    if (bestMic) setSelectedMic(bestMic);
                });

                setVoiceStatus('Online na Taverna!');
            }).catch(err => {
                setVoiceStatus(`Microfone Bloqueado! Permitir acesso.`);
                rtcLigado.current = false;
            });

        } else if (!isPresenteNaTaverna && rtcLigado.current) {
            rtcLigado.current = false;
            if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop());
            if (streamAnalisador) streamAnalisador.getTracks().forEach(t => t.stop());
            
            meuStreamRef.current = null;
            setMeuStream(null);
            setStreamAnalisador(null);
            setConexoes([]);
            setVoiceStatus('Fora da Taverna');
            setEuEstouFalandoState(false);
            euEstouFalandoRef.current = false;
        }
    }, [isPresenteNaTaverna, supressorAtivo]);

    // 3. O CÉREBRO DO NOISE GATE (Desliga a faixa da rede sem matar o AEC)
    useEffect(() => {
        if (!streamAnalisador || !meuStream) return;
        let raf;
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        
        try {
            const source = actx.createMediaStreamSource(streamAnalisador);
            const analyser = actx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let framesEmSilencio = 0;

            const checkVolume = () => {
                if (!rtcLigado.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;

                if (avg > sensibilidadeRef.current) {
                    framesEmSilencio = 0;
                    if (!euEstouFalandoRef.current) {
                        euEstouFalandoRef.current = true;
                        setEuEstouFalandoState(true);
                    }
                    if (meuStream.getAudioTracks()[0]) meuStream.getAudioTracks()[0].enabled = !mutadoRef.current;
                } else {
                    framesEmSilencio++;
                    if (framesEmSilencio > 20) {
                        if (euEstouFalandoRef.current) {
                            euEstouFalandoRef.current = false;
                            setEuEstouFalandoState(false);
                        }
                        if (meuStream.getAudioTracks()[0]) meuStream.getAudioTracks()[0].enabled = false;
                    }
                }
                raf = requestAnimationFrame(checkVolume);
            };
            checkVolume();
        } catch (e) { console.error("Gate Error:", e); }

        return () => { cancelAnimationFrame(raf); actx.close(); };
    }, [streamAnalisador, meuStream]);

    // 4. AUTO-DIALER ANTI-COLISÃO
    const fazerChamada = useCallback((nomeDestino) => {
        if (!peerObj || !meuStreamRef.current || !nomeDestino) return;
        const idFormatado = `anime-rpg-${nomeDestino.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (chamadasEmAndamento.current.has(idFormatado)) return;
        chamadasEmAndamento.current.add(idFormatado);

        const call = peerObj.call(idFormatado, meuStreamRef.current);
        if (!call) { chamadasEmAndamento.current.delete(idFormatado); return; }

        call.on('stream', (remoteStream) => {
            setConexoes(prev => {
                if (prev.find(c => c.id === idFormatado)) return prev.map(c => c.id === idFormatado ? { ...c, stream: remoteStream } : c);
                return [...prev, { id: idFormatado, stream: remoteStream }];
            });
            chamadasEmAndamento.current.delete(idFormatado);
        });
        call.on('close', () => { setConexoes(prev => prev.filter(c => c.id !== idFormatado)); chamadasEmAndamento.current.delete(idFormatado); });
        call.on('error', () => { setConexoes(prev => prev.filter(c => c.id !== idFormatado)); chamadasEmAndamento.current.delete(idFormatado); });
    }, [peerObj]);

    useEffect(() => {
        if (!peerObj || !isPresenteNaTaverna || !meuStreamRef.current) return;
        const interval = setInterval(() => {
            const ativosAmigos = Array.isArray(tavernaAtivos) ? tavernaAtivos : [];
            ativosAmigos.forEach(nomeAmigo => {
                if (nomeAmigo === meuNome) return;
                const meuId = `anime-rpg-${meuNome.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const amigoId = `anime-rpg-${nomeAmigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                
                if (meuId < amigoId) {
                    const exists = conexoesRef.current.find(c => c.id === amigoId);
                    if (!exists && !chamadasEmAndamento.current.has(amigoId)) fazerChamada(nomeAmigo);
                }
            });
        }, 3000); 
        return () => clearInterval(interval);
    }, [tavernaAtivos, peerObj, isPresenteNaTaverna, meuNome, fazerChamada]);

    // 5. FUNÇÕES DE CONTROLO
    const trocarMicrofone = useCallback(async (deviceId) => {
        try {
            setSelectedMic(deviceId);
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { deviceId: { exact: deviceId }, noiseSuppression: supressorAtivo, echoCancellation: true, autoGainControl: true } 
            });
            
            if (peerObj) {
                Object.values(peerObj.connections).forEach(conns => {
                    conns.forEach(conn => {
                        if (conn.peerConnection) {
                            const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
                            if (sender) sender.replaceTrack(newStream.getAudioTracks()[0]);
                        }
                    });
                });
            }

            if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop()); 
            if (streamAnalisador) streamAnalisador.getTracks().forEach(t => t.stop()); 

            meuStreamRef.current = newStream;
            setMeuStream(newStream);

            const newClone = newStream.getAudioTracks()[0].clone();
            setStreamAnalisador(new MediaStream([newClone]));
        } catch (err) { console.error("Erro ao trocar mic:", err); }
    }, [peerObj, supressorAtivo, streamAnalisador]);

    const toggleMute = useCallback(() => setMutado(m => !m), []);
    const toggleDeafen = useCallback(() => setSurdo(s => !s), []);

    return {
        meuStream, streamAnalisador, conexoes, mutado, surdo, voiceStatus, mics, selectedMic, 
        supressorAtivo, sensibilidadeVoz, euEstouFalandoState,
        toggleMute, toggleDeafen, trocarMicrofone, setSupressorAtivo, setSensibilidadeVoz, fazerChamada
    };
}