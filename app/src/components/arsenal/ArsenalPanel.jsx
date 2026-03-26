import React, { useState, useRef } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso } from '../../services/firebase-sync';
import { ATRIBUTOS_AGRUPADOS, PROPRIEDADE_OPTIONS } from '../../core/efeitos-constants';
import FormasEditor from '../shared/FormasEditor';

const ARMA_TIPOS = ['espada', 'arco', 'lança', 'machado', 'adaga', 'cajado', 'arma de fogo', 'manopla', 'foice', 'chicote', 'martelo', 'escudo'];
const RARIDADES = ['comum', 'rara', 'avançada', 'lendaria', 'lendaria (Longuinus)', 'espiritual', 'fantasma nobre'];

const BONUS_OPTIONS = [
    { value: 'mult_dano', label: 'Mult Dano' },
    { value: 'dano_bruto', label: 'Dano Bruto' },
    { value: 'letalidade', label: 'Letalidade' },
    { value: 'bonus_acerto', label: 'Bonus Acerto' },
    { value: 'bonus_evasiva', label: 'Bonus Evasiva' },
    { value: 'bonus_resistencia', label: 'Bonus Resistencia' },
    { value: 'mult_escudo', label: 'Mult Escudo' },
];

export default function ArsenalPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const itemEditandoId = useStore(s => s.itemEditandoId);
    const setItemEditandoId = useStore(s => s.setItemEditandoId);
    const efeitosTempArsenal = useStore(s => s.efeitosTempArsenal);
    const setEfeitosTempArsenal = useStore(s => s.setEfeitosTempArsenal);
    const efeitosTempPassivosArsenal = useStore(s => s.efeitosTempPassivosArsenal);
    const setEfeitosTempPassivosArsenal = useStore(s => s.setEfeitosTempPassivosArsenal);

    const [nomeItem, setNomeItem] = useState('');
    const [tipoItem, setTipoItem] = useState('arma');
    const [bonusTipo, setBonusTipo] = useState('mult_dano');
    const [bonusValor, setBonusValor] = useState('');
    const [armaDadosQtd, setArmaDadosQtd] = useState(1);
    const [armaDadosFaces, setArmaDadosFaces] = useState(20);
    const [armaTipo, setArmaTipo] = useState('espada');
    const [raridade, setRaridade] = useState('comum');

    const [nomeEfeito, setNomeEfeito] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');
    const [nomeEfeitoPassivo, setNomeEfeitoPassivo] = useState('');
    const [novoAtrPassivo, setNovoAtrPassivo] = useState('forca');
    const [novoPropPassivo, setNovoPropPassivo] = useState('base');
    const [novoValPassivo, setNovoValPassivo] = useState('');

    const formRef = useRef(null);

    const addEfeitoTemp = () => {
        if (!novoVal || !nomeEfeito.trim()) { alert('Preencha o nome e o valor do efeito!'); return; }
        setEfeitosTempArsenal([...efeitosTempArsenal, { nome: nomeEfeito.trim(), atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
        setNomeEfeito('');
    };

    const removerEfeitoTemp = (index) => setEfeitosTempArsenal(efeitosTempArsenal.filter((_, i) => i !== index));

    const addEfeitoPassivoTemp = () => {
        if (!novoValPassivo || !nomeEfeitoPassivo.trim()) { alert('Preencha o nome e o valor do efeito passivo!'); return; }
        setEfeitosTempPassivosArsenal([...efeitosTempPassivosArsenal, { nome: nomeEfeitoPassivo.trim(), atributo: novoAtrPassivo, propriedade: novoPropPassivo, valor: novoValPassivo }]);
        setNovoValPassivo('');
        setNomeEfeitoPassivo('');
    };

    const removerEfeitoPassivoTemp = (index) => setEfeitosTempPassivosArsenal(efeitosTempPassivosArsenal.filter((_, i) => i !== index));

    function salvarNovoItem() {
        const n = nomeItem.trim();
        if (!n) { alert('Falta o nome do Equipamento!'); return; }

        const inventarioAtual = minhaFicha?.inventario || [];
        let deveLimparEfeitos = true;
        if (itemEditandoId && tipoItem !== 'arma') {
            const itemExistente = inventarioAtual.find(i => i.id === itemEditandoId);
            if (itemExistente) {
                const tinhaEfeitos = (itemExistente.efeitos || []).length > 0 || (itemExistente.efeitosPassivos || []).length > 0;
                if (tinhaEfeitos && !window.confirm('Este item tinha efeitos de arma. Mudar o tipo vai remover todos os efeitos. Continuar?')) {
                    deveLimparEfeitos = false;
                }
            }
        }

        updateFicha((ficha) => {
            if (!ficha.inventario) ficha.inventario = [];

            if (itemEditandoId) {
                const ix = ficha.inventario.findIndex(i => i.id === itemEditandoId);
                if (ix !== -1) {
                    ficha.inventario[ix].nome = n;
                    ficha.inventario[ix].tipo = tipoItem;
                    ficha.inventario[ix].elemento = 'Neutro';
                    ficha.inventario[ix].bonusTipo = bonusTipo;
                    ficha.inventario[ix].bonusValor = bonusValor;
                    ficha.inventario[ix].armaTipo = tipoItem === 'arma' ? armaTipo : '';
                    ficha.inventario[ix].raridade = raridade;
                    if (tipoItem === 'arma') {
                        ficha.inventario[ix].dadosQtd = parseInt(armaDadosQtd) || 1;
                        ficha.inventario[ix].dadosFaces = parseInt(armaDadosFaces) || 20;
                        ficha.inventario[ix].efeitos = JSON.parse(JSON.stringify(efeitosTempArsenal));
                        ficha.inventario[ix].efeitosPassivos = JSON.parse(JSON.stringify(efeitosTempPassivosArsenal));
                    } else if (deveLimparEfeitos) {
                        ficha.inventario[ix].efeitos = [];
                        ficha.inventario[ix].efeitosPassivos = [];
                    }
                }
            } else {
                ficha.inventario.push({
                    id: Date.now(),
                    nome: n,
                    tipo: tipoItem,
                    elemento: 'Neutro',
                    bonusTipo: bonusTipo,
                    bonusValor: bonusValor,
                    armaTipo: tipoItem === 'arma' ? armaTipo : '',
                    raridade: raridade,
                    dadosQtd: tipoItem === 'arma' ? (parseInt(armaDadosQtd) || 1) : 0,
                    dadosFaces: tipoItem === 'arma' ? (parseInt(armaDadosFaces) || 20) : 0,
                    efeitos: tipoItem === 'arma' ? JSON.parse(JSON.stringify(efeitosTempArsenal)) : [],
                    efeitosPassivos: tipoItem === 'arma' ? JSON.parse(JSON.stringify(efeitosTempPassivosArsenal)) : [],
                    equipado: false
                });
            }
        });

        cancelarEdicaoItem();
        salvarFichaSilencioso();
    }

    function editarItem(id) {
        const p = (minhaFicha?.inventario || []).find(i => i.id === id);
        if (!p) return;
        if (p.equipado) {
            toggleEquiparItem(id);
            alert(`O item [${p.nome}] foi DESEQUIPADO para edicao.`);
        }

        setItemEditandoId(p.id);
        setNomeItem(p.nome);
        setTipoItem(p.tipo);
        setBonusTipo(p.bonusTipo);
        setBonusValor(p.bonusValor);
        setArmaDadosQtd(p.dadosQtd || 1);
        setArmaDadosFaces(p.dadosFaces || 20);
        setArmaTipo(p.armaTipo || 'espada');
        setRaridade(p.raridade || 'comum');
        setEfeitosTempArsenal(JSON.parse(JSON.stringify(p.efeitos || [])));
        setEfeitosTempPassivosArsenal(JSON.parse(JSON.stringify(p.efeitosPassivos || [])));
        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    function cancelarEdicaoItem() {
        setItemEditandoId(null);
        setNomeItem('');
        setTipoItem('arma');
        setBonusTipo('mult_dano');
        setBonusValor('');
        setArmaDadosQtd(1);
        setArmaDadosFaces(20);
        setArmaTipo('espada');
        setRaridade('comum');
        setEfeitosTempArsenal([]);
        setEfeitosTempPassivosArsenal([]);
    }

    function toggleEquiparItem(id) {
        updateFicha((ficha) => {
            if (!ficha.inventario) return;
            const itemIndex = ficha.inventario.findIndex(i => i.id === id);
            if (itemIndex === -1) return;

            const itemToEquip = ficha.inventario[itemIndex];
            if (!itemToEquip.equipado && (itemToEquip.tipo === 'arma' || itemToEquip.tipo === 'armadura')) {
                ficha.inventario.forEach(i => {
                    if (i.tipo === itemToEquip.tipo && i.equipado) i.equipado = false;
                });
            }
            ficha.inventario[itemIndex].equipado = !ficha.inventario[itemIndex].equipado;
            
            // 🔥 Reset da Foma ao desequipar!
            if (!ficha.inventario[itemIndex].equipado) {
                ficha.inventario[itemIndex].formaAtivaId = null;
                ficha.inventario[itemIndex].configAtivaId = null;
            }
        });
        salvarFichaSilencioso();
    }

    function deletarItem(id) {
        if (!window.confirm('Deseja destruir este equipamento permanentemente?')) return;
        updateFicha((ficha) => {
            ficha.inventario = (ficha.inventario || []).filter(i => i.id !== id);
        });
        salvarFichaSilencioso();
    }

    const salvarFormaItem = (itemId, forma) => {
        updateFicha((ficha) => {
            const item = (ficha.inventario || []).find(i => i.id === itemId);
            if (!item) return;
            if (!item.formas) item.formas = [];
            const ix = item.formas.findIndex(f => f.id === forma.id);
            if (ix !== -1) {
                item.formas[ix] = forma;
            } else {
                item.formas.push(forma);
            }
        });
        salvarFichaSilencioso();
    };

    const deletarFormaItem = (itemId, formaId) => {
        updateFicha((ficha) => {
            const item = (ficha.inventario || []).find(i => i.id === itemId);
            if (!item) return;
            item.formas = (item.formas || []).filter(f => f.id !== formaId);
            if (item.formaAtivaId === formaId) {
                item.formaAtivaId = null;
                item.configAtivaId = null;
            }
        });
        salvarFichaSilencioso();
    };

    // 🔥 GRAVA A FORMA E A CONFIG (PECADO) ATIVA 🔥
    const ativarFormaItem = (itemId, formaId, configId = null) => {
        const vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
        updateFicha((ficha) => {
            const item = (ficha.inventario || []).find(i => i.id === itemId);
            if (!item) return;
            const oldM = {};
            vitais.forEach(v => { oldM[v] = getMaximo(ficha, v) || 1; });
            
            item.formaAtivaId = formaId;
            item.configAtivaId = configId; 
            
            vitais.forEach(k => {
                const nMax = getMaximo(ficha, k) || 1;
                let atu = parseFloat(ficha[k].atual);
                if (isNaN(atu)) atu = nMax;
                ficha[k].atual = Math.floor(atu * (nMax / oldM[k]));
                if (isNaN(ficha[k].atual) || ficha[k].atual < 0 || ficha[k].atual > nMax) ficha[k].atual = nMax;
            });
        });
        salvarFichaSilencioso();
    };

    const inventario = minhaFicha.inventario || [];

    return (
        <div className="arsenal-panel">
            {/* Form */}
            <div className="def-box" ref={formRef} id="form-item-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }} id="titulo-item-form">
                    {itemEditandoId ? `Editando: ${nomeItem}` : 'Forjar Novo Equipamento'}
                </h3>

                <input className="input-neon" type="text" placeholder="Nome do Equipamento" value={nomeItem} onChange={e => setNomeItem(e.target.value)} />

                <div style={{ display: 'grid', gridTemplateColumns: tipoItem === 'arma' ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo</label>
                        <select className="input-neon" value={tipoItem} onChange={e => setTipoItem(e.target.value)}>
                            <option value="arma">Arma</option>
                            <option value="armadura">Armadura</option>
                            <option value="artefato">Artefato</option>
                        </select>
                    </div>
                    {tipoItem === 'arma' && (
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Arma</label>
                            <select className="input-neon" value={armaTipo} onChange={e => setArmaTipo(e.target.value)}>
                                {ARMA_TIPOS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Raridade</label>
                        <select className="input-neon" value={raridade} onChange={e => setRaridade(e.target.value)}>
                            {RARIDADES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bonus</label>
                        <select className="input-neon" value={bonusTipo} onChange={e => setBonusTipo(e.target.value)}>
                            {BONUS_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Valor</label>
                        <input className="input-neon" type="text" value={bonusValor} onChange={e => setBonusValor(e.target.value)} />
                    </div>
                </div>

                {tipoItem === 'arma' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados de Dano (qtd)</label>
                            <input className="input-neon" type="number" min="1" value={armaDadosQtd} onChange={e => setArmaDadosQtd(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                            <input className="input-neon" type="number" min="1" value={armaDadosFaces} onChange={e => setArmaDadosFaces(e.target.value)} />
                        </div>
                    </div>
                )}
                {tipoItem === 'arma' && <p style={{ color: '#0f0', fontSize: '0.85em', margin: '5px 0 0' }}>Dano da Arma: {armaDadosQtd}d{armaDadosFaces}</p>}

                {tipoItem === 'arma' && (
                    <>
                        <input className="input-neon" type="text" placeholder="Nome do Efeito" value={nomeEfeito} onChange={e => setNomeEfeito(e.target.value)} style={{ marginTop: 10 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 5 }}>
                            <select className="input-neon" value={novoAtr} onChange={e => setNovoAtr(e.target.value)}>
                                {ATRIBUTOS_AGRUPADOS.map(grupo => (
                                    <optgroup key={grupo.label} label={grupo.label} style={{ background: '#051010', color: '#0ff' }}>
                                        {grupo.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                            <select className="input-neon" value={novoProp} onChange={e => setNovoProp(e.target.value)}>
                                {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <input className="input-neon" type="text" placeholder="Valor" value={novoVal} onChange={e => setNovoVal(e.target.value)} />
                            <button className="btn-neon btn-blue" onClick={addEfeitoTemp} style={{ padding: '5px 10px' }}>+ Efeito</button>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            {efeitosTempArsenal.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9em', margin: 0 }}>Nenhum efeito adicionado.</p>
                            ) : (
                                efeitosTempArsenal.map((e, i) => {
                                    const prop = (e.propriedade || '').toLowerCase();
                                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes(prop);
                                    return (
                                        <div key={i} style={{ color: '#0ff', fontSize: '0.9em', marginBottom: 5, background: 'rgba(0,255,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #0ff', display: 'flex', justifyContent: 'space-between' }}>
                                            <span><strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                            <button onClick={() => removerEfeitoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <h4 style={{ color: '#f0f', marginTop: 15, marginBottom: 8, fontSize: '0.95em' }}>Efeitos Passivos (sempre ativos)</h4>
                        <input className="input-neon" type="text" placeholder="Nome do Efeito Passivo" value={nomeEfeitoPassivo} onChange={e => setNomeEfeitoPassivo(e.target.value)} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 5 }}>
                            <select className="input-neon" value={novoAtrPassivo} onChange={e => setNovoAtrPassivo(e.target.value)}>
                                {ATRIBUTOS_AGRUPADOS.map(grupo => (
                                    <optgroup key={grupo.label} label={grupo.label} style={{ background: '#051010', color: '#f0f' }}>
                                        {grupo.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                            <select className="input-neon" value={novoPropPassivo} onChange={e => setNovoPropPassivo(e.target.value)}>
                                {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <input className="input-neon" type="text" placeholder="Valor" value={novoValPassivo} onChange={e => setNovoValPassivo(e.target.value)} />
                            <button className="btn-neon" style={{ padding: '5px 10px', borderColor: '#f0f', color: '#f0f' }} onClick={addEfeitoPassivoTemp}>+ Passivo</button>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            {efeitosTempPassivosArsenal.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9em', margin: 0 }}>Nenhum efeito passivo adicionado.</p>
                            ) : (
                                efeitosTempPassivosArsenal.map((e, i) => {
                                    const prop = (e.propriedade || '').toLowerCase();
                                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes(prop);
                                    return (
                                        <div key={i} style={{ color: '#f0f', fontSize: '0.9em', marginBottom: 5, background: 'rgba(255,0,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #f0f', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>PASSIVO: <strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                            <button onClick={() => removerEfeitoPassivoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="btn-neon btn-gold" onClick={salvarNovoItem} style={{ flex: 1 }}>
                        {itemEditandoId ? 'Salvar Edicao' : 'Forjar Equipamento'}
                    </button>
                    {itemEditandoId && (
                        <button className="btn-neon btn-red" onClick={cancelarEdicaoItem} style={{ flex: 1 }}>
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div id="lista-inventario-salvos" style={{ marginTop: 15 }}>
                {inventario.length === 0 ? (
                    <p style={{ color: '#888' }}>Nenhum equipamento na sua forja.</p>
                ) : (
                    inventario.map((p) => {
                        if (!p) return null;
                        const isEquipped = p.equipado;
                        const c = isEquipped ? '#ffcc00' : '#888';
                        const bg = isEquipped ? 'rgba(255,204,0,0.1)' : 'rgba(0,0,0,0.4)';
                        const icon = p.tipo === 'arma' ? '\u2694\uFE0F' : p.tipo === 'armadura' ? '\uD83D\uDEE1\uFE0F' : '\uD83D\uDD2E';

                        const bTipo = p.bonusTipo || '';
                        const isMult = bTipo.includes('mult_');
                        const prefixo = isMult ? 'x' : '+';
                        const propText = bTipo.replace('_', ' ').toUpperCase();

                        return (
                            <div key={p.id} className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                                            {icon} {p.nome || 'Item'}
                                        </h3>
                                        <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0' }}>
                                            {(p.tipo || '').toUpperCase()}{p.armaTipo ? ` (${p.armaTipo.charAt(0).toUpperCase() + p.armaTipo.slice(1)})` : ''}{p.raridade ? ` | ${p.raridade.charAt(0).toUpperCase() + p.raridade.slice(1)}` : ''}{p.tipo === 'arma' && p.dadosQtd ? ` | Dano: ${p.dadosQtd}d${p.dadosFaces || 20}` : ''}
                                        </p>
                                        <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                                            {propText}: <strong style={{ color: '#ffcc00' }}>{prefixo}{p.bonusValor || 0}</strong>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }} onClick={() => toggleEquiparItem(p.id)}>
                                            {isEquipped ? 'EQUIPADO' : 'GUARDADO'}
                                        </button>
                                        <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => editarItem(p.id)}>EDITAR</button>
                                        <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => deletarItem(p.id)}>APAGAR</button>
                                    </div>
                                </div>
                                {p.tipo === 'arma' && (
                                    <FormasEditor
                                        itemRaridade={p.raridade}
                                        formas={p.formas || []}
                                        formaAtivaId={p.formaAtivaId || null}
                                        configAtivaId={p.configAtivaId || null}
                                        onSalvarForma={(forma) => salvarFormaItem(p.id, forma)}
                                        onDeletarForma={(formaId) => deletarFormaItem(p.id, formaId)}
                                        onAtivarForma={(formaId, configId) => ativarFormaItem(p.id, formaId, configId)}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}