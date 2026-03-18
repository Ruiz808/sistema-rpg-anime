// ==========================================
// MOTOR DE ATRIBUTOS — Cálculos sobre a ficha
// ==========================================
import { isFisico, isEnergia, tratarUnico } from './utils.js';

export function getBuffs(ficha, statKey) {
    let buffs = { base: 0, mbase: 0, mgeral: 0, mformas: 0, mabs: 0, munico: [], reducaoCusto: 0, regeneracao: 0 };
    // Rastreador: O personagem ativou algum poder destas categorias?
    let hasBuff = { mbase: false, mgeral: false, mformas: false, mabs: false };

    if (!ficha || !ficha.poderes) {
        buffs.mbase = 1.0; buffs.mgeral = 1.0; buffs.mformas = 1.0; buffs.mabs = 1.0;
        return buffs;
    }

    let sK = statKey.toLowerCase();
    let isStatFisico = isFisico(sK);
    let isStatEnergia = isEnergia(sK);

    for (let i = 0; i < ficha.poderes.length; i++) {
        let p = ficha.poderes[i];
        if (p && p.ativa && p.efeitos) {
            for (let j = 0; j < p.efeitos.length; j++) {
                let e = p.efeitos[j];
                if (!e) continue;
                let prop = (e.propriedade || '').toLowerCase();
                let atr = (e.atributo || '').toLowerCase();
                let val = parseFloat(e.valor);
                if (isNaN(val)) val = prop.startsWith('m') ? 1.0 : 0;

                let afeta = (atr === sK) ||
                    (atr === 'todos_status' && isStatFisico) ||
                    (atr === 'todas_energias' && isStatEnergia) ||
                    (atr === 'geral');

                if (afeta) {
                    if (prop === 'base') buffs.base += val;
                    if (prop === 'mbase') { buffs.mbase += val; hasBuff.mbase = true; }
                    if (prop === 'mgeral') { buffs.mgeral += val; hasBuff.mgeral = true; }
                    if (prop === 'mformas') { buffs.mformas += val; hasBuff.mformas = true; }
                    if (prop === 'mabs') { buffs.mabs += val; hasBuff.mabs = true; }
                    if (prop === 'munico') buffs.munico.push(val);
                    if (prop === 'reducaocusto') buffs.reducaoCusto += val;
                    if (prop === 'regeneracao') buffs.regeneracao += val;
                }
            }
        }
    }

    // Se a categoria NÃO teve nenhum poder ativado, recebe 1.0 para não zerar a multiplicação final
    if (!hasBuff.mbase) buffs.mbase = 1.0;
    if (!hasBuff.mgeral) buffs.mgeral = 1.0;
    if (!hasBuff.mformas) buffs.mformas = 1.0;
    if (!hasBuff.mabs) buffs.mabs = 1.0;

    // Guardamos o rastreador para a próxima etapa da máquina ler
    buffs._hasBuff = hasBuff;

    return buffs;
}

export function getPoderesDefesa(ficha, tipo) {
    let t = 0;
    if (!ficha.poderes) return 0;
    for (let i = 0; i < ficha.poderes.length; i++) {
        let p = ficha.poderes[i];
        if (p && p.ativa && p.efeitos) {
            for (let j = 0; j < p.efeitos.length; j++) {
                if (p.efeitos[j] && (p.efeitos[j].propriedade || '').toLowerCase() === tipo) {
                    t += (parseFloat(p.efeitos[j].valor) || 0);
                }
            }
        }
    }
    return t;
}

export function getPoderTotalDaAbaPoderes(ficha, statKey) {
    let b = getBuffs(ficha, statKey);
    let mU = 1.0;
    for (let i = 0; i < b.munico.length; i++) mU *= b.munico[i];

    // Mostra exatamente o valor somado da categoria sem invenções matemáticas
    let mB = b._hasBuff.mbase ? b.mbase : 1.0;
    let mG = b._hasBuff.mgeral ? b.mgeral : 1.0;
    let mF = b._hasBuff.mformas ? b.mformas : 1.0;
    let mA = b._hasBuff.mabs ? b.mabs : 1.0;

    return mB * mG * mF * mA * mU;
}

export function isStatBuffed(ficha, statKey) {
    if (statKey === 'status') {
        let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        for (let i = 0; i < sFisicos.length; i++) {
            if (getPoderTotalDaAbaPoderes(ficha, sFisicos[i]) > 1.0) return true;
        }
        return false;
    } else {
        return getPoderTotalDaAbaPoderes(ficha, statKey) > 1.0;
    }
}

export function getRawBase(ficha, statKey) {
    let s = ficha[statKey];
    return (s && s.base) ? parseFloat(s.base) : 0;
}

export function getEfetivoBase(ficha, statKey) {
    let s = ficha[statKey];
    let rawBase = (s && s.base) ? parseFloat(s.base) : 0;
    if (isNaN(rawBase)) rawBase = 0;
    return rawBase + getBuffs(ficha, statKey).base;
}

export function getMultiplicadorTotal(ficha, k) {
    let s = ficha[k] || {};
    let b = getBuffs(ficha, k);

    // Função inteligente blindada: Só soma se o rastreador confirmar que há buff!
    const calcAdd = (fichaVal, buffSum, hasBuffFlag) => {
        let v = parseFloat(fichaVal) || 1.0;
        if (!hasBuffFlag) return v; // Se não tem poder ativado, usa a base da ficha (1.0)
        return (v === 1.0 ? 0 : v) + buffSum; // Se tem poder, anula a base e retorna SÓ o valor exato da soma (120!)
    };

    let mB = calcAdd(s.mBase, b.mbase, b._hasBuff.mbase);
    let mG = calcAdd(s.mGeral, b.mgeral, b._hasBuff.mgeral);
    let mF = calcAdd(s.mFormas, b.mformas, b._hasBuff.mformas);
    let mA = calcAdd(s.mAbsoluto, b.mabs, b._hasBuff.mabs);

    let u1 = tratarUnico(s.mUnico || "1.0");
    let uniFicha = 1.0;
    for (let i = 0; i < u1.length; i++) { uniFicha *= u1[i]; }

    let mU = 1.0;
    for (let i = 0; i < b.munico.length; i++) mU *= b.munico[i];

    return mB * mG * mF * mA * uniFicha * mU;
}

export function getMaximo(ficha, k) {
    let b = getEfetivoBase(ficha, k);
    let mult = getMultiplicadorTotal(ficha, k);
    let mx = Math.floor(b * mult);
    return isNaN(mx) ? 0 : mx;
}
