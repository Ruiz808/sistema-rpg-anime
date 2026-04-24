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
    const [mapasImagens, setMapasImagens] = useState({
        // Exemplo de como a memória guarda:
        // 'Acampamento Glacinata': 'https://link-da-imagem.jpg'
    });

    const [reinoSelecionado, setReinoSelecionado] = useState(null);

    // Controle do Globo Giratório
    const [rotacaoGlobo, setRotacaoGlobo] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);

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

    const editarFundoMapa = () => {
        const urlAtual = mapasImagens[localAtual.mapaId] || '';
        const novaUrl = prompt(`Cole o Link (URL) da imagem para o cenário "${localAtual.mapaId}":\n(Dica: Use links terminados em .png ou .jpg)`, urlAtual);
        
        if (novaUrl !== null) { // Se não cancelou o prompt
            setMapasImagens(prev => ({
                ...prev,
                [localAtual.mapaId]: novaUrl
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
    // 🌍 CAMADA 1: O GLOBO
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div 
                className="fade-in" 
                style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden' }}
                onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
            >
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10 }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>Visão Orbital</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Arraste para girar o planeta.</p>
                </div>

                <div 
                    onMouseDown={handleDragStart}
                    style={{
                        width: '350px', height: '350px', borderRadius: '50%',
                        backgroundColor: '#000814', border: '2px solid #0088ff',
                        boxShadow: '0 0 50px rgba(0,136,255,0.3), inset -40px -40px 60px #000',
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
                        style={{ position: 'absolute', background: 'rgba(0,255,204,0.15)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🌍 RUNETERRA
                    </button>
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
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '15px', padding: '25px', width: '350px', textAlign: 'center', position: 'relative' }}>
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
    // ⚔️ CAMADA 3: MAPA TÁTICO (FUNDO INTELIGENTE E EDITÁVEL)
    // ==========================================
    if (nivelVisao === 'reino') {
        const backgroundUrl = mapasImagens[localAtual.mapaId];

        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
                
                {/* Cabeçalho da Camada 3 */}
                <div style={{ background: '#111', padding: '10px 15px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ SAIR DO MAPA</button>
                        {/* NOVO BOTÃO DE EDIÇÃO */}
                        <button onClick={editarFundoMapa} style={{ background: 'transparent', color: '#0088ff', border: '1px solid #0088ff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⚙️ EDITAR FUNDO</button>
                    </div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '1px' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                
                {/* O Cenário Real do Mapa (Substitui o mapa teste fixo) */}
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
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    
                    {/* Se não tiver imagem, mostra esse aviso bonitinho */}
                    {!backgroundUrl && (
                        <div style={{ textAlign: 'center', color: '#444', border: '2px dashed #333', padding: '40px', borderRadius: '15px' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Cenário Vazio</h3>
                            <p style={{ margin: 0 }}>Clique em <b>"⚙️ EDITAR FUNDO"</b> ali em cima e cole o link de uma imagem para este mapa!</p>
                        </div>
                    )}

                    {/* O Grid Transparente ou Pins que vêm do seu sistema pai (se houver) continuam funcionando por cima de tudo! */}
                    {children}
                </div>
            </div>
        );
    }

    return null;
}