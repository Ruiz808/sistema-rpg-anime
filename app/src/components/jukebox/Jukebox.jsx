import React, { useState, useEffect, useRef, useCallback } from 'react';
import { enviarParaJukebox, iniciarListenerJukebox } from '../../services/firebase-sync';

let ytApiReady = false;
let ytApiLoading = false;
const ytApiCallbacks = [];

function carregarYouTubeApi() {
    if (window.YT && window.YT.Player) {
        ytApiReady = true;
        return Promise.resolve();
    }
    if (ytApiReady) return Promise.resolve();
    if (ytApiLoading) {
        return new Promise(resolve => ytApiCallbacks.push(resolve));
    }
    ytApiLoading = true;
    return new Promise((resolve) => {
        ytApiCallbacks.push(resolve);
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            ytApiReady = true;
            ytApiLoading = false;
            if (prevCallback) prevCallback();
            ytApiCallbacks.forEach(cb => cb());
            ytApiCallbacks.length = 0;
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    });
}

export default function Jukebox() {
    const [inputUrl, setInputUrl] = useState('');
    const [tocando, setTocando] = useState(false);
    const [videoId, setVideoId] = useState(null);
    const [pausado, setPausado] = useState(false);

    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const ignorandoEventoLocal = useRef(false);
    const estadoRemotoRef = useRef({ playing: false, videoId: null });
    const inputUrlRef = useRef(inputUrl);

    useEffect(() => { inputUrlRef.current = inputUrl; }, [inputUrl]);

    const extractVideoId = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.startsWith('/shorts/')) return urlObj.pathname.split('/shorts/')[1];
                return urlObj.searchParams.get('v');
            }
            if (urlObj.hostname.includes('youtu.be')) return urlObj.pathname.slice(1);
        } catch (e) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }
        return null;
    };

    const destruirPlayer = useCallback(() => {
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
            playerRef.current = null;
        }
    }, []);

    const criarPlayer = useCallback((vid, autoplay) => {
        if (!containerRef.current || !ytApiReady) return;
        destruirPlayer();

        const divPlayer = document.createElement('div');
        divPlayer.id = 'yt-jukebox-player';
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(divPlayer);

        playerRef.current = new window.YT.Player('yt-jukebox-player', {
            height: '200',
            width: '100%',
            videoId: vid,
            playerVars: {
                autoplay: autoplay ? 1 : 0,
                loop: 1,
                playlist: vid,
                controls: 1,
                modestbranding: 1
            },
            events: {
                onStateChange: (event) => {
                    if (ignorandoEventoLocal.current) return;

                    const state = event.data;
                    if (state === window.YT.PlayerState.PAUSED) {
                        setPausado(true);
                        setTocando(false);
                        enviarParaJukebox({
                            videoId: estadoRemotoRef.current.videoId || vid,
                            inputUrl: inputUrlRef.current,
                            playing: false
                        });
                    } else if (state === window.YT.PlayerState.PLAYING) {
                        setPausado(false);
                        setTocando(true);
                        enviarParaJukebox({
                            videoId: estadoRemotoRef.current.videoId || vid,
                            inputUrl: inputUrlRef.current,
                            playing: true
                        });
                    }
                }
            }
        });
    }, [destruirPlayer]);

    useEffect(() => {
        const unsubscribe = iniciarListenerJukebox((dados) => {
            if (!dados) return;

            const prev = estadoRemotoRef.current;
            if (dados.videoId === prev.videoId && dados.playing === prev.playing) return;
            estadoRemotoRef.current = dados;

            if (dados.videoId && /^[a-zA-Z0-9_-]{11}$/.test(dados.videoId)) {
                setInputUrl(prevUrl => dados.inputUrl || prevUrl);
                setVideoId(dados.videoId);

                if (dados.playing) {
                    setTocando(true);
                    setPausado(false);
                } else {
                    setTocando(false);
                    setPausado(true);
                }
            } else if (!dados.playing) {
                setVideoId(null);
                setTocando(false);
                setPausado(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!videoId) {
            destruirPlayer();
            return;
        }

        carregarYouTubeApi().then(() => {
            criarPlayer(videoId, estadoRemotoRef.current.playing);
        });
    }, [videoId, destruirPlayer, criarPlayer]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player || typeof player.getPlayerState !== 'function') return;

        ignorandoEventoLocal.current = true;
        try {
            if (tocando) {
                const state = player.getPlayerState();
                if (state !== window.YT.PlayerState.PLAYING) {
                    player.playVideo();
                }
            } else if (pausado) {
                const state = player.getPlayerState();
                if (state === window.YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                }
            }
        } catch (e) { /* player not ready */ }
        setTimeout(() => { ignorandoEventoLocal.current = false; }, 500);
    }, [tocando, pausado]);

    const handlePlay = () => {
        const id = extractVideoId(inputUrl);
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
            setVideoId(id);
            setTocando(true);
            setPausado(false);
            enviarParaJukebox({ videoId: id, inputUrl: inputUrl, playing: true });
        } else {
            alert('Link do YouTube inválido! Tente pegar o link de "Compartilhar" do vídeo.');
        }
    };

    const handlePause = () => {
        if (!videoId) return;
        setTocando(false);
        setPausado(true);
        enviarParaJukebox({ videoId: videoId, inputUrl: inputUrl, playing: false });
    };

    const handleStop = () => {
        setVideoId(null);
        setTocando(false);
        setPausado(false);
        destruirPlayer();
        enviarParaJukebox({ videoId: null, inputUrl: '', playing: false });
    };

    return (
        <div className="def-box" style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#00ffcc', marginBottom: 15, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎵 Mesa de Som (Controlo Mestre & Leitor)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '15px', alignItems: 'center' }}>
                <input
                    className="input-neon"
                    type="text"
                    placeholder="Cole o link do YouTube aqui..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    style={{ width: '100%', margin: 0, borderColor: tocando ? '#0f0' : '#00ffcc', color: '#fff' }}
                />
                <button className="btn-neon btn-green" onClick={handlePlay} style={{ margin: 0, height: '44px', padding: '0 25px' }}>
                    ▶ TOCAR
                </button>
                <button className="btn-neon" onClick={handlePause} disabled={!videoId} style={{ margin: 0, height: '44px', padding: '0 25px', opacity: videoId ? 1 : 0.4 }}>
                    ⏸ PAUSAR
                </button>
                <button className="btn-neon btn-red" onClick={handleStop} style={{ margin: 0, height: '44px', padding: '0 25px' }}>
                    ⏹ PARAR
                </button>
            </div>

            {(tocando || pausado) && videoId && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: tocando ? '#0f0' : '#ffcc00', letterSpacing: '2px', textShadow: `0 0 10px ${tocando ? 'rgba(0,255,0,0.5)' : 'rgba(255,204,0,0.5)'}` }}>
                    <p>{tocando ? '🎧 A TRANSMITIR MÚSICA...' : '⏸ MÚSICA EM PAUSA'}</p>
                </div>
            )}

            <div ref={containerRef} style={{
                marginTop: '20px', height: '200px',
                overflow: 'hidden', borderRadius: '8px', border: '2px solid #00ffcc', background: '#000',
                display: videoId ? 'block' : 'none'
            }} />
        </div>
    );
}
