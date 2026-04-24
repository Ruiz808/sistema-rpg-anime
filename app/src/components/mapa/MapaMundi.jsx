import React, { useState, useRef } from 'react';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null });

    // Estado para gerenciar os mapas de cada região
    const [mapasSalvos, setMapasSalvos] = useState({
        'Freljord': ['Acampamento Glacinata', 'Passe da Montanha'],
        'Demacia': ['Grande Praça', 'Posto Avançado'],
        'Noxus': ['Arena de Carnificina', 'Bastião Imortal']
    });

    // Estado para gerenciar os links das imagens de fundo de cada mapa
    const [mapasImagens, setMapasImagens] = useState({});

    const [reinoSelecionado, setReinoSelecionado] = useState(null);
    const [modoEdicaoMapa, setModoEdicaoMapa] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // 🔥 NOVO CONTROLE DO GLOBO (EIXO X e Y) 🔥
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
        
        // Trava para o globo não dar cambalhotas estranhas (limite de 70 graus para cima/baixo)
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

    // --- FUNÇÕES DE GERENCIAMENTO DE MAPA ---
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
    // 🌍 CAMADA 1: O GLOBO (ESFERA 3D REAL)
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

                {/* CONTAINER COM PERSPECTIVA 3D */}
                <div style={{ position: 'relative', width: '350px', height: '350px', perspective: '1000px' }}>
                    
                    {/* 1. O Oceano Escuro de Fundo */}
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#000814', border: '2px solid #0088ff', pointerEvents: 'none' }}></div>

                    {/* 2. O Motor do Eixo 3D (Onde a mágica acontece) */}
                    <div 
                        onMouseDown={handleDragStart} onTouchStart={handleDragStart}
                        style={{
                            position: 'absolute', inset: 0,
                            transformStyle: 'preserve-3d',
                            transform: `rotateX(${rotacaoGlobo.y}deg) rotateY(${rotacaoGlobo.x}deg)`,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                    >
                        {/* Linhas de Grade Holográficas presas ao núcleo */}
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateX(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', transform: 'rotateY(90deg)' }}></div>

                        {/* --- LADO DA FRENTE: RUNETERRA --- */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            transform: 'translateZ(175px)', // Empurra o continente para a casca do planeta (175px = metade de 350)
                            backfaceVisibility: 'hidden', // A mágica que esconde o continente quando ele vai paras as costas do globo!
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            {/* O Wireframe do Continente travado junto do botão */}
                            <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '250px', height: '250px' }}>
                                <path d="M 20 60 Q 40 20 90 25 Q 130 30 140 50 Q 150 70 120 75 Q 100 80 80 75 Q 40 80 20 60 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1.5" />
                                <path d="M 60 95 Q 90 85 130 90 Q 140 120 130 150 Q 100 170 70 150 Q 50 120 60 95 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1.5" />
                                <path d="M 155 30 Q 175 20 185 50 Q 165 80 145 60 Z" fill="rgba(0,255,204,0.05)" stroke="#00ffcc" strokeWidth="1.5" />
                            </svg>

                            <button 
                                onClick={() => entrarNoContinente('Runeterra')} 
                                style={{ pointerEvents: 'auto', background: 'rgba(0,255,204,0.15)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0,255,204,0.4)', backdropFilter: 'blur(5px)', zIndex: 10 }}
                            >
                                🌍 RUNETERRA
                            </button>
                        </div>

                        {/* --- LADO DE TRÁS: TERRAS SOMBRIAS (SÓ EXEMPLO) --- */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            transform: 'rotateY(180deg) translateZ(175px)', // Coloca exatamente do outro lado do mundo!
                            backfaceVisibility: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <button 
                                style={{ pointerEvents: 'auto', background: 'rgba(255,0,60,0.15)', border: '1px solid #ff003c', color: '#ff003c', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255,0,60,0.4)', backdropFilter: 'blur(5px)' }}
                            >
                                🌋 TERRAS SOMBRIAS
                            </button>
                        </div>
                    </div>

                    {/* 3. A Sombra do Mundo (Fica por cima de tudo pra dar o efeito redondo de bola) */}
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
                
                {/* ÁREA DO MAPA - Sem "Display Flex" para não empurrar o children! */}
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
                    
                    {/* Placeholder Flutuante */}
                    {!backgroundUrl && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#444', border: '2px dashed #333', padding: '40px', borderRadius: '15px', pointerEvents: 'none', zIndex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Cenário Vazio</h3>
                            <p style={{ margin: 0 }}>Clique em <b>"⚙️ EDITAR FUNDO"</b> ali em cima para adicionar a imagem.</p>
                        </div>
                    )}

                    {/* O GRID DO VTT */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
                        {children}
                    </div>

                    {/* MODAL DE EDIÇÃO DO FUNDO */}
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