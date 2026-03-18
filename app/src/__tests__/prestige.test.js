import { describe, it, expect } from 'vitest';
import { getDivisorPara, getPrestigioReal, calcPAtual, getRank } from '../core/prestige.js';

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ==========================================
// getDivisorPara
// ==========================================
describe('getDivisorPara', () => {
    it('returns divisor for each stat key', () => {
        const ficha = { divisores: { vida: 2, status: 3, mana: 5, aura: 7, chakra: 11, corpo: 13 } };
        expect(getDivisorPara(ficha, 'vida')).toBe(2);
        expect(getDivisorPara(ficha, 'status')).toBe(3);
        expect(getDivisorPara(ficha, 'mana')).toBe(5);
        expect(getDivisorPara(ficha, 'aura')).toBe(7);
        expect(getDivisorPara(ficha, 'chakra')).toBe(11);
        expect(getDivisorPara(ficha, 'corpo')).toBe(13);
    });

    it('defaults to status divisor for unknown keys', () => {
        const ficha = { divisores: { status: 4, vida: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 } };
        expect(getDivisorPara(ficha, 'forca')).toBe(4);
        expect(getDivisorPara(ficha, 'destreza')).toBe(4);
    });

    it('creates default divisores if missing', () => {
        const ficha = {};
        expect(getDivisorPara(ficha, 'vida')).toBe(1);
        expect(ficha.divisores).toBeDefined();
    });

    it('returns 1 for NaN divisor values', () => {
        const ficha = { divisores: { vida: 'abc', status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 } };
        expect(getDivisorPara(ficha, 'vida')).toBe(1);
    });
});

// ==========================================
// getPrestigioReal
// ==========================================
describe('getPrestigioReal', () => {
    it('divides vida by 1,000,000', () => {
        expect(getPrestigioReal('vida', 5000000)).toBe(5);
        expect(getPrestigioReal('vida', 999999)).toBe(0);
    });

    it('divides energy stats by 10,000,000', () => {
        expect(getPrestigioReal('mana', 50000000)).toBe(5);
        expect(getPrestigioReal('aura', 100000000)).toBe(10);
        expect(getPrestigioReal('chakra', 9999999)).toBe(0);
        expect(getPrestigioReal('corpo', 30000000)).toBe(3);
    });

    it('divides physical stats by 1,000', () => {
        expect(getPrestigioReal('forca', 50000)).toBe(50);
        expect(getPrestigioReal('destreza', 100000)).toBe(100);
        expect(getPrestigioReal('inteligencia', 999)).toBe(0);
    });

    it('floors the result', () => {
        expect(getPrestigioReal('forca', 1500)).toBe(1);
        expect(getPrestigioReal('vida', 1500000)).toBe(1);
    });
});

// ==========================================
// getRank
// ==========================================
describe('getRank', () => {
    it('returns rank D for prestige 0-19', () => {
        expect(getRank(0, 1).l).toBe('D');
        expect(getRank(19, 1).l).toBe('D');
    });

    it('returns rank C for prestige 20-39', () => {
        expect(getRank(20, 1).l).toBe('C');
        expect(getRank(39, 1).l).toBe('C');
    });

    it('returns rank B for prestige 40-59', () => {
        expect(getRank(40, 1).l).toBe('B');
        expect(getRank(59, 1).l).toBe('B');
    });

    it('returns rank A for prestige 60-79', () => {
        expect(getRank(60, 1).l).toBe('A');
        expect(getRank(79, 1).l).toBe('A');
    });

    it('returns rank S for prestige 80-99', () => {
        expect(getRank(80, 1).l).toBe('S');
        expect(getRank(99, 1).l).toBe('S');
    });

    it('returns rank EX for prestige 100 (exact boundary)', () => {
        const r = getRank(100, 1);
        expect(r.l).toBe('EX');
        expect(r.r).toBe(100);
        expect(r.a).toBe(1); // ascExtra=1-1=0, ascTotal=1+0=1
    });

    it('increments ascension every 100 prestige', () => {
        const r200 = getRank(200, 1);
        expect(r200.l).toBe('EX');
        expect(r200.a).toBe(2); // ascExtra=2-1=1, ascTotal=1+1=2

        const r150 = getRank(150, 1);
        expect(r150.l).toBe('B'); // resto=50
        expect(r150.a).toBe(2); // ascExtra=1, ascTotal=1+1=2
    });

    it('uses ascBase parameter', () => {
        const r = getRank(50, 3);
        expect(r.a).toBe(3); // ascExtra=0, ascTotal=3+0=3
    });

    it('handles negative prestige', () => {
        const r = getRank(-10, 1);
        expect(r.l).toBe('D');
        expect(r.r).toBe(0);
    });

    it('returns correct colors', () => {
        expect(getRank(0, 1).c).toBe('#ff003c');   // D
        expect(getRank(20, 1).c).toBe('#ccc');       // C
        expect(getRank(40, 1).c).toBe('#0088ff');    // B
        expect(getRank(60, 1).c).toBe('#00ff88');    // A
        expect(getRank(80, 1).c).toBe('#ffcc00');    // S
        expect(getRank(100, 1).c).toBe('#f0f');      // EX
    });
});

// ==========================================
// calcPAtual
// ==========================================
describe('calcPAtual', () => {
    it('returns base prestige when no powers and divisor=1', () => {
        const ficha = { poderes: [], divisores: { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 } };
        const result = calcPAtual(ficha, 'forca', 50);
        expect(result.valor).toBe(50);
    });

    it('sets divisor to 10 when powers are active', () => {
        const ficha = {
            poderes: [{
                ativa: true,
                efeitos: [{ propriedade: 'mbase', atributo: 'forca', valor: '2.0' }]
            }],
            divisores: { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 }
        };
        const result = calcPAtual(ficha, 'forca', 50);
        expect(result.divisorAtualizado).toBe(true);
        expect(ficha.divisores.status).toBe(10); // forca maps to "status" uiKey
    });

    it('resets divisor to 1 when powers are removed', () => {
        const ficha = {
            poderes: [],
            divisores: { vida: 1, status: 10, mana: 1, aura: 1, chakra: 1, corpo: 1 }
        };
        const result = calcPAtual(ficha, 'forca', 50);
        expect(result.divisorAtualizado).toBe(true);
        expect(ficha.divisores.status).toBe(1);
    });

    it('for "status" key, averages power multipliers over 8 stats', () => {
        // With no powers, mPoderes = 8*1.0/8 = 1.0
        const ficha = { poderes: [], divisores: { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 } };
        const result = calcPAtual(ficha, 'status', 100);
        expect(result.valor).toBe(100);
    });
});
