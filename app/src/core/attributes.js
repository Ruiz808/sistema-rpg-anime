import useStore from '../stores/useStore';
import { isFisico, isEnergia, tratarUnico } from './utils.js';

export function getEfeitosDeClasse(ficha) {
    let classeHeroica = (ficha.bio && ficha.bio.classe) ? String(ficha.bio.classe).toLowerCase() : '';
    let subClasse = (ficha.bio && ficha.bio.subClasse) ? String(ficha.bio.subClasse).toLowerCase() : '';

    if (!classeHeroica) return [];

    let state = useStore.getState();
    let mestreOverrides = {};
    
    if (state.isMestre && state.minhaFicha?.compendioOverrides) {
        mestreOverrides = state.minhaFicha.compendioOverrides;
    } else if (state.personagens) {
        for (let k of Object.keys(state.personagens)) {
            if (state.personagens[k]?.compendioOverrides) {
                mestreOverrides = state.personagens[k].compendioOverrides;
                break;
            }
        }
    }

    let efeitos = [];

    let classData = mestreOverrides[classeHeroica];
    if (classData && classData.efeitosMatematicos) {
        efeitos = [...classData.efeitosMatematicos];
    }

    if ((classeHeroica === 'alterego' || classeHeroica === 'pretender') && subClasse) {
        let subClassData = mestreOverrides[subClasse];
        if (subClassData && subClassData.efeitosMatematicos) {
            efeitos = [...efeitos, ...subClassData.efeitosMatematicos];
        }
    }
    
    return efeitos;
}

export function getBuffs(ficha, statKey, ignorarPassivas = false, avoidLoop = false) {
    let buffs = { base: 0, mbase: 0, mgeral: 0, mformas: 0, mabs: 0, munico: [], reducaoCusto: 0, regeneracao: 0, fontesMgeral: [] };
    let hasBuff = { mbase: false, mgeral: false, mformas: false, mabs: false };

    if (!ficha || !statKey) {
        buffs.mbase = 1.0; buffs.mgeral = 1.0; buffs.mformas = 1.0; buffs.mabs = 1.0;
        buffs._hasBuff = hasBuff;
        return buffs;
    }

    let sK = String(statKey).toLowerCase();
    let isStatFisico = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaesp', 'carisma', 'stamina', 'constituicao'].includes(sK);
    let isStatEnergia = ['mana', 'aura', 'chakra', 'corpo'].includes(sK);

    let maxFuriaVal = 0; 

    const processarEfeitos = (efeitos, origemNome) => {
        if (!efeitos) return;
        for (let j = 0; j < efeitos.length; j++) {
            let e = efeitos[j];
            if (!e) continue;
            let prop = (e.propriedade || '').toLowerCase();
            let atr = (e.atributo || '').toLowerCase();
            let val = parseFloat(e.valor);
            
            if (isNaN(val)) val = prop.startsWith('m') ? 1.0 : 0;

            // 🔥 A CORREÇÃO: "todos_status" agora está separado de "dano"!
            let afeta = (atr === sK) ||
                (atr === 'todos_status' && (isStatFisico || sK === 'status')) ||
                (atr === 'todas_energias' && isStatEnergia) ||
                (atr === 'geral');

            if (afeta) {
                if (prop === 'furia_berserker') {
                    if (val > maxFuriaVal) maxFuriaVal = val;
                }
                else if (prop === 'base') buffs.base += val;
                else if (prop === 'mbase') { buffs.mbase += val; hasBuff.mbase = true; }
                else if (prop === 'mgeral') { 
                    buffs.mgeral += val; 
                    hasBuff.mgeral = true; 
                    buffs.fontesMgeral.push(`[${origemNome}] +${val}x`); 
                }
                else if (prop === 'mformas') { buffs.mformas += val; hasBuff.mformas = true; }
                else if (prop === 'mabs') { buffs.mabs += val; hasBuff.mabs = true; }
                else if (prop === 'munico') buffs.munico.push(val);
                else if (prop === 'reducaocusto') buffs.reducaoCusto += val;
                else if (prop === 'regeneracao') buffs.regeneracao += val;
            }
        }
    };

    if (ficha.poderes) {
        for (let i = 0; i < ficha.poderes.length; i++) {
            let p = ficha.poderes[i];
            if (p && p.ativa && p.efeitos) processarEfeitos(p.efeitos, `Poder: ${p.nome}`);
            if (p && p.efeitosPassivos) processarEfeitos(p.efeitosPassivos, `Poder(Pass): ${p.nome}`);
        }
    }

    if (ficha.inventario) {
        for (let i = 0; i < ficha.inventario.length; i++) {
            let item = ficha.inventario[i];
            if (item && item.equipado) {
                if (item.efeitos) processarEfeitos(item.efeitos, `Item: ${item.nome}`);
                if (item.efeitosPassivos) processarEfeitos(item.efeitosPassivos, `Item(Pass): ${item.nome}`);
            }
        }
    }

    if (!ignorarPassivas && ficha.passivas) {
        for (let i = 0; i < ficha.passivas.length; i++) {
            let p = ficha.passivas[i];
            if (p && p.efeitos) processarEfeitos(p.efeitos, `Passiva: ${p.nome}`);
        }
    }

    processarEfeitos(getEfeitosDeClasse(ficha), `Classe Mística`);

    if (maxFuriaVal > 0 && !avoidLoop) {
        let rawMaxVida = getMaximo(ficha, 'vida', true); 
        let strVal = String(Math.floor(rawMaxVida));
        let pVit = Math.max(0, strVal.length - 8);
        
        let maxVida = pVit > 0 ? Math.floor(rawMaxVida / Math.pow(10, pVit)) : rawMaxVida;
        let atualVida = ficha.vida?.atual ?? maxVida;
        
        let percLost = maxVida > 0 ? Math.max(0, ((maxVida - atualVida) / maxVida) * 100) : 0;
        
        let furiaMax = (ficha.combate && ficha.combate.furiaMax) !== undefined 
                        ? parseFloat(ficha.combate.furiaMax) 
                        : 0;
                        
        let percEfetivo = Math.floor(Math.max(percLost, furiaMax));
        
        let multiplicadorGanho = 0;
        if (percEfetivo === 1) {
            multiplicadorGanho = maxFuriaVal; 
        } else if (percEfetivo >= 2) {
            multiplicadorGanho = percEfetivo; 
        }
        
        buffs.mgeral += multiplicadorGanho;
        if (multiplicadorGanho > 0) {
            hasBuff.mgeral = true;
            buffs.fontesMgeral.push(`[Fúria Berserker] +${multiplicadorGanho}x`); 
        }
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
    
    let efeitosClasse = getEfeitosDeClasse(ficha);
    for (let j = 0; j < efeitosClasse.length; j++) {
        if ((efeitosClasse[j].propriedade || '').toLowerCase() === tipo) {
            t += (parseFloat(efeitosClasse[j].valor) || 0);
        }
    }
    
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

export function getEfetivoBase(ficha, statKey, avoidLoop = false) {
    let rawBase = getRawBase(ficha, statKey);
    if (isNaN(rawBase)) rawBase = 0;
    return rawBase + getBuffs(ficha, statKey, false, avoidLoop).base;
}

export function getMultiplicadorTotal(ficha, k, avoidLoop = false) {
    if (!ficha || !k) return 1.0;
    let s = ficha[k] || {};
    let b = getBuffs(ficha, k, false, avoidLoop);

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

export function getMaximo(ficha, k, avoidLoop = false) {
    let b = getEfetivoBase(ficha, k, avoidLoop);
    let mult = getMultiplicadorTotal(ficha, k, avoidLoop);
    let mx = Math.floor(b * mult);
    return isNaN(mx) ? 0 : mx;
}