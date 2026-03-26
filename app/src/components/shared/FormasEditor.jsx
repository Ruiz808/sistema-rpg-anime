import React, { useState } from 'react';
import { ATRIBUTOS_AGRUPADOS, PROPRIEDADE_OPTIONS } from '../../core/efeitos-constants';

export default function FormasEditor({ itemRaridade, formas, formaAtivaId, configAtivaId, onSalvarForma, onDeletarForma, onAtivarForma }) {
    const [mostrarFormas, setMostrarFormas] = useState(false);
    const [editando, setEditando] = useState(null);

    const isEspecial = ['espiritual', 'fantasma nobre'].includes((itemRaridade || '').toLowerCase());
    const listaFormas = formas || [];

    const criarNovaForma = () => {
        setEditando({
            id: Date.now(),
            nome: '',
            acumulaFormaBase: true,
            configs: [{
                id: Date.now() + 1,
                nome: 'Padrão',
                efeitos: [], efeitosPassivos: [],
                tAtrA: 'forca', tPropA: 'base', tValA: '',
                tAtrP: 'forca', tPropP: 'base', tValP: ''
            }]
        });
        setMostrarFormas(true);
    };

    const iniciarEdicao = (forma) => {
        const copia = JSON.parse(JSON.stringify(forma));
        // Garante que as configs têm os campos temporários para edição
        copia.configs = (copia.configs || []).map(c => ({
            ...c,
            tAtrA: 'forca', tPropA: 'base', tValA: '',
            tAtrP: 'forca', tPropP: 'base', tValP: ''
        }));
        // Fallback de retrocompatibilidade
        if (!copia.configs.length) {
            copia.configs.push({
                id: Date.now(), nome: 'Padrão', efeitos: copia.efeitos || [], efeitosPassivos: copia.efeitosPassivos || [],
                tAtrA: 'forca', tPropA: 'base', tValA: '', tAtrP: 'forca', tPropP: 'base', tValP: ''
            });
        }
        setEditando(copia);
    };

    const cancelarEdicao = () => setEditando(null);

    const handleFormaChange = (campo, valor) => setEditando({ ...editando, [campo]: valor });

    const addConfig = () => {
        setEditando({
            ...editando,
            configs: [...editando.configs, {
                id: Date.now(), nome: 'Nova Configuração', efeitos: [], efeitosPassivos: [],
                tAtrA: 'forca', tPropA: 'base', tValA: '', tAtrP: 'forca', tPropP: 'base', tValP: ''
            }]
        });
    };

    const removerConfig = (cIdx) => {
        const novas = editando.configs.filter((_, i) => i !== cIdx);
        setEditando({ ...editando, configs: novas });
    };

    const handleConfigChange = (cIdx, campo, valor) => {
        const novas = [...editando.configs];
        novas[cIdx][campo] = valor;
        setEditando({ ...editando, configs: novas });
    };

    const addEfeitoToConfig = (cIdx, isAtivo) => {
        const novas = [...editando.configs];
        const cfg = novas[cIdx];
        if (isAtivo) {
            if (!cfg.tValA) return alert('Preencha o valor!');
            cfg.efeitos.push({ atributo: cfg.tAtrA, propriedade: cfg.tPropA, valor: cfg.tValA });
            cfg.tValA = '';
        } else {
            if (!cfg.tValP) return alert('Preencha o valor!');
            cfg.efeitosPassivos.push({ atributo: cfg.tAtrP, propriedade: cfg.tPropP, valor: cfg.tValP });
            cfg.tValP = '';
        }
        setEditando({ ...editando, configs: novas });
    };

    const removeEfeitoFromConfig = (cIdx, eIdx, isAtivo) => {
        const novas = [...editando.configs];
        if (isAtivo) {
            novas[cIdx].efeitos = novas[cIdx].efeitos.filter((_, i) => i !== eIdx);
        } else {
            novas[cIdx].efeitosPassivos = novas[cIdx].efeitosPassivos.filter((_, i) => i !== eIdx);
        }
        setEditando({ ...editando, configs: novas });
    };

    const salvar = () => {
        if (!editando.nome.trim()) return alert('Dê um nome à Forma!');
        const formaLimpa = JSON.parse(JSON.stringify(editando));
        
        // Limpa lixo temporário antes de gravar
        formaLimpa.configs = formaLimpa.configs.map(c => {
            delete c.tAtrA; delete c.tPropA; delete c.tValA;
            delete c.tAtrP; delete c.tPropP; delete c.tValP;
            return c;
        });
        
        // Retrocompatibilidade
        formaLimpa.efeitos = []; 
        formaLimpa.efeitosPassivos = [];

        onSalvarForma(formaLimpa);
        setEditando(null);
    };

    return (
        <div style={{ marginTop: 10 }}>
            <button className="btn-neon" onClick={() => setMostrarFormas(!mostrarFormas)} style={{ padding: '4px 12px', fontSize: '0.85em', margin: 0, borderColor: '#ff8800', color: '#ff8800' }}>
                {mostrarFormas ? '▼' : '▶'} FORMAS ({listaFormas.length})
            </button>

            {mostrarFormas && (
                <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,136,0,0.05)', borderLeft: '3px solid #ff8800', borderRadius: 4 }}>
                    
                    {!editando ? (
                        <>
                            {listaFormas.map(forma => {
                                const isAtiva = formaAtivaId === forma.id;
                                const totalEfeitos = (forma.configs || []).reduce((acc, c) => acc + (c.efeitos?.length || 0) + (c.efeitosPassivos?.length || 0), 0);

                                return (
                                    <div key={forma.id} style={{ marginBottom: 10, padding: '10px', background: isAtiva ? 'rgba(255,136,0,0.15)' : 'rgba(0,0,0,0.4)', borderRadius: 4, borderLeft: isAtiva ? '3px solid #ff8800' : '3px solid #555' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <strong style={{ color: isAtiva ? '#ff8800' : '#aaa' }}>{forma.nome}</strong>
                                                <span style={{ color: '#666', fontSize: '0.8em', marginLeft: 8 }}>{forma.acumulaFormaBase !== false ? '(acumula com base)' : '(substitui base)'}</span>
                                                <div style={{ color: '#555', fontSize: '0.8em', marginTop: 2 }}>{totalEfeitos} efeitos guardados nesta forma</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn-neon btn-blue" style={{ padding: '3px 8px', fontSize: '0.8em', margin: 0 }} onClick={() => iniciarEdicao(forma)}>EDITAR</button>
                                                <button className="btn-neon btn-red" style={{ padding: '3px 8px', fontSize: '0.8em', margin: 0 }} onClick={() => onDeletarForma(forma.id)}>X</button>
                                            </div>
                                        </div>

                                        {/* 🔥 BOTÕES DAS CONFIGURAÇÕES (PECADOS) 🔥 */}
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {(forma.configs || []).map(cfg => {
                                                const isConfigAtiva = isAtiva && configAtivaId === cfg.id;
                                                return (
                                                    <button 
                                                        key={cfg.id}
                                                        className={`btn-neon ${isConfigAtiva ? 'btn-gold' : ''}`}
                                                        onClick={() => onAtivarForma(isConfigAtiva ? null : forma.id, isConfigAtiva ? null : cfg.id)}
                                                        style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0, borderColor: isConfigAtiva ? '#ff8800' : '#444', color: isConfigAtiva ? '#ff8800' : '#888' }}
                                                    >
                                                        {isConfigAtiva ? `[ ATIVO: ${cfg.nome.toUpperCase()} ]` : `Ativar: ${cfg.nome}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            <button className="btn-neon btn-gold" onClick={criarNovaForma} style={{ width: '100%', padding: '6px', fontSize: '0.85em' }}>+ NOVA FORMA MÍSTICA</button>
                        </>
                    ) : (
                        <div style={{ background: 'rgba(20,20,20,0.9)', borderLeft: '4px solid #00ffcc', padding: 15, borderRadius: 4 }}>
                            <h5 style={{ color: '#00ffcc', margin: '0 0 10px 0', fontSize: '0.9em' }}>{editando.id ? 'Editando Forma' : 'Nova Forma'}</h5>
                            
                            <input className="input-neon" value={editando.nome} onChange={e => handleFormaChange('nome', e.target.value)} placeholder="Nome da Forma (Ex: Forma dos Pecados)" style={{ width: '100%', borderColor: '#00ffcc', marginBottom: 10 }} />
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa', fontSize: '0.85em', cursor: 'pointer', marginBottom: 15 }}>
                                <input type="checkbox" checked={editando.acumulaFormaBase !== false} onChange={e => handleFormaChange('acumulaFormaBase', e.target.checked)} />
                                Acumula com os atributos normais da arma (Se desmarcar, a arma perde os bónus base enquanto transformada)
                            </label>

                            {/* 🔥 EDITOR DE PECADOS/MODOS 🔥 */}
                            {editando.configs.map((cfg, cIdx) => (
                                <div key={cfg.id} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #444', padding: 12, marginBottom: 15, borderRadius: 4 }}>
                                    
                                    {(isEspecial || editando.configs.length > 1) && (
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                            <input className="input-neon" value={cfg.nome} onChange={e => handleConfigChange(cIdx, 'nome', e.target.value)} placeholder="Nome do Modo (Ex: Ganância, Fogo...)" style={{ flex: 1, borderColor: '#ffaa00', color: '#ffaa00' }} />
                                            {editando.configs.length > 1 && <button className="btn-neon btn-red" onClick={() => removerConfig(cIdx)} style={{ padding: '0 10px' }}>X</button>}
                                        </div>
                                    )}

                                    <h6 style={{ color: '#0ff', margin: '0 0 5px 0', fontSize: '0.85em' }}>Efeitos Ativos</h6>
                                    <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                                        <select className="input-neon" style={{ flex: 1, padding: 4, fontSize: '0.8em' }} value={cfg.tAtrA} onChange={e => handleConfigChange(cIdx, 'tAtrA', e.target.value)}>
                                            {ATRIBUTOS_AGRUPADOS.map(g => <optgroup key={g.label} label={g.label}>{g.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}</optgroup>)}
                                        </select>
                                        <select className="input-neon" style={{ flex: 1, padding: 4, fontSize: '0.8em' }} value={cfg.tPropA} onChange={e => handleConfigChange(cIdx, 'tPropA', e.target.value)}>
                                            {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                        </select>
                                        <input className="input-neon" type="text" placeholder="Val" style={{ width: 60, padding: 4, fontSize: '0.8em' }} value={cfg.tValA} onChange={e => handleConfigChange(cIdx, 'tValA', e.target.value)} />
                                        <button className="btn-neon btn-blue" onClick={() => addEfeitoToConfig(cIdx, true)} style={{ padding: '0 10px', margin: 0 }}>+</button>
                                    </div>
                                    {cfg.efeitos.map((e, eIdx) => (
                                        <div key={eIdx} style={{ color: '#0ff', fontSize: '0.8em', display: 'flex', justifyContent: 'space-between', background: 'rgba(0,255,255,0.05)', padding: 4, marginBottom: 2 }}>
                                            <span>[{e.atributo.toUpperCase()}] {e.propriedade.toUpperCase()}: {e.valor}</span>
                                            <span style={{ color: '#f00', cursor: 'pointer' }} onClick={() => removeEfeitoFromConfig(cIdx, eIdx, true)}>X</span>
                                        </div>
                                    ))}

                                    <h6 style={{ color: '#f0f', margin: '10px 0 5px 0', fontSize: '0.85em' }}>Efeitos Passivos</h6>
                                    <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                                        <select className="input-neon" style={{ flex: 1, padding: 4, fontSize: '0.8em' }} value={cfg.tAtrP} onChange={e => handleConfigChange(cIdx, 'tAtrP', e.target.value)}>
                                            {ATRIBUTOS_AGRUPADOS.map(g => <optgroup key={g.label} label={g.label}>{g.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}</optgroup>)}
                                        </select>
                                        <select className="input-neon" style={{ flex: 1, padding: 4, fontSize: '0.8em' }} value={cfg.tPropP} onChange={e => handleConfigChange(cIdx, 'tPropP', e.target.value)}>
                                            {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                        </select>
                                        <input className="input-neon" type="text" placeholder="Val" style={{ width: 60, padding: 4, fontSize: '0.8em' }} value={cfg.tValP} onChange={e => handleConfigChange(cIdx, 'tValP', e.target.value)} />
                                        <button className="btn-neon" onClick={() => addEfeitoToConfig(cIdx, false)} style={{ padding: '0 10px', margin: 0, borderColor: '#f0f', color: '#f0f' }}>+</button>
                                    </div>
                                    {cfg.efeitosPassivos.map((e, eIdx) => (
                                        <div key={eIdx} style={{ color: '#f0f', fontSize: '0.8em', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,0,255,0.05)', padding: 4, marginBottom: 2 }}>
                                            <span>[{e.atributo.toUpperCase()}] {e.propriedade.toUpperCase()}: {e.valor}</span>
                                            <span style={{ color: '#f00', cursor: 'pointer' }} onClick={() => removeEfeitoFromConfig(cIdx, eIdx, false)}>X</span>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {isEspecial && (
                                <button className="btn-neon btn-small" onClick={addConfig} style={{ width: '100%', borderStyle: 'dashed', borderColor: '#ffaa00', color: '#ffaa00', marginBottom: 15 }}>
                                    + Adicionar Configuração (Pecado, Modo, Elemento...)
                                </button>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-neon btn-gold" onClick={salvar} style={{ flex: 1, padding: '8px' }}>SALVAR FORMA</button>
                                <button className="btn-neon btn-red" onClick={cancelarEdicao} style={{ flex: 1, padding: '8px' }}>CANCELAR</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}