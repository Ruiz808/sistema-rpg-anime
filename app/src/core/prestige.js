// ==========================================
// PRESTÍGIO E CULTIVAÇÃO — Matemática de ranking
// ==========================================
import { isEnergia, isFisico } from './utils.js';
import { getPoderTotalDaAbaPoderes, isStatBuffed } from './attributes.js';

export function getDivisorPara(ficha, statKey) {
    if (!ficha.divisores) ficha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    if (statKey === 'vida') return parseFloat(ficha.divisores.vida) || 1;
    if (statKey === 'mana') return parseFloat(ficha.divisores.mana) || 1;
    if (statKey === 'aura') return parseFloat(ficha.divisores.aura) || 1;
    if (statKey === 'chakra') return parseFloat(ficha.divisores.chakra) || 1;
    if (statKey === 'corpo') return parseFloat(ficha.divisores.corpo) || 1;
    return parseFloat(ficha.divisores.status) || 1;
}

export function getPrestigioReal(statKey, valRaw) {
    if (statKey === 'vida') return Math.floor(valRaw / 1000000);
    if (isEnergia(statKey)) return Math.floor(valRaw / 10000000);
    return Math.floor(valRaw / 1000);
}

export function calcPAtual(ficha, k, valBasePres) {
    let mPoderes = 1.0;
    let uiKey = k;

    if (k === 'status') {
        let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        let sumM = 0;
        for (let i = 0; i < sFisicos.length; i++) sumM += getPoderTotalDaAbaPoderes(ficha, sFisicos[i]);
        mPoderes = sumM / 8.0;
    } else {
        mPoderes = getPoderTotalDaAbaPoderes(ficha, k);
        if (isFisico(k)) uiKey = 'status';
    }

    let hasPower = isStatBuffed(ficha, uiKey);

    if (!ficha.divisores) ficha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };

    // Gatilho inteligente do divisor — retorna info para o caller atualizar o DOM
    let divisorAtualizado = false;
    if (hasPower) {
        if (ficha.divisores[uiKey] == 1) {
            ficha.divisores[uiKey] = 10;
            divisorAtualizado = true;
        }
    } else {
        if (ficha.divisores[uiKey] == 10) {
            ficha.divisores[uiKey] = 1;
            divisorAtualizado = true;
        }
    }

    let div = parseFloat(ficha.divisores[uiKey]) || 1;
    if (div === 0) div = 1;

    let valor;
    if (mPoderes <= 1.0 && div === 1) {
        valor = valBasePres;
    } else {
        valor = Math.floor((valBasePres * mPoderes) / div);
    }

    return { valor, divisorAtualizado, uiKey };
}

export function getRank(valPrestigio, ascBase) {
    let v = Math.floor(valPrestigio);
    let ascExtra = 0;
    let resto = v;

    if (v >= 100) {
        ascExtra = Math.floor(v / 100);
        resto = v % 100;
        // Quando bate exatamente na quebra (ex: 100, 200), mantém o resto em 100 para o Rank EX
        if (resto === 0 && v > 0) { ascExtra -= 1; resto = 100; }
    } else if (v < 0) {
        resto = 0;
    }

    let ascTotal = (parseInt(ascBase) || 1) + Math.max(0, ascExtra);

    // O Rank D é a base, que cobre do 0 ao 19
    let l = 'D', c = '#ff003c';

    // Os novos patamares de Rank
    if (resto === 100) { l = 'EX'; c = '#f0f'; }
    else if (resto >= 80) { l = 'S'; c = '#ffcc00'; }
    else if (resto >= 60) { l = 'A'; c = '#00ff88'; }
    else if (resto >= 40) { l = 'B'; c = '#0088ff'; }
    else if (resto >= 20) { l = 'C'; c = '#ccc'; }

    return { l: l, c: c, a: ascTotal, r: resto };
}
