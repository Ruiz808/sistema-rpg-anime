import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const fichaPadrao = {
    ascensaoBase: 1, poderes: [], inventario: [], ataquesElementais: [],
    passivas: [],
    hierarquia: { poder: false, infinity: false, singularidade: '', poderNome: '', poderDesc: '', infinityNome: '', infinityDesc: '', singularidadeNome: '', singularidadeDesc: '' },
    proficienciaBase: 2,
    proficiencias: {},
    avatar: { base: "" },
    bio: { raca: "", classe: "", idade: "", fisico: "", sangue: "", alinhamento: "", afiliacao: "", dinheiro: "" },
    notas: { base: "", geral: "", abs: "" },
    posicao: { x: 0, y: 0, z: 0 },
    iniciativa: 0,
    acoes: { padrao: { max: 1, atual: 1 }, bonus: { max: 1, atual: 1 }, reacao: { max: 1, atual: 1 } },
    ataqueConfig: { armaStatusUsados: ['forca'], armaEnergiaCombustao: 'mana', armaPercEnergia: 0, criticoNormalMin: 16, criticoNormalMax: 18, criticoFatalMin: 19, criticoFatalMax: 20, vantagens: 0, desvantagens: 0 },
    dano: { base: 0, mBase: 1.0, mPotencial: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mUnico: "1.0", danoBruto: 0 },
    forca: { base: 0, mBase: 1.0, regeneracao: 0 },
    destreza: { base: 0, mBase: 1.0, regeneracao: 0 },
    inteligencia: { base: 0, mBase: 1.0, regeneracao: 0 },
    sabedoria: { base: 0, mBase: 1.0, regeneracao: 0 },
    energiaEsp: { base: 0, mBase: 1.0, regeneracao: 0 },
    carisma: { base: 0, mBase: 1.0, regeneracao: 0 },
    stamina: { base: 0, mBase: 1.0, regeneracao: 0 },
    constituicao: { base: 0, mBase: 1.0, regeneracao: 0 },
    vida: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0 },
    mana: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0, reducaoCusto: 0 },
    aura: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0, reducaoCusto: 0 },
    chakra: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0, reducaoCusto: 0 },
    corpo: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0, reducaoCusto: 0 },
    pontosVitais: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0 },
    pontosMortais: { base: 0, mBase: 1.0, regeneracao: 0, atual: 0 }
};

export function sanitizarNome(nome) {
    if (!nome) return '';
    return nome.replace(/[.#$[\]]/g, '');
}

const storedMesaId = localStorage.getItem('rpg_mesaId') || '';
const storedNome = localStorage.getItem('rpg_meuNome') || '';
const storedFicha = localStorage.getItem(`rpg_ficha_${storedNome}`) ? JSON.parse(localStorage.getItem(`rpg_ficha_${storedNome}`)) : JSON.parse(JSON.stringify(fichaPadrao));

const useStore = create(immer((set, get) => ({
    // 🔥 NOVO: O ID DA SALA (MESA) 🔥
    mesaId: storedMesaId,
    setMesaId: (id) => set(state => {
        state.mesaId = id;
        if (id) localStorage.setItem('rpg_mesaId', id);
        else localStorage.removeItem('rpg_mesaId');
    }),

    meuNome: storedNome,
    isMestre: localStorage.getItem('rpg_isMestre') === 'true',
    abaAtiva: 'aba-status',
    
    personagens: {}, 
    minhaFicha: storedFicha, 
    feedCombate: [],
    
    cenario: { mapaAtual: '', tokensOcultos: [], escala: 1.5, unidade: 'm', zonas: [], tavernaAtivos: [] },
    dummies: {},

    setMeuNome: (nome) => set(state => { state.meuNome = nome; localStorage.setItem('rpg_meuNome', nome); }),
    setIsMestre: (val) => set(state => { state.isMestre = val; localStorage.setItem('rpg_isMestre', val ? 'true' : 'false'); }),
    setAbaAtiva: (id) => set(state => { state.abaAtiva = id; }),
    
    updateFicha: (recipe) => set(state => {
        recipe(state.minhaFicha);
        localStorage.setItem(`rpg_ficha_${state.meuNome}`, JSON.stringify(state.minhaFicha));
    }),

    carregarDadosFicha: (dados) => set(state => {
        if (!dados) return;
        state.minhaFicha = JSON.parse(JSON.stringify(fichaPadrao));
        for (let ch in dados) {
            if (
                dados[ch] !== null && dados[ch] !== undefined &&
                ch !== 'ascensaoBase' && ch !== 'poderes' && ch !== 'divisores' &&
                ch !== 'inventario' && ch !== 'ataquesElementais' && ch !== 'ataqueConfig' &&
                ch !== 'avatar' && ch !== 'bio' && ch !== 'notas' && ch !== 'passivas' &&
                ch !== 'posicao' && ch !== 'iniciativa' && ch !== 'acoes' &&
                ch !== 'proficienciaBase' && ch !== 'proficiencias' &&
                ch !== 'cores' && ch !== 'hierarquia'
            ) {
                if (typeof fichaPadrao[ch] === 'object' && !Array.isArray(fichaPadrao[ch])) {
                    state.minhaFicha[ch] = Object.assign({}, fichaPadrao[ch], dados[ch]);
                    const numF = ['base', 'mBase', 'mGeral', 'mFormas', 'mAbsoluto', 'reducaoCusto', 'regeneracao', 'atual'];
                    for (let j = 0; j < numF.length; j++) {
                        if (state.minhaFicha[ch][numF[j]] == null || isNaN(state.minhaFicha[ch][numF[j]])) {
                            state.minhaFicha[ch][numF[j]] = fichaPadrao[ch][numF[j]];
                        }
                    }
                } else {
                    state.minhaFicha[ch] = dados[ch];
                }
            }
        }
        
        const complexKeys = ['ascensaoBase', 'poderes', 'inventario', 'ataquesElementais', 'ataqueConfig', 'avatar', 'bio', 'notas', 'passivas', 'posicao', 'iniciativa', 'acoes', 'proficienciaBase', 'proficiencias', 'cores', 'hierarquia'];
        complexKeys.forEach(k => {
            if (dados[k] !== undefined) state.minhaFicha[k] = dados[k];
            else state.minhaFicha[k] = Array.isArray(fichaPadrao[k]) ? [] : (typeof fichaPadrao[k] === 'object' ? {} : fichaPadrao[k]);
        });
        localStorage.setItem(`rpg_ficha_${state.meuNome}`, JSON.stringify(state.minhaFicha));
    }),

    setPersonagens: (pers) => set(state => { state.personagens = pers; }),
    addFeedEntry: (entry) => set(state => { state.feedCombate.push(entry); }),
    limparFeedStore: () => set(state => { state.feedCombate = []; }),
    setCenario: (cen) => set(state => { state.cenario = cen; }),
    setDummies: (dums) => set(state => { state.dummies = dums; }),
})));

export default useStore;