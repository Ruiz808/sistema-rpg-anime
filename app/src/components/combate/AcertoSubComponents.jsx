import React from 'react';
import { useAcertoForm, STATS_LIST } from './AcertoFormContext';

const PROVIDER_FALLBACK = (
    <div style={{ color: '#888', padding: 10 }}>Acerto provider não encontrado</div>
);

export function AcertoClasseBuffs() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { bonusAcertoClasse, bonusMaestriaArma, nomesMaestriaArma } = ctx;

    if (bonusAcertoClasse <= 0 && bonusMaestriaArma <= 0) return null;

    return (
        <>
            {bonusAcertoClasse > 0 && (
                <p style={{ color: '#0f0', fontSize: '0.85em', margin: '0 0 10px 0', textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>
                    ✨ Instinto de Batalha: A sua classe concede +{bonusAcertoClasse} de Acerto passivo!
                </p>
            )}
            {bonusMaestriaArma > 0 && (
                <p style={{ color: '#00ffcc', fontSize: '0.85em', margin: '0 0 10px 0', textShadow: '0 0 5px rgba(0,255,204,0.5)' }}>
                    ⚔️ Mestre de Armas: A sua classe concede +{bonusMaestriaArma} de Acerto ao usar [{nomesMaestriaArma.join(', ')}]!
                </p>
            )}
        </>
    );
}

export function AcertoStatsSelector() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { statsSelecionados, toggleStat } = ctx;

    return (
        <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Atributos de Acerto:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                {STATS_LIST.map(st => (
                    <label key={st.value} style={{ color: statsSelecionados.includes(st.value) ? '#f90' : '#888', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                            type="checkbox"
                            className="chk-stat-act"
                            value={st.value}
                            checked={statsSelecionados.includes(st.value)}
                            onChange={() => toggleStat(st.value)}
                        />
                        {st.label}
                    </label>
                ))}
            </div>
        </div>
    );
}

export function AcertoDadosConfig() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const {
        dados, setDados,
        faces, setFaces,
        usarProficiencia, setUsarProficiencia,
        bonus, setBonus,
        profGlobal,
        bonusAcertoClasse,
        bonusMaestriaArma,
    } = ctx;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div>
                <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Base</label>
                <input className="input-neon" type="number" value={dados} onChange={e => setDados(e.target.value)} />
            </div>
            <div>
                <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces</label>
                <input className="input-neon" type="number" value={faces} onChange={e => setFaces(e.target.value)} />
            </div>
            <div>
                <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Arma Proficiente?</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '34px' }}>
                    <input
                        type="checkbox"
                        checked={usarProficiencia}
                        onChange={e => setUsarProficiencia(e.target.checked)}
                        style={{ transform: 'scale(1.5)', marginLeft: 10 }}
                        title={`Soma a sua Proficiência Global (+${profGlobal}) ao Acerto`}
                    />
                    {usarProficiencia && <span style={{ color: '#00ffcc', marginLeft: 8, fontWeight: 'bold' }}>+{profGlobal}</span>}
                </div>
            </div>
            <div>
                <label style={{ color: '#aaa', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Bônus Fixo / Temp.
                    {(bonusAcertoClasse > 0 || bonusMaestriaArma > 0) && (
                        <span style={{ color: '#0f0', fontSize: '0.9em', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,0,0.3)' }}>
                            (Buff: +{bonusAcertoClasse + bonusMaestriaArma})
                        </span>
                    )}
                </label>
                <input className="input-neon" type="number" value={bonus} onChange={e => setBonus(e.target.value)} />
            </div>
        </div>
    );
}

export function AcertoVantagensGrid() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { vantagens, desvantagens, changeVantagem, changeDesvantagem } = ctx;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 5 }}>
            <div>
                <label style={{ color: '#0f0', fontSize: '0.85em', textShadow: '0 0 5px #0f0' }}>+ Vantagens</label>
                <input className="input-neon" type="number" min="0" value={vantagens} onChange={changeVantagem} style={{ borderColor: '#0f0', color: '#0f0' }} />
            </div>
            <div>
                <label style={{ color: '#ff003c', fontSize: '0.85em', textShadow: '0 0 5px #ff003c' }}>- Desvantagens</label>
                <input className="input-neon" type="number" min="0" value={desvantagens} onChange={changeDesvantagem} style={{ borderColor: '#ff003c', color: '#ff003c' }} />
            </div>
        </div>
    );
}

export function AcertoArsenalScanner() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { armasEquipadas } = ctx;

    if (armasEquipadas.length === 0) return null;

    return (
        <div style={{ marginTop: 15, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '2px solid #aaa' }}>
            <span style={{ color: '#aaa', fontSize: '0.75em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🔍 Scanner de Arsenal:</span>
            {armasEquipadas.map((w, idx) => (
                <div key={idx} style={{ color: '#ccc', fontSize: '0.8em' }}>
                    • {w.nome} <span style={{ color: '#00ffcc' }}>(Categoria: {w.armaTipo || 'Nenhuma'})</span>
                </div>
            ))}
        </div>
    );
}

export function AcertoDistanciaHUD() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { alvoDummie, distQuadrados, distReal, maxAlcance, maxArea, isForaDeAlcance, unidadeEscala } = ctx;

    if (!alvoDummie) return null;

    return (
        <div style={{ marginTop: 15, padding: '10px', background: isForaDeAlcance ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', border: `1px solid ${isForaDeAlcance ? '#ff003c' : '#0f0'}`, borderRadius: '5px', textAlign: 'center' }}>
            <span style={{ color: isForaDeAlcance ? '#ff003c' : '#0f0', fontWeight: 'bold', fontSize: '1.1em' }}>
                🎯 Alvo: {alvoDummie.nome} | Distância: {distQuadrados}Q ({distReal.toFixed(1)} {unidadeEscala})
            </span>
            <br />
            <span style={{ color: '#aaa', fontSize: '0.85em' }}>Seu Alcance Efetivo: {maxAlcance}Q {maxArea > 0 && <span style={{color: '#ff00ff', fontWeight: 'bold'}}>| Explosão: {maxArea}Q</span>}</span>
            {isForaDeAlcance && <div style={{ color: '#ff003c', marginTop: 5, fontWeight: 'bold', textShadow: '0 0 5px #ff003c' }}>⚠️ FORA DE ALCANCE! APROXIME-SE!</div>}
        </div>
    );
}

export function AcertoRolarButton() {
    const ctx = useAcertoForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { alvoSelecionado, alvoDummie, isForaDeAlcance, maxArea, rolarAcerto } = ctx;

    return (
        <button
            className="btn-neon btn-gold"
            onClick={rolarAcerto}
            disabled={isForaDeAlcance}
            style={{ marginTop: 15, width: '100%', borderColor: isForaDeAlcance ? '#555' : '#f90', color: isForaDeAlcance ? '#555' : '#f90', opacity: isForaDeAlcance ? 0.5 : 1 }}
        >
            {alvoSelecionado && alvoDummie
                ? (isForaDeAlcance ? 'MUITO LONGE PARA ATACAR' : (maxArea > 0 ? `💥 DISPARAR EXPLOSÃO NO ALVO` : `TENTAR ACERTAR ${alvoDummie.nome.toUpperCase()}`))
                : 'ROLAR ACERTO (SEM ALVO)'}
        </button>
    );
}