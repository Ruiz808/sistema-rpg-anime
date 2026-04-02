import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

const CLASSES_REGULARES_BASE = [
    { id: 'saber', nome: 'Saber', icone: '⚔️', titulo: 'Cavaleiro da Espada', cor: '#0088ff', passiva: 'Resistência Mágica', desc: 'A classe mais equilibrada das sete. Especialistas no domínio de lâminas.', efeito: 'Excelentes atributos base em Força, Constituição e Destreza.', efeitosMatematicos: [{ atributo: 'corpo', propriedade: 'mbase', valor: 0.5 }, { atributo: 'constituicao', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'archer', nome: 'Archer', icone: '🏹', titulo: 'Cavaleiro do Arco', cor: '#ff003c', passiva: 'Ação Independente', desc: 'Especialistas em combate à distância e projéteis.', efeito: 'Possuem bónus massivo em precisão e Letalidade.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'letalidade', valor: 20 }] },
    { id: 'lancer', nome: 'Lancer', icone: '🗡️', titulo: 'Cavaleiro da Lança', cor: '#00ffcc', passiva: 'Proteção contra Flechas', desc: 'Guerreiros velozes que empunham armas de haste.', efeito: 'Altamente ágeis e letais no corpo a corpo.', efeitosMatematicos: [{ atributo: 'destreza', propriedade: 'mbase', valor: 0.5 }, { atributo: 'stamina', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'rider', nome: 'Rider', icone: '🏇', titulo: 'Cavaleiro de Montaria', cor: '#ff8800', passiva: 'Montaria (Riding)', desc: 'Espíritos associados a grandes lendas de montarias.', efeito: 'Altíssima velocidade de movimento no mapa e evasão.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'bonus_evasiva', valor: 200 }] },
    { id: 'caster', nome: 'Caster', icone: '🧙‍♂️', titulo: 'Conjurador Magus', cor: '#cc00ff', passiva: 'Criação de Território', desc: 'Estudiosos dos mistérios mágicos e construtores de domínios.', efeito: 'Fracos no corpo a corpo, mas com Inteligência e Sabedoria supremas.', efeitosMatematicos: [{ atributo: 'inteligencia', propriedade: 'mbase', valor: 0.5 }, { atributo: 'sabedoria', propriedade: 'mbase', valor: 0.5 }, { atributo: 'mana', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'assassin', nome: 'Assassin', icone: '🔪', titulo: 'Assassino Furtivo', cor: '#444444', passiva: 'Ocultação de Presença', desc: 'Mestres da furtividade e ataques críticos.', efeito: 'Aumenta permanentemente o multiplicador dos Críticos.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'criticonormal', valor: 1 }, { atributo: 'geral', propriedade: 'criticofatal', valor: 1 }] },
    { id: 'berserker', nome: 'Berserker', icone: '狂', titulo: 'O Guerreiro Insano', cor: '#ff0000', passiva: 'Mad Enhancement', desc: 'Heróis que sucumbiram à fúria ou à loucura.', efeito: 'Quanto mais HP perde, mais forte fica (Dano e Status).', efeitosMatematicos: [{ atributo: 'vida', propriedade: 'munico', valor: 1.5 }, { atributo: 'corpo', propriedade: 'munico', valor: 1.5 }, { atributo: 'dano', propriedade: 'furia_berserker', valor: 1.5 }, { atributo: 'todos_status', propriedade: 'furia_berserker', valor: 1.5 }] }
];

const CLASSES_EXTRA_BASE = [
    { id: 'shielder', nome: 'Shielder', icone: '🛡️', titulo: 'O Escudo Protetor', cor: '#00ffff', passiva: 'Frente de Batalha', desc: 'Classe defensiva suprema.', efeito: 'Consegue transferir o dano de aliados para si mesmo e criar barreiras.', efeitosMatematicos: [{ atributo: 'constituicao', propriedade: 'mbase', valor: 1.0 }, { atributo: 'forca', propriedade: 'mbase', valor: 1.0 }, { atributo: 'geral', propriedade: 'bonus_resistencia', valor: 500 }] },
    { id: 'ruler', nome: 'Ruler', icone: '⚖️', titulo: 'O Árbitro Santo', cor: '#ffcc00', passiva: 'Resolução Divina', desc: 'Invocados para manter as regras do mundo.', efeito: 'Recebem metade do dano das 6 classes regulares.', efeitosMatematicos: [{ atributo: 'todos_status', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'avenger', nome: 'Avenger', icone: '⛓️', titulo: 'O Vingador', cor: '#880000', passiva: 'Vingança Eterna', desc: 'Nascidos do ódio e traição.', efeito: 'Multiplicador único de x10 em Status e Dano.', efeitosMatematicos: [{ atributo: 'dano', propriedade: 'munico', valor: 10 }, { atributo: 'todos_status', propriedade: 'munico', valor: 10 }] },
    { id: 'alterego', nome: 'Alter Ego', icone: '🎭', titulo: 'O Fragmento de Ego', cor: '#ff00ff', passiva: 'Dualidade', desc: 'Fusão de múltiplos espíritos.', efeito: 'Têm vantagem contra as classes da Cavalaria.', efeitosMatematicos: [{ atributo: 'carisma', propriedade: 'mbase', valor: 0.5 }, { atributo: 'energiaesp', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'foreigner', nome: 'Foreigner', icone: '🐙', titulo: 'O Viajante do Abismo', cor: '#00ff88', passiva: 'Existência Fora do Domínio', desc: 'Conectados a entidades além do universo conhecido.', efeito: 'Resistência passiva a dano psicológico.', efeitosMatematicos: [{ atributo: 'sabedoria', propriedade: 'mbase', valor: 1.0 }] },
    { id: 'mooncancer', nome: 'Moon Cancer', icone: '🌕', titulo: 'A Anomalia Digital', cor: '#8888aa', passiva: 'Erro de Sistema', desc: 'Capazes de corromper as próprias regras do combate.', efeito: 'Causam dano extra aos Avengers.', efeitosMatematicos: [{ atributo: 'inteligencia', propriedade: 'mbase', valor: 1.0 }] },
    { id: 'pretender', nome: 'Pretender', icone: '🤥', titulo: 'O Falso Heroico', cor: '#ffaa00', passiva: 'Engano Perfeito', desc: 'Aqueles que assumem a identidade de outros.', efeito: 'Imunes a habilidades de leitura de status.', efeitosMatematicos: [{ atributo: 'carisma', propriedade: 'mbase', valor: 0.5 }, { atributo: 'destreza', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'beast', nome: 'Beast', icone: '👹', titulo: 'O Mal da Humanidade', cor: '#4a0000', passiva: 'Autoridade da Besta', desc: 'Os Males Originais da humanidade.', efeito: 'Possuem barras de HP massivas.', efeitosMatematicos: [{ atributo: 'pv', propriedade: 'munico', valor: 3.0 }, { atributo: 'pm', propriedade: 'munico', valor: 3.0 }, { atributo: 'dano', propriedade: 'mgeral', valor: 1.0 }] },
    { id: 'savior', nome: 'Savior', icone: '☀️', titulo: 'O Iluminado', cor: '#ffffff', passiva: 'Iluminação', desc: 'Seres messiânicos transcendentes.', efeito: 'Focam-se em curas monumentais.', efeitosMatematicos: [{ atributo: 'aura', propriedade: 'mbase', valor: 2.0 }, { atributo: 'chakra', propriedade: 'mbase', valor: 2.0 }] }
];

const CompendioFormContext = createContext(null);

export function useCompendioForm() {
    const ctx = useContext(CompendioFormContext);
    if (!ctx) return null;
    return ctx;
}

export function CompendioFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const personagens = useStore(s => s.personagens);
    const isMestre = useStore(s => s.isMestre);
    const updateFicha = useStore(s => s.updateFicha);

    const [secaoAtiva, setSecaoAtiva] = useState('classes');
    const [editandoId, setEditandoId] = useState(null);
    const [tempNome, setTempNome] = useState('');
    const [tempTitulo, setTempTitulo] = useState('');
    const [tempPassiva, setTempPassiva] = useState('');
    const [tempDesc, setTempDesc] = useState('');
    const [tempEfeito, setTempEfeito] = useState('');
    const [tempIconeUrl, setTempIconeUrl] = useState('');
    const [tempEfeitosMat, setTempEfeitosMat] = useState([]);
    const [mesaGrand, setMesaGrand] = useState('presente');

    const overridesCompendio = useMemo(() => {
        if (!minhaFicha) return {};
        if (isMestre && minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for (let k of chaves) {
                if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides;
            }
        }
        return {};
    }, [isMestre, minhaFicha, personagens]);

    const mesclarComOverrides = useCallback((classesBase) => {
        return classesBase.map(cls => {
            const custom = overridesCompendio[cls.id];
            if (custom) {
                return {
                    ...cls,
                    nome: custom.nome || cls.nome,
                    titulo: custom.titulo || cls.titulo,
                    passiva: custom.passiva || cls.passiva,
                    desc: custom.desc || cls.desc,
                    efeito: custom.efeito || cls.efeito,
                    iconeUrl: custom.iconeUrl || cls.iconeUrl,
                    efeitosMatematicos: custom.efeitosMatematicos || cls.efeitosMatematicos
                };
            }
            return cls;
        });
    }, [overridesCompendio]);

    const regulares = useMemo(() => mesclarComOverrides(CLASSES_REGULARES_BASE), [mesclarComOverrides]);
    const extras = useMemo(() => mesclarComOverrides(CLASSES_EXTRA_BASE), [mesclarComOverrides]);
    const todasClasses = useMemo(() => [...regulares, ...extras], [regulares, extras]);

    const grands = useMemo(() => overridesCompendio.grands || {}, [overridesCompendio]);

    const handleDefinirGrand = useCallback((classeId, nomeTitular) => {
        updateFicha(f => {
            if (!f.compendioOverrides) f.compendioOverrides = {};
            if (!f.compendioOverrides.grands) f.compendioOverrides.grands = {};

            f.compendioOverrides.grands[`${classeId}_${mesaGrand}`] = nomeTitular;

            if (nomeTitular) {
                const keyCand = `${classeId}_${mesaGrand}_candidatos`;
                const listaCandidatos = f.compendioOverrides.grands[keyCand] || [];
                if (listaCandidatos.includes(nomeTitular)) {
                    f.compendioOverrides.grands[keyCand] = listaCandidatos.filter(n => n !== nomeTitular);
                }
            }
        });
        salvarFichaSilencioso();

        if (nomeTitular) {
            enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🏛️ O Trono da Ascensão (${mesaGrand.toUpperCase()}) ressoou! ${nomeTitular.toUpperCase()} foi coroado(a) como GRAND ${classeId.toUpperCase()}!` });
        } else {
            enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🩸 O Trono da Ascensão (${mesaGrand.toUpperCase()}) de GRAND ${classeId.toUpperCase()} está agora VAGO!` });
        }
    }, [updateFicha, mesaGrand]);

    const handleAdicionarCandidato = useCallback((classeId, nomeCandidato) => {
        if (!nomeCandidato) return;
        updateFicha(f => {
            if (!f.compendioOverrides) f.compendioOverrides = {};
            if (!f.compendioOverrides.grands) f.compendioOverrides.grands = {};

            const keyCand = `${classeId}_${mesaGrand}_candidatos`;
            const lista = f.compendioOverrides.grands[keyCand] || [];

            if (!lista.includes(nomeCandidato)) {
                f.compendioOverrides.grands[keyCand] = [...lista, nomeCandidato];
            }
        });
        salvarFichaSilencioso();
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🌟 O sistema reconhece o poder divino! ${nomeCandidato.toUpperCase()} é agora oficialmente um(a) CANDIDATO(A) A GRAND ${classeId.toUpperCase()} (${mesaGrand})!` });
    }, [updateFicha, mesaGrand]);

    const handleRemoverCandidato = useCallback((classeId, nomeCandidato) => {
        updateFicha(f => {
            if (!f.compendioOverrides?.grands) return;
            const keyCand = `${classeId}_${mesaGrand}_candidatos`;
            const lista = f.compendioOverrides.grands[keyCand] || [];
            f.compendioOverrides.grands[keyCand] = lista.filter(n => n !== nomeCandidato);
        });
        salvarFichaSilencioso();
    }, [updateFicha, mesaGrand]);

    const handleDefinirIconeGrand = useCallback((classeId, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateFicha(f => {
                    if (!f.compendioOverrides) f.compendioOverrides = {};
                    if (!f.compendioOverrides.grands) f.compendioOverrides.grands = {};
                    f.compendioOverrides.grands[`${classeId}_${mesaGrand}_icone`] = reader.result;
                });
                salvarFichaSilencioso();
            };
            reader.readAsDataURL(file);
        }
    }, [updateFicha, mesaGrand]);

    const limparIconeGrand = useCallback((classeId) => {
        updateFicha(f => {
            if (f.compendioOverrides?.grands) {
                delete f.compendioOverrides.grands[`${classeId}_${mesaGrand}_icone`];
            }
        });
        salvarFichaSilencioso();
    }, [updateFicha, mesaGrand]);

    const iniciarEdicao = useCallback((classe) => {
        setEditandoId(classe.id);
        setTempNome(classe.nome || '');
        setTempTitulo(classe.titulo || '');
        setTempPassiva(classe.passiva || '');
        setTempDesc(classe.desc || '');
        setTempEfeito(classe.efeito || '');
        setTempIconeUrl(classe.iconeUrl || '');
        setTempEfeitosMat(classe.efeitosMatematicos ? classe.efeitosMatematicos.map(ef => ({ ...ef })) : []);
    }, []);

    const salvarEdicao = useCallback((id) => {
        updateFicha(f => {
            if (!f.compendioOverrides) f.compendioOverrides = {};
            f.compendioOverrides[id] = {
                nome: tempNome,
                titulo: tempTitulo,
                passiva: tempPassiva,
                desc: tempDesc,
                efeito: tempEfeito,
                iconeUrl: tempIconeUrl,
                efeitosMatematicos: tempEfeitosMat
            };
        });
        salvarFichaSilencioso();
        setEditandoId(null);
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: '📜 O Mestre reescreveu os registos matemáticos do Compêndio!' });
    }, [updateFicha, tempNome, tempTitulo, tempPassiva, tempDesc, tempEfeito, tempIconeUrl, tempEfeitosMat]);

    const cancelarEdicao = useCallback(() => setEditandoId(null), []);

    const handleEfMat = useCallback((index, campo, valor) => {
        setTempEfeitosMat(prev => prev.map((ef, i) => {
            if (i === index) {
                if (campo === 'propriedade' && valor !== 'proficiencia_arma' && ef.propriedade === 'proficiencia_arma') {
                    return { ...ef, [campo]: valor, atributo: '' };
                }
                return { ...ef, [campo]: valor };
            }
            return ef;
        }));
    }, []);

    const addEfMat = useCallback(() => {
        setTempEfeitosMat(prev => [...prev, { atributo: '', propriedade: '', valor: '' }]);
    }, []);

    const removeEfMat = useCallback((index) => {
        setTempEfeitosMat(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleImageUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTempIconeUrl(reader.result);
            reader.readAsDataURL(file);
        }
    }, []);

    const opcoesPersonagensPorMesa = useMemo(() => {
        return Object.entries(personagens || {})
            .filter(([n, f]) => {
                const m = f?.bio?.mesa || 'presente';
                return m === mesaGrand || m === 'npc';
            })
            .map(([n]) => n);
    }, [personagens, mesaGrand]);

    const value = useMemo(() => ({
        secaoAtiva,
        setSecaoAtiva,
        editandoId,
        tempNome,
        setTempNome,
        tempTitulo,
        setTempTitulo,
        tempPassiva,
        setTempPassiva,
        tempDesc,
        setTempDesc,
        tempEfeito,
        setTempEfeito,
        tempIconeUrl,
        setTempIconeUrl,
        tempEfeitosMat,
        setTempEfeitosMat,
        mesaGrand,
        setMesaGrand,
        isMestre,
        regulares,
        extras,
        todasClasses,
        grands,
        overridesCompendio,
        opcoesPersonagensPorMesa,
        handleDefinirGrand,
        handleAdicionarCandidato,
        handleRemoverCandidato,
        handleDefinirIconeGrand,
        limparIconeGrand,
        iniciarEdicao,
        salvarEdicao,
        cancelarEdicao,
        handleEfMat,
        addEfMat,
        removeEfMat,
        handleImageUpload
    }), [
        secaoAtiva, editandoId, tempNome, tempTitulo, tempPassiva, tempDesc, tempEfeito,
        tempIconeUrl, tempEfeitosMat, mesaGrand, isMestre, regulares, extras, todasClasses,
        grands, overridesCompendio, opcoesPersonagensPorMesa, handleDefinirGrand,
        handleAdicionarCandidato, handleRemoverCandidato, handleDefinirIconeGrand,
        limparIconeGrand, iniciarEdicao, salvarEdicao, cancelarEdicao, handleEfMat,
        addEfMat, removeEfMat, handleImageUpload
    ]);

    return (
        <CompendioFormContext.Provider value={value}>
            {children}
        </CompendioFormContext.Provider>
    );
}
