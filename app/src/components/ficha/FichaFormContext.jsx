import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo, getBuffs, getEfeitosDeClasse } from '../../core/attributes.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

export const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
export const ENERGIAS = ['mana', 'aura', 'chakra', 'corpo', 'pontosVitais', 'pontosMortais'];

export const ATRIBUTO_OPTIONS = [
    { value: 'forca', label: 'Forca' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' },
    { value: 'energiaEsp', label: 'Energia Espiritual' },
    { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' },
    { value: 'constituicao', label: 'Constituicao' },
    { value: 'vida', label: 'Vida' },
    { value: 'mana', label: 'Mana' },
    { value: 'aura', label: 'Aura' },
    { value: 'chakra', label: 'Chakra' },
    { value: 'corpo', label: 'Corpo' },
    { value: 'pontosVitais', label: 'Pontos Vitais' },
    { value: 'pontosMortais', label: 'Pontos Mortais' },
    { value: 'todos_status', label: 'TODOS OS STATUS' },
    { value: 'todas_energias', label: 'TODAS AS ENERGIAS' },
];

export const CLASSES_OPTIONS = [
    { value: '', label: 'Nenhuma / Mundano' },
    { value: 'saber', label: '⚔️ Saber' },
    { value: 'archer', label: '🏹 Archer' },
    { value: 'lancer', label: '🗡️ Lancer' },
    { value: 'rider', label: '🏇 Rider' },
    { value: 'caster', label: '🧙‍♂️ Caster' },
    { value: 'assassin', label: '🔪 Assassin' },
    { value: 'berserker', label: '狂 Berserker' },
    { value: 'shielder', label: '🛡️ Shielder' },
    { value: 'ruler', label: '⚖️ Ruler' },
    { value: 'avenger', label: '⛓️ Avenger' },
    { value: 'alterego', label: '🎭 Alter Ego' },
    { value: 'foreigner', label: '🐙 Foreigner' },
    { value: 'mooncancer', label: '🌕 Moon Cancer' },
    { value: 'pretender', label: '🤥 Pretender' },
    { value: 'beast', label: '👹 Beast' },
    { value: 'savior', label: '☀️ Savior' }
];

const FichaFormContext = createContext(null);

export function useFichaForm() {
    const ctx = useContext(FichaFormContext);
    if (!ctx) return null;
    return ctx;
}

export function FichaFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const personagens = useStore(s => s.personagens);
    const meuNome = useStore(s => s.meuNome);

    const [mesa, setMesa] = useState('presente'); 
    const [raca, setRaca] = useState('');
    const [classe, setClasse] = useState('');
    const [subClasse, setSubClasse] = useState(''); 
    const [alterEgoSlot1, setAlterEgoSlot1] = useState('');
    const [alterEgoSlot2, setAlterEgoSlot2] = useState('');
    const [classesMemorizadas, setClassesMemorizadas] = useState([]); 
    const [idade, setIdade] = useState('');
    const [fisico, setFisico] = useState('');
    const [sangue, setSangue] = useState('');
    const [alinhamento, setAlinhamento] = useState('');
    const [afiliacao, setAfiliacao] = useState('');
    const [dinheiro, setDinheiro] = useState('');
    const [salvandoBio, setSalvandoBio] = useState(false);

    const overridesCompendio = useMemo(() => {
        if (!minhaFicha) return {};
        if (minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for (let k of chaves) {
                if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides;
            }
        }
        return {};
    }, [minhaFicha, personagens]);

    const grands = overridesCompendio.grands || {};
    const isGrand = classe && grands[`${classe}_${mesa}`] === meuNome;
    const grandIcone = isGrand ? grands[`${classe}_${mesa}_icone`] : null;

    const carregarBio = useCallback(() => {
        const bio = minhaFicha?.bio || {};
        setMesa(bio.mesa || 'presente');
        setRaca(bio.raca || '');
        setClasse(bio.classe || '');
        setSubClasse(bio.subClasse || ''); 
        setAlterEgoSlot1(bio.alterEgoSlot1 || '');
        setAlterEgoSlot2(bio.alterEgoSlot2 || '');
        setClassesMemorizadas(bio.classesMemorizadas || []); 
        setIdade(bio.idade || '');
        setFisico(bio.fisico || '');
        setSangue(bio.sangue || '');
        setAlinhamento(bio.alinhamento || '');
        setAfiliacao(bio.afiliacao || '');
        setDinheiro(bio.dinheiro || '');
    }, [minhaFicha?.bio]);

    useEffect(() => { carregarBio(); }, [carregarBio]);

    const comitarBio = useCallback((overrides = {}) => {
        updateFicha((ficha) => {
            if (!ficha.bio) ficha.bio = {};
            ficha.bio.mesa = overrides.mesa !== undefined ? overrides.mesa : mesa;
            ficha.bio.raca = overrides.raca !== undefined ? overrides.raca : raca;
            ficha.bio.classe = overrides.classe !== undefined ? overrides.classe : classe;
            ficha.bio.subClasse = overrides.subClasse !== undefined ? overrides.subClasse : subClasse; 
            ficha.bio.alterEgoSlot1 = overrides.alterEgoSlot1 !== undefined ? overrides.alterEgoSlot1 : alterEgoSlot1;
            ficha.bio.alterEgoSlot2 = overrides.alterEgoSlot2 !== undefined ? overrides.alterEgoSlot2 : alterEgoSlot2;
            ficha.bio.classesMemorizadas = overrides.classesMemorizadas !== undefined ? overrides.classesMemorizadas : classesMemorizadas; 
            ficha.bio.idade = overrides.idade !== undefined ? overrides.idade : idade;
            ficha.bio.fisico = overrides.fisico !== undefined ? overrides.fisico : fisico;
            ficha.bio.sangue = overrides.sangue !== undefined ? overrides.sangue : sangue;
            ficha.bio.alinhamento = overrides.alinhamento !== undefined ? overrides.alinhamento : alinhamento;
            ficha.bio.afiliacao = overrides.afiliacao !== undefined ? overrides.afiliacao : afiliacao;
            ficha.bio.dinheiro = overrides.dinheiro !== undefined ? overrides.dinheiro : dinheiro;
        });
        salvarFichaSilencioso();
    }, [updateFicha, mesa, raca, classe, subClasse, alterEgoSlot1, alterEgoSlot2, classesMemorizadas, idade, fisico, sangue, alinhamento, afiliacao, dinheiro]);

    const salvarBio = useCallback(() => {
        comitarBio(); setSalvandoBio(true); setTimeout(() => setSalvandoBio(false), 2000);
    }, [comitarBio]);

    const mudarSubClasseDireto = useCallback((novaSub) => {
        setSubClasse(novaSub); comitarBio({ subClasse: novaSub });
    }, [comitarBio]);

    let multiplicadorFuriaClasse = 0;
    const scanFuria = (efs) => {
        if (!efs) return;
        efs.forEach(e => {
            if (!e) return;
            let p = (e.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (p === 'furia_berserker') { let v = parseFloat(e.valor) || 0; if (v > multiplicadorFuriaClasse) multiplicadorFuriaClasse = v; }
        });
    };

    if (minhaFicha) {
        (minhaFicha.poderes || []).forEach(p => { if (p && p.ativa) scanFuria(p.efeitos); scanFuria(p.efeitosPassivos); });
        (minhaFicha.inventario || []).forEach(i => { if (i && i.equipado) { scanFuria(i.efeitos); scanFuria(i.efeitosPassivos); } });
        (minhaFicha.passivas || []).forEach(p => scanFuria(p.efeitos));
        scanFuria(getEfeitosDeClasse(minhaFicha));
    }

    const rawMaxVida = minhaFicha ? getMaximo(minhaFicha, 'vida', true) : 1;
    const strVal = String(Math.floor(rawMaxVida));
    const pVit = Math.max(0, strVal.length - 8);
    const maxVida = pVit > 0 ? Math.floor(rawMaxVida / Math.pow(10, pVit)) : rawMaxVida;
    const atualVida = minhaFicha?.vida?.atual ?? maxVida;
    const percAtualLostFloor = Math.floor(maxVida > 0 ? Math.max(0, ((maxVida - atualVida) / maxVida) * 100) : 0);
    const furiaMax = minhaFicha?.combate?.furiaMax || 0;
    const percEfetivoParaDisplay = Math.max(percAtualLostFloor, furiaMax);

    let multiplicadorFuriaVisor = 0;
    if (percEfetivoParaDisplay === 1) multiplicadorFuriaVisor = multiplicadorFuriaClasse;
    else if (percEfetivoParaDisplay >= 2) multiplicadorFuriaVisor = percEfetivoParaDisplay;

    useEffect(() => {
        if (multiplicadorFuriaClasse > 0 && percAtualLostFloor > furiaMax) {
            updateFicha(f => { if (!f.combate) f.combate = {}; f.combate.furiaMax = percAtualLostFloor; });
            salvarFichaSilencioso();
        }
    }, [percAtualLostFloor, furiaMax, multiplicadorFuriaClasse, updateFicha]);

    const [furiaAcalmadaMsg, setFuriaAcalmadaMsg] = useState(false);
    const acalmarFuria = useCallback((e) => {
        if (e) e.preventDefault();
        updateFicha(f => { if (!f.combate) f.combate = {}; f.combate.furiaMax = percAtualLostFloor; });
        salvarFichaSilencioso(); setFuriaAcalmadaMsg(true); setTimeout(() => setFuriaAcalmadaMsg(false), 2000);
    }, [updateFicha, percAtualLostFloor]);

    const toggleMemoriaPretender = useCallback((val) => {
        setClassesMemorizadas(prev => {
            const isRemoving = prev.includes(val);
            const novaLista = isRemoving ? prev.filter(v => v !== val) : [...prev, val];
            if (isRemoving && subClasse === val) { setSubClasse(''); comitarBio({ classesMemorizadas: novaLista, subClasse: '' }); } 
            else { comitarBio({ classesMemorizadas: novaLista }); }
            return novaLista;
        });
    }, [subClasse, comitarBio]);

    const descansoLongoPretender = useCallback((e) => {
        if (e) e.preventDefault();
        if (window.confirm('O Descanso Longo vai apagar todas as memórias de classe do Pretender e remover o seu Disfarce atual. Confirmar?')) {
            setClassesMemorizadas([]); setSubClasse(''); comitarBio({ classesMemorizadas: [], subClasse: '' });
        }
    }, [comitarBio]);

    const [selAtributo, setSelAtributo] = useState('forca');
    const [campos, setCampos] = useState({ base: 0, mBase: 1, regeneracao: 0 });

    const carregarAtributoNaTela = useCallback(() => {
        const s = selAtributo;
        const k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
        if (!minhaFicha || !minhaFicha[k]) { setCampos({ base: 0, mBase: 1, regeneracao: 0 }); return; }
        const st = minhaFicha[k];
        setCampos({ base: st.base || 0, mBase: st.mBase || 1, regeneracao: st.regeneracao || 0 });
    }, [selAtributo, minhaFicha]);

    useEffect(() => { carregarAtributoNaTela(); }, [carregarAtributoNaTela]);

    const salvarAtributo = useCallback(() => {
        const s = selAtributo;
        let chs = [];
        if (s === 'todos_status') chs = [...STATS];
        else if (s === 'todas_energias') chs = [...ENERGIAS];
        else chs = [s];
        const v = { b: parseInt(campos.base) || 0, mb: parseFloat(campos.mBase) || 1, rg: parseFloat(campos.regeneracao) || 0 };
        updateFicha((ficha) => {
            for (let i = 0; i < chs.length; i++) {
                const c = chs[i];
                if (!ficha[c]) ficha[c] = {}; 
                ficha[c].base = v.b; ficha[c].mBase = v.mb; ficha[c].regeneracao = v.rg;
                if (['vida', 'mana', 'aura', 'chakra', 'corpo', 'pontosVitais', 'pontosMortais'].includes(c)) {
                    let mx = getMaximo(ficha, c);
                    if (c === 'vida') { const p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); } 
                    else { const p = Math.max(0, contarDigitos(mx) - 9); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
                    ficha[c].atual = mx;
                }
            }
        });
        salvarFichaSilencioso(); alert('Salvo!');
    }, [selAtributo, campos, updateFicha]);

    const [dmBase, setDmBase] = useState(1.0); const [dmPotencial, setDmPotencial] = useState(1.0); const [dmGeral, setDmGeral] = useState(1.0);
    const [dmFormas, setDmFormas] = useState(1.0); const [dmAbsoluto, setDmAbsoluto] = useState(1.0); const [dmUnico, setDmUnico] = useState('1.0');
    const [danoBruto, setDanoBruto] = useState(0); const [salvandoMult, setSalvandoMult] = useState(false);

    useEffect(() => {
        const d = minhaFicha?.dano || {};
        setDmBase(d.mBase ?? 1.0); setDmPotencial(d.mPotencial ?? 1.0); setDmGeral(d.mGeral ?? 1.0);
        setDmFormas(d.mFormas ?? 1.0); setDmAbsoluto(d.mAbsoluto ?? 1.0); setDmUnico(d.mUnico ?? '1.0');
        setDanoBruto(d.danoBruto ?? 0); 
    }, [minhaFicha?.dano]);

    const buffsDano = minhaFicha ? getBuffs(minhaFicha, 'dano') : { _hasBuff: {}, munico: [], fontesMgeral: [] };

    const salvarMultiplicadores = useCallback(() => {
        updateFicha((ficha) => {
            if (!ficha.dano) ficha.dano = {};
            ficha.dano.mBase = parseFloat(dmBase) || 1.0; ficha.dano.mPotencial = parseFloat(dmPotencial) || 1.0; ficha.dano.mGeral = parseFloat(dmGeral) || 1.0;
            ficha.dano.mFormas = parseFloat(dmFormas) || 1.0; ficha.dano.mAbsoluto = parseFloat(dmAbsoluto) || 1.0; ficha.dano.mUnico = dmUnico || '1.0';
            ficha.dano.danoBruto = parseFloat(danoBruto) || 0; 
        });
        salvarFichaSilencioso(); setSalvandoMult(true); setTimeout(() => setSalvandoMult(false), 2000);
    }, [dmBase, dmPotencial, dmGeral, dmFormas, dmAbsoluto, dmUnico, danoBruto, updateFicha]);

    const handleCampo = useCallback((field, val) => { setCampos(prev => ({ ...prev, [field]: val })); }, []);

    const sKeyForBuffs = (selAtributo === 'todos_status') ? 'forca' : (selAtributo === 'todas_energias') ? 'mana' : selAtributo;
    const buffsAtuais = minhaFicha ? getBuffs(minhaFicha, sKeyForBuffs) : null;

    // =========================================================================================
    // 🔥 BLINDAGEM CONDICIONAL ESTREITA CORRIGIDA 🔥
    // =========================================================================================
    const hierarquia = minhaFicha?.hierarquia || {};
    const poderesGlobais = minhaFicha?.poderes || [];
    const hPoder = hierarquia.poder || false;
    const hInfinity = hierarquia.infinity || false;
    
    // DEFINIÇÃO DAS VARIÁVEIS QUE ESTAVAM FALTANDO!
    const hPoderVertente = hierarquia.poderVertente || '';
    const hInfinityVertente = hierarquia.infinityVertente || '';
    
    // Função rigorosa para evitar "falsos positivos" de palavras parecidas
    const checkVertente = (valorSalvo, alvo) => {
        if (!valorSalvo) return false;
        const v = String(valorSalvo).toLowerCase().trim();
        return v === alvo || v.startsWith(alvo);
    };

    const classAcumulativo = (hPoder && checkVertente(hPoderVertente, 'acumulativo')) || (hInfinity && checkVertente(hInfinityVertente, 'acumulativo'));
    const classElemental = (hPoder && checkVertente(hPoderVertente, 'elemental')) || (hInfinity && checkVertente(hInfinityVertente, 'elemental'));
    const classConceitual = (hPoder && checkVertente(hPoderVertente, 'conceitual')) || (hInfinity && checkVertente(hInfinityVertente, 'conceitual'));
    const classUtilitario = (hPoder && checkVertente(hPoderVertente, 'utilitario')) || (hInfinity && checkVertente(hInfinityVertente, 'utilitario'));

    const showMarcadoresCena = classAcumulativo || poderesGlobais.some(p => p.ativa && checkVertente(p.vertente, 'acumulativo'));
    const showForjaCalamidade = classAcumulativo || poderesGlobais.some(p => p.ativa && checkVertente(p.vertente, 'acumulativo'));
    const showElemental = classElemental || poderesGlobais.some(p => p.ativa && checkVertente(p.vertente, 'elemental'));
    const showConceitual = classConceitual || poderesGlobais.some(p => p.ativa && checkVertente(p.vertente, 'conceitual'));
    const showUtilitario = classUtilitario || poderesGlobais.some(p => p.ativa && checkVertente(p.vertente, 'utilitario'));
    // =========================================================================================

    const trackersCena = minhaFicha?.combate?.trackers || [];
    const [novoTrackerNome, setNovoTrackerNome] = useState('');
    const [novoTrackerValor, setNovoTrackerValor] = useState('');

    const addTrackerCena = useCallback(() => {
        if (!novoTrackerNome.trim()) return;
        updateFicha(f => {
            if (!f.combate) f.combate = {}; if (!f.combate.trackers) f.combate.trackers = [];
            f.combate.trackers.push({ id: Date.now(), nome: novoTrackerNome, valor: parseFloat(novoTrackerValor) || 0, stacks: 0 });
        });
        salvarFichaSilencioso(); setNovoTrackerNome(''); setNovoTrackerValor('');
    }, [novoTrackerNome, novoTrackerValor, updateFicha]);

    const modTrackerCena = useCallback((id, delta) => {
        updateFicha(f => {
            if (!f.combate || !f.combate.trackers) return;
            const t = f.combate.trackers.find(x => x.id === id);
            if (t) t.stacks = Math.max(0, t.stacks + delta);
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const removeTrackerCena = useCallback((id) => {
        updateFicha(f => { if (!f.combate || !f.combate.trackers) return; f.combate.trackers = f.combate.trackers.filter(x => x.id !== id); });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const resetarTrackersCena = useCallback(() => {
        if (!window.confirm('A cena terminou? Isso vai zerar todos os seus stacks acumulados na batalha.')) return;
        updateFicha(f => { if (!f.combate || !f.combate.trackers) return; f.combate.trackers.forEach(t => t.stacks = 0); });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const [valorInjecao, setValorInjecao] = useState('');
    const [alvosInjecao, setAlvosInjecao] = useState({ vida: true, energias: true, status: false, danoBruto: true, multGeral: false });
    const [showAbsorverMsg, setShowAbsorverMsg] = useState('');

    const toggleAlvo = useCallback((k) => setAlvosInjecao(prev => ({...prev, [k]: !prev[k]})), []);

    const injetarAnomalia = useCallback(() => {
        const val = parseFloat(valorInjecao);
        if (!val || isNaN(val)) return;
        updateFicha(ficha => {
            const addBase = (chave) => { if (!ficha[chave]) ficha[chave] = {}; ficha[chave].base = (parseFloat(ficha[chave].base) || 0) + val; };
            if (alvosInjecao.vida) addBase('vida');
            if (alvosInjecao.energias) { ['mana', 'aura', 'chakra', 'corpo'].forEach(addBase); }
            if (alvosInjecao.status) { STATS.forEach(addBase); }
            if (alvosInjecao.danoBruto || alvosInjecao.multGeral) {
                if (!ficha.dano) ficha.dano = {};
                if (alvosInjecao.danoBruto) ficha.dano.danoBruto = (parseFloat(ficha.dano.danoBruto) || 0) + val;
                if (alvosInjecao.multGeral) ficha.dano.mGeral = (parseFloat(ficha.dano.mGeral) || 1) + val;
            }
        });
        salvarFichaSilencioso(); setValorInjecao(''); setShowAbsorverMsg(`✨ Evolução Concluída! Valor de +${val} injetado nos domínios selecionados!`);
        setTimeout(() => setShowAbsorverMsg(''), 6000);
    }, [valorInjecao, alvosInjecao, updateFicha]);

    const leisCena = minhaFicha?.combate?.leis || [];
    const [novaLeiNome, setNovaLeiNome] = useState('');
    const addLeiCena = useCallback(() => {
        if (!novaLeiNome.trim()) return;
        updateFicha(f => { if (!f.combate) f.combate = {}; if (!f.combate.leis) f.combate.leis = []; f.combate.leis.push({ id: Date.now(), texto: novaLeiNome }); });
        salvarFichaSilencioso(); setNovaLeiNome('');
    }, [novaLeiNome, updateFicha]);

    const removeLeiCena = useCallback((id) => {
        updateFicha(f => { if (!f.combate || !f.combate.leis) return; f.combate.leis = f.combate.leis.filter(x => x.id !== id); });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const copiasAtivas = minhaFicha?.combate?.copias || [];
    const [novaCopiaNome, setNovaCopiaNome] = useState('');
    const [novaCopiaEfeito, setNovaCopiaEfeito] = useState('');

    const addCopiaAtiva = useCallback(() => {
        if (!novaCopiaNome.trim()) return;
        updateFicha(f => { if (!f.combate) f.combate = {}; if (!f.combate.copias) f.combate.copias = []; f.combate.copias.push({ id: Date.now(), nome: novaCopiaNome, efeito: novaCopiaEfeito }); });
        salvarFichaSilencioso(); setNovaCopiaNome(''); setNovaCopiaEfeito('');
    }, [novaCopiaNome, novaCopiaEfeito, updateFicha]);

    const removeCopiaAtiva = useCallback((id) => {
        updateFicha(f => { if (!f.combate || !f.combate.copias) return; f.combate.copias = f.combate.copias.filter(x => x.id !== id); });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const getAtualVital = useCallback((key) => {
        if (!minhaFicha) return 0;
        const max = getMaximo(minhaFicha, key);
        if (minhaFicha[key] && minhaFicha[key].atual !== undefined) return minhaFicha[key].atual;
        return max;
    }, [minhaFicha]);

    const value = useMemo(() => ({
        minhaFicha, updateFicha, personagens, meuNome,
        mesa, setMesa, raca, setRaca, classe, setClasse, subClasse, setSubClasse,
        alterEgoSlot1, setAlterEgoSlot1, alterEgoSlot2, setAlterEgoSlot2, classesMemorizadas, setClassesMemorizadas,
        idade, setIdade, fisico, setFisico, sangue, setSangue, alinhamento, setAlinhamento,
        afiliacao, setAfiliacao, dinheiro, setDinheiro, salvandoBio,
        overridesCompendio, grands, isGrand, grandIcone, comitarBio, salvarBio, mudarSubClasseDireto,
        multiplicadorFuriaClasse, rawMaxVida, maxVida, atualVida, percAtualLostFloor, furiaMax, percEfetivoParaDisplay,
        multiplicadorFuriaVisor, furiaAcalmadaMsg, acalmarFuria, toggleMemoriaPretender, descansoLongoPretender,
        selAtributo, setSelAtributo, campos, setCampos, handleCampo, carregarAtributoNaTela, salvarAtributo,
        dmBase, setDmBase, dmPotencial, setDmPotencial, dmGeral, setDmGeral,
        dmFormas, setDmFormas, dmAbsoluto, setDmAbsoluto, dmUnico, setDmUnico,
        danoBruto, setDanoBruto, salvandoMult, salvarMultiplicadores,
        buffsDano, sKeyForBuffs, buffsAtuais,
        hierarquia, poderesGlobais, hPoder, hInfinity, hPoderVertente, hInfinityVertente,
        classAcumulativo, classElemental, classConceitual, classUtilitario,
        showMarcadoresCena, showForjaCalamidade, showElemental, showConceitual, showUtilitario,
        trackersCena, novoTrackerNome, setNovoTrackerNome, novoTrackerValor, setNovoTrackerValor,
        addTrackerCena, modTrackerCena, removeTrackerCena, resetarTrackersCena,
        valorInjecao, setValorInjecao, alvosInjecao, setAlvosInjecao, showAbsorverMsg, toggleAlvo, injetarAnomalia,
        leisCena, novaLeiNome, setNovaLeiNome, addLeiCena, removeLeiCena,
        copiasAtivas, novaCopiaNome, setNovaCopiaNome, novaCopiaEfeito, setNovaCopiaEfeito,
        addCopiaAtiva, removeCopiaAtiva, getAtualVital
    }), [
        minhaFicha, updateFicha, personagens, meuNome, mesa, raca, classe, subClasse, alterEgoSlot1, alterEgoSlot2, classesMemorizadas,
        idade, fisico, sangue, alinhamento, afiliacao, dinheiro, salvandoBio, overridesCompendio, grands, isGrand, grandIcone,
        comitarBio, salvarBio, mudarSubClasseDireto, multiplicadorFuriaClasse, rawMaxVida, maxVida, atualVida, percAtualLostFloor, furiaMax, percEfetivoParaDisplay,
        multiplicadorFuriaVisor, furiaAcalmadaMsg, acalmarFuria, toggleMemoriaPretender, descansoLongoPretender, selAtributo, campos, handleCampo, carregarAtributoNaTela, salvarAtributo,
        dmBase, dmPotencial, dmGeral, dmFormas, dmAbsoluto, dmUnico, danoBruto, salvandoMult, salvarMultiplicadores, buffsDano, sKeyForBuffs, buffsAtuais,
        hierarquia, poderesGlobais, hPoder, hInfinity, hPoderVertente, hInfinityVertente, classAcumulativo, classElemental, classConceitual, classUtilitario,
        showMarcadoresCena, showForjaCalamidade, showElemental, showConceitual, showUtilitario,
        trackersCena, novoTrackerNome, novoTrackerValor, addTrackerCena, modTrackerCena, removeTrackerCena, resetarTrackersCena,
        valorInjecao, alvosInjecao, showAbsorverMsg, toggleAlvo, injetarAnomalia, leisCena, novaLeiNome, addLeiCena, removeLeiCena,
        copiasAtivas, novaCopiaNome, novaCopiaEfeito, addCopiaAtiva, removeCopiaAtiva, getAtualVital
    ]);

    return (
        <FichaFormContext.Provider value={value}>
            {children}
        </FichaFormContext.Provider>
    );
}