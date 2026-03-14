// ==========================================
// STORE — Fonte única de verdade do estado
// ==========================================

export const fichaPadrao = {
    ascensaoBase: 1, poderes: [], inventario: [], ataquesElementais: [],
    ataqueConfig: { dadosBase: 1, faces: 20, dExtra: 0, bruto: 0, mBruto: 1.0, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mPotencial: 1.0, mUnico: "1.0", percEnergia: 10, redCusto: 0, mEnergia: 1.0, statusSelecionados: ['forca'], energiasSelecionadas: ['mana'] },
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

// Estado global mutável — acessado por todos os módulos
export let minhaFicha = JSON.parse(JSON.stringify(fichaPadrao));
export let meuNome = "";
export let efeitosTemp = [];
export let poderEditandoId = null;
export let itemEditandoId = null;
export let elemEditandoId = null;
export let personagemParaDeletar = "";

// Setters para variáveis que precisam ser reatribuídas
export function setMinhaFicha(f) { minhaFicha = f; }
export function setMeuNome(n) { meuNome = n; }
export function setEfeitosTemp(arr) { efeitosTemp = arr; }
export function setPoderEditandoId(id) { poderEditandoId = id; }
export function setItemEditandoId(id) { itemEditandoId = id; }
export function setElemEditandoId(id) { elemEditandoId = id; }
export function setPersonagemParaDeletar(n) { personagemParaDeletar = n; }

// Referência ao store como objeto para import * as store
// Os módulos que precisam ler sempre o valor atual devem usar store.minhaFicha etc.
// porque let exports são live bindings em ES modules.

export function carregarDadosFicha(dados) {
    if (!dados) return;
    let chaves = Object.keys(fichaPadrao);
    if (dados.ascensaoBase !== undefined) minhaFicha.ascensaoBase = parseInt(dados.ascensaoBase) || 1;
    if (dados.divisores) minhaFicha.divisores = Object.assign({}, fichaPadrao.divisores, dados.divisores);
    if (dados.inventario) minhaFicha.inventario = dados.inventario; else minhaFicha.inventario = [];
    if (dados.poderes) minhaFicha.poderes = dados.poderes; else minhaFicha.poderes = [];
    if (dados.ataquesElementais) minhaFicha.ataquesElementais = dados.ataquesElementais; else minhaFicha.ataquesElementais = [];
    if (dados.ataqueConfig) minhaFicha.ataqueConfig = Object.assign({}, fichaPadrao.ataqueConfig, dados.ataqueConfig);

    for (let i = 0; i < chaves.length; i++) {
        let ch = chaves[i];
        if (dados[ch] !== undefined && ch !== 'ascensaoBase' && ch !== 'poderes' && ch !== 'divisores' && ch !== 'inventario' && ch !== 'ataquesElementais' && ch !== 'ataqueConfig') {
            if (typeof fichaPadrao[ch] === 'object' && !Array.isArray(fichaPadrao[ch])) {
                minhaFicha[ch] = Object.assign({}, fichaPadrao[ch], dados[ch]);
                let numF = ['base', 'mBase', 'mGeral', 'mFormas', 'mAbsoluto', 'reducaoCusto', 'regeneracao', 'atual'];
                for (let j = 0; j < numF.length; j++) {
                    if (minhaFicha[ch][numF[j]] == null || isNaN(minhaFicha[ch][numF[j]])) minhaFicha[ch][numF[j]] = fichaPadrao[ch][numF[j]];
                }
            } else {
                minhaFicha[ch] = dados[ch];
            }
        }
    }
}

export function resetFicha() {
    Object.assign(minhaFicha, JSON.parse(JSON.stringify(fichaPadrao)));
}
