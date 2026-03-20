import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const fichaPadrao = {
    ascensaoBase: 1, poderes: [], inventario: [], ataquesElementais: [],
    passivas: [],
    avatar: { base: "" },
    bio: { raca: "", classe: "", idade: "", fisico: "", sangue: "", alinhamento: "", afiliacao: "", dinheiro: "" },
    notas: { base: "", geral: "", abs: "" },
    posicao: { x: 0, y: 0 },
    iniciativa: 0,
    ataqueConfig: { armaStatusUsados: ['forca'], armaEnergiaCombustao: 'mana', armaPercEnergia: 0 },
    dano: { base: 0, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, mPotencial: 1.0, reducaoCusto: 0, regeneracao: 0 },
    divisores: { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 },
    vida: { base: 100000000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0, atual: 100000000 },
    inteligencia: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    sabedoria: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    energiaEsp: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    carisma: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    stamina: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    constituicao: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    forca: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    destreza: { base: 100000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0 },
    mana: { base: 100000000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0, atual: 100000000 },
    aura: { base: 100000000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0, atual: 100000000 },
    chakra: { base: 100000000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0, atual: 100000000 },
    corpo: { base: 100000000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mUnico: "1.0", mAbsoluto: 1.0, reducaoCusto: 0, regeneracao: 0, atual: 100000000 }
};

export function sanitizarNome(n) {
    if (!n) return '';
    return n.replace(/[.#$\[\]\/]/g, '_').trim();
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const useStore = create(
    immer((set, get) => ({
        // State
        minhaFicha: deepClone(fichaPadrao),
        meuNome: '',
        isMestre: false,
        efeitosTemp: [],
        poderEditandoId: null,
        itemEditandoId: null,
        elemEditandoId: null,
        personagemParaDeletar: '',
        abaAtiva: 'aba-status',
        personagens: {},
        feedCombate: [],

        // Setters
        setMinhaFicha: (ficha) => set((state) => {
            state.minhaFicha = ficha;
        }),

        setMeuNome: (nome) => set((state) => {
            state.meuNome = nome;
        }),

        setIsMestre: (val) => set((state) => {
            state.isMestre = val;
        }),

        setEfeitosTemp: (efeitos) => set((state) => {
            state.efeitosTemp = efeitos;
        }),

        setPoderEditandoId: (id) => set((state) => {
            state.poderEditandoId = id;
        }),

        setItemEditandoId: (id) => set((state) => {
            state.itemEditandoId = id;
        }),

        setElemEditandoId: (id) => set((state) => {
            state.elemEditandoId = id;
        }),

        setPersonagemParaDeletar: (nome) => set((state) => {
            state.personagemParaDeletar = nome;
        }),

        setAbaAtiva: (aba) => set((state) => {
            state.abaAtiva = aba;
        }),

        setPersonagens: (personagens) => set((state) => {
            state.personagens = personagens;
        }),

        addFeedEntry: (entry) => set((state) => {
            state.feedCombate.push(entry);
        }),

        // Update minhaFicha with an immer-style callback
        updateFicha: (callback) => set((state) => {
            callback(state.minhaFicha);
        }),

        // Load character data into minhaFicha (exact original logic)
        carregarDadosFicha: (dados) => set((state) => {
            if (!dados) return;

            const chaves = Object.keys(fichaPadrao);

            if (dados.ascensaoBase !== undefined) {
                state.minhaFicha.ascensaoBase = parseInt(dados.ascensaoBase) || 1;
            }

            if (dados.divisores) {
                state.minhaFicha.divisores = Object.assign({}, fichaPadrao.divisores, dados.divisores);
            }

            if (dados.inventario) {
                state.minhaFicha.inventario = dados.inventario;
            } else {
                state.minhaFicha.inventario = [];
            }

            if (dados.poderes) {
                state.minhaFicha.poderes = dados.poderes;
            } else {
                state.minhaFicha.poderes = [];
            }

            if (dados.ataquesElementais) {
                state.minhaFicha.ataquesElementais = dados.ataquesElementais;
            } else {
                state.minhaFicha.ataquesElementais = [];
            }

            if (dados.ataqueConfig) {
                state.minhaFicha.ataqueConfig = Object.assign({}, fichaPadrao.ataqueConfig, dados.ataqueConfig);
            }

            if (dados.avatar) {
                state.minhaFicha.avatar = Object.assign({}, fichaPadrao.avatar, dados.avatar);
            } else {
                state.minhaFicha.avatar = { base: "" };
            }

            if (dados.bio) {
                state.minhaFicha.bio = Object.assign({}, fichaPadrao.bio, dados.bio);
            }

            if (dados.notas) {
                state.minhaFicha.notas = Object.assign({}, fichaPadrao.notas, dados.notas);
            }

            if (dados.passivas) {
                state.minhaFicha.passivas = dados.passivas;
            } else {
                state.minhaFicha.passivas = [];
            }

            if (dados.posicao) {
                state.minhaFicha.posicao = Object.assign({}, fichaPadrao.posicao, dados.posicao);
            }

            if (dados.iniciativa !== undefined) {
                state.minhaFicha.iniciativa = parseInt(dados.iniciativa) || 0;
            }

            for (let i = 0; i < chaves.length; i++) {
                const ch = chaves[i];
                if (
                    dados[ch] !== undefined &&
                    ch !== 'ascensaoBase' &&
                    ch !== 'poderes' &&
                    ch !== 'divisores' &&
                    ch !== 'inventario' &&
                    ch !== 'ataquesElementais' &&
                    ch !== 'ataqueConfig' &&
                    ch !== 'avatar' &&
                    ch !== 'bio' &&
                    ch !== 'notas' &&
                    ch !== 'passivas' &&
                    ch !== 'posicao' &&
                    ch !== 'iniciativa'
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
        }),

        // Reset to default
        resetFicha: () => set((state) => {
            state.minhaFicha = deepClone(fichaPadrao);
        }),
    }))
);

export default useStore;
