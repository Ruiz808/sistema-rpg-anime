import React, { useState, useRef, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';

// 🔥 AGRUPAMENTO VISUAL DOS ATRIBUTOS (Agora com DEFESA!)
const ATRIBUTOS_AGRUPADOS = [
    { label: 'STATUS BASE', options: ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'] },
    { label: 'VITAIS & ENERGIAS', options: ['vida', 'mana', 'aura', 'chakra', 'corpo'] },
    { label: 'COMBATE', options: ['dano'] },
    { label: 'DEFESA (CA)', options: ['evasiva', 'resistencia'] }, // 🔥 NOVO!
    { label: 'ESPECIAIS (GLOBAIS)', options: ['todos_status', 'todas_energias', 'geral'] }
];

const PROPRIEDADE_OPTIONS = [
    'base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'
];

const SINGULAR = {
    'habilidade': 'Habilidade',
    'forma': 'Forma',
    'poder': 'Poder'
};

export default function PoderesPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const efeitosTemp = useStore(s => s.efeitosTemp);
    const setEfeitosTemp = useStore(s => s.setEfeitosTemp);
    const efeitosTempPassivos = useStore(s => s.efeitosTempPassivos);
    const setEfeitosTempPassivos = useStore(s => s.setEfeitosTempPassivos);
    const poderEditandoId = useStore(s => s.poderEditandoId);
    const setPoderEditandoId = useStore(s => s.setPoderEditandoId);

    const [abaAtual, setAbaAtual] = useState('habilidade');

    const [nomePoder, setNomePoder] = useState('');
    const [imagemUrl, setImagemUrl] = useState('');
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    const [custoPercentual, setCustoPercentual] = useState(0);
    const [armaVinculada, setArmaVinculada] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');
    const [novoAtrPassivo, setNovoAtrPassivo] = useState('evasiva'); // Começa com evasiva para incentivar defesas
    const [novoPropPassivo, setNovoPropPassivo] = useState('base');
    const [novoValPassivo, setNovoValPassivo] = useState('');

    const [uploadingImg, setUploadingImg] = useState(false);

    const formRef = useRef(null);

    const addEfeitoTemp = () => {
        if (!novoVal) return;
        setEfeitosTemp([...efeitosTemp, { atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
    };

    const removerEfeitoTemp = (index) => {
        setEfeitosTemp(efeitosTemp.filter((_, i) => i !== index));
    };

    const addEfeitoPassivoTemp = () => {
        if (!novoValPassivo) return;
        setEfeitosTempPassivos([...efeitosTempPassivos, { atributo: novoAtrPassivo, propriedade: novoPropPassivo, valor: novoValPassivo }]);
        setNovoValPassivo('');
    };

    const removerEfeitoPassivoTemp = (index) => {
        setEfeitosTempPassivos(efeitosTempPassivos.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploadingImg(true);
        try {
            const urlPermanente = await uploadImagem(file, `poderes/${meuNome || 'desconhecido'}`);
            setImagemUrl(urlPermanente);
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar a imagem!');
        } finally {
            setUploadingImg(false);
        }
    };

    const salvarNovoPoder = () => {
        const n = nomePoder.trim();
        if (!n || (!efeitosTemp.length && !efeitosTempPassivos.length)) {
            alert('Falta nome ou efeitos!');
            return;
        }

        updateFicha((ficha) => {
            if (!ficha.poderes) ficha.poderes = [];

            if (poderEditandoId) {
                const ix = ficha.poderes.findIndex(p => p.id === poderEditandoId);
                if (ix !== -1) {
                    ficha.poderes[ix].nome = n;
                    ficha.poderes[ix].categoria = abaAtual;
                    ficha.poderes[ix].efeitos = JSON.parse(JSON.stringify(efeitosTemp));
                    ficha.poderes[ix].efeitosPassivos = JSON.parse(JSON.stringify(efeitosTempPassivos));
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
                    categoria: abaAtual,
                    ativa: false,
                    efeitos: JSON.parse(JSON.stringify(efeitosTemp)),
                    efeitosPassivos: JSON.parse(JSON.stringify(efeitosTempPassivos)),
                    imagemUrl: imagemUrl,
                    dadosQtd: parseInt(dadosQtd) || 0,
                    dadosFaces: parseInt(dadosFaces) || 20,
                    custoPercentual: parseFloat(custoPercentual) || 0,
                    armaVinculada: armaVinculada
                });
            }
        });

        salvarFirebaseImediato().then(() => {
            cancelarEdicaoPoder();
        }).catch(() => {
            alert('Erro ao sincronizar o poder no Firebase!');
        });
    };

    const editarPoder = (id) => {
        const p = (minhaFicha.poderes || []).find(po => po.id === id);
        if (!p) return;
        
        if (p.ativa) {
            togglePoder(id);
            alert(`A técnica [${p.nome}] foi DESATIVADA temporariamente para edição.`);
        }
        
        setPoderEditandoId(p.id);
        setAbaAtual(p.categoria || 'poder');
        setNomePoder(p.nome);
        setImagemUrl(p.imagemUrl || '');
        setDadosQtd(p.dadosQtd || 0);
        setDadosFaces(p.dadosFaces || 20);
        setCustoPercentual(p.custoPercentual || 0);
        setArmaVinculada(p.armaVinculada || '');
        setEfeitosTemp(JSON.parse(JSON.stringify(p.efeitos || [])));
        setEfeitosTempPassivos(JSON.parse(JSON.stringify(p.efeitosPassivos || [])));

        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
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
        setEfeitosTempPassivos([]);
        setNovoAtrPassivo('evasiva');
        setNovoPropPassivo('base');
        setNovoValPassivo('');
    };

    const togglePoder = (id) => {
        const vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];

        updateFicha((ficha) => {
            if (!ficha.poderes) return;
            const p = ficha.poderes.find(po => po.id === id);
            if (!p) return;

            const oldM = {};
            vitais.forEach(v => { oldM[v] = getMaximo(ficha, v) || 1; });

            p.ativa = !p.ativa;

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

    const deletarPoder = (id) => {
        if (!window.confirm('Tem certeza que deseja apagar permanentemente?')) return;
        const p = (minhaFicha.poderes || []).find(po => po.id === id);
        if (p && p.ativa) togglePoder(id);

        updateFicha((ficha) => { ficha.poderes = (ficha.poderes || []).filter(po => po.id !== id); });
        salvarFichaSilencioso();
    };

    const poderesGlobais = minhaFicha.poderes || [];
    const passivas = minhaFicha.passivas || [];
    const itensFiltrados = poderesGlobais.filter(p => (p.categoria || 'poder') === abaAtual);

    const relatorioAuditoria = useMemo(() => {
        const nomesProps = { mbase: 'MULT BASE (x)', mgeral: 'MULT GERAL (x)', mformas: 'MULT FORMA (x)', mabs: 'MULT ABSOLUTO (x)', munico: 'MULT UNICO (x)', base: 'VALOR BRUTO (+)' };
        const mapaEfeitos = { mbase: [], mgeral: [], mformas: [], mabs: [], munico: [], base: [], especial: [] };

        const coletarEfeitos = (nome, efeitos) => {
            if (!efeitos) return;
            efeitos.forEach(ef => {
                const txt = { nome, atributo: ef.atributo, valor: ef.valor };
                if (mapaEfeitos[ef.propriedade]) mapaEfeitos[ef.propriedade].push(txt);
                else mapaEfeitos.especial.push(txt);
            });
        };

        poderesGlobais.forEach(p => { if (p && p.efeitosPassivos) coletarEfeitos(p.nome, p.efeitosPassivos); });
        passivas.forEach(p => { if (p && p.efeitos) coletarEfeitos(p.nome, p.efeitos); });

        let hasContent = false;
        const sections = [];
        for (const prop in nomesProps) {
            if (mapaEfeitos[prop].length > 0) {
                hasContent = true;
                sections.push(
                    <div key={prop} style={{ marginBottom: 6 }}>
                        <strong style={{ color: '#f0f' }}>{nomesProps[prop]}:</strong>{' '}
                        {mapaEfeitos[prop].map((t, i) => (
                            <span key={i}>
                                {i > 0 && <strong style={{ color: '#f0f' }}> + </strong>}
                                <span style={{ color: '#fff' }}>{t.nome}</span>
                                <span style={{ color: '#555' }}> ({(t.atributo || '').toUpperCase()}: {t.valor})</span>
                            </span>
                        ))}
                    </div>
                );
            }
        }
        if (mapaEfeitos.especial.length > 0) {
            hasContent = true;
            sections.push(
                <div key="especial" style={{ marginBottom: 6 }}>
                    <strong style={{ color: '#0ff' }}>OUTROS EFEITOS:</strong>{' '}
                    {mapaEfeitos.especial.map((t, i) => (
                        <span key={i}>
                            {i > 0 && <strong style={{ color: '#0ff' }}> + </strong>}
                            <span style={{ color: '#fff' }}>{t.nome}</span>
                            <span style={{ color: '#555' }}> ({(t.atributo || '').toUpperCase()}: {t.valor})</span>
                        </span>
                    ))}
                </div>
            );
        }
        if (!hasContent) return null;
        return sections;
    }, [poderesGlobais, passivas]);

    return (
        <div className="poderes-panel" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="def-box" style={{ flex: '0 0 230px', padding: '15px', position: 'sticky', top: '20px' }}>
                <h3 style={{ color: '#fff', marginTop: 0, textAlign: 'center', marginBottom: '20px', fontSize: '1.1em', letterSpacing: '1px' }}>
                    📖 ARQUIVOS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button className={`btn-neon ${abaAtual === 'habilidade' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('habilidade'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                        🗡️ HABILIDADES
                    </button>
                    <button className={`btn-neon ${abaAtual === 'forma' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('forma'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                        🎭 FORMAS
                    </button>
                    <button className={`btn-neon ${abaAtual === 'poder' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('poder'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                        ✨ PODERES
                    </button>
                </div>
            </div>

            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="def-box" ref={formRef} id="form-poder-box">
                    <h3 style={{ color: '#0ff', marginBottom: 10 }}>{poderEditandoId ? `Editando: ${nomePoder}` : `Criar ${SINGULAR[abaAtual]}`}</h3>
                    <input className="input-neon" type="text" placeholder={`Nome da ${SINGULAR[abaAtual]}`} value={nomePoder} onChange={e => setNomePoder(e.target.value)} />
                    
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 5 }}>
                        <input className="input-neon" type="text" placeholder="URL da Imagem (Ou anexe ao lado 👉)" value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} style={{ flex: 1, margin: 0 }} />
                        <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, whiteSpace: 'nowrap', opacity: uploadingImg ? 0.5 : 1 }}>
                            {uploadingImg ? 'Enviando...' : '📁 Anexar'}
                            <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                        </label>
                    </div>

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 10 }}>
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
                        {efeitosTemp.map((e, i) => {
                            const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                            return (
                                <div key={i} style={{ color: '#0ff', fontSize: '0.9em', marginBottom: 5, background: 'rgba(0,255,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #0ff', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>[{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                    <button onClick={() => removerEfeitoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                </div>
                            );
                        })}
                    </div>

                    <h4 style={{ color: '#f0f', marginTop: 15, marginBottom: 8, fontSize: '0.95em' }}>Efeitos Passivos (sempre ativos)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
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
                        {efeitosTempPassivos.map((e, i) => {
                            const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                            return (
                                <div key={i} style={{ color: '#f0f', fontSize: '0.9em', marginBottom: 5, background: 'rgba(255,0,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #f0f', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>PASSIVO: [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                    <button onClick={() => removerEfeitoPassivoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button className="btn-neon btn-gold" onClick={salvarNovoPoder} style={{ flex: 1 }}>{poderEditandoId ? 'Salvar Edição' : `Salvar ${SINGULAR[abaAtual]}`}</button>
                        {poderEditandoId && <button className="btn-neon btn-red" onClick={cancelarEdicaoPoder} style={{ flex: 1 }}>Cancelar</button>}
                    </div>
                </div>

                <div id="lista-poderes-salvos">
                    {itensFiltrados.length === 0 ? (
                        <p style={{ color: '#888' }}>Nenhuma {SINGULAR[abaAtual].toLowerCase()} gravada.</p>
                    ) : (
                        itensFiltrados.map((p) => {
                            if (!p) return null;
                            const c = p.ativa ? '#0f0' : '#888';
                            const bg = p.ativa ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.4)';
                            const txtArr = (p.efeitos || []).map(e => {
                                if (!e) return '';
                                return `[${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: +${e.valor || 0}`;
                            }).filter(Boolean);
                            
                            return (
                                <div key={p.id} className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>{p.nome || 'Poder'}</h3>
                                            <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0' }}>{txtArr.join(' | ') || 'Sem efeitos ativos.'}
                                            {(p.efeitosPassivos || []).length > 0 && (
                                                <span style={{ color: '#f0f', display: 'block', marginTop: '4px' }}>{(p.efeitosPassivos || []).map(e => {
                                                    if (!e) return '';
                                                    return `PASSIVO: [${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: +${e.valor || 0}`;
                                                }).filter(Boolean).join(' | ')}</span>
                                            )}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

                <div className="def-box">
                    <h3 style={{ color: '#0ff', marginBottom: 10 }}>Auditoria de Combos Globais (Auto)</h3>
                    <div style={{ fontSize: '0.9em' }}>
                        {relatorioAuditoria || <span style={{ color: '#888', fontStyle: 'italic' }}>Nenhum efeito passivo ativo computado.</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}