import React, { useState, useRef } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

// 🔥 AGRUPAMENTO VISUAL DOS ATRIBUTOS (Agora com COMBATE!)
const ATRIBUTOS_AGRUPADOS = [
    { 
        label: 'STATUS BASE', 
        options: ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'] 
    },
    { 
        label: 'VITAIS & ENERGIAS', 
        options: ['vida', 'mana', 'aura', 'chakra', 'corpo'] 
    },
    {
        label: 'COMBATE',
        options: ['dano'] // <-- O nosso novo atributo letal!
    },
    { 
        label: 'ESPECIAIS (GLOBAIS)', 
        options: ['todos_status', 'todas_energias', 'geral'] 
    }
];

const PROPRIEDADE_OPTIONS = [
    'base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'
];

export default function PoderesPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const efeitosTemp = useStore(s => s.efeitosTemp);
    const setEfeitosTemp = useStore(s => s.setEfeitosTemp);
    const poderEditandoId = useStore(s => s.poderEditandoId);
    const setPoderEditandoId = useStore(s => s.setPoderEditandoId);

    const [nomePoder, setNomePoder] = useState('');
    const [imagemUrl, setImagemUrl] = useState('');
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    const [custoPercentual, setCustoPercentual] = useState(0);
    const [armaVinculada, setArmaVinculada] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');

    const formRef = useRef(null);

    const addEfeitoTemp = () => {
        if (!novoVal) return;
        setEfeitosTemp([...efeitosTemp, { atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
    };

    const removerEfeitoTemp = (index) => {
        setEfeitosTemp(efeitosTemp.filter((_, i) => i !== index));
    };

    const salvarNovoPoder = () => {
        const n = nomePoder.trim();
        if (!n || !efeitosTemp.length) {
            alert('Falta nome ou efeitos!');
            return;
        }

        updateFicha((ficha) => {
            if (!ficha.poderes) ficha.poderes = [];

            if (poderEditandoId) {
                const ix = ficha.poderes.findIndex(p => p.id === poderEditandoId);
                if (ix !== -1) {
                    ficha.poderes[ix].nome = n;
                    ficha.poderes[ix].efeitos = JSON.parse(JSON.stringify(efeitosTemp));
                    ficha.poderes[ix].imagemUrl = imagemUrl;
                    ficha.poderes[ix].dadosQtd = parseInt(dadosQtd) || 0;
                    ficha.poderes[ix].dadosFaces = parseInt(dadosFaces) || 20;
                    ficha.poderes[ix].custoPercentual = parseFloat(custoPercentual) || 0;
                    ficha.poderes[ix].armaVinculada = armaVinculada;
                }
            } else {
                ficha.poderes.push({
                    id: Date.now(),
                    nome: n,
                    ativa: false,
                    efeitos: JSON.parse(JSON.stringify(efeitosTemp)),
                    imagemUrl: imagemUrl,
                    dadosQtd: parseInt(dadosQtd) || 0,
                    dadosFaces: parseInt(dadosFaces) || 20,
                    custoPercentual: parseFloat(custoPercentual) || 0,
                    armaVinculada: armaVinculada
                });
            }
        });

        cancelarEdicaoPoder();
        salvarFichaSilencioso();
    };

    const editarPoder = (id) => {
        const p = (minhaFicha.poderes || []).find(po => po.id === id);
        if (!p) return;
        
        if (p.ativa) {
            togglePoder(id);
            alert(`A habilidade [${p.nome}] foi DESATIVADA temporariamente para edição.`);
        }
        
        setPoderEditandoId(p.id);
        setNomePoder(p.nome);
        setImagemUrl(p.imagemUrl || '');
        setDadosQtd(p.dadosQtd || 0);
        setDadosFaces(p.dadosFaces || 20);
        setCustoPercentual(p.custoPercentual || 0);
        setArmaVinculada(p.armaVinculada || '');
        setEfeitosTemp(JSON.parse(JSON.stringify(p.efeitos || [])));
        
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const cancelarEdicaoPoder = () => {
        setPoderEditandoId(null);
        setNomePoder('');
        setImagemUrl('');
        setDadosQtd(0);
        setDadosFaces(20);
        setCustoPercentual(0);
        setArmaVinculada('');
        setEfeitosTemp([]);
    };

    const togglePoder = (id) => {
        const vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];

        updateFicha((ficha) => {
            if (!ficha.poderes) return;
            const p = ficha.poderes.find(po => po.id === id);
            if (!p) return;

            const oldM = {};
            vitais.forEach(v => {
                oldM[v] = getMaximo(ficha, v) || 1;
            });

            p.ativa = !p.ativa;

            vitais.forEach(k => {
                const nMax = getMaximo(ficha, k) || 1;
                let atu = parseFloat(ficha[k].atual);
                if (isNaN(atu)) atu = nMax;
                
                ficha[k].atual = Math.floor(atu * (nMax / oldM[k]));
                
                if (isNaN(ficha[k].atual) || ficha[k].atual < 0 || ficha[k].atual > nMax) {
                    ficha[k].atual = nMax;
                }
            });
        });

        salvarFichaSilencioso();
    };

    const deletarPoder = (id) => {
        if (!window.confirm('Tem certeza que deseja apagar este poder permanentemente?')) return;
        const p = (minhaFicha.poderes || []).find(po => po.id === id);
        
        if (p && p.ativa) togglePoder(id);

        updateFicha((ficha) => {
            ficha.poderes = (ficha.poderes || []).filter(po => po.id !== id);
        });
        
        salvarFichaSilencioso();
    };

    const poderes = minhaFicha.poderes || [];

    return (
        <div className="poderes-panel">
            <div className="def-box" ref={formRef} id="form-poder-box">
                <h3 style={{ color: '#0ff', marginBottom: 10 }}>
                    {poderEditandoId ? `Editando: ${nomePoder}` : 'Criar Novo Poder'}
                </h3>

                <input className="input-neon" type="text" placeholder="Nome do Poder" value={nomePoder} onChange={e => setNomePoder(e.target.value)} />
                <input className="input-neon" type="text" placeholder="URL da Imagem (opcional)" value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} style={{ marginTop: 5 }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados de Dano (qtd)</label>
                        <input className="input-neon" type="number" min="0" value={dadosQtd} onChange={e => setDadosQtd(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                        <input className="input-neon" type="number" min="1" value={dadosFaces} onChange={e => setDadosFaces(e.target.value)} placeholder="20" />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Custo (% Energia)</label>
                        <input className="input-neon" type="number" min="0" value={custoPercentual} onChange={e => setCustoPercentual(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Vincular a Arma</label>
                        <select className="input-neon" value={armaVinculada} onChange={e => setArmaVinculada(e.target.value)}>
                            <option value="">Nenhuma (Livre)</option>
                            {(minhaFicha.inventario || []).filter(i => i.tipo === 'arma').map(arma => (
                                <option key={arma.id} value={String(arma.id)}>{arma.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {dadosQtd > 0 && <p style={{ color: '#f0f', fontSize: '0.85em', margin: '5px 0 0' }}>Dano: {dadosQtd}d{dadosFaces}{custoPercentual > 0 ? ` | Custo: ${custoPercentual}%` : ''}{armaVinculada ? ' (vinculada a arma)' : ' (livre)'}</p>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 10 }}>
                    <select className="input-neon" value={novoAtr} onChange={e => setNovoAtr(e.target.value)}>
                        {ATRIBUTOS_AGRUPADOS.map(grupo => (
                            <optgroup key={grupo.label} label={grupo.label} style={{ background: '#051010', color: '#0ff' }}>
                                {grupo.options.map(a => (
                                    <option key={a} value={a}>
                                        {a.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
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
                    {efeitosTemp.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9em', margin: 0 }}>Nenhum efeito adicionado.</p>
                    ) : (
                        efeitosTemp.map((e, i) => {
                            const prop = (e.propriedade || '').toLowerCase();
                            const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes(prop);
                            return (
                                <div key={i} style={{ color: '#0ff', fontSize: '0.9em', marginBottom: 5, background: 'rgba(0,255,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #0ff', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>[{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                    <button onClick={() => removerEfeitoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="btn-neon btn-gold" onClick={salvarNovoPoder} style={{ flex: 1 }}>{poderEditandoId ? 'Salvar Edição' : 'Salvar Poder'}</button>
                    {poderEditandoId && <button className="btn-neon btn-red" onClick={cancelarEdicaoPoder} style={{ flex: 1 }}>Cancelar</button>}
                </div>
            </div>

            <div id="lista-poderes-salvos" style={{ marginTop: 15 }}>
                {poderes.length === 0 ? (
                    <p style={{ color: '#888' }}>Nenhuma habilidade gravada.</p>
                ) : (
                    poderes.map((p) => {
                        if (!p) return null;
                        const c = p.ativa ? '#0f0' : '#888';
                        const bg = p.ativa ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.4)';
                        const txtArr = (p.efeitos || []).map(e => {
                            if (!e) return '';
                            const prop = (e.propriedade || '').toLowerCase();
                            const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes(prop);
                            return `[${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: ${isMult ? 'x' : '+'}${e.valor || 0}`;
                        }).filter(Boolean);
                        const dadosTxt = (p.dadosQtd > 0) ? `${p.dadosQtd}d${p.dadosFaces || 20}` : '';
                        const custoTxt = (p.custoPercentual > 0) ? `Custo: ${p.custoPercentual}%` : '';
                        const armaVinc = p.armaVinculada ? (minhaFicha.inventario || []).find(i => String(i.id) === String(p.armaVinculada)) : null;

                        return (
                            <div key={p.id} className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>{p.nome || 'Poder'}</h3>
                                        {dadosTxt && <p style={{ color: '#f0f', fontSize: '0.85em', margin: '5px 0 0' }}>Dano: {dadosTxt}{custoTxt ? ` | ${custoTxt}` : ''}{armaVinc ? ` (na ${armaVinc.nome})` : ' (livre)'}</p>}
                                        <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0' }}>{txtArr.join(' | ') || 'Sem efeitos.'}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }} onClick={() => togglePoder(p.id)}>{p.ativa ? 'LIGADO' : 'DESLIGADO'}</button>
                                        <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => editarPoder(p.id)}>EDITAR</button>
                                        <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => deletarPoder(p.id)}>APAGAR</button>
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