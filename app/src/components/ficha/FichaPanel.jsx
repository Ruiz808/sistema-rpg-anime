import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo, getBuffs, getEfeitosDeClasse } from '../../core/attributes.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';
import TabelaPrestigio from './TabelaPrestigio';

const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
const ENERGIAS = ['mana', 'aura', 'chakra', 'corpo', 'pontosVitais', 'pontosMortais'];

const ATRIBUTO_OPTIONS = [
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

const CLASSES_OPTIONS = [
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

export default function FichaPanel() {
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

    // 🔥 LEITOR DA COROA (Verifica quem domina o Trono no Compêndio) 🔥
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
    // 🔥 VERIFICAÇÃO ÉPICA: É O GRAND? TEM AVATAR? 🔥
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

    useEffect(() => {
        carregarBio();
    }, [carregarBio]);

    function comitarBio(overrides = {}) {
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
    }

    function salvarBio() {
        comitarBio();
        setSalvandoBio(true);
        setTimeout(() => setSalvandoBio(false), 2000);
    }

    function mudarSubClasseDireto(novaSub) {
        setSubClasse(novaSub);
        comitarBio({ subClasse: novaSub });
    }

    let multiplicadorFuriaClasse = 0;
    const scanFuria = (efs) => {
        if (!efs) return;
        efs.forEach(e => {
            if (!e) return;
            let p = (e.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (p === 'furia_berserker') {
                let v = parseFloat(e.valor) || 0;
                if (v > multiplicadorFuriaClasse) multiplicadorFuriaClasse = v;
            }
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
    if (percEfetivoParaDisplay === 1) {
        multiplicadorFuriaVisor = multiplicadorFuriaClasse;
    } else if (percEfetivoParaDisplay >= 2) {
        multiplicadorFuriaVisor = percEfetivoParaDisplay;
    }

    useEffect(() => {
        if (multiplicadorFuriaClasse > 0 && percAtualLostFloor > furiaMax) {
            updateFicha(f => {
                if (!f.combate) f.combate = {};
                f.combate.furiaMax = percAtualLostFloor;
            });
            salvarFichaSilencioso();
        }
    }, [percAtualLostFloor, furiaMax, multiplicadorFuriaClasse, updateFicha]);

    const [furiaAcalmadaMsg, setFuriaAcalmadaMsg] = useState(false);
    function acalmarFuria(e) {
        e.preventDefault();
        updateFicha(f => {
            if (!f.combate) f.combate = {};
            f.combate.furiaMax = percAtualLostFloor; 
        });
        salvarFichaSilencioso();
        setFuriaAcalmadaMsg(true);
        setTimeout(() => setFuriaAcalmadaMsg(false), 2000);
    }

    function toggleMemoriaPretender(val) {
        setClassesMemorizadas(prev => {
            const isRemoving = prev.includes(val);
            const novaLista = isRemoving ? prev.filter(v => v !== val) : [...prev, val];
            
            if (isRemoving && subClasse === val) {
                setSubClasse(''); 
                comitarBio({ classesMemorizadas: novaLista, subClasse: '' });
            } else {
                comitarBio({ classesMemorizadas: novaLista });
            }
            return novaLista;
        });
    }

    function descansoLongoPretender(e) {
        e.preventDefault();
        if (window.confirm('O Descanso Longo vai apagar todas as memórias de classe do Pretender e remover o seu Disfarce atual. Confirmar?')) {
            setClassesMemorizadas([]);
            setSubClasse('');
            comitarBio({ classesMemorizadas: [], subClasse: '' });
        }
    }

    const [selAtributo, setSelAtributo] = useState('forca');
    const [campos, setCampos] = useState({ base: 0, mBase: 1, regeneracao: 0 });

    const carregarAtributoNaTela = useCallback(() => {
        const s = selAtributo;
        const k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
        if (!minhaFicha || !minhaFicha[k]) {
            setCampos({ base: 0, mBase: 1, regeneracao: 0 });
            return;
        }
        const st = minhaFicha[k];
        setCampos({
            base: st.base || 0,
            mBase: st.mBase || 1,
            regeneracao: st.regeneracao || 0
        });
    }, [selAtributo, minhaFicha]);

    useEffect(() => {
        carregarAtributoNaTela();
    }, [selAtributo, carregarAtributoNaTela]);

    function salvarAtributo() {
        const s = selAtributo;
        let chs = [];
        if (s === 'todos_status') chs = [...STATS];
        else if (s === 'todas_energias') chs = [...ENERGIAS];
        else chs = [s];

        const v = {
            b: parseInt(campos.base) || 0,
            mb: parseFloat(campos.mBase) || 1,
            rg: parseFloat(campos.regeneracao) || 0
        };

        updateFicha((ficha) => {
            for (let i = 0; i < chs.length; i++) {
                const c = chs[i];
                if (!ficha[c]) ficha[c] = {}; 
                ficha[c].base = v.b;
                ficha[c].mBase = v.mb;
                ficha[c].regeneracao = v.rg;

                if (['vida', 'mana', 'aura', 'chakra', 'corpo', 'pontosVitais', 'pontosMortais'].includes(c)) {
                    let mx = getMaximo(ficha, c);
                    if (c === 'vida') {
                        const p = Math.max(0, contarDigitos(mx) - 8);
                        if (p > 0) mx = Math.floor(mx / Math.pow(10, p));
                    } else {
                        const p = Math.max(0, contarDigitos(mx) - 9);
                        if (p > 0) mx = Math.floor(mx / Math.pow(10, p));
                    }
                    ficha[c].atual = mx;
                }
            }
        });
        salvarFichaSilencioso();
        alert('Salvo!');
    }

    const [dmBase, setDmBase] = useState(1.0);
    const [dmPotencial, setDmPotencial] = useState(1.0);
    const [dmGeral, setDmGeral] = useState(1.0);
    const [dmFormas, setDmFormas] = useState(1.0);
    const [dmAbsoluto, setDmAbsoluto] = useState(1.0);
    const [dmUnico, setDmUnico] = useState('1.0');
    const [danoBruto, setDanoBruto] = useState(0); 
    const [salvandoMult, setSalvandoMult] = useState(false);

    useEffect(() => {
        const d = minhaFicha?.dano || {};
        setDmBase(d.mBase ?? 1.0);
        setDmPotencial(d.mPotencial ?? 1.0);
        setDmGeral(d.mGeral ?? 1.0);
        setDmFormas(d.mFormas ?? 1.0);
        setDmAbsoluto(d.mAbsoluto ?? 1.0);
        setDmUnico(d.mUnico ?? '1.0');
        setDanoBruto(d.danoBruto ?? 0); 
    }, [minhaFicha?.dano]);

    const buffsDano = minhaFicha ? getBuffs(minhaFicha, 'dano') : { _hasBuff: {}, munico: [], fontesMgeral: [] };

    function salvarMultiplicadores() {
        updateFicha((ficha) => {
            if (!ficha.dano) ficha.dano = {};
            ficha.dano.mBase = parseFloat(dmBase) || 1.0;
            ficha.dano.mPotencial = parseFloat(dmPotencial) || 1.0;
            ficha.dano.mGeral = parseFloat(dmGeral) || 1.0;
            ficha.dano.mFormas = parseFloat(dmFormas) || 1.0;
            ficha.dano.mAbsoluto = parseFloat(dmAbsoluto) || 1.0;
            ficha.dano.mUnico = dmUnico || '1.0';
            ficha.dano.danoBruto = parseFloat(danoBruto) || 0; 
        });
        salvarFichaSilencioso();
        setSalvandoMult(true);
        setTimeout(() => setSalvandoMult(false), 2000);
    }

    function handleCampo(field, val) {
        setCampos(prev => ({ ...prev, [field]: val }));
    }

    const sKeyForBuffs = (selAtributo === 'todos_status') ? 'forca' : (selAtributo === 'todas_energias') ? 'mana' : selAtributo;
    const buffsAtuais = minhaFicha ? getBuffs(minhaFicha, sKeyForBuffs) : null;

    const renderBuffHolograma = (rawVal, buffVal, hasBuff, isMult = false) => {
        if (isMult && !hasBuff) return null;
        if (!isMult && !buffVal) return null;

        let v = parseFloat(rawVal);
        if (isNaN(v)) v = isMult ? 1.0 : 0;

        let total = isMult ? ((v === 1.0 ? 0 : v) + buffVal) : (v + buffVal);

        return (
            <div style={{ fontSize: '0.75em', color: '#0f0', marginTop: '4px', textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>
                ↳ Buff Ativo: <b>+{buffVal}</b> ➔ Efetivo: <b style={{color: '#fff'}}>{total}</b>
            </div>
        );
    };

    // 🔥 LÓGICA DO REATOR UNIVERSAL DE ANOMALIAS (INFINITY/SINGULARIDADE) 🔥
    const [valorInjecao, setValorInjecao] = useState('');
    const [alvosInjecao, setAlvosInjecao] = useState({
        vida: true,
        energias: true,
        danoBruto: true,
        multGeral: false
    });
    const [showAbsorverMsg, setShowAbsorverMsg] = useState('');
    
    const hierarquia = minhaFicha?.hierarquia || {};
    const hasInfinity = hierarquia.infinity || hierarquia.singularidade;

    const toggleAlvo = (k) => setAlvosInjecao(prev => ({...prev, [k]: !prev[k]}));

    function injetarAnomalia() {
        const val = parseFloat(valorInjecao);
        if (!val || isNaN(val)) return;

        updateFicha(ficha => {
            const addBase = (chave) => {
                if (!ficha[chave]) ficha[chave] = {};
                ficha[chave].base = (parseFloat(ficha[chave].base) || 0) + val;
            };
            
            if (alvosInjecao.vida) addBase('vida');
            
            if (alvosInjecao.energias) {
                ['mana', 'aura', 'chakra', 'corpo'].forEach(addBase);
            }

            if (alvosInjecao.danoBruto || alvosInjecao.multGeral) {
                if (!ficha.dano) ficha.dano = {};
                if (alvosInjecao.danoBruto) ficha.dano.danoBruto = (parseFloat(ficha.dano.danoBruto) || 0) + val;
                if (alvosInjecao.multGeral) ficha.dano.mGeral = (parseFloat(ficha.dano.mGeral) || 1) + val;
            }
        });
        
        salvarFichaSilencioso();
        setValorInjecao('');
        setShowAbsorverMsg(`✨ Evolução Concluída! Valor de +${val} injetado nos domínios selecionados!`);
        setTimeout(() => setShowAbsorverMsg(''), 6000);
    }

    if (!minhaFicha) return <div style={{ color: '#aaa', textAlign: 'center' }}>Carregando ficha...</div>;

    return (
        <div className="ficha-panel">
            <div className="def-box" style={{ 
                position: 'relative', 
                overflow: 'hidden', 
                border: isGrand ? '2px solid #ff003c' : '', 
                boxShadow: isGrand ? '0 0 30px rgba(255, 0, 60, 0.3), inset 0 0 50px rgba(255, 204, 0, 0.1)' : '' 
            }}>
                
                {isGrand && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,0,60,0.25) 0%, rgba(255,204,0,0.1) 40%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                )}

                <h3 style={{ color: isGrand ? '#ffcc00' : '#ffcc00', marginBottom: 15, display: 'flex', alignItems: 'center', gap: '10px', textShadow: isGrand ? '0 0 10px #ffcc00' : 'none' }}>
                    Ficha Narrativa {isGrand && <span style={{ fontSize: '0.6em', background: 'linear-gradient(90deg, #ffcc00, #ff003c)', color: '#000', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold', textShadow: 'none', boxShadow: '0 0 10px rgba(255,204,0,0.8)' }}>ENTIDADE SUPREMA</span>}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, position: 'relative', zIndex: 1 }}>
                    
                    <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '5px', border: '1px solid #444', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <label style={{ color: '#aaa', fontSize: '0.9em', fontWeight: 'bold', margin: 0 }}>⏳ Linha Temporal (Mesa):</label>
                        <select 
                            className="input-neon" 
                            value={mesa} 
                            onChange={e => { 
                                setMesa(e.target.value); 
                                comitarBio({ mesa: e.target.value }); 
                            }} 
                            style={{ flex: 1, padding: '8px', borderColor: '#444' }}
                        >
                            <option value="presente">⚔️ Lendas do Presente</option>
                            <option value="futuro">🚀 Lendas do Futuro</option>
                            <option value="npc">👹 NPC / Inimigo / Invocações</option>
                        </select>
                    </div>

                    {isGrand && (
                        <div className="fade-in" style={{ gridColumn: 'span 2', textAlign: 'center', borderBottom: '1px solid rgba(255,204,0,0.3)', paddingBottom: '25px', marginBottom: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                            <div style={{
                                width: '140px', height: '140px', borderRadius: '50%',
                                border: '3px solid #ffcc00', boxShadow: '0 0 30px rgba(255,0,60,0.8), inset 0 0 20px rgba(255,204,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.8)', overflow: 'hidden', marginBottom: '15px',
                                fontSize: '4em', textShadow: '0 0 20px #ffcc00'
                            }}>
                                {grandIcone ? <img src={grandIcone} alt="Avatar Grand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👑'}
                            </div>
                            <h2 style={{ color: '#ffcc00', margin: '0', letterSpacing: '5px', textShadow: '0 0 20px #ff003c, 0 0 10px #ffcc00', textTransform: 'uppercase', fontSize: '2.2em' }}>
                                GRAND {classe}
                            </h2>
                            <p style={{ color: '#ffcc00', fontSize: '1em', fontWeight: 'bold', margin: '10px 0 0 0', textShadow: '0 0 5px #ff003c', letterSpacing: '2px' }}>
                                O RECEPTÁCULO ABSOLUTO DO TRONO DA ASCENSÃO
                            </p>
                        </div>
                    )}

                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Raça</label>
                        <input className="input-neon" type="text" value={raca} onChange={e => setRaca(e.target.value)} />
                    </div>

                    {!isGrand && (
                        <div>
                            <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Classe Mística</label>
                            <select 
                                className="input-neon" 
                                value={classe} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setClasse(val);
                                    if (val !== 'alterego' && val !== 'pretender') {
                                        setSubClasse('');
                                        comitarBio({ classe: val, subClasse: '' });
                                    } else {
                                        comitarBio({ classe: val });
                                    }
                                }}
                                style={{ width: '100%', padding: '6px', background: '#111', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px' }}
                            >
                                {CLASSES_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(!isGrand && classe === 'alterego') && (
                        <div className="fade-in" style={{ gridColumn: 'span 2', background: 'rgba(255, 0, 255, 0.1)', padding: '15px', borderRadius: '5px', border: '1px dashed #ff00ff' }}>
                            <label style={{ color: '#ff00ff', fontSize: '0.9em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                🎭 Dualidade (Fragmentos de Ego)
                            </label>
                            <p style={{ color: '#aaa', fontSize: '0.75em', margin: '2px 0 12px 0', lineHeight: '1.4' }}>
                                Escolha as duas classes base que formam a sua personalidade. <strong>Você só pode ativar os poderes de uma delas por vez.</strong>
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ color: '#ff00ff', fontSize: '0.75em' }}>Fragmento Fixo 1</label>
                                    <select 
                                        className="input-neon" 
                                        value={alterEgoSlot1} 
                                        onChange={e => { 
                                            const val = e.target.value;
                                            setAlterEgoSlot1(val); 
                                            if(subClasse === alterEgoSlot1 && alterEgoSlot1 !== '') {
                                                setSubClasse(val);
                                                comitarBio({ alterEgoSlot1: val, subClasse: val }); 
                                            } else {
                                                comitarBio({ alterEgoSlot1: val });
                                            }
                                        }}
                                        style={{ width: '100%', padding: '6px', background: '#111', color: '#ff00ff', border: '1px solid #ff00ff', borderRadius: '4px' }}
                                    >
                                        {CLASSES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: '#ff00ff', fontSize: '0.75em' }}>Fragmento Fixo 2</label>
                                    <select 
                                        className="input-neon" 
                                        value={alterEgoSlot2} 
                                        onChange={e => { 
                                            const val = e.target.value;
                                            setAlterEgoSlot2(val); 
                                            if(subClasse === alterEgoSlot2 && alterEgoSlot2 !== '') {
                                                setSubClasse(val);
                                                comitarBio({ alterEgoSlot2: val, subClasse: val }); 
                                            } else {
                                                comitarBio({ alterEgoSlot2: val });
                                            }
                                        }}
                                        style={{ width: '100%', padding: '6px', background: '#111', color: '#ff00ff', border: '1px solid #ff00ff', borderRadius: '4px' }}
                                    >
                                        {CLASSES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <label style={{ color: '#ffcc00', fontSize: '0.8em', display: 'block', marginBottom: '8px' }}>
                                ⚡ Qual Fragmento de Ego está a dominar o seu corpo neste turno?
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className={`btn-neon ${subClasse === alterEgoSlot1 && alterEgoSlot1 !== '' ? 'btn-gold' : ''}`} 
                                    onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(alterEgoSlot1); }}
                                    disabled={!alterEgoSlot1}
                                    style={{ flex: 1, padding: '6px', fontSize: '0.75em', margin: 0, opacity: !alterEgoSlot1 ? 0.3 : 1 }}
                                >
                                    {alterEgoSlot1 ? `Ativar ${CLASSES_OPTIONS.find(o => o.value === alterEgoSlot1)?.label}` : 'Slot 1 Vazio'}
                                </button>
                                <button 
                                    className={`btn-neon ${subClasse === alterEgoSlot2 && alterEgoSlot2 !== '' ? 'btn-gold' : ''}`} 
                                    onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(alterEgoSlot2); }}
                                    disabled={!alterEgoSlot2}
                                    style={{ flex: 1, padding: '6px', fontSize: '0.75em', margin: 0, opacity: !alterEgoSlot2 ? 0.3 : 1 }}
                                >
                                    {alterEgoSlot2 ? `Ativar ${CLASSES_OPTIONS.find(o => o.value === alterEgoSlot2)?.label}` : 'Slot 2 Vazio'}
                                </button>
                                <button 
                                    className={`btn-neon ${subClasse === '' ? 'btn-red' : ''}`} 
                                    onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(''); }}
                                    style={{ flex: 1, padding: '6px', fontSize: '0.75em', margin: 0 }}
                                >
                                    Desativar Ambos
                                </button>
                            </div>
                        </div>
                    )}

                    {(!isGrand && classe === 'pretender') && (
                        <div className="fade-in" style={{ gridColumn: 'span 2', background: 'rgba(255, 170, 0, 0.1)', padding: '12px', borderRadius: '5px', border: '1px dashed #ffaa00' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ color: '#ffaa00', fontSize: '0.9em', fontWeight: 'bold' }}>
                                    🤥 O Disfarce Perfeito (Memória)
                                </label>
                                <button className="btn-neon btn-red btn-small" onClick={descansoLongoPretender} style={{ margin: 0, padding: '4px 10px', fontSize: '0.7em' }}>
                                    🏕️ DESCANSO LONGO
                                </button>
                            </div>
                            
                            <p style={{ color: '#ccc', fontSize: '0.75em', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                                Para assumir uma classe, o Pretender precisa <strong>ver o inimigo em ação</strong>. Marque as classes que você copiou nesta sessão. Após um Descanso Longo, as suas memórias são apagadas.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                                {CLASSES_OPTIONS.filter(o => o.value !== '' && o.value !== 'pretender').map(opt => {
                                    const isMemorizado = classesMemorizadas.includes(opt.value);
                                    return (
                                        <label key={opt.value} style={{ 
                                            fontSize: '0.75em', 
                                            color: isMemorizado ? '#000' : '#ffaa00', 
                                            background: isMemorizado ? '#ffaa00' : 'transparent',
                                            border: `1px solid #ffaa00`, 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textShadow: isMemorizado ? 'none' : '0 0 5px rgba(255,170,0,0.5)'
                                        }}>
                                            <input 
                                                type="checkbox" 
                                                style={{ display: 'none' }}
                                                checked={isMemorizado}
                                                onChange={() => toggleMemoriaPretender(opt.value)}
                                            />
                                            {isMemorizado ? `✓ ${opt.label}` : opt.label}
                                        </label>
                                    );
                                })}
                            </div>

                            <label style={{ color: '#ffaa00', fontSize: '0.8em', display: 'block', marginBottom: '4px' }}>Disfarce Atual (Aplica os buffs imediatamente):</label>
                            <select 
                                className="input-neon" 
                                value={subClasse} 
                                onChange={e => mudarSubClasseDireto(e.target.value)} 
                                style={{ width: '100%', padding: '6px', background: '#111', color: '#ffaa00', border: '1px solid #ffaa00', borderRadius: '4px' }}
                            >
                                <option value="">Nenhum Disfarce</option>
                                {CLASSES_OPTIONS.filter(o => classesMemorizadas.includes(o.value)).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Idade</label>
                        <input className="input-neon" type="text" value={idade} onChange={e => setIdade(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Físico</label>
                        <input className="input-neon" type="text" value={fisico} onChange={e => setFisico(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Tipo Sanguíneo</label>
                        <input className="input-neon" type="text" value={sangue} onChange={e => setSangue(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Alinhamento</label>
                        <input className="input-neon" type="text" value={alinhamento} onChange={e => setAlinhamento(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Afiliação</label>
                        <input className="input-neon" type="text" value={afiliacao} onChange={e => setAfiliacao(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dinheiro</label>
                        <input className="input-neon" type="text" value={dinheiro} onChange={e => setDinheiro(e.target.value)} />
                    </div>
                </div>
                <button
                    className="btn-neon btn-gold"
                    onClick={salvarBio}
                    style={{
                        marginTop: 15, width: '100%', position: 'relative', zIndex: 1,
                        backgroundColor: salvandoBio ? 'rgba(0, 255, 100, 0.2)' : undefined,
                        borderColor: salvandoBio ? '#00ffcc' : undefined,
                        color: salvandoBio ? '#fff' : undefined
                    }}
                >
                    {salvandoBio ? 'SALVO COM SUCESSO!' : 'SALVAR BIO'}
                </button>
            </div>

            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Editor de Atributos</h3>
                <select
                    className="input-neon"
                    value={selAtributo}
                    onChange={(e) => setSelAtributo(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                >
                    {ATRIBUTO_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginTop: 15 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Base</label>
                        <input className="input-neon" type="number" value={campos.base} onChange={e => handleCampo('base', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.base, buffsAtuais.base, false, false)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mBase} onChange={e => handleCampo('mBase', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.mBase, buffsAtuais.mbase, buffsAtuais._hasBuff.mbase, true)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Regeneração</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.regeneracao} onChange={e => handleCampo('regeneracao', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.regeneracao, buffsAtuais.regeneracao, false, false)}
                    </div>
                </div>

                <button className="btn-neon btn-gold" onClick={salvarAtributo} style={{ marginTop: 15, width: '100%', height: '44px' }}>
                    SALVAR ATRIBUTOS
                </button>
            </div>

            {multiplicadorFuriaClasse > 0 && (
                <div className="def-box fade-in" style={{ marginTop: 15, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255,0,0,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: '#ff0000', margin: 0, textShadow: '0 0 5px #ff0000' }}>🩸 Fúria Berserker (Mad Enhancement)</h3>
                        <button 
                            className="btn-neon btn-small" 
                            onClick={acalmarFuria} 
                            style={{ margin: 0, borderColor: furiaAcalmadaMsg ? '#0f0' : '#fff', color: furiaAcalmadaMsg ? '#0f0' : '#fff' }}
                        >
                            {furiaAcalmadaMsg ? '✨ FÚRIA RESETADA!' : 'Acalmar Fúria'}
                        </button>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Vida Perdida Atual:</span>
                            <span style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold' }}>{percAtualLostFloor}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,0,0,0.2)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid #ff0000' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em', display: 'block' }}>Máximo Atingido (Mantido após Cura):</span>
                            <span style={{ color: '#ff0000', fontSize: '1.2em', fontWeight: 'bold' }}>{percEfetivoParaDisplay}%</span>
                        </div>
                    </div>
                    <p style={{ color: '#0f0', fontSize: '0.9em', marginTop: 10, marginBottom: 0 }}>
                        ↳ Bônus no Multiplicador Geral: <strong style={{ color: '#fff' }}>+{multiplicadorFuriaVisor}x</strong>
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.75em', marginTop: 5, marginBottom: 0 }}>
                        <i className="fas fa-info-circle"></i> Com 1% de HP perdido ganha o bônus inicial (+{multiplicadorFuriaClasse}x). A partir de 2%, ganha +1x por cada 1% de HP perdido.
                    </p>
                </div>
            )}

            {/* 🔥 FORJA DE CALAMIDADE UNIVERSAL 🔥 */}
            {hasInfinity && (
                <div className="def-box fade-in" style={{ marginTop: 15, background: 'rgba(0, 204, 255, 0.05)', border: '1px solid #00ccff', boxShadow: '0 0 15px rgba(0, 204, 255, 0.2)' }}>
                    <h3 style={{ color: '#00ccff', marginBottom: 10, textShadow: '0 0 5px #00ccff' }}>🌌 Forja de Calamidade Universal</h3>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '0 0 15px 0' }}>
                        Como cada Infinity ou Singularidade tem regras únicas, use este painel para injetar os ganhos após o combate. <strong>Calcule o valor final da sua habilidade e escolha onde ele será injetado.</strong>
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '5px', border: '1px dashed #00ccff' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={alvosInjecao.vida} onChange={() => toggleAlvo('vida')} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ color: alvosInjecao.vida ? '#0f0' : '#888', fontWeight: alvosInjecao.vida ? 'bold' : 'normal' }}>Vida Máxima Base</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={alvosInjecao.energias} onChange={() => toggleAlvo('energias')} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ color: alvosInjecao.energias ? '#0f0' : '#888', fontWeight: alvosInjecao.energias ? 'bold' : 'normal' }}>Energias Base (Mana/Aura/Chak/Corp)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={alvosInjecao.danoBruto} onChange={() => toggleAlvo('danoBruto')} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ color: alvosInjecao.danoBruto ? '#0f0' : '#888', fontWeight: alvosInjecao.danoBruto ? 'bold' : 'normal' }}>Dano Bruto Flat (+)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={alvosInjecao.multGeral} onChange={() => toggleAlvo('multGeral')} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ color: alvosInjecao.multGeral ? '#0f0' : '#888', fontWeight: alvosInjecao.multGeral ? 'bold' : 'normal' }}>Multiplicador Geral de Dano (x)</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'stretch' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                className="input-neon" 
                                type="number" 
                                step="0.01"
                                placeholder="Valor Final Calculado (Ex: 25000 ou 1.5)" 
                                value={valorInjecao} 
                                onChange={e => setValorInjecao(e.target.value)} 
                                style={{ width: '100%', height: '100%', fontSize: '1.2em', padding: '10px', borderColor: '#00ccff', color: '#fff' }} 
                            />
                        </div>
                        <button className="btn-neon" style={{ borderColor: '#00ccff', color: '#00ccff', padding: '10px 20px', fontSize: '1.1em', margin: 0, background: 'rgba(0, 204, 255, 0.1)', fontWeight: 'bold' }} onClick={injetarAnomalia}>
                            ⚡ INJETAR EVOLUÇÃO
                        </button>
                    </div>
                    {showAbsorverMsg && (
                        <div style={{ marginTop: '10px', color: '#0f0', fontWeight: 'bold', textShadow: '0 0 5px #0f0', textAlign: 'center' }}>
                            {showAbsorverMsg}
                        </div>
                    )}
                </div>
            )}

            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#ff003c', marginBottom: 10 }}>Multiplicadores de Dano</h3>
                <p style={{ color: '#888', fontSize: '0.8em', margin: '0 0 10px' }}>Valores base. Habilidades ativas somam automaticamente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base {buffsDano._hasBuff.mbase && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mbase.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmBase} onChange={e => setDmBase(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Potencial</label>
                        <input className="input-neon" type="number" step="0.01" value={dmPotencial} onChange={e => setDmPotencial(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Geral {buffsDano._hasBuff.mgeral && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mgeral.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmGeral} onChange={e => setDmGeral(e.target.value)} />
                        
                        {buffsDano.fontesMgeral && buffsDano.fontesMgeral.length > 0 && (
                            <div style={{ marginTop: '5px', padding: '5px', background: 'rgba(0,255,0,0.1)', borderRadius: '4px', borderLeft: '2px solid #0f0' }}>
                                <span style={{ color: '#aaa', fontSize: '0.7em', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>🔍 Origem dos Buffs:</span>
                                {buffsDano.fontesMgeral.map((fnt, idx) => (
                                    <div key={idx} style={{ color: '#0f0', fontSize: '0.7em' }}>• {fnt}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Formas {buffsDano._hasBuff.mformas && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mformas.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmFormas} onChange={e => setDmFormas(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Absoluto {buffsDano._hasBuff.mabs && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mabs.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmAbsoluto} onChange={e => setDmAbsoluto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Unico {buffsDano.munico.length > 0 && <span style={{ color: '#0f0', fontSize: '0.8em', textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>(Buff: x{buffsDano.munico.join(' e x')})</span>}</label>
                        <input className="input-neon" type="text" value={dmUnico} onChange={e => setDmUnico(e.target.value)} />
                    </div>
                    
                    {/* 🔥 O CAMPO DE DANO BRUTO (FLAT DAMAGE) 🔥 */}
                    <div style={{ gridColumn: 'span 3', background: 'rgba(0, 255, 170, 0.05)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid #00ffaa' }}>
                        <label style={{ color: '#00ffaa', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Dano Bruto Adicional (+) (Acumulado de Anomalias)</label>
                        <input className="input-neon" type="number" step="0.01" value={danoBruto} onChange={e => setDanoBruto(e.target.value)} style={{ width: '100%', borderColor: '#00ffaa', color: '#00ffaa', fontSize: '1.2em', fontWeight: 'bold' }} />
                        <p style={{ color: '#aaa', fontSize: '0.75em', margin: '5px 0 0 0', fontStyle: 'italic' }}>Este valor soma-se diretamente à energia gasta nos seus ataques.</p>
                    </div>
                </div>
                
                <button
                    className="btn-neon btn-gold"
                    onClick={salvarMultiplicadores}
                    style={{
                        marginTop: 15, width: '100%',
                        backgroundColor: salvandoMult ? 'rgba(0, 255, 100, 0.2)' : undefined,
                        borderColor: salvandoMult ? '#00ffcc' : undefined,
                        color: salvandoMult ? '#fff' : undefined
                    }}
                >
                    {salvandoMult ? 'SALVO COM SUCESSO!' : 'SALVAR MULTIPLICADORES'}
                </button>
            </div>

            <TabelaPrestigio />
        </div>
    );
}