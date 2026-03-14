// ==========================================
// PRESTÍGIO E CULTIVAÇÃO — Matemática de ranking
// ==========================================
import { minhaFicha } from '../state/store.js';
import { isEnergia, isFisico } from './utils.js';
import { getPoderTotalDaAbaPoderes, isStatBuffed } from './attributes.js';

export function getDivisorPara(statKey) {
    if (!minhaFicha.divisores) minhaFicha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    if (statKey === 'vida') return parseFloat(minhaFicha.divisores.vida) || 1;
    if (statKey === 'mana') return parseFloat(minhaFicha.divisores.mana) || 1;
    if (statKey === 'aura') return parseFloat(minhaFicha.divisores.aura) || 1;
    if (statKey === 'chakra') return parseFloat(minhaFicha.divisores.chakra) || 1;
    if (statKey === 'corpo') return parseFloat(minhaFicha.divisores.corpo) || 1;
    return parseFloat(minhaFicha.divisores.status) || 1;
}

export function getPrestigioReal(statKey, valRaw) {
    if (statKey === 'vida' || isEnergia(statKey)) return Math.floor(valRaw / 1000000);
    return Math.floor(valRaw / 1000);
}

export function calcPAtual(k, valBasePres) {
    let mPoderes = 1.0;
    let uiKey = k;

    if (k === 'status') {
        let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        let sumM = 0;
        for (let i = 0; i < sFisicos.length; i++) sumM += getPoderTotalDaAbaPoderes(sFisicos[i]);
        mPoderes = sumM / 8.0;
    } else {
        mPoderes = getPoderTotalDaAbaPoderes(k);
        if (isFisico(k)) uiKey = 'status';
    }

    let hasPower = isStatBuffed(uiKey);

    if (!minhaFicha.divisores) minhaFicha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    let boxId = 'div-' + uiKey;
    let elBox = document.getElementById(boxId);

    // GATILHO INTELIGENTE DO DIVISOR
    if (hasPower) {
        if (minhaFicha.divisores[uiKey] == 1) {
            minhaFicha.divisores[uiKey] = 10;
            if (elBox) elBox.value = 10;
        }
    } else {
        if (minhaFicha.divisores[uiKey] == 10) {
            minhaFicha.divisores[uiKey] = 1;
            if (elBox) elBox.value = 1;
        }
    }

    let div = parseFloat(minhaFicha.divisores[uiKey]) || 1;
    if (div === 0) div = 1;

    if (mPoderes <= 1.0 && div === 1) {
        return valBasePres;
    }

    return Math.floor((valBasePres * mPoderes) / div);
}

export function getRank(valPrestigio, ascBase) {
    let v = Math.floor(valPrestigio);
    let ascExtra = 0;
    let resto = v;
    if (v >= 100) {
        ascExtra = Math.floor(v / 100);
        resto = v % 100;
        if (resto === 0 && v > 0) { ascExtra -= 1; resto = 100; }
    } else if (v < 0) { resto = 0; }

    let ascTotal = (parseInt(ascBase) || 1) + Math.max(0, ascExtra);
    let l = 'D', c = '#ff003c';
    if (resto >= 90) { l = 'EX'; c = '#f0f'; }
    else if (resto >= 70) { l = 'S'; c = '#ffcc00'; }
    else if (resto >= 50) { l = 'A'; c = '#00ff88'; }
    else if (resto >= 30) { l = 'B'; c = '#0088ff'; }
    else if (resto >= 10) { l = 'C'; c = '#ccc'; }
    return { l: l, c: c, a: ascTotal, r: resto };
}
