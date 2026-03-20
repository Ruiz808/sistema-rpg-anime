import React, { useState, useRef, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

const emogis = {
    'Fogo': '\uD83D\uDD25', 'Agua': '\uD83D\uDCA7', 'Raio': '\u26A1', 'Terra': '\uD83E\uDEA8', 'Vento': '\uD83C\uDF2A\uFE0F',
    'Fogo Verdadeiro': '\uD83D\uDD25', 'Agua Verdadeira': '\uD83D\uDCA7', 'Raio Verdadeiro': '\u26A1', 'Terra Verdadeira': '\uD83E\uDEA8', 'Vento Verdadeiro': '\uD83C\uDF2A\uFE0F',
    'Solar': '\u2600\uFE0F', 'Solar Verdadeiro': '\u2600\uFE0F', 'Gelo': '\u2744\uFE0F', 'Gelo Verdadeiro': '\u2744\uFE0F', 'Natureza': '\uD83C\uDF3F', 'Natureza Verdadeira': '\uD83C\uDF3F', 'Energia': '\uD83D\uDCAB', 'Energia Verdadeira': '\uD83D\uDCAB', 'Vacuo': '\uD83D\uDD73\uFE0F', 'Vacuo Verdadeiro': '\uD83D\uDD73\uFE0F',
    'Luz': '\u2728', 'Trevas': '\uD83C\uDF11', 'Ether': '\uD83C\uDF0C', 'Celestial': '\uD83C\uDF1F', 'Infernal': '\uD83C\uDF0B', 'Caos': '\uD83C\uDF00', 'Criacao': '\uD83C\uDF87', 'Destruicao': '\uD83D\uDCA5', 'Cosmos': '\u267E\uFE0F',
    'Vida': '\uD83C\uDF3A', 'Morte': '\uD83D\uDC80', 'Vazio': '\u2B1B', 'Neutro': '\u26AA',
    'Magia de Osso': '\uD83E\uDDB4', 'Magia de Sangue': '\uD83E\uDE78', 'Magia de Borracha': '\uD83C\uDF88', 'Magia de Sal': '\uD83E\uDDC2', 'Magia da Alma': '\uD83D\uDC7B', 'Magia de Tremor': '\uD83E\uDEE8', 'Magia de Gravidade': '\uD83C\uDF0C', 'Magia de Equipamento': '\u2699\uFE0F', 'Magia de Tempo': '\u23F3', 'Magia Draconica': '\uD83D\uDC09', 'Magia de Espelho': '\uD83E\uDE9E', 'Magia de Explosao': '\uD83D\uDCA5', 'Magia Espacial': '\uD83C\uDF00', 'Magia de Metamorfose': '\uD83C\uDFAD',
    'Magia Arcana/Negra': '\uD83D\uDD2E', 'Magia de Ciclo': '\uD83D\uDD04',
    'Elemento Madeira': '\uD83E\uDEB5', 'Elemento Mineral': '\uD83D\uDC8E', 'Elemento Cinzas': '\uD83C\uDF2B\uFE0F', 'Elemento Igneo': '\u2604\uFE0F', 'Elemento Lava': '\uD83C\uDF0B', 'Elemento Vapor': '\u2668\uFE0F', 'Elemento Nevoa': '\uD83C\uDF2B\uFE0F', 'Elemento Tempestade': '\uD83C\uDF29\uFE0F', 'Elemento Areia': '\uD83C\uDFDC\uFE0F', 'Elemento Tufao': '\uD83C\uDF2A\uFE0F',
    'Elemento Velocidade': '\uD83D\uDCA8', 'Elemento Poeira': '\uD83D\uDD32', 'Elemento Calor': '\uD83C\uDF21\uFE0F', 'Elemento Cal': '\u2B1C', 'Elemento Carbono': '\u2B1B', 'Elemento Veneno': '\u2623\uFE0F', 'Elemento Magnetismo': '\uD83E\uDDF2', 'Elemento Som': '\uD83D\uDD0A'
};

const cores = {
    'Fogo': '#ff4d4d', 'Agua': '#4dffff', 'Raio': '#ffff4d', 'Terra': '#d2a679', 'Vento': '#4dff88',
    'Fogo Verdadeiro': '#ff0000', 'Agua Verdadeira': '#00e6e6', 'Raio Verdadeiro': '#ffff00', 'Terra Verdadeira': '#d48846', 'Vento Verdadeiro': '#00ff40',
    'Solar': '#ffb366', 'Solar Verdadeiro': '#ff6600', 'Gelo': '#99ffff', 'Gelo Verdadeiro': '#00ffff', 'Natureza': '#66ff66', 'Natureza Verdadeira': '#00ff00', 'Energia': '#ff66ff', 'Energia Verdadeira': '#ff00ff', 'Vacuo': '#999999', 'Vacuo Verdadeiro': '#ffffff',
    'Luz': '#ffffff', 'Trevas': '#800080', 'Ether': '#b366ff', 'Celestial': '#ffffcc', 'Infernal': '#cc0000', 'Caos': '#ff3399', 'Criacao': '#00ffcc', 'Destruicao': '#8b0000', 'Cosmos': '#4d0099',
    'Vida': '#33ff77', 'Morte': '#4d4d4d', 'Vazio': '#1a1a1a', 'Neutro': '#cccccc',
    'Magia de Osso': '#e6e6e6', 'Magia de Sangue': '#ff0000', 'Magia de Borracha': '#ff99cc', 'Magia de Sal': '#fdfdfd', 'Magia da Alma': '#33cccc', 'Magia de Tremor': '#cc9966', 'Magia de Gravidade': '#6600cc', 'Magia de Equipamento': '#b3b3b3', 'Magia de Tempo': '#ffd700', 'Magia Draconica': '#ff5500', 'Magia de Espelho': '#ccffff', 'Magia de Explosao': '#ff3300', 'Magia Espacial': '#000066', 'Magia de Metamorfose': '#ff66b3',
    'Magia Arcana/Negra': '#9900cc', 'Magia de Ciclo': '#00cc99',
    'Elemento Madeira': '#8b5a2b', 'Elemento Mineral': '#e6e6fa', 'Elemento Cinzas': '#808080', 'Elemento Igneo': '#ff4500', 'Elemento Lava': '#ff0000', 'Elemento Vapor': '#ffb6c1', 'Elemento Nevoa': '#b0e0e6', 'Elemento Tempestade': '#ccccff', 'Elemento Areia': '#f4a460', 'Elemento Tufao': '#98fb98',
    'Elemento Velocidade': '#e6ffff', 'Elemento Poeira': '#d9d9d9', 'Elemento Calor': '#ff6600', 'Elemento Cal': '#e6ccb3', 'Elemento Carbono': '#595959', 'Elemento Veneno': '#9933ff', 'Elemento Magnetismo': '#4169e1', 'Elemento Som': '#a6a6a6'
};

// 🔥 HIERARQUIA ELEMENTAL DINÂMICA
const CATEGORIAS_ELEMENTOS = [
    { titulo: 'Elementos Básicos', itens: ['Fogo', 'Raio', 'Agua', 'Vento', 'Terra'] },
    { titulo: 'Elementos Básicos Verdadeiros', itens: ['Fogo Verdadeiro', 'Raio Verdadeiro', 'Agua Verdadeira', 'Vento Verdadeiro', 'Terra Verdadeira'] },
    { titulo: 'Elementos Avançados', itens: ['Solar', 'Energia', 'Gelo', 'Vacuo', 'Natureza'] },
    { titulo: 'Elementos Avançados Verdadeiros', itens: ['Solar Verdadeiro', 'Energia Verdadeira', 'Gelo Verdadeiro', 'Vacuo Verdadeiro', 'Natureza Verdadeira'] },
    { titulo: 'Elementos Primordiais', itens: ['Luz', 'Trevas', 'Ether'] },
    { titulo: 'Elementos Primordiais Verdadeiros', itens: ['Celestial', 'Infernal', 'Caos'] },
    { titulo: 'Elementos Primordiais Absolutos', itens: ['Criacao', 'Destruicao', 'Cosmos'] },
    { titulo: 'Elementos Astrais', itens: ['Vida', 'Morte', 'Vazio'] },
    { titulo: 'Kekkei Genkai', itens: ['Elemento Madeira', 'Elemento Mineral', 'Elemento Cinzas', 'Elemento Igneo', 'Elemento Lava', 'Elemento Vapor', 'Elemento Nevoa', 'Elemento Tempestade', 'Elemento Areia', 'Elemento Tufao'] },
    { titulo: 'Kekkei Touta', itens: ['Elemento Velocidade', 'Elemento Poeira', 'Elemento Veneno', 'Elemento Cal', 'Elemento Carbono', 'Elemento Calor', 'Elemento Som', 'Elemento Magnetismo'] },
    { titulo: 'Neutro (Sem Elemento)', itens: ['Neutro'] }
];

// O Motor captura todas as magias que não estão na lista acima para não perder nada do seu banco de dados
const itensJáCategorizados = CATEGORIAS_ELEMENTOS.flatMap(c => c.itens);
const magiasSobressalentes = Object.keys(cores).filter(k => !itensJáCategorizados.includes(k));

if (magiasSobressalentes.length > 0) {
    CATEGORIAS_ELEMENTOS.push({ titulo: 'Magias e Elementos Extras', itens: magiasSobressalentes });
}

const BONUS_OPTIONS = [
    { value: 'nenhum', label: 'Nenhum (Apenas Elemento)' },
    { value: 'mult_dano', label: 'Mult Dano' },
    { value: 'dano_bruto', label: 'Dano Bruto' },
    { value: 'letalidade', label: 'Letalidade' },
];

export default function ElementosPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const elemEditandoId = useStore(s => s.elemEditandoId);
    const setElemEditandoId = useStore(s => s.setElemEditandoId);

    const [elemSelecionado, setElemSelecionado] = useState('Neutro');
    const [nomeElem, setNomeElem] = useState('');
    const [bonusTipo, setBonusTipo] = useState('nenhum');
    const [bonusValor, setBonusValor] = useState('');
    const [custoValor, setCustoValor] = useState(0);
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);

    const formRef = useRef(null);

    function selecionarElemento(nome) {
        setElemSelecionado(nome);
    }

    function salvarNovoElem() {
        try {
            const n = nomeElem.trim();
            if (!n) {
                alert('Falta o nome da Magia/Ataque!');
                return;
            }

            updateFicha((ficha) => {
                if (!ficha.ataquesElementais) ficha.ataquesElementais = [];

                if (elemEditandoId) {
                    const ix = ficha.ataquesElementais.findIndex(i => i.id === elemEditandoId);
                    if (ix !== -1) {
                        ficha.ataquesElementais[ix].nome = n;
                        ficha.ataquesElementais[ix].elemento = elemSelecionado;
                        ficha.ataquesElementais[ix].bonusTipo = bonusTipo;
                        ficha.ataquesElementais[ix].bonusValor = bonusValor;
                        ficha.ataquesElementais[ix].custoValor = parseFloat(custoValor) || 0;
                        ficha.ataquesElementais[ix].dadosExtraQtd = parseInt(dadosQtd) || 0;
                        ficha.ataquesElementais[ix].dadosExtraFaces = parseInt(dadosFaces) || 20;
                    }
                } else {
                    ficha.ataquesElementais.push({
                        id: Date.now(),
                        nome: n,
                        elemento: elemSelecionado,
                        bonusTipo: bonusTipo,
                        bonusValor: bonusValor,
                        custoValor: parseFloat(custoValor) || 0,
                        dadosExtraQtd: parseInt(dadosQtd) || 0,
                        dadosExtraFaces: parseInt(dadosFaces) || 20,
                        equipado: false
                    });
                }
            });

            cancelarEdicaoElem();
            setNomeElem('');
            salvarFichaSilencioso();
        } catch (e) {
            console.error(e);
        }
    }

    function editarElem(id) {
        const p = (minhaFicha.ataquesElementais || []).find(i => i.id === id);
        if (!p) return;
        if (p.equipado) {
            toggleEquiparElem(id);
            alert(`O ataque [${p.nome}] foi DESATIVADO para edicao.`);
        }

        setElemEditandoId(p.id);
        setNomeElem(p.nome);
        setElemSelecionado(p.elemento || 'Neutro');
        setBonusTipo(p.bonusTipo || 'nenhum');
        setBonusValor(p.bonusValor || '');
        setCustoValor(p.custoValor || 0);
        setDadosQtd(p.dadosExtraQtd || 0);
        setDadosFaces(p.dadosExtraFaces || 20);

        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    function cancelarEdicaoElem() {
        setElemEditandoId(null);
        setNomeElem('');
        setElemSelecionado('Neutro');
    }

    function toggleEquiparElem(id) {
        updateFicha((ficha) => {
            if (!ficha.ataquesElementais) return;
            const itemIndex = ficha.ataquesElementais.findIndex(i => i.id === id);
            if (itemIndex === -1) return;
            ficha.ataquesElementais[itemIndex].equipado = !ficha.ataquesElementais[itemIndex].equipado;
        });
        salvarFichaSilencioso();
    }

    function deletarElem(id) {
        if (!confirm('Deseja apagar este ataque elemental do grimorio?')) return;
        updateFicha((ficha) => {
            ficha.ataquesElementais = (ficha.ataquesElementais || []).filter(i => i.id !== id);
        });
        salvarFichaSilencioso();
    }

    const ataquesElementais = minhaFicha.ataquesElementais || [];

    const magiasDoGrupo = useMemo(() =>
        ataquesElementais.filter(e => (e.elemento || 'Neutro') === elemSelecionado),
        [ataquesElementais, elemSelecionado]
    );

    const magiasConjuradasOutros = useMemo(() =>
        ataquesElementais.filter(e => e.equipado && (e.elemento || 'Neutro') !== elemSelecionado),
        [ataquesElementais, elemSelecionado]
    );

    function renderMagiaCard(p) {
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
        const isMult = bTipo.includes('mult_');
        const prefixo = isMult ? 'x' : '+';
        const propText = bTipo === 'nenhum' ? 'Apenas Elemento' : bTipo.replace('_', ' ').toUpperCase();
        const bValorStr = bTipo === 'nenhum' ? '' : `: ${prefixo}${p.bonusValor || 0}`;
        const dadosStr = p.dadosExtraQtd > 0 ? ` | Dados: +${p.dadosExtraQtd}d${p.dadosExtraFaces || 20}` : '';
        const custoStr = p.custoValor > 0 ? ` | Custo: ${p.custoValor}%` : '';

        return (
            <div key={p.id} className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginTop: 15, padding: 15, transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                    <div>
                        <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                            {emogis[elemText] || '\u2728'} {p.nome || 'Ataque'}
                        </h3>
                        <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                            Afinidade: <strong>{elemText.toUpperCase()}</strong> | Bonus: {propText}{bValorStr}{dadosStr}{custoStr}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            className="btn-neon"
                            style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }}
                            onClick={() => toggleEquiparElem(p.id)}
                        >
                            {isEquipped ? 'CONJURADO' : 'GUARDADO'}
                        </button>
                        <button
                            className="btn-neon btn-blue"
                            style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                            onClick={() => editarElem(p.id)}
                        >
                            EDITAR
                        </button>
                        <button
                            className="btn-neon btn-red"
                            style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                            onClick={() => deletarElem(p.id)}
                        >
                            APAGAR
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="elementos-panel">
            {/* Element badge selector HIERÁRQUICO */}
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
                                        key={elem}
                                        className="badge-elem"
                                        data-elem={elem}
                                        data-color={cor}
                                        onClick={() => selecionarElemento(elem)}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '0.75em',
                                            border: `1px solid ${isActive ? cor : '#444'}`,
                                            borderRadius: 4,
                                            background: 'transparent',
                                            color: isActive ? cor : '#aaa',
                                            cursor: 'pointer',
                                            boxShadow: isActive ? `inset 0 0 10px ${cor}` : 'none'
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

            {/* Form */}
            <div className="def-box" ref={formRef} id="form-elem-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#0ff', marginBottom: 10 }} id="titulo-elem-form">
                    {elemEditandoId ? `Editando: ${nomeElem}` : 'Criar Ataque Elemental'}
                </h3>

                <input
                    className="input-neon"
                    type="text"
                    placeholder="Nome da Magia/Ataque"
                    value={nomeElem}
                    onChange={e => setNomeElem(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo Bonus</label>
                        <select className="input-neon" value={bonusTipo} onChange={e => setBonusTipo(e.target.value)}>
                            {BONUS_OPTIONS.map(b => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Valor Bonus</label>
                        <input className="input-neon" type="text" value={bonusValor} onChange={e => setBonusValor(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Custo % Energia</label>
                        <input className="input-neon" type="number" value={custoValor} onChange={e => setCustoValor(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Extra Qtd</label>
                        <input className="input-neon" type="number" value={dadosQtd} onChange={e => setDadosQtd(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Extra Faces</label>
                        <input className="input-neon" type="number" value={dadosFaces} onChange={e => setDadosFaces(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="btn-neon btn-gold" onClick={salvarNovoElem} style={{ flex: 1 }}>
                        {elemEditandoId ? 'Salvar Edicao' : 'Criar Ataque'}
                    </button>
                    {elemEditandoId && (
                        <button className="btn-neon btn-red" onClick={cancelarEdicaoElem} style={{ flex: 1 }}>
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Filtered list */}
            <div id="lista-elementos-salvos" style={{ marginTop: 15 }}>
                {magiasDoGrupo.length > 0 ? (
                    <>
                        <h3 style={{
                            color: cores[elemSelecionado] || '#ccc',
                            marginTop: 10,
                            borderBottom: `1px solid ${cores[elemSelecionado] || '#ccc'}`,
                            paddingBottom: 5,
                            textTransform: 'uppercase'
                        }}>
                            {emogis[elemSelecionado] || '\u2728'} Magias de {elemSelecionado}
                        </h3>
                        {magiasDoGrupo.map(p => renderMagiaCard(p))}
                    </>
                ) : (
                    <p style={{ color: '#888', fontStyle: 'italic', marginTop: 20 }}>
                        Nenhuma magia de <strong>{elemSelecionado}</strong> forjada.
                    </p>
                )}

                {magiasConjuradasOutros.length > 0 && (
                    <>
                        <h3 style={{
                            color: '#ffcc00', marginTop: 40,
                            borderBottom: '1px solid #ffcc00', paddingBottom: 5,
                            textTransform: 'uppercase', textShadow: '0 0 10px #ffcc00'
                        }}>
                            Outras Magias Ativas (Conjuradas)
                        </h3>
                        {magiasConjuradasOutros.map(p => renderMagiaCard(p))}
                    </>
                )}
            </div>
        </div>
    );
}