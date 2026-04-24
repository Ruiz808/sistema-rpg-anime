import React, { useState, useRef } from 'react';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null });

    const [mapasSalvos, setMapasSalvos] = useState({
        'Freljord': ['Acampamento Glacinata', 'Passe da Montanha'],
        'Demacia': ['Grande Praça', 'Posto Avançado'],
        'Noxus': ['Arena de Carnificina', 'Bastião Imortal']
    });

    const [mapasImagens, setMapasImagens] = useState({});

    const [reinoSelecionado, setReinoSelecionado] = useState(null);
    const [modoEdicaoMapa, setModoEdicaoMapa] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const [rotacaoGlobo, setRotacaoGlobo] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX || e.touches?.[0].clientX,
            y: e.clientY || e.touches?.[0].clientY
        };
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || e.touches?.[0].clientX;
        const currentY = e.clientY || e.touches?.[0].clientY;
        
        const diffX = currentX - dragStart.current.x;
        const diffY = currentY - dragStart.current.y;
        
        let novoY = rotacaoGlobo.y - diffY * 0.4;
        if (novoY > 70) novoY = 70;
        if (novoY < -70) novoY = -70;

        setRotacaoGlobo({
            x: rotacaoGlobo.x + diffX * 0.4,
            y: novoY
        });
        
        dragStart.current = { x: currentX, y: currentY };
    };

    const handleDragEnd = () => setIsDragging(false);

    const criarNovoMapa = () => {
        const nome = prompt("Digite o nome do novo mapa para " + reinoSelecionado + ":");
        if (nome && nome.trim() !== "") {
            setMapasSalvos(prev => ({
                ...prev,
                [reinoSelecionado]: [...(prev[reinoSelecionado] || []), nome]
            }));
        }
    };

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
    // 🌍 CAMADA 1: O GLOBO (ESCALA CORRETA E GRUDADO)
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
                    <h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>Visão Orbital</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Arraste em qualquer direção para inspecionar o planeta.</p>
                </div>

                <div style={{ position: 'relative', width: '350px', height: '350px', perspective: '1000px' }}>
                    
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#000814', border: '2px solid #0088ff', pointerEvents: 'none' }}></div>

                    <div 
                        onMouseDown={handleDragStart} onTouchStart={handleDragStart}
                        style={{
                            position: 'absolute', inset: 0,
                            transformStyle: 'preserve-3d',
                            transform: `rotateX(${rotacaoGlobo.y}deg) rotateY(${rotacaoGlobo.x}deg)`,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                    >
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateX(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateY(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateZ(45deg) rotateX(90deg)' }}></div>

                        {/* --- RUNETERRA --- */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            // 🔥 O SEGREDO ESTÁ AQUI: Recuado para 160px para não furar a esfera de 175px de raio!
                            transform: 'translateZ(160px)',
                            backfaceVisibility: 'hidden',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            {/* 🔥 TAMANHO REDUZIDO (140px) para caber na escala da lore! */}
                            <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '140px', height: '140px', filter: 'drop-shadow(0 0 3px rgba(0,255,204,0.8))' }}>
                                
                                <path d="M 12 55 L 18 45 L 30 38 L 42 35 L 55 30 L 70 28 L 85 25 L 100 28 L 115 32 L 125 30 L 135 38 L 142 42 L 140 52 L 132 58 L 122 56 L 115 65 L 105 72 L 95 68 L 82 72 L 68 80 L 52 75 L 40 82 L 25 72 L 15 75 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 45 92 L 58 85 L 75 82 L 95 84 L 110 88 L 118 82 L 128 92 L 138 105 L 132 120 L 142 135 L 135 148 L 125 152 L 115 168 L 105 160 L 92 168 L 75 162 L 62 152 L 48 142 L 38 125 L 42 108 L 40 98 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 152 28 L 162 20 L 175 18 L 182 25 L 185 38 L 178 50 L 182 62 L 172 72 L 160 75 L 150 65 L 148 50 L 145 38 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 165 115 L 175 112 L 185 118 L 188 128 L 182 138 L 170 140 L 160 130 L 162 120 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 145 88 L 152 82 L 158 88 L 152 95 Z" fill="rgba(0,255,204,0.15)" stroke="#00ffcc" strokeWidth="0.8" />
                                
                                <circle cx="162" cy="85" r="2" fill="#00ffcc" />
                                <line x1="105" y1="72" x2="110" y2="88" stroke="#ffcc00" strokeWidth="1.5" />
                                <circle cx="107.5" cy="80" r="2.5" fill="#ffcc00" /> 
                                <path d="M 42 35 L 45 50 L 52 60 L 68 80" fill="none" stroke="rgba(0,255,204,0.4)" strokeWidth="0.5" strokeDasharray="2 3" />
                                <path d="M 85 25 L 90 45 L 105 72" fill="none" stroke="rgba(0,255,204,0.4)" strokeWidth="0.5" strokeDasharray="2 3" />
                                <path d="M 95 84 L 102 110 L 92 168" fill="none" stroke="rgba(0,255,204,0.4)" strokeWidth="0.5" strokeDasharray="2 3" />
                                <path d="M 58 85 L 65 110 L 48 142" fill="none" stroke="rgba(0,255,204,0.4)" strokeWidth="0.5" strokeDasharray="2 3" />
                                <path d="M 162 20 L 165 45 L 160 75" fill="none" stroke="rgba(0,255,204,0.4)" strokeWidth="0.5" strokeDasharray="2 3" />
                                <circle cx="35" cy="55" r="1.5" fill="#fff" />
                                <circle cx="95" cy="45" r="1.5" fill="#fff" />
                                <circle cx="75" cy="120" r="1.5" fill="#fff" />
                            </svg>

                            <button 
                                onClick={() => entrarNoContinente('Runeterra')} 
                                style={{ pointerEvents: 'auto', background: 'rgba(0,255,204,0.15)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0,255,204,0.4)', backdropFilter: 'blur(5px)', zIndex: 10, fontSize: '0.75em' }}
                            >
                                🌍 RUNETERRA
                            </button>
                        </div>

                        {/* --- LADO DE TRÁS: TERRAS DESCONHECIDAS --- */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            transform: 'rotateY(180deg) translateZ(160px)',
                            backfaceVisibility: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <button 
                                style={{ pointerEvents: 'auto', background: 'rgba(255,0,60,0.15)', border: '1px solid #ff003c', color: '#ff003c', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255,0,60,0.4)', backdropFilter: 'blur(5px)', fontSize: '0.75em' }}
                            >
                                🌋 TERRAS DESCONHECIDAS
                            </button>
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        boxShadow: 'inset -40px -40px 60px rgba(0,0,0,0.9), inset 10px 10px 30px rgba(0,136,255,0.1)',
                        pointerEvents: 'none', zIndex: 20
                    }}></div>

                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE
    // ==========================================
    if (nivelVisao === 'continente') {
        const reinosRuneterra = [
            { nome: 'Freljord', top: '20%', left: '26%', cor: '#5dbcd2' },
            { nome: 'Demacia', top: '42%', left: '22%', cor: '#eedd82' },
            { nome: 'Noxus', top: '28%', left: '55%', cor: '#cc3333' },
            { nome: 'Ionia', top: '25%', left: '85%', cor: '#33cc99' },
            { nome: 'Piltover e Zaun', top: '50%', left: '55%', cor: '#ffcc00' },
            { nome: 'Águas de Sentina', top: '58%', left: '78%', cor: '#d28c2e' },
            { nome: 'Shurima', top: '75%', left: '48%', cor: '#e6b800' },
            { nome: 'Targon', top: '73%', left: '26%', cor: '#663399' },
            { nome: 'Ixtal', top: '70%', left: '68%', cor: '#339933' },
            { nome: 'Ilha das Sombras', top: '82%', left: '90%', cor: '#00e6b8' }
        ];

        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', background: '#0a0a0f', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '5px 15px', fontSize: '0.85em', cursor: 'pointer' }}>⬅ VOLTAR AO GLOBO</button>
                    <h2 style={{ color: '#0088ff', margin: 0, textShadow: '0 0 10px #0088ff', textTransform: 'uppercase', letterSpacing: '2px' }}>{localAtual.continente}</h2>
                    <div style={{ width: '120px' }}></div>
                </div>

                <div style={{ flex: 1, position: 'relative', backgroundImage: 'url("/runeterra-clean.jpg?v=2")', backgroundSize: '100% 100%' }}>
                    
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes ping-radar { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
                        .ping-container { position: absolute; width: 22px; height: 22px; border-radius: 50%; transform: translate(-50%, -50%); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-out; z-index: 5; background: #000; border: 2px solid #fff; animation: ping-radar 2s infinite; }
                        .ping-container:hover { width: 28px; height: 28px; border-color: #fff; z-index: 10; animation: none; }
                        .ping-nucleo { width: 10px; height: 10px; border-radius: 50%; transition: 0.2s; }
                        .ping-container:hover .ping-nucleo { width: 14px; height: 14px; background: #fff !important; box-shadow: 0 0 10px #fff !important; }
                        .ping-nome { position: absolute; bottom: -32px; background: rgba(0,0,0,0.85); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap; pointer-events: none; opacity: 0.8; transition: 0.2s; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #333; color: #fff; }
                        .ping-container:hover .ping-nome { opacity: 1; bottom: -36px; color: #fff; text-shadow: 0 0 5px #fff; border-color: #fff; }
                    `}} />

                    {reinosRuneterra.map((reino) => (
                        <div 
                            key={reino.nome}
                            className="ping-container"
                            onClick={() => abrirMenuReino(reino.nome)}
                            style={{ top: reino.top, left: reino.left, borderColor: reino.cor }}
                        >
                            <div className="ping-nucleo" style={{ background: reino.cor, boxShadow: `0 0 8px ${reino.cor}` }}></div>
                            <div className="ping-nome" style={{ borderColor: reino.cor, color: reino.cor }}>{reino.nome}</div>
                        </div>
                    ))}
                </div>

                {/* MODAL DE SELEÇÃO E CRIAÇÃO */}
                {reinoSelecionado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '15px', padding: '25px', width: '350px', textAlign: 'center', position: 'relative', boxShadow: '0 0 30px #0088ff' }}>
                            <button onClick={() => setReinoSelecionado(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: '#ff4444', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            
                            <h2 style={{ color: '#ffcc00', margin: '0 0 5px 0' }}>{reinoSelecionado}</h2>
                            <p style={{ color: '#888', fontSize: '0.9em', margin: '0 0 15px 0' }}>Selecione o cenário para esta região:</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                                {(mapasSalvos[reinoSelecionado] || []).map(mapa => (
                                    <button 
                                        key={mapa} 
                                        onClick={() => entrarNoMapaDeBatalha(mapa)} 
                                        style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', textAlign: 'left' }}
                                        onMouseEnter={(e) => e.target.style.borderColor='#0088ff'} 
                                        onMouseLeave={(e) => e.target.style.borderColor='#444'}
                                    >
                                        🗺️ {mapa}
                                    </button>
                                ))}
                                {!(mapasSalvos[reinoSelecionado]?.length) && <p style={{color: '#555', fontStyle: 'italic'}}>Nenhum mapa salvo nesta região.</p>}
                            </div>
                            
                            <button onClick={criarNovoMapa} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>
                                ➕ CRIAR NOVO MAPA
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // ⚔️ CAMADA 3: MAPA TÁTICO
    // ==========================================
    if (nivelVisao === 'reino') {
        const backgroundUrl = mapasImagens[localAtual.mapaId];

        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
                
                {/* Cabeçalho da Camada 3 */}
                <div style={{ background: '#111', padding: '10px 15px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ SAIR DO MAPA</button>
                        
                        <button onClick={() => {
                            setUrlInput(backgroundUrl || '');
                            setModoEdicaoMapa(true);
                        }} style={{ background: 'transparent', color: '#0088ff', border: '1px solid #0088ff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⚙️ EDITAR FUNDO</button>
                    </div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '1px' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                
                {/* ÁREA DO MAPA */}
                <div className="fade-in" style={{ 
                    flex: 1, 
                    position: 'relative', 
                    backgroundColor: '#050508',
                    backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none',
                    backgroundSize: '100% 100%', 
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    border: '1px solid #333',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    overflow: 'hidden'
                }}>
                    
                    {!backgroundUrl && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#444', border: '2px dashed #333', padding: '40px', borderRadius: '15px', pointerEvents: 'none', zIndex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Cenário Vazio</h3>
                            <p style={{ margin: 0 }}>Clique em <b>"⚙️ EDITAR FUNDO"</b> ali em cima para adicionar a imagem.</p>
                        </div>
                    )}

                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
                        {children}
                    </div>

                    {modoEdicaoMapa && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
                            <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '15px', padding: '25px', width: '400px', textAlign: 'center', boxShadow: '0 0 30px #0088ff', position: 'relative' }}>
                                <button onClick={() => setModoEdicaoMapa(false)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: '#ff4444', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                
                                <h3 style={{ color: '#0088ff', marginTop: '0', textTransform: 'uppercase' }}>Configurar Cenário</h3>
                                <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '20px' }}>Cole o Link (URL) de uma imagem na internet para servir de fundo para a batalha.</p>
                                
                                <input 
                                    type="text" 
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Ex: https://i.imgur.com/mapa.jpg"
                                    style={{ width: '90%', padding: '12px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff', marginBottom: '20px', fontSize: '14px' }}
                                />
                                
                                <button onClick={() => {
                                    setMapasImagens(prev => ({ ...prev, [localAtual.mapaId]: urlInput }));
                                    setModoEdicaoMapa(false);
                                }} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>
                                    💾 SALVAR IMAGEM
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}