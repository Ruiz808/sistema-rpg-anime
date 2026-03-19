import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getRawBase } from '../../core/attributes.js';
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

const ANGLES = VITALS_RADAR.map((_, i) => (Math.PI * 2 * i) / 6 - Math.PI / 2);
function hexPoints(cx, cy, r) { return ANGLES.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' '); }
function radarPoint(cx, cy, r, idx, frac) {
    const a = ANGLES[idx]; const safeFrac = Number.isNaN(frac) ? 0 : frac;
    return [cx + r * safeFrac * Math.cos(a), cy + r * safeFrac * Math.sin(a)];
}

// --- SCANNER GLOBAL NO GRÁFICO RADAR ---
function getGlobalMFormas(ficha) {
    let maxM = 1;
    if (!ficha) return maxM;

    const allKeys = [...STATS, 'vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let k of allKeys) {
        if (ficha[k]?.mFormas) {
            const val = parseFloat(ficha[k].mFormas);
            if (!Number.isNaN(val) && val > maxM) maxM = val;
        }
    }

    const searchDeep = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.ligado === true || obj.ativo === true || obj.equipado === true) {
            const str = JSON.stringify(obj).toUpperCase();
            const matches = str.matchAll(/MFORMAS[^0-9]*(\d+(\.\d+)?)/g);
            for (const match of matches) {
                const val = parseFloat(match[1]);
                if (!Number.isNaN(val) && val > maxM) maxM = val;
            }
        }
        Object.values(obj).forEach(val => {
            if (val && typeof val === 'object') searchDeep(val);
        });
    };
    
    searchDeep(ficha);
    return maxM;
}

function calcularPrestAtual(ficha, baseP) {
    const mFormas = getGlobalMFormas(ficha);
    const multForma = Math.max(1, mFormas / 10);
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

function RadarChart({ ficha, isAtual }) {
    const LIMIT = 100; 

    const chartValues = VITALS_RADAR.map((k) => {
        const baseP = getBasePFor(ficha, k);
        return isAtual ? calcularPrestAtual(ficha, baseP) : baseP;
    });

    const dataPoints = chartValues.map((v, i) => radarPoint(CX, CY, R, i, Math.min((v || 0) / LIMIT, 1)));
    const dataPoly = dataPoints.map((p) => `${p[0] || 0},${p[1] || 0}`).join(' ');

    const rankInfos = VITALS_RADAR.map((k) => {
        const baseP = getBasePFor(ficha, k);
        const pAtualValor = isAtual ? calcularPrestAtual(ficha, baseP) : baseP;
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

function StatusPanelCore() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);

    const [inputDano, setInputDano] = useState('');
    const [inputLetalidade, setInputLetalidade] = useState('0');
    
    const inicializado = useRef(false);

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

            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; ANÁLISE DE PODER E CULTIVAÇÃO</h3>
            <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '-10px', textAlign: 'center' }}>
                (Para editar a Ascensão e Divisores, utilize a aba <b>Ficha</b>)
            </p>
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

export default function StatusPanel() {
    return (
        <StatusErrorBoundary>
            <StatusPanelCore />
        </StatusErrorBoundary>
    );
}