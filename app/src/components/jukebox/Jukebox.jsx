import React, { useState, useEffect } from 'react';
import { enviarParaJukebox, iniciarListenerJukebox } from '../../services/firebase-sync';

export default function Jukebox() {
    const [inputUrl, setInputUrl] = useState('');
    const [tocando, setTocando] = useState(false);
    const [videoId, setVideoId] = useState(null);

    // O Ouvido Global: Escuta o Firebase (se as regras permitirem)
    useEffect(() => {
        const unsubscribe = iniciarListenerJukebox((dados) => {
            if (dados && dados.playing && dados.videoId) {
                setInputUrl(dados.inputUrl || '');
                setVideoId(dados.videoId);
                setTocando(true);
            } else if (dados && !dados.playing) {
                setVideoId(null);
                setTocando(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Extrator de Links Blindado
    const extractVideoId = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
            if (urlObj.hostname.includes('youtu.be')) return urlObj.pathname.slice(1);
        } catch (e) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }
        return null;
    };

    const handlePlay = () => {
        const id = extractVideoId(inputUrl);
        if (id) {
            // 1. LIGA O SOM IMEDIATAMENTE NA SUA TELA (Ignora se o Firebase está bloqueado hoje)
            setVideoId(id);
            setTocando(true);
            
            // 2. Tenta enviar para a base de dados (Amanhã, quando o seu amigo alterar as regras, isto espalha o som para os outros!)
            enviarParaJukebox({ videoId: id, inputUrl: inputUrl, playing: true });
        } else {
            alert('Link do YouTube inválido! Tente pegar o link de "Compartilhar" do vídeo.');
        }
    };

    const handleStop = () => {
        // Pára imediatamente para si
        setVideoId(null);
        setTocando(false);
        // Tenta parar para os outros
        enviarParaJukebox({ videoId: null, inputUrl: '', playing: false });
    };

    return (
        <div className="def-box" style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#00ffcc', marginBottom: 15, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎵 Mesa de Som (Controlo Mestre & Leitor)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '15px', alignItems: 'center' }}>
                <input 
                    className="input-neon" 
                    type="text" 
                    placeholder="Cole o link do YouTube aqui..." 
                    value={inputUrl} 
                    onChange={(e) => setInputUrl(e.target.value)} 
                    style={{ width: '100%', margin: 0, borderColor: tocando ? '#0f0' : '#00ffcc', color: '#fff' }}
                />
                <button className="btn-neon btn-green" onClick={handlePlay} style={{ margin: 0, height: '44px', padding: '0 25px' }}>
                    ▶ TOCAR MÚSICA
                </button>
                <button className="btn-neon btn-red" onClick={handleStop} style={{ margin: 0, height: '44px', padding: '0 25px' }}>
                    ⏹ PARAR
                </button>
            </div>

            {tocando && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#0f0', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
                    <p>🎧 A TRANSMITIR MÚSICA...</p>
                    <p style={{ fontSize: '0.8em', color: '#aaa', marginTop: '5px' }}>
                        Nota: Se os jogadores não estiverem a ouvir, avise o Mestre dos Servidores amanhã para liberar as regras da Jukebox no Firebase!
                    </p>
                </div>
            )}

            {videoId && (
                <div style={{ 
                    marginTop: '20px', position: 'relative', paddingBottom: '25%', height: '200px', 
                    overflow: 'hidden', borderRadius: '8px', border: '2px solid #00ffcc', background: '#000'
                }}>
                    <iframe 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`} 
                        title="YouTube audio player" frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            )}
        </div>
    );
}