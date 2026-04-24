import React, { useState } from 'react';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null });

    const entrarNoContinente = (nomeContinente) => {
        setLocalAtual({ continente: nomeContinente, reino: null });
        setNivelVisao('continente');
    };

    const entrarNoReino = (nomeReino) => {
        setLocalAtual({ ...localAtual, reino: nomeReino });
        setNivelVisao('reino');
    };

    const voltarCamera = () => {
        if (nivelVisao === 'reino') setNivelVisao('continente');
        else if (nivelVisao === 'continente') {
            setNivelVisao('globo');
            setLocalAtual({ continente: null, reino: null });
        }
    };

    // ==========================================
    // 🌍 CAMADA 1: O GLOBO
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 50px rgba(0,136,255,0.1)' }}>
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center' }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, letterSpacing: '3px', textShadow: '0 0 10px #00ffcc', textTransform: 'uppercase' }}>O Multiverso</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Selecione um Continente para focar a visão orbital.</p>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin-globe { 100% { transform: rotate(360deg); } }
                    .globo-esfera {
                        width: 350px; height: 350px; border-radius: 50%;
                        background: radial-gradient(circle at 30% 30%, #003366, #000510);
                        border: 2px solid #0088ff;
                        box-shadow: 0 0 40px rgba(0,136,255,0.4), inset -20px -20px 40px rgba(0,0,0,0.8);
                        position: relative;
                        animation: spin-globe 40s linear infinite;
                    }
                    .btn-continente {
                        position: absolute; background: rgba(0,255,204,0.1); border: 1px solid #00ffcc;
                        color: #00ffcc; padding: 8px 12px; border-radius: 20px; cursor: pointer;
                        box-shadow: 0 0 10px rgba(0,255,204,0.3); font-weight: bold; font-size: 0.85em;
                        transition: 0.3s;
                    }
                    .btn-continente:hover { background: #00ffcc; color: #000; box-shadow: 0 0 20px #00ffcc; transform: scale(1.1); }
                `}} />

                <div className="globo-esfera">
                    <button onClick={() => entrarNoContinente('Runeterra')} className="btn-continente" style={{ top: '35%', left: '15%' }}>
                        🌍 Runeterra
                    </button>
                    <button onClick={() => entrarNoContinente('Terras Sombrias')} className="btn-continente" style={{ top: '60%', right: '15%', borderColor: '#ff003c', color: '#ff003c', boxShadow: '0 0 10px rgba(255,0,60,0.3)' }}>
                        🌋 Terras Sombrias
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE (PING AMARELO)
    // ==========================================
    if (nivelVisao === 'continente') {
        
        // 🔥 COORDENADAS (Sem emojis, tudo no padrão Ping) 🔥
        const reinosRuneterra = [
            { nome: 'Freljord', top: '15%', left: '22%' },
            { nome: 'Demacia', top: '34%', left: '17%' },
            { nome: 'Noxus', top: '23%', left: '44%' },
            { nome: 'Ionia', top: '20%', left: '74%' },
            { nome: 'Piltover e Zaun', top: '45.5%', left: '55%' },
            { nome: 'Águas de Sentina', top: '58%', left: '75%' },
            { nome: 'Shurima', top: '75%', left: '47%' },
            { nome: 'Targon', top: '77%', left: '27%' },
            { nome: 'Ixtal', top: '73%', left: '60%' }, 
            { nome: 'Ilha das Sombras', top: '81%', left: '85%' }
        ];

        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', background: '#0a0a0f', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '6px 12px', fontSize: '0.85em' }}>⬅ Voltar ao Globo</button>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#0088ff', margin: 0, textShadow: '0 0 10px #0088ff', textTransform: 'uppercase', letterSpacing: '2px' }}>{localAtual.continente}</h2>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Sistemas de Rastreamento Ativos. Selecione uma região.</span>
                    </div>
                    <div style={{ width: '120px' }}></div>
                </div>

                {/* IMAGEM LIMPA PUXANDO DA PASTA PUBLIC */}
                <div style={{ 
                    flex: 1, position: 'relative', width: '100%', height: '100%',
                    backgroundImage: 'url("/runeterra-clean.jpg")', 
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
                }}>
                    
                    <style dangerouslySetInnerHTML={{__html: `
                        /* Animação do Ping no Mapa */
                        @keyframes ping-radar {
                            0% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.6); }
                            70% { box-shadow: 0 0 0 15px rgba(255, 204, 0, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
                        }

                        .ping-container {
                            position: absolute;
                            width: 20px; height: 20px; 
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                            cursor: pointer;
                            display: flex; justify-content: center; align-items: center;
                            transition: all 0.2s ease-out;
                            z-index: 5;
                            background: #000;
                            border: 2px solid #ffcc00;
                            animation: ping-radar 2s infinite;
                        }

                        .ping-container:hover {
                            width: 26px; height: 26px;
                            background: #111;
                            border-color: #fff;
                            z-index: 10;
                            animation: none;
                            box-shadow: 0 0 15px #ffcc00;
                        }

                        .ping-nucleo {
                            width: 8px; height: 8px;
                            background: #ffcc00;
                            border-radius: 50%;
                            box-shadow: 0 0 8px #ffcc00;
                            transition: 0.2s;
                        }

                        .ping-container:hover .ping-nucleo {
                            width: 12px; height: 12px;
                            background: #fff;
                            box-shadow: 0 0 10px #fff;
                        }

                        .ping-nome {
                            position: absolute;
                            bottom: -32px; 
                            background: #000;
                            padding: 4px 10px;
                            border-radius: 6px;
                            color: #ffcc00;
                            font-size: 11px;
                            font-weight: bold;
                            white-space: nowrap;
                            pointer-events: none;
                            opacity: 0.8; 
                            transition: 0.2s;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border: 1px solid #ffcc00;
                        }

                        .ping-container:hover .ping-nome {
                            opacity: 1;
                            bottom: -36px;
                            color: #fff;
                            border-color: #fff;
                            text-shadow: 0 0 5px #fff;
                            box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
                        }
                    `}} />

                    {reinosRuneterra.map((reino) => (
                        <div 
                            key={reino.nome}
                            className="ping-container"
                            onClick={() => entrarNoReino(reino.nome)}
                            style={{ top: reino.top, left: reino.left }}
                        >
                            {/* Núcleo amarelo */}
                            <div className="ping-nucleo"></div>
                            
                            {/* Etiqueta de nome */}
                            <div className="ping-nome">
                                {reino.nome}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ==========================================
    // ⚔️ CAMADA 3: O REINO (GRID TÁTICO)
    // ==========================================
    if (nivelVisao === 'reino') {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '4px 12px', fontSize: '0.85em' }}>⬅ Voltar a Runeterra</button>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#ffcc00', margin: 0, textShadow: '0 0 10px #ffcc00', textTransform: 'uppercase', letterSpacing: '1px' }}>{localAtual.reino}</h3>
                        <span style={{ color: '#aaa', fontSize: '0.75em' }}>Mergulho Tático Ativo</span>
                    </div>
                    <div style={{ width: '120px' }}></div>
                </div>
                
                <div className="fade-in" style={{ position: 'relative' }}>
                    {children}
                </div>
            </div>
        );
    }

    return null;
}