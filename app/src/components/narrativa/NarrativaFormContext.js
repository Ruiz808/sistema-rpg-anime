import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

export const ATRIBUTO_OPTIONS = [
    'forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao',
    'vida', 'mana', 'aura', 'chakra', 'corpo', 'todos_status', 'todas_energias', 'geral', 'dano'
];

export const PROPRIEDADE_OPTIONS = [
    'base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'
];

const NarrativaFormContext = createContext(null);

export function useNarrativaForm() {
    const ctx = useContext(NarrativaFormContext);
    if (!ctx) return null;
    return ctx;
}

export function NarrativaFormProvider({ children }) {
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

    // Passive creation/editing
    const [passivaNome, setPassivaNome] = useState('');
    const [passivaTipo, setPassivaTipo] = useState('Vantagem');
    const [efeitosTempPassiva, setEfeitosTempPassiva] = useState([]);
    const [nomeEfeito, setNomeEfeito] = useState('');
    const [novoAtr, setNovoAtr] = useState('forca');
    const [novoProp, setNovoProp] = useState('base');
    const [novoVal, setNovoVal] = useState('');
    const [editIndex, setEditIndex] = useState(-1);

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
    }, [minhaFicha.bio]);

    useEffect(() => {
        carregarBio();
    }, [carregarBio]);

    const passivas = minhaFicha.passivas || [];

    const salvarBio = useCallback(() => {
        updateFicha((ficha) => {
            if (!ficha.bio) ficha.bio = {};
            ficha.bio.raca = raca;
            ficha.bio.classe = classe;
            ficha.bio.idade = idade;
            ficha.bio.fisico = fisico;
            ficha.bio.sangue = sangue;
            ficha.bio.alinhamento = alinhamento;
            ficha.bio.afiliacao = afiliacao;
            ficha.bio.dinheiro = dinheiro;
        });
        salvarFichaSilencioso();
        setSalvando(true);
        setTimeout(() => setSalvando(false), 2000);
    }, [updateFicha, raca, classe, idade, fisico, sangue, alinhamento, afiliacao, dinheiro]);

    const addEfeitoPassiva = useCallback(() => {
        if (!novoVal || !nomeEfeito.trim()) { alert('Preencha o nome e o valor do efeito!'); return; }
        setEfeitosTempPassiva(prev => [...prev, {
            nome: nomeEfeito.trim(),
            atributo: novoAtr,
            propriedade: novoProp,
            valor: novoVal
        }]);
        setNovoVal('');
        setNomeEfeito('');
    }, [novoVal, nomeEfeito, novoAtr, novoProp]);

    const removerEfeitoPassiva = useCallback((i) => {
        setEfeitosTempPassiva(prev => {
            const newList = [...prev];
            newList.splice(i, 1);
            return newList;
        });
    }, []);

    const cancelarEdicao = useCallback(() => {
        setPassivaNome('');
        setPassivaTipo('Vantagem');
        setEfeitosTempPassiva([]);
        setEditIndex(-1);
    }, []);

    const editarPassiva = useCallback((index) => {
        const p = passivas[index];
        setPassivaNome(p.nome);
        setPassivaTipo(p.tipo || 'Vantagem');
        setEfeitosTempPassiva(JSON.parse(JSON.stringify(p.efeitos || [])));
        setEditIndex(index);
        document.getElementById('painel-edicao-passiva')?.scrollIntoView({ behavior: 'smooth' });
    }, [passivas]);

    const salvarPassiva = useCallback(() => {
        if (passivaNome.trim() === '') {
            alert('Digite o nome da habilidade!');
            return;
        }

        updateFicha((ficha) => {
            if (!ficha.passivas) ficha.passivas = [];
            const novaPassiva = {
                nome: passivaNome.trim(),
                tipo: passivaTipo,
                efeitos: JSON.parse(JSON.stringify(efeitosTempPassiva))
            };
            if (editIndex >= 0) {
                ficha.passivas[editIndex] = novaPassiva;
            } else {
                ficha.passivas.push(novaPassiva);
            }
        });

        cancelarEdicao();
        salvarFichaSilencioso();
    }, [updateFicha, passivaNome, passivaTipo, efeitosTempPassiva, editIndex, cancelarEdicao]);

    const removerPassiva = useCallback((index) => {
        updateFicha((ficha) => {
            if (!ficha.passivas) return;
            ficha.passivas.splice(index, 1);
        });
        if (editIndex === index) cancelarEdicao();
        salvarFichaSilencioso();
    }, [updateFicha, editIndex, cancelarEdicao]);

    // Auto-audit report
    const relatorioAuditoria = useMemo(() => {
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

        const sections = [];
        let hasContent = false;

        for (const prop in nomesProps) {
            if (mapaEfeitos[prop].length > 0) {
                hasContent = true;
                sections.push({ key: prop, label: nomesProps[prop], items: mapaEfeitos[prop], color: '#f0f' });
            }
        }
        if (mapaEfeitos.especial.length > 0) {
            hasContent = true;
            sections.push({ key: 'especial', label: 'OUTROS EFEITOS', items: mapaEfeitos.especial, color: '#0ff' });
        }

        return { hasContent, sections };
    }, [passivas]);

    const value = useMemo(() => ({
        raca, setRaca,
        classe, setClasse,
        idade, setIdade,
        fisico, setFisico,
        sangue, setSangue,
        alinhamento, setAlinhamento,
        afiliacao, setAfiliacao,
        dinheiro, setDinheiro,
        salvando,
        salvarBio,
        passivaNome, setPassivaNome,
        passivaTipo, setPassivaTipo,
        efeitosTempPassiva,
        nomeEfeito, setNomeEfeito,
        novoAtr, setNovoAtr,
        novoProp, setNovoProp,
        novoVal, setNovoVal,
        editIndex,
        passivas,
        addEfeitoPassiva,
        removerEfeitoPassiva,
        editarPassiva,
        cancelarEdicao,
        salvarPassiva,
        removerPassiva,
        relatorioAuditoria,
    }), [
        raca, classe, idade, fisico, sangue, alinhamento, afiliacao, dinheiro,
        salvando, salvarBio,
        passivaNome, passivaTipo, efeitosTempPassiva,
        nomeEfeito, novoAtr, novoProp, novoVal, editIndex,
        passivas,
        addEfeitoPassiva, removerEfeitoPassiva, editarPassiva,
        cancelarEdicao, salvarPassiva, removerPassiva,
        relatorioAuditoria,
    ]);

    return (
        <NarrativaFormContext.Provider value={value}>
            {children}
        </NarrativaFormContext.Provider>
    );
}
