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
    googNoiseSuppression: supressor,
    googHighpassFilter: true
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

    // 🔥 Gerenciamento de Sensibilidade
    const [sensibilidadeVoz, setSensibilidadeVoz] = useState(() => {
        const saved = localStorage.getItem('rpg_sensibilidade_voz');
        return saved !== null ? parseInt(saved) : 10;
    });

    const meuStreamRef = useRef(null);
    const conexoesRef = useRef([]);
    const chamadasEmAndamento = useRef(new Set());
    const rtcLigado = useRef(false);

    const meuIDTelefone = meuNome ? meuNome.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    useEffect(() => { conexoesRef.current = conexoes; }, [conexoes]);
    useEffect(() => { localStorage.setItem('rpg_sensibilidade_voz', sensibilidadeVoz); }, [sensibilidadeVoz]);

    useEffect(() => {
        if (!meuIDTelefone || peerObj) return;
        const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`, {
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
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
                } else { setTimeout(attemptAnswer, 500); }
            };
            attemptAnswer();
        });
        return () => novoPeer.destroy();
    }, [meuIDTelefone]);

    useEffect(() => {
        if (isPresenteNaTaverna && !rtcLigado.current) {
            rtcLigado.current = true;
            navigator.mediaDevices.getUserMedia({ audio: getAudioConstraints(null, supressorAtivo) })
            .then(async (stream) => {
                meuStreamRef.current = stream;
                setMeuStream(stream);
                const track = stream.getAudioTracks()[0];
                if (track) setStreamAnalisador(new MediaStream([track.clone()]));
                
                const devices = await navigator.mediaDevices.enumerateDevices();
                const inputs = devices.filter(d => d.kind === 'audioinput');
                const outputs = devices.filter(d => d.kind === 'audiooutput');
                setMics(inputs);
                setSpeakers(outputs);

                const bestMic = encontrarMelhorMic(inputs);
                if (bestMic) setSelectedMic(bestMic);
                if (outputs.length > 0) setSelectedSpeaker(outputs[0].deviceId);
                setVoiceStatus('Online na Taverna!');
            });
        } else if (!isPresenteNaTaverna && rtcLigado.current) {
            rtcLigado.current = false;
            if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop());
            setMeuStream(null);
            setConexoes([]);
        }
    }, [isPresenteNaTaverna, supressorAtivo]);

    const trocarMicrofone = useCallback(async (deviceId) => {
        setSelectedMic(deviceId);
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: getAudioConstraints(deviceId, supressorAtivo) });
        if (meuStreamRef.current) meuStreamRef.current.getTracks().forEach(t => t.stop());
        meuStreamRef.current = newStream;
        setMeuStream(newStream);
    }, [supressorAtivo]);

    const trocarSpeaker = useCallback((deviceId) => setSelectedSpeaker(deviceId), []);
    const toggleMute = useCallback(() => setMutado(m => {
        if (meuStreamRef.current) meuStreamRef.current.getAudioTracks()[0].enabled = m;
        return !m;
    }), []);
    const toggleDeafen = useCallback(() => setSurdo(s => !s), []);

    return {
        meuStream, streamAnalisador, conexoes, mutado, surdo, voiceStatus, 
        mics, selectedMic, trocarMicrofone, 
        speakers, selectedSpeaker, trocarSpeaker,
        supressorAtivo, toggleMute, toggleDeafen, setSupressorAtivo,
        sensibilidadeVoz, setSensibilidadeVoz
    };
}