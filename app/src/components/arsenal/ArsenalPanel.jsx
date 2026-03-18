import React, { useState, useRef } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

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

    const [nomeItem, setNomeItem] = useState('');
    const [tipoItem, setTipoItem] = useState('arma');
    const [bonusTipo, setBonusTipo] = useState('mult_dano');
    const [bonusValor, setBonusValor] = useState('');

    const formRef = useRef(null);

    function salvarNovoItem() {
        const n = nomeItem.trim();
        if (!n) {
            alert('Falta o nome do Equipamento!');
            return;
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
                }
            } else {
                ficha.inventario.push({
                    id: Date.now(),
                    nome: n,
                    tipo: tipoItem,
                    elemento: 'Neutro',
                    bonusTipo: bonusTipo,
                    bonusValor: bonusValor,
                    equipado: false
                });
            }
        });

        cancelarEdicaoItem();
        setNomeItem('');
        setBonusValor('');
        salvarFichaSilencioso();
    }

    function editarItem(id) {
        const p = (minhaFicha.inventario || []).find(i => i.id === id);
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
        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    function cancelarEdicaoItem() {
        setItemEditandoId(null);
        setNomeItem('');
    }

    function toggleEquiparItem(id) {
        updateFicha((ficha) => {
            if (!ficha.inventario) return;
            const itemIndex = ficha.inventario.findIndex(i => i.id === id);
            if (itemIndex === -1) return;

            const itemToEquip = ficha.inventario[itemIndex];
            // Mutual exclusion: only 1 weapon, 1 armor
            if (!itemToEquip.equipado && (itemToEquip.tipo === 'arma' || itemToEquip.tipo === 'armadura')) {
                ficha.inventario.forEach(i => {
                    if (i.tipo === itemToEquip.tipo && i.equipado) i.equipado = false;
                });
            }
            ficha.inventario[itemIndex].equipado = !ficha.inventario[itemIndex].equipado;
        });
        salvarFichaSilencioso();
    }

    function deletarItem(id) {
        if (!confirm('Deseja destruir este equipamento permanentemente?')) return;
        updateFicha((ficha) => {
            ficha.inventario = (ficha.inventario || []).filter(i => i.id !== id);
        });
        salvarFichaSilencioso();
    }

    const inventario = minhaFicha.inventario || [];

    return (
        <div className="arsenal-panel">
            {/* Form */}
            <div className="def-box" ref={formRef} id="form-item-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }} id="titulo-item-form">
                    {itemEditandoId ? `Editando: ${nomeItem}` : 'Forjar Novo Equipamento'}
                </h3>

                <input
                    className="input-neon"
                    type="text"
                    placeholder="Nome do Equipamento"
                    value={nomeItem}
                    onChange={e => setNomeItem(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo</label>
                        <select className="input-neon" value={tipoItem} onChange={e => setTipoItem(e.target.value)}>
                            <option value="arma">Arma</option>
                            <option value="armadura">Armadura</option>
                            <option value="artefato">Artefato</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bonus</label>
                        <select className="input-neon" value={bonusTipo} onChange={e => setBonusTipo(e.target.value)}>
                            {BONUS_OPTIONS.map(b => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Valor</label>
                        <input className="input-neon" type="text" value={bonusValor} onChange={e => setBonusValor(e.target.value)} />
                    </div>
                </div>

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

            {/* Items list */}
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
                                            Classe: {(p.tipo || '').toUpperCase()}
                                        </p>
                                        <p style={{ color: '#0ff', fontSize: '0.9em', margin: '5px 0 0' }}>
                                            {propText}: <strong style={{ color: '#ffcc00' }}>{prefixo}{p.bonusValor || 0}</strong>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            className="btn-neon"
                                            style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }}
                                            onClick={() => toggleEquiparItem(p.id)}
                                        >
                                            {isEquipped ? 'EQUIPADO' : 'GUARDADO'}
                                        </button>
                                        <button
                                            className="btn-neon btn-blue"
                                            style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                                            onClick={() => editarItem(p.id)}
                                        >
                                            EDITAR
                                        </button>
                                        <button
                                            className="btn-neon btn-red"
                                            style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                                            onClick={() => deletarItem(p.id)}
                                        >
                                            APAGAR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
