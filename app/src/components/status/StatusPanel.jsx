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

const CX = 100, CY = 100, R = 70;
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

// 🔥 Esta função lê o Prestígio Base, IGNORANDO qualquer buff ou forma!
const getBasePFor = (ficha, k) => {
    if (k === 'status') {
        let m = 0;
        STATS.forEach(s => m += safeGetRawBase(ficha, s));
        return Math.floor((m / 8) / 1000);
    }
    return safeGetPrestigioReal(k, safeGetRawBase(ficha, k));
};

function RadarChart({ ficha, isAtual }) {
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

    const labelR = R + 15;
    const labelPos = ANGLES.map((a) => [CX + labelR * Math.cos(a), CY + labelR * Math.sin(a)]);

    const polyColor = isAtual ? 'rgba(255, 204, 0, 0.2)' : 'rgba(0, 255, 255, 0.2)';
    const strokeColor = isAtual ? '#ffcc00' : '#0ff';
    const gridStroke = isAtual ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

    return (
        <svg viewBox="0 0 200 200" className={`radar-svg ${isAtual ? 'atual' : ''}`} style={{ width: '100%', height: 'auto', maxHeight: '250px' }}>
            {[0.25, 0.5, 0.75, 1.0].map((s, i) => (
                <polygon key={i} points={hexPoints(CX, CY, R * s)} fill="none" stroke={gridStroke} strokeWidth="1" />
            ))}
            {ANGLES.map((a, i) => (
                <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4" />
            ))}
            <polygon points={dataPoly} fill={polyColor} stroke={strokeColor} strokeWidth="2" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x || 0} cy={y || 0} r="3" fill={strokeColor} style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            ))}
            {VITALS_LABELS.map((lbl, i) => {
                const [lx, ly] = labelPos[i];
                const rk = rankInfos[i];
                return (
                    <text key={i} x={lx || 0} y={ly || 0} textAnchor="middle" dominantBaseline="central" fill={rk.c || '#fff'} fontSize="10" fontWeight="bold" style={{ textShadow: '0 0 5px #000' }}>
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
        <div className="atributo-lista">
            {valores.map(({ key, label, valor }) => (
                <div key={key} className="atributo-row">
                    <span>{label}</span>
                    <span className={isAtual ? 'atributo-valor-atual' : 'atributo-valor-base'}>{valor.toLocaleString('pt-BR')}</span>
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
    
    const inicializado = useRef(false);

    const vitalsBars = useMemo(() => [
        { key: 'vida',   label: 'VIDA (HP)', color: '#ff4d4d', classColor: 'label-color-vida', borderC: '#ff0000' },
        { key: 'mana',   label: 'MANA',      color: '#00ffff', classColor: 'label-color-mana' },
        { key: 'aura',   label: 'AURA',      color: '#ffcc00', classColor: 'label-color-aura' },
        { key: 'chakra', label: 'CHAKRA',    color: '#e6ffff', classColor: 'label-color-chakra' },
        { key: 'corpo',  label: 'CORPO',     color: '#ff66ff', classColor: 'label-color-corpo' },
    ], []);

    const vitaisEspeciais = useMemo(() => [
        { key: 'pv', label: 'PONTOS VITAIS (PV)', color: '#00ff88', classColor: 'label-color-pv', borderC: '#00ff88' },
        { key: 'pm', label: 'PONTOS MORTAIS (PM)', color: '#cc00ff', classColor: 'label-color-pm', borderC: '#cc00ff' },
    ], []);

    const allVitals = useMemo(() => [...vitalsBars, ...vitaisEspeciais], [vitalsBars, vitaisEspeciais]);

    // 🔥 O CÁLCULO BLINDADO: Apenas Prestígio Base * Multiplicador
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

    if (!ficha) return <div style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Carregando dados vitais...</div>;

    // 🔥 O RENDERIZADOR UNIVERSAL DE BARRAS
    const renderBar = (item, index, isSpecial = false) => {
        const { key, label, color, classColor, borderC } = item;
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
                border: `3px solid ${borderC}`, boxShadow: `0 0 10px ${borderC}, inset 0 0 5px ${borderC}80`,
                borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '18px',
                fontFamily: 'arial, sans-serif', textShadow: `0 0 5px ${borderC}`
            }}>
                {p}
            </div>
        ) : null;

        return (
            <div key={key} className="vital-container" style={gridStyle}>
                <div className={`vital-label ${classColor || ''}`} style={{ color: isSpecial ? color : '' }}>
                    {label} {extra && <span style={{fontSize: '0.8em', color: '#aaa'}}>{extra}</span>}
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
            
            {/* 🔥 BARRAS CLÁSSICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                {vitalsBars.map((item, i) => renderBar(item, i, false))}
            </div>

            {/* 🔥 BARRAS DAS NOVAS ENERGIAS */}
            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; ENERGIAS PRIMORDIAIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                {vitaisEspeciais.map((item, i) => renderBar(item, i, true))}
            </div>

            {/* 🔥 MULTIPLICADORES ESPECIAIS */}
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

            {/* 🔥 CONTROLE RÁPIDO AGORA SELECIONA QUALQUER BARRA */}
            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; CONTROLE RÁPIDO</h3>
            <div className="form-row-dark" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: '10px', alignItems: 'end', background: 'transparent', padding: 0 }}>
                
                {/* O NOVO SELETOR DE ALVO */}
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
                <div className="radar-container" style={{ background: 'rgba(25, 25, 40, 0.6)', padding: '20px', borderRadius: '10px' }}>
                    <h4 style={{ color: '#fff', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>STATUS (RANK BASE)<br/><span style={{ fontSize: '0.8em', color: '#0ff' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={false} />
                    <AtributosLista ficha={ficha} isAtual={false} />
                </div>
                <div className="radar-container atual" style={{ background: 'rgba(30, 25, 10, 0.6)', padding: '20px', borderRadius: '10px', borderColor: 'rgba(255, 204, 0, 0.3)' }}>
                    <h4 style={{ color: '#ffcc00', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>PODER ATUAL (C/ FORMAS)<br/><span style={{ fontSize: '0.8em', color: '#0f0' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={true} />
                    <AtributosLista ficha={ficha} isAtual={true} />
                </div>
            </div>
        </div>
    );
}

export default function StatusPanel() {
    return (
        <StatusErrorBoundary>
            <StatusPanelCore />
        </StatusErrorBoundary>
    );
}