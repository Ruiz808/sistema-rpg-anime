import { useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'peerjs';

const BLACKLIST_MIC = ['mixagem', 'stereo mix', 'wave out', 'loopback', 'virtual', 'cable', 'voicemeeter', 'what u hear', 'monitor', 'wasapi'];

function encontrarMelhorMic(audioInputs) {
    for (let mic of audioInputs) {
        if (mic.label && !BLACKLIST_MIC.some(bw => mic.label.toLowerCase().includes(bw))) {
            return mic.deviceId;
        }
    }
    return audioInputs[0]?.deviceId || null;
}

const getAudioConstraints = (deviceId, supressor) => ({
    deviceId: deviceId ? { exact: deviceId } : undefined,
    echoCancellation: true,
    noiseSuppression: supressor,
    autoGainControl: true,
    googEchoCancellation: true,
    googExperimentalEchoCancellation: true,
    googNoiseSuppression: supressor,
    googExperimentalNoiseSuppression: supressor,
    googHighpassFilter: true,
    googTypingNoiseDetection: true,
    googAudioMirroring: false
});

export function useVoiceChat(meuNome, tavernaAtivos, isPresenteNaTaverna) {
    const [peerObj, setPeerObj] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const [streamAnalisador, setStreamAnalisador] = useState(null);
    const [conexoes, setConexoes] = useState([]);

    const [voiceStatus, setVoiceStatus] = useState('Fora da Taverna');
    
    const [mics, setMics] = useState([]);
    const [speakers, setSpeakers] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');

    const [mutado, setMutado] = useState(false);
    const [surdo, setSurdo] = useState(false);
    const [supressorAtivo, setSupressorAtivo] = useState(true);

    const meuStreamRef = useRef(null);
    const conexoesRef = useRef([]);
    const chamadasEmAndamento = useRef(new Set());
    const rtcLigado = useRef(false);
    const supressorAtivoRef = useRef(supressorAtivo);

    const meuIDTelefone = meuNome ? meuNome.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    useEffect(() => { conexoesRef.current = conexoes; }, [conexoes]);
    useEffect(() => { supressorAtivoRef.current = supressorAtivo; }, [supressorAtivo]);

    // 1. INICIALIZA A ANTENA PEERJS (COM SERVIDORES STUN/TURN DE ALTA FIABILIDADE)
    useEffect(() => {
        if (!meuIDTelefone || peerObj) return;

        const ICE_SERVERS = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ];

        console.log(`[VOZ] A ligar à Central de Rádio com ID: anime-rpg-${meuIDTelefone}`);
        
        const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`, {
            config: { iceServers: ICE_SERVERS },
            debug: 2 // Mostra erros no F12 para ajudar a diagnosticar
        });

        novoPeer.on('open', (id) => {
            console.log(`[VOZ] Ligação estabelecida com sucesso! ID Central: ${id}`);
            setPeerObj(novoPeer);
        });

        novoPeer.on('call', (call) => {
            console.log(`[VOZ] A receber chamada de: ${call.peer}`);
            
            const attemptAnswer = (tentativas = 0) => {
                if (meuStreamRef.current) {
                    console.log(`[VOZ] A atender chamada de ${call.peer} com o meu microfone...`);
                    call.answer(meuStreamRef.current);
                    
                    call.on('stream', (remoteStream) => {
                        console.log(`[VOZ] Áudio recebido de ${call.peer}! Track ativada:`, remoteStream.getAudioTracks()[0]?.enabled);
                        setConexoes(prev => {
                            if (prev.find(c => c.id === call.peer)) return prev.map(c => c.id === call.peer ? { ...c, stream: remoteStream } : c);
                            return [...prev, { id: call.peer, stream: remoteStream }];
                        });
                    });
                    
                    call.on('close', () => setConexoes(prev => prev.filter(c => c.id !== call.peer)));
                    call.on('error', (err) => console.error(`[VOZ] Erro na chamada de ${call.peer}:`, err));
                } else {
                    if (tentativas < 10) {
                        console.log(`[VOZ] À espera que o meu microfone ligue para atender ${call.peer}...`);
                        setTimeout(() => attemptAnswer(tentativas + 1), 500);
                    } else {
                        console.error(`[VOZ] Falha ao atender ${call.peer}. O microfone nunca ligou.`);
                    }
                }
            };
            attemptAnswer();
        });

        novoPeer.on('disconnected', () => {
            console.warn('[VOZ] Desconectado da Central! A tentar religar...');
            novoPeer.reconnect();
        });

        novoPeer.on('error', (err) => {
            console.error('[VOZ] Erro fatal no PeerJS:', err.type, err);
            setVoiceStatus(`Erro de Ligação: ${err.type}`);
        });

        return () => {
            console.log('[VOZ] A destruir a ligação WebRTC...');
            novoPeer.destroy();
        };
    }, [meuIDTelefone]);

    // 2. LIGAR MICROFONE
    useEffect(() => {
        if (isPresenteNaTaverna && !rtcLigado.current) {
            rtcLigado.current = true;
            setVoiceStatus('A ligar Equipamentos...');
            console.log('[VOZ] A pedir permissão para usar o Microfone...');

            navigator.mediaDevices.getUserMedia({
                audio: getAudioConstraints(null, supressorAtivoRef.current)
            }).then(async (stream) => {
                console.log('[VOZ] Permissão concedida! Stream local capturada.');
                meuStreamRef.current = stream;
                setMeuStream(stream);
                
                const track = stream.getAudioTracks()[0];
                if (track) {
                    const cloneTrack = track.clone();
                    setStreamAnalisador(new MediaStream([cloneTrack]));
                }
                
                setVoiceStatus('Online na Taverna!');

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                
                setMics(audioInputs);
                setSpeakers(audioOutputs);

                const bestMicId = encontrarMelhorMic(audioInputs);
                if (bestMicId) setSelectedMic(bestMicId);
                if (audioOutputs.length > 0) setSelectedSpeaker(audioOutputs[0].deviceId);

            }).catch((err) => {
                console.error('[VOZ] Erro ao aceder ao microfone:', err);
                setVoiceStatus('Microfone Bloqueado! Permita no cadeado do navegador.');
                rtcLigado.current = false;
            });

        } else if (!isPresenteNaTaverna && rtcLigado.current) {
            console.log('[VOZ] A desligar microfone e a sair da Taverna...');
            rtcLigado.current = false;
            if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop());
            if (streamAnalisador) streamAnalisador.getTracks().forEach(t => t.stop());

            meuStreamRef.current = null;
            setMeuStream(null);
            setStreamAnalisador(null);
            setConexoes([]);
            setVoiceStatus('Fora da Taverna');
        }
    }, [isPresenteNaTaverna, supressorAtivo]);

    // 3. AUTO-DIALER (CHAMADAS ATIVAS)
    const fazerChamada = useCallback((nomeDestino) => {
        if (!peerObj || !meuStreamRef.current || !nomeDestino) return;
        const idFormatado = `anime-rpg-${(nomeDestino || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        
        if (chamadasEmAndamento.current.has(idFormatado)) return;
        chamadasEmAndamento.current.add(idFormatado);

        console.log(`[VOZ] A tentar ligar ativamente para: ${idFormatado}`);
        const call = peerObj.call(idFormatado, meuStreamRef.current);
        
        if (!call) { 
            console.error(`[VOZ] Falha ao iniciar call para ${idFormatado}. Peer destruído?`);
            chamadasEmAndamento.current.delete(idFormatado); 
            return; 
        }

        call.on('stream', (remoteStream) => {
            console.log(`[VOZ] Áudio recebido de ${idFormatado} (Chamada Ativa)!`);
            setConexoes(prev => {
                if (prev.find(c => c.id === idFormatado)) return prev.map(c => c.id === idFormatado ? { ...c, stream: remoteStream } : c);
                return [...prev, { id: idFormatado, stream: remoteStream }];
            });
            chamadasEmAndamento.current.delete(idFormatado);
        });
        
        call.on('close', () => { 
            console.log(`[VOZ] Chamada fechada por ${idFormatado}`);
            setConexoes(prev => prev.filter(c => c.id !== idFormatado)); 
            chamadasEmAndamento.current.delete(idFormatado); 
        });
        
        call.on('error', (err) => { 
            console.error(`[VOZ] Erro na chamada ativa para ${idFormatado}:`, err);
            setConexoes(prev => prev.filter(c => c.id !== idFormatado)); 
            chamadasEmAndamento.current.delete(idFormatado); 
        });
    }, [peerObj]);

    useEffect(() => {
        if (!peerObj || !isPresenteNaTaverna) return;
        const interval = setInterval(() => {
            const ativosAmigos = Array.isArray(tavernaAtivos) ? tavernaAtivos : [];
            ativosAmigos.forEach(nomeAmigo => {
                if (!nomeAmigo || nomeAmigo === meuNome) return;
                const meuId = `anime-rpg-${(meuNome || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const amigoId = `anime-rpg-${(nomeAmigo || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

                // Para evitar chamadas duplas e colisões, quem tem a ordem alfabética "menor" faz a chamada
                if (meuId < amigoId) {
                    const exists = conexoesRef.current.find(c => c.id === amigoId);
                    if (!exists && !chamadasEmAndamento.current.has(amigoId)) {
                        fazerChamada(nomeAmigo);
                    }
                }
            });
        }, 4000); // Tenta ligar de 4 em 4 segundos aos que faltam
        return () => clearInterval(interval);
    }, [tavernaAtivos, peerObj, isPresenteNaTaverna, meuNome, fazerChamada]);

    const trocarMicrofone = useCallback(async (deviceId) => {
        try {
            setSelectedMic(deviceId);
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: getAudioConstraints(deviceId, supressorAtivoRef.current)
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
            
            const newTrack = newStream.getAudioTracks()[0];
            if (newTrack) {
                const newClone = newTrack.clone();
                setStreamAnalisador(new MediaStream([newClone]));
            }
        } catch (err) { console.error("Erro ao trocar mic:", err); }
    }, [peerObj, streamAnalisador]);

    const trocarSpeaker = useCallback((deviceId) => { setSelectedSpeaker(deviceId); }, []);

    const toggleMute = useCallback(() => {
        setMutado(prev => {
            const isMutedNow = !prev;
            if (meuStreamRef.current && meuStreamRef.current.getAudioTracks()[0]) {
                meuStreamRef.current.getAudioTracks()[0].enabled = !isMutedNow;
            }
            return isMutedNow;
        });
    }, []);

    const toggleDeafen = useCallback(() => setSurdo(s => !s), []);

    return {
        meuStream, streamAnalisador, conexoes, mutado, surdo, voiceStatus, 
        mics, selectedMic, trocarMicrofone, 
        speakers, selectedSpeaker, trocarSpeaker,
        supressorAtivo, toggleMute, toggleDeafen, setSupressorAtivo, fazerChamada
    };
}