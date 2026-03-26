import { describe, it, expect } from 'vitest';
import { resolverEfeitosEntidade } from '../core/efeitos-resolver.js';

describe('resolverEfeitosEntidade', () => {

    // --- Entidade nula/undefined ---
    it('retorna arrays vazios para entidade null', () => {
        const r = resolverEfeitosEntidade(null);
        expect(r.efeitos).toEqual([]);
        expect(r.efeitosPassivos).toEqual([]);
    });

    it('retorna arrays vazios para entidade undefined', () => {
        const r = resolverEfeitosEntidade(undefined);
        expect(r.efeitos).toEqual([]);
        expect(r.efeitosPassivos).toEqual([]);
    });

    // --- Entidade legada sem formas ---
    it('retorna efeitos base quando nao tem formas', () => {
        const ent = {
            efeitos: [{ nome: 'A', atributo: 'forca', propriedade: 'base', valor: '5' }],
            efeitosPassivos: [{ nome: 'B', atributo: 'vida', propriedade: 'mbase', valor: '1.5' }]
        };
        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(ent.efeitos);
        expect(r.efeitosPassivos).toEqual(ent.efeitosPassivos);
    });

    it('retorna efeitos base quando formas e array vazio', () => {
        const ent = { efeitos: [{ atributo: 'forca', propriedade: 'base', valor: '5' }], efeitosPassivos: [], formas: [], formaAtivaId: null };
        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(ent.efeitos);
    });

    it('retorna efeitos base quando formaAtivaId e null', () => {
        const ent = {
            efeitos: [{ atributo: 'forca', propriedade: 'base', valor: '5' }],
            efeitosPassivos: [],
            formas: [{ id: 1, nome: 'F1', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] }],
            formaAtivaId: null
        };
        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(ent.efeitos);
    });

    // --- formaAtivaId invalido ---
    it('fallback para base quando formaAtivaId aponta para forma inexistente', () => {
        const ent = {
            efeitos: [{ atributo: 'forca', propriedade: 'base', valor: '5' }],
            efeitosPassivos: [{ atributo: 'vida', propriedade: 'base', valor: '10' }],
            formas: [{ id: 1, nome: 'F1', acumulaFormaBase: true, efeitos: [], efeitosPassivos: [] }],
            formaAtivaId: 999
        };
        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(ent.efeitos);
        expect(r.efeitosPassivos).toEqual(ent.efeitosPassivos);
    });

    // --- Forma ativa COM acumulacao ---
    it('acumula base + forma quando acumulaFormaBase=true', () => {
        const baseEf = [{ nome: 'Base', atributo: 'forca', propriedade: 'base', valor: '5' }];
        const basePass = [{ nome: 'BaseP', atributo: 'vida', propriedade: 'base', valor: '10' }];
        const formaEf = [{ nome: 'Forma', atributo: 'destreza', propriedade: 'mbase', valor: '2' }];
        const formaPass = [{ nome: 'FormaP', atributo: 'mana', propriedade: 'base', valor: '20' }];

        const ent = {
            efeitos: baseEf,
            efeitosPassivos: basePass,
            formas: [{ id: 1, nome: 'Bankai', acumulaFormaBase: true, efeitos: formaEf, efeitosPassivos: formaPass }],
            formaAtivaId: 1
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual([...baseEf, ...formaEf]);
        expect(r.efeitosPassivos).toEqual([...basePass, ...formaPass]);
    });

    // --- Forma ativa SEM acumulacao ---
    it('substitui base pela forma quando acumulaFormaBase=false', () => {
        const baseEf = [{ nome: 'Base', atributo: 'forca', propriedade: 'base', valor: '5' }];
        const basePass = [{ nome: 'BaseP', atributo: 'vida', propriedade: 'base', valor: '10' }];
        const formaEf = [{ nome: 'Forma', atributo: 'destreza', propriedade: 'mbase', valor: '2' }];
        const formaPass = [{ nome: 'FormaP', atributo: 'mana', propriedade: 'base', valor: '20' }];

        const ent = {
            efeitos: baseEf,
            efeitosPassivos: basePass,
            formas: [{ id: 2, nome: 'Shikai', acumulaFormaBase: false, efeitos: formaEf, efeitosPassivos: formaPass }],
            formaAtivaId: 2
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(formaEf);
        expect(r.efeitosPassivos).toEqual(formaPass);
    });

    // --- Forma com efeitos vazios ---
    it('forma ativa sem efeitos retorna arrays vazios (sem acumular)', () => {
        const baseEf = [{ atributo: 'forca', propriedade: 'base', valor: '5' }];
        const ent = {
            efeitos: baseEf,
            efeitosPassivos: [],
            formas: [{ id: 3, nome: 'Vazia', acumulaFormaBase: false }],
            formaAtivaId: 3
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual([]);
        expect(r.efeitosPassivos).toEqual([]);
    });

    it('forma ativa sem efeitos acumula apenas base', () => {
        const baseEf = [{ atributo: 'forca', propriedade: 'base', valor: '5' }];
        const ent = {
            efeitos: baseEf,
            efeitosPassivos: [],
            formas: [{ id: 3, nome: 'Vazia', acumulaFormaBase: true }],
            formaAtivaId: 3
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(baseEf);
        expect(r.efeitosPassivos).toEqual([]);
    });

    // --- Multiplas formas, so a ativa importa ---
    it('seleciona apenas a forma com id correspondente', () => {
        const f1Ef = [{ nome: 'F1', atributo: 'forca', propriedade: 'base', valor: '100' }];
        const f2Ef = [{ nome: 'F2', atributo: 'vida', propriedade: 'base', valor: '200' }];

        const ent = {
            efeitos: [],
            efeitosPassivos: [],
            formas: [
                { id: 1, nome: 'Forma1', acumulaFormaBase: false, efeitos: f1Ef, efeitosPassivos: [] },
                { id: 2, nome: 'Forma2', acumulaFormaBase: false, efeitos: f2Ef, efeitosPassivos: [] }
            ],
            formaAtivaId: 2
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(f2Ef);
    });

    // --- Entidade sem efeitos base mas com forma ---
    it('funciona quando entidade nao tem efeitos base', () => {
        const formaEf = [{ nome: 'X', atributo: 'dano', propriedade: 'mbase', valor: '3' }];
        const ent = {
            formas: [{ id: 1, nome: 'F', acumulaFormaBase: true, efeitos: formaEf, efeitosPassivos: [] }],
            formaAtivaId: 1
        };

        const r = resolverEfeitosEntidade(ent);
        expect(r.efeitos).toEqual(formaEf);
        expect(r.efeitosPassivos).toEqual([]);
    });
});
