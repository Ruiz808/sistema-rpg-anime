import React, { useState, useRef } from 'react';

// 🔥 AS IMAGENS DO MUNDO MATERIAL 🔥
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
import mapaCosmologia from '../../assets/mapa-cosmologia.png';

export default function MapaMundi({ children }) {
    const [nivelVisao, setNivelVisao] = useState('sistema_solar'); 
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null, mapaId: null, plano: 'Material' });

    const [mapasSalvos, setMapasSalvos] = useState({
        'Freljord': ['Acampamento Glacinata', 'Passe da Montanha']
    });
    const [mapasImagens, setMapasImagens] = useState({});
    const [reinoSelecionado, setReinoSelecionado] = useState(null);
    const [modoEdicaoMapa, setModoEdicaoMapa] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [reinoHover, setReinoHover] = useState(null); 
    const [planoHover, setPlanoHover] = useState(null);
    const [rotacaoGlobo, setRotacaoGlobo] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const [modoAjuste, setModoAjuste] = useState(false);
    const [dragIndexCosmo, setDragIndexCosmo] = useState(null);
    const containerRef = useRef(null);
    const [codigoExportado, setCodigoExportado] = useState(null);

    // 🎥 CÂMERA 3D (Começa com zoom bem afastado para ver os 4000px!)
    const [camRotX, setCamRotX] = useState(60); 
    const [camRotY, setCamRotY] = useState(0);  
    const [camZoom, setCamZoom] = useState(0.35); 
    const [isDraggingCam, setIsDraggingCam] = useState(false);
    const camDragStart = useRef({ x: 0, y: 0 });

    // 🛣️ MATEMÁTICA PURA DAS FAIXAS (ESCALA COLOSSAL - 4000x2000)
    const caminhosOrbita = [
        "M 2000 1000 C 2800 -200, 4000 200, 4000 1000 C 4000 1800, 2800 2200, 2000 1000 C 1200 -200, 0 200, 0 1000 C 0 1800, 1200 2200, 2000 1000 Z", // Faixa 0 (Terra 0)
        "M 2000 1000 C 2900 -300, 4200 100, 4200 1000 C 4200 1900, 2900 2300, 2000 1000 C 1100 -300, -200 100, -200 1000 C -200 1900, 1100 2300, 2000 1000 Z", // Faixa 1 (Vegeta - Externa)
        "M 2000 1000 C 2700 -100, 3800 300, 3800 1000 C 3800 1700, 2700 2100, 2000 1000 C 1300 -100, 200 300, 200 1000 C 200 1700, 1300 2100, 2000 1000 Z", // Faixa 2 (Namekusei - Interna)
        "M 2000 1000 C 3000 -400, 4400 0, 4400 1000 C 4400 2000, 3000 2400, 2000 1000 C 1000 -400, -400 0, -400 1000 C -400 2000, 1000 2400, 2000 1000 Z"  // Faixa 3 (Desconhecido - Mais Externa)
    ];

    // 📍 VARIÁVEL: POSIÇÕES DA COSMOLOGIA (Calibrada)
    const [zonasCosmologia, setZonasCosmologia] = useState([
        { "nome": "Terra 0 (Runeterra)", "top": "44.3%", "left": "49.3%", "width": "10%", "height": "16.6%", "cor": "#ffffff", "isCircle": true, "isPlanet": true },
        { "nome": "Plano da Ordem", "top": "40.6%", "left": "13.2%", "width": "13%", "height": "22%", "cor": "#DDA0DD", "isCircle": true },
        { "nome": "Plano Astral", "top": "38.7%", "left": "81.9%", "width": "13%", "height": "22%", "cor": "#483D8B", "isCircle": true },
        { "nome": "Plano do Vento", "top": "28.2%", "left": "33.4%", "width": "12%", "height": "20%", "cor": "#2E8B57", "isCircle": true },
        { "nome": "Plano do Fogo", "top": "55.2%", "left": "34.1%", "width": "12%", "height": "20%", "cor": "#DC143C", "isCircle": true },
        { "nome": "Plano da Água", "top": "26.6%", "left": "62.4%", "width": "12%", "height": "20%", "cor": "#4169E1", "isCircle": true },
        { "nome": "Plano da Terra", "top": "56.7%", "left": "63.6%", "width": "12%", "height": "20%", "cor": "#8B4513", "isCircle": true },
        { "nome": "Céus", "top": "2.4%", "left": "47.0%", "width": "12%", "height": "18%", "cor": "#FCE883", "isCircle": true },
        { "nome": "Inferno", "top": "79.2%", "left": "46.7%", "width": "16%", "height": "14%", "cor": "#FF4500", "isCircle": false },
        { "nome": "Plano das Fadas", "top": "32.4%", "left": "50.3%", "width": "7%", "height": "9%", "cor": "#32CD32", "isCircle": true },
        { "nome": "Plano do Éter", "top": "64.7%", "left": "50.7%", "width": "7%", "height": "9%", "cor": "#9400D3", "isCircle": true },
        { "nome": "Plano do Caos", "top": "2.1%", "left": "77.5%", "width": "22%", "height": "10%", "cor": "#800000", "isCircle": false },
        { "nome": "Plano do Caos Inferior", "top": "84%", "left": "8%", "width": "22%", "height": "10%", "cor": "#800000", "isCircle": false }
    ]);

    // 🔥 MÁSCARAS DE RUNETERRA
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

    // ==========================================
    // 🕹️ CONTROLES DA CÂMERA ESPACIAL
    // ==========================================
    const handleEspacoMouseDown = (e) => {
        if (modoAjuste) return;
        setIsDraggingCam(true);
        camDragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    };

    const handleEspacoMouseMove = (e) => {
        if (!isDraggingCam) return;
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;

        const diffX = clientX - camDragStart.current.x;
        const diffY = clientY - camDragStart.current.y;
        
        setCamRotY(prev => prev + diffX * 0.4);
        setCamRotX(prev => Math.max(10, Math.min(85, prev - diffY * 0.4))); 
        
        camDragStart.current = { x: clientX, y: clientY };
    };

    const handleEspacoMouseUp = () => setIsDraggingCam(false);

    const handleEspacoZoom = (e) => {
        if (nivelVisao !== 'sistema_solar') return;
        let novoZoom = camZoom - e.deltaY * 0.001;
        // Permite afastar bastante e aproximar muito!
        setCamZoom(Math.max(0.15, Math.min(4.0, novoZoom))); 
    };

    // CONTROLES GLOBO
    const handleGloboDragStart = (e) => { setIsDragging(true); dragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY }; };
    const handleGloboDragMove = (e) => {
        if (!isDragging) return;
        const diffX = (e.clientX || e.touches?.[0].clientX) - dragStart.current.x;
        const diffY = (e.clientY || e.touches?.[0].clientY) - dragStart.current.y;
        setRotacaoGlobo({ x: rotacaoGlobo.x + diffX * 0.4, y: Math.max(-70, Math.min(70, rotacaoGlobo.y - diffY * 0.4)) });
        dragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    };
    const handleGloboDragEnd = () => setIsDragging(false);

    const voltarCamera = () => {
        if (nivelVisao === 'reino') setNivelVisao('continente');
        else if (nivelVisao === 'continente') setNivelVisao('globo');
        else if (nivelVisao === 'globo') setNivelVisao('sistema_solar');
        else if (nivelVisao === 'cosmologia') setNivelVisao('sistema_solar');
    };

    // 🛠️ MODO DEUS (Apenas para a Cosmologia agora)
    const handleDragStart = (e, index) => {
        if (!modoAjuste) return;
        e.stopPropagation();
        setDragIndexCosmo(index);
    };

    const handleDragMove = (e) => {
        if (!modoAjuste || !containerRef.current || dragIndexCosmo === null) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (!clientX || !clientY) return;

        let xPercent = ((clientX - rect.left) / rect.width) * 100;
        let yPercent = ((clientY - rect.top) / rect.height) * 100;

        const w = parseFloat(zonasCosmologia[dragIndexCosmo].width);
        const h = parseFloat(zonasCosmologia[dragIndexCosmo].height);
        setZonasCosmologia(prev => {
            const novas = [...prev];
            novas[dragIndexCosmo] = { ...novas[dragIndexCosmo], top: `${(yPercent - h/2).toFixed(1)}%`, left: `${(xPercent - w/2).toFixed(1)}%` };
            return novas;
        });
    };

    const handleDragEnd = () => { setDragIndexCosmo(null); };

    const gerarCodigoExportacao = () => {
        const codigoCosmo = JSON.stringify(zonasCosmologia, null, 4);
        setCodigoExportado(`// COPIE E SUBSTITUA A 'zonasCosmologia':\nconst [zonasCosmologia, setZonasCosmologia] = useState(${codigoCosmo});`);
    };

    const PainelModoDeus = () => (
        <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '10px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={() => setModoAjuste(!modoAjuste)} style={{ background: modoAjuste ? '#ff4444' : '#0088ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {modoAjuste ? '❌ DESLIGAR MODO AJUSTE' : '🔧 LIGAR MODO DE AJUSTE'}
                </button>
                {modoAjuste && (
                    <button onClick={gerarCodigoExportacao} style={{ background: '#00cc66', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        💾 IMPRIMIR CÓDIGO
                    </button>
                )}
            </div>
            {modoAjuste && <span style={{ color: '#aaa', fontSize: '11px', textAlign: 'center' }}>(Arraste os planos e as dimensões.)</span>}
        </div>
    );

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

    // ==========================================
    // 🌌 TELA 0: SISTEMA SOLAR (ESCALA COLOSSAL 4000x2000)
    // ==========================================
    if (nivelVisao === 'sistema_solar') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', background: 'radial-gradient(circle at center, #0a0a1a 0%, #000000 100%)', position: 'relative', overflow: 'hidden', borderRadius: '15px', border: '1px solid #333' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px', opacity: 0.3 }} />
                
                <button onClick={() => setNivelVisao('cosmologia')} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(72, 61, 139, 0.4)', border: '1px solid #DDA0DD', color: '#DDA0DD', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', zIndex: 100, letterSpacing: '2px', boxShadow: '0 0 15px rgba(221, 160, 221, 0.3)', backdropFilter: 'blur(5px)' }}>🌌 REVELAR DIMENSÕES</button>

                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, pointerEvents: 'none' }}>
                    <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 0 10px #fff' }}>Universo Material</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0', letterSpacing: '1px' }}>Setor Orichalcos</p>
                    <p style={{ color: '#00ffcc', fontSize: '0.75em', margin: '5px 0 0 0' }}>🖱️ Arraste a tela para girar a câmera</p>
                    <p style={{ color: '#ffcc00', fontSize: '0.75em', margin: '2px 0 0 0' }}>🔍 Use o Scroll/Pinch para aplicar Zoom</p>
                </div>

                <div 
                    onWheel={handleEspacoZoom} 
                    style={{ position: 'absolute', inset: 0, perspective: '2000px', touchAction: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onMouseDown={handleEspacoMouseDown} onMouseMove={handleEspacoMouseMove} onMouseUp={handleEspacoMouseUp} onMouseLeave={handleEspacoMouseUp} 
                    onTouchStart={handleEspacoMouseDown} onTouchMove={handleEspacoMouseMove} onTouchEnd={handleEspacoMouseUp}
                >
                    <div style={{ position: 'relative', width: '4000px', height: '2000px', transformStyle: 'preserve-3d', transform: `scale(${camZoom}) rotateX(${camRotX}deg) rotateY(${camRotY}deg)`, cursor: isDraggingCam ? 'grabbing' : 'grab', transition: isDraggingCam ? 'none' : 'transform 0.1s ease-out' }}>
                        
                        {/* 🎨 O NOVO UNIVERSO COLOSSAL (SVG de 4000x2000) */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4000 2000" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                            <defs>
                                <radialGradient id="sol" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="30%" stopColor="#ffcc00" />
                                    <stop offset="100%" stopColor="#ff5500" />
                                </radialGradient>
                                <radialGradient id="vegeta" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#ff6666" />
                                    <stop offset="100%" stopColor="#660000" />
                                </radialGradient>
                                <radialGradient id="namekusei" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#66ff66" />
                                    <stop offset="100%" stopColor="#004400" />
                                </radialGradient>
                                <radialGradient id="desconhecido" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#66b3ff" />
                                    <stop offset="100%" stopColor="#000044" />
                                </radialGradient>
                                <radialGradient id="terra0" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#4db8ff" />
                                    <stop offset="100%" stopColor="#001133" />
                                </radialGradient>
                                <radialGradient id="maria" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="100%" stopColor="#555555" />
                                </radialGradient>
                                <radialGradient id="rose" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#ffaaaa" />
                                    <stop offset="100%" stopColor="#aa3333" />
                                </radialGradient>
                                <radialGradient id="sina" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#aaaaff" />
                                    <stop offset="100%" stopColor="#4444aa" />
                                </radialGradient>

                                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                <filter id="glow-sol"><feGaussianBlur stdDeviation="25" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            </defs>

                            {/* 🛣️ TRILHAS (Matemática Colossal) */}
                            {caminhosOrbita.map((path, idx) => (
                                <path key={`trilha-${idx}`} d={path} fill="none" stroke={idx === 0 ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.2)"} strokeWidth={idx === 0 ? "6" : "4"} strokeDasharray="20 40" filter="url(#glow)" />
                            ))}

                            {/* ⭐ ESTRELAS (Ancoradas nos focos: Left=800, Right=3200) */}
                            <g style={{ transform: `translate(800px, 1000px) rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                <circle r="150" fill="url(#sol)" filter="url(#glow-sol)" />
                            </g>
                            <g style={{ transform: `translate(3200px, 1000px) rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                <circle r="150" fill="url(#sol)" filter="url(#glow-sol)" />
                            </g>

                            {/* 🌍 PLANETAS MÓVEIS */}
                            <g>
                                <animateMotion dur="40s" repeatCount="indefinite" path={caminhosOrbita[1]} begin="-5s" />
                                <g style={{ transform: `rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                    <circle r="32.5" fill="url(#vegeta)" />
                                    <text y="55" textAnchor="middle" fill="#ff6666" fontSize="18" fontWeight="bold" style={{textShadow: '0px 2px 5px black', pointerEvents: 'none'}}>VEGETA</text>
                                </g>
                            </g>

                            <g>
                                <animateMotion dur="50s" repeatCount="indefinite" path={caminhosOrbita[2]} begin="-20s" />
                                <g style={{ transform: `rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                    <circle r="40" fill="url(#namekusei)" />
                                    <text y="65" textAnchor="middle" fill="#66ff66" fontSize="18" fontWeight="bold" style={{textShadow: '0px 2px 5px black', pointerEvents: 'none'}}>NAMEKUSEI</text>
                                </g>
                            </g>

                            <g>
                                <animateMotion dur="60s" repeatCount="indefinite" path={caminhosOrbita[3]} begin="-45s" />
                                <g style={{ transform: `rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                    <circle r="27.5" fill="url(#desconhecido)" />
                                    <text y="50" textAnchor="middle" fill="#66b3ff" fontSize="18" fontWeight="bold" style={{textShadow: '0px 2px 5px black', pointerEvents: 'none'}}>DESCONHECIDO</text>
                                </g>
                            </g>

                            {/* 🌍 TERRA 0 E AS LUAS 3D */}
                            <g>
                                <animateMotion dur="30s" repeatCount="indefinite" path={caminhosOrbita[0]} begin="0s" />
                                <g style={{ transform: `rotateX(${-camRotX}deg) rotateY(${-camRotY}deg)`, transformOrigin: '0 0' }}>
                                    <circle r="75" fill="url(#terra0)" onClick={() => setNivelVisao('globo')} style={{ cursor: 'pointer', pointerEvents: 'auto' }} />
                                    
                                    {/* O Anel das Luas Inclinado */}
                                    <g style={{ transform: 'rotateX(75deg)', transformOrigin: '0 0' }}>
                                        <circle r="180" fill="none" stroke="rgba(255,255,255,0.4)" strokeDasharray="8 15" strokeWidth="4" />
                                        <g className="spin-ring">
                                            
                                            {/* Maria */}
                                            <g style={{ transform: 'rotate(0deg) translate(0, -180px)', transformOrigin: '0 0' }}>
                                                <g className="counter-spin-ring">
                                                    <g style={{ transform: 'rotateX(-75deg)', transformOrigin: '0 0' }}>
                                                        <circle r="10" fill="url(#maria)" />
                                                        <text y="-20" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{textShadow: '0px 2px 5px black'}}>Maria</text>
                                                    </g>
                                                </g>
                                            </g>

                                            {/* Rose */}
                                            <g style={{ transform: 'rotate(120deg) translate(0, -180px)', transformOrigin: '0 0' }}>
                                                <g className="counter-spin-ring">
                                                    <g style={{ transform: 'rotateX(-75deg)', transformOrigin: '0 0' }}>
                                                        <circle r="9" fill="url(#rose)" />
                                                        <text y="-20" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{textShadow: '0px 2px 5px black'}}>Rose</text>
                                                    </g>
                                                </g>
                                            </g>

                                            {/* Sina */}
                                            <g style={{ transform: 'rotate(240deg) translate(0, -180px)', transformOrigin: '0 0' }}>
                                                <g className="counter-spin-ring">
                                                    <g style={{ transform: 'rotateX(-75deg)', transformOrigin: '0 0' }}>
                                                        <circle r="13" fill="url(#sina)" />
                                                        <text y="-20" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{textShadow: '0px 2px 5px black'}}>Sina</text>
                                                    </g>
                                                </g>
                                            </g>

                                        </g>
                                    </g>
                                    
                                    <text y="120" textAnchor="middle" fill="#4db8ff" fontSize="26" fontWeight="bold" letterSpacing="4px" style={{textShadow: '0px 3px 8px black', pointerEvents: 'none'}}>TERRA 0</text>
                                </g>
                            </g>
                        </svg>
                    </div>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                    .fade-in { animation: fadeIn 0.8s ease-in-out; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    
                    /* Gira o Anel Base 360 Graus */
                    .spin-ring { animation: spin 20s linear infinite; transform-origin: 0 0; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    
                    /* Gira a Lua pra trás (-360 Graus) pra ela não capotar de cabeça pra baixo */
                    .counter-spin-ring { animation: counterSpin 20s linear infinite; transform-origin: 0 0; }
                    @keyframes counterSpin { 100% { transform: rotate(-360deg); } }
                `}} />
            </div>
        );
    }

    // ==========================================
    // 🌌 TELA 1: COSMOLOGIA (CALIBRADA!)
    // ==========================================
    if (nivelVisao === 'cosmologia') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <PainelModoDeus />
                <button onClick={() => setNivelVisao('sistema_solar')} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', zIndex: 100 }}>⬅ VOLTAR AO ESPAÇO</button>

                <div ref={containerRef} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd} style={{ position: 'relative', width: '1000px', height: '600px', borderRadius: '15px', overflow: 'hidden', marginTop: '50px' }}>
                    <img src={mapaCosmologia} alt="Cosmologia" style={{ width: '100%', height: '100%', objectFit: 'fill', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))', pointerEvents: 'none' }} />

                    {zonasCosmologia.map((zona, index) => (
                        <div 
                            key={`${zona.nome}-${index}`}
                            onMouseEnter={() => !modoAjuste && setPlanoHover(zona.nome)}
                            onMouseLeave={() => !modoAjuste && setPlanoHover(null)}
                            onMouseDown={(e) => handleDragStart(e, index)}
                            onTouchStart={(e) => handleDragStart(e, index)}
                            onClick={() => { if (!modoAjuste) { if (zona.isPlanet) setNivelVisao('globo'); else alert(`Viajando para: ${zona.nome}`); } }}
                            style={{
                                position: 'absolute', top: zona.top, left: zona.left, width: zona.width, height: zona.height,
                                borderRadius: zona.isCircle ? '50%' : '15px', cursor: modoAjuste ? 'grab' : 'pointer', zIndex: zona.zIndex || 10,
                                border: modoAjuste || planoHover === zona.nome ? `2px dashed ${zona.cor}` : '2px solid transparent',
                                boxShadow: modoAjuste || planoHover === zona.nome ? `0 0 15px ${zona.cor}, inset 0 0 10px ${zona.cor}` : 'none',
                                background: modoAjuste ? 'rgba(255,255,255,0.2)' : (planoHover === zona.nome ? 'rgba(255,255,255,0.15)' : 'transparent'), 
                                transition: dragIndexCosmo === index ? 'none' : '0.2s ease-in-out'
                            }}
                        />
                    ))}
                </div>
                
                {!modoAjuste && (
                    <div style={{ position: 'absolute', bottom: '30px', textAlign: 'center', pointerEvents: 'none', zIndex: 50 }}>
                        <h1 style={{ color: '#fff', margin: 0, letterSpacing: '6px', textTransform: 'uppercase', fontSize: '1.4em', textShadow: '0 0 20px rgba(255,255,255,0.8)' }}>
                            {planoHover || 'Atlas Multiversal'}
                        </h1>
                    </div>
                )}

                {codigoExportado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ background: '#111', padding: '20px', borderRadius: '10px', width: '800px', border: '2px solid #00cc66' }}>
                            <h2 style={{ color: '#00cc66', marginTop: 0 }}>✅ Pronto! Substitua seu código por este:</h2>
                            <textarea readOnly value={codigoExportado} style={{ width: '100%', height: '400px', background: '#000', color: '#00ffcc', padding: '10px', fontFamily: 'monospace', fontSize: '12px' }} />
                            <button onClick={() => setCodigoExportado(null)} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '10px 20px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>FECHAR E VOLTAR</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // 🌍 TELA 2: O GLOBO E CONTINENTE
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden' }} onMouseMove={handleGloboDragMove} onMouseUp={handleGloboDragEnd} onMouseLeave={handleGloboDragEnd} onTouchMove={handleGloboDragMove} onTouchEnd={handleGloboDragEnd}>
                <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 30 }}>
                    <button onClick={() => setNivelVisao('sistema_solar')} style={{ background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ ESPAÇO FÍSICO</button>
                    <button onClick={() => setNivelVisao('cosmologia')} style={{ background: 'rgba(72, 61, 139, 0.4)', border: '1px solid #DDA0DD', color: '#DDA0DD', padding: '8px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🌌 MULTIVERSO</button>
                </div>
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}><h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #00ffcc' }}>Visão Orbital: Terra 0</h2></div>
                <div style={{ position: 'relative', width: '350px', height: '350px', perspective: '1000px' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#000814', border: '2px solid #0088ff', pointerEvents: 'none', boxShadow: '0 0 50px rgba(0, 136, 255, 0.2)' }}></div>
                    <div onMouseDown={handleGloboDragStart} onTouchStart={handleGloboDragStart} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rotacaoGlobo.y}deg) rotateY(${rotacaoGlobo.x}deg)`, cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'transform 0.5s ease-out' }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateX(90deg)' }}></div><div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateY(90deg)' }}></div><div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,255,204,0.15)', transform: 'rotateZ(45deg) rotateX(90deg)' }}></div>
                        <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(160px)', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: '140px', height: '140px', filter: 'drop-shadow(0 0 3px rgba(0,255,204,0.8))' }}><path d="M 12 55 L 18 45 L 30 38 L 42 35 L 55 30 L 70 28 L 85 25 L 100 28 L 115 32 L 125 30 L 135 38 L 142 42 L 140 52 L 132 58 L 122 56 L 115 65 L 105 72 L 95 68 L 82 72 L 68 80 L 52 75 L 40 82 L 25 72 L 15 75 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" /><path d="M 45 92 L 58 85 L 75 82 L 95 84 L 110 88 L 118 82 L 128 92 L 138 105 L 132 120 L 142 135 L 135 148 L 125 152 L 115 168 L 105 160 L 92 168 L 75 162 L 62 152 L 48 142 L 38 125 L 42 108 L 40 98 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" /><path d="M 152 28 L 162 20 L 175 18 L 182 25 L 185 38 L 178 50 L 182 62 L 172 72 L 160 75 L 150 65 L 148 50 L 145 38 Z" fill="rgba(0,255,204,0.08)" stroke="#00ffcc" strokeWidth="1" strokeLinejoin="round" /><circle cx="162" cy="85" r="2" fill="#00ffcc" /><line x1="105" y1="72" x2="110" y2="88" stroke="#ffcc00" strokeWidth="1.5" /></svg>
                            <button onClick={() => entrarNoContinente('Runeterra')} style={{ pointerEvents: 'auto', background: 'rgba(0,255,204,0.1)', border: '2px solid #00ffcc', color: '#00ffcc', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', letterSpacing: '2px', backdropFilter: 'blur(5px)', boxShadow: '0 0 20px rgba(0,255,204,0.4)', zIndex: 10 }}>🌍 ENTRAR EM RUNETERRA</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (nivelVisao === 'continente') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.85)', padding: '12px 25px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: '5px', fontSize: '0.85em', cursor: 'pointer', fontWeight: 'bold' }}>⬅ VOLTAR AO GLOBO</button>
                    <h2 style={{ color: '#0088ff', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #0088ff' }}>{reinoHover || localAtual.continente}</h2>
                    <div style={{ width: '120px' }}></div>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
                    <div style={{ position: 'relative', display: 'inline-block', height: '100%', maxHeight: 'calc(85vh - 70px)' }}>
                        <img src={mapaClean} alt="Mapa Base" style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }} />
                        {posicoesPings.map((reino) => (
                            <div key={reino.nome} className={`ping-wrapper ${reinoHover === reino.nome ? 'active' : ''}`} style={{ top: reino.top, left: reino.left, pointerEvents: 'auto', cursor: 'pointer', position: 'absolute', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5, padding: '10px' }} onMouseEnter={() => setReinoHover(reino.nome)} onMouseLeave={() => setReinoHover(null)} onClick={(e) => { e.stopPropagation(); abrirMenuReino(reino.nome); }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s', boxShadow: '0 0 15px rgba(0,0,0,0.9)', borderWidth: '2px', borderStyle: 'solid', borderColor: reinoHover === reino.nome ? '#fff' : reino.cor, transform: reinoHover === reino.nome ? 'scale(1.1)' : 'scale(1)' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', transition: '0.3s', background: reinoHover === reino.nome ? '#fff' : reino.cor }} />
                                </div>
                                <div style={{ marginTop: '6px', background: reinoHover === reino.nome ? '#fff' : 'rgba(0,0,0,0.9)', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: reinoHover === reino.nome ? '#000' : '#fff', textTransform: 'uppercase', letterSpacing: '1.5px', border: `1px solid ${reinoHover === reino.nome ? '#fff' : 'transparent'}`, whiteSpace: 'nowrap', transition: '0.3s' }}>{reino.nome}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {reinoSelecionado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(6px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '380px', textAlign: 'center', position: 'relative' }}>
                            <button onClick={() => setReinoSelecionado(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '22px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            <h2 style={{ color: '#ffcc00', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{reinoSelecionado}</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px', maxHeight: '200px', overflowY: 'auto' }}>
                                {(mapasSalvos[reinoSelecionado] || []).map(mapa => (
                                    <button key={mapa} onClick={() => entrarNoMapaDeBatalha(mapa)} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>🗺️ {mapa}</button>
                                ))}
                            </div>
                            <button onClick={criarNovoMapa} style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>➕ CRIAR NOVO MAPA</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (nivelVisao === 'reino') {
        const backgroundUrl = mapasImagens[localAtual.mapaId];
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
                <div style={{ background: '#111', padding: '12px 20px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', gap: '15px' }}><button onClick={voltarCamera} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ SAIR</button><button onClick={() => { setUrlInput(backgroundUrl || ''); setModoEdicaoMapa(true); }} style={{ background: 'transparent', color: '#0088ff', border: '1px solid #0088ff', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>⚙️ EDITAR CENÁRIO</button></div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold', textTransform: 'uppercase' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                <div className="fade-in" style={{ flex: 1, position: 'relative', backgroundColor: '#050508', backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #333', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>{children}</div>
                    {modoEdicaoMapa && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 25, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '420px', textAlign: 'center', position: 'relative' }}>
                                <button onClick={() => setModoEdicaoMapa(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '20px', cursor: 'pointer' }}>X</button>
                                <h3 style={{ color: '#0088ff', marginTop: 0 }}>Configurar Cenário</h3>
                                <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL da imagem" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', marginBottom: '25px' }} />
                                <button onClick={() => { setMapasImagens(prev => ({ ...prev, [localAtual.mapaId]: urlInput })); setModoEdicaoMapa(false); }} style={{ width: '100%', background: '#0088ff', color: '#fff', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>💾 SALVAR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
}