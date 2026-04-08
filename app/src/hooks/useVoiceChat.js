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

export function useVoiceChat(meuNome, tavernaAtivos, isPresenteNaTaverna) {
    const [peerObj, setPeerObj] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const [conexoes, setConexoes] = useState([]);

    const [voiceStatus, setVoiceStatus] = useState('Fora da Taverna');
    const [mics, setMics] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
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
                    // Atende a chamada enviando a stream crua para manter o AEC do Chrome
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

    // 2. LIGAR/DESLIGAR O MICROFONE FÍSICO
    useEffect(() => {
        if (isPresenteNaTaverna && !rtcLigado.current) {
            rtcLigado.current = true;
            setVoiceStatus('A ligar Microfone...');

            navigator.mediaDevices.getUserMedia({
                audio: { noiseSuppression: supressorAtivoRef.current, echoCancellation: true, autoGainControl: true }
            }).then(async (stream) => {
                meuStreamRef.current = stream;
                setMeuStream(stream);
                setVoiceStatus('Online na Taverna!');

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                setMics(audioInputs);

                const bestMicId = encontrarMelhorMic(audioInputs);
                if (!bestMicId) return;

                setSelectedMic(bestMicId);
                const currentDeviceId = stream.getAudioTracks()[0]?.getSettings()?.deviceId;
                if (currentDeviceId && currentDeviceId === bestMicId) return; 

                try {
                    const correctStream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: { exact: bestMicId }, noiseSuppression: supressorAtivoRef.current, echoCancellation: true, autoGainControl: true }
                    });
                    stream.getTracks().forEach(t => t.stop());
                    meuStreamRef.current = correctStream;
                    setMeuStream(correctStream);
                } catch (err) {
                    console.warn('Não foi possível trocar para o mic preferido:', err);
                }
            }).catch(() => {
                setVoiceStatus('Microfone Bloqueado! Permitir acesso.');
                rtcLigado.current = false;
            });

        } else if (!isPresenteNaTaverna && rtcLigado.current) {
            rtcLigado.current = false;
            if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop());

            meuStreamRef.current = null;
            setMeuStream(null);
            setConexoes([]);
            setVoiceStatus('Fora da Taverna');
        }
    }, [isPresenteNaTaverna, supressorAtivo]);

    // 3. AUTO-DIALER ANTI-COLISÃO (Quem vem primeiro no alfabeto liga)
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
        if (!peerObj || !isPresenteNaTaverna) return;
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

    // 4. TROCA DE MICROFONE SEM CORTAR A CHAMADA (replaceTrack)
    const trocarMicrofone = useCallback(async (deviceId) => {
        try {
            setSelectedMic(deviceId);
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId }, noiseSuppression: supressorAtivoRef.current, echoCancellation: true, autoGainControl: true }
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

            meuStreamRef.current = newStream;
            setMeuStream(newStream);
        } catch (err) { console.error("Erro ao trocar mic:", err); }
    }, [peerObj]);

    // 5. FUNÇÃO DE MUTE NATIVO
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
        meuStream, conexoes, mutado, surdo, voiceStatus, mics, selectedMic,
        supressorAtivo, toggleMute, toggleDeafen, trocarMicrofone, setSupressorAtivo, fazerChamada
    };
}