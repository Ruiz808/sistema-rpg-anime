import React, { useState } from 'react';
import { ATRIBUTOS_AGRUPADOS, PROPRIEDADE_OPTIONS } from '../../core/efeitos-constants';

export default function FormasEditor({ formas, formaAtivaId, onSalvarForma, onDeletarForma, onAtivarForma }) {
    const [efeitosTempForma, setEfeitosTempForma] = useState([]);
    const [efeitosTempPassivosForma, setEfeitosTempPassivosForma] = useState([]);
    const [formaEditandoId, setFormaEditandoId] = useState(null);

    const [nomeForma, setNomeForma] = useState('');
    const [acumulaFormaBase, setAcumulaFormaBase] = useState(true);
    const [aberto, setAberto] = useState(false);

    const [nomeEfeito, setNomeEfeito] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');

    const [nomeEfeitoPassivo, setNomeEfeitoPassivo] = useState('');
    const [novoAtrP, setNovoAtrP] = useState('forca');
    const [novoPropP, setNovoPropP] = useState('base');
    const [novoValP, setNovoValP] = useState('');

    const listaFormas = formas || [];

    const addEfeito = () => {
        if (!novoVal || !nomeEfeito.trim()) { alert('Preencha o nome e o valor do efeito!'); return; }
        setEfeitosTempForma([...efeitosTempForma, { nome: nomeEfeito.trim(), atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
        setNomeEfeito('');
    };

    const addEfeitoPassivo = () => {
        if (!novoValP || !nomeEfeitoPassivo.trim()) { alert('Preencha o nome e o valor!'); return; }
        setEfeitosTempPassivosForma([...efeitosTempPassivosForma, { nome: nomeEfeitoPassivo.trim(), atributo: novoAtrP, propriedade: novoPropP, valor: novoValP }]);
        setNovoValP('');
        setNomeEfeitoPassivo('');
    };

    const editarForma = (forma) => {
        setFormaEditandoId(forma.id);
        setNomeForma(forma.nome);
        setAcumulaFormaBase(forma.acumulaFormaBase !== false);
        setEfeitosTempForma(JSON.parse(JSON.stringify(forma.efeitos || [])));
        setEfeitosTempPassivosForma(JSON.parse(JSON.stringify(forma.efeitosPassivos || [])));
        setAberto(true);
    };

    const cancelarEdicao = () => {
        setFormaEditandoId(null);
        setNomeForma('');
        setAcumulaFormaBase(true);
        setEfeitosTempForma([]);
        setEfeitosTempPassivosForma([]);
    };

    const salvar = () => {
        if (!nomeForma.trim()) { alert('Preencha o nome da forma!'); return; }
        onSalvarForma({
            id: formaEditandoId || Date.now(),
            nome: nomeForma.trim(),
            acumulaFormaBase,
            efeitos: JSON.parse(JSON.stringify(efeitosTempForma)),
            efeitosPassivos: JSON.parse(JSON.stringify(efeitosTempPassivosForma))
        });
        cancelarEdicao();
    };

    const renderEfeitoRow = (e, i, isPassivo) => {
        const prop = (e.propriedade || '').toLowerCase();
        const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes(prop);
        const cor = isPassivo ? '#f0f' : '#0ff';
        const bg = isPassivo ? 'rgba(255,0,255,0.1)' : 'rgba(0,255,255,0.1)';
        return (
            <div key={i} style={{ color: cor, fontSize: '0.85em', marginBottom: 4, background: bg, padding: '4px 8px', borderLeft: `2px solid ${cor}`, display: 'flex', justifyContent: 'space-between' }}>
                <span>{isPassivo ? 'PASSIVO: ' : ''}<strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] {(e.propriedade || '').toUpperCase()}: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                <button onClick={() => isPassivo ? setEfeitosTempPassivosForma(efeitosTempPassivosForma.filter((_, j) => j !== i)) : setEfeitosTempForma(efeitosTempForma.filter((_, j) => j !== i))} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer', fontSize: '0.85em' }}>X</button>
            </div>
        );
    };

    return (
        <div style={{ marginTop: 10 }}>
            <button className="btn-neon" onClick={() => setAberto(!aberto)} style={{ padding: '4px 12px', fontSize: '0.85em', margin: 0, borderColor: '#ff8800', color: '#ff8800' }}>
                {aberto ? '▼' : '▶'} FORMAS ({listaFormas.length})
            </button>

            {aberto && (
                <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,136,0,0.05)', borderLeft: '3px solid #ff8800', borderRadius: 4 }}>
                    {listaFormas.map(f => {
                        const isAtiva = formaAtivaId === f.id;
                        return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '5px 8px', background: isAtiva ? 'rgba(255,136,0,0.15)' : 'rgba(0,0,0,0.3)', borderRadius: 4, borderLeft: isAtiva ? '3px solid #ff8800' : '3px solid #555' }}>
                                <div>
                                    <strong style={{ color: isAtiva ? '#ff8800' : '#aaa' }}>{f.nome}</strong>
                                    <span style={{ color: '#666', fontSize: '0.8em', marginLeft: 8 }}>{f.acumulaFormaBase !== false ? '(acumula)' : '(substitui)'}</span>
                                    <span style={{ color: '#555', fontSize: '0.8em', marginLeft: 8 }}>{(f.efeitos || []).length + (f.efeitosPassivos || []).length} efeitos</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn-neon" style={{ padding: '3px 8px', fontSize: '0.8em', margin: 0, borderColor: isAtiva ? '#ff8800' : '#555', color: isAtiva ? '#ff8800' : '#aaa' }} onClick={() => onAtivarForma(isAtiva ? null : f.id)}>
                                        {isAtiva ? 'ATIVA' : 'ATIVAR'}
                                    </button>
                                    <button className="btn-neon btn-blue" style={{ padding: '3px 8px', fontSize: '0.8em', margin: 0 }} onClick={() => editarForma(f)}>EDITAR</button>
                                    <button className="btn-neon btn-red" style={{ padding: '3px 8px', fontSize: '0.8em', margin: 0 }} onClick={() => onDeletarForma(f.id)}>X</button>
                                </div>
                            </div>
                        );
                    })}

                    <div style={{ marginTop: 10, padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                        <h5 style={{ color: '#ff8800', margin: '0 0 8px 0', fontSize: '0.9em' }}>{formaEditandoId ? `Editando: ${nomeForma}` : 'Nova Forma'}</h5>
                        <input className="input-neon" type="text" placeholder="Nome da Forma" value={nomeForma} onChange={e => setNomeForma(e.target.value)} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, color: '#aaa', fontSize: '0.85em', cursor: 'pointer' }}>
                            <input type="checkbox" checked={acumulaFormaBase} onChange={e => setAcumulaFormaBase(e.target.checked)} />
                            Acumula com efeitos base
                        </label>

                        <h6 style={{ color: '#0ff', margin: '10px 0 5px', fontSize: '0.85em' }}>Efeitos Ativos</h6>
                        <input className="input-neon" type="text" placeholder="Nome do Efeito" value={nomeEfeito} onChange={e => setNomeEfeito(e.target.value)} style={{ fontSize: '0.85em' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginTop: 4 }}>
                            <select className="input-neon" value={novoAtr} onChange={e => setNovoAtr(e.target.value)} style={{ fontSize: '0.85em' }}>
                                {ATRIBUTOS_AGRUPADOS.map(g => (
                                    <optgroup key={g.label} label={g.label} style={{ background: '#051010', color: '#0ff' }}>
                                        {g.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                            <select className="input-neon" value={novoProp} onChange={e => setNovoProp(e.target.value)} style={{ fontSize: '0.85em' }}>
                                {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <input className="input-neon" type="text" placeholder="Valor" value={novoVal} onChange={e => setNovoVal(e.target.value)} style={{ fontSize: '0.85em' }} />
                            <button className="btn-neon btn-blue" onClick={addEfeito} style={{ padding: '3px 8px', fontSize: '0.8em' }}>+</button>
                        </div>
                        {efeitosTempForma.map((e, i) => renderEfeitoRow(e, i, false))}

                        <h6 style={{ color: '#f0f', margin: '10px 0 5px', fontSize: '0.85em' }}>Efeitos Passivos</h6>
                        <input className="input-neon" type="text" placeholder="Nome do Efeito Passivo" value={nomeEfeitoPassivo} onChange={e => setNomeEfeitoPassivo(e.target.value)} style={{ fontSize: '0.85em' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginTop: 4 }}>
                            <select className="input-neon" value={novoAtrP} onChange={e => setNovoAtrP(e.target.value)} style={{ fontSize: '0.85em' }}>
                                {ATRIBUTOS_AGRUPADOS.map(g => (
                                    <optgroup key={g.label} label={g.label} style={{ background: '#051010', color: '#f0f' }}>
                                        {g.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                            <select className="input-neon" value={novoPropP} onChange={e => setNovoPropP(e.target.value)} style={{ fontSize: '0.85em' }}>
                                {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <input className="input-neon" type="text" placeholder="Valor" value={novoValP} onChange={e => setNovoValP(e.target.value)} style={{ fontSize: '0.85em' }} />
                            <button className="btn-neon" style={{ padding: '3px 8px', fontSize: '0.8em', borderColor: '#f0f', color: '#f0f' }} onClick={addEfeitoPassivo}>+</button>
                        </div>
                        {efeitosTempPassivosForma.map((e, i) => renderEfeitoRow(e, i, true))}

                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button className="btn-neon btn-gold" onClick={salvar} style={{ flex: 1, padding: '5px 10px', fontSize: '0.85em' }}>
                                {formaEditandoId ? 'Salvar Forma' : 'Criar Forma'}
                            </button>
                            {formaEditandoId && (
                                <button className="btn-neon btn-red" onClick={cancelarEdicao} style={{ padding: '5px 10px', fontSize: '0.85em' }}>Cancelar</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
