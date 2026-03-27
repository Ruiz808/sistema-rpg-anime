import { describe, it, expect, beforeEach } from 'vitest';
import useStore, { fichaPadrao } from '../stores/useStore.js';

// ==========================================
// cores persistence — fichaPadrao
// ==========================================
describe('fichaPadrao — cores', () => {
    it('includes cores as an own property', () => {
        expect(Object.prototype.hasOwnProperty.call(fichaPadrao, 'cores')).toBe(true);
    });

    it('defaults cores to an empty object', () => {
        expect(fichaPadrao.cores).toEqual({});
    });

    it('cores is a plain object, not an array', () => {
        expect(typeof fichaPadrao.cores).toBe('object');
        expect(Array.isArray(fichaPadrao.cores)).toBe(false);
    });
});

// ==========================================
// cores persistence — carregarDadosFicha
// ==========================================
describe('carregarDadosFicha — cores', () => {
    beforeEach(() => {
        useStore.getState().resetFicha();
    });

    it('loads cores when present in saved data', () => {
        const coresSalvas = { primaria: '#00ffff', secundaria: '#ff00ff' };
        useStore.getState().carregarDadosFicha({ cores: coresSalvas });
        expect(useStore.getState().minhaFicha.cores).toEqual(coresSalvas);
    });

    it('keeps default cores: {} when cores is absent from saved data', () => {
        useStore.getState().carregarDadosFicha({ forca: { base: 50000 } });
        expect(useStore.getState().minhaFicha.cores).toEqual({});
    });

    it('keeps default cores: {} when dados is an empty object', () => {
        useStore.getState().carregarDadosFicha({});
        expect(useStore.getState().minhaFicha.cores).toEqual({});
    });

    it('does not overwrite existing cores when cores is absent from dados', () => {
        // Pre-load a color, then reload with data that does NOT include cores.
        // The `if (dados.cores)` branch is skipped AND 'cores' is excluded from
        // the generic loop, so the in-store value must remain exactly as it was.
        useStore.getState().updateFicha(f => { f.cores = { primaria: '#ffffff' }; });
        useStore.getState().carregarDadosFicha({ ascensaoBase: 3 });
        expect(useStore.getState().minhaFicha.cores).toEqual({ primaria: '#ffffff' });
    });

    it('loads a single color key correctly', () => {
        useStore.getState().carregarDadosFicha({ cores: { acento: '#39ff14' } });
        expect(useStore.getState().minhaFicha.cores.acento).toBe('#39ff14');
    });

    it('loads multiple color keys correctly', () => {
        const coresSalvas = {
            primaria: '#00ffff',
            secundaria: '#ff00ff',
            terciaria: '#39ff14',
            fundo: '#0a0a0a',
        };
        useStore.getState().carregarDadosFicha({ cores: coresSalvas });
        const cores = useStore.getState().minhaFicha.cores;
        expect(cores.primaria).toBe('#00ffff');
        expect(cores.secundaria).toBe('#ff00ff');
        expect(cores.terciaria).toBe('#39ff14');
        expect(cores.fundo).toBe('#0a0a0a');
    });

    it('replaces previously loaded cores entirely with new data', () => {
        useStore.getState().carregarDadosFicha({ cores: { primaria: '#aaaaaa', velha: '#bbbbbb' } });
        useStore.getState().carregarDadosFicha({ cores: { primaria: '#cccccc' } });
        const cores = useStore.getState().minhaFicha.cores;
        expect(cores.primaria).toBe('#cccccc');
        expect(cores.velha).toBeUndefined();
    });

    it('does not process cores through the generic numeric-field correction loop', () => {
        // The generic loop would corrupt arbitrary string values by checking numeric fields.
        // Passing cores through it must be impossible — verified by correct value preservation.
        const coresSalvas = { primaria: '#00ffff', base: 'nao-e-numero' };
        useStore.getState().carregarDadosFicha({ cores: coresSalvas });
        const cores = useStore.getState().minhaFicha.cores;
        expect(cores.primaria).toBe('#00ffff');
        expect(cores.base).toBe('nao-e-numero');
    });

    it('does not affect other ficha fields when only cores is loaded', () => {
        useStore.getState().carregarDadosFicha({ cores: { primaria: '#ff0000' } });
        const ficha = useStore.getState().minhaFicha;
        expect(ficha.ascensaoBase).toBe(fichaPadrao.ascensaoBase);
        expect(ficha.vida.base).toBe(fichaPadrao.vida.base);
        expect(ficha.poderes).toEqual([]);
    });

    it('cores and other fields load together without interference', () => {
        useStore.getState().carregarDadosFicha({
            cores: { primaria: '#00ffff' },
            ascensaoBase: 7,
            bio: { raca: 'Namekiano' },
        });
        const ficha = useStore.getState().minhaFicha;
        expect(ficha.cores.primaria).toBe('#00ffff');
        expect(ficha.ascensaoBase).toBe(7);
        expect(ficha.bio.raca).toBe('Namekiano');
    });
});

// ==========================================
// cores persistence — updateFicha
// ==========================================
describe('updateFicha — cores', () => {
    beforeEach(() => {
        useStore.getState().resetFicha();
    });

    it('can set a color key via updateFicha', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#00ffff'; });
        expect(useStore.getState().minhaFicha.cores.primaria).toBe('#00ffff');
    });

    it('can set multiple color keys via updateFicha', () => {
        useStore.getState().updateFicha(f => {
            f.cores.primaria = '#00ffff';
            f.cores.secundaria = '#ff00ff';
        });
        const cores = useStore.getState().minhaFicha.cores;
        expect(cores.primaria).toBe('#00ffff');
        expect(cores.secundaria).toBe('#ff00ff');
    });

    it('persists cores value in subsequent getState calls', () => {
        useStore.getState().updateFicha(f => { f.cores.acento = '#39ff14'; });
        const first = useStore.getState().minhaFicha.cores.acento;
        const second = useStore.getState().minhaFicha.cores.acento;
        expect(first).toBe('#39ff14');
        expect(second).toBe('#39ff14');
    });

    it('can overwrite an existing color key', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#aaaaaa'; });
        useStore.getState().updateFicha(f => { f.cores.primaria = '#bbbbbb'; });
        expect(useStore.getState().minhaFicha.cores.primaria).toBe('#bbbbbb');
    });

    it('can delete a color key', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#00ffff'; });
        useStore.getState().updateFicha(f => { delete f.cores.primaria; });
        expect(useStore.getState().minhaFicha.cores.primaria).toBeUndefined();
    });

    it('does not mutate fichaPadrao.cores when updating store cores', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#mutated'; });
        expect(fichaPadrao.cores).toEqual({});
    });

    it('resetFicha clears cores back to empty object', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#00ffff'; });
        expect(useStore.getState().minhaFicha.cores.primaria).toBe('#00ffff');
        useStore.getState().resetFicha();
        expect(useStore.getState().minhaFicha.cores).toEqual({});
    });

    it('cores set by updateFicha survives an unrelated updateFicha call', () => {
        useStore.getState().updateFicha(f => { f.cores.primaria = '#00ffff'; });
        useStore.getState().updateFicha(f => { f.vida.base = 9999; });
        expect(useStore.getState().minhaFicha.cores.primaria).toBe('#00ffff');
    });
});
