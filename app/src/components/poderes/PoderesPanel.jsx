import React, { useState, useRef, useMemo, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';
import { ATRIBUTOS_AGRUPADOS, PROPRIEDADE_OPTIONS } from '../../core/efeitos-constants';
import FormasEditor from '../shared/FormasEditor';

const SINGULAR = {
    'habilidade': 'Habilidade',
    'forma': 'Forma',
    'poder': 'Poder',
    'classificacao': 'Classificação'
};

export default function PoderesPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const isMestre = useStore(s => s.isMestre); // 🔥 A CHAVE DO ARQUITETO 🔥
    const updateFicha = useStore(s => s.updateFicha);
    const efeitosTemp = useStore(s => s.efeitosTemp);
    const setEfeitosTemp = useStore(s => s.setEfeitosTemp);
    const efeitosTempPassivos = useStore(s => s.efeitosTempPassivos);
    const setEfeitosTempPassivos = useStore(s => s.setEfeitosTempPassivos);
    const poderEditandoId = useStore(s => s.poderEditandoId);
    const setPoderEditandoId = useStore(s => s.setPoderEditandoId);

    const [abaAtual, setAbaAtual] = useState('habilidade');

    const [nomePoder, setNomePoder] = useState('');
    const [descricaoPoder, setDescricaoPoder] = useState(''); 
    const [imagemUrl, setImagemUrl] = useState('');
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    const [custoPercentual, setCustoPercentual] = useState(0);
    const [poderAlcance, setPoderAlcance] = useState(1); 
    const [armaVinculada, setArmaVinculada] = useState('');
    const [nomeEfeito, setNomeEfeito] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');
    const [nomeEfeitoPassivo, setNomeEfeitoPassivo] = useState('');
    const [novoAtrPassivo, setNovoAtrPassivo] = useState('evasiva');
    const [novoPropPassivo, setNovoPropPassivo] = useState('base');
    const [novoValPassivo, setNovoValPassivo] = useState('');

    const [uploadingImg, setUploadingImg] = useState(false);
    const [vincularAberto, setVincularAberto] = useState(null);

    const formRef = useRef(null);
    const vincularRef = useRef(null);

    useEffect(() => {
        if (!vincularAberto) return;
        const handler = (e) => {
            if (vincularRef.current && !vincularRef.current.contains(e.target)) {
                setVincularAberto(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [vincularAberto]);

    const addEfeitoTemp = () => {
        if (!novoVal || !nomeEfeito.trim()) { alert('Preencha o nome e o valor do efeito!'); return; }
        setEfeitosTemp([...efeitosTemp, { nome: nomeEfeito.trim(), atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
        setNomeEfeito('');
    };

    const removerEfeitoTemp = (index) => {
        setEfeitosTemp(efeitosTemp.filter((_, i) => i !== index));
    };

    const addEfeitoPassivoTemp = () => {
        if (!novoValPassivo || !nomeEfeitoPassivo.trim()) { alert('Preencha o nome e o valor do efeito passivo!'); return; }
        setEfeitosTempPassivos([...efeitosTempPassivos, { nome: nomeEfeitoPassivo.trim(), atributo: novoAtrPassivo, propriedade: novoPropPassivo, valor: novoValPassivo }]);
        setNovoValPassivo('');
        setNomeEfeitoPassivo('');
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
        if (!n || (!efeitosTemp.length && !efeitosTempPassivos.length && dadosQtd === 0 && !descricaoPoder.trim())) {
            alert('Falta nome ou efeitos (ou dados/descrição)!');
            return;
        }

        updateFicha((ficha) => {
            if (!ficha.poderes) ficha.poderes = [];

            if (poderEditandoId) {
                const ix = ficha.poderes.findIndex(p => p.id === poderEditandoId);
                if (ix !== -1) {
                    ficha.poderes[ix].nome = n;
                    ficha.poderes[ix].descricao = descricaoPoder; 
                    ficha.poderes[ix].categoria = abaAtual;
                    ficha.poderes[ix].efeitos = JSON.parse(JSON.stringify(efeitosTemp));
                    ficha.poderes[ix].efeitosPassivos = JSON.parse(JSON.stringify(efeitosTempPassivos));
                    ficha.poderes[ix].imagemUrl = imagemUrl;
                    ficha.poderes[ix].dadosQtd = parseInt(dadosQtd) || 0;
                    ficha.poderes[ix].dadosFaces = parseInt(dadosFaces) || 20;
                    ficha.poderes[ix].custoPercentual = parseFloat(custoPercentual) || 0;
                    ficha.poderes[ix].alcance = parseFloat(poderAlcance) || 1;
                    ficha.poderes[ix].armaVinculada = armaVinculada;
                }
            } else {
                ficha.poderes.push({
                    id: Date.now(),
                    nome: n,
                    descricao: descricaoPoder, 
                    categoria: abaAtual,
                    ativa: false,
                    efeitos: JSON.parse(JSON.stringify(efeitosTemp)),
                    efeitosPassivos: JSON.parse(JSON.stringify(efeitosTempPassivos)),
                    imagemUrl: imagemUrl,
                    dadosQtd: parseInt(dadosQtd) || 0,
                    dadosFaces: parseInt(dadosFaces) || 20,
                    custoPercentual: parseFloat(custoPercentual) || 0,
                    alcance: parseFloat(poderAlcance) || 1,
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
        const p = (minhaFicha?.poderes || []).find(po => po.id === id);
        if (!p) return;
        
        if (p.ativa) {
            togglePoder(id);
            alert(`A técnica [${p.nome}] foi DESATIVADA temporariamente para edição.`);
        }
        
        setPoderEditandoId(p.id);
        setAbaAtual(p.categoria || 'poder');
        setNomePoder(p.nome);
        setDescricaoPoder(p.descricao || ''); 
        setImagemUrl(p.imagemUrl || '');
        setDadosQtd(p.dadosQtd || 0);
        setDadosFaces(p.dadosFaces || 20);
        setCustoPercentual(p.custoPercentual || 0);
        setPoderAlcance(p.alcance || 1);
        setArmaVinculada(p.armaVinculada || '');
        setEfeitosTemp(JSON.parse(JSON.stringify(p.efeitos || [])));
        setEfeitosTempPassivos(JSON.parse(JSON.stringify(p.efeitosPassivos || [])));

        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelarEdicaoPoder = () => {
        setPoderEditandoId(null);
        setNomePoder('');
        setDescricaoPoder(''); 
        setImagemUrl('');
        setDadosQtd(0);
        setDadosFaces(20);
        setCustoPercentual(0);
        setPoderAlcance(1);
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
        const p = (minhaFicha?.poderes || []).find(po => po.id === id);
        if (p && p.ativa) togglePoder(id);

        updateFicha((ficha) => { ficha.poderes = (ficha.poderes || []).filter(po => po.id !== id); });
        salvarFichaSilencioso();
    };

    const vincularArmaAoPoder = (poderId, armaId) => {
        updateFicha((ficha) => {
            if (!ficha.poderes) return;
            const p = ficha.poderes.find(po => po.id === poderId);
            if (p) p.armaVinculada = armaId;
        });
        setVincularAberto(null);
        salvarFichaSilencioso();
    };

    const salvarFormaPoder = (poderId, forma) => {
        updateFicha((ficha) => {
            const p = (ficha.poderes || []).find(po => po.id === poderId);
            if (!p) return;
            if (!p.formas) p.formas = [];
            const ix = p.formas.findIndex(f => f.id === forma.id);
            if (ix !== -1) {
                p.formas[ix] = forma;
            } else {
                p.formas.push(forma);
            }
        });
        salvarFichaSilencioso();
    };

    const deletarFormaPoder = (poderId, formaId) => {
        updateFicha((ficha) => {
            const p = (ficha.poderes || []).find(po => po.id === poderId);
            if (!p) return;
            p.formas = (p.formas || []).filter(f => f.id !== formaId);
            if (p.formaAtivaId === formaId) p.formaAtivaId = null;
        });
        salvarFichaSilencioso();
    };

    const ativarFormaPoder = (poderId, formaId) => {
        const vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
        updateFicha((ficha) => {
            const p = (ficha.poderes || []).find(po => po.id === poderId);
            if (!p) return;
            const oldM = {};
            vitais.forEach(v => { oldM[v] = getMaximo(ficha, v) || 1; });
            p.formaAtivaId = formaId;
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

    // 🔥 LÓGICA DA HIERARQUIA DE DOMÍNIOS E TEXTOS NARRATIVOS 🔥
    const hierarquia = minhaFicha?.hierarquia || {};
    const hPoder = hierarquia.poder || false;
    const hInfinity = hierarquia.infinity || false;
    const hSingularidade = hierarquia.singularidade || '';

    const [hTextos, setHTextos] = useState({
        poderNome: '', poderDesc: '',
        infinityNome: '', infinityDesc: '',
        singularidadeNome: '', singularidadeDesc: ''
    });
    const [salvandoClassificacao, setSalvandoClassificacao] = useState(false);

    useEffect(() => {
        const h = minhaFicha?.hierarquia || {};
        setHTextos({
            poderNome: h.poderNome || '',
            poderDesc: h.poderDesc || '',
            infinityNome: h.infinityNome || '',
            infinityDesc: h.infinityDesc || '',
            singularidadeNome: h.singularidadeNome || '',
            singularidadeDesc: h.singularidadeDesc || ''
        });
    }, [
        minhaFicha?.hierarquia?.poderNome, minhaFicha?.hierarquia?.poderDesc, 
        minhaFicha?.hierarquia?.infinityNome, minhaFicha?.hierarquia?.infinityDesc, 
        minhaFicha?.hierarquia?.singularidadeNome, minhaFicha?.hierarquia?.singularidadeDesc
    ]);

    const salvarHierarquia = (p, i, s) => {
        if (!isMestre) return; // Proteção extra no código
        updateFicha(f => {
            if (!f.hierarquia) f.hierarquia = {};
            f.hierarquia.poder = p;
            f.hierarquia.infinity = i;
            f.hierarquia.singularidade = s;
        });
        salvarFichaSilencioso();
    };

    const salvarTextosHierarquia = () => {
        if (!isMestre) return; // Proteção extra no código
        updateFicha(f => {
            if (!f.hierarquia) f.hierarquia = {};
            f.hierarquia.poderNome = hTextos.poderNome;
            f.hierarquia.poderDesc = hTextos.poderDesc;
            f.hierarquia.infinityNome = hTextos.infinityNome;
            f.hierarquia.infinityDesc = hTextos.infinityDesc;
            f.hierarquia.singularidadeNome = hTextos.singularidadeNome;
            f.hierarquia.singularidadeDesc = hTextos.singularidadeDesc;
        });
        salvarFichaSilencioso();
        setSalvandoClassificacao(true);
        setTimeout(() => setSalvandoClassificacao(false), 2000);
    };

    let tituloSupremo = 'MUNDANO';
    let corSuprema = '#555';
    let glowSupremo = 'none';
    let nomeHabilidadeDestaque = '';

    if (hSingularidade === '0') {
        tituloSupremo = 'SINGULARIDADE GRAU 0 (MARCADO)';
        corSuprema = '#ff00ff';
        glowSupremo = '0 0 20px rgba(255, 0, 255, 0.8)';
        nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '1') {
        tituloSupremo = 'SINGULARIDADE GRAU 1 (NASCIDA)';
        corSuprema = '#ff003c';
        glowSupremo = '0 0 20px rgba(255, 0, 60, 0.8)';
        nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '2') {
        tituloSupremo = 'SINGULARIDADE GRAU 2 (DESENVOLVIDA)';
        corSuprema = '#ff8800';
        glowSupremo = '0 0 20px rgba(255, 136, 0, 0.8)';
        nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '3') {
        tituloSupremo = 'SINGULARIDADE GRAU 3 (HERDADA)';
        corSuprema = '#ffcc00';
        glowSupremo = '0 0 20px rgba(255, 204, 0, 0.8)';
        nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hInfinity) {
        tituloSupremo = 'INFINITY (MANIPULAÇÃO ABSOLUTA)';
        corSuprema = '#00ccff';
        glowSupremo = '0 0 20px rgba(0, 204, 255, 0.8)';
        nomeHabilidadeDestaque = hTextos.infinityNome;
    } else if (hPoder) {
        tituloSupremo = 'PODER (RESSONÂNCIA NATURAL)';
        corSuprema = '#00ffcc';
        glowSupremo = '0 0 20px rgba(0, 255, 204, 0.8)';
        nomeHabilidadeDestaque = hTextos.poderNome;
    }

    const armasEquipadas = (minhaFicha?.inventario || []).filter(i => i.tipo === 'arma' && i.equipado);
    const poderesGlobais = minhaFicha?.poderes || [];
    const passivas = minhaFicha?.passivas || [];
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
                    <button className={`btn-neon ${abaAtual === 'classificacao' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('classificacao'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                        👑 CLASSIFICAÇÃO
                    </button>
                </div>
            </div>

            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {abaAtual === 'classificacao' ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {!isMestre && (
                            <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid #f00', padding: '15px', borderRadius: '5px', color: '#f00', textAlign: 'center', fontWeight: 'bold', textShadow: '0 0 5px #f00' }}>
                                🔒 MODO LEITURA: Apenas o Mestre pode forjar e alterar Domínios Místicos.
                            </div>
                        )}

                        <div className="def-box" style={{ textAlign: 'center', padding: '30px', border: `2px solid ${corSuprema}`, boxShadow: glowSupremo, background: 'rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle, ${corSuprema}30 0%, rgba(0,0,0,0) 70%)`, pointerEvents: 'none' }} />
                            <h2 style={{ color: '#fff', fontSize: '1.2em', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>Grau de Calamidade Atual</h2>
                            
                            <div style={{ fontSize: '2.5em', fontWeight: '900', color: corSuprema, textShadow: glowSupremo, textTransform: 'uppercase', letterSpacing: '3px', position: 'relative', zIndex: 1 }}>
                                {tituloSupremo}
                            </div>
                            
                            {nomeHabilidadeDestaque && (
                                <div style={{ color: '#fff', fontSize: '1.8em', fontWeight: 'bold', fontStyle: 'italic', marginTop: '10px', textShadow: '0 0 10px #000', position: 'relative', zIndex: 1 }}>
                                    "{nomeHabilidadeDestaque}"
                                </div>
                            )}

                            <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '15px', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                                O sistema rastreia as suas capacidades e irradia a anomalia mais forte que corre nas suas veias.
                            </p>
                        </div>

                        <div className="def-box" style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: isMestre ? 1 : 0.8 }}>
                            <h3 style={{ color: '#0ff', margin: 0, borderBottom: '1px solid rgba(0,255,255,0.3)', paddingBottom: '10px' }}>Domínios Místicos</h3>

                            {/* 🔥 BLOCO DA CATEGORIA 1: PODER 🔥 */}
                            <div style={{ padding: '15px', background: hPoder ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hPoder ? '#00ffcc' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                                    <input type="checkbox" checked={hPoder} onChange={e => salvarHierarquia(e.target.checked, hInfinity, hSingularidade)} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                                    <div>
                                        <div style={{ color: hPoder ? '#00ffcc' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hPoder ? '0 0 10px #00ffcc' : 'none' }}>✨ Categoria 1: Poder</div>
                                        <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>Ressonância Natural. Habilidade inata que usa as 3 energias (Mana, Aura e Chakra) para escalar o seu impacto, mas <strong>não gasta nenhuma (Custo Zero)</strong>.</div>
                                    </div>
                                </label>
                                
                                {hPoder && (
                                    <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(0, 255, 204, 0.3)' }}>
                                        <input className="input-neon" type="text" placeholder="Nome do seu Poder (Ex: Chamas do Purgatório)" value={hTextos.poderNome} onChange={e => setHTextos({...hTextos, poderNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#00ffcc', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                                        <textarea className="input-neon" placeholder="Descreva como a ressonância da sua habilidade se manifesta na realidade..." value={hTextos.poderDesc} onChange={e => setHTextos({...hTextos, poderDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#00ffcc', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                                    </div>
                                )}
                            </div>

                            {/* 🔥 BLOCO DA CATEGORIA 2: INFINITY 🔥 */}
                            <div style={{ padding: '15px', background: hInfinity ? 'rgba(0, 204, 255, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hInfinity ? '#00ccff' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                                    <input type="checkbox" checked={hInfinity} onChange={e => salvarHierarquia(hPoder, e.target.checked, hSingularidade)} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                                    <div>
                                        <div style={{ color: hInfinity ? '#00ccff' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hInfinity ? '0 0 10px #00ccff' : 'none' }}>🌌 Categoria 2: Infinity</div>
                                        <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>Manipulação Absoluta. Controle infinito e conceitual de uma habilidade, seja ela uma força física (Gelo Absoluto) ou abstrata (Adaptação).</div>
                                    </div>
                                </label>

                                {hInfinity && (
                                    <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(0, 204, 255, 0.3)' }}>
                                        <input className="input-neon" type="text" placeholder="Nome do seu Infinity (Ex: Frio Zero Absoluto)" value={hTextos.infinityNome} onChange={e => setHTextos({...hTextos, infinityNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#00ccff', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                                        <textarea className="input-neon" placeholder="Descreva as leis conceituais e limites dessa manipulação infinita..." value={hTextos.infinityDesc} onChange={e => setHTextos({...hTextos, infinityDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#00ccff', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                                    </div>
                                )}
                            </div>

                            {/* 🔥 BLOCO DA CATEGORIA 3: SINGULARIDADE 🔥 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: hSingularidade ? 'rgba(255, 0, 255, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hSingularidade ? '#ff00ff' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                                    <input type="checkbox" checked={!!hSingularidade} onChange={e => { const val = e.target.checked ? '3' : ''; salvarHierarquia(hPoder, hInfinity, val); }} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                                    <div>
                                        <div style={{ color: hSingularidade ? '#ff00ff' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hSingularidade ? '0 0 10px #ff00ff' : 'none' }}>👑 Categoria 3: Singularidade</div>
                                        <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>A Anomalia Máxima. Uma falha na própria realidade. Existem menos de 200 no multiverso inteiro (Trilhões de anos).</div>
                                    </div>
                                </label>

                                {hSingularidade && (
                                    <div className="fade-in" style={{ marginTop: '10px', paddingLeft: '45px', borderLeft: '2px solid #ff00ff', marginLeft: '10px' }}>
                                        <label style={{ color: '#ffcc00', fontSize: '0.9em', fontWeight: 'bold' }}>Selecione o Grau da sua Singularidade:</label>
                                        <select 
                                            className="input-neon" 
                                            value={hSingularidade} 
                                            onChange={e => salvarHierarquia(hPoder, hInfinity, e.target.value)} 
                                            disabled={!isMestre}
                                            style={{ width: '100%', marginTop: '8px', marginBottom: '15px', borderColor: corSuprema, color: corSuprema, background: '#111', fontSize: '1em', padding: '10px', textShadow: `0 0 5px ${corSuprema}`, opacity: isMestre ? 1 : 0.7, cursor: isMestre ? 'pointer' : 'not-allowed' }}
                                        >
                                            <option value="3">Grau 3: Herdada (Poder transferido ou roubado)</option>
                                            <option value="2">Grau 2: Desenvolvida (Evoluída além do limite de um Poder/Infinity)</option>
                                            <option value="1">Grau 1: Nascida (Anomalia inata desde o berço)</option>
                                            <option value="0">Grau 0: Marcado Nascido (O próprio Marcado já nasce como Singularidade)</option>
                                        </select>

                                        <div style={{ paddingTop: '15px', borderTop: '1px dashed rgba(255, 0, 255, 0.3)' }}>
                                            <input className="input-neon" type="text" placeholder="Nome da Singularidade (Ex: All For One)" value={hTextos.singularidadeNome} onChange={e => setHTextos({...hTextos, singularidadeNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#ff00ff', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                                            <textarea className="input-neon" placeholder="Descreva como essa anomalia cósmica quebra as regras do universo..." value={hTextos.singularidadeDesc} onChange={e => setHTextos({...hTextos, singularidadeDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#ff00ff', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isMestre && (
                                <button 
                                    className="btn-neon btn-gold" 
                                    onClick={salvarTextosHierarquia} 
                                    style={{ 
                                        marginTop: '10px', width: '100%', padding: '12px', fontSize: '1.1em', letterSpacing: '1px',
                                        backgroundColor: salvandoClassificacao ? 'rgba(0, 255, 100, 0.2)' : undefined,
                                        borderColor: salvandoClassificacao ? '#00ffcc' : undefined,
                                        color: salvandoClassificacao ? '#fff' : undefined
                                    }}
                                >
                                    {salvandoClassificacao ? '💾 REGISTROS MÍSTICOS SALVOS!' : '💾 SALVAR NOMES E DESCRIÇÕES'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    // FORMULÁRIO PADRÃO DE HABILIDADES/PODERES E LISTA
                    <>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
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
                                    <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Alcance (Q)</label>
                                    <input className="input-neon" type="number" min="0" step="0.5" value={poderAlcance} onChange={e => setPoderAlcance(e.target.value)} style={{ borderColor: '#00ffcc', color: '#00ffcc' }} />
                                </div>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Vincular Arma</label>
                                    <select className="input-neon" value={armaVinculada} onChange={e => setArmaVinculada(e.target.value)}>
                                        <option value="">Nenhuma (Livre)</option>
                                        {(minhaFicha?.inventario || []).filter(i => i.tipo === 'arma').map(arma => (
                                            <option key={arma.id} value={String(arma.id)}>{arma.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <textarea 
                                className="input-neon" 
                                placeholder="Descrição / Efeito Narrativo (O que essa habilidade faz visualmente e narrativamente?)" 
                                value={descricaoPoder} 
                                onChange={e => setDescricaoPoder(e.target.value)} 
                                style={{ width: '100%', minHeight: '60px', marginTop: 15, borderColor: '#555', color: '#ccc', fontStyle: 'italic' }} 
                            />

                            <h4 style={{ color: '#0ff', marginTop: 15, marginBottom: 8, fontSize: '0.95em' }}>Efeitos Matemáticos Ativos</h4>
                            <input className="input-neon" type="text" placeholder="Nome do Efeito" value={nomeEfeito} onChange={e => setNomeEfeito(e.target.value)} style={{ marginTop: 5 }} />
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
                                {efeitosTemp.map((e, i) => {
                                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                                    return (
                                        <div key={i} style={{ color: '#0ff', fontSize: '0.9em', marginBottom: 5, background: 'rgba(0,255,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #0ff', display: 'flex', justifyContent: 'space-between' }}>
                                            <span><strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                                            <button onClick={() => removerEfeitoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                                        </div>
                                    );
                                })}
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
                                {efeitosTempPassivos.map((e, i) => {
                                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                                    return (
                                        <div key={i} style={{ color: '#f0f', fontSize: '0.9em', marginBottom: 5, background: 'rgba(255,0,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #f0f', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>PASSIVO: <strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
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
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>{p.nome || 'Poder'} <span style={{fontSize: '0.6em', color: '#fff'}}>(Alcance: {p.alcance || 1}Q)</span></h3>
                                                    
                                                    {p.descricao && (
                                                        <div style={{ color: '#ccc', fontSize: '0.85em', fontStyle: 'italic', margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: `2px solid ${c}` }}>
                                                            "{p.descricao}"
                                                        </div>
                                                    )}

                                                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0' }}>{txtArr.join(' | ') || 'Sem efeitos ativos.'}
                                                    {(p.efeitosPassivos || []).length > 0 && (
                                                        <span style={{ color: '#f0f', display: 'block', marginTop: '4px' }}>{(p.efeitosPassivos || []).map(e => {
                                                            if (!e) return '';
                                                            return `PASSIVO: [${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: +${e.valor || 0}`;
                                                        }).filter(Boolean).join(' | ')}</span>
                                                    )}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                    <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }} onClick={() => togglePoder(p.id)}>{p.ativa ? 'LIGADO' : 'DESLIGADO'}</button>
                                                    <div style={{ position: 'relative' }} ref={vincularAberto === p.id ? vincularRef : null}>
                                                            <button
                                                                className={`btn-neon ${p.armaVinculada ? 'btn-gold' : ''}`}
                                                                style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                                                                onClick={() => setVincularAberto(vincularAberto === p.id ? null : p.id)}
                                                            >
                                                                {p.armaVinculada ? `⚔️ ${((minhaFicha?.inventario || []).find(i => String(i.id) === String(p.armaVinculada))?.nome) || 'Arma'}` : '🔗 VINCULAR'}
                                                            </button>
                                                            {vincularAberto === p.id && (
                                                                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10, background: '#0a0a1a', border: '1px solid #0ff', borderRadius: 6, padding: 5, minWidth: 180, marginTop: 4 }}>
                                                                    <button
                                                                        className="btn-neon"
                                                                        style={{ width: '100%', padding: '5px 10px', fontSize: '0.85em', margin: '2px 0', borderColor: !p.armaVinculada ? '#0f0' : '#555', color: !p.armaVinculada ? '#0f0' : '#aaa' }}
                                                                        onClick={() => vincularArmaAoPoder(p.id, '')}
                                                                    >
                                                                        Nenhuma (Livre)
                                                                    </button>
                                                                    {armasEquipadas.map(arma => (
                                                                        <button
                                                                            key={arma.id}
                                                                            className="btn-neon"
                                                                            style={{ width: '100%', padding: '5px 10px', fontSize: '0.85em', margin: '2px 0', borderColor: String(p.armaVinculada) === String(arma.id) ? '#ffcc00' : '#0ff', color: String(p.armaVinculada) === String(arma.id) ? '#ffcc00' : '#0ff' }}
                                                                            onClick={() => vincularArmaAoPoder(p.id, String(arma.id))}
                                                                        >
                                                                            ⚔️ {arma.nome}
                                                                        </button>
                                                                    ))}
                                                                    {armasEquipadas.length === 0 && (
                                                                        <p style={{ color: '#888', fontSize: '0.8em', margin: '5px 0', textAlign: 'center' }}>Nenhuma arma equipada</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => editarPoder(p.id)}>EDITAR</button>
                                                    <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => deletarPoder(p.id)}>APAGAR</button>
                                                </div>
                                            </div>
                                            <FormasEditor
                                                formas={p.formas || []}
                                                formaAtivaId={p.formaAtivaId || null}
                                                onSalvarForma={(forma) => salvarFormaPoder(p.id, forma)}
                                                onDeletarForma={(formaId) => deletarFormaPoder(p.id, formaId)}
                                                onAtivarForma={(formaId) => ativarFormaPoder(p.id, formaId)}
                                            />
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
                    </>
                )}
            </div>
        </div>
    );
}