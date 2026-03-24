import { describe, it, expect } from 'vitest';
import { getBuffs } from '../core/attributes.js';
import {
    ATRIBUTOS_AGRUPADOS,
    PROPRIEDADE_OPTIONS,
} from '../core/efeitos-constants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fichaBase(overrides = {}) {
    return {
        forca: { base: 100, mBase: '1.0', mGeral: '1.0', mFormas: '1.0', mAbsoluto: '1.0', mUnico: '1.0', atual: 100, nome: 'FORCA' },
        mana: { base: 100, mBase: '1.0', mGeral: '1.0', mFormas: '1.0', mAbsoluto: '1.0', mUnico: '1.0', atual: 100, nome: 'MANA' },
        inventario: [],
        poderes: [],
        passivas: [],
        ...overrides,
    };
}

function itemEquipado(efeitos = [], efeitosPassivos = []) {
    return { equipado: true, efeitos, efeitosPassivos };
}

function itemDesequipado(efeitos = [], efeitosPassivos = []) {
    return { equipado: false, efeitos, efeitosPassivos };
}

function efeito(propriedade, atributo, valor) {
    return { propriedade, atributo, valor: String(valor) };
}

// ---------------------------------------------------------------------------
// getBuffs — Inventario: itens equipados com efeitos
// ---------------------------------------------------------------------------

describe('getBuffs — inventario: efeitos em itens equipados', () => {
    it('acumula buff base de item equipado no stat correto', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('base', 'forca', 500)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(500);
    });

    it('acumula mbase de item equipado e seta hasBuff', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mbase', 'forca', 2.0)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mbase).toBe(2.0);
        expect(b._hasBuff.mbase).toBe(true);
    });

    it('acumula mgeral de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mgeral', 'forca', 3.0)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mgeral).toBe(3.0);
        expect(b._hasBuff.mgeral).toBe(true);
    });

    it('acumula mformas de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mformas', 'forca', 4.0)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mformas).toBe(4.0);
        expect(b._hasBuff.mformas).toBe(true);
    });

    it('acumula mabs de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mabs', 'forca', 5.0)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mabs).toBe(5.0);
        expect(b._hasBuff.mabs).toBe(true);
    });

    it('acumula munico de item equipado como array', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([
                    efeito('munico', 'forca', 2.0),
                    efeito('munico', 'forca', 3.0),
                ]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.munico).toEqual([2.0, 3.0]);
    });

    it('acumula reducaoCusto de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('reducaocusto', 'mana', 15)]),
            ],
        });
        const b = getBuffs(ficha, 'mana');
        expect(b.reducaoCusto).toBe(15);
    });

    it('acumula regeneracao de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('regeneracao', 'mana', 8)]),
            ],
        });
        const b = getBuffs(ficha, 'mana');
        expect(b.regeneracao).toBe(8);
    });

    it('combina efeitos de multiplos itens equipados no mesmo stat', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('base', 'forca', 200)]),
                itemEquipado([efeito('base', 'forca', 300)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(500);
    });
});

// ---------------------------------------------------------------------------
// getBuffs — Inventario: efeitosPassivos em itens equipados
// ---------------------------------------------------------------------------

describe('getBuffs — inventario: efeitosPassivos em itens equipados', () => {
    it('acumula buff base de efeitosPassivos de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([], [efeito('base', 'forca', 700)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(700);
    });

    it('acumula mbase de efeitosPassivos de item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([], [efeito('mbase', 'forca', 1.5)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mbase).toBe(1.5);
        expect(b._hasBuff.mbase).toBe(true);
    });

    it('acumula buffs de efeitos E efeitosPassivos do mesmo item equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado(
                    [efeito('base', 'forca', 100)],
                    [efeito('base', 'forca', 50)]
                ),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(150);
    });

    it('processa efeitosPassivos mesmo quando efeitos esta ausente no item', () => {
        const item = { equipado: true, efeitosPassivos: [efeito('base', 'forca', 400)] };
        const ficha = fichaBase({ inventario: [item] });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(400);
    });

    it('processa efeitos mesmo quando efeitosPassivos esta ausente no item', () => {
        const item = { equipado: true, efeitos: [efeito('base', 'forca', 300)] };
        const ficha = fichaBase({ inventario: [item] });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(300);
    });
});

// ---------------------------------------------------------------------------
// getBuffs — Inventario: itens NAO equipados nao afetam buffs
// ---------------------------------------------------------------------------

describe('getBuffs — inventario: itens nao equipados sao ignorados', () => {
    it('ignora efeitos de item nao equipado (equipado: false)', () => {
        const ficha = fichaBase({
            inventario: [
                itemDesequipado([efeito('base', 'forca', 9999)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(0);
    });

    it('ignora efeitosPassivos de item nao equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemDesequipado([], [efeito('mbase', 'forca', 99.0)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.mbase).toBe(1.0);
        expect(b._hasBuff.mbase).toBe(false);
    });

    it('ignora item sem propriedade equipado (undefined)', () => {
        const ficha = fichaBase({
            inventario: [
                { efeitos: [efeito('base', 'forca', 9999)] },
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(0);
    });

    it('aplica apenas itens equipados quando ha mistura equipado/nao-equipado', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('base', 'forca', 100)]),
                itemDesequipado([efeito('base', 'forca', 9000)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(100);
    });
});

// ---------------------------------------------------------------------------
// getBuffs — Inventario: compatibilidade com atributos especiais
// ---------------------------------------------------------------------------

describe('getBuffs — inventario: atributos especiais em itens equipados', () => {
    it('todos_status em item equipado afeta stats fisicos', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mbase', 'todos_status', 2.0)]),
            ],
        });
        expect(getBuffs(ficha, 'forca').mbase).toBe(2.0);
        expect(getBuffs(ficha, 'forca')._hasBuff.mbase).toBe(true);
    });

    it('todos_status em item equipado NAO afeta mana (energia)', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mbase', 'todos_status', 2.0)]),
            ],
        });
        const b = getBuffs(ficha, 'mana');
        expect(b.mbase).toBe(1.0);
        expect(b._hasBuff.mbase).toBe(false);
    });

    it('todas_energias em item equipado afeta mana', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mgeral', 'todas_energias', 3.0)]),
            ],
        });
        expect(getBuffs(ficha, 'mana').mgeral).toBe(3.0);
    });

    it('todas_energias em item equipado NAO afeta forca', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mgeral', 'todas_energias', 3.0)]),
            ],
        });
        expect(getBuffs(ficha, 'forca').mgeral).toBe(1.0);
    });

    it('geral em item equipado afeta todos os stats', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('mformas', 'geral', 5.0)]),
            ],
        });
        expect(getBuffs(ficha, 'forca').mformas).toBe(5.0);
        expect(getBuffs(ficha, 'mana').mformas).toBe(5.0);
    });

    it('dano em item equipado afeta apenas stat dano', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([efeito('base', 'dano', 250)]),
            ],
        });
        expect(getBuffs(ficha, 'dano').base).toBe(250);
        expect(getBuffs(ficha, 'forca').base).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getBuffs — Inventario: retrocompatibilidade (itens sem efeitos nao quebram)
// ---------------------------------------------------------------------------

describe('getBuffs — inventario: retrocompatibilidade — itens sem efeitos', () => {
    it('item equipado sem efeitos e sem efeitosPassivos nao lanca erro', () => {
        const ficha = fichaBase({
            inventario: [{ equipado: true }],
        });
        expect(() => getBuffs(ficha, 'forca')).not.toThrow();
    });

    it('item equipado com efeitos null nao lanca erro', () => {
        const ficha = fichaBase({
            inventario: [{ equipado: true, efeitos: null, efeitosPassivos: null }],
        });
        expect(() => getBuffs(ficha, 'forca')).not.toThrow();
        expect(getBuffs(ficha, 'forca').base).toBe(0);
    });

    it('item equipado com efeitos array vazio nao altera buffs', () => {
        const ficha = fichaBase({
            inventario: [{ equipado: true, efeitos: [], efeitosPassivos: [] }],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(0);
        expect(b.mbase).toBe(1.0);
    });

    it('item equipado com efeito null dentro do array nao lanca erro', () => {
        const ficha = fichaBase({
            inventario: [{ equipado: true, efeitos: [null, efeito('base', 'forca', 100)] }],
        });
        expect(() => getBuffs(ficha, 'forca')).not.toThrow();
        expect(getBuffs(ficha, 'forca').base).toBe(100);
    });

    it('item null dentro de inventario nao lanca erro', () => {
        const ficha = fichaBase({
            inventario: [null, itemEquipado([efeito('base', 'forca', 50)])],
        });
        expect(() => getBuffs(ficha, 'forca')).not.toThrow();
        expect(getBuffs(ficha, 'forca').base).toBe(50);
    });

    it('inventario vazio retorna defaults', () => {
        const ficha = fichaBase({ inventario: [] });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(0);
        expect(b.mbase).toBe(1.0);
        expect(b.mgeral).toBe(1.0);
        expect(b.mformas).toBe(1.0);
        expect(b.mabs).toBe(1.0);
    });

    it('efeito com valor nao-numerico em item equipado trata como 0 (base) ou 1 (mult)', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([{ propriedade: 'base', atributo: 'forca', valor: 'abc' }]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        // parseFloat('abc') => NaN; prop nao comeca com 'm' entao default = 0
        expect(b.base).toBe(0);
    });

    it('efeito de multiplicador com valor nao-numerico em item equipado trata como 1.0', () => {
        const ficha = fichaBase({
            inventario: [
                itemEquipado([{ propriedade: 'mbase', atributo: 'forca', valor: 'xyz' }]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        // parseFloat('xyz') => NaN; prop comeca com 'm' entao default = 1.0
        // hasBuff.mbase sera true (efeito chegou ate o bloco if(afeta))
        expect(b.mbase).toBe(1.0);
        expect(b._hasBuff.mbase).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// getBuffs — Inventario + Poderes coexistencia
// ---------------------------------------------------------------------------

describe('getBuffs — inventario e poderes coexistem corretamente', () => {
    it('acumula buffs de item equipado E poder ativo no mesmo stat', () => {
        const ficha = fichaBase({
            poderes: [{
                ativa: true,
                efeitos: [efeito('base', 'forca', 300)],
            }],
            inventario: [
                itemEquipado([efeito('base', 'forca', 200)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(500);
    });

    it('poder inativo + item equipado: so o item contribui', () => {
        const ficha = fichaBase({
            poderes: [{
                ativa: false,
                efeitos: [efeito('base', 'forca', 9000)],
            }],
            inventario: [
                itemEquipado([efeito('base', 'forca', 100)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(100);
    });

    it('item nao equipado + poder ativo: so o poder contribui', () => {
        const ficha = fichaBase({
            poderes: [{
                ativa: true,
                efeitos: [efeito('base', 'forca', 400)],
            }],
            inventario: [
                itemDesequipado([efeito('base', 'forca', 9000)]),
            ],
        });
        const b = getBuffs(ficha, 'forca');
        expect(b.base).toBe(400);
    });

    it('passivas sao ignoradas quando ignorarPassivas=true mesmo com item equipado', () => {
        const ficha = fichaBase({
            passivas: [{ efeitos: [efeito('base', 'forca', 999)] }],
            inventario: [
                itemEquipado([efeito('base', 'forca', 50)]),
            ],
        });
        const bComPassivas = getBuffs(ficha, 'forca', false);
        const bSemPassivas = getBuffs(ficha, 'forca', true);
        expect(bComPassivas.base).toBe(1049);
        expect(bSemPassivas.base).toBe(50);
    });
});

// ---------------------------------------------------------------------------
// efeitos-constants.js — Verificacao das exportacoes
// ---------------------------------------------------------------------------

describe('efeitos-constants: exportacoes corretas', () => {
    it('ATRIBUTOS_AGRUPADOS e um array nao vazio', () => {
        expect(Array.isArray(ATRIBUTOS_AGRUPADOS)).toBe(true);
        expect(ATRIBUTOS_AGRUPADOS.length).toBeGreaterThan(0);
    });

    it('cada grupo de ATRIBUTOS_AGRUPADOS tem label (string) e options (array)', () => {
        for (const grupo of ATRIBUTOS_AGRUPADOS) {
            expect(typeof grupo.label).toBe('string');
            expect(grupo.label.length).toBeGreaterThan(0);
            expect(Array.isArray(grupo.options)).toBe(true);
            expect(grupo.options.length).toBeGreaterThan(0);
        }
    });

    it('ATRIBUTOS_AGRUPADOS contem os grupos esperados', () => {
        const labels = ATRIBUTOS_AGRUPADOS.map(g => g.label);
        expect(labels).toContain('STATUS BASE');
        expect(labels).toContain('VITAIS & ENERGIAS');
        expect(labels).toContain('COMBATE');
        expect(labels).toContain('ESPECIAIS (GLOBAIS)');
    });

    it('grupo STATUS BASE contem os 8 atributos fisicos', () => {
        const grupo = ATRIBUTOS_AGRUPADOS.find(g => g.label === 'STATUS BASE');
        const esperados = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        for (const attr of esperados) {
            expect(grupo.options).toContain(attr);
        }
    });

    it('grupo VITAIS & ENERGIAS contem vida, mana, aura, chakra, corpo', () => {
        const grupo = ATRIBUTOS_AGRUPADOS.find(g => g.label === 'VITAIS & ENERGIAS');
        expect(grupo.options).toContain('vida');
        expect(grupo.options).toContain('mana');
        expect(grupo.options).toContain('aura');
        expect(grupo.options).toContain('chakra');
        expect(grupo.options).toContain('corpo');
    });

    it('grupo ESPECIAIS contem todos_status, todas_energias e geral', () => {
        const grupo = ATRIBUTOS_AGRUPADOS.find(g => g.label === 'ESPECIAIS (GLOBAIS)');
        expect(grupo.options).toContain('todos_status');
        expect(grupo.options).toContain('todas_energias');
        expect(grupo.options).toContain('geral');
    });

    it('PROPRIEDADE_OPTIONS e um array de strings nao vazio', () => {
        expect(Array.isArray(PROPRIEDADE_OPTIONS)).toBe(true);
        expect(PROPRIEDADE_OPTIONS.length).toBeGreaterThan(0);
        for (const opt of PROPRIEDADE_OPTIONS) {
            expect(typeof opt).toBe('string');
        }
    });

    it('PROPRIEDADE_OPTIONS contem as 8 propriedades esperadas', () => {
        const esperadas = ['base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'];
        for (const prop of esperadas) {
            expect(PROPRIEDADE_OPTIONS).toContain(prop);
        }
    });
});
