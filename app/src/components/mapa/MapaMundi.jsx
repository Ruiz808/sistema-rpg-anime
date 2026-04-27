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

    // 🎥 CÂMERA 3D DO SISTEMA SOLAR 
    const [camRotX, setCamRotX] = useState(60); 
    const [camRotY, setCamRotY] = useState(0);  
    const [camZoom, setCamZoom] = useState(0.4); 
    const [isDraggingCam, setIsDraggingCam] = useState(false);
    const camDragStart = useRef({ x: 0, y: 0 });

    // 📍 VARIÁVEL 1: POSIÇÕES DA COSMOLOGIA
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

    // 📍 VARIÁVEL 2: ESTRELAS E PLANETAS
    const [elementosSolar, setElementosSolar] = useState([
        { "id": "orichalcosA", "tipo": "estrela", "nome": "Orichalcos A", "top": "500px", "left": "400px", "size": "200px" },
        { "id": "orichalcosB", "tipo": "estrela", "nome": "Orichalcos B", "top": "500px", "left": "1600px", "size": "200px" },
        { "id": "vegeta", "tipo": "planeta", "nome": "Vegeta", "color1": "#ff6666", "color2": "#990000", "shadow": "rgba(255,0,0,0.5)", "size": "55px", "tempo": "40s", "delay": "-5s", "pathIdx": 1 },
        { "id": "namekusei", "tipo": "planeta", "nome": "Namekusei", "color1": "#66ff66", "color2": "#006600", "shadow": "rgba(0,255,0,0.5)", "size": "70px", "tempo": "50s", "delay": "-20s", "pathIdx": 2 },
        { "id": "desconhecido", "tipo": "planeta", "nome": "Desconhecido", "color1": "#66b3ff", "color2": "#000066", "shadow": "rgba(0,100,255,0.5)", "size": "45px", "tempo": "60s", "delay": "-45s", "pathIdx": 3 },
        { "id": "terra0", "tipo": "terra", "nome": "Terra 0", "size": "120px", "tempo": "30s", "delay": "0s", "pathIdx": 0 }
    ]);

    // 📍 VARIÁVEL 3: CALIBRAGEM DAS ÓRBITAS 
    const [configOrbitas, setConfigOrbitas] = useState({
        "terra0": { rx: 800, ry: 400 },
        "vegeta": { rx: 850, ry: 440 },
        "namekusei": { rx: 1000, ry: 499 }, // Conforme sua print
        "desconhecido": { rx: 900, ry: 480 }
    });

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
    // 🧮 GERADOR MATEMÁTICO DA RODOVIA CÓSMICA
    // ==========================================
    const getPathCaminho = (rx, ry) => {
        return `M 1000 500 C ${1000 + rx*0.375} ${500 - ry}, ${1000 + rx} ${500 - ry*0.75}, ${1000 + rx} 500 C ${1000 + rx} ${500 + ry*0.75}, ${1000 + rx*0.375} ${500 + ry}, 1000 500 C ${1000 - rx*0.375} ${500 - ry}, ${1000 - rx} ${500 - ry*0.75}, ${1000 - rx} 500 C ${1000 - rx} ${500 + ry*0.75}, ${1000 - rx*0.375} ${500 + ry}, 1000 500 Z`;
    };

    const caminhosGerados = {
        "terra0": getPathCaminho(configOrbitas.terra0.rx, configOrbitas.terra0.ry),
        "vegeta": getPathCaminho(configOrbitas.vegeta.rx, configOrbitas.vegeta.ry),
        "namekusei": getPathCaminho(configOrbitas.namekusei.rx, configOrbitas.namekusei.ry),
        "desconhecido": getPathCaminho(configOrbitas.desconhecido.rx, configOrbitas.desconhecido.ry)
    };

    // ==========================================
    // 🕹️ CONTROLES DA CÂMERA ESPACIAL
    // ==========================================
    const handleEspacoMouseDown = (e) => {
        if (e.target.closest('.painel-engenharia')) return;
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
        
        setCamRotY(prev => prev + diffX * 0.5);
        setCamRotX(prev => Math.max(10, Math.min(85, prev - diffY * 0.5))); 
        
        camDragStart.current = { x: clientX, y: clientY };
    };

    const handleEspacoMouseUp = () => setIsDraggingCam(false);

    const handleEspacoZoom = (e) => {
        if (nivelVisao !== 'sistema_solar') return;
        let novoZoom = camZoom - e.deltaY * 0.001;
        // Zoom extremo liberado! De 0.05 (mega afastado) até 4.0 (colado)
        setCamZoom(Math.max(0.05, Math.min(4.0, novoZoom))); 
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

    // 🛠️ MODO DEUS (Cosmologia)
    const handleDragStartCosmo = (e, index) => {
        if (!modoAjuste) return;
        e.stopPropagation();
        setDragIndexCosmo(index);
    };

    const handleDragMoveCosmo = (e) => {
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

    const handleDragEndCosmo = () => { setDragIndexCosmo(null); };

    const gerarCodigoExportacao = () => {
        const codigoCosmo = JSON.stringify(zonasCosmologia, null, 4);
        const codigoSolar = JSON.stringify(elementosSolar, null, 4);
        const codigoOrbs = JSON.stringify(configOrbitas, null, 4);
        setCodigoExportado(`// COPIE E SUBSTITUA A 'zonasCosmologia':\nconst [zonasCosmologia, setZonasCosmologia] = useState(${codigoCosmo});\n\n// ======================================\n\n// COPIE E SUBSTITUA A 'elementosSolar':\nconst [elementosSolar, setElementosSolar] = useState(${codigoSolar});\n\n// ======================================\n\n// COPIE E SUBSTITUA A 'configOrbitas':\nconst [configOrbitas, setConfigOrbitas] = useState(${codigoOrbs});`);
    };

    // 🎛️ PAINEL DE ENGENHARIA SOLAR (COM LIMITES QUEBRADOS!)
    const PainelEngenhariaSolar = () => {
        if (!modoAjuste || nivelVisao !== 'sistema_solar') return null;
        
        return (
            <div 
                className="fade-in painel-engenharia" 
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()} 
                style={{ position: 'absolute', right: '20px', top: '80px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', padding: '20px', borderRadius: '15px', border: '1px solid #0088ff', zIndex: 150, display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '75vh', overflowY: 'auto', width: '300px', boxShadow: '0 0 20px rgba(0,136,255,0.3)' }}
            >
                <h3 style={{ color: '#fff', margin: '0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Engenharia Orbital</h3>
                
                {/* Sliders das Órbitas com LIMITES MASSIVOS */}
                {['terra0', 'vegeta', 'namekusei', 'desconhecido'].map(id => (
                    <div key={id} style={{ marginBottom: '5px', paddingBottom: '10px', borderBottom: '1px dotted #333' }}>
                        <span style={{ color: '#00ffcc', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Órbita: {id}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <label style={{ color: '#aaa', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>Largura (Eixo X) <span>{configOrbitas[id].rx}</span></label>
                            <input type="range" min="100" max="4000" value={configOrbitas[id].rx} onChange={(e) => setConfigOrbitas(prev => ({...prev, [id]: {...prev[id], rx: parseInt(e.target.value)}}))} />
                            
                            <label style={{ color: '#aaa', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>Altura (Eixo Y) <span>{configOrbitas[id].ry}</span></label>
                            <input type="range" min="50" max="2000" value={configOrbitas[id].ry} onChange={(e) => setConfigOrbitas(prev => ({...prev, [id]: {...prev[id], ry: parseInt(e.target.value)}}))} />
                        </div>
                    </div>
                ))}

                <h3 style={{ color: '#ffcc00', margin: '10px 0 0 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Estrelas Gêmeas</h3>
                
                {/* Sliders das Estrelas PODEM IR PRO NEGATIVO */}
                {['orichalcosA', 'orichalcosB'].map(id => {
                    const star = elementosSolar.find(e => e.id === id);
                    return (
                        <div key={id} style={{ marginBottom: '5px', paddingBottom: '10px', borderBottom: '1px dotted #333' }}>
                            <span style={{ color: '#ffcc00', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{star.nome}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                <label style={{ color: '#aaa', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>Posição X (Dir/Esq)</label>
                                <input type="range" min="-2000" max="4000" value={parseInt(star.left)} onChange={(e) => {
                                    setElementosSolar(prev => prev.map(el => el.id === id ? { ...el, left: `${e.target.value}px` } : el))
                                }} />
                                <label style={{ color: '#aaa', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>Posição Y (Cima/Baixo)</label>
                                <input type="range" min="-1000" max="2000" value={parseInt(star.top)} onChange={(e) => {
                                    setElementosSolar(prev => prev.map(el => el.id === id ? { ...el, top: `${e.target.value}px` } : el))
                                }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        );
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
            {modoAjuste && nivelVisao === 'sistema_solar' && <span style={{ color: '#00ffcc', fontSize: '11px', textAlign: 'center' }}>(Use o Painel Lateral Direito para ajustar Órbitas e Estrelas!)</span>}
            {modoAjuste && nivelVisao === 'cosmologia' && <span style={{ color: '#aaa', fontSize: '11px', textAlign: 'center' }}>(Arraste os planos e as dimensões.)</span>}
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
    // 🌌 TELA 0: SISTEMA SOLAR CÂMERA 3D BLINDADA 
    // ==========================================
    if (nivelVisao === 'sistema_solar') {
        const billboardTransform = `rotateY(${-camRotY}deg) rotateX(${-camRotX}deg)`;

        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', background: 'radial-gradient(circle at center, #0a0a1a 0%, #000000 100%)', position: 'relative', overflow: 'hidden', borderRadius: '15px', border: '1px solid #333' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px', opacity: 0.3 }} />
                
                <PainelModoDeus />
                <PainelEngenhariaSolar />

                <button onClick={() => setNivelVisao('cosmologia')} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(72, 61, 139, 0.4)', border: '1px solid #DDA0DD', color: '#DDA0DD', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', zIndex: 100, letterSpacing: '2px', boxShadow: '0 0 15px rgba(221, 160, 221, 0.3)', backdropFilter: 'blur(5px)' }}>🌌 REVELAR DIMENSÕES</button>

                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, pointerEvents: 'none' }}>
                    <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 0 10px #fff' }}>Universo Material</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0', letterSpacing: '1px' }}>Setor Orichalcos</p>
                    <p style={{ color: '#00ffcc', fontSize: '0.75em', margin: '5px 0 0 0' }}>🖱️ Arraste a tela para girar a câmera</p>
                    <p style={{ color: '#ffcc00', fontSize: '0.75em', margin: '2px 0 0 0' }}>🔍 Use o Scroll/Pinch para aplicar Zoom</p>
                </div>

                {/* CONTAINER DE PERSPECTIVA */}
                <div 
                    onWheel={handleEspacoZoom} 
                    style={{ position: 'absolute', inset: 0, perspective: '2500px', touchAction: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onMouseDown={handleEspacoMouseDown} onMouseMove={handleEspacoMouseMove} onMouseUp={handleEspacoMouseUp} onMouseLeave={handleEspacoMouseUp} 
                    onTouchStart={handleEspacoMouseDown} onTouchMove={handleEspacoMouseMove} onTouchEnd={handleEspacoMouseUp}
                >
                    {/* CONTAINER 3D DE 2000x1000 COM TRANSFORM STYLE PRESERVE-3D (Física Volumétrica) */}
                    <div style={{ position: 'relative', width: '2000px', height: '1000px', transformStyle: 'preserve-3d', transform: `scale(${camZoom}) rotateX(${camRotX}deg) rotateY(${camRotY}deg)`, cursor: isDraggingCam ? 'grabbing' : (modoAjuste ? 'default' : 'grab'), transition: isDraggingCam ? 'none' : 'transform 0.1s ease-out' }}>
                        
                        {/* 🖌️ O FUNDO SVG SÓ PARA DESENHAR AS LINHAS (C/ Overflow Visible) */}
                        <svg viewBox="0 0 2000 1000" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}>
                            <defs>
                                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            </defs>
                            {['terra0', 'vegeta', 'namekusei', 'desconhecido'].map((id) => (
                                <path 
                                    key={`trilha-${id}`} 
                                    className="linha-orbita-animada"
                                    d={caminhosGerados[id]} 
                                    fill="none" 
                                    stroke={id === 'terra0' ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.25)"} 
                                    strokeWidth={id === 'terra0' ? "6" : "3"} 
                                    strokeDasharray="20 40" 
                                    filter="url(#glow)" 
                                />
                            ))}
                        </svg>

                        {/* 🌍 ESTRELAS E PLANETAS RENDERIZADOS EM HTML PARA PRESERVAR O 3D! */}
                        {elementosSolar.map(el => {
                            if (el.tipo === 'estrela') {
                                return (
                                    <div key={el.id} style={{ position: 'absolute', top: el.top, left: el.left, width: el.size, height: el.size, zIndex: 5, transform: 'translate(-50%, -50%)', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #ffcc00 40%, #ff5500 100%)', boxShadow: '0 0 150px #ffcc00, 0 0 250px #ff5500, inset -30px -30px 60px rgba(255,50,0,0.8)', transform: billboardTransform, transformStyle: 'preserve-3d' }} />
                                    </div>
                                );
                            }
                            
                            if (el.tipo === 'planeta') {
                                return (
                                    <div key={el.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
                                        {/* AQUI A MÁGICA: A animação usa o MESMO caminho dinâmico gerado pelos Sliders */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: el.size, height: el.size, zIndex: 10, offsetPath: `path("${caminhosGerados[el.id]}")`, offsetRotate: '0deg', animation: `orbitaSempre ${el.tempo} linear infinite`, animationDelay: el.delay, transformStyle: 'preserve-3d', pointerEvents: 'auto' }}>
                                            <div style={{ width: '100%', height: '100%', transform: billboardTransform, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
                                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${el.color1}, ${el.color2})`, boxShadow: `inset -20px -20px 30px rgba(0,0,0,0.9), inset 8px 8px 20px rgba(255,255,255,0.4), 0 0 30px ${el.shadow}`, zIndex: 10, cursor: 'pointer' }} onClick={() => alert(`Planeta ${el.nome}\nAcesso restrito.`)} />
                                                <div style={{ position: 'absolute', width: '140%', height: '140%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 5, transform: 'rotateX(65deg)' }}></div>
                                                <span style={{ color: el.color1, position: 'absolute', bottom: '-45px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,255,255,0.5)' }}>{el.nome}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (el.tipo === 'terra') {
                                return (
                                    <div key={el.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: el.size, height: el.size, zIndex: 20, offsetPath: `path("${caminhosGerados[el.id]}")`, offsetRotate: '0deg', animation: `orbitaSempre ${el.tempo} linear infinite`, animationDelay: el.delay, transformStyle: 'preserve-3d', pointerEvents: 'auto' }}>
                                            <div style={{ width: '100%', height: '100%', transform: billboardTransform, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
                                                
                                                <div onClick={() => setNivelVisao('globo')} style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #4db8ff, #002244)', boxShadow: 'inset -30px -30px 50px rgba(0,0,0,0.9), inset 12px 12px 25px rgba(255,255,255,0.4), 0 0 60px rgba(0,150,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 10, cursor: 'pointer' }} />
                                                
                                                <div style={{ position: 'absolute', width: '220%', height: '220%', transform: 'rotateX(75deg)', pointerEvents: 'none', zIndex: 5, transformStyle: 'preserve-3d' }}>
                                                    <div className="moon-orbit-flat" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px dashed rgba(255,255,255,0.25)', position: 'relative', transformStyle: 'preserve-3d' }}>
                                                        
                                                        {/* MARIA */}
                                                        <div style={{ position: 'absolute', top: '0%', left: '50%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
                                                            <div className="moon-sphere" style={{ width: '20px', height: '20px', background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #777777 50%, #000000 100%)', borderRadius: '50%', boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.6)' }}>
                                                                <span className="moon-text" style={{position:'absolute', top: '-25px', left:'-10px', fontSize:'14px', fontWeight: 'bold', color:'#fff', textShadow: '0 0 8px #000'}}>Maria</span>
                                                            </div>
                                                        </div>

                                                        {/* ROSE */}
                                                        <div style={{ position: 'absolute', top: '85%', left: '85%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
                                                            <div className="moon-sphere" style={{ width: '18px', height: '18px', background: 'radial-gradient(circle at 35% 35%, #ffaaaa 0%, #aa3333 50%, #220000 100%)', borderRadius: '50%', boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.9), 0 0 15px rgba(255,100,100,0.6)' }}>
                                                                <span className="moon-text" style={{position:'absolute', top: '-25px', right:'-5px', fontSize:'14px', fontWeight: 'bold', color:'#fff', textShadow: '0 0 8px #000'}}>Rose</span>
                                                            </div>
                                                        </div>

                                                        {/* SINA */}
                                                        <div style={{ position: 'absolute', top: '85%', left: '15%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
                                                            <div className="moon-sphere" style={{ width: '24px', height: '24px', background: 'radial-gradient(circle at 35% 35%, #aaaaff 0%, #4444aa 50%, #000022 100%)', borderRadius: '50%', boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.9), 0 0 15px rgba(100,150,255,0.6)' }}>
                                                                <span className="moon-text" style={{position:'absolute', top: '-25px', left:'-5px', fontSize:'14px', fontWeight: 'bold', color:'#fff', textShadow: '0 0 8px #000'}}>Sina</span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                                
                                                <span style={{ color: '#4db8ff', position: 'absolute', bottom: '-55px', fontSize: '22px', fontWeight: 'bold', letterSpacing: '5px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 15px rgba(0,150,255,1)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{el.nome}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>

                {codigoExportado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ background: '#111', padding: '20px', borderRadius: '10px', width: '800px', border: '2px solid #00cc66' }}>
                            <h2 style={{ color: '#00cc66', marginTop: 0 }}>✅ Pronto! Substitua seu código por este:</h2>
                            <textarea readOnly value={codigoExportado} style={{ width: '100%', height: '400px', background: '#000', color: '#00ffcc', padding: '10px', fontFamily: 'monospace', fontSize: '12px' }} />
                            <button onClick={() => setCodigoExportado(null)} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '10px 20px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>FECHAR E VOLTAR</button>
                        </div>
                    </div>
                )}
                
                <style dangerouslySetInnerHTML={{__html: `
                    .fade-in { animation: fadeIn 0.8s ease-in-out; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    
                    /* O anel das luas gira 360 no eixo Z */
                    .moon-orbit-flat { animation: spinFlat 15s linear infinite; }
                    @keyframes spinFlat { 100% { transform: rotateZ(360deg); } }
                    
                    /* A MÁGICA: A lua gira -360 no eixo Z e desfaz os 75 graus do anel pra sempre encarar a tela! */
                    .moon-sphere { 
                        position: absolute; 
                        transform-style: preserve-3d;
                        animation: standUpMoon 15s linear infinite; 
                    }
                    @keyframes standUpMoon {
                        0% { transform: translate(-50%, -50%) rotateZ(0deg) rotateX(-75deg); }
                        100% { transform: translate(-50%, -50%) rotateZ(-360deg) rotateX(-75deg); }
                    }

                    .linha-orbita-animada { animation: fluxoEnergia 2s linear infinite; }
                    @keyframes fluxoEnergia {
                        from { stroke-dashoffset: 25; }
                        to { stroke-dashoffset: 0; }
                    }

                    @keyframes orbitaSempre {
                        0% { offset-distance: 0%; }
                        100% { offset-distance: 100%; }
                    }
                `}} />
            </div>
        );
    }

    // ==========================================
    // 🌌 TELA 1: COSMOLOGIA
    // ==========================================
    if (nivelVisao === 'cosmologia') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '85vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <PainelModoDeus />
                <button onClick={() => setNivelVisao('sistema_solar')} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', zIndex: 100 }}>⬅ VOLTAR AO ESPAÇO</button>

                <div ref={containerRef} onMouseMove={handleDragMoveCosmo} onMouseUp={handleDragEndCosmo} onMouseLeave={handleDragEndCosmo} onTouchMove={handleDragMoveCosmo} onTouchEnd={handleDragEndCosmo} style={{ position: 'relative', width: '1000px', height: '600px', borderRadius: '15px', overflow: 'hidden', marginTop: '50px' }}>
                    <img src={mapaCosmologia} alt="Cosmologia" style={{ width: '100%', height: '100%', objectFit: 'fill', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))', pointerEvents: 'none' }} />

                    {zonasCosmologia.map((zona, index) => (
                        <div 
                            key={`${zona.nome}-${index}`}
                            onMouseEnter={() => !modoAjuste && setPlanoHover(zona.nome)}
                            onMouseLeave={() => !modoAjuste && setPlanoHover(null)}
                            onMouseDown={(e) => handleDragStartCosmo(e, index)}
                            onTouchStart={(e) => handleDragStartCosmo(e, index)}
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