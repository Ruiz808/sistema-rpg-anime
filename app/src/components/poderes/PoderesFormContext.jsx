import React, { createContext, useContext, useState, useRef, useMemo, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';

export const SINGULAR = {
    'habilidade': 'Habilidade',
    'forma': 'Forma',
    'poder': 'Poder',
    'classificacao': 'Classificação'
};

const PoderesFormContext = createContext(null);

export function usePoderesForm() {
    const ctx = useContext(PoderesFormContext);
    if (!ctx) return null;
    return ctx;
}

export function PoderesFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const isMestre = useStore(s => s.isMestre);
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
    const [poderVertente, setPoderVertente] = useState('');
    const [poderElemento, setPoderElemento] = useState('');
    const [imagemUrl, setImagemUrl] = useState('');
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    const [custoPercentual, setCustoPercentual] = useState(0);
    const [poderAlcance, setPoderAlcance] = useState(1); 
    const [poderArea, setPoderArea] = useState(0);
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

    const [poderPreparandoId, setPoderPreparandoId] = useState(null);
    const [overchargeAtivo, setOverchargeAtivo] = useState(false);

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

    const addEfeitoTemp = useCallback(() => {
        if (!novoVal || !nomeEfeito.trim()) { alert('Preencha o nome e o valor do efeito!'); return; }
        setEfeitosTemp([...efeitosTemp, { nome: nomeEfeito.trim(), atributo: novoAtr, propriedade: novoProp, valor: novoVal }]);
        setNovoVal('');
        setNomeEfeito('');
    }, [novoVal, nomeEfeito, novoAtr, novoProp, efeitosTemp, setEfeitosTemp]);

    const removerEfeitoTemp = useCallback((index) => {
        setEfeitosTemp(efeitosTemp.filter((_, i) => i !== index));
    }, [efeitosTemp, setEfeitosTemp]);

    const addEfeitoPassivoTemp = useCallback(() => {
        if (!novoValPassivo || !nomeEfeitoPassivo.trim()) { alert('Preencha o nome e o valor do efeito passivo!'); return; }
        setEfeitosTempPassivos([...efeitosTempPassivos, { nome: nomeEfeitoPassivo.trim(), atributo: novoAtrPassivo, propriedade: novoPropPassivo, valor: novoValPassivo }]);
        setNovoValPassivo('');
        setNomeEfeitoPassivo('');
    }, [novoValPassivo, nomeEfeitoPassivo, novoAtrPassivo, novoPropPassivo, efeitosTempPassivos, setEfeitosTempPassivos]);

    const removerEfeitoPassivoTemp = useCallback((index) => {
        setEfeitosTempPassivos(efeitosTempPassivos.filter((_, i) => i !== index));
    }, [efeitosTempPassivos, setEfeitosTempPassivos]);

    const handleImageUpload = useCallback(async (e) => {
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
    }, [meuNome]);

    const cancelarEdicaoPoder = useCallback(() => {
        setPoderEditandoId(null);
        setNomePoder('');
        setDescricaoPoder(''); 
        setPoderVertente('');
        setPoderElemento('');
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
    }, [setPoderEditandoId, setEfeitosTemp, setEfeitosTempPassivos]);

    const salvarNovoPoder = useCallback(() => {
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
                    ficha.poderes[ix].vertente = poderVertente; 
                    ficha.poderes[ix].elemento = poderElemento; 
                    ficha.poderes[ix].categoria = abaAtual;
                    ficha.poderes[ix].efeitos = JSON.parse(JSON.stringify(efeitosTemp));
                    ficha.poderes[ix].efeitosPassivos = JSON.parse(JSON.stringify(efeitosTempPassivos));
                    ficha.poderes[ix].imagemUrl = imagemUrl;
                    ficha.poderes[ix].dadosQtd = parseInt(dadosQtd) || 0;
                    ficha.poderes[ix].dadosFaces = parseInt(dadosFaces) || 20;
                    ficha.poderes[ix].custoPercentual = parseFloat(custoPercentual) || 0;
                    ficha.poderes[ix].alcance = parseFloat(poderAlcance) || 1;
                    ficha.poderes[ix].area = parseFloat(poderArea) || 1;
                    ficha.poderes[ix].armaVinculada = armaVinculada;
                }
            } else {
                ficha.poderes.push({
                    id: Date.now(),
                    nome: n,
                    descricao: descricaoPoder, 
                    vertente: poderVertente, 
                    elemento: poderElemento, 
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
    }, [nomePoder, efeitosTemp, efeitosTempPassivos, dadosQtd, descricaoPoder, updateFicha, poderEditandoId, poderVertente, poderElemento, abaAtual, imagemUrl, dadosFaces, custoPercentual, poderAlcance, poderArea, armaVinculada, cancelarEdicaoPoder]);

    const togglePoder = useCallback((id) => {
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
    }, [updateFicha]);

    const editarPoder = useCallback((id) => {
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
        setPoderVertente(p.vertente || ''); 
        setPoderElemento(p.elemento || ''); 
        setImagemUrl(p.imagemUrl || '');
        setDadosQtd(p.dadosQtd || 0);
        setDadosFaces(p.dadosFaces || 20);
        setCustoPercentual(p.custoPercentual || 0);
        setPoderAlcance(p.alcance || 1);
        setPoderArea(p.area || 1);
        setArmaVinculada(p.armaVinculada || '');
        setEfeitosTemp(JSON.parse(JSON.stringify(p.efeitos || [])));
        setEfeitosTempPassivos(JSON.parse(JSON.stringify(p.efeitosPassivos || [])));

        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [minhaFicha, setPoderEditandoId, setEfeitosTemp, setEfeitosTempPassivos, togglePoder]);

    const deletarPoder = useCallback((id) => {
        if (!window.confirm('Tem certeza que deseja apagar permanentemente?')) return;
        const p = (minhaFicha?.poderes || []).find(po => po.id === id);
        if (p && p.ativa) togglePoder(id);

        updateFicha((ficha) => { ficha.poderes = (ficha.poderes || []).filter(po => po.id !== id); });
        salvarFichaSilencioso();
    }, [minhaFicha, togglePoder, updateFicha]);

    const vincularArmaAoPoder = useCallback((poderId, armaId) => {
        updateFicha((ficha) => {
            if (!ficha.poderes) return;
            const p = ficha.poderes.find(po => po.id === poderId);
            if (p) p.armaVinculada = armaId;
        });
        setVincularAberto(null);
        salvarFichaSilencioso();
    }, [updateFicha]);

    const salvarFormaPoder = useCallback((poderId, forma) => {
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
    }, [updateFicha]);

    const deletarFormaPoder = useCallback((poderId, formaId) => {
        updateFicha((ficha) => {
            const p = (ficha.poderes || []).find(po => po.id === poderId);
            if (!p) return;
            p.formas = (p.formas || []).filter(f => f.id !== formaId);
            if (p.formaAtivaId === formaId) p.formaAtivaId = null;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const ativarFormaPoder = useCallback((poderId, formaId) => {
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
    }, [updateFicha]);

    const hierarquia = minhaFicha?.hierarquia || {};
    const hPoder = hierarquia.poder || false;
    const hInfinity = hierarquia.infinity || false;
    const hSingularidade = hierarquia.singularidade || '';

    const [hTextos, setHTextos] = useState({
        poderNome: '', poderDesc: '', poderVertente: '',
        infinityNome: '', infinityDesc: '', infinityVertente: '',
        singularidadeNome: '', singularidadeDesc: ''
    });
    const [salvandoClassificacao, setSalvandoClassificacao] = useState(false);

    useEffect(() => {
        const h = minhaFicha?.hierarquia || {};
        setHTextos({
            poderNome: h.poderNome || '', poderDesc: h.poderDesc || '', poderVertente: h.poderVertente || '',
            infinityNome: h.infinityNome || '', infinityDesc: h.infinityDesc || '', infinityVertente: h.infinityVertente || '',
            singularidadeNome: h.singularidadeNome || '', singularidadeDesc: h.singularidadeDesc || ''
        });
    }, [
        minhaFicha?.hierarquia?.poderNome, minhaFicha?.hierarquia?.poderDesc, minhaFicha?.hierarquia?.poderVertente, 
        minhaFicha?.hierarquia?.infinityNome, minhaFicha?.hierarquia?.infinityDesc, minhaFicha?.hierarquia?.infinityVertente, 
        minhaFicha?.hierarquia?.singularidadeNome, minhaFicha?.hierarquia?.singularidadeDesc
    ]);

    const salvarHierarquia = useCallback((p, i, s) => {
        if (!isMestre) return;
        updateFicha(f => {
            if (!f.hierarquia) f.hierarquia = {};
            f.hierarquia.poder = p;
            f.hierarquia.infinity = i;
            f.hierarquia.singularidade = s;
        });
        salvarFichaSilencioso();
    }, [isMestre, updateFicha]);

    const salvarTextosHierarquia = useCallback(() => {
        if (!isMestre) return;
        updateFicha(f => {
            if (!f.hierarquia) f.hierarquia = {};
            f.hierarquia.poderNome = hTextos.poderNome;
            f.hierarquia.poderDesc = hTextos.poderDesc;
            f.hierarquia.poderVertente = hTextos.poderVertente;
            f.hierarquia.infinityNome = hTextos.infinityNome;
            f.hierarquia.infinityDesc = hTextos.infinityDesc;
            f.hierarquia.infinityVertente = hTextos.infinityVertente;
            f.hierarquia.singularidadeNome = hTextos.singularidadeNome;
            f.hierarquia.singularidadeDesc = hTextos.singularidadeDesc;
        });
        salvarFichaSilencioso();
        setSalvandoClassificacao(true);
        setTimeout(() => setSalvandoClassificacao(false), 2000);
    }, [isMestre, updateFicha, hTextos]);

    const armasEquipadas = useMemo(() => (minhaFicha?.inventario || []).filter(i => i.tipo === 'arma' && i.equipado), [minhaFicha]);
    const poderesGlobais = minhaFicha?.poderes || [];
    const passivas = minhaFicha?.passivas || [];
    const itensFiltrados = useMemo(() => poderesGlobais.filter(p => (p.categoria || 'poder') === abaAtual), [poderesGlobais, abaAtual]);

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

    const getAtualVital = useCallback((key) => {
        if (!minhaFicha) return 0;
        const max = getMaximo(minhaFicha, key);
        if (minhaFicha[key] && minhaFicha[key].atual !== undefined) return minhaFicha[key].atual;
        return max;
    }, [minhaFicha]);

    const curMana = getAtualVital('mana');
    const curAura = getAtualVital('aura');
    const curChakra = getAtualVital('chakra');
    const energiaElemental = curMana + curAura + curChakra;
    const mPotencial = minhaFicha?.dano?.mPotencial || 1;
    const danoBruto = minhaFicha?.dano?.danoBruto || 0;

    // 🔥 BLINDAGEM CONDICIONAL ANTI-CASE SENSITIVE NO DISPARO 🔥
    const dispararAtaque = useCallback((poder) => {
        let custoFinalPerc = poder.custoPercentual || 0;
        const vertenteLower = (poder.vertente || '').toLowerCase();
        const isHabilidadeElemental = vertenteLower.includes('elemental'); 

        if (isHabilidadeElemental) {
            custoFinalPerc = overchargeAtivo ? (poder.custoPercentual * 2) : 0;
        }

        if (custoFinalPerc > 0) {
            updateFicha(ficha => {
                ['mana', 'aura', 'chakra'].forEach(v => {
                    let max = getMaximo(ficha, v);
                    let drain = Math.floor(max * (custoFinalPerc / 100));
                    let curr = ficha[v]?.atual !== undefined ? ficha[v].atual : max;
                    if (!ficha[v]) ficha[v] = {};
                    ficha[v].atual = Math.max(0, curr - drain);
                });
            });
            salvarFichaSilencioso();
        }

        let msg = `[ ${poder.nome.toUpperCase()} ] disparado!\n\n`;
        msg += `🎲 Dano Base dos Dados: ${poder.dadosQtd}d${poder.dadosFaces}\n`;
        msg += `➕ Dano Bruto da Ficha: +${danoBruto}\n`;

        if (isHabilidadeElemental) {
            msg += `🌪️ Ressonância do Elemento (${poder.elemento}): +${energiaElemental}\n`;
            if (overchargeAtivo) {
                msg += `\n🔥 OVERCHARGE ATIVADO!\n`;
                msg += `   ↳ Multiplicador Potencial Aplicado: x${mPotencial}\n`;
                let danoTotalFlat = Math.floor((danoBruto + energiaElemental) * mPotencial);
                msg += `💥 Dano Flat Estimado (Sem os dados): ${danoTotalFlat}\n`;
                msg += `🔻 Custo Aplicado: ${custoFinalPerc}% drenado da Mana, Aura e Chakra.\n`;
            } else {
                let danoTotalFlat = danoBruto + energiaElemental;
                msg += `💥 Dano Flat Estimado (Sem os dados): ${danoTotalFlat}\n`;
                msg += `💸 Custo: ZERO (Ressonância da Natureza).\n`;
            }
        } else {
            let danoTotalFlat = danoBruto;
            msg += `💥 Dano Flat Estimado (Sem os dados): ${danoTotalFlat}\n`;
            msg += `🔻 Custo Aplicado: ${custoFinalPerc}% drenado das Energias.\n`;
        }

        alert(msg);
        setPoderPreparandoId(null);
        setOverchargeAtivo(false);
    }, [overchargeAtivo, updateFicha, danoBruto, energiaElemental, mPotencial]);

    const value = useMemo(() => ({
        minhaFicha, meuNome, isMestre, abaAtual, setAbaAtual,
        nomePoder, setNomePoder, descricaoPoder, setDescricaoPoder,
        poderVertente, setPoderVertente, poderElemento, setPoderElemento,
        imagemUrl, setImagemUrl, dadosQtd, setDadosQtd, dadosFaces, setDadosFaces,
        custoPercentual, setCustoPercentual, poderAlcance, setPoderAlcance,
        poderArea, setPoderArea, armaVinculada, setArmaVinculada,
        nomeEfeito, setNomeEfeito, novoAtr, setNovoAtr, novoProp, setNovoProp, novoVal, setNovoVal,
        nomeEfeitoPassivo, setNomeEfeitoPassivo, novoAtrPassivo, setNovoAtrPassivo,
        novoPropPassivo, setNovoPropPassivo, novoValPassivo, setNovoValPassivo,
        uploadingImg, setUploadingImg, vincularAberto, setVincularAberto,
        poderPreparandoId, setPoderPreparandoId, overchargeAtivo, setOverchargeAtivo,
        formRef, vincularRef,
        addEfeitoTemp, removerEfeitoTemp, addEfeitoPassivoTemp, removerEfeitoPassivoTemp,
        handleImageUpload, salvarNovoPoder, editarPoder, cancelarEdicaoPoder,
        togglePoder, deletarPoder, vincularArmaAoPoder, salvarFormaPoder,
        deletarFormaPoder, ativarFormaPoder,
        hierarquia, hPoder, hInfinity, hSingularidade,
        hTextos, setHTextos, salvandoClassificacao,
        salvarHierarquia, salvarTextosHierarquia,
        armasEquipadas, itensFiltrados, relatorioAuditoria,
        curMana, curAura, curChakra, energiaElemental, mPotencial, danoBruto,
        dispararAtaque, efeitosTemp, efeitosTempPassivos, poderEditandoId
    }), [
        minhaFicha, meuNome, isMestre, abaAtual,
        nomePoder, descricaoPoder, poderVertente, poderElemento,
        imagemUrl, dadosQtd, dadosFaces, custoPercentual, poderAlcance,
        poderArea, armaVinculada, nomeEfeito, novoAtr, novoProp, novoVal,
        nomeEfeitoPassivo, novoAtrPassivo, novoPropPassivo, novoValPassivo,
        uploadingImg, vincularAberto, poderPreparandoId, overchargeAtivo,
        addEfeitoTemp, removerEfeitoTemp, addEfeitoPassivoTemp, removerEfeitoPassivoTemp,
        handleImageUpload, salvarNovoPoder, editarPoder, cancelarEdicaoPoder,
        togglePoder, deletarPoder, vincularArmaAoPoder, salvarFormaPoder,
        deletarFormaPoder, ativarFormaPoder,
        hierarquia, hPoder, hInfinity, hSingularidade,
        hTextos, salvandoClassificacao,
        salvarHierarquia, salvarTextosHierarquia,
        armasEquipadas, itensFiltrados, relatorioAuditoria,
        curMana, curAura, curChakra, energiaElemental, mPotencial, danoBruto,
        dispararAtaque, efeitosTemp, efeitosTempPassivos, poderEditandoId
    ]);

    return (
        <PoderesFormContext.Provider value={value}>
            {children}
        </PoderesFormContext.Provider>
    );
}