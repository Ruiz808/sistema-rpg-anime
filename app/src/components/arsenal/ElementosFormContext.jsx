import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';
import { calcularAcerto } from '../../core/engine';

export const emogis = {
    'Fogo': '\uD83D\uDD25', 'Agua': '\uD83D\uDCA7', 'Raio': '\u26A1', 'Terra': '\uD83E\uDEA8', 'Vento': '\uD83C\uDF2A\uFE0F',
    'Fogo Verdadeiro': '\uD83D\uDD25', 'Agua Verdadeira': '\uD83D\uDCA7', 'Raio Verdadeiro': '\u26A1', 'Terra Verdadeira': '\uD83E\uDEA8', 'Vento Verdadeiro': '\uD83C\uDF2A\uFE0F',
    'Solar': '\u2600\uFE0F', 'Solar Verdadeiro': '\u2600\uFE0F', 'Gelo': '\u2744\uFE0F', 'Gelo Verdadeiro': '\u2744\uFE0F', 'Natureza': '\uD83C\uDF3F', 'Natureza Verdadeira': '\uD83C\uDF3F', 'Energia': '\uD83D\uDCAB', 'Energia Verdadeira': '\uD83D\uDCAB', 'Vacuo': '\uD83D\uDD73\uFE0F', 'Vacuo Verdadeiro': '\uD83D\uDD73\uFE0F',
    'Luz': '\u2728', 'Trevas': '\uD83C\uDF11', 'Ether': '\uD83C\uDF0C', 'Celestial': '\uD83C\uDF1F', 'Infernal': '\uD83C\uDF0B', 'Caos': '\uD83C\uDF00', 'Criacao': '\uD83C\uDF87', 'Destruicao': '\uD83D\uDCA5', 'Cosmos': '\u267E\uFE0F',
    'Vida': '\uD83C\uDF3A', 'Morte': '\uD83D\uDC80', 'Vazio': '\u2B1B', 'Neutro': '\u26AA',
    'Magia de Osso': '\uD83E\uDDB4', 'Magia de Sangue': '\uD83E\uDE78', 'Magia de Borracha': '\uD83C\uDF88', 'Magia de Sal': '\uD83E\uDDC2', 'Magia de Alma': '\uD83D\uDC7B', 'Magia de Tremor': '\uD83E\uDEE8', 'Magia de Gravidade': '\uD83C\uDF0C', 'Magia de Equipamento': '\u2699\uFE0F', 'Magia de Tempo': '\u23F3', 'Magia Draconica': '\uD83D\uDC09', 'Magia de Espelho': '\uD83E\uDE9E', 'Magia de Explosao': '\uD83D\uDCA5', 'Magia Espacial': '\uD83C\uDF00', 'Magia de Metamorfose': '\uD83C\uDFAD',
    'Magias Arcanas/Negra de 1º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 2º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 3º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 4º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 5º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 6º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 7º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 8º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 9º Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 10º Ciclo': '\uD83D\uDD2E',
    'Magias de 1º Ciclo': '\uD83D\uDD04', 'Magias de 2º Ciclo': '\uD83D\uDD04', 'Magias de 3º Ciclo': '\uD83D\uDD04', 'Magias de 4º Ciclo': '\uD83D\uDD04', 'Magias de 5º Ciclo': '\uD83D\uDD04', 'Magias de 6º Ciclo': '\uD83D\uDD04', 'Magias de 7º Ciclo': '\uD83D\uDD04', 'Magias de 8º Ciclo': '\uD83D\uDD04', 'Magias de 9º Ciclo': '\uD83D\uDD04', 'Magias de 10º Ciclo': '\uD83D\uDD04',
    'Elemento Madeira': '\uD83E\uDEB5', 'Elemento Mineral': '\uD83D\uDC8E', 'Elemento Cinzas': '\uD83C\uDF2B\uFE0F', 'Elemento Igneo': '\u2604\uFE0F', 'Elemento Lava': '\uD83C\uDF0B', 'Elemento Vapor': '\u2668\uFE0F', 'Elemento Nevoa': '\uD83C\uDF2B\uFE0F', 'Elemento Tempestade': '\uD83C\uDF29\uFE0F', 'Elemento Areia': '\uD83C\uDFDC\uFE0F', 'Elemento Tufao': '\uD83C\uDF2A\uFE0F',
    'Elemento Velocidade': '\uD83D\uDCA8', 'Elemento Poeira': '\uD83D\uDD32', 'Elemento Calor': '\uD83C\uDF21\uFE0F', 'Elemento Cal': '\u2B1C', 'Elemento Carbono': '\u2B1B', 'Elemento Veneno': '\u2623\uFE0F', 'Elemento Magnetismo': '\uD83E\uDDF2', 'Elemento Som': '\uD83D\uDD0A',
    'Truques de Ciclo': '✨', 'Truques Arcanos/Negros': '🔮', 'Truques Ancestrais': '📜',
    'Aura Pura': '✨', 'Projeção de Aura': '🛡️', 'Artes Marciais': '🥋', 'Reforço Físico': '💪', 'Fusões Básicas': '🌀', 'Fusões Avançadas': '⚛️'
};

export const cores = {
    'Fogo': '#ff4d4d', 'Agua': '#4dffff', 'Raio': '#ffff4d', 'Terra': '#d2a679', 'Vento': '#4dff88',
    'Fogo Verdadeiro': '#ff0000', 'Agua Verdadeira': '#00e6e6', 'Raio Verdadeiro': '#ffff00', 'Terra Verdadeira': '#d48846', 'Vento Verdadeiro': '#00ff40',
    'Solar': '#ffb366', 'Solar Verdadeiro': '#ff6600', 'Gelo': '#99ffff', 'Gelo Verdadeiro': '#00ffff', 'Natureza': '#66ff66', 'Natureza Verdadeira': '#00ff00', 'Energia': '#ff66ff', 'Energia Verdadeira': '#ff00ff', 'Vacuo': '#999999', 'Vacuo Verdadeiro': '#ffffff',
    'Luz': '#ffffff', 'Trevas': '#800080', 'Ether': '#b366ff', 'Celestial': '#ffffcc', 'Infernal': '#cc0000', 'Caos': '#ff3399', 'Criacao': '#00ffcc', 'Destruicao': '#8b0000', 'Cosmos': '#4d0099',
    'Vida': '#33ff77', 'Morte': '#4d4d4d', 'Vazio': '#1a1a1a', 'Neutro': '#cccccc',
    'Magia de Osso': '#e6e6e6', 'Magia de Sangue': '#ff0000', 'Magia de Borracha': '#ff99cc', 'Magia de Sal': '#fdfdfd', 'Magia de Alma': '#33cccc', 'Magia de Tremor': '#cc9966', 'Magia de Gravidade': '#6600cc', 'Magia de Equipamento': '#b3b3b3', 'Magia de Tempo': '#ffd700', 'Magia Draconica': '#ff5500', 'Magia de Espelho': '#ccffff', 'Magia de Explosao': '#ff3300', 'Magia Espacial': '#000066', 'Magia de Metamorfose': '#ff66b3',
    'Magias Arcanas/Negra de 1º Ciclo': '#d9b3ff', 'Magias Arcanas/Negra de 2º Ciclo': '#cc99ff', 'Magias Arcanas/Negra de 3º Ciclo': '#bf80ff', 'Magias Arcanas/Negra de 4º Ciclo': '#b366ff', 'Magias Arcanas/Negra de 5º Ciclo': '#a64dff', 'Magias Arcanas/Negra de 6º Ciclo': '#9933ff', 'Magias Arcanas/Negra de 7º Ciclo': '#8c1aff', 'Magias Arcanas/Negra de 8º Ciclo': '#8000ff', 'Magias Arcanas/Negra de 9º Ciclo': '#6600cc', 'Magias Arcanas/Negra de 10º Ciclo': '#4d0099',
    'Magias de 1º Ciclo': '#b3ffe6', 'Magias de 2º Ciclo': '#80ffcc', 'Magias de 3º Ciclo': '#4dffb3', 'Magias de 4º Ciclo': '#1aff99', 'Magias de 5º Ciclo': '#00e68a', 'Magias de 6º Ciclo': '#00cc7a', 'Magias de 7º Ciclo': '#00b36b', 'Magias de 8º Ciclo': '#00995c', 'Magias de 9º Ciclo': '#00804d', 'Magias de 10º Ciclo': '#00663d',
    'Elemento Madeira': '#8b5a2b', 'Elemento Mineral': '#e6e6fa', 'Elemento Cinzas': '#808080', 'Elemento Igneo': '#ff4500', 'Elemento Lava': '#ff0000', 'Elemento Vapor': '#ffb6c1', 'Elemento Nevoa': '#b0e0e6', 'Elemento Tempestade': '#ccccff', 'Elemento Areia': '#f4a460', 'Elemento Tufao': '#98fb98',
    'Elemento Velocidade': '#e6ffff', 'Elemento Poeira': '#d9d9d9', 'Elemento Calor': '#ff6600', 'Elemento Cal': '#e6ccb3', 'Elemento Carbono': '#595959', 'Elemento Veneno': '#9933ff', 'Elemento Magnetismo': '#4169e1', 'Elemento Som': '#a6a6a6',
    'Truques de Ciclo': '#b3ffe6', 'Truques Arcanos/Negros': '#d9b3ff', 'Truques Ancestrais': '#e6e6e6',
    'Aura Pura': '#b366ff', 'Projeção de Aura': '#b366ff', 'Artes Marciais': '#ff3333', 'Reforço Físico': '#ff3333', 'Fusões Básicas': '#ff00ff', 'Fusões Avançadas': '#ff00ff'
};

export const ABAS_GRIMORIO = {
    'elementos': {
        label: 'Elementos', icon: '🔥',
        categorias: [
            { titulo: 'Elementos Básicos', itens: ['Fogo', 'Raio', 'Agua', 'Vento', 'Terra'] },
            { titulo: 'Elementos Básicos Verdadeiros', itens: ['Fogo Verdadeiro', 'Raio Verdadeiro', 'Agua Verdadeira', 'Vento Verdadeiro', 'Terra Verdadeira'] },
            { titulo: 'Elementos Avançados', itens: ['Solar', 'Energia', 'Gelo', 'Vacuo', 'Natureza'] },
            { titulo: 'Elementos Avançados Verdadeiros', itens: ['Solar Verdadeiro', 'Energia Verdadeira', 'Gelo Verdadeiro', 'Vacuo Verdadeiro', 'Natureza Verdadeira'] },
            { titulo: 'Elementos Primordiais', itens: ['Luz', 'Trevas', 'Ether'] },
            { titulo: 'Elementos Primordiais Verdadeiros', itens: ['Celestial', 'Infernal', 'Caos'] },
            { titulo: 'Elementos Primordiais Absolutos', itens: ['Criacao', 'Destruicao', 'Cosmos'] },
            { titulo: 'Neutro (Sem Elemento)', itens: ['Neutro'] }
        ]
    },
    'astrais': { label: 'Elementos Astrais', icon: '🌌', categorias: [{ titulo: 'Elementos Astrais', itens: ['Vida', 'Morte', 'Vazio'] }] },
    'chakra': { label: 'Chakra', icon: '🌀', categorias: [
        { titulo: 'Kekkei Genkai', itens: ['Elemento Madeira', 'Elemento Mineral', 'Elemento Cinzas', 'Elemento Igneo', 'Elemento Lava', 'Elemento Vapor', 'Elemento Nevoa', 'Elemento Tempestade', 'Elemento Areia', 'Elemento Tufao'] },
        { titulo: 'Kekkei Touta', itens: ['Elemento Velocidade', 'Elemento Poeira', 'Elemento Veneno', 'Elemento Cal', 'Elemento Carbono', 'Elemento Calor', 'Elemento Som', 'Elemento Magnetismo'] }
    ] },
    'mana': { label: 'Mana', icon: '🔮', categorias: [
        { titulo: 'Magias de Ciclo', itens: ['Truques de Ciclo', 'Magias de 1º Ciclo', 'Magias de 2º Ciclo', 'Magias de 3º Ciclo', 'Magias de 4º Ciclo', 'Magias de 5º Ciclo', 'Magias de 6º Ciclo', 'Magias de 7º Ciclo', 'Magias de 8º Ciclo', 'Magias de 9º Ciclo', 'Magias de 10º Ciclo'] },
        { titulo: 'Magias Arcanas/Negra', itens: ['Truques Arcanos/Negros', 'Magias Arcanas/Negra de 1º Ciclo', 'Magias Arcanas/Negra de 2º Ciclo', 'Magias Arcanas/Negra de 3º Ciclo', 'Magias Arcanas/Negra de 4º Ciclo', 'Magias Arcanas/Negra de 5º Ciclo', 'Magias Arcanas/Negra de 6º Ciclo', 'Magias Arcanas/Negra de 7º Ciclo', 'Magias Arcanas/Negra de 8º Ciclo', 'Magias Arcanas/Negra de 9º Ciclo', 'Magias Arcanas/Negra de 10º Ciclo'] },
        { titulo: 'Magias Ancestrais', itens: ['Truques Ancestrais', 'Magia de Sangue', 'Magia de Osso', 'Magia Draconica', 'Magia de Borracha', 'Magia de Espelho', 'Magia de Sal', 'Magia de Alma', 'Magia de Tremor', 'Magia de Gravidade', 'Magia de Tempo', 'Magia de Equipamento', 'Magia de Explosao', 'Magia Espacial', 'Magia de Metamorfose'] }
    ] },
    'aura': { label: 'Aura', icon: '✨', categorias: [{ titulo: 'Manifestações de Aura', itens: ['Aura Pura', 'Projeção de Aura'] }] },
    'corpo': { label: 'Corpo', icon: '💪', categorias: [{ titulo: 'Técnicas Corporais', itens: ['Artes Marciais', 'Reforço Físico'] }] },
    'compostos': { label: 'Elementos Compostos', icon: '⚛️', categorias: [{ titulo: 'Misturas Elementais', itens: ['Fusões Básicas', 'Fusões Avançadas'] }] }
};

const itensJáCategorizados = Object.values(ABAS_GRIMORIO).flatMap(aba => aba.categorias.flatMap(c => c.itens));
const magiasSobressalentes = Object.keys(cores).filter(k => !itensJáCategorizados.includes(k));
if (magiasSobressalentes.length > 0) { ABAS_GRIMORIO['elementos'].categorias.push({ titulo: 'Magias e Elementos Extras', itens: magiasSobressalentes }); }

export const BONUS_OPTIONS = [
    { value: 'nenhum', label: 'Nenhum (Apenas Elemento)' },
    { value: 'mult_dano', label: 'Mult Dano' },
    { value: 'dano_bruto', label: 'Dano Bruto' },
    { value: 'letalidade', label: 'Letalidade' },
];

const ElementosFormContext = createContext(null);

export function useElementosForm() {
    const ctx = useContext(ElementosFormContext);
    if (!ctx) return null; 
    return ctx;
}

export function ElementosFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    
    const elemEditandoId = useStore(s => s.elemEditandoId);
    const setElemEditandoId = useStore(s => s.setElemEditandoId);

    const [abaAtual, setAbaAtual] = useState('elementos');
    const [elemSelecionado, setElemSelecionado] = useState('Neutro');
    const [nomeElem, setNomeElem] = useState('');
    const [bonusTipo, setBonusTipo] = useState('nenhum');
    const [bonusValor, setBonusValor] = useState('');
    const [custoValor, setCustoValor] = useState(0);
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    
    // Começa com flexível se for da aba elementos genéricos
    const [energiaCombustao, setEnergiaCombustao] = useState('flexivel');
    const [tipoMecanica, setTipoMecanica] = useState('ataque'); 
    const [savingAttr, setSavingAttr] = useState('destreza'); 
    const [alcanceQuad, setAlcanceQuad] = useState(1);
    const [areaQuad, setAreaQuad] = useState(0);

    const formRef = useRef(null);
    const profGlobal = parseInt(minhaFicha.proficienciaBase) || 2;

    const getModificadorDoisDigitos = useCallback((valorAttr) => {
        if (!valorAttr) return 0;
        const strVal = String(valorAttr).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    }, []);

    // 🔥 FILTRO INTELIGENTE E OPÇÃO FLEXÍVEL 🔥
    const allowedEnergies = useMemo(() => {
        let opts = [];
        const isArcana = elemSelecionado.includes('Arcanas/Negra');
        const isTruque = elemSelecionado.includes('Truque');

        if (isArcana) {
            opts = [
                { value: 'flexivel', label: 'Flexível (Escolher na Conjuração)' },
                { value: 'mana', label: 'Mana (Base: Int)' }, { value: 'aura', label: 'Aura (Base: Eng. Esp)' }, { value: 'chakra', label: 'Chakra (Base: Stamina)' },
                { value: 'corpo', label: 'Corpo (Base: For/Des)' }, { value: 'pontosVitais', label: 'Pts. Vitais (Base: Const)' }, { value: 'pontosMortais', label: 'Pts. Mortais (Base: Int)' },
                { value: 'livre', label: 'Truque / Livre' }
            ];
        } else if (isTruque) {
            opts = [{ value: 'livre', label: 'Truque / Livre' }];
        } else if (abaAtual === 'astrais') {
            opts = [{ value: 'pontosVitais', label: 'Pts. Vitais (Base: Const)' }, { value: 'pontosMortais', label: 'Pts. Mortais (Base: Int)' }];
        } else if (abaAtual === 'chakra') { opts = [{ value: 'chakra', label: 'Chakra (Base: Stamina)' }];
        } else if (abaAtual === 'aura') { opts = [{ value: 'aura', label: 'Aura (Base: Eng. Esp)' }];
        } else if (abaAtual === 'corpo') { opts = [{ value: 'corpo', label: 'Corpo (Base: For/Des)' }];
        } else if (abaAtual === 'mana') { opts = [{ value: 'mana', label: 'Mana (Base: Int)' }];
        } else {
            // Elementos e Compostos podem usar qualquer das 3 principais, por isso default é flexível!
            opts = [
                { value: 'flexivel', label: 'Flexível (Escolher na Conjuração)' },
                { value: 'mana', label: 'Mana (Base: Int)' }, { value: 'aura', label: 'Aura (Base: Eng. Esp)' }, { value: 'chakra', label: 'Chakra (Base: Stamina)' }
            ];
        }

        if (elemEditandoId && !opts.some(o => o.value === energiaCombustao)) {
            const allLabels = { 'flexivel': 'Flexível', 'mana': 'Mana', 'aura': 'Aura', 'chakra': 'Chakra', 'corpo': 'Corpo', 'pontosVitais': 'Pts. Vitais', 'pontosMortais': 'Pts. Mortais', 'livre': 'Livre' };
            opts.push({ value: energiaCombustao, label: `${allLabels[energiaCombustao] || energiaCombustao} (Forçado)` });
        }
        return opts;
    }, [abaAtual, elemSelecionado, elemEditandoId, energiaCombustao]);

    const selecionarElemento = useCallback((nome) => {
        setElemSelecionado(nome);
        if (nome.includes('Truque')) setEnergiaCombustao('livre');
        else if (nome.includes('Arcanas/Negra')) setEnergiaCombustao('flexivel'); 
        else if (abaAtual === 'chakra') setEnergiaCombustao('chakra');
        else if (abaAtual === 'mana') setEnergiaCombustao('mana');
        else if (abaAtual === 'aura') setEnergiaCombustao('aura');
        else if (abaAtual === 'corpo') setEnergiaCombustao('corpo');
        else if (abaAtual === 'astrais') setEnergiaCombustao('pontosVitais');
        else setEnergiaCombustao('flexivel'); // Padrão flexível para elementos normais
    }, [abaAtual]);

    const cancelarEdicaoElem = useCallback(() => {
        setElemEditandoId(null); setNomeElem(''); 
        setEnergiaCombustao(abaAtual === 'elementos' || abaAtual === 'compostos' ? 'flexivel' : 'mana');
        setTipoMecanica('ataque'); setAlcanceQuad(1); setAreaQuad(0);
    }, [setElemEditandoId, abaAtual]);

    const salvarNovoElem = useCallback(() => {
        const n = nomeElem.trim();
        if (!n) { alert('Falta o nome da Magia/Ataque!'); return; }
        updateFicha((ficha) => {
            if (!ficha.ataquesElementais) ficha.ataquesElementais = [];
            const novaMagia = {
                nome: n, elemento: elemSelecionado, bonusTipo, bonusValor,
                custoValor: parseFloat(custoValor) || 0, dadosExtraQtd: parseInt(dadosQtd) || 0, dadosExtraFaces: parseInt(dadosFaces) || 20,
                energiaCombustao, tipoMecanica, savingAttr, alcanceQuad: parseFloat(alcanceQuad) || 1, areaQuad: parseFloat(areaQuad) || 0,
                equipado: false
            };
            if (elemEditandoId) {
                const ix = ficha.ataquesElementais.findIndex(i => i.id === elemEditandoId);
                if (ix !== -1) {
                    novaMagia.id = ficha.ataquesElementais[ix].id;
                    novaMagia.equipado = ficha.ataquesElementais[ix].equipado;
                    ficha.ataquesElementais[ix] = novaMagia;
                }
            } else {
                novaMagia.id = Date.now();
                ficha.ataquesElementais.push(novaMagia);
            }
        });
        cancelarEdicaoElem();
        salvarFichaSilencioso();
    }, [nomeElem, elemSelecionado, bonusTipo, bonusValor, custoValor, dadosQtd, dadosFaces, energiaCombustao, tipoMecanica, savingAttr, alcanceQuad, areaQuad, elemEditandoId, updateFicha, cancelarEdicaoElem]);

    const editarElem = useCallback((id) => {
        const p = (minhaFicha.ataquesElementais || []).find(i => i.id === id);
        if (!p) return;
        if (p.equipado) {
            updateFicha(f => {
                const idx = f.ataquesElementais.findIndex(i => i.id === id);
                if (idx !== -1) f.ataquesElementais[idx].equipado = false;
            });
            salvarFichaSilencioso();
            alert(`O ataque [${p.nome}] foi DESATIVADO para edicao.`);
        }
        const el = p.elemento || 'Neutro';
        setElemSelecionado(el);
        let foundAba = 'elementos';
        for (const [abaKey, abaData] of Object.entries(ABAS_GRIMORIO)) {
            if (abaData.categorias.some(cat => cat.itens.includes(el))) {
                foundAba = abaKey;
                break;
            }
        }
        setAbaAtual(foundAba);
        setElemEditandoId(p.id); setNomeElem(p.nome); setBonusTipo(p.bonusTipo || 'nenhum');
        setBonusValor(p.bonusValor || ''); setCustoValor(p.custoValor || 0); setDadosQtd(p.dadosExtraQtd || 0);
        setDadosFaces(p.dadosExtraFaces || 20); setEnergiaCombustao(p.energiaCombustao || 'mana');
        setTipoMecanica(p.tipoMecanica || 'ataque'); setSavingAttr(p.savingAttr || 'destreza');
        setAlcanceQuad(p.alcanceQuad || 1); setAreaQuad(p.areaQuad || 0);
        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [minhaFicha.ataquesElementais, setElemEditandoId, updateFicha]);

    const toggleEquiparElem = useCallback((id) => {
        updateFicha((ficha) => {
            if (!ficha.ataquesElementais) return;
            const itemIndex = ficha.ataquesElementais.findIndex(i => i.id === id);
            if (itemIndex !== -1) ficha.ataquesElementais[itemIndex].equipado = !ficha.ataquesElementais[itemIndex].equipado;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const deletarElem = useCallback((id) => {
        if (!window.confirm('Deseja apagar este ataque elemental do grimorio?')) return;
        updateFicha((ficha) => { ficha.ataquesElementais = (ficha.ataquesElementais || []).filter(i => i.id !== id); });
        salvarFichaSilencioso();
    }, [updateFicha]);

    // 🔥 MOTOR DE CONJURAÇÃO AGORA ACEITA ENERGIA OVERRIDE 🔥
    const conjurarMagia = useCallback((magia, energiaOverride = null) => {
        const storeState = useStore.getState();
        const { alvoSelecionado, dummies, cenario } = storeState;
        const fichaVirtual = storeState.minhaFicha;
        
        // Se for flexível e mandarem um override (via card), usa-o.
        const energiaFinal = energiaOverride || magia.energiaCombustao;
        
        let attrRegente = 'inteligencia';
        let modRegente = 0;

        if (energiaFinal === 'corpo') {
            const modForca = getModificadorDoisDigitos(fichaVirtual['forca']?.base);
            const modDestreza = getModificadorDoisDigitos(fichaVirtual['destreza']?.base);
            if (modDestreza > modForca) { attrRegente = 'destreza'; modRegente = modDestreza; } 
            else { attrRegente = 'forca'; modRegente = modForca; }
        } else {
            const energiaToAttr = { 'mana': 'inteligencia', 'aura': 'energiaEsp', 'chakra': 'stamina', 'pontosVitais': 'constituicao', 'pontosMortais': 'inteligencia', 'livre': 'inteligencia', 'flexivel': 'inteligencia' };
            attrRegente = energiaToAttr[energiaFinal] || 'inteligencia';
            modRegente = getModificadorDoisDigitos(fichaVirtual[attrRegente]?.base);
        }

        let alvosAtingidos = [];
        const alvoDummie = alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado] : null;

        if (alvoDummie && (magia.tipoMecanica === 'ataque' || magia.tipoMecanica === 'saving')) {
            if (magia.areaQuad > 0) {
                const cenaAtivaId = cenario?.ativa || 'default';
                const escala = cenario?.lista?.[cenaAtivaId]?.escala || 1.5;
                Object.entries(dummies).forEach(([id, d]) => {
                    const isSameScene = (d.cenaId || 'default') === (alvoDummie.cenaId || 'default');
                    if (isSameScene && d.posicao && alvoDummie.posicao) {
                        const dx = Math.abs((d.posicao.x || 0) - (alvoDummie.posicao.x || 0));
                        const dy = Math.abs((d.posicao.y || 0) - (alvoDummie.posicao.y || 0));
                        const dz = Math.floor(Math.abs((d.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);
                        if (Math.max(dx, dy, dz) <= magia.areaQuad) alvosAtingidos.push(d);
                    }
                });
            } else {
                alvosAtingidos.push(alvoDummie);
            }
        }

        if (magia.tipoMecanica === 'ataque') {
            const vantagens = fichaVirtual.ataqueConfig?.vantagens || 0;
            const desvantagens = fichaVirtual.ataqueConfig?.desvantagens || 0;
            const result = calcularAcerto({ 
                qD: 1, fD: 20, prof: profGlobal, bonus: 0, sels: [attrRegente], 
                minhaFicha: fichaVirtual, itensEquipados: [], vantagens, desvantagens 
            });
            let alvosPayload = alvosAtingidos.map(d => ({ nome: d.nome, defesa: d.valorDefesa, acertou: result.acertoTotal >= d.valorDefesa }));
            
            enviarParaFeed({
                tipo: 'acerto', nome: meuNome, acertoTotal: result.acertoTotal,
                profBonusTexto: `Mod. Magia (${attrRegente.toUpperCase()}): +${modRegente} | Proficiência: +${profGlobal}`,
                rolagem: result.rolagem, armaStr: ` com ${magia.nome} (${magia.elemento})`,
                alvosArea: alvosPayload, areaEf: magia.areaQuad || 0
            });
            setAbaAtiva('aba-log');
        } 
        else if (magia.tipoMecanica === 'saving') {
            const cd = 8 + modRegente + profGlobal;
            let textoAlvos = alvosAtingidos.length > 0 ? ` Alvos na zona de explosão: ${alvosAtingidos.map(d=>d.nome).join(', ')}.` : '';
            enviarParaFeed({ tipo: 'sistema', nome: meuNome, texto: `🌀 CONJUROU: ${magia.nome}!${textoAlvos} Precisam de passar num Saving Throw de ${magia.savingAttr.toUpperCase()} (CD: ${cd}). Baseado em: ${attrRegente.toUpperCase()}.` });
            setAbaAtiva('aba-log');
        }
        else if (magia.tipoMecanica === 'infusao') {
            enviarParaFeed({ tipo: 'sistema', nome: meuNome, texto: `✨ INFUSÃO ELEMENTAL: As armas e poderes de ${meuNome} estão envoltos em ${magia.elemento} através da técnica ${magia.nome}!` });
            setAbaAtiva('aba-log');
        }
        else {
            enviarParaFeed({ tipo: 'sistema', nome: meuNome, texto: `✨ SUPORTE MÁGICO: ${meuNome} conjurou ${magia.nome} (${magia.elemento})!` });
            setAbaAtiva('aba-log');
        }
    }, [getModificadorDoisDigitos, profGlobal, meuNome, setAbaAtiva]);

    const ataquesElementais = minhaFicha.ataquesElementais || [];
    const magiasDoGrupo = useMemo(() => ataquesElementais.filter(e => (e.elemento || 'Neutro') === elemSelecionado), [ataquesElementais, elemSelecionado]);
    const magiasConjuradasOutros = useMemo(() => ataquesElementais.filter(e => e.equipado && (e.elemento || 'Neutro') !== elemSelecionado), [ataquesElementais, elemSelecionado]);

    const value = useMemo(() => ({
        abaAtual, setAbaAtual, elemSelecionado, setElemSelecionado,
        nomeElem, setNomeElem, bonusTipo, setBonusTipo, bonusValor, setBonusValor,
        custoValor, setCustoValor, dadosQtd, setDadosQtd, dadosFaces, setDadosFaces,
        energiaCombustao, setEnergiaCombustao, tipoMecanica, setTipoMecanica,
        savingAttr, setSavingAttr, alcanceQuad, setAlcanceQuad, areaQuad, setAreaQuad,
        formRef, profGlobal, getModificadorDoisDigitos, allowedEnergies,
        selecionarElemento, salvarNovoElem, editarElem, cancelarEdicaoElem, toggleEquiparElem,
        deletarElem, conjurarMagia, magiasDoGrupo, magiasConjuradasOutros, elemEditandoId, minhaFicha
    }), [
        abaAtual, elemSelecionado, nomeElem, bonusTipo, bonusValor, custoValor, dadosQtd, dadosFaces,
        energiaCombustao, tipoMecanica, savingAttr, alcanceQuad, areaQuad, profGlobal, getModificadorDoisDigitos, allowedEnergies,
        selecionarElemento, salvarNovoElem, editarElem, cancelarEdicaoElem, toggleEquiparElem, deletarElem, conjurarMagia, magiasDoGrupo, magiasConjuradasOutros, elemEditandoId, minhaFicha
    ]);

    return <ElementosFormContext.Provider value={value}>{children}</ElementosFormContext.Provider>;
}