import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

export const emogis = {
    'Fogo': '\uD83D\uDD25', 'Agua': '\uD83D\uDCA7', 'Raio': '\u26A1', 'Terra': '\uD83E\uDEA8', 'Vento': '\uD83C\uDF2A\uFE0F',
    'Fogo Verdadeiro': '\uD83D\uDD25', 'Agua Verdadeira': '\uD83D\uDCA7', 'Raio Verdadeiro': '\u26A1', 'Terra Verdadeira': '\uD83E\uDEA8', 'Vento Verdadeiro': '\uD83C\uDF2A\uFE0F',
    'Solar': '\u2600\uFE0F', 'Solar Verdadeiro': '\u2600\uFE0F', 'Gelo': '\u2744\uFE0F', 'Gelo Verdadeiro': '\u2744\uFE0F', 'Natureza': '\uD83C\uDF3F', 'Natureza Verdadeira': '\uD83C\uDF3F', 'Energia': '\uD83D\uDCAB', 'Energia Verdadeira': '\uD83D\uDCAB', 'Vacuo': '\uD83D\uDD73\uFE0F', 'Vacuo Verdadeiro': '\uD83D\uDD73\uFE0F',
    'Luz': '\u2728', 'Trevas': '\uD83C\uDF11', 'Ether': '\uD83C\uDF0C', 'Celestial': '\uD83C\uDF1F', 'Infernal': '\uD83C\uDF0B', 'Caos': '\uD83C\uDF00', 'Criacao': '\uD83C\uDF87', 'Destruicao': '\uD83D\uDCA5', 'Cosmos': '\u267E\uFE0F',
    'Vida': '\uD83C\uDF3A', 'Morte': '\uD83D\uDC80', 'Vazio': '\u2B1B', 'Neutro': '\u26AA',
    'Magia de Osso': '\uD83E\uDDB4', 'Magia de Sangue': '\uD83E\uDE78', 'Magia de Borracha': '\uD83C\uDF88', 'Magia de Sal': '\uD83E\uDDC2', 'Magia de Alma': '\uD83D\uDC7B', 'Magia de Tremor': '\uD83E\uDEE8', 'Magia de Gravidade': '\uD83C\uDF0C', 'Magia de Equipamento': '\u2699\uFE0F', 'Magia de Tempo': '\u23F3', 'Magia Draconica': '\uD83D\uDC09', 'Magia de Espelho': '\uD83E\uDE9E', 'Magia de Explosao': '\uD83D\uDCA5', 'Magia Espacial': '\uD83C\uDF00', 'Magia de Metamorfose': '\uD83C\uDFAD',
    'Magias Arcanas/Negra de 1\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 2\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 3\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 4\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 5\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 6\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 7\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 8\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 9\u00BA Ciclo': '\uD83D\uDD2E', 'Magias Arcanas/Negra de 10\u00BA Ciclo': '\uD83D\uDD2E',
    'Magias de 1\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 2\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 3\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 4\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 5\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 6\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 7\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 8\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 9\u00BA Ciclo': '\uD83D\uDD04', 'Magias de 10\u00BA Ciclo': '\uD83D\uDD04',
    'Elemento Madeira': '\uD83E\uDEB5', 'Elemento Mineral': '\uD83D\uDC8E', 'Elemento Cinzas': '\uD83C\uDF2B\uFE0F', 'Elemento Igneo': '\u2604\uFE0F', 'Elemento Lava': '\uD83C\uDF0B', 'Elemento Vapor': '\u2668\uFE0F', 'Elemento Nevoa': '\uD83C\uDF2B\uFE0F', 'Elemento Tempestade': '\uD83C\uDF29\uFE0F', 'Elemento Areia': '\uD83C\uDFDC\uFE0F', 'Elemento Tufao': '\uD83C\uDF2A\uFE0F',
    'Elemento Velocidade': '\uD83D\uDCA8', 'Elemento Poeira': '\uD83D\uDD32', 'Elemento Calor': '\uD83C\uDF21\uFE0F', 'Elemento Cal': '\u2B1C', 'Elemento Carbono': '\u2B1B', 'Elemento Veneno': '\u2623\uFE0F', 'Elemento Magnetismo': '\uD83E\uDDF2', 'Elemento Som': '\uD83D\uDD0A'
};

export const cores = {
    'Fogo': '#ff4d4d', 'Agua': '#4dffff', 'Raio': '#ffff4d', 'Terra': '#d2a679', 'Vento': '#4dff88',
    'Fogo Verdadeiro': '#ff0000', 'Agua Verdadeira': '#00e6e6', 'Raio Verdadeiro': '#ffff00', 'Terra Verdadeira': '#d48846', 'Vento Verdadeiro': '#00ff40',
    'Solar': '#ffb366', 'Solar Verdadeiro': '#ff6600', 'Gelo': '#99ffff', 'Gelo Verdadeiro': '#00ffff', 'Natureza': '#66ff66', 'Natureza Verdadeira': '#00ff00', 'Energia': '#ff66ff', 'Energia Verdadeira': '#ff00ff', 'Vacuo': '#999999', 'Vacuo Verdadeiro': '#ffffff',
    'Luz': '#ffffff', 'Trevas': '#800080', 'Ether': '#b366ff', 'Celestial': '#ffffcc', 'Infernal': '#cc0000', 'Caos': '#ff3399', 'Criacao': '#00ffcc', 'Destruicao': '#8b0000', 'Cosmos': '#4d0099',
    'Vida': '#33ff77', 'Morte': '#4d4d4d', 'Vazio': '#1a1a1a', 'Neutro': '#cccccc',
    'Magia de Osso': '#e6e6e6', 'Magia de Sangue': '#ff0000', 'Magia de Borracha': '#ff99cc', 'Magia de Sal': '#fdfdfd', 'Magia de Alma': '#33cccc', 'Magia de Tremor': '#cc9966', 'Magia de Gravidade': '#6600cc', 'Magia de Equipamento': '#b3b3b3', 'Magia de Tempo': '#ffd700', 'Magia Draconica': '#ff5500', 'Magia de Espelho': '#ccffff', 'Magia de Explosao': '#ff3300', 'Magia Espacial': '#000066', 'Magia de Metamorfose': '#ff66b3',
    'Magias Arcanas/Negra de 1\u00BA Ciclo': '#d9b3ff', 'Magias Arcanas/Negra de 2\u00BA Ciclo': '#cc99ff', 'Magias Arcanas/Negra de 3\u00BA Ciclo': '#bf80ff', 'Magias Arcanas/Negra de 4\u00BA Ciclo': '#b366ff', 'Magias Arcanas/Negra de 5\u00BA Ciclo': '#a64dff', 'Magias Arcanas/Negra de 6\u00BA Ciclo': '#9933ff', 'Magias Arcanas/Negra de 7\u00BA Ciclo': '#8c1aff', 'Magias Arcanas/Negra de 8\u00BA Ciclo': '#8000ff', 'Magias Arcanas/Negra de 9\u00BA Ciclo': '#6600cc', 'Magias Arcanas/Negra de 10\u00BA Ciclo': '#4d0099',
    'Magias de 1\u00BA Ciclo': '#b3ffe6', 'Magias de 2\u00BA Ciclo': '#80ffcc', 'Magias de 3\u00BA Ciclo': '#4dffb3', 'Magias de 4\u00BA Ciclo': '#1aff99', 'Magias de 5\u00BA Ciclo': '#00e68a', 'Magias de 6\u00BA Ciclo': '#00cc7a', 'Magias de 7\u00BA Ciclo': '#00b36b', 'Magias de 8\u00BA Ciclo': '#00995c', 'Magias de 9\u00BA Ciclo': '#00804d', 'Magias de 10\u00BA Ciclo': '#00663d',
    'Elemento Madeira': '#8b5a2b', 'Elemento Mineral': '#e6e6fa', 'Elemento Cinzas': '#808080', 'Elemento Igneo': '#ff4500', 'Elemento Lava': '#ff0000', 'Elemento Vapor': '#ffb6c1', 'Elemento Nevoa': '#b0e0e6', 'Elemento Tempestade': '#ccccff', 'Elemento Areia': '#f4a460', 'Elemento Tufao': '#98fb98',
    'Elemento Velocidade': '#e6ffff', 'Elemento Poeira': '#d9d9d9', 'Elemento Calor': '#ff6600', 'Elemento Cal': '#e6ccb3', 'Elemento Carbono': '#595959', 'Elemento Veneno': '#9933ff', 'Elemento Magnetismo': '#4169e1', 'Elemento Som': '#a6a6a6'
};

export const CATEGORIAS_ELEMENTOS = [
    { titulo: 'Truques (Sem Custo)', itens: ['Truques Arcanos/Negros', 'Truques de Ciclo', 'Truques Ancestrais'] },
    { titulo: 'Elementos B\u00E1sicos', itens: ['Fogo', 'Raio', 'Agua', 'Vento', 'Terra'] },
    { titulo: 'Elementos B\u00E1sicos Verdadeiros', itens: ['Fogo Verdadeiro', 'Raio Verdadeiro', 'Agua Verdadeira', 'Vento Verdadeiro', 'Terra Verdadeira'] },
    { titulo: 'Elementos Avan\u00E7ados', itens: ['Solar', 'Energia', 'Gelo', 'Vacuo', 'Natureza'] },
    { titulo: 'Elementos Avan\u00E7ados Verdadeiros', itens: ['Solar Verdadeiro', 'Energia Verdadeira', 'Gelo Verdadeiro', 'Vacuo Verdadeiro', 'Natureza Verdadeira'] },
    { titulo: 'Elementos Primordiais', itens: ['Luz', 'Trevas', 'Ether'] },
    { titulo: 'Elementos Primordiais Verdadeiros', itens: ['Celestial', 'Infernal', 'Caos'] },
    { titulo: 'Elementos Primordiais Absolutos', itens: ['Criacao', 'Destruicao', 'Cosmos'] },
    { titulo: 'Elementos Astrais', itens: ['Vida', 'Morte', 'Vazio'] },
    { titulo: 'Kekkei Genkai', itens: ['Elemento Madeira', 'Elemento Mineral', 'Elemento Cinzas', 'Elemento Igneo', 'Elemento Lava', 'Elemento Vapor', 'Elemento Nevoa', 'Elemento Tempestade', 'Elemento Areia', 'Elemento Tufao'] },
    { titulo: 'Kekkei Touta', itens: ['Elemento Velocidade', 'Elemento Poeira', 'Elemento Veneno', 'Elemento Cal', 'Elemento Carbono', 'Elemento Calor', 'Elemento Som', 'Elemento Magnetismo'] },
    { titulo: 'Magias de Ciclo', itens: ['Magias de 1\u00BA Ciclo', 'Magias de 2\u00BA Ciclo', 'Magias de 3\u00BA Ciclo', 'Magias de 4\u00BA Ciclo', 'Magias de 5\u00BA Ciclo', 'Magias de 6\u00BA Ciclo', 'Magias de 7\u00BA Ciclo', 'Magias de 8\u00BA Ciclo', 'Magias de 9\u00BA Ciclo', 'Magias de 10\u00BA Ciclo'] },
    { titulo: 'Magias Arcanas/Negra', itens: ['Magias Arcanas/Negra de 1\u00BA Ciclo', 'Magias Arcanas/Negra de 2\u00BA Ciclo', 'Magias Arcanas/Negra de 3\u00BA Ciclo', 'Magias Arcanas/Negra de 4\u00BA Ciclo', 'Magias Arcanas/Negra de 5\u00BA Ciclo', 'Magias Arcanas/Negra de 6\u00BA Ciclo', 'Magias Arcanas/Negra de 7\u00BA Ciclo', 'Magias Arcanas/Negra de 8\u00BA Ciclo', 'Magias Arcanas/Negra de 9\u00BA Ciclo', 'Magias Arcanas/Negra de 10\u00BA Ciclo'] },
    { titulo: 'Magias Ancestrais', itens: ['Magia de Sangue', 'Magia de Osso', 'Magia Draconica', 'Magia de Borracha', 'Magia de Espelho', 'Magia de Sal', 'Magia de Alma', 'Magia de Tremor', 'Magia de Gravidade', 'Magia de Tempo', 'Magia de Equipamento', 'Magia de Explosao', 'Magia Espacial', 'Magia de Metamorfose'] },
    { titulo: 'Neutro (Sem Elemento)', itens: ['Neutro'] }
];

const itensJaCategorizados = CATEGORIAS_ELEMENTOS.flatMap(c => c.itens);
const magiasSobressalentes = Object.keys(cores).filter(k => !itensJaCategorizados.includes(k));

if (magiasSobressalentes.length > 0) {
    CATEGORIAS_ELEMENTOS.push({ titulo: 'Magias e Elementos Extras', itens: magiasSobressalentes });
}

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

    const [elemSelecionado, setElemSelecionado] = useState('Neutro');
    const [nomeElem, setNomeElem] = useState('');
    const [bonusTipo, setBonusTipo] = useState('nenhum');
    const [bonusValor, setBonusValor] = useState('');
    const [custoValor, setCustoValor] = useState(0);
    const [dadosQtd, setDadosQtd] = useState(0);
    const [dadosFaces, setDadosFaces] = useState(20);
    const [energiaCombustao, setEnergiaCombustao] = useState('mana');
    const [tipoMecanica, setTipoMecanica] = useState('ataque');
    const [savingAttr, setSavingAttr] = useState('destreza');
    const [alcanceQuad, setAlcanceQuad] = useState(1);

    const formRef = useRef(null);
    const profGlobal = parseInt(minhaFicha.proficienciaBase) || 2;

    const getModificadorDoisDigitos = useCallback((valorAttr) => {
        if (!valorAttr) return 0;
        const strVal = String(valorAttr).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    }, []);

    const selecionarElemento = useCallback((nome) => {
        setElemSelecionado(nome);
        if (nome.includes('Kekkei') || nome.includes('Elemento')) setEnergiaCombustao('chakra');
        else if (nome.includes('Truque')) setEnergiaCombustao('livre');
        else setEnergiaCombustao('mana');
    }, []);

    const cancelarEdicaoElem = useCallback(() => {
        setElemEditandoId(null);
        setNomeElem('');
        setElemSelecionado('Neutro');
        setEnergiaCombustao('mana');
        setTipoMecanica('ataque');
        setAlcanceQuad(1);
    }, [setElemEditandoId]);

    const salvarNovoElem = useCallback(() => {
        try {
            const n = nomeElem.trim();
            if (!n) {
                alert('Falta o nome da Magia/Ataque!');
                return;
            }

            updateFicha((ficha) => {
                if (!ficha.ataquesElementais) ficha.ataquesElementais = [];

                const novaMagia = {
                    nome: n,
                    elemento: elemSelecionado,
                    bonusTipo: bonusTipo,
                    bonusValor: bonusValor,
                    custoValor: parseFloat(custoValor) || 0,
                    dadosExtraQtd: parseInt(dadosQtd) || 0,
                    dadosExtraFaces: parseInt(dadosFaces) || 20,
                    energiaCombustao: energiaCombustao,
                    tipoMecanica: tipoMecanica,
                    savingAttr: savingAttr,
                    alcanceQuad: parseFloat(alcanceQuad) || 1,
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
            setNomeElem('');
            salvarFichaSilencioso();
        } catch (e) {
            console.error(e);
        }
    }, [nomeElem, elemSelecionado, bonusTipo, bonusValor, custoValor, dadosQtd, dadosFaces, energiaCombustao, tipoMecanica, savingAttr, alcanceQuad, elemEditandoId, updateFicha, cancelarEdicaoElem]);

    const toggleEquiparElem = useCallback((id) => {
        updateFicha((ficha) => {
            if (!ficha.ataquesElementais) return;
            const itemIndex = ficha.ataquesElementais.findIndex(i => i.id === id);
            if (itemIndex === -1) return;
            ficha.ataquesElementais[itemIndex].equipado = !ficha.ataquesElementais[itemIndex].equipado;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const editarElem = useCallback((id) => {
        const p = (minhaFicha.ataquesElementais || []).find(i => i.id === id);
        if (!p) return;
        if (p.equipado) {
            toggleEquiparElem(id);
            alert(`O ataque [${p.nome}] foi DESATIVADO para edicao.`);
        }

        setElemEditandoId(p.id);
        setNomeElem(p.nome);
        setElemSelecionado(p.elemento || 'Neutro');
        setBonusTipo(p.bonusTipo || 'nenhum');
        setBonusValor(p.bonusValor || '');
        setCustoValor(p.custoValor || 0);
        setDadosQtd(p.dadosExtraQtd || 0);
        setDadosFaces(p.dadosExtraFaces || 20);
        setEnergiaCombustao(p.energiaCombustao || 'mana');
        setTipoMecanica(p.tipoMecanica || 'ataque');
        setSavingAttr(p.savingAttr || 'destreza');
        setAlcanceQuad(p.alcanceQuad || 1);

        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [minhaFicha.ataquesElementais, setElemEditandoId, toggleEquiparElem]);

    const deletarElem = useCallback((id) => {
        if (!window.confirm('Deseja apagar este ataque elemental do grimorio?')) return;
        updateFicha((ficha) => {
            ficha.ataquesElementais = (ficha.ataquesElementais || []).filter(i => i.id !== id);
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const conjurarMagia = useCallback((magia) => {
        const energiaToAttr = { 'mana': 'inteligencia', 'aura': 'energiaEsp', 'chakra': 'stamina', 'livre': 'inteligencia' };
        const attrRegente = energiaToAttr[magia.energiaCombustao] || 'inteligencia';
        const modRegente = getModificadorDoisDigitos(minhaFicha[attrRegente]?.base);

        if (magia.tipoMecanica === 'ataque') {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modRegente + profGlobal;

            let rollStr = `[${roll}]`;
            if (roll === 20) rollStr = `[<strong>20</strong>] (CR\u00CDTICO!)`;
            if (roll === 1) rollStr = `[<strong style="color:#ff003c;">1</strong>] (FALHA CR\u00CDTICA!)`;

            enviarParaFeed({
                tipo: 'acerto',
                nome: meuNome,
                acertoTotal: total,
                profBonusTexto: `Mod. Magia (${attrRegente}): +${modRegente} | Profici\u00EAncia: +${profGlobal}`,
                rolagem: rollStr,
                armaStr: ` com ${magia.nome} (${magia.elemento})`
            });
            setAbaAtiva('aba-log');
        }
        else if (magia.tipoMecanica === 'saving') {
            const cd = 8 + modRegente + profGlobal;
            enviarParaFeed({
                tipo: 'sistema',
                nome: meuNome,
                texto: `\uD83C\uDF00 CONJUROU: ${magia.nome}! O alvo precisa de passar num Saving Throw de ${magia.savingAttr.toUpperCase()} (CD: ${cd}).`
            });
            setAbaAtiva('aba-log');
        }
        else if (magia.tipoMecanica === 'infusao') {
            enviarParaFeed({
                tipo: 'sistema',
                nome: meuNome,
                texto: `\u2728 INFUS\u00C3O ELEMENTAL: As armas e poderes de ${meuNome} est\u00E3o envoltos em ${magia.elemento} atrav\u00E9s da t\u00E9cnica ${magia.nome}!`
            });
            setAbaAtiva('aba-log');
        }
        else {
            enviarParaFeed({
                tipo: 'sistema',
                nome: meuNome,
                texto: `\u2728 SUPORTE M\u00C1GICO: ${meuNome} conjurou ${magia.nome} (${magia.elemento})!`
            });
            setAbaAtiva('aba-log');
        }
    }, [minhaFicha, meuNome, profGlobal, getModificadorDoisDigitos, setAbaAtiva]);

    const ataquesElementais = minhaFicha.ataquesElementais || [];

    const magiasDoGrupo = useMemo(() =>
        ataquesElementais.filter(e => (e.elemento || 'Neutro') === elemSelecionado),
        [ataquesElementais, elemSelecionado]
    );

    const magiasConjuradasOutros = useMemo(() =>
        ataquesElementais.filter(e => e.equipado && (e.elemento || 'Neutro') !== elemSelecionado),
        [ataquesElementais, elemSelecionado]
    );

    const value = useMemo(() => ({
        minhaFicha,
        meuNome,
        elemEditandoId,
        elemSelecionado, setElemSelecionado,
        nomeElem, setNomeElem,
        bonusTipo, setBonusTipo,
        bonusValor, setBonusValor,
        custoValor, setCustoValor,
        dadosQtd, setDadosQtd,
        dadosFaces, setDadosFaces,
        energiaCombustao, setEnergiaCombustao,
        tipoMecanica, setTipoMecanica,
        savingAttr, setSavingAttr,
        alcanceQuad, setAlcanceQuad,
        formRef,
        profGlobal,
        getModificadorDoisDigitos,
        selecionarElemento,
        salvarNovoElem,
        editarElem,
        cancelarEdicaoElem,
        toggleEquiparElem,
        deletarElem,
        conjurarMagia,
        ataquesElementais,
        magiasDoGrupo,
        magiasConjuradasOutros,
    }), [
        minhaFicha, meuNome, elemEditandoId,
        elemSelecionado, nomeElem, bonusTipo, bonusValor,
        custoValor, dadosQtd, dadosFaces, energiaCombustao,
        tipoMecanica, savingAttr, alcanceQuad,
        profGlobal, getModificadorDoisDigitos,
        selecionarElemento, salvarNovoElem, editarElem,
        cancelarEdicaoElem, toggleEquiparElem, deletarElem,
        conjurarMagia, ataquesElementais, magiasDoGrupo,
        magiasConjuradasOutros,
    ]);

    return (
        <ElementosFormContext.Provider value={value}>
            {children}
        </ElementosFormContext.Provider>
    );
}
