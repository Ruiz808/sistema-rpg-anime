import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useStore from '../../stores/useStore';
import VitalBar from './VitalBar';
import { getMaximo, getEfetivoBase } from '../../core/attributes.js';
import { getPrestigioReal, calcPAtual, getRank } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

// ---------- Constantes do Gráfico Radar ----------
const CX = 100, CY = 100, R = 70; // Reduzido para caber melhor na tela dividida
const STATS_RADAR = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma'];
const STAT_LABELS = ['FOR', 'DES', 'INT', 'SAB', 'ENE', 'CAR'];
const ANGLES = STATS_RADAR.map((_, i) => (Math.PI * 2 * i) / 6 - Math.PI / 2);

function hexPoints(cx, cy, r) {
    return ANGLES.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' ');
}

function radarPoint(cx, cy, r, idx, frac) {
    const a = ANGLES[idx];
    return [cx + r * frac * Math.cos(a), cy + r * frac * Math.sin(a)];
}

// ---------- Componente do Gráfico Radar ----------
function RadarChart({ ficha, isAtual }) {
    const maxVals = STATS_RADAR.map((k) => getMaximo(ficha, k));
    const baseVals = STATS_RADAR.map((k) => getEfetivoBase(ficha, k));
    const globalMax = Math.max(...maxVals, 1);

    const dataPoints = isAtual 
        ? maxVals.map((v, i) => radarPoint(CX, CY, R, i, v / globalMax))
        : baseVals.map((v, i) => radarPoint(CX, CY, R, i, Math.min(v / globalMax, 1)));

    const dataPoly = dataPoints.map((p) => p.join(',')).join(' ');

    const rankInfos = STATS_RADAR.map((k) => {
        const raw = isAtual ? getMaximo(ficha, k) : getEfetivoBase(ficha, k);
        const pRes = getPrestigioReal(k, raw);
        const pAtual = calcPAtual(ficha, k, pRes);
        return getRank(pAtual.valor, ficha.ascensaoBase);
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
            <polygon points={dataPoly} fill={polyColor} stroke={strokeColor} strokeWidth="2" style={{ transition: 'all 0.5s ease-out' }} />
            {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill={strokeColor} />
            ))}
            {STAT_LABELS.map((lbl, i) => {
                const [lx, ly] = labelPos[i];
                const rk = rankInfos[i];
                return (
                    <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={rk.c} fontSize="10" fontWeight="bold" style={{ textShadow: '0 0 5px #000' }}>
                        [{rk.l}{rk.a > 1 ? ` A${rk.a}` : ''}] {lbl}
                    </text>
                );
            })}
        </svg>
    );
}

// ---------- Componente Principal do Painel de Status ----------
export default function StatusPanel() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);

    const [inputDano, setInputDano] = useState('');
    const [inputLetalidade, setInputLetalidade] = useState('0');

    // Configuração das Barras Vitais (Mapeamento Neon)
    const vitals = useMemo(() => [
        { key: 'vida',   label: 'VIDA (HP)', color: '#ff4d4d', classColor: 'label-color-vida' },
        { key: 'mana',   label: 'MANA',      color: '#00ffff', classColor: 'label-color-mana' },
        { key: 'aura',   label: 'AURA',      color: '#ffcc00', classColor: 'label-color-aura' },
        { key: 'chakra', label: 'CHAKRA',    color: '#e6ffff', classColor: 'label-color-chakra' },
        { key: 'corpo',  label: 'CORPO',     color: '#ff66ff', classColor: 'label-color-corpo' },
    ], []);

    // Inicialização (Preservada da versão original)
    const inicializarAtuais = useCallback(() => {
        if (!ficha) return;
        updateFicha((f) => {
            vitals.forEach(({ key }) => {
                const mx = getMaximo(f, key);
                if (f[key].atual === undefined || f[key].atual === null) {
                    f[key].atual = mx;
                }
                if (f[key].atual > mx) f[key].atual = mx;
            });
        });
    }, [ficha, updateFicha, vitals]);

    useEffect(() => {
        inicializarAtuais();
    }, [inicializarAtuais]);

    // Lógica de Combate (Preservada)
    const alterarHP = useCallback((tipo) => {
        const valor = parseInt(inputDano) || 0;
        if (valor <= 0) return;
        const letalidade = parseInt(inputLetalidade) || 0;

        updateFicha((f) => {
            const vidaMax = getMaximo(f, 'vida');
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
            vitals.forEach(({ key }) => {
                f[key].atual = getMaximo(f, key);
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, vitals]);

    const aplicarRegeneracaoTurno = useCallback(() => {
        updateFicha((f) => {
            vitals.forEach(({ key }) => {
                const mx = getMaximo(f, key);
                const regen = parseFloat(f[key].regeneracao) || 0;
                if (regen > 0 && f[key].atual < mx) {
                    f[key].atual = Math.min(mx, (f[key].atual || 0) + regen);
                }
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, vitals]);

    if (!ficha) return <div style={{ color: '#888', textAlign: 'center' }}>Carregando dados vitais...</div>;

    return (
        <div className="status-panel-container">
            {/* --- BLOCO 1: BARRAS VITAIS (CSS GRID) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                {vitals.map(({ key, label, color, classColor }, index) => {
                    const mx = getMaximo(ficha, key);
                    const atual = ficha[key]?.atual ?? mx;
                    const regen = parseFloat(ficha[key]?.regeneracao) || 0;
                    const extra = regen > 0 ? `(+${regen}/turno)` : '';
                    
                    // HP ocupa a linha toda (gridColumn: '1 / -1')
                    const gridStyle = index === 0 ? { gridColumn: '1 / -1', margin: 0 } : { margin: 0 };

                    return (
                        <div key={key} className="vital-container" style={gridStyle}>
                            <div className={`vital-label ${classColor}`}>{label} {extra && <span style={{fontSize: '0.8em', color: '#aaa'}}>{extra}</span>}</div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: `${(atual / mx) * 100}%`, backgroundColor: color }}></div>
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
                    <input type="number" placeholder="Ex: 24500000" value={inputDano} onChange={(e) => setInputDano(e.target.value)} />
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

            {/* --- BLOCO 3: ANÁLISE DE PODER E CULTIVAÇÃO --- */}
            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; ANÁLISE DE PODER E CULTIVAÇÃO</h3>
            
            <div className="analise-grid" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Radar Base */}
                <div className="radar-container" style={{ background: 'rgba(25, 25, 40, 0.6)', padding: '20px', borderRadius: '10px' }}>
                    <h4 style={{ color: '#fff', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>ALMA (RANK BASE)<br/><span style={{ fontSize: '0.8em', color: '#0ff' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={false} />
                </div>

                {/* Radar Atual */}
                <div className="radar-container atual" style={{ background: 'rgba(30, 25, 10, 0.6)', padding: '20px', borderRadius: '10px', borderColor: 'rgba(255, 204, 0, 0.3)' }}>
                    <h4 style={{ color: '#ffcc00', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontSize: '0.9em' }}>PODER ATUAL (C/ FORMAS)<br/><span style={{ fontSize: '0.8em', color: '#0f0' }}>[A]</span></h4>
                    <RadarChart ficha={ficha} isAtual={true} />
                </div>
            </div>
        </div>
    );
}