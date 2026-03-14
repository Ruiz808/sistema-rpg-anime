// ==========================================
// MOTOR DE ATRIBUTOS — Cálculos sobre a ficha
// ==========================================
import { minhaFicha } from '../state/store.js';
import { isFisico, isEnergia, tratarUnico } from './utils.js';

export function getBuffs(statKey) {
    let buffs = { base: 0, mbase: 1.0, mgeral: 1.0, mformas: 1.0, mabs: 1.0, munico: [], reducaoCusto: 0, regeneracao: 0 };
    if (!minhaFicha || !minhaFicha.poderes) return buffs;

    let sK = statKey.toLowerCase();
    let isStatFisico = isFisico(sK);
    let isStatEnergia = isEnergia(sK);

    for (let i = 0; i < minhaFicha.poderes.length; i++) {
        let p = minhaFicha.poderes[i];
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
                    if (prop === 'mbase') buffs.mbase *= val;
                    if (prop === 'mgeral') buffs.mgeral *= val;
                    if (prop === 'mformas') buffs.mformas *= val;
                    if (prop === 'mabs') buffs.mabs *= val;
                    if (prop === 'munico') buffs.munico.push(val);
                    if (prop === 'reducaocusto') buffs.reducaoCusto += val;
                    if (prop === 'regeneracao') buffs.regeneracao += val;
                }
            }
        }
    }
    return buffs;
}

export function getPoderesDefesa(tipo) {
    let t = 0;
    if (!minhaFicha.poderes) return 0;
    for (let i = 0; i < minhaFicha.poderes.length; i++) {
        let p = minhaFicha.poderes[i];
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

export function getPoderTotalDaAbaPoderes(statKey) {
    let b = getBuffs(statKey);
    let mU = 1.0;
    for (let i = 0; i < b.munico.length; i++) mU *= b.munico[i];
    return b.mbase * b.mgeral * b.mformas * b.mabs * mU;
}

export function isStatBuffed(statKey) {
    if (statKey === 'status') {
        let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        for (let i = 0; i < sFisicos.length; i++) {
            if (getPoderTotalDaAbaPoderes(sFisicos[i]) > 1.0) return true;
        }
        return false;
    } else {
        return getPoderTotalDaAbaPoderes(statKey) > 1.0;
    }
}

export function getRawBase(statKey) {
    let s = minhaFicha[statKey];
    return (s && s.base) ? parseFloat(s.base) : 0;
}

export function getEfetivoBase(statKey) {
    let s = minhaFicha[statKey];
    let rawBase = (s && s.base) ? parseFloat(s.base) : 0;
    if (isNaN(rawBase)) rawBase = 0;
    return rawBase + getBuffs(statKey).base;
}

export function getMultiplicadorTotal(k) {
    let s = minhaFicha[k] || {};
    let b = getBuffs(k);

    let mB = (parseFloat(s.mBase) || 1.0) * b.mbase;
    let mG = (parseFloat(s.mGeral) || 1.0) * b.mgeral;
    let mF = (parseFloat(s.mFormas) || 1.0) * b.mformas;
    let mA = (parseFloat(s.mAbsoluto) || 1.0) * b.mabs;
    let u1 = tratarUnico(s.mUnico || "1.0");
    let uniFicha = 1.0;
    for (let i = 0; i < u1.length; i++) { uniFicha *= u1[i]; }
    let mU = 1.0;
    for (let i = 0; i < b.munico.length; i++) mU *= b.munico[i];

    return mB * mG * mF * mA * uniFicha * mU;
}

export function getMaximo(k) {
    let b = getEfetivoBase(k);
    let mult = getMultiplicadorTotal(k);
    let mx = Math.floor(b * mult);
    return isNaN(mx) ? 0 : mx;
}
