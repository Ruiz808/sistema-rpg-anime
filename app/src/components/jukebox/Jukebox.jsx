import React, { useState } from 'react';

export default function Jukebox() {
    const [inputUrl, setInputUrl] = useState('');
    const [videoId, setVideoId] = useState(null);

    // Função mágica que extrai o ID de qualquer formato de link do YouTube
    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handlePlay = () => {
        const id = extractVideoId(inputUrl);
        if (id) {
            setVideoId(id);
        } else {
            alert('Link do YouTube inválido! Cole um link válido.');
        }
    };

    const handleStop = () => {
        setVideoId(null);
        setInputUrl('');
    };

    return (
        <div className="def-box" style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#00ffcc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎵 Mesa de Som (Trilha Sonora)
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input 
                    className="input-neon" 
                    type="text" 
                    placeholder="Cole o link do YouTube aqui... (Ex: https://youtu.be/...)" 
                    value={inputUrl} 
                    onChange={(e) => setInputUrl(e.target.value)} 
                    style={{ flex: 1, borderColor: '#00ffcc' }}
                />
                <button className="btn-neon btn-green" onClick={handlePlay} style={{ padding: '0 20px' }}>
                    ▶ TOCAR
                </button>
                <button className="btn-neon btn-red" onClick={handleStop} style={{ padding: '0 20px' }}>
                    ⏹ PARAR
                </button>
            </div>

            {/* O Player Embutido (Só aparece se houver música tocando) */}
            {videoId && (
                <div style={{ 
                    position: 'relative', 
                    paddingBottom: '25%', /* Altura reduzida para não ocupar muita tela */
                    height: '150px', 
                    overflow: 'hidden', 
                    borderRadius: '8px', 
                    border: '2px solid #00ffcc', 
                    boxShadow: '0 0 15px rgba(0,255,204,0.3)' 
                }}>
                    <iframe 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
                        title="YouTube audio player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            )}
        </div>
    );
}