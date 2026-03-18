import React, { useState, useMemo, useCallback } from 'react';
import useStore from '../../stores/useStore';
import VitalBar from './VitalBar';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo, getEfetivoBase, getMultiplicadorTotal } from '../../core/attributes.js';
import { getPrestigioReal, calcPAtual, getRank, getDivisorPara } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

// ---------- Radar chart constants ----------
const CX = 250, CY = 180, R = 140;
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

// ---------- Radar SVG ----------
function RadarChart({ ficha }) {
    const maxVals = STATS_RADAR.map((k) => getMaximo(ficha, k));
    const baseVals = STATS_RADAR.map((k) => getEfetivoBase(ficha, k));
    const globalMax = Math.max(...maxVals, 1);

    const atualPoints = maxVals.map((v, i) => radarPoint(CX, CY, R, i, v / globalMax));
    const basePoints = baseVals.map((v, i) => radarPoint(CX, CY, R, i, Math.min(v / globalMax, 1)));

    const atualPoly = atualPoints.map((p) => p.join(',')).join(' ');
    const basePoly = basePoints.map((p) => p.join(',')).join(' ');

    // Rank labels
    const rankInfos = STATS_RADAR.map((k) => {
        const raw = getMaximo(ficha, k);
        const pRes = getPrestigioReal(k, raw);
        const pAtual = calcPAtual(ficha, k, pRes);
        return getRank(pAtual.valor, ficha.ascensaoBase);
    });

    // Label positions (slightly outside the hex)
    const labelR = R + 30;
    const labelPos = ANGLES.map((a) => [CX + labelR * Math.cos(a), CY + labelR * Math.sin(a)]);

    return (
        <svg viewBox="0 0 500 360" className="radar-svg" style={{ width: '100%', maxWidth: 500 }}>
            {/* Grid hexagons */}
            {[0.25, 0.5, 0.75, 1.0].map((s, i) => (
                <polygon
                    key={i}
                    points={hexPoints(CX, CY, R * s)}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {ANGLES.map((a, i) => (
                <line
                    key={i}
                    x1={CX} y1={CY}
                    x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                />
            ))}

            {/* Base polygon */}
            <polygon
                points={basePoly}
                fill="rgba(0,200,255,0.15)"
                stroke="rgba(0,200,255,0.5)"
                strokeWidth="1.5"
            />

            {/* Atual polygon */}
            <polygon
                points={atualPoly}
                fill="rgba(255,0,100,0.25)"
                stroke="rgba(255,0,100,0.8)"
                strokeWidth="2"
            />

            {/* Data dots */}
            {atualPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#ff0064" />
            ))}

            {/* Labels with rank */}
            {STAT_LABELS.map((lbl, i) => {
                const [lx, ly] = labelPos[i];
                const rk = rankInfos[i];
                return (
                    <text
                        key={i}
                        x={lx} y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={rk.c}
                        fontSize="12"
                        fontWeight="bold"
                    >
                        {lbl} {rk.l}{rk.a > 1 ? ` A${rk.a}` : ''}
                    </text>
                );
            })}
        </svg>
    );
}

// ---------- Main StatusPanel ----------
export default function StatusPanel() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);

    const [inputDano, setInputDano] = useState('');
    const [inputLetalidade, setInputLetalidade] = useState('0');

    // Vitals config
    const vitals = useMemo(() => [
        { key: 'vida',   label: 'HP (Vida)',  color: '#ff003c' },
        { key: 'mana',   label: 'Mana',       color: '#0088ff' },
        { key: 'aura',   label: 'Aura',       color: '#00ff88' },
        { key: 'chakra', label: 'Chakra',      color: '#ffcc00' },
        { key: 'corpo',  label: 'Corpo',       color: '#ff8800' },
    ], []);

    // Initialize atual values if they are undefined
    const inicializarAtuais = useCallback(() => {
        updateFicha((f) => {
            vitals.forEach(({ key }) => {
                const mx = getMaximo(f, key);
                if (f[key].atual === undefined || f[key].atual === null) {
                    f[key].atual = mx;
                }
                // Clamp
                if (f[key].atual > mx) f[key].atual = mx;
            });
        });
    }, [updateFicha, vitals]);

    // Ensure atuais are initialized on first render
    React.useEffect(() => {
        inicializarAtuais();
    }, [inicializarAtuais]);

    // alterarHP
    const alterarHP = useCallback((tipo) => {
        const valor = parseInt(inputDano) || 0;
        if (valor <= 0) return;

        const letalidade = parseInt(inputLetalidade) || 0;

        updateFicha((f) => {
            const vidaMax = getMaximo(f, 'vida');
            let danoFinal = valor;

            // Lethality scaling: damage = valor * 10^letalidade
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

    // curarTudo
    const curarTudo = useCallback(() => {
        updateFicha((f) => {
            vitals.forEach(({ key }) => {
                const mx = getMaximo(f, key);
                f[key].atual = mx;
            });
        });
        salvarFichaSilencioso();
    }, [updateFicha, vitals]);

    // aplicarRegeneracaoTurno
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

    return (
        <div className="status-panel">
            <h2>Monitor Vital</h2>

            {/* Radar chart */}
            <div className="radar-container">
                <RadarChart ficha={ficha} />
            </div>

            {/* Vital bars */}
            <div className="vitals-container">
                {vitals.map(({ key, label, color }) => {
                    const mx = getMaximo(ficha, key);
                    const atual = ficha[key]?.atual ?? mx;
                    const regen = parseFloat(ficha[key]?.regeneracao) || 0;
                    return (
                        <VitalBar
                            key={key}
                            label={label}
                            atual={atual}
                            max={mx}
                            color={color}
                            extraInfo={regen > 0 ? `(+${regen}/turno)` : ''}
                        />
                    );
                })}
            </div>

            {/* Damage / Heal controls */}
            <div className="hp-controls">
                <div className="hp-input-row">
                    <label>
                        Valor:
                        <input
                            type="number"
                            min="0"
                            value={inputDano}
                            onChange={(e) => setInputDano(e.target.value)}
                            placeholder="Quantidade"
                        />
                    </label>
                    <label>
                        Letalidade:
                        <input
                            type="number"
                            min="0"
                            value={inputLetalidade}
                            onChange={(e) => setInputLetalidade(e.target.value)}
                            placeholder="0"
                        />
                    </label>
                </div>
                <div className="hp-buttons">
                    <button className="btn-dano" onClick={() => alterarHP('dano')}>
                        Receber Dano
                    </button>
                    <button className="btn-curar" onClick={() => alterarHP('curar')}>
                        Curar HP
                    </button>
                    <button className="btn-regen" onClick={aplicarRegeneracaoTurno}>
                        Regenera\u00E7\u00E3o
                    </button>
                    <button className="btn-curar-tudo" onClick={curarTudo}>
                        Curar Tudo
                    </button>
                </div>
            </div>
        </div>
    );
}
