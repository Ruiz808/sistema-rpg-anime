import React, { useState, useEffect } from 'react';
import { enviarParaJukebox, iniciarListenerJukebox } from '../services/firebase-sync';

export default function Jukebox() {
    const [inputUrl, setInputUrl] = useState('');
    const [videoId, setVideoId] = useState(null);

    // O "Ouvido" Global: Assim que a página carrega, fica à escuta do Firebase
    useEffect(() => {
        const unsubscribe = iniciarListenerJukebox((dados) => {
            if (dados && dados.playing && dados.videoId) {
                setVideoId(dados.videoId);
                setInputUrl(dados.inputUrl || '');
            } else {
                // Se receber a ordem de parar, limpa tudo
                setVideoId(null);
                setInputUrl('');
            }
        });

        // Limpa o ouvido se o jogador fechar a aba
        return () => unsubscribe();
    }, []);

    // Função mágica que extrai o ID de qualquer formato de link do YouTube
    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handlePlay = () => {
        const id = extractVideoId(inputUrl);
        if (id) {
            // Em vez de tocar apenas no local, ENVIA PARA O FIREBASE GLOBAL
            enviarParaJukebox({ 
                videoId: id, 
                inputUrl: inputUrl, 
                playing: true 
            });
        } else {
            alert('Link do YouTube inválido! Cole um link válido.');
        }
    };

    const handleStop = () => {
        // Envia ordem para o Firebase PARAR a música de todos
        enviarParaJukebox({ 
            videoId: null, 
            inputUrl: '', 
            playing: false 
        });
    };

    return (
        <div className="def-box" style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#00ffcc', marginBottom: 15, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎵 Mesa de Som Global (Sincronizada)
            </h3>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto', 
                gap: '15px', 
                marginBottom: '20px',
                alignItems: 'center'
            }}>
                <input 
                    className="input-neon" 
                    type="text" 
                    placeholder="Cole o link do YouTube aqui... (Ex: https://youtu.be/...)" 
                    value={inputUrl} 
                    onChange={(e) => setInputUrl(e.target.value)} 
                    style={{ width: '100%', margin: 0, borderColor: '#00ffcc', color: '#fff' }}
                />
                <button 
                    className="btn-neon btn-green" 
                    onClick={handlePlay} 
                    style={{ margin: 0, height: '44px', padding: '0 25px' }}
                >
                    ▶ TOCAR PARA TODOS
                </button>
                <button 
                    className="btn-neon btn-red" 
                    onClick={handleStop} 
                    style={{ margin: 0, height: '44px', padding: '0 25px' }}
                >
                    ⏹ PARAR MÚSICA
                </button>
            </div>

            {/* O Player Embutido */}
            {videoId && (
                <div style={{ 
                    position: 'relative', 
                    paddingBottom: '25%', 
                    height: '200px', 
                    overflow: 'hidden', 
                    borderRadius: '8px', 
                    border: '2px solid #00ffcc', 
                    boxShadow: '0 0 15px rgba(0,255,204,0.3)',
                    background: '#000'
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