import React from 'react';
import { useElementosForm, emogis, cores, CATEGORIAS_ELEMENTOS, BONUS_OPTIONS } from './ElementosFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Elementos provider nao encontrado</div>;

/* ── Grimorio (Seletor de Elementos por Categoria) ── */

export function ElementosGrimorio() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { elemSelecionado, selecionarElemento } = ctx;

    return (
        <div className="def-box">
            <h3 style={{ color: '#f90', marginBottom: 15 }}>Grimório Elemental</h3>
            {CATEGORIAS_ELEMENTOS.map(categoria => (
                <div key={categoria.titulo} style={{ marginBottom: 18 }}>
                    <h4 style={{
                        color: '#aaa', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px',
                        borderBottom: '1px solid #333', paddingBottom: 4, marginBottom: 8, marginTop: 0
                    }}>
                        {categoria.titulo}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {categoria.itens.map(elem => {
                            const cor = cores[elem] || '#ccc';
                            const isActive = elem === elemSelecionado;
                            return (
                                <button
                                    key={elem} className="badge-elem"
                                    onClick={() => selecionarElemento(elem)}
                                    style={{
                                        padding: '4px 8px', fontSize: '0.75em', border: `1px solid ${isActive ? cor : '#444'}`,
                                        borderRadius: 4, background: 'transparent', color: isActive ? cor : '#aaa',
                                        cursor: 'pointer', boxShadow: isActive ? `inset 0 0 10px ${cor}` : 'none'
                                    }}
                                >
                                    {emogis[elem] || '\u2728'} {elem}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Formulario de Magia ── */

export function ElementosFormMagia() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const {
        elemEditandoId, nomeElem, setNomeElem,
        tipoMecanica, setTipoMecanica,
        savingAttr, setSavingAttr,
        energiaCombustao, setEnergiaCombustao,
        alcanceQuad, setAlcanceQuad,
        bonusTipo, setBonusTipo,
        bonusValor, setBonusValor,
        custoValor, setCustoValor,
        dadosQtd, setDadosQtd,
        dadosFaces, setDadosFaces,
        salvarNovoElem, cancelarEdicaoElem,
        formRef,
    } = ctx;

    return (
        <div className="def-box" ref={formRef} id="form-elem-box" style={{ marginTop: 15 }}>
            <h3 style={{ color: '#0ff', marginBottom: 10 }}>{elemEditandoId ? `Editando: ${nomeElem}` : 'Criar Nova Magia'}</h3>

            <input className="input-neon" type="text" placeholder="Nome da Magia/Técnica" value={nomeElem} onChange={e => setNomeElem(e.target.value)} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10, padding: 10, background: 'rgba(0,136,255,0.1)', border: '1px solid #0088ff', borderRadius: 5 }}>
                <div>
                    <label style={{ color: '#0088ff', fontSize: '0.85em', fontWeight: 'bold' }}>Mecânica de Uso</label>
                    <select className="input-neon" value={tipoMecanica} onChange={e => setTipoMecanica(e.target.value)}>
                        <option value="ataque">Rolagem de Acerto</option>
                        <option value="saving">Alvo Rola Saving Throw (CD)</option>
                        <option value="infusao">Infusão em Arma</option>
                        <option value="suporte">Suporte / Cura</option>
                    </select>
                </div>

                {tipoMecanica === 'saving' && (
                    <div>
                        <label style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold' }}>Qual Resistência o Alvo rola?</label>
                        <select className="input-neon" value={savingAttr} onChange={e => setSavingAttr(e.target.value)}>
                            <option value="forca">Força</option>
                            <option value="destreza">Destreza</option>
                            <option value="constituicao">Constituição</option>
                            <option value="sabedoria">Sabedoria</option>
                            <option value="inteligencia">Inteligência</option>
                            <option value="stamina">Stamina</option>
                            <option value="carisma">Carisma</option>
                            <option value="energiaEsp">Energia Espiritual</option>
                        </select>
                    </div>
                )}

                <div>
                    <label style={{ color: '#0088ff', fontSize: '0.85em', fontWeight: 'bold' }}>Energia Usada</label>
                    <select className="input-neon" value={energiaCombustao} onChange={e => setEnergiaCombustao(e.target.value)}>
                        <option value="mana">Mana (Base: Inteligência)</option>
                        <option value="aura">Aura (Base: Energia Esp.)</option>
                        <option value="chakra">Chakra (Base: Stamina)</option>
                        <option value="livre">Truque / Livre</option>
                    </select>
                </div>

                <div>
                    <label style={{ color: '#0088ff', fontSize: '0.85em', fontWeight: 'bold' }}>Alcance (Q)</label>
                    <input className="input-neon" type="number" min="0" step="0.5" value={alcanceQuad} onChange={e => setAlcanceQuad(e.target.value)} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Efeito de Bônus</label>
                    <select className="input-neon" value={bonusTipo} onChange={e => setBonusTipo(e.target.value)}>
                        {BONUS_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Valor Bônus</label>
                    <input className="input-neon" type="text" value={bonusValor} onChange={e => setBonusValor(e.target.value)} disabled={bonusTipo === 'nenhum'} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Custo % Energia</label>
                    <input className="input-neon" type="number" value={custoValor} onChange={e => setCustoValor(e.target.value)} disabled={energiaCombustao === 'livre'} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Extra (Qtd Dano)</label>
                    <input className="input-neon" type="number" value={dadosQtd} onChange={e => setDadosQtd(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Extra (Faces)</label>
                    <input className="input-neon" type="number" value={dadosFaces} onChange={e => setDadosFaces(e.target.value)} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn-neon btn-gold" onClick={salvarNovoElem} style={{ flex: 1 }}>{elemEditandoId ? 'Salvar Edição' : 'Inscrever no Grimório'}</button>
                {elemEditandoId && <button className="btn-neon btn-red" onClick={cancelarEdicaoElem} style={{ flex: 1 }}>Cancelar</button>}
            </div>
        </div>
    );
}

/* ── Card Individual de Magia ── */

export function ElementosMagiaCard({ magia }) {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { minhaFicha, profGlobal, getModificadorDoisDigitos, toggleEquiparElem, editarElem, deletarElem, conjurarMagia } = ctx;

    const p = magia;
    const isEquipped = p.equipado;
    const corPura = cores[p.elemento] || '#cccccc';
    const c = isEquipped ? corPura : '#888';
    const hex = corPura.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    const bg = isEquipped ? `rgba(${r},${g},${b},0.15)` : 'rgba(0,0,0,0.4)';

    const elemText = p.elemento || 'Neutro';
    const bTipo = p.bonusTipo || 'nenhum';
    const prefixo = bTipo.includes('mult_') ? 'x' : '+';
    const propText = bTipo === 'nenhum' ? 'Sem bônus atrelado' : bTipo.replace('_', ' ').toUpperCase();
    const bValorStr = bTipo === 'nenhum' ? '' : `: ${prefixo}${p.bonusValor || 0}`;
    const dadosStr = p.dadosExtraQtd > 0 ? ` | Dados: +${p.dadosExtraQtd}d${p.dadosExtraFaces || 20}` : '';
    const custoStr = p.custoValor > 0 ? ` | Custo: ${p.custoValor}% (${p.energiaCombustao?.toUpperCase()})` : ' | Custo: Livre';

    const mec = p.tipoMecanica || 'ataque';
    const energiaToAttr = { 'mana': 'inteligencia', 'aura': 'energiaEsp', 'chakra': 'stamina', 'livre': 'inteligencia' };
    const regente = energiaToAttr[p.energiaCombustao || 'mana'];
    const modBase = getModificadorDoisDigitos(minhaFicha[regente]?.base);
    const cd = 8 + modBase + profGlobal;
    const bonusAcerto = modBase + profGlobal;

    return (
        <div className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginTop: 15, padding: 15, transition: 'all 0.3s', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                <div>
                    <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                        {emogis[elemText] || '\u2728'} {p.nome || 'Magia'} <span style={{ fontSize: '0.6em', color: '#fff' }}>(Alc: {p.alcanceQuad || 1}Q)</span>
                    </h3>
                    <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                        Mecânica: <strong>{mec.toUpperCase()}</strong> {mec === 'saving' ? `(CD ${cd} - ${p.savingAttr?.toUpperCase()})` : mec === 'ataque' ? `(+${bonusAcerto} Acerto)` : ''}
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '2px 0 0' }}>
                        Bônus: {propText}{bValorStr}{dadosStr}{custoStr}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {isEquipped && (
                        <button className="btn-neon btn-gold" onClick={() => conjurarMagia(p)} style={{ padding: '5px 15px', fontSize: '1.1em', margin: 0, boxShadow: `0 0 10px ${c}` }}>
                            🪄 CONJURAR
                        </button>
                    )}
                    <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => toggleEquiparElem(p.id)}>
                        {isEquipped ? 'PREPARADA' : 'MEMORIZAR'}
                    </button>
                    <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '0.9em', margin: 0 }} onClick={() => editarElem(p.id)}>EDITAR</button>
                    <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '0.9em', margin: 0 }} onClick={() => deletarElem(p.id)}>APAGAR</button>
                </div>
            </div>
        </div>
    );
}

/* ── Lista de Magias do Grupo Selecionado ── */

export function ElementosMagiaLista() {
    const ctx = useElementosForm();
    if (!ctx) return FALLBACK;
    const { elemSelecionado, magiasDoGrupo, magiasConjuradasOutros } = ctx;

    return (
        <div id="lista-elementos-salvos" style={{ marginTop: 15 }}>
            {magiasDoGrupo.length > 0 ? (
                <>
                    <h3 style={{ color: cores[elemSelecionado] || '#ccc', marginTop: 10, borderBottom: `1px solid ${cores[elemSelecionado] || '#ccc'}`, paddingBottom: 5, textTransform: 'uppercase' }}>
                        {emogis[elemSelecionado] || '\u2728'} Magias de {elemSelecionado}
                    </h3>
                    {magiasDoGrupo.map(p => <ElementosMagiaCard key={p.id} magia={p} />)}
                </>
            ) : (
                <p style={{ color: '#888', fontStyle: 'italic', marginTop: 20 }}>Nenhuma magia de <strong>{elemSelecionado}</strong> inscrita.</p>
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
