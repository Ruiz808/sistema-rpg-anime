import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getEfetivoBase } from '../../core/attributes.js';
import { getPrestigioReal, calcPAtual, getRank, getDivisorPara } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

// --- PROTEÇÃO ANTI-CRASH (ERROR BOUNDARY) ---
class StatusErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', border: '2px solid #ff003c', background: '#1a0000', borderRadius: '10px', color: '#fff', margin: '20px' }}>
                    <h3 style={{ color: '#ff003c', marginTop: 0 }}>🔥 ERRO DETECTADO NO PAINEL DE STATUS 🔥</h3>
                    <p>O React evitou a tela branca. O erro real é este:</p>
                    <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- SAFE MATH HELPERS ---
const safeFn = (fn, fallback) => (...args) => {
    if (typeof fn !== 'function') return fallback;
    try { 
        const res = fn(...args);
        return (res !== undefined && res !== null && !Number.isNaN(res)) ? res : fallback;
    } catch (e) { return fallback; }
};

const safeGetMaximo = safeFn(getMaximo, 1);
const safeGetPrestigioReal = safeFn(getPrestigioReal, 0);
const safeCalcPAtual = safeFn(calcPAtual, { valor: 0 });
const safeGetRank = safeFn(getRank, { l: 'F', c: '#ffffff', a: 1 });
const safeGetDivisorPara = safeFn(getDivisorPara, 'Padrão');

// ---------- EIXOS DO GRÁFICO (AGORA COM STATUS) ----------
const CX = 100, CY = 100, R = 70;
const VITALS_RADAR = ['vida', 'mana', 'aura', 'chakra', 'corpo', 'status'];
const VITALS_LABELS = ['VIDA', 'MANA', 'AURA', 'CHAKRA', 'CORPO', 'STATUS'];
const ANGLES = VITALS_RADAR.map((_, i) => (Math.PI * 2 * i) / 6 - Math.PI / 2);

function hexPoints(cx, cy, r) {
    return ANGLES.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' ');
}

function radarPoint(cx, cy, r, idx, frac) {
    const a = ANGLES[idx];
    const safeFrac = Number.isNaN(frac) ? 0 : frac;
    return [cx + r * safeFrac * Math.cos(a), cy + r * safeFrac * Math.sin(a)];
}

// ---------- Componente do Gráfico Radar (COM LIMITE DE 100) ----------
function RadarChart({ ficha, isAtual }) {
    const LIMIT = 100; // Limite fixo forçado a 100%

    const chartValues = VITALS_RADAR.map((k) => {
        const rawMax = safeGetMaximo(ficha, k);
        const calcBaseP = safeGetPrestigioReal(k, rawMax);
        const baseP = ficha[k]?.prestigioBase !== undefined ? Number(ficha[k].prestigioBase) : calcBaseP;
        
        if (!isAtual) return baseP;
        
        const pAtual = safeCalcPAtual(ficha, k, baseP);
        return pAtual.valor;
    });

    const dataPoints = chartValues.map((v, i) => radarPoint(CX, CY, R, i, Math.min((v || 0) / LIMIT, 1)));
    const dataPoly = dataPoints.map((p) => `${p[0] || 0},${p[1] || 0}`).join(' ');

    const rankInfos = VITALS_RADAR.map((k) => {
        const rawMax = safeGetMaximo(ficha, k);
        const calcBaseP = safeGetPrestigioReal(k, rawMax);
        const baseP = ficha[k]?.prestigioBase !== undefined ? Number(ficha[k].prestigioBase) : calcBaseP;
        
        const pAtual = safeCalcPAtual(ficha, k, baseP) || { valor: baseP };
        return safeGetRank(pAtual.valor, ficha?.ascensaoBase || 0);
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
            <polygon points={dataPoly} fill={polyColor} stroke={strokeColor} strokeWidth="2" style={{ transition: 'all 0.4s ease-out' }} />
            {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x || 0} cy={y || 0} r="3" fill={strokeColor} style={{ transition: 'all 0.4s ease-out' }} />
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

// ---------- Componente Interno ----------
function StatusPanelCore() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);

    const [inputDano, setInputDano] = useState('');
    const [inputLetalidade, setInputLetalidade] = useState('0');
    
    const inicializado = useRef(false);

    // As barras visíveis na interface (O Status entra apenas nos gráficos e tabela, não como barra de HP)
    const vitalsBars = useMemo(() => [
        { key: 'vida',   label: 'VIDA (HP)', color: '#ff4d4d', classColor: 'label-color-vida' },
        { key: 'mana',   label: 'MANA',      color: '#00ffff', classColor: 'label-color-mana' },
        { key: 'aura',   label: 'AURA',      color: '#ffcc00', classColor: 'label-color-aura' },
        { key: 'chakra', label: 'CHAKRA',    color: '#e6ffff', classColor: 'label-color-chakra' },
        { key: 'corpo',  label: 'CORPO',     color: '#ff66ff', classColor: 'label-color-corpo' },
    ], []);

    useEffect(() => {
        if (!ficha || inicializado.current) return;
        updateFicha((f) => {
            vitalsBars.forEach(({ key }) => {
                const mx = safeGetMaximo(f, key);
                if (!f[key]) f[key] = {};
                if (f[key].atual === undefined || f[key].atual === null) {
                    f[key].atual = mx;
                }
            });
        });
        inicializado.current = true;
    }, [ficha, updateFicha, vitalsBars]);

    const alterarHP = useCallback((tipo) => {
        const valor = parseInt(inputDano) || 0;
        if (valor <= 0) return;
        const letalidade = parseInt(inputLetalidade) || 0;

        updateFicha((f) => {
            const vidaMax = safeGetMaximo(f, 'vida');
            let danoFinal = valor;
            if (tipo === 'dano' && letalidade > 0) {
                danoFinal = valor * Math.pow(10, letalidade);
            }
            if (tipo === 'dano') {
                f.vida.atual = Math.max(0, (f.vida.atual || 0) - danoFinal);
            } else {
                f.vida.atual = Math.min(vidaMax, (f.vida.atual || 0) + danoFinal);
            }
        });
        salvarFichaSilencioso();
        setInputDano('');
    }, [inputDano, inputLetalidade, updateFicha]);

    const curarTudo = useCallback(() => {
        updateFicha((f) => {
            vitalsBars.forEach(({ key }) => {
                if(f[key]) f[key].atual = safeGetMaximo(f, key);
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, vitalsBars]);

    const aplicarRegeneracaoTurno = useCallback(() => {
        updateFicha((f) => {
            vitalsBars.forEach(({ key }) => {
                const mx = safeGetMaximo(f, key);
                const regen = parseFloat(f[key]?.regeneracao) || 0;
                if (regen > 0 && f[key].atual < mx) {
                    f[key].atual = Math.min(mx, (f[key].atual || 0) + regen);
                }
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, vitalsBars]);

    if (!ficha) return <div style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Carregando dados vitais...</div>;

    return (
        <div className="status-panel-container">
            {/* --- BLOCO 1: BARRAS VITAIS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                {vitalsBars.map(({ key, label, color, classColor }, index) => {
                    const mx = safeGetMaximo(ficha, key);
                    const atual = ficha[key]?.atual ?? mx;
                    const regen = parseFloat(ficha[key]?.regeneracao) || 0;
                    const extra = regen > 0 ? `(+${regen}/turno)` : '';
                    const gridStyle = index === 0 ? { gridColumn: '1 / -1', margin: 0 } : { margin: 0 };
                    const percent = Number.isNaN(atual / mx) ? 0 : Math.min((atual / mx) * 100, 100);

                    return (
                        <div key={key} className="vital-container" style={gridStyle}>
                            <div className={`vital-label ${classColor}`}>{label} {extra && <span style={{fontSize: '0.8em', color: '#aaa'}}>{extra}</span>}</div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                                <div className="bar-text">{atual.toLocaleString('pt-BR')} / {mx.toLocaleString('pt-BR')}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- BLOCO 2: CONTROLE RÁPIDO --- */}
            <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; CONTROLE RÁPIDO</h3>
            <div className="form-row-dark" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', alignItems: 'end', background: 'transparent', padding: 0 }}>
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8em', color: '#aaa' }}>VALOR (HP/ENERGIA)</label>
                    <input type="number" placeholder="Ex: 24500" value={inputDano} onChange={(e) => setInputDano(e.target.value)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8em', color: '#aaa' }}>LETALIDADE</label>
                    <input type="number" value={inputLetalidade} onChange={(e) => setInputLetalidade(e.target.value)} />
                </div>
                <button className="btn-neon btn-red btn-small" onClick={() => alterarHP('dano')} style={{ height: '44px', margin: 0 }}>
                    🔥 RECEBER DANO
                </button>
                <button className="btn-neon btn-green btn-small" onClick={() => alterarHP('curar')} style={{ height: '44px', margin: 0 }}>
                    💊 CURAR HP
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

            {/* --- BLOCO 3: SISTEMA DE PRESTÍGIO E ASCENSÃO --- */}
            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; SISTEMA DE PRESTÍGIO E ASCENSÃO</h3>
            <div className="grid-2col" style={{ marginBottom: '30px' }}>
                <div className="tabela-prestigio">
                    <h4 className="prestige-title-base">PRESTÍGIO BASE</h4>
                    <div className="prestige-ascension-box">
                        <label className="text-white-md" style={{ display: 'block', marginBottom: '5px' }}>Ascensão Base (Nível):</label>
                        <input 
                            type="number" 
                            className="prestige-input-base" 
                            value={ficha.ascensaoBase || 0} 
                            onChange={(e) => {
                                updateFicha(f => { f.ascensaoBase = Number(e.target.value) });
                                salvarFichaSilencioso();
                            }} 
                        />
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_RADAR.map((attrKey, i) => {
                            const rawMax = safeGetMaximo(ficha, attrKey);
                            const calcBaseP = safeGetPrestigioReal(attrKey, rawMax); 
                            const baseP = ficha[attrKey]?.prestigioBase !== undefined ? ficha[attrKey].prestigioBase : calcBaseP;
                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span>Divisor: <input 
                                            type="number" 
                                            className="divisor-mini-input" 
                                            value={ficha[attrKey]?.divisorCustom || ''} 
                                            placeholder={String(safeGetDivisorPara(attrKey) || 'Padrão')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateFicha(f => { 
                                                    if(!f[attrKey]) f[attrKey] = {};
                                                    f[attrKey].divisorCustom = val ? Number(val) : undefined;
                                                });
                                                salvarFichaSilencioso();
                                            }}
                                        /></span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="prestige-input-base" 
                                        value={baseP === undefined ? '' : baseP} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            updateFicha(f => {
                                                if(!f[attrKey]) f[attrKey] = {};
                                                f[attrKey].prestigioBase = val === '' ? undefined : Number(val);
                                            });
                                            salvarFichaSilencioso();
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="tabela-prestigio atual">
                    <h4 className="prestige-title-atual">PRESTÍGIO ATUAL</h4>
                    <div className="prestige-ascension-box">
                        <label className="text-white-md" style={{ display: 'block', marginBottom: '5px' }}>Ascensão Efetiva:</label>
                        <div className="prestige-display-atual">{ficha.ascensaoBase || 0}</div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_RADAR.map((attrKey, i) => {
                            const rawMax = safeGetMaximo(ficha, attrKey);
                            const calcBaseP = safeGetPrestigioReal(attrKey, rawMax);
                            const baseP = ficha[attrKey]?.prestigioBase !== undefined ? ficha[attrKey].prestigioBase : calcBaseP;
                            const pAtualObj = safeCalcPAtual(ficha, attrKey, baseP);
                            const rankInfo = safeGetRank(pAtualObj.valor, ficha.ascensaoBase || 0);

                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span style={{ color: rankInfo.c || '#fff', fontWeight: 'bold' }}>Rank {rankInfo.l || 'F'}</span>
                                    </div>
                                    <div className="prestige-display-atual">
                                        {Math.floor(pAtualObj.valor || 0).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- BLOCO 4: ANÁLISE DE PODER E CULTIVAÇÃO --- */}
            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; ANÁLISE DE PODER E CULTIVAÇÃO</h3>
            <div className="analise-grid" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="radar-container" style={{ background: 'rgba(25, 25, 40, 0.6)', padding: '20px', borderRadius: '10px' }}>
                    <h4 style={{ color: '#fff', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>STATUS (RANK BASE)<br/><span style={{ fontSize: '0.8em', color: '#0ff' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={false} />
                </div>
                <div className="radar-container atual" style={{ background: 'rgba(30, 25, 10, 0.6)', padding: '20px', borderRadius: '10px', borderColor: 'rgba(255, 204, 0, 0.3)' }}>
                    <h4 style={{ color: '#ffcc00', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>PODER ATUAL (C/ FORMAS)<br/><span style={{ fontSize: '0.8em', color: '#0f0' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={true} />
                </div>
            </div>
        </div>
    );
}

// O componente final exportado é blindado contra tela branca
export default function StatusPanel() {
    return (
        <StatusErrorBoundary>
            <StatusPanelCore />
        </StatusErrorBoundary>
    );
}