import { isFisico, isEnergia, tratarUnico } from './utils.js';

export function getBuffs(ficha, statKey, ignorarPassivas = false) {
    let buffs = { base: 0, mbase: 0, mgeral: 0, mformas: 0, mabs: 0, munico: [], reducaoCusto: 0, regeneracao: 0 };
    let hasBuff = { mbase: false, mgeral: false, mformas: false, mabs: false };

    if (!ficha || !statKey) {
        buffs.mbase = 1.0; buffs.mgeral = 1.0; buffs.mformas = 1.0; buffs.mabs = 1.0;
        buffs._hasBuff = hasBuff;
        return buffs;
    }

    let sK = String(statKey).toLowerCase();
    let isStatFisico = isFisico(sK);
    let isStatEnergia = isEnergia(sK);

    // FUNÇÃO INTERNA: Processa os efeitos sem precisarmos repetir código
    const processarEfeitos = (efeitos) => {
        if (!efeitos) return;
        for (let j = 0; j < efeitos.length; j++) {
            let e = efeitos[j];
            if (!e) continue;
            let prop = (e.propriedade || '').toLowerCase();
            let atr = (e.atributo || '').toLowerCase();
            let val = parseFloat(e.valor);
            
            if (isNaN(val)) val = prop.startsWith('m') ? 1.0 : 0;

            let afeta = (atr === sK) ||
                (atr === 'todos_status' && isStatFisico) ||
                (atr === 'todas_energias' && isStatEnergia) ||
                (atr === 'geral') ||
                (atr === 'dano' && sK === 'dano');

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
    };

    // 1. Processar Poderes e Passivas
    if (ficha.poderes) {
        for (let i = 0; i < ficha.poderes.length; i++) {
            let p = ficha.poderes[i];
            if (p && p.ativa && p.efeitos) processarEfeitos(p.efeitos);
            if (p && p.efeitosPassivos) processarEfeitos(p.efeitosPassivos);
        }
    }

    if (!ignorarPassivas && ficha.passivas) {
        for (let i = 0; i < ficha.passivas.length; i++) {
            let p = ficha.passivas[i];
            if (p && p.efeitos) processarEfeitos(p.efeitos);
        }
    }

    // 🔥 2. PROCESSAR EFEITOS DE CLASSE (O Trono dos Heróis) 🔥
    // Estes buffs são passivos e indestrutíveis, ligados apenas à variável 'classe'
    let classeHeroica = (ficha.bio && ficha.bio.classe) ? String(ficha.bio.classe).toLowerCase() : '';

    const applyClassBuff = (prop, amount, flagKey) => {
        if (prop === 'mbase') { buffs.mbase += amount; hasBuff[flagKey] = true; }
        if (prop === 'mgeral') { buffs.mgeral += amount; hasBuff[flagKey] = true; }
        if (prop === 'munico') { buffs.munico.push(amount); }
    };

    switch (classeHeroica) {
        case 'saber':
            if (sK === 'corpo' || sK === 'constituicao') applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'lancer':
            if (sK === 'destreza' || sK === 'stamina') applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'caster':
            if (sK === 'inteligencia' || sK === 'sabedoria' || sK === 'mana') applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'berserker':
            if (sK === 'vida' || sK === 'corpo') applyClassBuff('munico', 1.5, null);
            if (sK === 'status' || sK === 'inteligencia') applyClassBuff('mbase', -0.5, 'mbase'); // Debuff de sanidade
            break;
        case 'shielder':
            if (sK === 'constituicao' || sK === 'forca') applyClassBuff('mbase', 1.0, 'mbase');
            break;
        case 'ruler':
            if (isStatFisico) applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'avenger':
            if (sK === 'dano') applyClassBuff('munico', 1.5, null);
            break;
        case 'alterego':
            if (sK === 'carisma' || sK === 'energiaesp') applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'foreigner':
            if (sK === 'sabedoria') applyClassBuff('mbase', 1.0, 'mbase');
            break;
        case 'mooncancer':
            if (sK === 'inteligencia') applyClassBuff('mbase', 1.0, 'mbase');
            break;
        case 'pretender':
            if (sK === 'carisma' || sK === 'destreza') applyClassBuff('mbase', 0.5, 'mbase');
            break;
        case 'beast':
            // Multiplicador Massivo de Chefe
            if (sK === 'pv' || sK === 'pm') applyClassBuff('munico', 3.0, null);
            if (sK === 'dano') applyClassBuff('mgeral', 1.0, 'mgeral');
            break;
        case 'savior':
            if (sK === 'aura' || sK === 'chakra') applyClassBuff('mbase', 2.0, 'mbase');
            break;
    }

    if (!hasBuff.mbase) buffs.mbase = 1.0;
    if (!hasBuff.mgeral) buffs.mgeral = 1.0;
    if (!hasBuff.mformas) buffs.mformas = 1.0;
    if (!hasBuff.mabs) buffs.mabs = 1.0;

    buffs._hasBuff = hasBuff;
    return buffs;
}

export function getPoderesDefesa(ficha, tipo) {
    let t = 0;
    if (!ficha || !ficha.poderes) return 0;
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
    
    // 🔥 EFEITOS DEFENSIVOS E DE ACERTO DE CLASSE
    let classeHeroica = (ficha.bio && ficha.bio.classe) ? String(ficha.bio.classe).toLowerCase() : '';
    if (classeHeroica === 'rider' && tipo === 'bonus_evasiva') t += 200;
    if (classeHeroica === 'shielder' && tipo === 'bonus_resistencia') t += 500;
    
    return t;
}

export function getPoderTotalDaAbaPoderes(ficha, statKey) {
    let b = getBuffs(ficha, statKey);
    let mU = 1.0;
    for (let i = 0; i < b.munico.length; i++) mU *= b.munico[i];

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
    if (!ficha || !statKey) return 0;
    let s = ficha[statKey];
    return (s && s.base) ? parseFloat(s.base) : 0;
}

export function getEfetivoBase(ficha, statKey) {
    let rawBase = getRawBase(ficha, statKey);
    if (isNaN(rawBase)) rawBase = 0;
    return rawBase + getBuffs(ficha, statKey).base;
}

export function getMultiplicadorTotal(ficha, k) {
    if (!ficha || !k) return 1.0;
    let s = ficha[k] || {};
    let b = getBuffs(ficha, k);

    const calcAdd = (fichaVal, buffSum, hasBuffFlag) => {
        let v = parseFloat(fichaVal) || 1.0;
        if (!hasBuffFlag) return v; 
        return (v === 1.0 ? 0 : v) + buffSum; 
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