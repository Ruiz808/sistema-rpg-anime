import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calcularDano, rolarDadosComVantagem } from '../core/engine.js';

// ==========================================
// Helpers
// ==========================================

function buildFicha({ poderes = [], inventario = [], ataquesElementais = [] } = {}) {
    return {
        forca: { base: 100, nome: 'Forca', mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mUnico: '1.0', reducaoCusto: 0, regeneracao: 0 },
        destreza: { base: 80, nome: 'Destreza', mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mUnico: '1.0', reducaoCusto: 0, regeneracao: 0 },
        mana: { base: 50, nome: 'Mana', atual: 1000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mUnico: '1.0', reducaoCusto: 0, regeneracao: 0 },
        aura: { base: 50, nome: 'Aura', atual: 1000, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mUnico: '1.0', reducaoCusto: 0, regeneracao: 0 },
        dano: { base: 0, mBase: 1.0, mGeral: 1.0, mFormas: 1.0, mAbsoluto: 1.0, mPotencial: 1.0, mUnico: '1.0', reducaoCusto: 0, regeneracao: 0 },
        poderes,
        inventario,
        ataquesElementais,
    };
}

function callCalcDano(overrides = {}) {
    return calcularDano({
        minhaFicha: buildFicha(),
        configArma: { statusUsados: ['forca'], energiaCombustao: 'mana', percEnergia: 0 },
        configHabilidades: [],
        itensEquipados: [],
        ...overrides,
    });
}

function makeArma({ id = 'arma1', nome = 'Espada', dadosQtd = 2, dadosFaces = 6, bonusTipo = null, bonusValor = '0', elemento = 'Neutro', equipado = true } = {}) {
    return { id, nome, tipo: 'arma', dadosQtd, dadosFaces, bonusTipo, bonusValor, elemento, equipado };
}

function makeHabConfig({ id = 'p1', nome = 'Golpe', dadosQtd = 3, dadosFaces = 8, custoPercentual = 0, armaVinculada = '', statusUsados = ['forca'], energiaCombustao = 'mana', efeitos = [] } = {}) {
    return { id, nome, dadosQtd, dadosFaces, custoPercentual, armaVinculada, statusUsados, energiaCombustao, efeitos };
}

// ==========================================
// New system tests
// ==========================================

describe('calcularDano — novo sistema', () => {
    let randomSpy;

    beforeEach(() => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('arma 2d6 only, no skills, no energy', () => {
        // d6 roll = floor(0.5*6)+1 = 4, 2d6 = 8
        // somaTermos = getMaximo(forca)=100 * uni=1 = 100
        // danoArma = floor(8 * 100) = 800
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(800);
        expect(result.letalidade).toBe(0);
        expect(result.drenos).toEqual([]);
    });

    it('arma 2d6 + habilidade vinculada 3d8', () => {
        // habVinc: 3d8, d8=floor(0.5*8)+1=5, soma=15, somaTermos=100, dano=floor(15*100)=1500
        // arma: 2d6=8, somaTermos=100+somaHabVinc(1500)=1600, danoArma=floor(8*1600)=12800
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const hab = makeHabConfig({ dadosQtd: 3, dadosFaces: 8, armaVinculada: 'arma1' });

        const result = callCalcDano({
            itensEquipados: [arma],
            configHabilidades: [hab],
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(12800);
    });

    it('arma 2d6 + habilidade livre 1d10', () => {
        // arma: 2d6=8, somaTermos=100, danoArma=800
        // habLivre: 1d10, d10=floor(0.5*10)+1=6, somaTermos=100, dano=floor(6*100)=600
        // total = 800+600 = 1400
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const hab = makeHabConfig({ id: 'p2', dadosQtd: 1, dadosFaces: 10, armaVinculada: '' });

        const result = callCalcDano({
            itensEquipados: [arma],
            configHabilidades: [hab],
        });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(1400);
    });

    it('no weapon, only free skill with dice', () => {
        // habLivre 2d6: 8, somaTermos=100, dano=800
        const hab = makeHabConfig({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ configHabilidades: [hab] });

        expect(result.erro).toBeUndefined();
        expect(result.dano).toBe(800);
    });

    it('weapon energy combustion', () => {
        // configArma.percEnergia=10, energiaCombustao=mana
        // mana max=50, combustao=floor(50*10/100)=5, dreno=5
        // somaTermos=100*1 + 5*1*1 = 105
        // arma 2d6=8, danoArma=floor(8*105)=840
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({
            itensEquipados: [arma],
            configArma: { statusUsados: ['forca'], energiaCombustao: 'mana', percEnergia: 10 },
        });

        expect(result.dano).toBe(840);
        expect(result.drenos).toEqual([{ key: 'mana', valor: 5 }]);
    });

    it('skill energy combustion (per-skill)', () => {
        // hab custoPercentual=20, energiaCombustao=mana
        // mana max=50, combustao=floor(50*20/100)=10
        // habLivre: 2d6=8, somaTermos=100 + 10=110, dano=floor(8*110)=880
        const hab = makeHabConfig({ dadosQtd: 2, dadosFaces: 6, custoPercentual: 20, energiaCombustao: 'mana' });
        const result = callCalcDano({ configHabilidades: [hab] });

        expect(result.dano).toBe(880);
        expect(result.drenos).toEqual([{ key: 'mana', valor: 10 }]);
    });

    it('per-skill status selection', () => {
        // hab uses destreza instead of forca
        // getMaximo(destreza) = 80
        // habLivre: 2d6=8, somaTermos=80, dano=floor(8*80)=640
        const hab = makeHabConfig({ dadosQtd: 2, dadosFaces: 6, statusUsados: ['destreza'] });
        const result = callCalcDano({ configHabilidades: [hab] });

        expect(result.dano).toBe(640);
    });

    it('multipliers from ficha.dano are applied', () => {
        // ficha.dano.mGeral=2 → totalGer=2
        // danoArma=800, multTotal includes totalGer=2 → total=1600
        const ficha = buildFicha();
        ficha.dano.mGeral = 2.0;
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });
        expect(result.dano).toBe(1600);
    });

    it('mPotencial from ficha.dano applied in global multTotal', () => {
        // ficha.dano.mPotencial=2 → totalPot=2
        // danoArma=800, multTotal includes totalPot=2 → total=1600
        const ficha = buildFicha();
        ficha.dano.mPotencial = 2.0;
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });
        expect(result.dano).toBe(1600);
    });

    it('mPotencial does NOT multiply energy combustion in sub-calc', () => {
        // With mPotencial=2, energy combustion in sub-calc should NOT be multiplied by pot
        // hab: 2d6=8, custoPerc=20, mana max=50, combustao=10
        // somaTermos = 100(forca)*1(uni) + 10(combustao)*1(uni) = 110 (NOT 10*1*2=20)
        // dano = floor(8*110) = 880
        // multTotal = 1*2*1*1*1*1*1 = 2 → total = floor(880*2) = 1760
        const ficha = buildFicha();
        ficha.dano.mPotencial = 2.0;
        const hab = makeHabConfig({ dadosQtd: 2, dadosFaces: 6, custoPercentual: 20, energiaCombustao: 'mana' });

        const result = callCalcDano({ minhaFicha: ficha, configHabilidades: [hab] });
        expect(result.dano).toBe(1760);
    });

    it('mUnico from ficha.dano applied per-term and global', () => {
        // ficha.dano.mUnico='2.0' → uniTotal=2
        // somaTermos = 100*2 = 200, rolagemArma=8
        // danoArma = floor(8*200)=1600
        // multTotal includes uniTotal=2 → total=floor(1600*2)=3200
        const ficha = buildFicha();
        ficha.dano.mUnico = '2.0';
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });
        expect(result.dano).toBe(3200);
    });

    it('result contains expected keys', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });

        expect(result).toHaveProperty('dano');
        expect(result).toHaveProperty('letalidade');
        expect(result).toHaveProperty('rolagem');
        expect(result).toHaveProperty('atributosUsados');
        expect(result).toHaveProperty('detalheConta');
        expect(result).toHaveProperty('drenos');
        expect(result).toHaveProperty('energiaDrenada');
    });

    it('weapon name appears in armaStr', () => {
        const arma = makeArma({ nome: 'Katana Lendaria', dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(result.armaStr).toContain('Katana Lendaria');
    });

    it('detalheConta contains MAQUINA DE CALCULO', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(result.detalheConta).toContain('MÁQUINA DE CÁLCULO');
    });

    it('letalidade reduces dano for 9+ digit totals', () => {
        const ficha = buildFicha();
        ficha.dano.mGeral = 1e6;
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });

        const result = callCalcDano({ itensEquipados: [arma], minhaFicha: ficha });
        expect(result.letalidade).toBeGreaterThan(0);
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

    it('no weapon no skills returns error', () => {
        const result = callCalcDano({ itensEquipados: [] });
        expect(result.erro).toBeDefined();
    });

    it('skill with dadosQtd=0 does not contribute damage', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const hab = makeHabConfig({ dadosQtd: 0 });
        const result = callCalcDano({ itensEquipados: [arma], configHabilidades: [hab] });
        // Only weapon contributes: 800
        expect(result.dano).toBe(800);
    });

    it('returns error when energy insufficient', () => {
        const ficha = buildFicha();
        ficha.mana.atual = 0;
        const hab = makeHabConfig({ dadosQtd: 2, dadosFaces: 6, custoPercentual: 50, energiaCombustao: 'mana' });

        const result = callCalcDano({ minhaFicha: ficha, configHabilidades: [hab] });
        expect(result.erro).toBeDefined();
        expect(result.erro).toContain('MANA');
    });

    it('iDanoBruto from item is added to somaDanos', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'dano_bruto', bonusValor: '200', nome: 'Anel' };
        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.dano).toBe(1000);
    });

    it('mult_dano from item multiplies final result', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'mult_dano', bonusValor: '2', nome: 'Colar' };
        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.dano).toBe(1600);
    });

    it('letalidade bonus from item adds to letal count', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const item = { tipo: 'acessorio', bonusTipo: 'letalidade', bonusValor: '5', nome: 'Garras' };
        const result = callCalcDano({ itensEquipados: [arma, item] });
        expect(result.letalidade).toBe(5);
    });

    it('linked skill is not treated as free skill', () => {
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const hab = makeHabConfig({ dadosQtd: 3, dadosFaces: 8, armaVinculada: 'arma1' });
        const result = callCalcDano({ itensEquipados: [arma], configHabilidades: [hab] });
        // Linked: dano=1500, somaTermos=100+1500=1600, danoArma=floor(8*1600)=12800
        expect(result.dano).toBe(12800);
    });

    it('skill linked to different weapon stays as free', () => {
        const arma = makeArma({ id: 'arma1', dadosQtd: 2, dadosFaces: 6 });
        const hab = makeHabConfig({ dadosQtd: 1, dadosFaces: 10, armaVinculada: 'arma2' });
        const result = callCalcDano({ itensEquipados: [arma], configHabilidades: [hab] });
        // danoArma=800, habLivre=600, total=1400
        expect(result.dano).toBe(1400);
    });

    it('zero dice result does not produce NaN', () => {
        randomSpy.mockReturnValue(0);
        const arma = makeArma({ dadosQtd: 2, dadosFaces: 6 });
        const result = callCalcDano({ itensEquipados: [arma] });
        expect(isNaN(result.dano)).toBe(false);
    });

    it('multiple skills drain different energies', () => {
        const hab1 = makeHabConfig({ id: 'p1', dadosQtd: 1, dadosFaces: 6, custoPercentual: 10, energiaCombustao: 'mana' });
        const hab2 = makeHabConfig({ id: 'p2', nome: 'Golpe2', dadosQtd: 1, dadosFaces: 6, custoPercentual: 10, energiaCombustao: 'aura' });
        const result = callCalcDano({ configHabilidades: [hab1, hab2] });

        expect(result.erro).toBeUndefined();
        expect(result.drenos.length).toBe(2);
        expect(result.drenos.find(d => d.key === 'mana')).toBeDefined();
        expect(result.drenos.find(d => d.key === 'aura')).toBeDefined();
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
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 0, 0);
        expect(sD).toBe(22);
    });

    it('vantagem — keeps the highest qD dice', () => {
        let calls = 0;
        const vals = [0.9, 0.1, 0.5];
        randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => vals[calls++] ?? 0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 1, 0);
        expect(sD).toBe(30);
    });

    it('desvantagem — keeps the lowest qD dice', () => {
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

    it('net vantagem cancels desvantagem', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const { sD } = rolarDadosComVantagem(2, 20, 2, 2);
        expect(sD).toBe(22);
    });
});
