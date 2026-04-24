import React, { useState, useRef } from 'react';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null });

    // Estado para gerenciar os mapas de cada região (Simulando um banco de dados)
    const [mapasSalvos, setMapasSalvos] = useState({
        'Freljord': ['Acampamento Glacinata', 'Passe da Montanha'],
        'Demacia': ['Grande Praça', 'Posto Avançado'],
        'Noxus': ['Arena de Carnificina', 'Bastião Imortal']
    });

    const [reinoSelecionado, setReinoSelecionado] = useState(null);

    // Controle do Globo
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
        if (nome) {
            setMapasSalvos(prev => ({
                ...prev,
                [reinoSelecionado]: [...(prev[reinoSelecionado] || []), nome]
            }));
        }
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
                    <h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase' }}>Visão Orbital</h2>
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
                    <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '200%', height: '100%', transform: `translateX(${(rotacaoGlobo % 400) - 100}px)`, opacity: 0.5, pointerEvents: 'none' }}>
                        <path d="M 10 50 Q 30 30 70 35 L 120 40 Q 140 50 130 65 L 110 75 L 80 70 L 40 75 Z" fill="none" stroke="#00ffcc" strokeWidth="1" />
                        <path d="M 50 90 L 80 85 L 110 88 Q 130 110 120 140 L 90 160 Q 60 145 40 120 Z" fill="none" stroke="#00ffcc" strokeWidth="1" />
                    </svg>

                    <button 
                        onClick={() => setNivelVisao('continente')} 
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderBottom: '1px solid #222' }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red">⬅ VOLTAR</button>
                    <h2 style={{ color: '#0088ff', margin: 0 }}>RUNETERRA</h2>
                    <div style={{ width: '120px' }}></div>
                </div>

                <div style={{ flex: 1, position: 'relative', backgroundImage: 'url("/runeterra-clean.jpg?v=2")', backgroundSize: '100% 100%' }}>
                    {reinosRuneterra.map((reino) => (
                        <div 
                            key={reino.nome}
                            style={{ position: 'absolute', top: reino.top, left: reino.left, transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                            onClick={() => setReinoSelecionado(reino.nome)}
                        >
                            <div style={{ width: '20px', height: '20px', background: '#000', border: '2px solid #ffcc00', borderRadius: '50%', boxShadow: '0 0 10px #ffcc00' }}></div>
                            <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', color: '#ffcc00', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{reino.nome}</span>
                        </div>
                    ))}
                </div>

                {/* MODAL DE SELEÇÃO E CRIAÇÃO (Onde o botão Novo Mapa agora funciona) */}
                {reinoSelecionado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '15px', padding: '25px', width: '350px', textAlign: 'center' }}>
                            <h2 style={{ color: '#ffcc00' }}>{reinoSelecionado}</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0', maxHeight: '150px', overflowY: 'auto' }}>
                                {(mapasSalvos[reinoSelecionado] || []).map(mapa => (
                                    <button key={mapa} onClick={() => entrarNoMapaDeBatalha(mapa)} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                                        🗺️ {mapa}
                                    </button>
                                ))}
                                {!(mapasSalvos[reinoSelecionado]?.length) && <p style={{color: '#666'}}>Nenhum mapa salvo.</p>}
                            </div>
                            
                            <button onClick={criarNovoMapa} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>
                                ➕ NOVO MAPA
                            </button>
                            
                            <button onClick={() => setReinoSelecionado(null)} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>CANCELAR</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // ⚔️ CAMADA 3: MAPA TÁTICO (COM OPÇÃO DE EDITAR)
    // ==========================================
    if (nivelVisao === 'reino') {
        return (
            <div className="fade-in">
                <div style={{ background: '#111', padding: '10px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>⬅ SAIR</button>
                        {/* BOTÃO EDITAR ADICIONADO AQUI */}
                        <button onClick={() => alert('Modo Edição Ativado para: ' + localAtual.mapaId)} style={{ background: '#0088ff', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>⚙️ EDITAR MAPA</button>
                    </div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                {/* Aqui entra o grid do VTT */}
                {children}
            </div>
        );
    }

    return null;
}