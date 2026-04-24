import React, { useState, useRef } from 'react';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null });

    // Estado para o Modal de Seleção de Mapas
    const [reinoSelecionado, setReinoSelecionado] = useState(null);

    // Controle do Globo Giratório (Drag)
    const [rotacaoGlobo, setRotacaoGlobo] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);

    // --- LÓGICA DO GLOBO INTERATIVO ---
    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStartX.current = e.clientX || e.touches?.[0].clientX;
    };
    const handleDragMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || e.touches?.[0].clientX;
        const diferenca = currentX - dragStartX.current;
        setRotacaoGlobo((prev) => prev + diferenca * 0.5);
        dragStartX.current = currentX;
    };
    const handleDragEnd = () => setIsDragging(false);

    // --- NAVEGAÇÃO ---
    const entrarNoContinente = (nomeContinente) => {
        setLocalAtual({ continente: nomeContinente, reino: null, mapaId: null });
        setNivelVisao('continente');
    };

    const abrirMenuReino = (nomeReino) => {
        setReinoSelecionado(nomeReino);
    };

    const entrarNoMapaDeBatalha = (mapaEscolhido) => {
        setLocalAtual({ ...localAtual, reino: reinoSelecionado, mapaId: mapaEscolhido });
        setReinoSelecionado(null);
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
    // 🌍 CAMADA 1: O GLOBO (WIREFRAME ORBITAL 3D)
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div 
                className="fade-in" 
                style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden' }}
                onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
                onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
            >
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, letterSpacing: '3px', textShadow: '0 0 10px #00ffcc', textTransform: 'uppercase' }}>Visão Orbital</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Arraste para girar o planeta.</p>
                </div>

                <div 
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    style={{
                        width: '350px', height: '350px', borderRadius: '50%',
                        backgroundColor: '#000814', border: '2px solid #0088ff',
                        boxShadow: '0 0 50px rgba(0,136,255,0.3), inset -40px -40px 60px #000, inset 10px 10px 30px rgba(0,136,255,0.2)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateX(75deg)' }}></div>
                    <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateY(75deg)' }}></div>

                    <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '200%', height: '100%', transform: `translateX(${(rotacaoGlobo % 400) - 100}px)`, opacity: 0.5, pointerEvents: 'none' }}>
                        <path d="M 10 50 Q 30 30 70 35 L 120 40 Q 140 50 130 65 L 110 75 L 80 70 L 40 75 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1" />
                        <path d="M 50 90 L 80 85 L 110 88 Q 130 110 120 140 L 90 160 Q 60 145 40 120 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1" />
                        <path d="M 140 35 Q 160 25 170 50 L 160 75 Q 145 65 135 55 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1" />
                    </svg>

                    <button 
                        onClick={() => entrarNoContinente('Runeterra')} 
                        style={{ position: 'absolute', background: 'rgba(0,255,204,0.15)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em', backdropFilter: 'blur(5px)', zIndex: 10, transform: `translateX(${Math.sin(rotacaoGlobo * 0.01) * 30}px)`, boxShadow: '0 0 15px rgba(0,255,204,0.4)' }}
                    >
                        🌍 RUNETERRA
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE (PING AMARELO)
    // ==========================================
    if (nivelVisao === 'continente') {
        
        // 🔥 COORDENADAS ORIGINAIS E SEGURAS 🔥
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
            <div className="fade-in" style={{ width: '100%', height: '65vh', background: '#0a0a0f', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '6px 12px', fontSize: '0.85em' }}>⬅ Voltar ao Globo</button>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#0088ff', margin: 0, textShadow: '0 0 10px #0088ff', textTransform: 'uppercase', letterSpacing: '2px' }}>{localAtual.continente}</h2>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Sistemas de Rastreamento Ativos. Selecione uma região.</span>
                    </div>
                    <div style={{ width: '120px' }}></div>
                </div>

                <div style={{ 
                    flex: 1, position: 'relative', width: '100%', height: '100%',
                    backgroundImage: 'url("/runeterra-clean.jpg?v=2")', 
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
                }}>
                    
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes ping-radar {
                            0% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.6); }
                            70% { box-shadow: 0 0 0 15px rgba(255, 204, 0, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
                        }
                        .ping-container { position: absolute; width: 20px; height: 20px; border-radius: 50%; transform: translate(-50%, -50%); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-out; z-index: 5; background: #000; border: 2px solid #ffcc00; animation: ping-radar 2s infinite; }
                        .ping-container:hover { width: 26px; height: 26px; background: #111; border-color: #fff; z-index: 10; animation: none; box-shadow: 0 0 15px #ffcc00; }
                        .ping-nucleo { width: 8px; height: 8px; background: #ffcc00; border-radius: 50%; box-shadow: 0 0 8px #ffcc00; transition: 0.2s; }
                        .ping-container:hover .ping-nucleo { width: 12px; height: 12px; background: #fff; box-shadow: 0 0 10px #fff; }
                        .ping-nome { position: absolute; bottom: -32px; background: #000; padding: 4px 10px; border-radius: 6px; color: #ffcc00; font-size: 11px; font-weight: bold; white-space: nowrap; pointer-events: none; opacity: 0.8; transition: 0.2s; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #ffcc00; }
                        .ping-container:hover .ping-nome { opacity: 1; bottom: -36px; color: #fff; border-color: #fff; text-shadow: 0 0 5px #fff; box-shadow: 0 0 10px rgba(255, 204, 0, 0.5); }
                    `}} />

                    {reinosRuneterra.map((reino) => (
                        <div 
                            key={reino.nome}
                            className="ping-container"
                            // AQUI É ONDE ELE ABRE O MENU AO INVÉS DE IR DIRETO!
                            onClick={() => abrirMenuReino(reino.nome)}
                            style={{ top: reino.top, left: reino.left }}
                        >
                            <div className="ping-nucleo"></div>
                            <div className="ping-nome">{reino.nome}</div>
                        </div>
                    ))}
                </div>

                {/* MODAL DE SELEÇÃO DE MAPAS */}
                {reinoSelecionado && (
                    <div className="fade-in" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '15px', padding: '25px', width: '350px', textAlign: 'center', boxShadow: '0 0 30px #0088ff', position: 'relative' }}>
                            <button onClick={() => setReinoSelecionado(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: '#ff4444', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            
                            <h2 style={{ color: '#ffcc00', marginTop: '10px' }}>{reinoSelecionado}</h2>
                            <p style={{ color: '#888', fontSize: '0.9em' }}>Selecione o cenário para esta região:</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
                                <button onClick={() => entrarNoMapaDeBatalha('capital_central')} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.borderColor='#0088ff'} onMouseLeave={(e) => e.target.style.borderColor='#444'}>🏰 Capital Real (Tático)</button>
                                <button onClick={() => entrarNoMapaDeBatalha('floresta_perigosa')} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.borderColor='#0088ff'} onMouseLeave={(e) => e.target.style.borderColor='#444'}>🌲 Floresta Proibida</button>
                                <button style={{ background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>➕ NOVO MAPA</button>
                            </div>
                        </div>
                    </div>
                )}
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
                        {/* ID DO MAPA AGORA APARECE AQUI PARA MOSTRAR QUE DEU CERTO! */}
                        <span style={{ color: '#aaa', fontSize: '0.75em' }}>Mergulho Tático: {localAtual.mapaId}</span>
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