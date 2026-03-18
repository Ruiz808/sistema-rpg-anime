import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

const ATRIBUTO_OPTIONS = [
    'forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao',
    'vida', 'mana', 'aura', 'chakra', 'corpo', 'todos_status', 'todas_energias', 'geral', 'dano'
];

const PROPRIEDADE_OPTIONS = [
    'base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'
];

export default function NarrativaPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);

    // Bio fields
    const [raca, setRaca] = useState('');
    const [classe, setClasse] = useState('');
    const [idade, setIdade] = useState('');
    const [fisico, setFisico] = useState('');
    const [sangue, setSangue] = useState('');
    const [alinhamento, setAlinhamento] = useState('');
    const [afiliacao, setAfiliacao] = useState('');
    const [dinheiro, setDinheiro] = useState('');

    // Notes fields
    const [notaBase, setNotaBase] = useState('');
    const [notaGeral, setNotaGeral] = useState('');
    const [notaFormas, setNotaFormas] = useState('');
    const [notaAbs, setNotaAbs] = useState('');
    const [notaUnico, setNotaUnico] = useState('');

    // Passive creation
    const [passivaNome, setPassivaNome] = useState('');
    const [passivaTipo, setPassivaTipo] = useState('Vantagem');
    const [efeitosTempPassiva, setEfeitosTempPassiva] = useState([]);
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');

    // Save feedback
    const [salvando, setSalvando] = useState(false);

    // Load bio from ficha
    const carregarBio = useCallback(() => {
        const bio = minhaFicha.bio || {};
        setRaca(bio.raca || '');
        setClasse(bio.classe || '');
        setIdade(bio.idade || '');
        setFisico(bio.fisico || '');
        setSangue(bio.sangue || '');
        setAlinhamento(bio.alinhamento || '');
        setAfiliacao(bio.afiliacao || '');
        setDinheiro(bio.dinheiro || '');

        const notas = minhaFicha.notas || {};
        setNotaBase(notas.base || '');
        setNotaGeral(notas.geral || '');
        setNotaFormas(notas.formas || '');
        setNotaAbs(notas.abs || '');
        setNotaUnico(notas.unico || '');
    }, [minhaFicha.bio, minhaFicha.notas]);

    useEffect(() => {
        carregarBio();
    }, [carregarBio]);

    function salvarBio() {
        updateFicha((ficha) => {
            if (!ficha.bio) ficha.bio = {};
            if (!ficha.notas) ficha.notas = {};

            ficha.bio.raca = raca;
            ficha.bio.classe = classe;
            ficha.bio.idade = idade;
            ficha.bio.fisico = fisico;
            ficha.bio.sangue = sangue;
            ficha.bio.alinhamento = alinhamento;
            ficha.bio.afiliacao = afiliacao;
            ficha.bio.dinheiro = dinheiro;

            ficha.notas.base = notaBase;
            ficha.notas.geral = notaGeral;
            ficha.notas.formas = notaFormas;
            ficha.notas.abs = notaAbs;
            ficha.notas.unico = notaUnico;
        });
        salvarFichaSilencioso();

        // Visual feedback
        setSalvando(true);
        setTimeout(() => setSalvando(false), 2000);
    }

    function addEfeitoPassiva() {
        setEfeitosTempPassiva(prev => [...prev, {
            atributo: novoAtr,
            propriedade: novoProp,
            valor: novoVal
        }]);
        setNovoVal('');
    }

    function removerEfeitoPassiva(i) {
        setEfeitosTempPassiva(prev => {
            const newList = [...prev];
            newList.splice(i, 1);
            return newList;
        });
    }

    function adicionarPassiva() {
        if (passivaNome.trim() === '') {
            alert('Digite o nome da habilidade!');
            return;
        }

        updateFicha((ficha) => {
            if (!ficha.passivas) ficha.passivas = [];
            ficha.passivas.push({
                nome: passivaNome.trim(),
                tipo: passivaTipo,
                efeitos: JSON.parse(JSON.stringify(efeitosTempPassiva))
            });
        });

        setPassivaNome('');
        setEfeitosTempPassiva([]);
        salvarFichaSilencioso();
    }

    function removerPassiva(index) {
        updateFicha((ficha) => {
            if (!ficha.passivas) return;
            ficha.passivas.splice(index, 1);
        });
        salvarFichaSilencioso();
    }

    const passivas = minhaFicha.passivas || [];

    // Auto-audit panel: group effects by property
    const relatorioAuditoria = (() => {
        if (!passivas || passivas.length === 0) return null;

        const mapaEfeitos = { mbase: [], mgeral: [], mformas: [], mabs: [], munico: [], base: [], especial: [] };
        const nomesProps = {
            mbase: 'MULT BASE (x)', mgeral: 'MULT GERAL (x)', mformas: 'MULT FORMA (x)',
            mabs: 'MULT ABSOLUTO (x)', munico: 'MULT UNICO (x)', base: 'VALOR BRUTO (+)'
        };

        passivas.forEach(p => {
            if (p.efeitos) {
                p.efeitos.forEach(ef => {
                    const txt = { nome: p.nome, atributo: ef.atributo, valor: ef.valor };
                    if (mapaEfeitos[ef.propriedade]) {
                        mapaEfeitos[ef.propriedade].push(txt);
                    } else {
                        mapaEfeitos.especial.push(txt);
                    }
                });
            }
        });

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
                                <span style={{ color: '#555' }}> ({t.atributo.toUpperCase()}: {t.valor})</span>
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
                            <span style={{ color: '#555' }}> ({t.atributo.toUpperCase()}: {t.valor})</span>
                        </span>
                    ))}
                </div>
            );
        }

        if (!hasContent) return <span style={{ color: '#888', fontStyle: 'italic' }}>As passivas nao possuem modificadores mecanicos configurados.</span>;
        return sections;
    })();

    return (
        <div className="narrativa-panel">
            {/* Bio inputs */}
            <div className="def-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Ficha Narrativa</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Raca</label>
                        <input className="input-neon" id="bio-raca" value={raca} onChange={e => setRaca(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Classe</label>
                        <input className="input-neon" id="bio-classe" value={classe} onChange={e => setClasse(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Idade</label>
                        <input className="input-neon" id="bio-idade" value={idade} onChange={e => setIdade(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Fisico</label>
                        <input className="input-neon" id="bio-fisico" value={fisico} onChange={e => setFisico(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo Sanguineo</label>
                        <input className="input-neon" id="bio-sangue" value={sangue} onChange={e => setSangue(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Alinhamento</label>
                        <input className="input-neon" id="bio-alinhamento" value={alinhamento} onChange={e => setAlinhamento(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Afiliacao</label>
                        <input className="input-neon" id="bio-afiliacao" value={afiliacao} onChange={e => setAfiliacao(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dinheiro</label>
                        <input className="input-neon" id="bio-dinheiro" value={dinheiro} onChange={e => setDinheiro(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#0ff', marginBottom: 10 }}>Anotacoes de Multiplicadores</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Base</label>
                        <textarea className="input-neon" id="nota-base" value={notaBase} onChange={e => setNotaBase(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Geral</label>
                        <textarea className="input-neon" id="nota-geral" value={notaGeral} onChange={e => setNotaGeral(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Formas</label>
                        <textarea className="input-neon" id="nota-formas" value={notaFormas} onChange={e => setNotaFormas(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Absoluto</label>
                        <textarea className="input-neon" id="nota-abs" value={notaAbs} onChange={e => setNotaAbs(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Unico</label>
                        <textarea className="input-neon" id="nota-unico" value={notaUnico} onChange={e => setNotaUnico(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </div>

            {/* Save bio button */}
            <button
                className="btn-neon btn-gold"
                onClick={salvarBio}
                style={{
                    marginTop: 15,
                    width: '100%',
                    backgroundColor: salvando ? 'rgba(0, 255, 100, 0.2)' : undefined,
                    borderColor: salvando ? '#00ffcc' : undefined,
                    color: salvando ? '#fff' : undefined
                }}
            >
                {salvando ? 'SALVO COM SUCESSO!' : 'Salvar Bio e Anotacoes'}
            </button>

            {/* Passives system */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#f0f', marginBottom: 10 }}>Sistema de Passivas</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Nome da Passiva</label>
                        <input className="input-neon" value={passivaNome} onChange={e => setPassivaNome(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo</label>
                        <select className="input-neon" value={passivaTipo} onChange={e => setPassivaTipo(e.target.value)}>
                            <option value="Vantagem">Vantagem</option>
                            <option value="Habilidade">Habilidade</option>
                        </select>
                    </div>
                </div>

                {/* Add effect to passive */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 10 }}>
                    <select className="input-neon" value={novoAtr} onChange={e => setNovoAtr(e.target.value)}>
                        {ATRIBUTO_OPTIONS.map(a => (
                            <option key={a} value={a}>{a.toUpperCase()}</option>
                        ))}
                    </select>
                    <select className="input-neon" value={novoProp} onChange={e => setNovoProp(e.target.value)}>
                        {PROPRIEDADE_OPTIONS.map(p => (
                            <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                    </select>
                    <input
                        className="input-neon"
                        type="text"
                        placeholder="Valor"
                        value={novoVal}
                        onChange={e => setNovoVal(e.target.value)}
                    />
                    <button className="btn-neon btn-blue" onClick={addEfeitoPassiva} style={{ padding: '5px 10px' }}>
                        + Efeito
                    </button>
                </div>

                {/* Temp effects list */}
                <div style={{ marginTop: 10 }}>
                    {efeitosTempPassiva.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9em', margin: 0 }}>Nenhum efeito adicionado.</p>
                    ) : (
                        efeitosTempPassiva.map((e, i) => (
                            <div key={i} style={{
                                color: '#f0f', fontSize: '0.9em', marginBottom: 5,
                                background: 'rgba(255,0,255,0.1)', padding: '5px 10px',
                                borderLeft: '2px solid #f0f', display: 'flex', justifyContent: 'space-between'
                            }}>
                                <span>
                                    [{(e.atributo || '').toUpperCase()}] {(e.propriedade || '').toUpperCase()}: {e.valor}
                                </span>
                                <button
                                    onClick={() => removerEfeitoPassiva(i)}
                                    style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}
                                >
                                    X
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <button className="btn-neon" onClick={adicionarPassiva} style={{ marginTop: 10, width: '100%', borderColor: '#f0f', color: '#f0f' }}>
                    Adicionar Passiva
                </button>
            </div>

            {/* List of passives */}
            <div id="lista-passivas" style={{ marginTop: 15 }}>
                {passivas.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', fontStyle: 'italic' }}>Nenhuma habilidade listada.</p>
                ) : (
                    passivas.map((p, i) => {
                        const corTag = p.tipo === 'Vantagem' ? '#ffcc00' : '#33ff77';
                        return (
                            <div key={i} style={{
                                background: 'rgba(0,0,0,0.6)', padding: '10px 12px',
                                borderLeft: `3px solid ${corTag}`, borderRadius: 4,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                marginBottom: 8
                            }}>
                                <div>
                                    <div>
                                        <span style={{ color: corTag, fontSize: '0.7em', textTransform: 'uppercase', fontWeight: 'bold', marginRight: 5 }}>
                                            [{p.tipo}]
                                        </span>
                                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1em' }}>
                                            {p.nome}
                                        </span>
                                    </div>
                                    <div>
                                        {(p.efeitos || []).map((ef, j) => (
                                            <span key={j} style={{
                                                display: 'inline-block', fontSize: '0.7em',
                                                background: 'rgba(0,0,0,0.8)', border: '1px solid #555',
                                                padding: '2px 5px', borderRadius: 4, marginRight: 4, marginTop: 4, color: '#aaa'
                                            }}>
                                                {(ef.propriedade || '').toUpperCase()} ({(ef.atributo || '').toUpperCase()}): {ef.valor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removerPassiva(i)}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1.2em' }}
                                    title="Remover"
                                >
                                    X
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Auto-audit panel */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#0ff', marginBottom: 10 }}>Auditoria de Combos (Auto)</h3>
                <div id="painel-auditoria-auto" style={{ fontSize: '0.9em' }}>
                    {passivas.length === 0 ? (
                        <span style={{ color: '#888', fontStyle: 'italic' }}>Nenhum efeito de passiva ativo.</span>
                    ) : (
                        relatorioAuditoria
                    )}
                </div>
            </div>
        </div>
    );
}
