import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo, getBuffs, getEfeitosDeClasse } from '../../core/attributes.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';
import TabelaPrestigio from './TabelaPrestigio';

const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
const ENERGIAS = ['mana', 'aura', 'chakra', 'corpo', 'pontosVitais', 'pontosMortais'];

const ATRIBUTO_OPTIONS = [
    { value: 'forca', label: '💪 Força' },
    { value: 'destreza', label: '🏃 Destreza' },
    { value: 'inteligencia', label: '🧠 Inteligência' },
    { value: 'sabedoria', label: '🦉 Sabedoria' },
    { value: 'energiaEsp', label: '✨ Energia Espiritual' },
    { value: 'carisma', label: '🗣️ Carisma' },
    { value: 'stamina', label: '🫁 Stamina' },
    { value: 'constituicao', label: '🛡️ Constituição' },
    { value: 'vida', label: '❤️ Vida' },
    { value: 'mana', label: '🔵 Mana' },
    { value: 'aura', label: '🟣 Aura' },
    { value: 'chakra', label: '🟢 Chakra' },
    { value: 'corpo', label: '🟠 Corpo' },
    { value: 'pontosVitais', label: '🤍 Pontos Vitais' },
    { value: 'pontosMortais', label: '🩸 Pontos Mortais' },
    { value: 'todos_status', label: '🌟 TODOS OS STATUS' },
    { value: 'todas_energias', label: '💫 TODAS AS ENERGIAS' },
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
    const [salvandoMult, setSalvandoMult] = useState(false);

    useEffect(() => {
        const d = minhaFicha?.dano || {};
        setDmBase(d.mBase ?? 1.0);
        setDmPotencial(d.mPotencial ?? 1.0);
        setDmGeral(d.mGeral ?? 1.0);
        setDmFormas(d.mFormas ?? 1.0);
        setDmAbsoluto(d.mAbsoluto ?? 1.0);
        setDmUnico(d.mUnico ?? '1.0');
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
                ↳ Buff: <b>+{buffVal}</b> ➔ Efetivo: <b style={{color: '#fff'}}>{total}</b>
            </div>
        );
    };

    if (!minhaFicha) return <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>Sincronizando com a Matrix...</div>;

    return (
        <div className="ficha-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* =========================================================
                SEÇÃO 1: REGISTRO NARRATIVO E IDENTIFICAÇÃO (BIO)
            ========================================================= */}
            <div className="def-box" style={{ 
                position: 'relative', 
                overflow: 'hidden', 
                border: isGrand ? '2px solid #ff003c' : '1px solid #00ffcc', 
                boxShadow: isGrand ? '0 0 30px rgba(255, 0, 60, 0.3), inset 0 0 50px rgba(255, 204, 0, 0.1)' : '0 0 15px rgba(0, 255, 204, 0.1)' 
            }}>
                
                {/* 🔥 EFEITO GRAND CLASS ATIVO 🔥 */}
                {isGrand && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,0,60,0.25) 0%, rgba(255,204,0,0.1) 40%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isGrand ? '1px solid #ffcc00' : '1px solid #00ffcc', paddingBottom: '10px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ color: isGrand ? '#ffcc00' : '#00ffcc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', textShadow: isGrand ? '0 0 10px #ffcc00' : '0 0 5px #00ffcc' }}>
                        📜 Registro Narrativo
                        {isGrand && <span style={{ fontSize: '0.5em', background: 'linear-gradient(90deg, #ffcc00, #ff003c)', color: '#000', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold', textShadow: 'none', boxShadow: '0 0 10px rgba(255,204,0,0.8)' }}>ENTIDADE SUPREMA</span>}
                    </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', position: 'relative', zIndex: 1 }}>
                    
                    {/* 🔥 SELETOR DE MESA (Linha Temporal) 🔥 */}
                    <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '8px', border: '1px dashed #555', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <label style={{ color: '#aaa', fontSize: '0.9em', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⏳ <span>Linha Temporal Base:</span>
                        </label>
                        <select 
                            className="input-neon" 
                            value={mesa} 
                            onChange={e => { 
                                setMesa(e.target.value); 
                                comitarBio({ mesa: e.target.value }); 
                            }} 
                            style={{ flex: 1, padding: '10px', borderColor: '#444', fontSize: '1em' }}
                        >
                            <option value="presente">⚔️ Lendas do Presente</option>
                            <option value="futuro">🚀 Lendas do Futuro</option>
                            <option value="npc">👹 Entidade Não-Jogável / Invocação</option>
                        </select>
                    </div>

                    {/* 🔥 O AVATAR DA CALAMIDADE: SUBSTITUI O SELETOR DE CLASSE 🔥 */}
                    {isGrand && (
                        <div className="fade-in" style={{ gridColumn: '1 / -1', textAlign: 'center', background: 'rgba(255, 0, 60, 0.05)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255, 204, 0, 0.2)', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%',
                                border: '3px solid #ffcc00', boxShadow: '0 0 30px rgba(255,0,60,0.8), inset 0 0 20px rgba(255,204,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.8)', overflow: 'hidden', marginBottom: '15px',
                                fontSize: '3em', textShadow: '0 0 20px #ffcc00'
                            }}>
                                {grandIcone ? <img src={grandIcone} alt="Avatar Grand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👑'}
                            </div>
                            <h2 style={{ color: '#ffcc00', margin: '0', letterSpacing: '4px', textShadow: '0 0 15px #ff003c', textTransform: 'uppercase', fontSize: '2em' }}>
                                GRAND {classe}
                            </h2>
                            <p style={{ color: '#aaa', fontSize: '0.85em', fontStyle: 'italic', margin: '5px 0 0 0', letterSpacing: '1px' }}>
                                O RECEPTÁCULO ABSOLUTO DO TRONO DA ASCENSÃO
                            </p>
                        </div>
                    )}

                    {/* DADOS BASE */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ffcc' }}>
                        <label style={{ color: '#00ffcc', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>🧬 Raça / Espécie</label>
                        <input className="input-neon" type="text" value={raca} onChange={e => setRaca(e.target.value)} style={{ width: '100%' }} placeholder="Ex: Humano, Elfo..." />
                    </div>

                    {!isGrand && (
                        <div style={{ background: 'rgba(0, 255, 204, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ffcc' }}>
                            <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>🛡️ Classe Mística</label>
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
                                style={{ width: '100%', background: '#111', color: '#00ffcc', borderColor: '#00ffcc' }}
                            >
                                {CLASSES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}

                    {/* MÓDULOS ESPECIAIS DE CLASSE */}
                    {(!isGrand && classe === 'alterego') && (
                        <div className="fade-in" style={{ gridColumn: '1 / -1', background: 'rgba(255, 0, 255, 0.05)', padding: '20px', borderRadius: '8px', border: '1px dashed #ff00ff' }}>
                            <label style={{ color: '#ff00ff', fontSize: '1em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                🎭 Matriz de Dualidade (Alter Ego)
                            </label>
                            <p style={{ color: '#aaa', fontSize: '0.8em', margin: '0 0 15px 0', lineHeight: '1.4' }}>
                                A sua existência é fragmentada. Defina as duas classes que formam o seu ser. Pode alternar entre elas no campo de batalha para usar os seus poderes passivos.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ color: '#ff00ff', fontSize: '0.8em', marginBottom: '5px', display: 'block' }}>Fragmento Fixo 1</label>
                                    <select className="input-neon" value={alterEgoSlot1} onChange={e => { 
                                            const val = e.target.value; setAlterEgoSlot1(val); 
                                            if(subClasse === alterEgoSlot1 && alterEgoSlot1 !== '') { setSubClasse(val); comitarBio({ alterEgoSlot1: val, subClasse: val }); } 
                                            else { comitarBio({ alterEgoSlot1: val }); }
                                        }} style={{ width: '100%', color: '#ff00ff', borderColor: '#ff00ff' }}>
                                        {CLASSES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: '#ff00ff', fontSize: '0.8em', marginBottom: '5px', display: 'block' }}>Fragmento Fixo 2</label>
                                    <select className="input-neon" value={alterEgoSlot2} onChange={e => { 
                                            const val = e.target.value; setAlterEgoSlot2(val); 
                                            if(subClasse === alterEgoSlot2 && alterEgoSlot2 !== '') { setSubClasse(val); comitarBio({ alterEgoSlot2: val, subClasse: val }); } 
                                            else { comitarBio({ alterEgoSlot2: val }); }
                                        }} style={{ width: '100%', color: '#ff00ff', borderColor: '#ff00ff' }}>
                                        {CLASSES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px' }}>
                                <label style={{ color: '#ffcc00', fontSize: '0.85em', display: 'block', marginBottom: '10px' }}>⚡ Fragmento Ativo Neste Turno:</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button className={`btn-neon ${subClasse === alterEgoSlot1 && alterEgoSlot1 !== '' ? 'btn-gold' : ''}`} onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(alterEgoSlot1); }} disabled={!alterEgoSlot1} style={{ flex: 1, margin: 0, opacity: !alterEgoSlot1 ? 0.3 : 1 }}>
                                        {alterEgoSlot1 ? `Ativar ${CLASSES_OPTIONS.find(o => o.value === alterEgoSlot1)?.label}` : 'Slot 1 Vazio'}
                                    </button>
                                    <button className={`btn-neon ${subClasse === alterEgoSlot2 && alterEgoSlot2 !== '' ? 'btn-gold' : ''}`} onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(alterEgoSlot2); }} disabled={!alterEgoSlot2} style={{ flex: 1, margin: 0, opacity: !alterEgoSlot2 ? 0.3 : 1 }}>
                                        {alterEgoSlot2 ? `Ativar ${CLASSES_OPTIONS.find(o => o.value === alterEgoSlot2)?.label}` : 'Slot 2 Vazio'}
                                    </button>
                                    <button className={`btn-neon ${subClasse === '' ? 'btn-red' : ''}`} onClick={(e) => { e.preventDefault(); mudarSubClasseDireto(''); }} style={{ padding: '8px 15px', margin: 0 }}>
                                        Desativar Ambos
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {(!isGrand && classe === 'pretender') && (
                        <div className="fade-in" style={{ gridColumn: '1 / -1', background: 'rgba(255, 170, 0, 0.05)', padding: '20px', borderRadius: '8px', border: '1px dashed #ffaa00' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ color: '#ffaa00', fontSize: '1em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🤥 Disfarce Perfeito (Pretender)
                                </label>
                                <button className="btn-neon btn-red btn-small" onClick={descansoLongoPretender} style={{ margin: 0, padding: '5px 15px' }}>
                                    🏕️ DESCANSO LONGO (Reset)
                                </button>
                            </div>
                            
                            <p style={{ color: '#ccc', fontSize: '0.8em', margin: '0 0 15px 0', lineHeight: '1.4' }}>
                                Assinale as classes que presenciou em ação. Você pode copiar a passiva delas. O Descanso Longo apaga todas as suas memórias visuais.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '5px' }}>
                                {CLASSES_OPTIONS.filter(o => o.value !== '' && o.value !== 'pretender').map(opt => {
                                    const isMemorizado = classesMemorizadas.includes(opt.value);
                                    return (
                                        <label key={opt.value} style={{ 
                                            fontSize: '0.8em', color: isMemorizado ? '#000' : '#ffaa00', background: isMemorizado ? '#ffaa00' : 'transparent',
                                            border: `1px solid #ffaa00`, padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                                            textShadow: isMemorizado ? 'none' : '0 0 5px rgba(255,170,0,0.5)'
                                        }}>
                                            <input type="checkbox" style={{ display: 'none' }} checked={isMemorizado} onChange={() => toggleMemoriaPretender(opt.value)} />
                                            {isMemorizado ? `✓ ${opt.label}` : opt.label}
                                        </label>
                                    );
                                })}
                            </div>

                            <label style={{ color: '#ffaa00', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>⚡ Disfarce Ativo (Aplica os buffs imediatamente):</label>
                            <select className="input-neon" value={subClasse} onChange={e => mudarSubClasseDireto(e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', color: '#ffaa00', borderColor: '#ffaa00', fontSize: '1em' }}>
                                <option value="">👤 Sem Disfarce</option>
                                {CLASSES_OPTIONS.filter(o => classesMemorizadas.includes(o.value)).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* DADOS PESSOAIS */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #888' }}>
                        <label style={{ color: '#aaa', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>⏳ Idade Real</label>
                        <input className="input-neon" type="text" value={idade} onChange={e => setIdade(e.target.value)} style={{ width: '100%' }} placeholder="Ex: 24 anos" />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #888' }}>
                        <label style={{ color: '#aaa', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>🏋️ Físico (Altura/Peso)</label>
                        <input className="input-neon" type="text" value={fisico} onChange={e => setFisico(e.target.value)} style={{ width: '100%' }} placeholder="Ex: 1.80m / 75kg" />
                    </div>
                    <div style={{ background: 'rgba(255,0,0,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ff3333' }}>
                        <label style={{ color: '#ff3333', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>🩸 Tipo Sanguíneo</label>
                        <input className="input-neon" type="text" value={sangue} onChange={e => setSangue(e.target.value)} style={{ width: '100%', borderColor: '#ff3333' }} placeholder="Ex: O-, AB+" />
                    </div>
                    <div style={{ background: 'rgba(255,204,0,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ffcc00' }}>
                        <label style={{ color: '#ffcc00', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>⚖️ Alinhamento Moral</label>
                        <input className="input-neon" type="text" value={alinhamento} onChange={e => setAlinhamento(e.target.value)} style={{ width: '100%', borderColor: '#ffcc00' }} placeholder="Ex: Caótico Neutro" />
                    </div>
                    <div style={{ background: 'rgba(0,136,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #0088ff' }}>
                        <label style={{ color: '#0088ff', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>🏴 Organização / Afiliação</label>
                        <input className="input-neon" type="text" value={afiliacao} onChange={e => setAfiliacao(e.target.value)} style={{ width: '100%', borderColor: '#0088ff' }} placeholder="Ex: Guilda dos Mercenários" />
                    </div>
                    <div style={{ background: 'rgba(0,255,170,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ffaa' }}>
                        <label style={{ color: '#00ffaa', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>💰 Riqueza / Bens</label>
                        <input className="input-neon" type="text" value={dinheiro} onChange={e => setDinheiro(e.target.value)} style={{ width: '100%', borderColor: '#00ffaa' }} placeholder="Ex: 5.000 Ouro" />
                    </div>
                </div>

                <button
                    className="btn-neon btn-gold"
                    onClick={salvarBio}
                    style={{
                        marginTop: 20, width: '100%', padding: '12px', fontSize: '1.1em', letterSpacing: '1px', position: 'relative', zIndex: 1,
                        backgroundColor: salvandoBio ? 'rgba(0, 255, 100, 0.2)' : undefined,
                        borderColor: salvandoBio ? '#00ffcc' : undefined,
                        color: salvandoBio ? '#fff' : undefined
                    }}
                >
                    {salvandoBio ? '💾 DADOS REGISTADOS!' : '💾 ATUALIZAR REGISTRO NARRATIVO'}
                </button>
            </div>

            {/* =========================================================
                SEÇÃO 2: MATRIZ DE CALIBRAÇÃO (ATRIBUTOS)
            ========================================================= */}
            <div className="def-box" style={{ padding: '25px', border: '1px solid #0088ff', boxShadow: '0 0 15px rgba(0, 136, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #0088ff', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h3 style={{ color: '#0088ff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 0 5px #0088ff' }}>⚙️ Matriz de Atributos</h3>
                    <span style={{ color: '#888', fontSize: '0.8em', fontStyle: 'italic' }}>Calibração do Núcleo</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #333' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85em', display: 'block', marginBottom: '10px' }}>Alvo da Calibração:</label>
                    <select
                        className="input-neon"
                        value={selAtributo}
                        onChange={(e) => setSelAtributo(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#111', color: '#0088ff', borderColor: '#0088ff', fontSize: '1.1em' }}
                    >
                        {ATRIBUTO_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ccc' }}>
                        <label style={{ color: '#ccc', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Valor Base</label>
                        <input className="input-neon" type="number" value={campos.base} onChange={e => handleCampo('base', e.target.value)} style={{ width: '100%', fontSize: '1.2em', padding: '8px' }} />
                        {buffsAtuais && renderBuffHolograma(campos.base, buffsAtuais.base, false, false)}
                    </div>
                    <div style={{ background: 'rgba(0,255,204,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ffcc' }}>
                        <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Multiplicador Base</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mBase} onChange={e => handleCampo('mBase', e.target.value)} style={{ width: '100%', fontSize: '1.2em', padding: '8px', borderColor: '#00ffcc', color: '#00ffcc' }} />
                        {buffsAtuais && renderBuffHolograma(campos.mBase, buffsAtuais.mbase, buffsAtuais._hasBuff.mbase, true)}
                    </div>
                    <div style={{ background: 'rgba(255,170,0,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ffaa00' }}>
                        <label style={{ color: '#ffaa00', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Regeneração Passiva</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.regeneracao} onChange={e => handleCampo('regeneracao', e.target.value)} style={{ width: '100%', fontSize: '1.2em', padding: '8px', borderColor: '#ffaa00', color: '#ffaa00' }} />
                        {buffsAtuais && renderBuffHolograma(campos.regeneracao, buffsAtuais.regeneracao, false, false)}
                    </div>
                </div>

                <button className="btn-neon btn-blue" onClick={salvarAtributo} style={{ marginTop: '20px', width: '100%', padding: '12px', fontSize: '1.1em', letterSpacing: '1px' }}>
                    ⚡ INJETAR CALIBRAÇÃO NA MATRIZ
                </button>
            </div>

            {/* =========================================================
                SEÇÃO 3: FÚRIA BERSERKER (Condicional)
            ========================================================= */}
            {multiplicadorFuriaClasse > 0 && (
                <div className="def-box fade-in" style={{ background: 'rgba(255, 0, 0, 0.05)', border: '1px solid #ff0000', boxShadow: '0 0 20px rgba(255, 0, 0, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #ff0000', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h3 style={{ color: '#ff0000', margin: 0, textShadow: '0 0 10px #ff0000', display: 'flex', alignItems: 'center', gap: '8px' }}>🩸 Fúria Berserker</h3>
                        <button className="btn-neon btn-small" onClick={acalmarFuria} style={{ margin: 0, borderColor: furiaAcalmadaMsg ? '#0f0' : '#ff0000', color: furiaAcalmadaMsg ? '#0f0' : '#ff0000' }}>
                            {furiaAcalmadaMsg ? '✨ FÚRIA RESETADA!' : '🧘 Acalmar Mente'}
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ffcc00' }}>
                            <span style={{ color: '#aaa', fontSize: '0.85em', display: 'block', marginBottom: '5px' }}>Vida Perdida Atual:</span>
                            <span style={{ color: '#ffcc00', fontSize: '2em', fontWeight: 'bold', textShadow: '0 0 10px #ffcc00' }}>{percAtualLostFloor}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,0,0,0.1)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ff0000' }}>
                            <span style={{ color: '#ffaaaa', fontSize: '0.85em', display: 'block', marginBottom: '5px' }}>Máximo Atingido (Aura Mantida):</span>
                            <span style={{ color: '#ff0000', fontSize: '2em', fontWeight: 'bold', textShadow: '0 0 10px #ff0000' }}>{percEfetivoParaDisplay}%</span>
                        </div>
                    </div>
                    
                    <div style={{ background: 'rgba(0,255,0,0.05)', padding: '12px', borderRadius: '5px', border: '1px solid rgba(0,255,0,0.3)', marginBottom: '10px' }}>
                        <span style={{ color: '#0f0', fontSize: '1em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            ⚡ Bónus Atual no Multiplicador Geral: <strong style={{ color: '#fff', fontSize: '1.2em' }}>+{multiplicadorFuriaVisor}x</strong>
                        </span>
                    </div>
                    
                    <p style={{ color: '#888', fontSize: '0.8em', margin: 0, fontStyle: 'italic' }}>
                        <i className="fas fa-info-circle"></i> O primeiro 1% de dano sofrido ativa o bônus inicial (+{multiplicadorFuriaClasse}x). Depois, ganha +1x por cada 1% adicional. A fúria não diminui ao ser curado, a menos que acalme a mente.
                    </p>
                </div>
            )}

            {/* =========================================================
                SEÇÃO 4: MULTIPLICADORES DE DANO
            ========================================================= */}
            <div className="def-box" style={{ border: '1px solid #ff003c', boxShadow: '0 0 15px rgba(255, 0, 60, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #ff003c', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h3 style={{ color: '#ff003c', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 0 5px #ff003c' }}>💥 Output de Dano (Multiplicadores)</h3>
                    <span style={{ color: '#888', fontSize: '0.8em', fontStyle: 'italic' }}>Equações de Combate</span>
                </div>
                
                <p style={{ color: '#aaa', fontSize: '0.85em', margin: '0 0 20px 0' }}>Estes são os seus valores base. Habilidades, posturas e equipamentos equipados injetam o seu poder nestas equações de forma automática.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #555' }}>
                        <label style={{ color: '#ccc', fontSize: '0.85em', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Mult. Base</span>
                            {buffsDano._hasBuff.mbase && <span style={{ color: '#0f0', fontWeight: 'bold' }}>+{buffsDano.mbase.toFixed(2)}</span>}
                        </label>
                        <input className="input-neon" type="number" step="0.01" value={dmBase} onChange={e => setDmBase(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #555' }}>
                        <label style={{ color: '#ccc', fontSize: '0.85em', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>Mult. Potencial</label>
                        <input className="input-neon" type="number" step="0.01" value={dmPotencial} onChange={e => setDmPotencial(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                    </div>
                    
                    <div style={{ background: 'rgba(255,0,60,0.05)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #ff003c' }}>
                        <label style={{ color: '#ff003c', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Mult. Geral</span>
                            {buffsDano._hasBuff.mgeral && <span style={{ color: '#0f0', fontWeight: 'bold' }}>+{buffsDano.mgeral.toFixed(2)}</span>}
                        </label>
                        <input className="input-neon" type="number" step="0.01" value={dmGeral} onChange={e => setDmGeral(e.target.value)} style={{ width: '100%', padding: '6px', borderColor: '#ff003c', color: '#ff003c' }} />
                        
                        {buffsDano.fontesMgeral && buffsDano.fontesMgeral.length > 0 && (
                            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0,255,0,0.1)', borderRadius: '4px', border: '1px dashed #0f0' }}>
                                <span style={{ color: '#aaa', fontSize: '0.7em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🔍 A injeção de poder vem de:</span>
                                {buffsDano.fontesMgeral.map((fnt, idx) => (
                                    <div key={idx} style={{ color: '#0f0', fontSize: '0.75em', textShadow: '0 0 3px rgba(0,255,0,0.5)' }}>• {fnt}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #555' }}>
                        <label style={{ color: '#ccc', fontSize: '0.85em', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Mult. de Formas</span>
                            {buffsDano._hasBuff.mformas && <span style={{ color: '#0f0', fontWeight: 'bold' }}>+{buffsDano.mformas.toFixed(2)}</span>}
                        </label>
                        <input className="input-neon" type="number" step="0.01" value={dmFormas} onChange={e => setDmFormas(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #555' }}>
                        <label style={{ color: '#ccc', fontSize: '0.85em', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Mult. Absoluto</span>
                            {buffsDano._hasBuff.mabs && <span style={{ color: '#0f0', fontWeight: 'bold' }}>+{buffsDano.mabs.toFixed(2)}</span>}
                        </label>
                        <input className="input-neon" type="number" step="0.01" value={dmAbsoluto} onChange={e => setDmAbsoluto(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                    </div>
                    
                    <div style={{ background: 'rgba(255,204,0,0.05)', padding: '12px', borderRadius: '5px', borderLeft: '2px solid #ffcc00' }}>
                        <label style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Mult. Único</span>
                            {buffsDano.munico.length > 0 && <span style={{ color: '#0f0', fontWeight: 'bold' }}>x{buffsDano.munico.join(' e x')}</span>}
                        </label>
                        <input className="input-neon" type="text" value={dmUnico} onChange={e => setDmUnico(e.target.value)} style={{ width: '100%', padding: '6px', borderColor: '#ffcc00', color: '#ffcc00' }} />
                    </div>
                </div>

                <button
                    className="btn-neon btn-red"
                    onClick={salvarMultiplicadores}
                    style={{
                        marginTop: '20px', width: '100%', padding: '10px', fontSize: '1em', letterSpacing: '1px',
                        backgroundColor: salvandoMult ? 'rgba(0, 255, 100, 0.2)' : undefined,
                        borderColor: salvandoMult ? '#00ffcc' : undefined,
                        color: salvandoMult ? '#fff' : undefined
                    }}
                >
                    {salvandoMult ? '✔️ EQUAÇÕES ATUALIZADAS!' : '🔥 GUARDAR MULTIPLICADORES DE DANO'}
                </button>
            </div>

            <TabelaPrestigio />
        </div>
    );
}