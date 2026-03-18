import { describe, it, expect } from 'vitest';
import { getBuffs, getPoderesDefesa, getPoderTotalDaAbaPoderes, isStatBuffed, getRawBase, getEfetivoBase, getMultiplicadorTotal, getMaximo } from '../core/attributes.js';
import { fichaPadrao } from '../stores/useStore.js';

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ==========================================
// getBuffs
// ==========================================
describe('getBuffs', () => {
    it('returns default multipliers of 1.0 when ficha has no poderes', () => {
        const b = getBuffs({}, 'forca');
        expect(b.mbase).toBe(1.0);
        expect(b.mgeral).toBe(1.0);
        expect(b.mformas).toBe(1.0);
        expect(b.mabs).toBe(1.0);
        expect(b.base).toBe(0);
        expect(b.munico).toEqual([]);
    });

    it('returns default multipliers for null ficha', () => {
        const b = getBuffs(null, 'forca');
        expect(b.mbase).toBe(1.0);
        expect(b.mgeral).toBe(1.0);
    });

    it('accumulates base buffs from active poderes targeting the stat', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [
                    { propriedade: 'base', atributo: 'forca', valor: '500' },
                    { propriedade: 'base', atributo: 'forca', valor: '300' }
                ]
            }]
        };
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(800);
    });

    it('ignores inactive poderes', () => {
        const ficha = {
            poderes: [{
                ativa: false,
                efeitos: [{ propriedade: 'base', atributo: 'forca', valor: '500' }]
            }]
        };
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(0);
    });

    it('applies "todos_status" to physical stats only', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mbase', atributo: 'todos_status', valor: '2.0' }]
            }]
        };
        const bForca = getBuffs(ficha, 'forca');
        expect(bForca.mbase).toBe(2.0);
        expect(bForca._hasBuff.mbase).toBe(true);

        const bMana = getBuffs(ficha, 'mana');
        expect(bMana.mbase).toBe(1.0); // not affected
        expect(bMana._hasBuff.mbase).toBe(false);
    });

    it('applies "todas_energias" to energy stats only', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mgeral', atributo: 'todas_energias', valor: '3.0' }]
            }]
        };
        const bMana = getBuffs(ficha, 'mana');
        expect(bMana.mgeral).toBe(3.0);

        const bForca = getBuffs(ficha, 'forca');
        expect(bForca.mgeral).toBe(1.0); // not affected
    });

    it('applies "geral" to all stats', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mformas', atributo: 'geral', valor: '5.0' }]
            }]
        };
        expect(getBuffs(ficha, 'forca').mformas).toBe(5.0);
        expect(getBuffs(ficha, 'mana').mformas).toBe(5.0);
        expect(getBuffs(ficha, 'vida').mformas).toBe(5.0);
    });

    it('accumulates munico as array', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [
                    { propriedade: 'munico', atributo: 'forca', valor: '2.0' },
                    { propriedade: 'munico', atributo: 'forca', valor: '3.0' }
                ]
            }]
        };
        const b = getBuffs(ficha, 'forca');
        expect(b.munico).toEqual([2.0, 3.0]);
    });

    it('accumulates reducaoCusto and regeneracao', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [
                    { propriedade: 'reducaocusto', atributo: 'mana', valor: '10' },
                    { propriedade: 'regeneracao', atributo: 'mana', valor: '5' }
                ]
            }]
        };
        const b = getBuffs(ficha, 'mana');
        expect(b.reducaoCusto).toBe(10);
        expect(b.regeneracao).toBe(5);
    });
});

// ==========================================
// getPoderesDefesa
// ==========================================
describe('getPoderesDefesa', () => {
    it('returns 0 when no poderes', () => {
        expect(getPoderesDefesa({ poderes: [] }, 'bonus_acerto')).toBe(0);
        expect(getPoderesDefesa({}, 'bonus_acerto')).toBe(0);
    });

    it('sums active defense powers of matching type', () => {
        const ficha = {
            poderes: [
                { ativa: true, efeitos: [{ propriedade: 'bonus_acerto', valor: '5' }] },
                { ativa: true, efeitos: [{ propriedade: 'bonus_acerto', valor: '3' }] },
                { ativa: false, efeitos: [{ propriedade: 'bonus_acerto', valor: '100' }] }
            ]
        };
        expect(getPoderesDefesa(ficha, 'bonus_acerto')).toBe(8);
    });
});

// ==========================================
// getRawBase & getEfetivoBase
// ==========================================
describe('getRawBase', () => {
    it('returns base value from ficha stat', () => {
        const ficha = { forca: { base: 50000 } };
        expect(getRawBase(ficha, 'forca')).toBe(50000);
    });

    it('returns 0 when stat or base is missing', () => {
        expect(getRawBase({}, 'forca')).toBe(0);
        expect(getRawBase({ forca: {} }, 'forca')).toBe(0);
    });
});

describe('getEfetivoBase', () => {
    it('adds buff base to raw base', () => {
        const ficha = {
            forca: { base: 1000 },
            poderes: [{ ativa: true, efeitos: [{ propriedade: 'base', atributo: 'forca', valor: '500' }] }]
        };
        expect(getEfetivoBase(ficha, 'forca')).toBe(1500);
    });

    it('returns just raw base when no buffs', () => {
        const ficha = deepClone(fichaPadrao);
        expect(getEfetivoBase(ficha, 'forca')).toBe(100000);
    });
});

// ==========================================
// getMaximo
// ==========================================
describe('getMaximo', () => {
    it('computes base * total multiplier for default ficha', () => {
        const ficha = deepClone(fichaPadrao);
        // Default: base=100000, all mults=1.0 => max = 100000
        expect(getMaximo(ficha, 'forca')).toBe(100000);
    });

    it('applies multipliers correctly', () => {
        const ficha = deepClone(fichaPadrao);
        ficha.forca.mBase = 2.0;
        // base=100000, mBase=2.0, rest=1.0 => 100000 * 2 = 200000
        expect(getMaximo(ficha, 'forca')).toBe(200000);
    });

    it('returns 0 for NaN result', () => {
        // Need poderes array to avoid crash in getBuffs._hasBuff access
        expect(getMaximo({ forca: {}, poderes: [] }, 'forca')).toBe(0);
    });
});

// ==========================================
// isStatBuffed
// ==========================================
describe('isStatBuffed', () => {
    it('returns false when no powers active', () => {
        const ficha = deepClone(fichaPadrao);
        expect(isStatBuffed(ficha, 'forca')).toBe(false);
    });

    it('returns true when power multiplier exceeds 1.0', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mbase', atributo: 'forca', valor: '2.0' }]
            }]
        };
        expect(isStatBuffed(ficha, 'forca')).toBe(true);
    });

    it('checks all physical stats when key is "status"', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mbase', atributo: 'destreza', valor: '2.0' }]
            }]
        };
        expect(isStatBuffed(ficha, 'status')).toBe(true);
    });
});
