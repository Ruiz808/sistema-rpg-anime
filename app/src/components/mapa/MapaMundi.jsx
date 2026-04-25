import React, { useState, useRef, useEffect } from 'react';
import mapaClean from '../../assets/runeterra-clean.jpg';
import mapaGabarito from '../../assets/runeterra-gabarito.png';

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
    const [reinoHover, setReinoHover] = useState(null); 
    
    const [modoEdicaoMapa, setModoEdicaoMapa] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const [rotacaoGlobo, setRotacaoGlobo] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const canvasRef = useRef(null);           // Lê o gabarito (Invisível)
    const highlightCanvasRef = useRef(null);  // Desenha a máscara brilhante (Visível)
    const imgIdMapRef = useRef(null);

    // --- DICIONÁRIO DE CORES DO SEU GABARITO ---
    const dicionarioCores = {
        'rgb(255,0,0)': 'Noxus',      
        'rgb(0,255,0)': 'Ixtal',      
        'rgb(0,0,255)': 'Freljord',   
        'rgb(255,255,0)': 'Shurima',  
        'rgb(0,255,255)': 'Ionia',    
        'rgb(255,0,255)': 'Targon',   
        'rgb(255,128,0)': 'Águas de Sentina',
        'rgb(128,0,128)': 'Demacia',
        'rgb(0,128,128)': 'Ilha das Sombras',
        'rgb(128,128,0)': 'Piltover e Zaun'
    };

    const posicoesPings = [
        { nome: 'Freljord', top: '18%', left: '30%', cor: '#00b5e2' },
        { nome: 'Demacia', top: '42%', left: '22%', cor: '#d3c29e' },
        { nome: 'Noxus', top: '30%', left: '55%', cor: '#c62828' },
        { nome: 'Piltover e Zaun', top: '55%', left: '56%', cor: '#d4a017' },
        { nome: 'Shurima', top: '75%', left: '42%', cor: '#c59b0d' },
        { nome: 'Targon', top: '70%', left: '22%', cor: '#5e35b1' },
        { nome: 'Águas de Sentina', top: '58%', left: '72%', cor: '#d84315' },
        { nome: 'Ilha das Sombras', top: '85%', left: '72%', cor: '#00838f' },
        { nome: 'Ionia', top: '45%', left: '85%', cor: '#43a047' },
        { nome: 'Ixtal', top: '72%', left: '65%', cor: '#2e7d32' }
    ];

    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
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
        setRotacaoGlobo({ x: rotacaoGlobo.x + diffX * 0.4, y: novoY });
        dragStart.current = { x: currentX, y: currentY };
    };

    const handleDragEnd = () => setIsDragging(false);

    const criarNovoMapa = () => {
        const nome = prompt("Digite o nome do novo mapa para " + reinoSelecionado + ":");
        if (nome && nome.trim() !== "") {
            setMapasSalvos(prev => ({ ...prev, [reinoSelecionado]: [...(prev[reinoSelecionado] || []), nome] }));
        }
    };

    const entrarNoContinente = (nomeContinente) => {
        setLocalAtual({ continente: nomeContinente, reino: null, mapaId: null });
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
        else if (nivelVisao === 'continente') {
            setNivelVisao('globo');
            setLocalAtual({ continente: null, reino: null });
        }
    };

    // --- LÓGICA DE DETECÇÃO POR PIXEL ---
    const detectarReino = (e) => {
        if (nivelVisao !== 'continente' || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const corRGB = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        
        // Adiciona uma pequena tolerância caso o jpeg tenha sujado a cor
        let reinoEncontrado = dicionarioCores[corRGB] || null;
        if(!reinoEncontrado) {
             const [r,g,b] = pixel;
             for (const [cor, reino] of Object.entries(dicionarioCores)) {
                 const [tr, tg, tb] = cor.match(/\d+/g).map(Number);
                 if (Math.abs(r-tr)<20 && Math.abs(g-tg)<20 && Math.abs(b-tb)<20) {
                     reinoEncontrado = reino; break;
                 }
             }
        }
        setReinoHover(reinoEncontrado);
    };

    // --- CARREGAMENTO DO GABARITO ---
    useEffect(() => {
        const desenharGabarito = () => {
            const img = imgIdMapRef.current;
            const canvas = canvasRef.current;
            if (!img || !canvas || img.naturalWidth === 0) return;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        };
        if (nivelVisao === 'continente' && imgIdMapRef.current) {
            if (imgIdMapRef.current.complete) setTimeout(desenharGabarito, 100); 
            else imgIdMapRef.current.onload = desenharGabarito;
        }
    }, [nivelVisao]);

    // 🔥 A MÁGICA DA MÁSCARA BRILHANTE 🔥
    useEffect(() => {
        const iCanvas = canvasRef.current;
        const hCanvas = highlightCanvasRef.current;
        if (!iCanvas || !hCanvas || !reinoHover) return; // Não limpa o canvas, deixa o CSS apagar suavemente

        const iCtx = iCanvas.getContext('2d', { willReadFrequently: true });
        const hCtx = hCanvas.getContext('2d');

        hCanvas.width = iCanvas.width;
        hCanvas.height = iCanvas.height;
        hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);

        const targetColorStr = Object.keys(dicionarioCores).find(k => dicionarioCores[k] === reinoHover);
        if (!targetColorStr) return;
        const [tr, tg, tb] = targetColorStr.match(/\d+/g).map(Number);

        const reinoObj = posicoesPings.find(p => p.nome === reinoHover);
        let hr = 255, hg = 255, hb = 255;
        if (reinoObj) {
            const hex = reinoObj.cor.replace('#', '');
            hr = parseInt(hex.substring(0, 2), 16); hg = parseInt(hex.substring(2, 4), 16); hb = parseInt(hex.substring(4, 6), 16);
        }

        const idData = iCtx.getImageData(0, 0, iCanvas.width, iCanvas.height);
        const hData = hCtx.createImageData(iCanvas.width, iCanvas.height);

        for (let i = 0; i < idData.data.length; i += 4) {
            const r = idData.data[i], g = idData.data[i+1], b = idData.data[i+2];
            if (Math.abs(r - tr) < 20 && Math.abs(g - tg) < 20 && Math.abs(b - tb) < 20) {
                hData.data[i] = hr; hData.data[i+1] = hg; hData.data[i+2] = hb;
                hData.data[i+3] = 130; // Nível de brilho da máscara
            }
        }
        hCtx.putImageData(hData, 0, 0);
    }, [reinoHover]);

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
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #00ffcc' }}>Visão Orbital</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Arraste em qualquer direção para inspecionar o planeta.</p>
                </div>

                <div style={{ position: 'relative', width: '350px', height: '350px', perspective: '1000px' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#000814', border: '2px solid #0088ff', pointerEvents: 'none', boxShadow: '0 0 50px rgba(0, 136, 255, 0.2)' }}></div>
                    <div 
                        onMouseDown={handleDragStart}
                        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rotacaoGlobo.y}deg) rotateY(${rotacaoGlobo.x}deg)`, cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'transform 0.5s ease-out' }}
                    >
                        {/* AS LINHAS E DESENHOS DO GLOBO */}
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
                            <button onClick={() => entrarNoContinente('Runeterra')} className="btn-neon" style={{ pointerEvents: 'auto', background: 'rgba(0,255,204,0.1)', border: '2px solid #00ffcc', color: '#00ffcc', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', letterSpacing: '2px', backdropFilter: 'blur(5px)', boxShadow: '0 0 20px rgba(0,255,204,0.4)', zIndex: 10 }}>🌍 ENTRAR EM RUNETERRA</button>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset -50px -50px 100px rgba(0,0,0,0.9), inset 20px 20px 50px rgba(0,136,255,0.1)', pointerEvents: 'none', zIndex: 20 }}></div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE
    // ==========================================
    if (nivelVisao === 'continente') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.85)', padding: '12px 25px', borderBottom: '1px solid #222', zIndex: 10 }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '6px 18px', fontSize: '0.85em', cursor: 'pointer' }}>⬅ VOLTAR AO GLOBO</button>
                    <h2 style={{ color: '#0088ff', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 0 10px #0088ff' }}>{reinoHover || localAtual.continente}</h2>
                    <div style={{ width: '120px' }}></div>
                </div>

                {/* CAIXA COM SHRINK-WRAP: O SEGREDO DO ALINHAMENTO PERFEITO */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
                    <div 
                        style={{ position: 'relative', display: 'inline-block', cursor: reinoHover ? 'pointer' : 'default' }} 
                        onMouseMove={detectarReino}
                    >
                        {/* 1. O MAPA BASE */}
                        <img 
                            src={mapaClean} 
                            alt="Mapa de Runeterra" 
                            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(65vh - 70px)', width: 'auto', height: 'auto' }} 
                        />
                        
                        {/* 2. O GABARITO INVISÍVEL */}
                        <img ref={imgIdMapRef} src={mapaGabarito} style={{ display: 'none' }} alt="Gabarito" />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* 3. A MÁSCARA BRILHANTE (VISÍVEL) */}
                        <canvas 
                            ref={highlightCanvasRef} 
                            style={{ 
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2,
                                opacity: reinoHover ? 1 : 0, transition: 'opacity 0.3s ease', mixBlendMode: 'screen' 
                            }} 
                        />

                        <style dangerouslySetInnerHTML={{__html: `
                            .ping-wrapper { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; z-index: 5; transition: 0.2s; }
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
                                <div className="ping-anel-externo" style={{ borderColor: reino.cor }}>
                                    <div className="ping-nucleo" style={{ background: reino.cor, boxShadow: `0 0 10px ${reino.cor}` }}></div>
                                </div>
                                <div className="ping-legenda">{reino.nome}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MODAL DE SELEÇÃO */}
                {reinoSelecionado && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(6px)' }}>
                        <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '380px', textAlign: 'center', position: 'relative', boxShadow: '0 0 40px #0088ff' }}>
                            <button onClick={() => setReinoSelecionado(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '22px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            <h2 style={{ color: '#ffcc00', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{reinoSelecionado}</h2>
                            <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '20px' }}>Selecione o cenário para esta região:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                                {(mapasSalvos[reinoSelecionado] || []).map(mapa => (
                                    <button 
                                        key={mapa} 
                                        onClick={() => entrarNoMapaDeBatalha(mapa)} 
                                        style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s', textAlign: 'left', fontSize: '0.95em' }}
                                        onMouseEnter={(e) => { e.target.style.borderColor='#0088ff'; e.target.style.background='#222'; }} 
                                        onMouseLeave={(e) => { e.target.style.borderColor='#333'; e.target.style.background='#1a1a1a'; }}
                                    >
                                        🗺️ {mapa}
                                    </button>
                                ))}
                            </div>
                            <button onClick={criarNovoMapa} className="btn-neon" style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9em' }}>➕ CRIAR NOVO MAPA</button>
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
                <div style={{ background: '#111', padding: '12px 20px', borderRadius: '10px 10px 0 0', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '7px 18px', fontSize: '0.85em' }}>⬅ SAIR DO MAPA</button>
                        <button onClick={() => { setUrlInput(backgroundUrl || ''); setModoEdicaoMapa(true); }} style={{ background: 'transparent', color: '#0088ff', border: '1px solid #0088ff', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>⚙️ EDITAR CENÁRIO</button>
                    </div>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '1px', textTransform: 'uppercase' }}>{localAtual.reino} : {localAtual.mapaId}</span>
                </div>
                
                <div className="fade-in" style={{ flex: 1, position: 'relative', backgroundColor: '#050508', backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', border: '1px solid #333', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    {!backgroundUrl && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#444', border: '2px dashed #333', padding: '50px', borderRadius: '20px', pointerEvents: 'none' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', textTransform: 'uppercase' }}>Campo de Batalha Vazio</h3>
                            <p style={{ margin: 0 }}>Clique em <b>"⚙️ EDITAR CENÁRIO"</b> para adicionar uma imagem de fundo.</p>
                        </div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>{children}</div>

                    {modoEdicaoMapa && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 25, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                            <div style={{ background: '#111', border: '2px solid #0088ff', borderRadius: '20px', padding: '30px', width: '420px', textAlign: 'center', boxShadow: '0 0 35px #0088ff', position: 'relative' }}>
                                <button onClick={() => setModoEdicaoMapa(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: '#ff4444', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                <h3 style={{ color: '#0088ff', marginTop: '0', textTransform: 'uppercase', letterSpacing: '2px' }}>Configurar Cenário</h3>
                                <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '22px' }}>Cole o Link (URL) da imagem para o fundo da batalha.</p>
                                <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Ex: https://i.imgur.com/mapa.jpg" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', marginBottom: '25px', fontSize: '14px' }} />
                                <button onClick={() => { setMapasImagens(prev => ({ ...prev, [localAtual.mapaId]: urlInput })); setModoEdicaoMapa(false); }} className="btn-neon" style={{ width: '100%', background: 'linear-gradient(to right, #0088ff, #00ffcc)', color: '#000', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>💾 SALVAR CENÁRIO</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
}