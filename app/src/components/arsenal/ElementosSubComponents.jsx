import React, { useState } from 'react';
import { useElementosForm, emogis, cores, ABAS_GRIMORIO, BONUS_OPTIONS } from './ElementosFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Elementos provider nao encontrado</div>;

// 📜 TABELA DE DOMÍNIOS (Copiada para o Grimório saber ler os buffs)
const NIVEIS_DOMINIO = {
    1: { nome: "Básico", cor: "#44ff44", desc: "+10% Dano" },
    2: { nome: "Intermediário", cor: "#44ff44", desc: "+25% Dano | -5% Custo" },
    3: { nome: "Avançado", cor: "#44ff44", desc: "+50% Dano | -10% Custo" },
    4: { nome: "Virtuoso", cor: "#0088ff", desc: "Dano x2 | Ignora Resistências Menores" },
    5: { nome: "Maestria", cor: "#0088ff", desc: "Dano x3.5 | -25% Custo | -50% Dano Sofrido" },
    6: { nome: "Perfeito", cor: "#0088ff", desc: "Dano x6 | Imunidade Total | Incancelável" },
    7: { nome: "Molecular", cor: "#aa00ff", desc: "Dano x10 | Ignora Imunidades | Dano Persistente" },
    8: { nome: "Atômico", cor: "#aa00ff", desc: "Dano x50 | -50% Custo | Desintegração de Armadura" },
    9: { nome: "Absoluto", cor: "#ff003c", desc: "Dano x100 | Custo ZERO | Silenciamento de Elemento" },
    10: { nome: "Eterno", cor: "#ffcc00", desc: "Dano Incalculável | Apagamento Conceitual" }
};

// ============================================================================
// 🔥 O IMPORTADOR INTELIGENTE DO GRIMÓRIO 🔥
// ============================================================================
export function ElementosImportadorIA() {
    const ctx = useElementosForm();
    const [aberto, setAberto] = useState(false);
    const [textoDocs, setTextoDocs] = useState('');
    const [jsonResposta, setJsonResposta] = useState('');
    const [fase, setFase] = useState(1); 

    if (!ctx) return null;
    const { injetarJsonDaIA } = ctx;

    const gerarPrompt = () => {
        if (!textoDocs.trim()) return alert("Cole o texto dos pergaminhos primeiro!");
        const prompt = `Atue como extrator de dados de RPG.
Transforme TODAS as magias, técnicas e feitiços descritos no texto abaixo em itens dentro do array "ataquesElementais".
Tente deduzir o "elemento" a que pertencem (Ex: Fogo, Agua, Magia de Osso, Magias de 1º Ciclo, Aura Pura). Se não souber, use "Neutro".
Extraia o dano (ex: "15d6" vira danoQtd: 15 e danoFaces: 6).
Extraia o custo de energia se houver (ex: "Custa 10%" vira custoPercentual: 10).
Tente deduzir a "energiaCombustao" (mana, aura, chakra, corpo, livre). Se for indeciso, use "flexivel".
Se houver efeitos de status, paralisia, condições ou buffs complexos, coloque TUDO no campo "notasIA".

TEXTO:
${textoDocs}

RETORNE EXATAMENTE UM JSON PURO:
{
  "ataquesElementais": [{ "nome": "X", "descricao": "Y", "elemento": "Fogo", "energiaCombustao": "mana", "danoQtd": 0, "danoFaces": 0, "custoPercentual": 0, "alcance": 1, "area": 0, "notasIA": "" }]
}`;
        navigator.clipboard.writeText(prompt);
        alert("Instrução mágica copiada! Envie para a sua IA e traga o código resultante.");
        setFase(2);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <button className="btn-neon btn-blue" onClick={() => setAberto(!aberto)} style={{ width: '100%', margin: 0, fontWeight: 'bold' }}>
                {aberto ? '❌ FECHAR TRADUTOR ARCANO' : '🤖 IMPORTAR MAGIAS DO GOOGLE DOCS'}
            </button>
            {aberto && (
                <div className="def-box" style={{ marginTop: '10px', border: '1px dashed #00aaff', background: 'rgba(0,170,255,0.05)' }}>
                    {fase === 1 ? (
                        <>
                            <textarea value={textoDocs} onChange={e => setTextoDocs(e.target.value)} placeholder="Cole aqui os textos longos das magias e elementos..." style={{ width: '100%', height: '120px', background: '#000', color: '#fff', padding: '10px', resize: 'vertical' }} />
                            <button className="btn-neon btn-gold" onClick={gerarPrompt} style={{ width: '100%', marginTop: '10px' }}>1. COPIAR PROMPT DE INJEÇÃO</button>
                        </>
                    ) : (
                        <>
                            <textarea value={jsonResposta} onChange={e => setJsonResposta(e.target.value)} placeholder="Cole o JSON que a IA devolveu..." style={{ width: '100%', height: '120px', background: '#000', color: '#0f0', fontFamily: 'monospace', padding: '10px', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn-neon btn-red" onClick={() => setFase(1)}>VOLTAR</button>
                                <button className="btn-neon btn-green" onClick={() => { if(injetarJsonDaIA(jsonResposta)) setAberto(false); }}>2. TRANSCREVER PARA O GRIMÓRIO</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// O RESTO DOS COMPONENTES
// ============================================================================

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
    const { abaAtual, elemSelecionado, selecionarElemento, minhaFicha } = ctx;
    const categoriasVisiveis = ABAS_GRIMORIO[abaAtual]?.categorias || [];

    // Busca os domínios para saber se o personagem tem maestria num elemento
    const dominios = minhaFicha?.dominios?.elementais || {};

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
                                
                                // 🔥 INJEÇÃO DE UX: Mostra o Nível no botão se o jogador tiver upado o Domínio! 🔥
                                const nivelDom = dominios[elem]?.nivel;
                                const domTexto = nivelDom ? ` (Nv.${nivelDom})` : '';
                                
                                return (
                                    <button key={elem} className="badge-elem" onClick={() => selecionarElemento(elem)}
                                        style={{ padding: '4px 8px', fontSize: '0.75em', border: `1px solid ${isActive ? cor : '#444'}`, borderRadius: 4, background: 'transparent', color: isActive ? cor : '#aaa', cursor: 'pointer', boxShadow: isActive ? `inset 0 0 10px ${cor}` : 'none' }}>
                                        {emogis[elem] || '\u2728'} {elem}
                                        <span style={{ color: nivelDom ? '#ffcc00' : 'inherit', fontWeight: nivelDom ? 'bold' : 'normal' }}>{domTexto}</span>
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
        elemEditandoId, nomeElem, setNomeElem, descricaoElem, setDescricaoElem, elementosAfetados, setElementosAfetados,
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
            
            <textarea className="input-neon" placeholder="Descrição e Efeitos Narrativos (Como a magia atua na realidade?)" value={descricaoElem} onChange={e => setDescricaoElem(e.target.value)} style={{ width: '100%', minHeight: '60px', marginTop: 10, borderColor: '#555', color: '#ccc', fontStyle: 'italic', resize: 'vertical' }} />

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
    const { toggleEquiparElem, editarElem, deletarElem, profGlobal, getModificadorDoisDigitos, minhaFicha, elementosInatos } = ctx;

    const elemText = magia.elemento || 'Neutro';
    const isFlexivel = magia.energiaCombustao === 'flexivel';
    const energiaAtiva = magia.energiaCombustao;

    const isInato = elementosInatos.includes(elemText.toLowerCase().trim());

    // 🔥 LÓGICA DO DOMÍNIO: Extrai as infos da Aba de Domínios 🔥
    const dominioData = minhaFicha?.dominios?.elementais?.[elemText];
    const nivelDom = dominioData?.nivel || 0;
    const infoDom = NIVEIS_DOMINIO[nivelDom];

    // 🔥 MATEMÁTICA DE REDUÇÃO DE MANA 🔥
    let redCustoMult = 1;
    if (nivelDom >= 9) redCustoMult = 0;
    else if (nivelDom >= 8) redCustoMult = 0.50; // -50%
    else if (nivelDom >= 5) redCustoMult = 0.75; // -25%
    else if (nivelDom >= 3) redCustoMult = 0.90; // -10%
    else if (nivelDom >= 2) redCustoMult = 0.95; // -5%

    const isEquipped = magia.equipado;
    const corPura = cores[elemText] || '#cccccc';
    const c = isEquipped ? corPura : '#888';
    const bg = isEquipped ? `rgba(0,0,0,0.7)` : 'rgba(0,0,0,0.4)'; 

    const bTipo = magia.bonusTipo || 'nenhum';
    const propText = bTipo === 'nenhum' ? 'Sem bônus atrelado' : bTipo.replace('_', ' ').toUpperCase();
    const bValorStr = bTipo === 'nenhum' ? '' : `: ${bTipo.includes('mult_') ? 'x' : '+'}${magia.bonusValor || 0}`;
    const dadosStr = magia.dadosExtraQtd > 0 ? ` | Dados: +${magia.dadosExtraQtd}d${magia.dadosExtraFaces || 20}` : '';
    
    // 🔥 DISPLAY INTELIGENTE DO CUSTO 🔥
    const custoFinal = isInato ? 0 : (magia.custoValor * redCustoMult);
    const custoOriginalDisplay = magia.custoValor > 0 && redCustoMult < 1 && !isInato 
        ? <span style={{ textDecoration: 'line-through', color: '#555', marginRight: '5px' }}>{magia.custoValor}%</span> 
        : null;

    let txtCusto = `Custo: ${custoFinal}% (${energiaAtiva?.toUpperCase()})`;
    if (isInato) txtCusto = `Custo: ZERO (Ressonância Inata)`;
    else if (nivelDom >= 9) txtCusto = `Custo: ZERO (Domínio Absoluto)`;
    else if (magia.custoValor === 0 || isNaN(magia.custoValor)) txtCusto = `Custo: Livre`;
    else if (redCustoMult < 1) txtCusto = `Custo: ${custoFinal}% (Reduzido pelo Domínio)`;

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
            
            {magia.notasIA && (
                <div style={{ background: '#ffcc00', color: '#000', padding: '4px 10px', fontSize: '0.8em', fontWeight: 'bold', borderRadius: '4px', marginBottom: '10px' }}>
                    ⚠️ NOTA DA SEXTA-FEIRA: {magia.notasIA}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                        {emogis[elemText] || '\u2728'} {magia.nome || 'Magia'} <span style={{fontSize: '0.6em', color: '#fff'}}>(Alc: {magia.alcanceQuad || 1}Q)</span>
                    </h3>
                    
                    {magia.descricao && (
                        <p style={{ color: '#ccc', fontSize: '0.85em', fontStyle: 'italic', margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: `2px solid ${c}` }}>
                            "{magia.descricao}"
                        </p>
                    )}

                    <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                        Mecânica: <strong>{mec.toUpperCase()}</strong> {mec === 'saving' ? `(CD ${cd} - ${magia.savingAttr?.toUpperCase()})` : mec === 'ataque' ? `(+${bonusAcerto} Acerto)` : ''}
                    </p>
                    {magia.areaQuad > 0 && (
                        <p style={{ color: '#ff00ff', fontSize: '0.85em', margin: '2px 0 0' }}>
                            💥 Área: <strong>{magia.areaQuad}Q</strong> | Alvos: <strong>{alvoStr}</strong> | Zona: <strong>{durStr}</strong>
                        </p>
                    )}
                    
                    {magia.elementosAfetados && (
                        <p style={{ color: '#00ccff', fontSize: '0.85em', margin: '2px 0 0', fontWeight: 'bold' }}>
                            🌊 Consome/Afeta: {magia.elementosAfetados}
                        </p>
                    )}

                    {isInato && (
                        <div style={{ background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', width: '100%' }}>
                            <p style={{ color: '#00ffcc', fontSize: '0.85em', margin: '0', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.5)' }}>
                                🌪️ Domínio Inato: Você possui a Ressonância deste elemento. Custo zerado!
                            </p>
                        </div>
                    )}

                    {/* 🔥 O PAINEL DE DOMÍNIO INJETADO NA MAGIA 🔥 */}
                    {infoDom && (
                        <div style={{ background: `rgba(0, 0, 0, 0.5)`, border: `1px solid ${infoDom.cor}`, padding: '6px 10px', borderRadius: '4px', marginTop: '8px', borderLeft: `4px solid ${infoDom.cor}` }}>
                            <div style={{ color: infoDom.cor, fontSize: '0.9em', fontWeight: 'bold', textShadow: `0 0 5px ${infoDom.cor}` }}>
                                💎 Nv. {nivelDom} - {infoDom.nome}
                            </div>
                            <div style={{ color: '#ccc', fontSize: '0.8em', marginTop: '2px', fontStyle: 'italic' }}>
                                <span style={{ color: '#fff' }}>Pressão Passiva:</span> {infoDom.desc}
                            </div>
                        </div>
                    )}

                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '8px 0 0' }}>
                        Bônus Adicional: {propText}{bValorStr}{dadosStr} <br/>
                        {custoOriginalDisplay} <span style={{ color: redCustoMult < 1 && magia.custoValor > 0 ? '#0f0' : '#aaa', fontWeight: redCustoMult < 1 && magia.custoValor > 0 ? 'bold' : 'normal' }}>| {txtCusto}</span>
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                    <button className="btn-neon" style={{ borderColor: c, color: c, padding: '8px 20px', fontSize: '1.1em', margin: 0, fontWeight: 'bold', width: '100%' }} onClick={() => toggleEquiparElem(magia.id)}>
                        {isEquipped ? 'PREPARADA' : 'MEMORIZAR'}
                    </button>
                    <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                        <button className="btn-neon btn-blue" style={{ flex: 1, padding: '5px 0', fontSize: '0.8em', margin: 0 }} onClick={() => editarElem(magia.id)}>EDITAR</button>
                        <button className="btn-neon btn-red" style={{ flex: 1, padding: '5px 0', fontSize: '0.8em', margin: 0 }} onClick={() => deletarElem(magia.id)}>APAGAR</button>
                    </div>
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