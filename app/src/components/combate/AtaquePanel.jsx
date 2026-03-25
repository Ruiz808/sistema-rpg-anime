import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getBuffs, getEfeitosDeClasse } from '../../core/attributes';
import { calcularDano } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie } from '../../services/firebase-sync'; 

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
    const feedCombate = useStore(s => s.feedCombate); 
    const { alvoSelecionado, dummies } = useStore(); 

    const ac = minhaFicha.ataqueConfig || {};

    const [armaStatusUsados, setArmaStatusUsados] = useState(ac.armaStatusUsados || ['forca']);
    const [armaEnergiaCombustao, setArmaEnergiaCombustao] = useState(ac.armaEnergiaCombustao || 'mana');
    const [armaPercEnergia, setArmaPercEnergia] = useState(ac.armaPercEnergia || 0);

    const [critNormalMin, setCritNormalMin] = useState(ac.criticoNormalMin || 16);
    const [critNormalMax, setCritNormalMax] = useState(ac.criticoNormalMax || 18);
    const [critFatalMin, setCritFatalMin] = useState(ac.criticoFatalMin || 19);
    const [critFatalMax, setCritFatalMax] = useState(ac.criticoFatalMax || 20);

    const [autoCritNormal, setAutoCritNormal] = useState(false);
    const [autoCritFatal, setAutoCritFatal] = useState(false);
    const [forcarCritNormal, setForcarCritNormal] = useState(false);
    const [forcarCritFatal, setForcarCritFatal] = useState(false);

    const [skillConfigs, setSkillConfigs] = useState({});

    const dummieAlvo = alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado] : null;
    const [podeRolarDano, setPodeRolarDano] = useState(true);

    // 🔥 BERSERKER TRACKER ABSOLUTO
    let multiplicadorFuriaClasse = 0;
    const scanFuria = (efs) => {
        if (!efs) return;
        efs.forEach(e => {
            if (!e) return;
            let p = (e.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (p === 'furia_berserker') {
                let v = parseFloat(e.valor) || 0;
                if (v > multiplicadorFuriaClasse) multiplicadorFuriaClasse = v;
            }
        });
    };

    if (minhaFicha) {
        (minhaFicha.poderes || []).forEach(p => { if (p && p.ativa) scanFuria(p.efeitos); scanFuria(p.efeitosPassivos); });
        (minhaFicha.inventario || []).forEach(i => { if (i && i.equipado) { scanFuria(i.efeitos); scanFuria(i.efeitosPassivos); } });
        (minhaFicha.passivas || []).forEach(p => scanFuria(p.efeitos));
        scanFuria(getEfeitosDeClasse(minhaFicha));
    }

    const maxVida = minhaFicha ? getMaximo(minhaFicha, 'vida', true) : 1;
    const atualVida = minhaFicha?.vida?.atual ?? maxVida;
    const percAtualLostFloor = Math.floor(maxVida > 0 ? Math.max(0, ((maxVida - atualVida) / maxVida) * 100) : 0);
    const furiaMax = minhaFicha?.combate?.furiaMax || 0;
    const percEfetivoParaDisplay = Math.max(percAtualLostFloor, furiaMax);

    let multiplicadorFuriaVisor = 0;
    if (percEfetivoParaDisplay === 1) {
        multiplicadorFuriaVisor = multiplicadorFuriaClasse;
    } else if (percEfetivoParaDisplay >= 2) {
        multiplicadorFuriaVisor = percEfetivoParaDisplay;
    }

    useEffect(() => {
        if (multiplicadorFuriaClasse > 0 && percAtualLostFloor > furiaMax) {
            updateFicha(f => {
                if (!f.combate) f.combate = {};
                f.combate.furiaMax = percAtualLostFloor;
            });
            salvarFichaSilencioso();
        }
    }, [percAtualLostFloor, furiaMax, multiplicadorFuriaClasse, updateFicha]);

    // 🔥 O BOTÃO BLINDADO (Sem pop-up bloqueador)
    const [furiaAcalmadaMsg, setFuriaAcalmadaMsg] = useState(false);
    function acalmarFuria(e) {
        e.preventDefault();
        updateFicha(f => {
            if (!f.combate) f.combate = {};
            f.combate.furiaMax = percAtualLostFloor; 
        });
        salvarFichaSilencioso();
        setFuriaAcalmadaMsg(true);
        setTimeout(() => setFuriaAcalmadaMsg(false), 2000);
    }

    useEffect(() => {
        if (!dummieAlvo) {
            setPodeRolarDano(true);
            return;
        }
        const meuUltimoAcerto = [...feedCombate].reverse().find(f => f.nome === meuNome && f.tipo === 'acerto' && f.alvoNome === dummieAlvo.nome);
        if (meuUltimoAcerto) {
            setPodeRolarDano(meuUltimoAcerto.acertouAlvo); 
        } else {
            setPodeRolarDano(false); 
        }
    }, [feedCombate, meuNome, dummieAlvo]);

    useEffect(() => {
        const ac2 = minhaFicha.ataqueConfig || {};
        setArmaStatusUsados(ac2.armaStatusUsados || ['forca']);
        setArmaEnergiaCombustao(ac2.armaEnergiaCombustao || 'mana');
        setArmaPercEnergia(ac2.armaPercEnergia || 0);
        setCritNormalMin(ac2.criticoNormalMin || 16);
        setCritNormalMax(ac2.criticoNormalMax || 18);
        setCritFatalMin(ac2.criticoFatalMin || 19);
        setCritFatalMax(ac2.criticoFatalMax || 20);
    }, [minhaFicha.ataqueConfig]);

    useEffect(() => {
        const lastAcerto = [...feedCombate].reverse().find(f => f.nome === meuNome && f.tipo === 'acerto');
        if (lastAcerto && lastAcerto.rolagem) {
            let maxDado = 0;
            let regexStrong = /<strong>(\d+)<\/strong>/g;
            let match;
            while ((match = regexStrong.exec(lastAcerto.rolagem)) !== null) {
                let v = parseInt(match[1]);
                if (v > maxDado) maxDado = v;
            }
            if (maxDado === 0) { 
                let regexArr = /\[(.*?)\]/;
                let mArr = regexArr.exec(lastAcerto.rolagem);
                if (mArr) {
                    let clean = mArr[1].replace(/<[^>]*>?/gm, ''); 
                    let nums = clean.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    if (nums.length > 0) maxDado = Math.max(...nums);
                }
            }
            setAutoCritFatal(maxDado >= critFatalMin && maxDado <= critFatalMax);
            setAutoCritNormal(maxDado >= critNormalMin && maxDado <= critNormalMax);
        } else {
            setAutoCritFatal(false);
            setAutoCritNormal(false);
        }
    }, [feedCombate, meuNome, critNormalMin, critNormalMax, critFatalMin, critFatalMax]);

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
        updateFicha((ficha) => {
            if (!ficha.ataqueConfig) ficha.ataqueConfig = {};
            ficha.ataqueConfig.armaStatusUsados = armaStatusUsados;
            ficha.ataqueConfig.armaEnergiaCombustao = armaEnergiaCombustao;
            ficha.ataqueConfig.armaPercEnergia = parseFloat(armaPercEnergia) || 0;
            ficha.ataqueConfig.criticoNormalMin = parseInt(critNormalMin) || 16;
            ficha.ataqueConfig.criticoNormalMax = parseInt(critNormalMax) || 18;
            ficha.ataqueConfig.criticoFatalMin = parseInt(critFatalMin) || 19;
            ficha.ataqueConfig.criticoFatalMax = parseInt(critFatalMax) || 20;

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

        const isCriticoNormal = forcarCritNormal || autoCritNormal;
        const isCriticoFatal = forcarCritFatal || autoCritFatal;

        const result = calcularDano({ minhaFicha, configArma, configHabilidades, itensEquipados, isCriticoNormal, isCriticoFatal });

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

        setForcarCritNormal(false);
        setForcarCritFatal(false);

        let extraFeed = {};
        if (dummieAlvo) {
            const danoCausado = result.dano;
            const hpAnterior = dummieAlvo.hpAtual;
            const novoHp = Math.max(0, hpAnterior - danoCausado);
            const overkill = danoCausado > hpAnterior ? danoCausado - hpAnterior : 0;

            salvarDummie(alvoSelecionado, { ...dummieAlvo, hpAtual: novoHp });
            extraFeed = { 
                alvoNome: dummieAlvo.nome, 
                alvoSobreviveu: novoHp > 0,
                overkill: overkill 
            };
        }

        const feedData = {
            tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade,
            rolagem: result.rolagem, rolagemMagica: result.rolagemMagica,
            atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia,
            armaStr: result.armaStr, detalheConta: result.detalheConta,
            ...extraFeed
        };

        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }

    const armaEquipada = (minhaFicha.inventario || []).find(i => i.equipado && i.tipo === 'arma');
    const poderesAtivos = (minhaFicha.poderes || []).filter(p => p && p.ativa);

    return (
        <div className="ataque-panel">
            
            {multiplicadorFuriaClasse > 0 && (
                <div className="def-box fade-in" style={{ marginBottom: 15, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255,0,0,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: '#ff0000', margin: 0, textShadow: '0 0 5px #ff0000' }}>🩸 Fúria Berserker (Mad Enhancement)</h3>
                        <button 
                            className="btn-neon btn-small" 
                            onClick={acalmarFuria} 
                            style={{ margin: 0, borderColor: furiaAcalmadaMsg ? '#0f0' : '#fff', color: furiaAcalmadaMsg ? '#0f0' : '#fff' }}
                        >
                            {furiaAcalmadaMsg ? '✨ FÚRIA RESETADA!' : 'Acalmar Fúria'}
                        </button>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Vida Perdida Atual:</span>
                            <span style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold' }}>{percAtualLostFloor}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,0,0,0.2)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid #ff0000' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Máximo Atingido (Mantido após Cura):</span>
                            <span style={{ color: '#ff0000', fontSize: '1.2em', fontWeight: 'bold' }}>{percEfetivoParaDisplay}%</span>
                        </div>
                    </div>
                    <p style={{ color: '#0f0', fontSize: '0.9em', marginTop: 10, marginBottom: 0 }}>
                        ↳ Bônus no Multiplicador Geral: <strong style={{ color: '#fff' }}>+{multiplicadorFuriaVisor}x</strong>
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.75em', marginTop: 5, marginBottom: 0 }}>
                        <i className="fas fa-info-circle"></i> Lembre-se: O botão de Acalmar Fúria só fará efeito verdadeiro se você <strong>curar a sua vida primeiro</strong>. Se a Vida Atual estiver baixa, a fúria volta de imediato!
                    </p>
                </div>
            )}

            <div className="def-box" style={{ marginBottom: 15, border: (autoCritFatal ? '2px solid #ff003c' : autoCritNormal ? '2px solid #ffcc00' : 'none') }}>
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Configurações de Crítico</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 10 }}>
                    <div style={{ background: 'rgba(255,204,0,0.1)', padding: 8, borderRadius: 5 }}>
                        <span style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold' }}>Crítico Normal (x2)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>Min:</span>
                            <input className="input-neon" type="number" value={critNormalMin} onChange={e => setCritNormalMin(e.target.value)} style={{ width: 45, padding: 2 }} />
                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>Max:</span>
                            <input className="input-neon" type="number" value={critNormalMax} onChange={e => setCritNormalMax(e.target.value)} style={{ width: 45, padding: 2 }} />
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,0,60,0.1)', padding: 8, borderRadius: 5 }}>
                        <span style={{ color: '#ff003c', fontSize: '0.85em', fontWeight: 'bold' }}>Crítico Fatal (x4)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>Min:</span>
                            <input className="input-neon" type="number" value={critFatalMin} onChange={e => setCritFatalMin(e.target.value)} style={{ width: 45, padding: 2 }} />
                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>Max:</span>
                            <input className="input-neon" type="number" value={critFatalMax} onChange={e => setCritFatalMax(e.target.value)} style={{ width: 45, padding: 2 }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 15, padding: 10, background: '#111', borderRadius: 5 }}>
                    <label style={{ color: (autoCritNormal || forcarCritNormal) ? '#ffcc00' : '#888', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input type="checkbox" checked={autoCritNormal || forcarCritNormal} onChange={e => setForcarCritNormal(e.target.checked)} />
                        Ativar Crítico (x2)
                    </label>
                    <label style={{ color: (autoCritFatal || forcarCritFatal) ? '#ff003c' : '#888', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input type="checkbox" checked={autoCritFatal || forcarCritFatal} onChange={e => setForcarCritFatal(e.target.checked)} />
                        Ativar Crítico Fatal (x4)
                    </label>
                </div>
                {(autoCritNormal || autoCritFatal) && (
                    <p style={{ color: autoCritFatal ? '#ff003c' : '#ffcc00', fontSize: '0.85em', marginTop: 5, fontWeight: 'bold' }}>
                        ⚡ O Sensor Tático detectou que o seu último ataque foi um Crítico!
                    </p>
                )}
            </div>

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

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                <button className="btn-neon btn-gold" onClick={salvarConfigAtaque} style={{ flex: 1 }}>Salvar Config</button>
                <button 
                    className={`btn-neon ${podeRolarDano ? 'btn-red' : ''}`} 
                    onClick={rolarDano} 
                    style={{ flex: 1, opacity: podeRolarDano ? 1 : 0.5 }}
                    disabled={!podeRolarDano}
                >
                    {dummieAlvo ? (podeRolarDano ? `ATACAR ${dummieAlvo.nome.toUpperCase()}` : `ACERTO NECESSÁRIO`) : 'ROLAR DANO'}
                </button>
            </div>
        </div>
    );
}