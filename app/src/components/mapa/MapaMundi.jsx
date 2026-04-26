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

    // 🔥 A NOVA CONFIGURAÇÃO DA COSMOLOGIA 🔥
    // Baseada exatamente na imagem de design e na lista de cores fornecida.
    // O Plano do Caos é o background preto.
    const planosDimensionais = [
        { nome: 'Plano do Fogo', cor: '#F08080', angulo: 0, raio: 220 }, // Vermelho claro
        { nome: 'Plano das fadas', cor: '#00FF00', angulo: 36, raio: 220 }, // Verde
        { nome: 'Plano da terra', cor: '#CD853F', angulo: 72, raio: 220 }, // cor de pele/marrom
        { nome: 'Plano da Agua', cor: '#0000FF', angulo: 108, raio: 220 }, // Azul
        { nome: 'Plano do Ether', cor: '#800080', angulo: 144, raio: 220 }, // Roxo
        { nome: 'Plano do Vento', cor: '#D3D3D3', angulo: 180, raio: 220 }, // Cinza claro
        { nome: 'Plano Astral', cor: '#696969', angulo: 216, raio: 220 }, // Cinza escuro
        { nome: 'Inferno', cor: '#800000', angulo: 252, raio: 220 }, // Vinho
        { nome: 'Ceus', cor: '#ADD8E6', angulo: 288, raio: 220 }, // Azul claro
        { nome: 'Plano da ordem', cor: '#FFFF00', angulo: 324, raio: 220 } // Amarelo
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

    const handleMapClickAdmin = (e) => {
        if (e.shiftKey) {
            const rect = e.currentTarget.getBoundingClientRect();
            alert(`Coordenadas exatas:\ntop: '${(((e.clientY - rect.top) / rect.height) * 100).toFixed(0)}%', left: '${(((e.clientX - rect.left) / rect.width) * 100).toFixed(0)}%'`);
        }
    };

    // ==========================================
    // 🌌 CAMADA 0: O ATLAS DIMENSIONAL (Desenhado exatamente como solicitado!)
    // 🔥 O FUNDO PRETO É O PLANO DO CAOS 🔥
    // ==========================================
    if (nivelVisao === 'cosmologia') {
        return (
            <div className="fade-in" style={{ 
                width: '100%', height: '85vh', background: '#000', borderRadius: '15px', 
                border: '1px solid #1a1a2e', position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Título Superior */}
                <div style={{ position: 'absolute', top: '30px', textAlign: 'center', zIndex: 10 }}>
                    <h1 style={{ color: '#fff', margin: 0, letterSpacing: '8px', textTransform: 'uppercase', fontSize: '1.5em', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>Cosmologia</h1>
                    <div style={{ height: '2px', width: '200px', background: 'linear-gradient(to right, transparent, #fff, transparent)', margin: '10px auto' }}></div>
                </div>

                <div style={{ position: 'relative', width: '800px', height: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* 🔥 O DESIGN DO DIAGRAMA (Desenhado em CSS Puro!) 🔥 */}
                    {/* Círculo Central Arcaico */}
                    <div style={{ position: 'absolute', width: '420px', height: '420px', border: '3px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '380px', height: '380px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', border: '3px solid rgba(255, 255, 255, 0.15)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                    
                    {/* Linhas de Cruzamento Geométrica */}
                    <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '2px', height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.3), transparent)', pointerEvents: 'none' }}></div>
                    
                    {/* Linhas Diagonais Arcanas */}
                    <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.1)', transform: 'rotate(45deg)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.1)', transform: 'rotate(-45deg)', pointerEvents: 'none' }}></div>

                    {/* 🔥 CENTRO: Terra 0 (Runeterra) - BRANCO 🔥 */}
                    <div 
                        onClick={() => setNivelVisao('globo')}
                        onMouseEnter={() => setPlanoHover('Terra 0')}
                        onMouseLeave={() => setPlanoHover(null)}
                        style={{ 
                            width: '180px', height: '180px', borderRadius: '50%', cursor: 'pointer',
                            background: '#000', border: '4px solid #FFFFFF', zIndex: 20,
                            boxShadow: planoHover === 'Terra 0' ? '0 0 60px #FFFFFF' : '0 0 20px rgba(255,255,255,0.4)',
                            transition: '0.4s', position: 'relative', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', textShadow: '0 0 8px #FFFFFF' }}>Terra 0<br/>(Runeterra)</span>
                    </div>

                    {/* 🔥 OS NOME DAS DIMENSÕES FLUTUANTES (SEM BOLINHAS!) 🔥 */}
                    {planosDimensionais.map((plano) => {
                        const rad = (plano.angulo * Math.PI) / 180;
                        const x = Math.cos(rad) * plano.raio;
                        const y = Math.sin(rad) * plano.raio;

                        return (
                            <div 
                                key={plano.nome}
                                onClick={() => alert(`Viajando para: ${plano.nome}`)}
                                onMouseEnter={() => setPlanoHover(plano.nome)}
                                onMouseLeave={() => setPlanoHover(null)}
                                style={{
                                    position: 'absolute', transform: `translate(${x}px, ${y}px)`,
                                    width: '100px', height: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', zIndex: 15, transition: '0.3s'
                                }}
                            >
                                {/* Só o texto colorido flutuando exatamente nas posições do design arcaico */}
                                <span style={{ 
                                    color: planoHover === plano.nome ? '#fff' : plano.cor,
                                    fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textShadow: planoHover === plano.nome ? `0 0 10px ${plano.cor}` : '0 0 5px #000',
                                    letterSpacing: '1px', textAlign: 'center', transition: '0.3s'
                                }}>{plano.nome}</span>
                            </div>
                        );
                    })}
                </div>

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
                <button onClick={voltarCamera} style={{ position: 'absolute', top: '20px', left: '20px', background: '#ff4444', border: 'none', color: '#fff', padding: '6px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', zIndex: 30 }}>⬅ MULTIVERSO</button>

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
                    <div style={{ position: 'relative', display: 'inline-block', height: '100%', maxHeight: 'calc(65vh - 70px)' }} onClick={handleMapClickAdmin}>
                        
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