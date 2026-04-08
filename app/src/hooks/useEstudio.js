import { useState, useRef, useEffect, useCallback } from 'react';

export function useEstudio() {
    const [isAtivo, setIsAtivo] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [statusInfo, setStatusInfo] = useState('Fora do Estúdio');
    
    const [mics, setMics] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [sensibilidade, setSensibilidade] = useState(() => {
        const saved = localStorage.getItem('rpg_sensibilidade_voz');
        return saved !== null ? parseInt(saved, 10) : 10;
    });

    // Streams
    const [rawStream, setRawStream] = useState(null); // Cabo A: Puro para a barrinha visual
    const [processedStream, setProcessedStream] = useState(null); // Cabo B: Passado pelo Gate para a IA gravar

    // Refs de Controle Interno (Fora do React State para evitar lag)
    const audioCtxRef = useRef(null);
    const gateGainRef = useRef(null);
    const rafRef = useRef(null);
    const isMutedRef = useRef(isMuted);

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { localStorage.setItem('rpg_sensibilidade_voz', sensibilidade); }, [sensibilidade]);

    // O CÉREBRO DO NOISE GATE (Isolado e ultra-leve)
    const iniciarMotorDeAudio = useCallback((stream) => {
        if (audioCtxRef.current) audioCtxRef.current.close();

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const actx = new AudioContext();
        audioCtxRef.current = actx;

        const source = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;

        const gainNode = actx.createGain();
        gainNode.gain.value = 0; // Começa fechado (Mudo)
        gateGainRef.current = gainNode;

        const dest = actx.createMediaStreamDestination();

        // Conexões
        source.connect(analyser);
        source.connect(gainNode);
        gainNode.connect(dest);

        setProcessedStream(dest.stream); // Esta é a stream que a IA vai gravar!

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let framesSilence = 0;

        const loop = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            let avg = sum / dataArray.length;

            const threshold = parseInt(localStorage.getItem('rpg_sensibilidade_voz')) || 10;

            if (avg > threshold) {
                framesSilence = 0;
                setIsSpeaking(true);
                if (gateGainRef.current) gateGainRef.current.gain.value = isMutedRef.current ? 0 : 1;
            } else {
                framesSilence++;
                if (framesSilence > 20) { // Corta o ruído se calado
                    setIsSpeaking(false);
                    if (gateGainRef.current) gateGainRef.current.gain.value = 0;
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    }, []);

    const ligarMicrofone = useCallback(async () => {
        setStatusInfo('A aceder ao Microfone...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
            });
            
            setRawStream(stream);
            iniciarMotorDeAudio(stream);

            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            setMics(audioInputs);
            if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);

            setIsAtivo(true);
            setStatusInfo('Microfone Ativo (Gravação Local)');
        } catch (error) {
            setStatusInfo('Erro: Permita o microfone no cadeado do navegador.');
            setIsAtivo(false);
        }
    }, [iniciarMotorDeAudio]);

    const desligarMicrofone = useCallback(() => {
        if (rawStream) rawStream.getTracks().forEach(t => t.stop());
        if (processedStream) processedStream.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        setRawStream(null);
        setProcessedStream(null);
        setIsAtivo(false);
        setIsSpeaking(false);
        setStatusInfo('Fora do Estúdio');
    }, [rawStream, processedStream]);

    const trocarMicrofone = useCallback(async (deviceId) => {
        setSelectedMic(deviceId);
        if (rawStream) rawStream.getTracks().forEach(t => t.stop());

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId }, noiseSuppression: true, echoCancellation: true, autoGainControl: true }
            });
            setRawStream(stream);
            iniciarMotorDeAudio(stream);
        } catch (err) {
            console.error("Erro ao trocar mic:", err);
        }
    }, [rawStream, iniciarMotorDeAudio]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (gateGainRef.current) gateGainRef.current.gain.value = next ? 0 : 1;
            return next;
        });
    }, []);

    return {
        isAtivo, isSpeaking, isMuted, statusInfo, mics, selectedMic, sensibilidade, rawStream, processedStream,
        ligarMicrofone, desligarMicrofone, trocarMicrofone, toggleMute, setSensibilidade
    };
}