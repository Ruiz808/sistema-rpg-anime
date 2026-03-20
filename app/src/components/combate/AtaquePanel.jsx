import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getBuffs } from '../../core/attributes';
import { calcularDano } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

const STATS_LIST = [
    { value: 'forca', label: 'Forca' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' },
    { value: 'energiaEsp', label: 'Energia Esp.' },
    { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' },
    { value: 'constituicao', label: 'Constituicao' },
];

const ENERGIA_LIST = [
    { value: 'mana', label: 'Mana' },
    { value: 'aura', label: 'Aura' },
    { value: 'chakra', label: 'Chakra' },
    { value: 'corpo', label: 'Corpo' },
];

export default function AtaquePanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);

    const ac = minhaFicha.ataqueConfig || {};

    const [armaStatusUsados, setArmaStatusUsados] = useState(ac.armaStatusUsados || ['forca']);
    const [armaEnergiaCombustao, setArmaEnergiaCombustao] = useState(ac.armaEnergiaCombustao || 'mana');
    const [armaPercEnergia, setArmaPercEnergia] = useState(ac.armaPercEnergia || 0);

    // Per-skill configs stored on the poder objects: statusUsados, energiaCombustao
    // We use local state keyed by poder.id for in-session changes
    const [skillConfigs, setSkillConfigs] = useState({});

    useEffect(() => {
        const ac2 = minhaFicha.ataqueConfig || {};
        setArmaStatusUsados(ac2.armaStatusUsados || ['forca']);
        setArmaEnergiaCombustao(ac2.armaEnergiaCombustao || 'mana');
        setArmaPercEnergia(ac2.armaPercEnergia || 0);
    }, [minhaFicha.ataqueConfig]);

    // Initialize skill configs from saved poder data
    useEffect(() => {
        const poderes = minhaFicha.poderes || [];
        const configs = {};
        poderes.forEach(p => {
            if (p && p.ativa) {
                configs[p.id] = {
                    statusUsados: p.statusUsados || ['forca'],
                    energiaCombustao: p.energiaCombustao || 'mana'
                };
            }
        });
        setSkillConfigs(configs);
    }, [minhaFicha.poderes]);

    const updateSkillConfig = useCallback((id, field, value) => {
        setSkillConfigs(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    }, []);

    const toggleSkillStat = useCallback((id, statValue) => {
        setSkillConfigs(prev => {
            const current = prev[id]?.statusUsados || ['forca'];
            const updated = current.includes(statValue)
                ? current.filter(v => v !== statValue)
                : [...current, statValue];
            return { ...prev, [id]: { ...prev[id], statusUsados: updated.length > 0 ? updated : ['forca'] } };
        });
    }, []);

    const toggleArmaStat = useCallback((statValue) => {
        setArmaStatusUsados(prev => {
            if (prev.includes(statValue)) return prev.filter(v => v !== statValue);
            return [...prev, statValue];
        });
    }, []);

    function salvarConfigAtaque() {
        // Save weapon config
        updateFicha((ficha) => {
            if (!ficha.ataqueConfig) ficha.ataqueConfig = {};
            ficha.ataqueConfig.armaStatusUsados = armaStatusUsados;
            ficha.ataqueConfig.armaEnergiaCombustao = armaEnergiaCombustao;
            ficha.ataqueConfig.armaPercEnergia = parseFloat(armaPercEnergia) || 0;

            // Save per-skill configs into poderes
            if (ficha.poderes) {
                ficha.poderes.forEach(p => {
                    if (p && skillConfigs[p.id]) {
                        p.statusUsados = skillConfigs[p.id].statusUsados;
                        p.energiaCombustao = skillConfigs[p.id].energiaCombustao;
                    }
                });
            }
        });
        salvarFichaSilencioso();
    }

    function rolarDano() {
        salvarConfigAtaque();

        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
        const poderesAtivos = (minhaFicha.poderes || []).filter(p => p && p.ativa);

        // Build per-skill configs for the engine
        const configHabilidades = poderesAtivos.map(p => ({
            id: p.id,
            nome: p.nome,
            dadosQtd: p.dadosQtd || 0,
            dadosFaces: p.dadosFaces || 20,
            custoPercentual: p.custoPercentual || 0,
            armaVinculada: p.armaVinculada || '',
            statusUsados: skillConfigs[p.id]?.statusUsados || p.statusUsados || ['forca'],
            energiaCombustao: skillConfigs[p.id]?.energiaCombustao || p.energiaCombustao || 'mana',
            efeitos: p.efeitos || []
        }));

        const configArma = {
            statusUsados: armaStatusUsados,
            energiaCombustao: armaEnergiaCombustao,
            percEnergia: parseFloat(armaPercEnergia) || 0
        };

        const result = calcularDano({
            minhaFicha,
            configArma,
            configHabilidades,
            itensEquipados
        });

        if (result.erro) {
            alert(result.erro);
            return;
        }

        if (result.drenos) {
            updateFicha((ficha) => {
                for (let i = 0; i < result.drenos.length; i++) {
                    if (ficha[result.drenos[i].key]) {
                        ficha[result.drenos[i].key].atual -= result.drenos[i].valor;
                    }
                }
            });
        }
        salvarFichaSilencioso();

        const feedData = {
            tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade,
            rolagem: result.rolagem, rolagemMagica: result.rolagemMagica,
            atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia,
            armaStr: result.armaStr, detalheConta: result.detalheConta
        };

        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }

    const armaEquipada = (minhaFicha.inventario || []).find(i => i.equipado && i.tipo === 'arma');
    const poderesAtivos = (minhaFicha.poderes || []).filter(p => p && p.ativa);

    return (
        <div className="ataque-panel">
            {/* Secao da Arma */}
            {armaEquipada && (
                <div className="def-box" style={{ marginBottom: 15 }}>
                    <h3 style={{ color: '#0f0', marginBottom: 10 }}>
                        Arma: {armaEquipada.nome} ({armaEquipada.dadosQtd || 0}d{armaEquipada.dadosFaces || 20})
                    </h3>

                    <div style={{ marginBottom: 10 }}>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Status usados pela arma:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                            {STATS_LIST.map(st => (
                                <label key={st.value} style={{ color: armaStatusUsados.includes(st.value) ? '#0f0' : '#888', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input type="checkbox" value={st.value} checked={armaStatusUsados.includes(st.value)} onChange={() => toggleArmaStat(st.value)} />
                                    {st.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Energia de Combustao</label>
                            <select className="input-neon" value={armaEnergiaCombustao} onChange={e => setArmaEnergiaCombustao(e.target.value)}>
                                {ENERGIA_LIST.map(en => (
                                    <option key={en.value} value={en.value}>{en.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85em' }}>% Energia</label>
                            <input className="input-neon" type="number" min="0" value={armaPercEnergia} onChange={e => setArmaPercEnergia(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {!armaEquipada && (
                <div className="def-box" style={{ marginBottom: 15 }}>
                    <p style={{ color: '#888', margin: 0 }}>Nenhuma arma equipada. Equipe uma arma no Arsenal ou use habilidades com dados de dano.</p>
                </div>
            )}

            {/* Lista de Habilidades Ativas */}
            <div className="def-box">
                <h3 style={{ color: '#f0f', marginBottom: 10 }}>Habilidades Ativas</h3>
                {poderesAtivos.length === 0 ? (
                    <p style={{ color: '#888', margin: 0 }}>Nenhuma habilidade ativa. Ative habilidades na aba Poderes.</p>
                ) : (
                    poderesAtivos.map(p => {
                        const cfg = skillConfigs[p.id] || { statusUsados: ['forca'], energiaCombustao: 'mana' };
                        const dadosTxt = (p.dadosQtd > 0) ? `${p.dadosQtd}d${p.dadosFaces || 20}` : 'Sem dados';
                        const custoTxt = (p.custoPercentual > 0) ? `${p.custoPercentual}%` : '0%';
                        const armaVinc = p.armaVinculada ? (minhaFicha.inventario || []).find(i => String(i.id) === String(p.armaVinculada)) : null;

                        return (
                            <div key={p.id} style={{ marginBottom: 12, padding: '10px', background: 'rgba(255,0,255,0.08)', borderLeft: '3px solid #f0f', borderRadius: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div>
                                        <strong style={{ color: '#f0f' }}>{p.nome}</strong>
                                        <span style={{ color: '#aaa', fontSize: '0.85em', marginLeft: 10 }}>
                                            {dadosTxt} | Custo: {custoTxt}
                                            {armaVinc && <span style={{ color: '#0f0' }}> | Vinculada: {armaVinc.nome}</span>}
                                        </span>
                                    </div>
                                    <span style={{ color: '#0f0', fontSize: '0.8em', fontWeight: 'bold' }}>ATIVA</span>
                                </div>

                                <div style={{ marginBottom: 6 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.8em' }}>Status usados:</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                                        {STATS_LIST.map(st => (
                                            <label key={st.value} style={{ color: (cfg.statusUsados || []).includes(st.value) ? '#f0f' : '#555', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <input type="checkbox" value={st.value} checked={(cfg.statusUsados || []).includes(st.value)} onChange={() => toggleSkillStat(p.id, st.value)} />
                                                {st.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.8em' }}>Energia de Combustao:</label>
                                    <select className="input-neon" value={cfg.energiaCombustao || 'mana'} onChange={e => updateSkillConfig(p.id, 'energiaCombustao', e.target.value)} style={{ marginTop: 3 }}>
                                        {ENERGIA_LIST.map(en => (
                                            <option key={en.value} value={en.value}>{en.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Botoes */}
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                <button className="btn-neon btn-gold" onClick={salvarConfigAtaque} style={{ flex: 1 }}>Salvar Config</button>
                <button className="btn-neon btn-red" onClick={rolarDano} style={{ flex: 1 }}>ROLAR DANO</button>
            </div>
        </div>
    );
}
