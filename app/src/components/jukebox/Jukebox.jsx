import React, { useState, useEffect } from 'react';
import { enviarParaJukebox, iniciarListenerJukebox } from '../services/firebase-sync';

export default function Jukebox() {
    const [inputUrl, setInputUrl] = useState('');
    const [tocando, setTocando] = useState(false);

    useEffect(() => {
        const unsubscribe = iniciarListenerJukebox((dados) => {
            if (dados && dados.playing) {
                setInputUrl(dados.inputUrl || '');
                setTocando(true);
            } else {
                setTocando(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handlePlay = () => {
        const id = extractVideoId(inputUrl);
        if (id) {
            enviarParaJukebox({ videoId: id, inputUrl: inputUrl, playing: true });
        } else {
            alert('Link do YouTube inválido! Cole um link válido.');
        }
    };

    const handleStop = () => {
        enviarParaJukebox({ videoId: null, inputUrl: '', playing: false });
    };

    return (
        <div className="def-box" style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#00ffcc', marginBottom: 15, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎵 Mesa de Som (Controlo Mestre)
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
                    ▶ TOCAR PARA TODOS
                </button>
                <button className="btn-neon btn-red" onClick={handleStop} style={{ margin: 0, height: '44px', padding: '0 25px' }}>
                    ⏹ PARAR
                </button>
            </div>

            {tocando && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#0f0', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
                    <p>🎧 A TRANSMITIR MÚSICA PARA TODOS OS JOGADORES...</p>
                    <p style={{ fontSize: '0.8em', color: '#aaa', marginTop: '5px' }}>A música continua a tocar mesmo se mudar de aba.</p>
                </div>
            )}
        </div>
    );
}