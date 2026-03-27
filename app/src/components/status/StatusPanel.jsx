import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getRawBase, getBuffs } from '../../core/attributes.js'; 
import { getPrestigioReal, getRank } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

class StatusErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) return (
            <div style={{ padding: '20px', border: '2px solid #ff003c', background: '#1a0000', borderRadius: '10px', color: '#fff', margin: '20px' }}>
                <h3 style={{ color: '#ff003c', marginTop: 0 }}>🔥 ERRO DETECTADO NO PAINEL DE STATUS 🔥</h3>
                <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{this.state.error?.toString()}</pre>
            </div>
        );
        return this.props.children;
    }
}

const safeFn = (fn, fallback) => (...args) => {
    if (typeof fn !== 'function') return fallback;
    try { const res = fn(...args); return (res !== undefined && res !== null && !Number.isNaN(res)) ? res : fallback; } catch (e) { return fallback; }
};

const safeGetMaximo = safeFn(getMaximo, 1);
const safeGetRawBase = safeFn(getRawBase, 0);
const safeGetPrestigioReal = safeFn(getPrestigioReal, 0);
const safeGetRank = safeFn(getRank, { l: 'F', c: '#ffffff', a: 1 });

function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(255,255,255,${alpha})`;
    let c = hex.substring(1).split('');
    if(c.length === 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c= '0x'+c.join('');
    return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
}

const CX = 100, CY = 100, R = 75; 
const VITALS_RADAR = ['vida', 'mana', 'aura', 'chakra', 'corpo', 'status'];
const VITALS_LABELS = ['VIDA', 'MANA', 'AURA', 'CHAKRA', 'CORPO', 'STATUS'];
const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
const ATRIBUTOS_PRINCIPAIS = [
    { key: 'forca', label: 'Força' },
    { key: 'destreza', label: 'Destreza' },
    { key: 'inteligencia', label: 'Inteligência' },
    { key: 'sabedoria', label: 'Sabedoria' },
    { key: 'energiaEsp', label: 'Energia Espiritual' },
    { key: 'carisma', label: 'Carisma' },
];

const ANGLES = VITALS_RADAR.map((_, i) => (Math.PI * 2 * i) / 6 - Math.PI / 2);
function hexPoints(cx, cy, r) { return ANGLES.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' '); }
function radarPoint(cx, cy, r, idx, frac) {
    const a = ANGLES[idx]; const safeFrac = Number.isNaN(frac) ? 0 : frac;
    return [cx + r * safeFrac * Math.cos(a), cy + r * safeFrac * Math.sin(a)];
}

function getEfetivoMFormas(ficha, k) {
    const anchor = k === 'status' ? 'forca' : k;
    let s = ficha[anchor] || {};
    let b = getBuffs(ficha, anchor, true);
    let v = parseFloat(s.mFormas) || 1.0;
    if (!b._hasBuff || !b._hasBuff.mformas) return v;
    return (v === 1.0 ? 0 : v) + b.mformas;
}

function calcularPrestAtual(ficha, attrKey, baseP) {
    const mFormas = getEfetivoMFormas(ficha, attrKey);
    const multForma = mFormas >= 10 ? (mFormas / 10) : 1;
    return Math.floor(baseP * multForma);
}

const getBasePFor = (ficha, k) => {
    if (k === 'status') {
        let m = 0;
        STATS.forEach(s => m += safeGetRawBase(ficha, s));
        return Math.floor((m / 8) / 1000);
    }
    return safeGetPrestigioReal(k, safeGetRawBase(ficha, k));
};

function RadarChart({ ficha, isAtual, tempCores }) {
    const LIMIT = 100; 
    const chartValues = VITALS_RADAR.map((k) => {
        const baseP = getBasePFor(ficha, k);
        return isAtual ? calcularPrestAtual(ficha, k, baseP) : baseP;
    });

    const dataPoints = chartValues.map((v, i) => {
        let val = v || 0;
        if (val >= LIMIT) {
            val = val % LIMIT;
            if (val === 0 && v > 0) val = LIMIT;
        }
        return radarPoint(CX, CY, R, i, Math.min(val / LIMIT, 1));
    });
    
    const dataPoly = dataPoints.map((p) => `${p[0] || 0},${p[1] || 0}`).join(' ');

    const rankInfos = VITALS_RADAR.map((k) => {
        const baseP = getBasePFor(ficha, k);
        const pAtualValor = isAtual ? calcularPrestAtual(ficha, k, baseP) : baseP;
        return safeGetRank(pAtualValor, ficha?.ascensaoBase || 1);
    });

    const labelR = R + 18;
    const labelPos = ANGLES.map((a) => [CX + labelR * Math.cos(a), CY + labelR * Math.sin(a)]);

    // 🔥 AGORA LÊ O COFRE TEMPORÁRIO DE CORES 🔥
    const baseColor = tempCores?.radarBase || '#00ffff';
    const atualColor = tempCores?.radarAtual || '#ffcc00';

    const polyColor = isAtual ? hexToRgba(atualColor, 0.2) : hexToRgba(baseColor, 0.2);
    const strokeColor = isAtual ? atualColor : baseColor;
    const gridStroke = isAtual ? hexToRgba(atualColor, 0.1) : hexToRgba(baseColor, 0.1);

    return (
        <svg viewBox="0 0 200 200" className={`radar-svg ${isAtual ? 'atual' : ''}`} style={{ width: '100%', height: 'auto', maxHeight: '400px', overflow: 'visible' }}>
            {[0.25, 0.5, 0.75, 1.0].map((s, i) => (
                <polygon key={i} points={hexPoints(CX, CY, R * s)} fill="none" stroke={gridStroke} strokeWidth="1.5" />
            ))}
            {ANGLES.map((a, i) => (
                <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4" />
            ))}
            <polygon points={dataPoly} fill={polyColor} stroke={strokeColor} strokeWidth="2.5" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x || 0} cy={y || 0} r="4" fill={strokeColor} style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            ))}
            {VITALS_LABELS.map((lbl, i) => {
                const [lx, ly] = labelPos[i];
                const rk = rankInfos[i];
                return (
                    <text key={i} x={lx || 0} y={ly || 0} textAnchor="middle" dominantBaseline="central" fill={rk.c || '#fff'} fontSize="11" fontWeight="bold" style={{ textShadow: '0 0 5px #000' }}>
                        [{rk.l || 'F'}] A{rk.a || 1} {lbl}
                    </text>
                );
            })}
        </svg>
    );
}

function calcVitalScale(rawMx, key) {
    if (!rawMx || rawMx <= 0) return { p: 0, mxDisplay: 0 };
    const limit = (key === 'vida' || key === 'pv' || key === 'pm') ? 8 : 9;
    const strMx = Math.floor(rawMx).toString();
    const p = Math.max(0, strMx.length - limit);
    const mxDisplay = p > 0 ? Math.floor(rawMx / Math.pow(10, p)) : Math.floor(rawMx);
    return { p, mxDisplay };
}

function AtributosLista({ ficha, isAtual }) {
    const valores = useMemo(() => ATRIBUTOS_PRINCIPAIS.map(({ key, label }) => {
        let valor;
        if (isAtual) {
            valor = safeGetMaximo(ficha, key);
        } else {
            const rawBase = safeGetRawBase(ficha, key);
            const mBase = parseFloat(ficha[key]?.mBase) || 1.0;
            valor = Math.floor(rawBase * mBase);
        }
        return { key, label, valor };
    }), [ficha, isAtual]);

    return (
        <div className="atributo-lista" style={{ marginTop: '20px' }}>
            {valores.map(({ key, label, valor }) => (
                <div key={key} className="atributo-row" style={{ padding: '6px 0' }}>
                    <span style={{ fontSize: '1.05em' }}>{label}</span>
                    <span className={isAtual ? 'atributo-valor-atual' : 'atributo-valor-base'} style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{valor.toLocaleString('pt-BR')}</span>
                </div>
            ))}
        </div>
    );
}

function StatusPanelCore() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);

    const [targetBar, setTargetBar] = useState('vida');
    const [inputDano, setInputDano] = useState('');
    const [inputLetalidade, setInputLetalidade] = useState('0');
    
    const [showCores, setShowCores] = useState(false);
    const [salvandoCores, setSalvandoCores] = useState(false);
    
    // 🔥 COFRE TEMPORÁRIO DE CORES (Impede o Spam no Servidor) 🔥
    const [tempCores, setTempCores] = useState(ficha?.cores || {});

    const inicializado = useRef(false);

    // Se o Mestre/Jogador abrir a página, carregamos as cores salvas para o Cofre
    useEffect(() => {
        if (!showCores && ficha?.cores) {
            setTempCores(ficha.cores);
        }
    }, [ficha?.cores, showCores]);

    // 🔥 AS BARRAS AGORA LÊEM O COFRE EM TEMPO REAL 🔥
    const vitalsBars = useMemo(() => [
        { key: 'vida',   label: 'VIDA (HP)', color: tempCores?.vida || '#ff4d4d', borderC: tempCores?.vida || '#ff0000' },
        { key: 'mana',   label: 'MANA',      color: tempCores?.mana || '#00ffff' },
        { key: 'aura',   label: 'AURA',      color: tempCores?.aura || '#ffcc00' },
        { key: 'chakra', label: 'CHAKRA',    color: tempCores?.chakra || '#e6ffff' },
        { key: 'corpo',  label: 'CORPO',     color: tempCores?.corpo || '#ff66ff' },
    ], [tempCores]);

    const vitaisEspeciais = useMemo(() => [
        { key: 'pv', label: 'PONTOS VITAIS (PV)', color: tempCores?.pv || '#00ff88', borderC: tempCores?.pv || '#00ff88' },
        { key: 'pm', label: 'PONTOS MORTAIS (PM)', color: tempCores?.pm || '#cc00ff', borderC: tempCores?.pm || '#cc00ff' },
    ], [tempCores]);

    const allVitals = useMemo(() => [...vitalsBars, ...vitaisEspeciais], [vitalsBars, vitaisEspeciais]);

    const colorConfigs = [
        { key: 'vida', label: 'Vida (HP)', default: '#ff4d4d' },
        { key: 'mana', label: 'Mana', default: '#00ffff' },
        { key: 'aura', label: 'Aura', default: '#ffcc00' },
        { key: 'chakra', label: 'Chakra', default: '#e6ffff' },
        { key: 'corpo', label: 'Corpo', default: '#ff66ff' },
        { key: 'pv', label: 'P. Vitais', default: '#00ff88' },
        { key: 'pm', label: 'P. Mortais', default: '#cc00ff' },
        { key: 'radarBase', label: 'Radar (Base)', default: '#00ffff' },
        { key: 'radarAtual', label: 'Radar (Atual)', default: '#ffcc00' },
    ];

    // Atualiza apenas o ecrã instantaneamente
    const handleColorChange = (key, color) => {
        setTempCores(prev => ({ ...prev, [key]: color }));
    };

    // 🔥 O BOTÃO QUE EFETIVAMENTE GRAVA NA FORJA/FIREBASE 🔥
    const salvarCores = () => {
        updateFicha(f => {
            f.cores = { ...tempCores };
        });
        salvarFichaSilencioso(); // Agora salva de verdade!
        setSalvandoCores(true);
        setTimeout(() => setSalvandoCores(false), 2000);
    };

    const getVitalMax = useCallback((key, f) => {
        if (key === 'pv') {
            const bC = getBasePFor(f, 'corpo');
            const bV = getBasePFor(f, 'vida');
            const bCh = getBasePFor(f, 'chakra');
            const m = parseFloat(f.multiplicadorVida) || 1;
            return Math.floor(((bC + bV + bCh) / 3) * m);
        }
        if (key === 'pm') {
            const bM = getBasePFor(f, 'mana');
            const bS = getBasePFor(f, 'status');
            const bA = getBasePFor(f, 'aura');
            const m = parseFloat(f.multiplicadorMorte) || 1;
            return Math.floor(((bM + bS + bA) / 3) * m);
        }
        return safeGetMaximo(f, key);
    }, []);

    useEffect(() => {
        if (!ficha || inicializado.current) return;
        updateFicha((f) => {
            allVitals.forEach(({ key }) => {
                const rawMx = getVitalMax(key, f);
                const { mxDisplay } = calcVitalScale(rawMx, key);
                if (!f[key]) f[key] = {};
                if (f[key].atual === undefined || f[key].atual === null) {
                    f[key].atual = mxDisplay;
                }
            });
        });
        inicializado.current = true;
    }, [ficha, updateFicha, allVitals, getVitalMax]);

    const alterarVital = useCallback((tipo) => {
        const valor = parseInt(inputDano) || 0;
        if (valor <= 0) return;
        const letalidade = parseInt(inputLetalidade) || 0;

        updateFicha((f) => {
            const rawMx = getVitalMax(targetBar, f);
            const { mxDisplay } = calcVitalScale(rawMx, targetBar); 
            
            let danoFinal = valor;
            if (tipo === 'dano' && letalidade > 0) {
                danoFinal = valor * Math.pow(10, letalidade);
            }
            
            if (!f[targetBar]) f[targetBar] = {};
            if (tipo === 'dano') {
                f[targetBar].atual = Math.max(0, (f[targetBar].atual || 0) - danoFinal);
            } else {
                f[targetBar].atual = Math.min(mxDisplay, (f[targetBar].atual || 0) + danoFinal);
            }
        });
        salvarFichaSilencioso();
        setInputDano('');
    }, [inputDano, inputLetalidade, updateFicha, targetBar, getVitalMax]);

    const curarTudo = useCallback(() => {
        updateFicha((f) => {
            allVitals.forEach(({ key }) => {
                const rawMx = getVitalMax(key, f);
                const { mxDisplay } = calcVitalScale(rawMx, key);
                if(f[key]) f[key].atual = mxDisplay; 
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, allVitals, getVitalMax]);

    const aplicarRegeneracaoTurno = useCallback(() => {
        updateFicha((f) => {
            allVitals.forEach(({ key }) => {
                const rawMx = getVitalMax(key, f);
                const { mxDisplay } = calcVitalScale(rawMx, key);
                const regen = parseFloat(f[key]?.regeneracao) || 0;
                
                if (regen > 0 && (f[key].atual || 0) < mxDisplay) {
                    f[key].atual = Math.min(mxDisplay, (f[key].atual || 0) + regen);
                }
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, allVitals, getVitalMax]);

    const resetarTurno = useCallback(() => {
        updateFicha(f => {
            if (!f.acoes) return;
            f.acoes.padrao.atual = f.acoes.padrao.max;
            f.acoes.bonus.atual = f.acoes.bonus.max;
            f.acoes.reacao.atual = f.acoes.reacao.max;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const changeActionMax = useCallback((tipo, delta) => {
        updateFicha(f => {
            if (!f.acoes) f.acoes = { padrao: { max: 1, atual: 1 }, bonus: { max: 1, atual: 1 }, reacao: { max: 1, atual: 1 } };
            const newMax = Math.max(1, f.acoes[tipo].max + delta);
            f.acoes[tipo].max = newMax;
            if (f.acoes[tipo].atual > newMax) f.acoes[tipo].atual = newMax;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const toggleActionDot = useCallback((tipo, isAvailable) => {
        updateFicha(f => {
            if (!f.acoes) f.acoes = { padrao: { max: 1, atual: 1 }, bonus: { max: 1, atual: 1 }, reacao: { max: 1, atual: 1 } };
            if (isAvailable) {
                f.acoes[tipo].atual = Math.max(0, f.acoes[tipo].atual - 1);
            } else {
                f.acoes[tipo].atual = Math.min(f.acoes[tipo].max, f.acoes[tipo].atual + 1);
            }
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const renderActionDots = (tipo, color, label) => {
        const data = ficha?.acoes?.[tipo] || { max: 1, atual: 1 };
        const dots = [];
        for (let i = 0; i < data.max; i++) {
            const isAvailable = i < data.atual;
            dots.push(
                <div
                    key={i}
                    onClick={() => toggleActionDot(tipo, isAvailable)}
                    title={isAvailable ? 'Clique para gastar esta Ação' : 'Clique para recuperar esta Ação'}
                    style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${color}`,
                        backgroundColor: isAvailable ? color : 'transparent',
                        cursor: 'pointer',
                        boxShadow: isAvailable ? `0 0 10px ${color}` : 'none',
                        transition: 'all 0.2s ease-in-out'
                    }}
                />
            );
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: color, fontSize: '0.85em', fontWeight: 'bold', textShadow: `0 0 5px ${color}` }}>{label}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${color}44` }}>
                    <button onClick={() => changeActionMax(tipo, -1)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '0 5px' }} title="Reduzir Ações Máximas">-</button>
                    <div style={{ display: 'flex', gap: '5px' }}>{dots}</div>
                    <button onClick={() => changeActionMax(tipo, 1)} style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '0 5px' }} title="Aumentar Ações Máximas">+</button>
                </div>
            </div>
        );
    };

    if (!ficha) return <div style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Carregando dados vitais...</div>;

    const renderBar = (item, index, isSpecial = false) => {
        const { key, label, color, borderC } = item;
        const rawMx = getVitalMax(key, ficha);
        const { p, mxDisplay } = calcVitalScale(rawMx, key);
        
        let atual = ficha[key]?.atual ?? mxDisplay;
        if (atual > mxDisplay) atual = mxDisplay; 

        const regen = parseFloat(ficha[key]?.regeneracao) || 0;
        const extra = regen > 0 ? `(+${regen}/turno)` : '';
        const gridStyle = (!isSpecial && index === 0) ? { gridColumn: '1 / -1', margin: 0 } : { margin: 0 };
        
        const percent = Number.isNaN(atual / mxDisplay) ? 0 : Math.min((atual / mxDisplay) * 100, 100);

        const vitalitySymbol = (p > 0 && (key === 'vida' || key === 'pv' || key === 'pm')) ? (
            <div style={{
                position: 'absolute', left: '8px', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', background: 'rgba(20, 0, 0, 0.9)', 
                border: `3px solid ${borderC || color}`, boxShadow: `0 0 10px ${borderC || color}, inset 0 0 5px ${borderC || color}80`,
                borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '18px',
                fontFamily: 'arial, sans-serif', textShadow: `0 0 5px ${borderC || color}`
            }}>
                {p}
            </div>
        ) : null;

        return (
            <div key={key} className="vital-container" style={gridStyle}>
                <div className="vital-label" style={{ color: color, textShadow: `0 0 8px ${color}80`, letterSpacing: '1px', fontWeight: 'bold', fontSize: '0.85em', textTransform: 'uppercase' }}>
                    {label} {extra && <span style={{fontSize: '0.9em', color: '#aaa', textShadow: 'none'}}>{extra}</span>}
                </div>
                <div className="bar-bg" style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isSpecial ? `1px solid ${color}40` : '' }}>
                    <div className="bar-fill" style={{ width: `${percent}%`, backgroundColor: color, position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 'inherit', transition: 'width 0.3s' }}></div>
                    {vitalitySymbol}
                    <div className="bar-text" style={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center', textShadow: '1px 1px 3px #000, -1px -1px 3px #000' }}>
                        <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#fff' }}>
                            {Math.floor(atual).toLocaleString('pt-BR')} / {mxDisplay.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="status-panel-container">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 className="section-title-mint-spaced" style={{ margin: 0, color: '#fff', fontSize: '1.2em' }}>&gt; STATUS PRINCIPAIS</h3>
                <button 
                    className="btn-neon btn-small" 
                    onClick={() => setShowCores(!showCores)} 
                    style={{ margin: 0, padding: '6px 15px', fontSize: '0.8em', borderColor: showCores ? '#ff003c' : '#ffcc00', color: showCores ? '#ff003c' : '#ffcc00' }}
                >
                    {showCores ? '❌ FECHAR PALETA' : '🎨 PERSONALIZAR CORES'}
                </button>
            </div>

            {showCores && (
                <div className="fade-in" style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '8px', border: '1px dashed #ffcc00', boxShadow: 'inset 0 0 20px rgba(255,204,0,0.1)' }}>
                    <h4 style={{ color: '#ffcc00', margin: '0 0 15px 0', letterSpacing: '1px' }}>🎨 Paleta da Alma</h4>
                    <p style={{ color: '#aaa', fontSize: '0.85em', marginTop: '-10px', marginBottom: '20px' }}>Selecione as cores e grave na Forja quando estiver satisfeito!</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                        {colorConfigs.map(c => (
                            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '5px' }}>
                                <input 
                                    type="color" 
                                    value={tempCores[c.key] || c.default} 
                                    onChange={e => handleColorChange(c.key, e.target.value)}
                                    style={{ width: '35px', height: '35px', padding: 0, border: 'none', borderRadius: '5px', cursor: 'pointer', background: 'transparent' }}
                                />
                                <label style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold' }}>{c.label}</label>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button className="btn-neon btn-red btn-small" onClick={() => {
                            if(window.confirm('Tem certeza que deseja resetar todas as cores para o padrão do sistema?')) {
                                setTempCores({});
                                updateFicha(f => { f.cores = {} });
                                salvarFichaSilencioso();
                            }
                        }} style={{ margin: 0 }}>🔄 Resetar Cores</button>
                        
                        <button 
                            className="btn-neon btn-gold btn-small" 
                            onClick={salvarCores} 
                            style={{ 
                                margin: 0, 
                                backgroundColor: salvandoCores ? 'rgba(0, 255, 100, 0.2)' : undefined,
                                borderColor: salvandoCores ? '#00ffcc' : undefined,
                                color: salvandoCores ? '#fff' : undefined
                            }}
                        >
                            {salvandoCores ? '✅ PALETA SALVA!' : '💾 SALVAR PALETA'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                {vitalsBars.map((item, i) => renderBar(item, i, false))}
            </div>

            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; ENERGIAS PRIMORDIAIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                {vitaisEspeciais.map((item, i) => renderBar(item, i, true))}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <div className="input-group" style={{ flex: 1, background: 'rgba(0, 255, 136, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid #00ff88', margin: 0 }}>
                    <label style={{ color: '#00ff88', fontSize: '0.8em', marginBottom: '5px', display: 'block' }}>MULT. DE VIDA (PV)</label>
                    <input type="number" step="0.1" value={ficha.multiplicadorVida || 1} onChange={(e) => { updateFicha(f => f.multiplicadorVida = parseFloat(e.target.value) || 1); salvarFichaSilencioso(); }} style={{ borderColor: '#00ff88', color: '#fff', width: '100%' }} />
                </div>
                <div className="input-group" style={{ flex: 1, background: 'rgba(255, 0, 255, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid #ff00ff', margin: 0 }}>
                    <label style={{ color: '#ff00ff', fontSize: '0.8em', marginBottom: '5px', display: 'block' }}>MULT. DE MORTE (PM)</label>
                    <input type="number" step="0.1" value={ficha.multiplicadorMorte || 1} onChange={(e) => { updateFicha(f => f.multiplicadorMorte = parseFloat(e.target.value) || 1); salvarFichaSilencioso(); }} style={{ borderColor: '#ff00ff', color: '#fff', width: '100%' }} />
                </div>
            </div>

            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; ECONOMIA DE AÇÕES (TURNO)</h3>
            <div style={{ background: 'rgba(10, 10, 20, 0.6)', border: '1px solid #333', borderRadius: '8px', padding: '15px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    {renderActionDots('padrao', '#0ff', 'AÇÃO PADRÃO')}
                    {renderActionDots('bonus', '#ffcc00', 'AÇÃO BÔNUS')}
                    {renderActionDots('reacao', '#ff00ff', 'REAÇÕES')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button className="btn-neon btn-blue" onClick={resetarTurno} style={{ padding: '8px 20px', letterSpacing: '1px' }}>
                        🔄 INICIAR NOVO TURNO (RESETAR AÇÕES)
                    </button>
                </div>
            </div>

            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; CONTROLE RÁPIDO</h3>
            <div className="form-row-dark" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: '10px', alignItems: 'end', background: 'transparent', padding: 0 }}>
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8em', color: '#aaa' }}>ALVO</label>
                    <select value={targetBar} onChange={e => setTargetBar(e.target.value)} style={{ padding: '9px', background: '#111', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '5px', fontWeight: 'bold' }}>
                        <option value="vida">Vida (HP)</option>
                        <option value="pv">Pontos Vitais (PV)</option>
                        <option value="pm">Pontos Mortais (PM)</option>
                        <option value="mana">Mana</option>
                        <option value="aura">Aura</option>
                        <option value="chakra">Chakra</option>
                        <option value="corpo">Corpo</option>
                    </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8em', color: '#aaa' }}>VALOR</label>
                    <input type="number" placeholder="Ex: 24500" value={inputDano} onChange={(e) => setInputDano(e.target.value)} />
                </div>
                
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8em', color: '#aaa' }}>LETALIDADE</label>
                    <input type="number" value={inputLetalidade} onChange={(e) => setInputLetalidade(e.target.value)} />
                </div>
                
                <button className="btn-neon btn-red btn-small" onClick={() => alterarVital('dano')} style={{ height: '44px', margin: 0, padding: '0 15px' }}>
                    🔥 DANO
                </button>
                <button className="btn-neon btn-green btn-small" onClick={() => alterarVital('curar')} style={{ height: '44px', margin: 0, padding: '0 15px' }}>
                    💊 CURAR
                </button>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', marginBottom: '30px' }}>
                <button className="btn-neon btn-green btn-small" onClick={aplicarRegeneracaoTurno} style={{ flex: 1, margin: 0 }}>
                    ✨ APLICAR REGENERAÇÃO
                </button>
                <button className="btn-neon btn-small" onClick={curarTudo} style={{ flex: 1, margin: 0, borderColor: '#00ffff', color: '#00ffff' }}>
                    💚 RESTABELECER TUDO (100%)
                </button>
            </div>

            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; ANÁLISE DE PODER E CULTIVAÇÃO</h3>
            <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '-10px', textAlign: 'center' }}>
                (Para editar a Ascensão e Divisores, utilize a aba <b>Ficha</b>)
            </p>
            <div className="analise-grid" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="radar-container" style={{ background: 'rgba(25, 25, 40, 0.6)', padding: '30px 20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ color: '#fff', textAlign: 'center', marginBottom: '25px', letterSpacing: '2px', fontSize: '0.95em' }}>STATUS (RANK BASE)<br/><span style={{ fontSize: '0.85em', color: '#0ff' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={false} tempCores={tempCores} />
                    <AtributosLista ficha={ficha} isAtual={false} />
                </div>
                <div className="radar-container atual" style={{ background: 'rgba(30, 25, 10, 0.6)', padding: '30px 20px', borderRadius: '10px', borderColor: 'rgba(255, 204, 0, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ color: '#ffcc00', textAlign: 'center', marginBottom: '25px', letterSpacing: '2px', fontSize: '0.95em' }}>PODER ATUAL (C/ FORMAS)<br/><span style={{ fontSize: '0.85em', color: '#0f0' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={true} tempCores={tempCores} />
                    <AtributosLista ficha={ficha} isAtual={true} />
                </div>
            </div>
        </div>
    );
}

export { RadarChart, AtributosLista, StatusPanelCore };

export default function StatusPanel() {
    return (
        <StatusErrorBoundary>
            <StatusPanelCore />
        </StatusErrorBoundary>
    );
}