// ==========================================
// MOTOR DE ATRIBUTOS — Cálculos sobre a ficha
// ==========================================
import { minhaFicha } from '../state/store.js';
import { isFisico, isEnergia, tratarUnico } from './utils.js';

export function getBuffs(statKey) {
    let buffs = { base: 0, mbase: 0, mgeral: 0, mformas: 0, mabs: 0, munico: [], reducaoCusto: 0, regeneracao: 0 };
    if (buffs.mbase === 0) buffs.mbase = 1.0;
    if (buffs.mgeral === 0) buffs.mgeral = 1.0;
    if (buffs.mformas === 0) buffs.mformas = 1.0;
    if (buffs.mabs === 0) buffs.mabs = 1.0;
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
                   if (prop === 'mbase') buffs.mbase += val;
                    if (prop === 'mgeral') buffs.mgeral += val;
                    if (prop === 'mformas') buffs.mformas += val;
                    if (prop === 'mabs') buffs.mabs += val;
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
    
    // Se a soma for 0 (sem buffs), tratamos como 1.0 para não zerar a multiplicação
    let mB = b.mbase > 0 ? b.mbase : 1.0;
    let mG = b.mgeral > 0 ? b.mgeral : 1.0;
    let mF = b.mformas > 0 ? b.mformas : 1.0;
    let mA = b.mabs > 0 ? b.mabs : 1.0;

    return mB * mG * mF * mA * mU;
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

    // Função interna inteligente: Soma os buffs com a base da ficha
    // Função interna inteligente: Soma os buffs com a base da ficha
    const calcAdd = (fichaVal, buffSum) => {
        let v = parseFloat(fichaVal) || 1.0;
        if (buffSum === 1.0) return v; // Se o buff for 1.0 (vazio), mantém a base normal
        return (v === 1.0 ? 0 : v) + buffSum; 
    };

    let mB = calcAdd(s.mBase, b.mbase);
    let mG = calcAdd(s.mGeral, b.mgeral);
    let mF = calcAdd(s.mFormas, b.mformas);
    let mA = calcAdd(s.mAbsoluto, b.mabs);
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
