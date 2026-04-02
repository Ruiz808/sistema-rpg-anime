import React from 'react';
import { useAtaqueForm, STATS_LIST, ENERGIA_LIST } from './AtaqueFormContext';

const PROVIDER_FALLBACK = (
    <div style={{ color: '#888', padding: 10 }}>Ataque provider nao encontrado</div>
);

export function AtaqueFuriaDisplay() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { multiplicadorFuriaClasse, multiplicadorFuriaVisor, percAtualLostFloor, percEfetivoParaDisplay, furiaAcalmadaMsg, acalmarFuria } = ctx;

    if (multiplicadorFuriaClasse <= 0) return null;

    return (
        <div className="def-box fade-in" style={{ marginBottom: 15, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#ff0000', margin: 0, textShadow: '0 0 5px #ff0000' }}>&#x1fa78; Furia Berserker (Mad Enhancement)</h3>
                <button className="btn-neon btn-small" onClick={acalmarFuria} style={{ margin: 0, borderColor: furiaAcalmadaMsg ? '#0f0' : '#fff', color: furiaAcalmadaMsg ? '#0f0' : '#fff' }}>
                    {furiaAcalmadaMsg ? '\u2728 FURIA RESETADA!' : 'Acalmar Furia'}
                </button>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Vida Perdida Atual:</span>
                    <span style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold' }}>{percAtualLostFloor}%</span>
                </div>
                <div style={{ background: 'rgba(255,0,0,0.2)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid #ff0000' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Maximo Atingido (Mantido apos Cura):</span>
                    <span style={{ color: '#ff0000', fontSize: '1.2em', fontWeight: 'bold' }}>{percEfetivoParaDisplay}%</span>
                </div>
            </div>
            <p style={{ color: '#0f0', fontSize: '0.9em', marginTop: 10, marginBottom: 0 }}>
                &#8627; Bonus no Multiplicador Geral: <strong style={{ color: '#fff' }}>+{multiplicadorFuriaVisor}x</strong>
            </p>
            <p style={{ color: '#aaa', fontSize: '0.75em', marginTop: 5, marginBottom: 0 }}>
                <i className="fas fa-info-circle"></i> Lembre-se: O botao de Acalmar Furia so fara efeito verdadeiro se voce <strong>curar a sua vida primeiro</strong>. Se a Vida Atual estiver baixa, a furia volta de imediato!
            </p>
        </div>
    );
}

export function AtaqueCriticoConfig() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { critNormalMin, setCritNormalMin, critNormalMax, setCritNormalMax, critFatalMin, setCritFatalMin, critFatalMax, setCritFatalMax, autoCritNormal, autoCritFatal, forcarCritNormal, setForcarCritNormal, forcarCritFatal, setForcarCritFatal } = ctx;

    return (
        <div className="def-box" style={{ marginBottom: 15, border: (autoCritFatal ? '2px solid #ff003c' : autoCritNormal ? '2px solid #ffcc00' : 'none') }}>
            <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Configuracoes de Critico</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 10 }}>
                <div style={{ background: 'rgba(255,204,0,0.1)', padding: 8, borderRadius: 5 }}>
                    <span style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold' }}>Critico Normal (x2)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Min:</span><input className="input-neon" type="number" value={critNormalMin} onChange={e => setCritNormalMin(e.target.value)} style={{ width: 45, padding: 2 }} />
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Max:</span><input className="input-neon" type="number" value={critNormalMax} onChange={e => setCritNormalMax(e.target.value)} style={{ width: 45, padding: 2 }} />
                    </div>
                </div>
                <div style={{ background: 'rgba(255,0,60,0.1)', padding: 8, borderRadius: 5 }}>
                    <span style={{ color: '#ff003c', fontSize: '0.85em', fontWeight: 'bold' }}>Critico Fatal (x4)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Min:</span><input className="input-neon" type="number" value={critFatalMin} onChange={e => setCritFatalMin(e.target.value)} style={{ width: 45, padding: 2 }} />
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Max:</span><input className="input-neon" type="number" value={critFatalMax} onChange={e => setCritFatalMax(e.target.value)} style={{ width: 45, padding: 2 }} />
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 15, padding: 10, background: '#111', borderRadius: 5 }}>
                <label style={{ color: (autoCritNormal || forcarCritNormal) ? '#ffcc00' : '#888', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}><input type="checkbox" checked={autoCritNormal || forcarCritNormal} onChange={e => setForcarCritNormal(e.target.checked)} /> Ativar Critico (x2)</label>
                <label style={{ color: (autoCritFatal || forcarCritFatal) ? '#ff003c' : '#888', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}><input type="checkbox" checked={autoCritFatal || forcarCritFatal} onChange={e => setForcarCritFatal(e.target.checked)} /> Ativar Critico Fatal (x4)</label>
            </div>
            {(autoCritNormal || autoCritFatal) && <p style={{ color: autoCritFatal ? '#ff003c' : '#ffcc00', fontSize: '0.85em', marginTop: 5, fontWeight: 'bold' }}>&#x26A1; O Sensor Tatico detectou que o seu ultimo ataque foi um Critico!</p>}
        </div>
    );
}

export function AtaqueArmaEquipada() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { armaEquipada, armaStatusUsados, armaEnergiaCombustao, setArmaEnergiaCombustao, armaPercEnergia, setArmaPercEnergia, toggleArmaStat } = ctx;

    if (!armaEquipada) return null;

    return (
        <div className="def-box" style={{ marginBottom: 15 }}>
            <h3 style={{ color: '#0f0', marginBottom: 10 }}>Arma: {armaEquipada.nome} ({armaEquipada.dadosQtd || 0}d{armaEquipada.dadosFaces || 20})</h3>
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
                        {ENERGIA_LIST.map(en => <option key={en.value} value={en.value}>{en.label}</option>)}
                    </select>
                </div>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>% Energia</label><input className="input-neon" type="number" min="0" value={armaPercEnergia} onChange={e => setArmaPercEnergia(e.target.value)} /></div>
            </div>
        </div>
    );
}

export function AtaqueArmaVazia() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;
    if (ctx.armaEquipada) return null;

    return (
        <div className="def-box" style={{ marginBottom: 15 }}>
            <p style={{ color: '#888', margin: 0 }}>Nenhuma arma equipada. Equipe uma arma no Arsenal ou use habilidades com dados de dano.</p>
        </div>
    );
}

export function AtaqueHabilidadesAtivas() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;
    const { poderesAtivos, skillConfigs, minhaFicha, updateSkillConfig, toggleSkillStat } = ctx;

    return (
        <div className="def-box" style={{ marginBottom: 15 }}>
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
                                    <span style={{ color: '#aaa', fontSize: '0.85em', marginLeft: 10 }}>{dadosTxt} | Custo: {custoTxt} {armaVinc && <span style={{ color: '#0f0' }}> | Vinculada: {armaVinc.nome}</span>}</span>
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
                                    {ENERGIA_LIST.map(en => <option key={en.value} value={en.value}>{en.label}</option>)}
                                </select>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// 🔥 NOVO: RENDERIZAR O GRIMÓRIO NA ABA DE DANO 🔥
export function AtaqueMagiasPreparadas() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;
    const { magiasOfensivas, skillConfigs, updateSkillConfig, toggleSkillStat } = ctx;

    return (
        <div className="def-box" style={{ marginBottom: 15 }}>
            <h3 style={{ color: '#00ccff', marginBottom: 10 }}>Magias Preparadas (Ofensivas)</h3>
            {magiasOfensivas.length === 0 ? (
                <p style={{ color: '#888', margin: 0 }}>Nenhuma magia de ataque preparada na aba Grimório.</p>
            ) : (
                magiasOfensivas.map(m => {
                    const cfg = skillConfigs[m.id] || { statusUsados: ['inteligencia'], energiaCombustao: 'mana' };
                    const dadosTxt = (m.dadosExtraQtd > 0) ? `${m.dadosExtraQtd}d${m.dadosExtraFaces || 20}` : 'Sem dados';
                    const custoTxt = (m.custoValor > 0) ? `${m.custoValor}%` : 'Livre';

                    return (
                        <div key={m.id} style={{ marginBottom: 12, padding: '10px', background: 'rgba(0,204,255,0.08)', borderLeft: '3px solid #00ccff', borderRadius: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <strong style={{ color: '#00ccff' }}>{m.nome}</strong>
                                    <span style={{ color: '#aaa', fontSize: '0.85em', marginLeft: 10 }}>{dadosTxt} | Custo: {custoTxt}</span>
                                </div>
                                <span style={{ color: '#00ccff', fontSize: '0.8em', fontWeight: 'bold' }}>PREPARADA</span>
                            </div>

                            <div style={{ marginBottom: 6 }}>
                                <label style={{ color: '#aaa', fontSize: '0.8em' }}>Status usados para o Dano:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                                    {STATS_LIST.map(st => (
                                        <label key={st.value} style={{ color: (cfg.statusUsados || []).includes(st.value) ? '#00ccff' : '#555', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <input type="checkbox" value={st.value} checked={(cfg.statusUsados || []).includes(st.value)} onChange={() => toggleSkillStat(m.id, st.value)} />
                                            {st.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.8em' }}>Energia de Combustão:</label>
                                <select className="input-neon" value={cfg.energiaCombustao || 'mana'} onChange={e => updateSkillConfig(m.id, 'energiaCombustao', e.target.value)} style={{ marginTop: 3 }}>
                                    <option value="mana">Mana</option>
                                    <option value="aura">Aura</option>
                                    <option value="chakra">Chakra</option>
                                    <option value="livre">Livre</option>
                                </select>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export function AtaqueBotoesAcao() {
    const ctx = useAtaqueForm();
    if (!ctx) return PROVIDER_FALLBACK;

    const { podeRolarDano, dummieAlvo, ignorarTravaAcerto, setIgnorarTravaAcerto, salvarConfigAtaque, rolarDano } = ctx;

    return (
        <>
            {/* 🔥 NOVO: OVERRIDE PARA MAGIAS DE ÁREA / SAVES 🔥 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, marginBottom: 5 }}>
                <label style={{ color: '#aaa', fontSize: '0.85em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input type="checkbox" checked={ignorarTravaAcerto} onChange={e => setIgnorarTravaAcerto(e.target.checked)} style={{ transform: 'scale(1.2)' }}/>
                    Ignorar Trava de Acerto (P/ Saving Throws ou Área)
                </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                <button className="btn-neon btn-gold" onClick={salvarConfigAtaque} style={{ flex: 1 }}>Salvar Config</button>
                <button
                    className={`btn-neon ${(podeRolarDano || ignorarTravaAcerto) ? 'btn-red' : ''}`}
                    onClick={rolarDano}
                    style={{ flex: 1, opacity: (podeRolarDano || ignorarTravaAcerto) ? 1 : 0.5 }}
                    disabled={!podeRolarDano && !ignorarTravaAcerto}
                >
                    {dummieAlvo ? ((podeRolarDano || ignorarTravaAcerto) ? `ATACAR ${dummieAlvo.nome.toUpperCase()}` : 'ACERTO NECESSARIO') : 'ROLAR DANO'}
                </button>
            </div>
        </>
    );
}