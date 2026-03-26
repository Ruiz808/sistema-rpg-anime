import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../stores/useStore.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
    useStore.getState().resetFicha();
}

/** Cria um poder base e retorna seu id */
function criarPoder(overrides = {}) {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    useStore.getState().updateFicha((ficha) => {
        if (!ficha.poderes) ficha.poderes = [];
        ficha.poderes.push({
            id,
            nome: 'Poder Teste',
            categoria: 'poder',
            ativa: false,
            efeitos: [],
            efeitosPassivos: [],
            formas: [],
            formaAtivaId: null,
            ...overrides
        });
    });
    return id;
}

/** Cria um item no inventario e retorna seu id */
function criarItem(overrides = {}) {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    useStore.getState().updateFicha((ficha) => {
        if (!ficha.inventario) ficha.inventario = [];
        ficha.inventario.push({
            id,
            nome: 'Item Teste',
            tipo: 'arma',
            equipado: false,
            formas: [],
            formaAtivaId: null,
            ...overrides
        });
    });
    return id;
}

/** Versao pura das funcoes extraidas de PoderesPanel */
function salvarFormaPoder(poderId, forma) {
    useStore.getState().updateFicha((ficha) => {
        const p = (ficha.poderes || []).find(po => po.id === poderId);
        if (!p) return;
        if (!p.formas) p.formas = [];
        const ix = p.formas.findIndex(f => f.id === forma.id);
        if (ix !== -1) {
            p.formas[ix] = forma;
        } else {
            p.formas.push(forma);
        }
    });
}

function deletarFormaPoder(poderId, formaId) {
    useStore.getState().updateFicha((ficha) => {
        const p = (ficha.poderes || []).find(po => po.id === poderId);
        if (!p) return;
        p.formas = (p.formas || []).filter(f => f.id !== formaId);
        if (p.formaAtivaId === formaId) p.formaAtivaId = null;
    });
}

function ativarFormaPoder(poderId, formaId) {
    useStore.getState().updateFicha((ficha) => {
        const p = (ficha.poderes || []).find(po => po.id === poderId);
        if (!p) return;
        p.formaAtivaId = formaId;
    });
}

/** Versao pura das funcoes extraidas de ArsenalPanel */
function salvarFormaItem(itemId, forma) {
    useStore.getState().updateFicha((ficha) => {
        const item = (ficha.inventario || []).find(i => i.id === itemId);
        if (!item) return;
        if (!item.formas) item.formas = [];
        const ix = item.formas.findIndex(f => f.id === forma.id);
        if (ix !== -1) {
            item.formas[ix] = forma;
        } else {
            item.formas.push(forma);
        }
    });
}

function deletarFormaItem(itemId, formaId) {
    useStore.getState().updateFicha((ficha) => {
        const item = (ficha.inventario || []).find(i => i.id === itemId);
        if (!item) return;
        item.formas = (item.formas || []).filter(f => f.id !== formaId);
        if (item.formaAtivaId === formaId) item.formaAtivaId = null;
    });
}

function ativarFormaItem(itemId, formaId) {
    useStore.getState().updateFicha((ficha) => {
        const item = (ficha.inventario || []).find(i => i.id === itemId);
        if (!item) return;
        item.formaAtivaId = formaId;
    });
}

/** Busca um poder pelo id no estado atual */
function getPoder(poderId) {
    return (useStore.getState().minhaFicha.poderes || []).find(p => p.id === poderId);
}

/** Busca um item pelo id no estado atual */
function getItem(itemId) {
    return (useStore.getState().minhaFicha.inventario || []).find(i => i.id === itemId);
}

// ---------------------------------------------------------------------------
// Testes: salvarFormaPoder (PoderesPanel)
// ---------------------------------------------------------------------------

describe('salvarFormaPoder — PoderesPanel', () => {
    beforeEach(resetStore);

    it('adiciona uma nova forma ao array formas do poder', () => {
        const poderId = criarPoder();
        const forma = { id: 101, nome: 'Bankai', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] };

        salvarFormaPoder(poderId, forma);

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(1);
        expect(poder.formas[0].id).toBe(101);
        expect(poder.formas[0].nome).toBe('Bankai');
    });

    it('adiciona multiplas formas ao mesmo poder', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 1, nome: 'Shikai', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaPoder(poderId, { id: 2, nome: 'Bankai', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(2);
        expect(poder.formas[0].nome).toBe('Shikai');
        expect(poder.formas[1].nome).toBe('Bankai');
    });

    it('atualiza uma forma existente in-place (nao duplica)', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 5, nome: 'Original', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaPoder(poderId, { id: 5, nome: 'Editado', acumulaFormaBase: false, efeitos: [{ nome: 'X' }], efeitosPassivos: [] });

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(1);
        expect(poder.formas[0].nome).toBe('Editado');
        expect(poder.formas[0].acumulaFormaBase).toBe(false);
        expect(poder.formas[0].efeitos).toHaveLength(1);
    });

    it('nao faz nada quando poderId nao existe no estado', () => {
        const poderId = criarPoder();
        salvarFormaPoder(99999, { id: 1, nome: 'Fantasma', efeitos: [], efeitosPassivos: [] });

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(0);
    });

    it('inicializa formas vazio quando poder nao tem campo formas', () => {
        const poderId = criarPoder({ formas: undefined });
        const forma = { id: 10, nome: 'Nova', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] };
        salvarFormaPoder(poderId, forma);

        const poder = getPoder(poderId);
        expect(Array.isArray(poder.formas)).toBe(true);
        expect(poder.formas).toHaveLength(1);
    });

    it('preserva efeitos e efeitosPassivos da forma ao salvar', () => {
        const poderId = criarPoder();
        const efeitos = [{ nome: 'Buff', atributo: 'forca', propriedade: 'base', valor: '100' }];
        const efeitosPassivos = [{ nome: 'Passivo', atributo: 'destreza', propriedade: 'mbase', valor: '2' }];
        const forma = { id: 20, nome: 'Com Efeitos', acumulaFormaBase: true, efeitos, efeitosPassivos };

        salvarFormaPoder(poderId, forma);

        const poder = getPoder(poderId);
        expect(poder.formas[0].efeitos).toEqual(efeitos);
        expect(poder.formas[0].efeitosPassivos).toEqual(efeitosPassivos);
    });
});

// ---------------------------------------------------------------------------
// Testes: deletarFormaPoder (PoderesPanel)
// ---------------------------------------------------------------------------

describe('deletarFormaPoder — PoderesPanel', () => {
    beforeEach(resetStore);

    it('remove uma forma existente do array formas', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 1, nome: 'Shikai', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaPoder(poderId, { id: 2, nome: 'Bankai', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        deletarFormaPoder(poderId, 1);

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(1);
        expect(poder.formas[0].id).toBe(2);
    });

    it('limpa formaAtivaId quando a forma deletada era a ativa', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 3, nome: 'Forma Ativa', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        ativarFormaPoder(poderId, 3);
        expect(getPoder(poderId).formaAtivaId).toBe(3);

        deletarFormaPoder(poderId, 3);

        const poder = getPoder(poderId);
        expect(poder.formas).toHaveLength(0);
        expect(poder.formaAtivaId).toBeNull();
    });

    it('nao limpa formaAtivaId quando outra forma e deletada', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 1, nome: 'Ativa', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaPoder(poderId, { id: 2, nome: 'Outra', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });
        ativarFormaPoder(poderId, 1);

        deletarFormaPoder(poderId, 2);

        const poder = getPoder(poderId);
        expect(poder.formaAtivaId).toBe(1);
        expect(poder.formas).toHaveLength(1);
    });

    it('nao faz nada quando formaId nao existe no poder', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 1, nome: 'Unica', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        deletarFormaPoder(poderId, 999);

        expect(getPoder(poderId).formas).toHaveLength(1);
    });

    it('nao faz nada quando poderId nao existe', () => {
        const poderId = criarPoder();
        deletarFormaPoder(99999, 1);
        expect(getPoder(poderId).formas).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Testes: ativarFormaPoder (PoderesPanel)
// ---------------------------------------------------------------------------

describe('ativarFormaPoder — PoderesPanel', () => {
    beforeEach(resetStore);

    it('define formaAtivaId com o id da forma', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 7, nome: 'Modo Beserk', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        ativarFormaPoder(poderId, 7);

        expect(getPoder(poderId).formaAtivaId).toBe(7);
    });

    it('troca formaAtivaId quando outra forma e ativada', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 1, nome: 'Shikai', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaPoder(poderId, { id: 2, nome: 'Bankai', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });
        ativarFormaPoder(poderId, 1);
        expect(getPoder(poderId).formaAtivaId).toBe(1);

        ativarFormaPoder(poderId, 2);

        expect(getPoder(poderId).formaAtivaId).toBe(2);
    });

    it('aceita null para desativar a forma ativa', () => {
        const poderId = criarPoder();
        salvarFormaPoder(poderId, { id: 5, nome: 'Forma', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        ativarFormaPoder(poderId, 5);
        expect(getPoder(poderId).formaAtivaId).toBe(5);

        ativarFormaPoder(poderId, null);

        expect(getPoder(poderId).formaAtivaId).toBeNull();
    });

    it('nao faz nada quando poderId nao existe', () => {
        const poderId = criarPoder();
        ativarFormaPoder(99999, 1);
        expect(getPoder(poderId).formaAtivaId).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Testes: salvarFormaItem (ArsenalPanel)
// ---------------------------------------------------------------------------

describe('salvarFormaItem — ArsenalPanel', () => {
    beforeEach(resetStore);

    it('adiciona uma nova forma ao array formas do item', () => {
        const itemId = criarItem();
        const forma = { id: 201, nome: 'Modo Corte', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] };

        salvarFormaItem(itemId, forma);

        const item = getItem(itemId);
        expect(item.formas).toHaveLength(1);
        expect(item.formas[0].id).toBe(201);
        expect(item.formas[0].nome).toBe('Modo Corte');
    });

    it('adiciona multiplas formas ao mesmo item', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 1, nome: 'Normal', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 2, nome: 'Ativado', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        const item = getItem(itemId);
        expect(item.formas).toHaveLength(2);
    });

    it('atualiza uma forma existente in-place (nao duplica)', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 10, nome: 'Versao 1', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 10, nome: 'Versao 2', acumulaFormaBase: false, efeitos: [{ nome: 'Buff' }], efeitosPassivos: [] });

        const item = getItem(itemId);
        expect(item.formas).toHaveLength(1);
        expect(item.formas[0].nome).toBe('Versao 2');
        expect(item.formas[0].efeitos).toHaveLength(1);
    });

    it('nao faz nada quando itemId nao existe', () => {
        const itemId = criarItem();
        salvarFormaItem(99999, { id: 1, nome: 'Fantasma', efeitos: [], efeitosPassivos: [] });

        expect(getItem(itemId).formas).toHaveLength(0);
    });

    it('inicializa formas vazio quando item nao tem campo formas', () => {
        const itemId = criarItem({ formas: undefined });
        salvarFormaItem(itemId, { id: 30, nome: 'Nova', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        const item = getItem(itemId);
        expect(Array.isArray(item.formas)).toBe(true);
        expect(item.formas).toHaveLength(1);
    });

    it('preserva efeitos e efeitosPassivos da forma ao salvar', () => {
        const itemId = criarItem();
        const efeitos = [{ nome: 'Corte', atributo: 'forca', propriedade: 'mbase', valor: '1.5' }];
        const efeitosPassivos = [{ nome: 'Aura', atributo: 'aura', propriedade: 'base', valor: '500' }];
        salvarFormaItem(itemId, { id: 40, nome: 'Forma Com Efeitos', acumulaFormaBase: true, efeitos, efeitosPassivos });

        const item = getItem(itemId);
        expect(item.formas[0].efeitos).toEqual(efeitos);
        expect(item.formas[0].efeitosPassivos).toEqual(efeitosPassivos);
    });
});

// ---------------------------------------------------------------------------
// Testes: deletarFormaItem (ArsenalPanel)
// ---------------------------------------------------------------------------

describe('deletarFormaItem — ArsenalPanel', () => {
    beforeEach(resetStore);

    it('remove uma forma existente do array formas do item', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 1, nome: 'Normal', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 2, nome: 'Aprimorado', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        deletarFormaItem(itemId, 1);

        const item = getItem(itemId);
        expect(item.formas).toHaveLength(1);
        expect(item.formas[0].id).toBe(2);
    });

    it('limpa formaAtivaId quando a forma deletada era a ativa', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 8, nome: 'Espada Ativa', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        ativarFormaItem(itemId, 8);
        expect(getItem(itemId).formaAtivaId).toBe(8);

        deletarFormaItem(itemId, 8);

        const item = getItem(itemId);
        expect(item.formas).toHaveLength(0);
        expect(item.formaAtivaId).toBeNull();
    });

    it('nao limpa formaAtivaId quando outra forma e deletada', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 1, nome: 'Ativa', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 2, nome: 'Outra', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });
        ativarFormaItem(itemId, 1);

        deletarFormaItem(itemId, 2);

        expect(getItem(itemId).formaAtivaId).toBe(1);
        expect(getItem(itemId).formas).toHaveLength(1);
    });

    it('nao faz nada quando formaId nao existe no item', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 1, nome: 'Unica', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        deletarFormaItem(itemId, 999);

        expect(getItem(itemId).formas).toHaveLength(1);
    });

    it('nao faz nada quando itemId nao existe', () => {
        const itemId = criarItem();
        deletarFormaItem(99999, 1);
        expect(getItem(itemId).formas).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Testes: ativarFormaItem (ArsenalPanel)
// ---------------------------------------------------------------------------

describe('ativarFormaItem — ArsenalPanel', () => {
    beforeEach(resetStore);

    it('define formaAtivaId com o id da forma do item', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 15, nome: 'Modo Lendario', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });

        ativarFormaItem(itemId, 15);

        expect(getItem(itemId).formaAtivaId).toBe(15);
    });

    it('troca formaAtivaId quando outra forma do item e ativada', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 1, nome: 'Normal', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 2, nome: 'Aprimorado', acumulaFormaBase: false, efeitos: [], efeitosPassivos: [] });
        ativarFormaItem(itemId, 1);
        expect(getItem(itemId).formaAtivaId).toBe(1);

        ativarFormaItem(itemId, 2);

        expect(getItem(itemId).formaAtivaId).toBe(2);
    });

    it('aceita null para desativar a forma ativa do item', () => {
        const itemId = criarItem();
        salvarFormaItem(itemId, { id: 9, nome: 'Forma', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        ativarFormaItem(itemId, 9);
        expect(getItem(itemId).formaAtivaId).toBe(9);

        ativarFormaItem(itemId, null);

        expect(getItem(itemId).formaAtivaId).toBeNull();
    });

    it('nao faz nada quando itemId nao existe', () => {
        const itemId = criarItem();
        ativarFormaItem(99999, 1);
        expect(getItem(itemId).formaAtivaId).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Testes: isolamento entre poderes e itens distintos
// ---------------------------------------------------------------------------

describe('isolamento — operacoes em entidades distintas nao interferem', () => {
    beforeEach(resetStore);

    it('salvar forma em um poder nao afeta outro poder', () => {
        const id1 = criarPoder();
        const id2 = criarPoder();
        salvarFormaPoder(id1, { id: 1, nome: 'SoPoder1', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        expect(getPoder(id1).formas).toHaveLength(1);
        expect(getPoder(id2).formas).toHaveLength(0);
    });

    it('deletar forma de um item nao afeta outro item', () => {
        const id1 = criarItem();
        const id2 = criarItem();
        salvarFormaItem(id1, { id: 1, nome: 'DoItem1', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(id2, { id: 2, nome: 'DoItem2', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        deletarFormaItem(id1, 1);

        expect(getItem(id1).formas).toHaveLength(0);
        expect(getItem(id2).formas).toHaveLength(1);
    });

    it('ativar forma em poder nao altera formaAtivaId de nenhum item', () => {
        const poderId = criarPoder();
        const itemId = criarItem();
        salvarFormaPoder(poderId, { id: 1, nome: 'FP', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });
        salvarFormaItem(itemId, { id: 1, nome: 'FI', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] });

        ativarFormaPoder(poderId, 1);

        expect(getPoder(poderId).formaAtivaId).toBe(1);
        expect(getItem(itemId).formaAtivaId).toBeNull();
    });
});
