import React, { useState, useRef } from 'react';

// 🔥 AS IMAGENS DO MUNDO MATERIAL (Intocáveis!) 🔥
import mapaClean from '../../assets/runeterra-clean.jpg';
import gabaritoFreljord from '../../assets/gabarito-freijord.png';
import gabaritoDemacia from '../../assets/gabarito-demacia.png';
import gabaritoNoxus from '../../assets/gabarito-noxus.png';
import gabaritoPiltover from '../../assets/gabarito-piltover.png';
import gabaritoShurima from '../../assets/gabarito-shurima.png';
import gabaritoTargon from '../../assets/gabarito-targon.png';
import gabaritoIxtal from '../../assets/gabarito-ixtal.png';
import gabaritoAguas from '../../assets/gabarito-aguas.png';
import gabaritoIlha from '../../assets/gabarito-ilha.png';
import gabaritoIonia from '../../assets/gabarito-ionia.png';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('cosmologia'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null, plano: 'Material' });

    const [mapasSalvos, setMapasSalvos] = useState({
        'Freljord': ['Acampamento Glacinata', 'Passe da Montanha'],
        'Demacia': ['Grande Praça', 'Posto Avançado'],
        'Noxus': ['Arena de Carnificina', 'Bastião Imortal']
    });

    const [mapasImagens, setMapasImagens] = useState({});
    const [reinoSelecionado, setReinoSelecionado] = useState(null);
    const [reinoHover, setReinoHover] = useState(null); 
    const [planoHover, setPlanoHover] = useState(null);
    const [corHover, setCorHover] = useState('#ffffff');
    
    const [modoEdicaoMapa, setModoEdicaoMapa] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const [rotacaoGlobo, setRotacaoGlobo] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // 🔥 OS PINGS DOS CONTINENTES 🔥
    const posicoesPings = [
        { nome: 'Freljord', img: gabaritoFreljord, top: '15%', left: '28%', cor: '#00b5e2' },
        { nome: 'Demacia', img: gabaritoDemacia, top: '40%', left: '21%', cor: '#d3c29e' },
        { nome: 'Noxus', img: gabaritoNoxus, top: '28%', left: '48%', cor: '#c62828' }, 
        { nome: 'Piltover e Zaun', img: gabaritoPiltover, top: '54%', left: '51%', cor: '#d4a017' },
        { nome: 'Shurima', img: gabaritoShurima, top: '75%', left: '43%', cor: '#c59b0d' },
        { nome: 'Targon', img: gabaritoTargon, top: '78%', left: '26%', cor: '#5e35b1' },
        { nome: 'Ixtal', img: gabaritoIxtal, top: '67%', left: '63%', cor: '#2e7d32' },
        { nome: 'Águas de Sentina', img: gabaritoAguas, top: '57%', left: '72%', cor: '#d84315' },
        { nome: 'Ilha das Sombras', img: gabaritoIlha, top: '86%', left: '85%', cor: '#00838f' },
        { nome: 'Ionia', img: gabaritoIonia, top: '30%', left: '82%', cor: '#43a047' }
    ];

    // Funções de Movimento do Globo
    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    };
    const handleDragMove = (e) => {
        if (!isDragging) return;
        const diffX = (e.clientX || e.touches?.[0].clientX) - dragStart.current.x;
        const diffY = (e.clientY || e.touches?.[0].clientY) - dragStart.current.y;
        let novoY = rotacaoGlobo.y - diffY * 0.4;
        if (novoY > 70) novoY = 70;
        if (novoY < -70) novoY = -70;
        setRotacaoGlobo({ x: rotacaoGlobo.x + diffX * 0.4, y: novoY });
        dragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    };
    const handleDragEnd = () => setIsDragging(false);

    // Funções de Navegação
    const criarNovoMapa = () => {
        const nome = prompt("Escreva o nome do novo mapa para " + reinoSelecionado + ":");
        if (nome && nome.trim() !== "") setMapasSalvos(prev => ({ ...prev, [reinoSelecionado]: [...(prev[reinoSelecionado] || []), nome] }));
    };
    const entrarNoContinente = (nomeContinente) => {
        setLocalAtual({ continente: nomeContinente, reino: null, mapaId: null, plano: 'Material' });
        setNivelVisao('continente');
    };
    const abrirMenuReino = (nomeReino) => setReinoSelecionado(nomeReino);
    const entrarNoMapaDeBatalha = (mapaEscolhido) => {
        setLocalAtual({ ...localAtual, reino: reinoSelecionado, mapaId: mapaEscolhido });
        setReinoSelecionado(null);
        setNivelVisao('reino');
    };
    const voltarCamera = () => {
        if (nivelVisao === 'reino') setNivelVisao('continente');
        else if (nivelVisao === 'continente') setNivelVisao('globo');
        else if (nivelVisao === 'globo') setNivelVisao('cosmologia');
    };

    const handlePlanoEnter = (nome, cor) => {
        setPlanoHover(nome);
        setCorHover(cor);
    };

    const travelingAlert = (plano) => {
        alert(`Traveling to: ${plano}\n(Ainda não implementado!)`);
    };

    // ==========================================
    // 🌌 CAMADA 0: A COSMOLOGIA NEON (O DESENHO EXATO SEM BURACOS)
    // ==========================================
    if (nivelVisao === 'cosmologia') {
        return (
            <div className="fade-in" style={{ 
                width: '100%', height: '85vh', background: '#000000', borderRadius: '15px', 
                border: '1px solid #222', position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* PLANO DO CAOS (O Fundo Preto) */}
                <div 
                    style={{ position: 'absolute', inset: 0, zIndex: 1, cursor: 'pointer' }}
                    onMouseEnter={() => handlePlanoEnter('Plano do Caos', '#777777')}
                    onClick={() => setNivelVisao('globo')}
                ></div>

                {/* Título Dinâmico Blinding Neon */}
                <div style={{ position: 'absolute', top: '40px', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <h1 style={{ color: corHover, margin: 0, letterSpacing: '6px', textTransform: 'uppercase', fontSize: '1.8em', textShadow: `0 0 20px ${corHover}`, transition: '0.3s' }}>
                        {planoHover || 'Atlas Multiversal'}
                    </h1>
                </div>

                {/* Tag Fixa Arcaica */}
                <div style={{ position: 'absolute', top: '30px', left: '30px', color: '#555', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold', zIndex: 5, pointerEvents: 'none' }}>
                    PLANO DO CAOS
                </div>

                {/* 🔥 O DIAGRAMA NEON EXATO (SVG PURO) 🔥 */}
                <svg 
                    viewBox="0 0 600 600" 
                    style={{ width: '650px', height: '650px', zIndex: 5, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.15))' }}
                    onMouseLeave={() => handlePlanoEnter('Plano do Caos', '#777777')}
                >
                    <g style={{ cursor: 'pointer' }}>
                        
                        {/* 1. CÉUS (Azul Claro) */}
                        <g onMouseEnter={() => handlePlanoEnter('Céus', '#00BFFF')} onClick={() => travelingAlert('Céus')} style={{ filter: planoHover === 'Céus' ? 'drop-shadow(0 0 15px #00BFFF)' : 'none', transition: '0.3s' }}>
                            <path d="M 20 300 A 280 280 0 0 1 580 300 L 510 300 A 210 210 0 0 0 90 300 Z" fill="rgba(173, 216, 230, 0.2)" stroke="#00BFFF" strokeWidth="3" />
                            <text x="300" y="70" textAnchor="middle" fill="#00BFFF" fontSize="14" fontWeight="bold" letterSpacing="3" style={{ textShadow: '0 0 10px #00BFFF' }}>CÉUS</text>
                        </g>

                        {/* 2. INFERNO (Vinho/Vermelho Escuro) */}
                        <g onMouseEnter={() => handlePlanoEnter('Inferno', '#ff3333')} onClick={() => travelingAlert('Inferno')} style={{ filter: planoHover === 'Inferno' ? 'drop-shadow(0 0 15px #ff3333)' : 'none', transition: '0.3s' }}>
                            <path d="M 580 300 A 280 280 0 0 1 20 300 L 90 300 A 210 210 0 0 0 510 300 Z" fill="rgba(128, 0, 0, 0.3)" stroke="#ff3333" strokeWidth="3" />
                            <text x="300" y="540" textAnchor="middle" fill="#ff3333" fontSize="14" fontWeight="bold" letterSpacing="3" style={{ textShadow: '0 0 10px #ff3333' }}>INFERNO</text>
                        </g>

                        {/* 3. PLANO ASTRAL (Cinza Escuro - O Anel Divisório) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano Astral', '#a0a0a0')} onClick={() => travelingAlert('Plano Astral')} style={{ filter: planoHover === 'Plano Astral' ? 'drop-shadow(0 0 15px #a0a0a0)' : 'none', transition: '0.3s' }}>
                            <path d="M 90 300 A 210 210 0 1 1 510 300 A 210 210 0 1 1 90 300 M 120 300 A 180 180 0 1 0 480 300 A 180 180 0 1 0 120 300" fill="rgba(105, 105, 105, 0.25)" fillRule="evenodd" stroke="#a0a0a0" strokeWidth="3" />
                            <text x="105" y="300" textAnchor="middle" transform="rotate(-90 105 300)" fill="#a0a0a0" fontSize="12" fontWeight="bold" letterSpacing="2" style={{ textShadow: '0 0 10px #a0a0a0' }}>PLANO ASTRAL</text>
                            <text x="495" y="300" textAnchor="middle" transform="rotate(90 495 300)" fill="#a0a0a0" fontSize="12" fontWeight="bold" letterSpacing="2" style={{ textShadow: '0 0 10px #a0a0a0' }}>PLANO ASTRAL</text>
                        </g>

                        {/* Quadrantes dos Elementos (Stacks under gray lines) */}

                        {/* 4. PLANO DO FOGO (Vermelho Claro) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano do Fogo', '#F08080')} onClick={() => travelingAlert('Plano do Fogo')} style={{ filter: planoHover === 'Plano do Fogo' ? 'drop-shadow(0 0 15px #F08080)' : 'none', transition: '0.3s' }}>
                            <path d="M 300 120 A 180 180 0 0 0 120 300 L 240 300 A 60 60 0 0 1 300 240 Z" fill="rgba(240, 128, 128, 0.2)" />
                            <text x="210" y="210" textAnchor="middle" fill="#F08080" fontSize="12" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #F08080' }}>PLANO DO FOGO</text>
                        </g>

                        {/* 5. PLANO DA TERRA (cor de pele/marrom) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano da Terra', '#CD853F')} onClick={() => travelingAlert('Plano da Terra')} style={{ filter: planoHover === 'Plano da Terra' ? 'drop-shadow(0 0 15px #CD853F)' : 'none', transition: '0.3s' }}>
                            <path d="M 480 300 A 180 180 0 0 0 300 120 L 300 240 A 60 60 0 0 1 420 300 Z" fill="rgba(205, 133, 63, 0.2)" />
                            <text x="390" y="210" textAnchor="middle" fill="#CD853F" fontSize="12" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #CD853F' }}>PLANO DA TERRA</text>
                        </g>

                        {/* 6. PLANO DA ÁGUA (Azul) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano da Agua', '#0000FF')} onClick={() => travelingAlert('Plano da Agua')} style={{ filter: planoHover === 'Plano da Agua' ? 'drop-shadow(0 0 15px #0000FF)' : 'none', transition: '0.3s' }}>
                            <path d="M 300 480 A 180 180 0 0 0 480 300 L 420 300 A 60 60 0 0 1 300 360 Z" fill="rgba(0, 0, 255, 0.2)" />
                            <text x="390" y="400" textAnchor="middle" fill="#0000FF" fontSize="12" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #0000FF' }}>PLANO DA AGUA</text>
                        </g>

                        {/* 7. PLANO DO VENTO (Cinza Claro) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano do Vento', '#D3D3D3')} onClick={() => travelingAlert('Plano do Vento')} style={{ filter: planoHover === 'Plano do Vento' ? 'drop-shadow(0 0 15px #D3D3D3)' : 'none', transition: '0.3s' }}>
                            <path d="M 120 300 A 180 180 0 0 0 300 480 L 300 360 A 60 60 0 0 1 240 300 Z" fill="rgba(211, 211, 211, 0.2)" />
                            <text x="210" y="400" textAnchor="middle" fill="#D3D3D3" fontSize="12" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #D3D3D3' }}>PLANO DO VENTO</text>
                        </g>

                        {/* Blinding Gray Plant BaixaLines (Stacked on top of elements) 🔥 */}
                        <path d="M 300 120 A 180 180 0 1 1 300 480 A 180 180 0 1 1 300 120 Z" fill="none" stroke="#696969" strokeWidth="4" />
                        <line x1="300" y1="120" x2="300" y2="480" fill="none" stroke="#696969" strokeWidth="4" />
                        <line x1="120" y1="300" x2="480" y2="300" fill="none" stroke="#696969" strokeWidth="4" />


                        {/* 8. PLANO DAS FADAS (Verde) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano das fadas', '#00FF00')} onClick={() => travelingAlert('Plano das fadas')} style={{ filter: planoHover === 'Plano das fadas' ? 'drop-shadow(0 0 15px #00FF00)' : 'none', transition: '0.3s' }}>
                            <circle cx="300" cy="120" r="20" fill="rgba(0, 255, 0, 0.3)" stroke="#00FF00" strokeWidth="3" />
                            <text x="300" y="90" textAnchor="middle" fill="#00FF00" fontSize="11" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #00FF00' }}>PLANO DAS FADAS</text>
                        </g>

                        {/* 9. PLANO DO ETHER (Roxo) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano do Ether', '#800080')} onClick={() => travelingAlert('Plano do Ether')} style={{ filter: planoHover === 'Plano do Ether' ? 'drop-shadow(0 0 15px #800080)' : 'none', transition: '0.3s' }}>
                            <circle cx="300" cy="480" r="20" fill="rgba(128, 0, 128, 0.3)" stroke="#800080" strokeWidth="3" />
                            <text x="300" y="515" textAnchor="middle" fill="#800080" fontSize="11" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #800080' }}>PLANO DO ETHER</text>
                        </g>

                        {/* 10. PLANO DA ORDEM (Amarelo) */}
                        <g onMouseEnter={() => handlePlanoEnter('Plano da ordem', '#FFFF00')} onClick={() => travelingAlert('Plano da ordem')} style={{ filter: planoHover === 'Plano da ordem' ? 'drop-shadow(0 0 15px #FFFF00)' : 'none', transition: '0.3s' }}>
                            <polygon points="0,300 10,282 30,282 40,300 30,318 10,318" fill="rgba(255, 255, 0, 0.25)" stroke="#FFFF00" strokeWidth="3" />
                            <text x="50" y="275" textAnchor="start" fill="#FFFF00" fontSize="11" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 10px #FFFF00' }}>PLANO DA ORDEM</text>
                        </g>

                        {/* 11. TERRA 0 / RUNETERRA (Branco - Centro Absoluto) */}
                        <g onMouseEnter={() => handlePlanoEnter('Terra 0 (Runeterra)', '#FFFFFF')} onClick={() => setNivelVisao('globo')} style={{ filter: planoHover === 'Terra 0 (Runeterra)' ? 'drop-shadow(0 0 20px #FFFFFF)' : 'drop-shadow(0 0 5px rgba(255,255,255,0.5))', transition: '0.3s' }}>
                            <circle cx="300" cy="300" r="60" fill="#000000" stroke="#FFFFFF" strokeWidth="4" />
                            <text x="300" y="295" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" letterSpacing="2" style={{ textShadow: '0 0 10px #FFFFFF' }}>TERRA 0</text>
                            <text x="300" y="315" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" letterSpacing="1" style={{ textShadow: '0 0 5px #FFFFFF' }}>(RUNETERRA)</text>
                        </g>
                    </g>
                </svg>

                <style dangerouslySetInnerHTML={{__html: `
                    .fade-in { animation: fadeIn 0.8s ease-in-out; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}} />
            </div>
        );
    }

    // ==========================================
    // 🌍 CAMADA 1: O GLOBO ORBITAL (INTOCÁVEL!)
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div 
                className="fade-in" 
                style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden' }}
                onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
            >
                <button onClick={voltarCamera} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: '2px solid #00ffcc', color: '#00ffcc', padding: '6px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', zIndex: 30, textShadow: '0 0 10px #00ffcc', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>⬅ COSMOLOGIA</button>

                <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #00ffcc' }}>Visão Orbital</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Arraste em qualquer direção para inspecionar o planeta.</p>
                </div>
                <div style={{ position: 'relative', width: '350px', height: '350px', perspective: '1000px' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#000814', border: '2px solid #0088ff', pointerEvents: 'none', boxShadow: '0 0 50px rgba(0, 136, 255, 0.2)' }}></div>
                    <div 
                        onMouseDown={handleDragStart} onTouchStart={handleDragStart}
                        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rotacaoGlobo.y}deg) rotateY(${rotacaoGlobo.x}deg)`, cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'transform 0.5s ease-out' }}
                    >
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateX(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateY(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateZ(45deg) rotateX(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(160px)', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '140px', height: '140px', filter: 'drop-shadow(0 0 3px rgba(0,255,204,0.8))' }}>
                                <path d="M 12 55 L 18 45 L 30 38 L 42 35 L 55 30 L 70 28 L 85 25 L 100 28 L 115 32 L 125 30 L 135 38 L 142 42 L 140 52 L 132 58 L 122 56 L 115 65 L 105 72 L 95 68 L 82 72 L 68 80 L 52 75 L 40 82 L 25 72 L 15 75 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 45 92 L 58 85 L 75 82 L 95 84 L 110 88 L 118 82 L 128 92 L 138 105 L 132 120 L 142 135 L 135 148 L 125 152 L 115 168 L 105 160 L 92 168 L 75 162 L 62 152 L 48 142 L 38 125 L 42 108 L 40 98 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <path d="M 152 28 L 162 20 L 175 18 L 182 25 L 185 38 L 178 50 L 182 62 L 172 72 L 160 75 L 150 65 L 148 50 L 145 38 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" />
                                <circle cx="162" cy="85" r="2" fill="#00ffcc" />
                                <line x1="105" y1="72" x2="110" y2="88" stroke="#ffcc00" strokeWidth="1.5" />
                            </svg>
                            <button onClick={() => entrarNoContinente('Runeterra')} style={{ pointerEvents: 'auto', background: 'rgba(0,255,204,0.1)', border: '2px solid #00ffcc', color: '#00ffcc', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', letterSpacing: '2px', backdropFilter: 'blur(5px)', boxShadow: '0 0 20px rgba(0,255,204,0.4)', zIndex: 10 }}>🌍 ENTRAR EM RUNETERRA</button>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset -50px -50px 100px rgba(0,0,0,0.9), inset 20px 20px 50px rgba(0,136,255,0.1)', pointerEvents: 'none', zIndex: 20 }}></div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE (INTOCÁVEL!)
    // ==========================================
    if (nivelVisao === 'continente') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.85)', padding: '12px 25px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: '5px', fontSize: '0.85em', cursor: 'pointer', fontWeight: 'bold' }}>⬅ VOLTAR AO GLOBO</button>
                    <h2 style={{ color: '#0088ff', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #0088ff' }}>{reinoHover || localAtual.continente}</h2>
                    <div style={{ width: '120px' }}></div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
                    <div style={{ position: 'relative', display: 'inline-block', height: '100%', maxHeight: 'calc(65vh - 70px)' }}>
                        <img src={mapaClean} alt="Mapa Base" style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }} />

                        {posicoesPings.map((reino) => (
                            reino.img ? (
                                <img 
                                    key={`mask-${reino.nome}`}
                                    src={reino.img} 
                                    style={{ 
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                        pointerEvents: 'none', zIndex: 2, 
                                        mixBlendMode: 'screen',
                                        opacity: reinoHover === reino.nome ? 1 : 0, 
                                        transition: 'opacity 0.3s ease-out'
                                    }} 
                                    alt={`Mascara ${reino.nome}`}
                                />
                            ) : null
                        ))}

                        <style dangerouslySetInnerHTML={{__html: `
                            .ping-wrapper { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; z-index: 5; transition: 0.2s; padding: 10px; }
                            .ping-anel-externo { width: 24px; height: 24px; border-radius: 50%; background: #000; display: flex; justify-content: center; align-items: center; transition: 0.3s; box-shadow: 0 0 15px rgba(0,0,0,0.9); border-width: 2px; border-style: solid; }
                            .ping-nucleo { width: 10px; height: 10px; border-radius: 50%; transition: 0.3s; }
                            .ping-wrapper.active .ping-anel-externo { width: 30px; height: 30px; border-color: #fff !important; transform: scale(1.1); box-shadow: 0 0 20px #fff; }
                            .ping-wrapper.active .ping-nucleo { width: 14px; height: 14px; background: #fff !important; box-shadow: 0 0 15px #fff; }
                            .ping-legenda { margin-top: 6px; background: rgba(0,0,0,0.9); padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid transparent; white-space: nowrap; transition: 0.3s; }
                            .ping-wrapper.active .ping-legenda { border-color: #fff; background: #fff; color: #000; }
                        `}} />

                        {posicoesPings.map((reino) => (
                            <div 
                                key={reino.nome}
                                className={`ping-wrapper ${reinoHover === reino.nome ? 'active' : ''}`}
                                style={{ top: reino.top, left: reino.left, pointerEvents: 'auto', cursor: 'pointer' }}
                                onMouseEnter={() => setReinoHover(reino.nome)}
                                onMouseLeave={() => setReinoHover(null)}
                                onClick={(e) => { e.stopPropagation(); abrirMenuReino(reino.nome); }}
                            >
                                <div className="ping-anel-externo" style={{ borderColor: reino.cor }}><div className="ping-nucleo" style={{ background: reino.cor, boxShadow: `0 0 10px ${reino.cor}` }}></div></div>
                                <div className="ping-legenda">{reino.nome}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {reinoSelecionado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(6px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '380px', textAlign: 'center', position: 'relative', boxShadow: '0 0 40px #0088ff' }}>
                            <button onClick={() => setReinoSelecionado(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '22px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            <h2 style={{ color: '#ffcc00', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{reinoSelecionado}</h2>
                            <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '20px' }}>Selecione o cenário para esta região:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                                {(mapasSalvos[reinoSelecionado] || []).map(mapa => (
                                    <button 
                                        key={mapa} onClick={() => entrarNoMapaDeBatalha(mapa)} 
                                        style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s', textAlign: 'left', fontSize: '0.95em' }}
                                        onMouseEnter={(e) => { e.target.style.borderColor='#0088ff'; e.target.style.background='#222'; }} 
                                        onMouseLeave={(e) => { e.target.style.borderColor='#333'; e.target.style.background='#1a1a1a'; }}
                                    >🗺️ {mapa}</button>
                                ))}
                                {!(mapasSalvos[reinoSelecionado]?.length) && <p style={{color: '#555', fontStyle: 'italic'}}>Nenhum mapa salvo nesta região.</p>}
                            </div>
                            <button onClick={criarNovoMapa} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9em', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>➕ CRIAR NOVO MAPA</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (nivelVisao === 'reino') {
        const backgroundUrl = mapasImagens[localAtual.mapaId];
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
                <div style={{ background: '#111', padding: '12px 20px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>⬅ SAIR DO MAPA</button>
                        <button onClick={() => { setUrlInput(backgroundUrl || ''); setModoEdicaoMapa(true); }} style={{ background: 'transparent', color: '#0088ff', border: '1px solid #0088ff', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>⚙️ EDITAR CENÁRIO</button>
                    </div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '1px', textTransform: 'uppercase' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                <div className="fade-in" style={{ flex: 1, position: 'relative', backgroundColor: '#050508', backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', border: '1px solid #333', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    {!backgroundUrl && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#444', border: '2px dashed #333', padding: '50px', borderRadius: '20px', pointerEvents: 'none' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', textTransform: 'uppercase' }}>Campo de Batalha Vazio</h3><p style={{ margin: 0 }}>Clica em <b>"⚙️ EDITAR CENÁRIO"</b> para adicionar uma imagem de fundo.</p>
                        </div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>{children}</div>
                    {modoEdicaoMapa && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 25, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                            <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '420px', textAlign: 'center', boxShadow: '0 0 35px #0088ff', position: 'relative' }}>
                                <button onClick={() => setModoEdicaoMapa(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                <h3 style={{ color: '#0088ff', marginTop: '0', textTransform: 'uppercase', letterSpacing: '2px' }}>Configurar Cenário</h3>
                                <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '22px' }}>Cola o Link (URL) da imagem para o fundo da batalha.</p>
                                <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Ex: https://i.imgur.com/mapa.jpg" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', marginBottom: '25px', fontSize: '14px' }} />
                                <button onClick={() => { setMapasImagens(prev => ({ ...prev, [localAtual.mapaId]: urlInput })); setModoEdicaoMapa(false); }} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>💾 SALVAR CENÁRIO</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
}