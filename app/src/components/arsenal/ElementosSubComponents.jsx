import React, { useState } from 'react';
import { useElementosForm, emogis, cores, ABAS_GRIMORIO, BONUS_OPTIONS } from './ElementosFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Elementos provider nao encontrado</div>;

export function ElementosSidebar() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { abaAtual, setAbaAtual, cancelarEdicaoElem } = ctx;

    return (
        <div className="def-box" style={{ flex: '0 0 250px', padding: '15px', position: 'sticky', top: '20px' }}>
            <h3 style={{ color: '#fff', marginTop: 0, textAlign: 'center', marginBottom: '20px', fontSize: '1.1em', letterSpacing: '1px' }}>📖 GRIMÓRIO</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.entries(ABAS_GRIMORIO).map(([key, data]) => (
                    <button key={key} className={`btn-neon ${abaAtual === key ? 'btn-gold' : ''}`}
                        onClick={() => { setAbaAtual(key); cancelarEdicaoElem(); }}
                        style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0, fontSize: '0.9em' }}>
                        {data.icon} {data.label.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ElementosGrimorio() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { abaAtual, elemSelecionado, selecionarElemento } = ctx;
    const categoriasVisiveis = ABAS_GRIMORIO[abaAtual]?.categorias || [];

    return (
        <div className="def-box">
            <h3 style={{ color: '#f90', marginBottom: 15 }}>Arquivos: {ABAS_GRIMORIO[abaAtual].label}</h3>
            {categoriasVisiveis.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Esta aba ainda não possui ramificações listadas.</p>
            ) : (
                categoriasVisiveis.map(categoria => (
                    <div key={categoria.titulo} style={{ marginBottom: 18 }}>
                        <h4 style={{ color: '#aaa', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: 4, marginBottom: 8, marginTop: 0 }}>
                            {categoria.titulo}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {categoria.itens.map(elem => {
                                const cor = cores[elem] || '#ccc';
                                const isActive = elem === elemSelecionado;
                                return (
                                    <button key={elem} className="badge-elem" onClick={() => selecionarElemento(elem)}
                                        style={{ padding: '4px 8px', fontSize: '0.75em', border: `1px solid ${isActive ? cor : '#444'}`, borderRadius: 4, background: 'transparent', color: isActive ? cor : '#aaa', cursor: 'pointer', boxShadow: isActive ? `inset 0 0 10px ${cor}` : 'none' }}>
                                        {emogis[elem] || '\u2728'} {elem}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export function ElementosFormMagia() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const {
        elemEditandoId, nomeElem, setNomeElem, elementosAfetados, setElementosAfetados, // 🔥 NOVO DESTRUCTURING
        tipoMecanica, setTipoMecanica, savingAttr, setSavingAttr,
        energiaCombustao, setEnergiaCombustao, allowedEnergies, alcanceQuad, setAlcanceQuad, 
        areaQuad, setAreaQuad, alvosAfetados, setAlvosAfetados, duracaoZona, setDuracaoZona,
        bonusTipo, setBonusTipo, bonusValor, setBonusValor, custoValor, setCustoValor, dadosQtd, setDadosQtd,
        dadosFaces, setDadosFaces, salvarNovoElem, cancelarEdicaoElem, formRef
    } = ctx;

    return (
        <div className="def-box" ref={formRef} id="form-elem-box" style={{ marginTop: 0 }}>
            <h3 style={{ color: '#0ff', marginBottom: 10 }}>{elemEditandoId ? `Editando: ${nomeElem}` : 'Criar Nova Magia / Técnica'}</h3>
            <input className="input-neon" type="text" placeholder="Nome da Magia/Técnica" value={nomeElem} onChange={e => setNomeElem(e.target.value)} />
            
            {/* 🔥 NOVO BLOCO: ADICIONANDO O CAMPO ELEMENTOS AFETADOS 🔥 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10, padding: 10, background: 'rgba(0,136,255,0.1)', border: '1px solid #0088ff', borderRadius: 5 }}>
                <div>
                    <label style={{ color: '#0088ff', fontSize: '0.85em', fontWeight: 'bold' }}>Mecânica de Uso</label>
                    <select className="input-neon" value={tipoMecanica} onChange={e => setTipoMecanica(e.target.value)}>
                        <option value="ataque">Rolagem de Acerto</option>
                        <option value="saving">Alvo Rola Saving Throw</option>
                        <option value="infusao">Infusão em Arma</option>
                        <option value="suporte">Suporte / Cura</option>
                    </select>
                </div>
                {tipoMecanica === 'saving' && (
                    <div>
                        <label style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold' }}>Qual Resistência?</label>
                        <select className="input-neon" value={savingAttr} onChange={e => setSavingAttr(e.target.value)}>
                            <option value="forca">Força</option><option value="destreza">Destreza</option><option value="constituicao">Constituição</option>
                            <option value="sabedoria">Sabedoria</option><option value="inteligencia">Inteligência</option><option value="stamina">Stamina</option>
                            <option value="carisma">Carisma</option><option value="energiaEsp">Energia Espiritual</option>
                        </select>
                    </div>
                )}
                <div>
                    <label style={{ color: '#0088ff', fontSize: '0.85em', fontWeight: 'bold' }}>Energia Usada</label>
                    <select className="input-neon" value={energiaCombustao} onChange={e => setEnergiaCombustao(e.target.value)}>
                        {allowedEnergies.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {allowedEnergies.length > 3 && <span style={{fontSize: '0.7em', color: '#ff00ff', display: 'block', marginTop: 2}}>Regras Subvertidas (Arcana)</span>}
                </div>
                <div>
                    <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Alcance Máx (Q)</label>
                    <input className="input-neon" type="number" min="0" step="0.5" value={alcanceQuad} onChange={e => setAlcanceQuad(e.target.value)} />
                </div>
                {/* O Campo Novo Entra Aqui! */}
                <div>
                    <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Afeta/Consome (Ex: Fogo)</label>
                    <input className="input-neon" type="text" placeholder="Elementos fracos" value={elementosAfetados} onChange={e => setElementosAfetados(e.target.value)} style={{ borderColor: '#00ccff', color: '#00ccff' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10, padding: 10, background: 'rgba(255,0,255,0.1)', border: '1px dashed #ff00ff', borderRadius: 5 }}>
                <div>
                    <label style={{ color: '#ff00ff', fontSize: '0.85em', fontWeight: 'bold' }}>Raio de Efeito (Q)</label>
                    <input className="input-neon" type="number" min="0" step="0.5" value={areaQuad} onChange={e => setAreaQuad(e.target.value)} style={{ borderColor: '#ff00ff', color: '#ff00ff' }} />
                </div>
                <div>
                    <label style={{ color: '#ff00ff', fontSize: '0.85em', fontWeight: 'bold' }}>Filtro de Fogo Amigo</label>
                    <select className="input-neon" value={alvosAfetados} onChange={e => setAlvosAfetados(e.target.value)} style={{ borderColor: '#ff00ff' }}>
                        <option value="todos">Afeta Todos (Aliados e Inimigos)</option>
                        <option value="inimigos">Apenas Inimigos (Ignora Aliados)</option>
                        <option value="aliados">Apenas Aliados (Ignora Inimigos)</option>
                    </select>
                </div>
                <div>
                    <label style={{ color: '#ff00ff', fontSize: '0.85em', fontWeight: 'bold' }}>Duração da Zona Mágica</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input className="input-neon" type="number" min="0" value={duracaoZona} onChange={e => setDuracaoZona(e.target.value)} style={{ borderColor: '#ff00ff', width: '60px' }} />
                        <span style={{ fontSize: '0.8em', color: '#ccc' }}>Turnos (0 = Desaparece)</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>Efeito de Bônus</label><select className="input-neon" value={bonusTipo} onChange={e => setBonusTipo(e.target.value)}>{BONUS_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select></div>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>Valor Bônus</label><input className="input-neon" type="text" value={bonusValor} onChange={e => setBonusValor(e.target.value)} disabled={bonusTipo === 'nenhum'} /></div>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>Custo % Energia</label><input className="input-neon" type="number" value={custoValor} onChange={e => setCustoValor(e.target.value)} disabled={energiaCombustao === 'livre'} /></div>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>Extra (Qtd Dano)</label><input className="input-neon" type="number" value={dadosQtd} onChange={e => setDadosQtd(e.target.value)} /></div>
                <div><label style={{ color: '#aaa', fontSize: '0.85em' }}>Extra (Faces)</label><input className="input-neon" type="number" value={dadosFaces} onChange={e => setDadosFaces(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn-neon btn-gold" onClick={salvarNovoElem} style={{ flex: 1 }}>{elemEditandoId ? 'Salvar Edição' : 'Inscrever no Grimório'}</button>
                {elemEditandoId && <button className="btn-neon btn-red" onClick={cancelarEdicaoElem} style={{ flex: 1 }}>Cancelar</button>}
            </div>
        </div>
    );
}

export function ElementosMagiaCard({ magia }) {
    const ctx = useElementosForm();

    if (!ctx) return null;
    const { toggleEquiparElem, editarElem, deletarElem, profGlobal, getModificadorDoisDigitos, minhaFicha } = ctx;

    const isFlexivel = magia.energiaCombustao === 'flexivel';
    const energiaAtiva = magia.energiaCombustao;

    const isEquipped = magia.equipado;
    const corPura = cores[magia.elemento] || '#cccccc';
    const c = isEquipped ? corPura : '#888';
    const bg = isEquipped ? `rgba(0,0,0,0.7)` : 'rgba(0,0,0,0.4)'; 

    const elemText = magia.elemento || 'Neutro';
    const bTipo = magia.bonusTipo || 'nenhum';
    const propText = bTipo === 'nenhum' ? 'Sem bônus atrelado' : bTipo.replace('_', ' ').toUpperCase();
    const bValorStr = bTipo === 'nenhum' ? '' : `: ${bTipo.includes('mult_') ? 'x' : '+'}${magia.bonusValor || 0}`;
    const dadosStr = magia.dadosExtraQtd > 0 ? ` | Dados: +${magia.dadosExtraQtd}d${magia.dadosExtraFaces || 20}` : '';
    const custoStr = magia.custoValor > 0 ? ` | Custo: ${magia.custoValor}% (${energiaAtiva?.toUpperCase()})` : ` | Custo: Livre`;

    const mec = magia.tipoMecanica || 'ataque';
    const alvoStr = magia.alvosAfetados === 'inimigos' ? 'Inimigos' : magia.alvosAfetados === 'aliados' ? 'Aliados' : 'Todos';
    const durStr = magia.duracaoZona > 0 ? `${magia.duracaoZona} Turnos` : 'Instantâneo';
    
    let regente = 'inteligencia';
    let modBase = 0;
    if (energiaAtiva === 'corpo') {
        const modForca = getModificadorDoisDigitos(minhaFicha['forca']?.base);
        const modDestreza = getModificadorDoisDigitos(minhaFicha['destreza']?.base);
        if (modDestreza > modForca) { regente = 'destreza'; modBase = modDestreza; } 
        else { regente = 'forca'; modBase = modForca; }
    } else {
        const energiaToAttr = { 'mana': 'inteligencia', 'aura': 'energiaEsp', 'chakra': 'stamina', 'pontosVitais': 'constituicao', 'pontosMortais': 'inteligencia', 'livre': 'inteligencia', 'flexivel': 'inteligencia' };
        regente = energiaToAttr[energiaAtiva || 'mana'] || 'inteligencia';
        modBase = getModificadorDoisDigitos(minhaFicha[regente]?.base);
    }

    const cd = 8 + modBase + profGlobal;
    const bonusAcerto = modBase + profGlobal;

    return (
        <div className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginTop: 15, padding: 15, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                <div>
                    <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                        {emogis[elemText] || '\u2728'} {magia.nome || 'Magia'} <span style={{fontSize: '0.6em', color: '#fff'}}>(Alc: {magia.alcanceQuad || 1}Q)</span>
                    </h3>
                    <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                        Mecânica: <strong>{mec.toUpperCase()}</strong> {mec === 'saving' ? `(CD ${cd} - ${magia.savingAttr?.toUpperCase()})` : mec === 'ataque' ? `(+${bonusAcerto} Acerto)` : ''}
                    </p>
                    {magia.areaQuad > 0 && (
                        <p style={{ color: '#ff00ff', fontSize: '0.85em', margin: '2px 0 0' }}>
                            💥 Área: <strong>{magia.areaQuad}Q</strong> | Alvos: <strong>{alvoStr}</strong> | Zona: <strong>{durStr}</strong>
                        </p>
                    )}
                    
                    {/* 🔥 EXIBINDO OS ELEMENTOS QUE ESSA MAGIA CONSOME 🔥 */}
                    {magia.elementosAfetados && (
                        <p style={{ color: '#00ccff', fontSize: '0.85em', margin: '2px 0 0', fontWeight: 'bold' }}>
                            🌊 Consome/Afeta: {magia.elementosAfetados}
                        </p>
                    )}

                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '2px 0 0' }}>
                        Bônus: {propText}{bValorStr}{dadosStr}{custoStr}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => toggleEquiparElem(magia.id)}>{isEquipped ? 'PREPARADA' : 'MEMORIZAR'}</button>
                    <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '0.9em', margin: 0 }} onClick={() => editarElem(magia.id)}>EDITAR</button>
                    <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '0.9em', margin: 0 }} onClick={() => deletarElem(magia.id)}>APAGAR</button>
                </div>
            </div>
        </div>
    );
}

export function ElementosMagiaLista() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { elemSelecionado, magiasDoGrupo, magiasConjuradasOutros } = ctx;

    return (
        <div id="lista-elementos-salvos" style={{ marginTop: 0 }}>
            {magiasDoGrupo.length > 0 ? (
                <>
                    <h3 style={{ color: cores[elemSelecionado] || '#ccc', marginTop: 10, borderBottom: `1px solid ${cores[elemSelecionado] || '#ccc'}`, paddingBottom: 5, textTransform: 'uppercase' }}>
                        {emogis[elemSelecionado] || '\u2728'} Escritos de {elemSelecionado}
                    </h3>
                    {magiasDoGrupo.map(p => <ElementosMagiaCard key={p.id} magia={p} />)}
                </>
            ) : (
                <p style={{ color: '#888', fontStyle: 'italic', marginTop: 20 }}>Nenhum escrito ou técnica de <strong>{elemSelecionado}</strong> encontrado nesta aba.</p>
            )}

            {magiasConjuradasOutros.length > 0 && (
                <>
                    <h3 style={{ color: '#ffcc00', marginTop: 40, borderBottom: '1px solid #ffcc00', paddingBottom: 5, textTransform: 'uppercase', textShadow: '0 0 10px #ffcc00' }}>
                        Outras Magias Memorizadas
                    </h3>
                    {magiasConjuradasOutros.map(p => <ElementosMagiaCard key={p.id} magia={p} />)}
                </>
            )}
        </div>
    );
}