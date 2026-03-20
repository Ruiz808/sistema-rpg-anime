import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calcularDano, rolarDadosComVantagem } from '../core/engine.js';

// ==========================================
// Helpers
// ==========================================

/**
 * Builds a minimal ficha. Multipliers default to 1.0 so that
 * getMaximo(ficha, 'forca') = floor(100 * 1.0) = 100
 * getMaximo(ficha, 'mana')  = floor(50  * 1.0) = 50
 */
function buildFicha({ poderes = [], inventario = [], ataquesElementais = [] } = {}) {
    return {
        forca: { base: 100, nome: 'Forca', mBase: 1.0, mGeral: 1.0 },
        mana:  { base: 50,  nome: 'Mana',  atual: 1000, mBase: 1.0, mGeral: 1.0 },
        poderes,
        inventario,
        ataquesElementais,
    };
}

/**
 * Minimal calcularDano call — callers only override what they need.
 */
function callCalcDano(overrides = {}) {
    return calcularDano({
        // Legacy params (irrelevant for new-system path, but required by signature)
        qDBase: 1, qDExtra: 0, qDMagia: 0, fD: 20,
        pE: 0, pMagiaTotal: 0, rE: 0, mE: 1, db: 0, mdb: 1,
        // Common params
        engs: [], sels: ['forca'],
        minhaFicha: buildFicha(),
        m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, uArr: [1.0],
        itensEquipados: [], magiasEquipadas: [],
        ...overrides,
    });
}

/**
 * Creates a weapon item (type='arma').
 */
function makeArma({ id = 'arma1', nome = 'Espada', dadosQtd = 2, dadosFaces = 6, bonusTipo = null, bonusValor = '0', elemento = 'Neutro' } = {}) {
    return { id, nome, tipo: 'arma', dadosQtd, dadosFaces, bonusTipo, bonusValor, elemento };
}

/**
 * Creates a poder (skill) with dice.
 */
function makePoder({ id = 'p1', nome = 'Golpe', dadosQtd = 3, dadosFaces = 8, ativa = true, armaVinculada = null, efeitos = [] } = {}) {
    return { id, nome, dadosQtd, dadosFaces, ativa, armaVinculada, efeitos };
}

// ==========================================
// Mock Math.random before each suite
// ==========================================

describe('calcularDano — novo sistema (arma com dados)', () => {
    let randomSpy;

    beforeEach(() => {
        // Always return 0.5 → dice result = floor(0.5 * faces) + 1
        // d6  → 4,  d8  → 5,  d10 → 6
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('happy path — arma 2d6 only, no skills, no energy', () => {
        // Math.random = 0.5 → each d6 = floor(0.5*6)+1 = 4
        // rolagemArma = 4+4 = 8
        // somaTermosArma = getMaximo(forca)=100 * uniTotal=1 = 100
        // danoArma = floor(8 * 100) = 800
        // multTotal = 1*1*1*1*1*1 = 1
        // total = floor(800 * 1) = 800
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const ficha = buildFicha();
        const result = callCalcDano({
            itensEquipados: [arma],
            minhaFicha: ficha,
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(800);
        expect(result.letalidade).toBe(0);
        expect(result.drenos).toEqual([]);
        expect(result.energiaDrenada).toBe(true);
    });

    it('happy path — arma 2d6 + habilidade vinculada 3d8', () => {
        // d6 rolls: each = 4 → rolagemArma = 8
        // d8 rolls: each = 5 → somaHab = floor(8 * 100) = 400 (rolagemHab=15, wait)
        // Actually: habVinc first → calcularSubDano: rolls 3d8 = 5+5+5=15, somaTermos=100, dano=floor(15*100)=1500
        // somaHabVinc = 1500
        // somaTermosArma = 100 (forca) + somaHabVinc(1500) = 1600
        // danoArma = floor(8 * 1600) = 12800
        // total = floor(12800 * 1) = 12800
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const vinculada = makePoder({ dadosQtd: 3, dadosFaces: 8, armaVinculada: 'arma1' });
        const ficha = buildFicha({ poderes: [vinculada] });

        const result = callCalcDano({
            itensEquipados: [arma],
            minhaFicha: ficha,
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(12800);
    });

    it('happy path — arma 2d6 + habilidade livre 1d10 (no armaVinculada)', () => {
        // armaEquipada dice: 2d6 = 4+4=8, somaTermosArma = 100, danoArma = 800
        // habLivre 1d10: roll=floor(0.5*10)+1=6, somaTermos=100, dano=floor(6*100)=600
        // somaDanos = 800 + 600 = 1400
        // total = floor(1400 * 1) = 1400
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const livre = makePoder({ id: 'p2', dadosQtd: 1, dadosFaces: 10, armaVinculada: null });
        const ficha = buildFicha({ poderes: [livre] });

        const result = callCalcDano({
            itensEquipados: [arma],
            minhaFicha: ficha,
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(1400);
    });

    it('happy path — no weapon, only free skill with dice', () => {
        // No armaEquipada, poderesAtivos=[livreSkill], temNovoSistema=true
        // resultadoArma = null → somaDanos = 0 + habLivre.dano
        // habLivre 2d6: roll=4+4=8, somaTermos=100, dano=floor(8*100)=800
        // total = floor(800 * 1) = 800
        const livre = makePoder({ dadosQtd: 2, dadosFaces: 6, armaVinculada: null });
        const ficha = buildFicha({ poderes: [livre] });

        const result = callCalcDano({
            itensEquipados: [],
            minhaFicha: ficha,
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(800);
    });

    it('happy path — energy cost applied to new system', () => {
        // engs=['mana'], pE=10 → gastoPercentualPorEnergia=10
        // mana.base=50, getMaximo(mana)=50, gtDrenoBase=floor(50*(10/100))=5
        // crDreno=floor(5*(1-0))=5, mana.atual=1000 >= 5 → OK
        // combustaoPorEnergia={mana:5}
        // somaTermosArma = getMaximo(forca)*1 + combustao*1*1 = 100 + 5 = 105
        // arma 2d6: rolls=8, danoArma=floor(8*105)=840
        // total = 840
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const ficha = buildFicha();

        const result = callCalcDano({
            itensEquipados: [arma],
            minhaFicha: ficha,
            engs: ['mana'],
            pE: 10,
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(840);
        expect(result.drenos).toEqual([{ key: 'mana', valor: 5 }]);
    });

    it('new system — global multipliers are applied', () => {
        // m1 (Ger) = 2 → multTotal = 1*1*2*1*1 = 2
        // danoArma base = 800, total = floor(800 * 2) = 1600
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({
            itensEquipados: [arma],
            m1: 2,
        });

        expect(result.dano).toBe(1600);
    });

    it('new system — uArr multiplier is applied', () => {
        // uArr=[2.0] → uniTotal=2
        // somaTermosArma = 100*2 = 200, rolagemArma=8
        // danoArma=floor(8*200)=1600
        // multTotal includes uniTotal=2 → total=floor(1600*2)=3200
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({
            itensEquipados: [arma],
            uArr: [2.0],
        });

        expect(result.dano).toBe(3200);
    });

    it('new system — result contains expected keys', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });

        expect(result).toHaveProperty('dano');
        expect(result).toHaveProperty('letalidade');
        expect(result).toHaveProperty('rolagem');
        expect(result).toHaveProperty('rolagemMagica');
        expect(result).toHaveProperty('atributosUsados');
        expect(result).toHaveProperty('detalheEnergia');
        expect(result).toHaveProperty('armaStr');
        expect(result).toHaveProperty('detalheConta');
        expect(result).toHaveProperty('drenos');
        expect(result).toHaveProperty('energiaDrenada');
    });

    it('new system — weapon name appears in armaStr', () => {
        const arma = makeArma({ nome: 'Katana Lendaria', dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(result.armaStr).toContain('Katana Lendaria');
    });

    it('new system — detalheConta contains MAQUINA DE CALCULO marker', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(result.detalheConta).toContain('MAQUINA DE CALCULO');
    });

    it('new system — letality is 0 for small damage, positive for huge damage', () => {
        // Small result (800) → contarDigitos(800)=3 < 8 → letal=0
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(result.letalidade).toBe(0);
        expect(result.dano).toBe(result.dano); // damage not reduced when letal=0
    });

    it('new system — letality reduces dano for 9+ digit totals', () => {
        // m1=1e6 pushes total above 10^8
        // danoArma = 800 (base), multTotal = 1e6 → total = 800_000_000
        // contarDigitos(800_000_000)=9, letal=max(0,9-8)+0=1, dRed=floor(800_000_000/10^1)=80_000_000
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma], m1: 1e6 });
        expect(result.letalidade).toBe(1);
        expect(result.dano).toBe(80000000);
    });
});

// ==========================================
// Legacy system
// ==========================================
describe('calcularDano — sistema legado (sem dados em arma/habilidade)', () => {
    let randomSpy;

    beforeEach(() => {
        // 0.5 → d20 roll = floor(0.5*20)+1 = 11
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('happy path — basic legacy roll with 1d20', () => {
        // qDBase=1, fD=20 → roll=11
        // powerStatus = getMaximo(forca)=100
        // eCal=0, dbCal=0, fixoTotal=0
        // dIni = 100 * 11 + 0 + 0 = 1100
        // multTotal = 1
        // total = 1100
        const result = callCalcDano({
            qDBase: 1, fD: 20,
            itensEquipados: [], magiasEquipadas: [],
            minhaFicha: buildFicha(),
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(1100);
    });

    it('legacy — multiple dice (qDBase + qDExtra)', () => {
        // 2 dice, d20 each → 11+11=22
        // dIni = 100*22 = 2200
        const result = callCalcDano({
            qDBase: 1, qDExtra: 1, fD: 20,
            itensEquipados: [],
        });

        expect(result.dano).toBe(2200);
    });

    it('legacy — m2 multiplier applied', () => {
        // dIni=1100, m2=2 (mbase mult) → multTotal=1*1*2*1*1*1 = wait:
        // multTotal = totalGer * totalBas * m3 * totalFor * totalAbs * uniTotal * iMultDano
        // = 1 * (m2*1.0) * 1 * 1 * 1 * 1 * 1 = 2
        // total = floor(1100 * 2) = 2200
        const result = callCalcDano({
            qDBase: 1, fD: 20,
            m2: 2,
            itensEquipados: [],
        });

        expect(result.dano).toBe(2200);
    });

    it('legacy — result contains expected keys', () => {
        const result = callCalcDano({ itensEquipados: [] });

        expect(result).toHaveProperty('dano');
        expect(result).toHaveProperty('letalidade');
        expect(result).toHaveProperty('rolagem');
        expect(result).toHaveProperty('detalheConta');
        expect(result).toHaveProperty('drenos');
        expect(result).toHaveProperty('energiaDrenada');
    });

    it('legacy — energy dreno adds to damage', () => {
        // engs=['mana'], pE=10 → gtDrenoBase=5, combustaoPorEnergia={mana:5}
        // mE=2 → eCal=floor(5*2)=10
        // dIni = 100*11 + 10 = 1110, total = 1110
        const result = callCalcDano({
            qDBase: 1, fD: 20,
            engs: ['mana'], pE: 10, mE: 2,
            minhaFicha: buildFicha(),
            itensEquipados: [],
        });

        expect(result.dano).toBe(1110);
        expect(result.drenos).toEqual([{ key: 'mana', valor: 5 }]);
    });

    it('legacy — fixed dano bruto adds to base before multipliers', () => {
        // db=100, mdb=1 → dbCal=100, fixoTotal=100
        // dIni = 100*11 + 0 + 100 = 1200, total = 1200
        const result = callCalcDano({
            qDBase: 1, fD: 20,
            db: 100, mdb: 1,
            itensEquipados: [],
        });

        expect(result.dano).toBe(1200);
    });

    it('legacy — item bonus_dano_bruto is added', () => {
        // iDanoBruto=50 from item → fixoTotal=50
        // dIni = 100*11 + 50 = 1150
        const item = { tipo: 'acessorio', bonusTipo: 'dano_bruto', bonusValor: '50', nome: 'Anel' };
        const result = callCalcDano({
            qDBase: 1, fD: 20,
            itensEquipados: [item],
        });

        expect(result.dano).toBe(1150);
    });
});

// ==========================================
// Edge cases
// ==========================================
describe('calcularDano — edge cases', () => {
    let randomSpy;

    beforeEach(() => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('empty engs array does not crash (no division by zero)', () => {
        // This was the bug fix: engs.length=0 → gastoPercentualPorEnergia=0
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        expect(() => callCalcDano({ engs: [], itensEquipados: [arma] })).not.toThrow();
    });

    it('skill with dadosQtd=0 does not contribute to damage or trigger new system', () => {
        // poderesAtivos filters dadosQtd > 0 → skill with 0 is excluded
        const inactiveDice = makePoder({ dadosQtd: 0, ativa: true });
        const ficha = buildFicha({ poderes: [inactiveDice] });

        // No arma with dice either → falls through to legacy
        // Legacy: 1d20 roll=11, powerStatus=100, dIni=1100
        const result = callCalcDano({ minhaFicha: ficha, itensEquipados: [] });
        expect(result.dano).toBe(1100); // legacy result, not new system
    });

    it('inactive skill (ativa=false) does not trigger new system', () => {
        const inactivePoder = makePoder({ dadosQtd: 3, dadosFaces: 8, ativa: false });
        const ficha = buildFicha({ poderes: [inactivePoder] });

        // Falls to legacy: dIni=100*11=1100
        const result = callCalcDano({ minhaFicha: ficha, itensEquipados: [] });
        expect(result.dano).toBe(1100);
    });

    it('weapon with dadosQtd=0 does not trigger new system', () => {
        // Arma with dadosQtd=0 → temNovoSistema stays false if no active skill dice
        const armaZero = makeArma({ dadosQtd: 0 });
        // falls to legacy
        const result = callCalcDano({ itensEquipados: [armaZero] });
        expect(result.dano).toBe(1100);
    });

    it('returns error when energy insufficient', () => {
        // mana.atual=0, engs=['mana'], pE=50 → crTotal>0 and atual<crTotal
        const ficha = buildFicha();
        ficha.mana.atual = 0;

        const result = callCalcDano({
            engs: ['mana'], pE: 50,
            minhaFicha: ficha,
            itensEquipados: [],
        });

        expect(result.erro).toBeDefined();
        expect(typeof result.erro).toBe('string');
        expect(result.erro.toLowerCase()).toContain('mana');
    });

    it('handles missing poderes array gracefully', () => {
        // minhaFicha without poderes key
        const ficha = {
            forca: { base: 100, nome: 'Forca', mBase: 1.0, mGeral: 1.0 },
            mana:  { base: 50,  nome: 'Mana',  atual: 1000, mBase: 1.0, mGeral: 1.0 },
            ataquesElementais: [],
        };

        expect(() => callCalcDano({ minhaFicha: ficha, itensEquipados: [] })).not.toThrow();
    });

    it('new system — iDanoBruto from item is added to somaDanos', () => {
        // danoArma=800 + iDanoBruto=200 = somaDanos=1000, total=1000
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'dano_bruto', bonusValor: '200', nome: 'Anel' };

        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.dano).toBe(1000);
    });

    it('new system — mult_dano bonus from equipped item multiplies final result', () => {
        // iMultDano=2, danoArma=800, multTotal includes iMultDano=2 → total=1600
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'mult_dano', bonusValor: '2', nome: 'Colar' };

        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.dano).toBe(1600);
    });

    it('new system — letalidade bonus from item adds to letal count', () => {
        // iLetalidade=5 from item, danoArma=800 → letal=max(0,3-8)+5=5
        // dRed=floor(800/10^5)=0
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'letalidade', bonusValor: '5', nome: 'Garras' };

        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.letalidade).toBe(5);
    });

    it('new system — linked skill is not treated as free skill', () => {
        // habsVinculadas=[vinculada], habsLivres=[]
        // resultadosHabLivres is empty → only arma+vinc contributes
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const vinculada = makePoder({ dadosQtd: 3, dadosFaces: 8, armaVinculada: 'arma1' });
        const ficha = buildFicha({ poderes: [vinculada] });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });

        // Linked skill dano = floor(15*100)=1500, somaHabVinc=1500
        // somaTermosArma = 100 + 1500 = 1600, rolagemArma=8 → danoArma=12800
        // habsLivres is empty → no extra dano
        expect(result.dano).toBe(12800);
    });

    it('new system — free skill not linked to current weapon stays as free', () => {
        // arma id='arma1', skill armaVinculada='arma2' (different) → treated as free
        const arma = makeArma({ id: 'arma1', dadosQtd: 2, dadosFaces: 6 });
        const difVinc = makePoder({ dadosQtd: 1, dadosFaces: 10, armaVinculada: 'arma2' });
        const ficha = buildFicha({ poderes: [difVinc] });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });

        // danoArma = floor(8 * 100) = 800
        // danoLivre = floor(6 * 100) = 600 (1d10, roll=6)
        // total = 1400
        expect(result.dano).toBe(1400);
    });

    it('zero dice result does not produce NaN', () => {
        // Force zero roll: Math.random mock returns 0 → floor(0*6)+1=1
        randomSpy.mockReturnValue(0);
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(isNaN(result.dano)).toBe(false);
        expect(result.dano).toBeGreaterThanOrEqual(0);
    });
});

// ==========================================
// rolarDadosComVantagem
// ==========================================
describe('rolarDadosComVantagem', () => {
    let randomSpy;

    afterEach(() => {
        if (randomSpy) randomSpy.mockRestore();
    });

    it('neutral — rolls exactly qD dice and returns sum', () => {
        // All rolls = floor(0.5*20)+1 = 11
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 0, 0);
        expect(sD).toBe(22);
    });

    it('vantagem — keeps the highest qD dice from a larger pool', () => {
        // 2 base dice + 1 vantagem = 3 dice rolled
        // mock sequence: 0.9 → 19, 0.1 → 3, 0.5 → 11 → sorted desc [19,11,3] → keep top 2 → 19+11=30
        let calls = 0;
        const vals = [0.9, 0.1, 0.5];
        randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => vals[calls++] ?? 0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 1, 0);
        expect(sD).toBe(30);
    });

    it('desvantagem — keeps the lowest qD dice from a larger pool', () => {
        // 2 base dice + 1 desvantagem = 3 dice
        // mock: 0.9→19, 0.1→3, 0.5→11 → sorted desc [19,11,3] → keep bottom 2 → 11+3=14
        let calls = 0;
        const vals = [0.9, 0.1, 0.5];
        randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => vals[calls++] ?? 0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 0, 1);
        expect(sD).toBe(14);
    });

    it('includes prefix [VANTAGEM] in rolagemTexto', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { rolagemTexto } = rolarDadosComVantagem(1, 20, 1, 0);
        expect(rolagemTexto).toContain('VANTAGEM');
    });

    it('includes prefix [DESVANTAGEM] in rolagemTexto', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { rolagemTexto } = rolarDadosComVantagem(1, 20, 0, 1);
        expect(rolagemTexto).toContain('DESVANTAGEM');
    });

    it('no prefix in rolagemTexto for neutral roll', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { rolagemTexto } = rolarDadosComVantagem(1, 20, 0, 0);
        expect(rolagemTexto).not.toContain('VANTAGEM');
        expect(rolagemTexto).not.toContain('DESVANTAGEM');
    });

    it('net vantagem cancels desvantagem of equal magnitude', () => {
        // vantagens=2, desvantagens=2 → netVantagem=0, rolls exactly 2 dice
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 2, 2);
        expect(sD).toBe(22); // same as neutral
    });
});
