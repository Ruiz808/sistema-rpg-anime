import { describe, it, expect, beforeEach } from 'vitest';
import useStore, { sanitizarNome, fichaPadrao } from '../stores/useStore.js';

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ==========================================
// sanitizarNome
// ==========================================
describe('sanitizarNome', () => {
    it('replaces forbidden Firebase characters with underscore', () => {
        expect(sanitizarNome('test.name')).toBe('test_name');
        expect(sanitizarNome('test#name')).toBe('test_name');
        expect(sanitizarNome('test$name')).toBe('test_name');
        expect(sanitizarNome('test[name]')).toBe('test_name_');
        expect(sanitizarNome('test/name')).toBe('test_name');
    });

    it('replaces multiple forbidden chars', () => {
        expect(sanitizarNome('a.b#c$d[e]f/g')).toBe('a_b_c_d_e_f_g');
    });

    it('trims whitespace', () => {
        expect(sanitizarNome('  hello  ')).toBe('hello');
    });

    it('returns empty string for falsy input', () => {
        expect(sanitizarNome(null)).toBe('');
        expect(sanitizarNome(undefined)).toBe('');
        expect(sanitizarNome('')).toBe('');
        expect(sanitizarNome(0)).toBe('');
    });

    it('keeps valid characters untouched', () => {
        expect(sanitizarNome('NomeNormal123')).toBe('NomeNormal123');
        expect(sanitizarNome('nome-com-hifen')).toBe('nome-com-hifen');
        expect(sanitizarNome('nome_com_under')).toBe('nome_com_under');
    });

    it('handles strings with only forbidden characters', () => {
        expect(sanitizarNome('..##$$')).toBe('______');
    });
});

// ==========================================
// fichaPadrao
// ==========================================
describe('fichaPadrao', () => {
    it('has ascensaoBase defaulting to 1', () => {
        expect(fichaPadrao.ascensaoBase).toBe(1);
    });

    it('has empty arrays for poderes, inventario, ataquesElementais, passivas', () => {
        expect(fichaPadrao.poderes).toEqual([]);
        expect(fichaPadrao.inventario).toEqual([]);
        expect(fichaPadrao.ataquesElementais).toEqual([]);
        expect(fichaPadrao.passivas).toEqual([]);
    });

    it('has default vida base of 100,000,000', () => {
        expect(fichaPadrao.vida.base).toBe(100000000);
        expect(fichaPadrao.vida.atual).toBe(100000000);
    });

    it('has default physical stats base of 100,000', () => {
        const fisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
        fisicos.forEach(s => {
            expect(fichaPadrao[s].base).toBe(100000);
            expect(fichaPadrao[s].mBase).toBe(1.0);
            expect(fichaPadrao[s].mGeral).toBe(1.0);
        });
    });

    it('has default energy stats base of 100,000,000', () => {
        const energias = ['mana', 'aura', 'chakra', 'corpo'];
        energias.forEach(s => {
            expect(fichaPadrao[s].base).toBe(100000000);
            expect(fichaPadrao[s].atual).toBe(100000000);
        });
    });

    it('has default ataqueConfig', () => {
        expect(fichaPadrao.ataqueConfig.armaStatusUsados).toEqual(['forca']);
        expect(fichaPadrao.ataqueConfig.armaEnergiaCombustao).toBe('mana');
        expect(fichaPadrao.ataqueConfig.armaPercEnergia).toBe(0);
    });

    it('has default dano stat', () => {
        expect(fichaPadrao.dano.mBase).toBe(1.0);
        expect(fichaPadrao.dano.mGeral).toBe(1.0);
        expect(fichaPadrao.dano.mPotencial).toBe(1.0);
    });

    it('has default divisores all set to 1', () => {
        Object.values(fichaPadrao.divisores).forEach(v => expect(v).toBe(1));
    });

    it('has default bio fields as empty strings', () => {
        Object.values(fichaPadrao.bio).forEach(v => expect(v).toBe(''));
    });
});

// ==========================================
// Zustand store actions
// ==========================================
describe('useStore actions', () => {
    beforeEach(() => {
        // Reset store state before each test
        useStore.getState().resetFicha();
        useStore.getState().setMeuNome('');
        useStore.setState({ feedCombate: [], isMestre: false, abaAtiva: 'aba-status' });
    });

    describe('setMeuNome', () => {
        it('sets the name in state', () => {
            useStore.getState().setMeuNome('Goku');
            expect(useStore.getState().meuNome).toBe('Goku');
        });

        it('can set empty name', () => {
            useStore.getState().setMeuNome('Goku');
            useStore.getState().setMeuNome('');
            expect(useStore.getState().meuNome).toBe('');
        });
    });

    describe('resetFicha', () => {
        it('resets ficha to default values', () => {
            useStore.getState().updateFicha(f => { f.forca.base = 999; });
            expect(useStore.getState().minhaFicha.forca.base).toBe(999);

            useStore.getState().resetFicha();
            expect(useStore.getState().minhaFicha.forca.base).toBe(100000);
        });

        it('produces a new object (not shared reference with fichaPadrao)', () => {
            useStore.getState().resetFicha();
            // Immer freezes state, so we verify independence by checking
            // that mutating via updateFicha doesn't affect fichaPadrao
            useStore.getState().updateFicha(f => { f.forca.base = 1; });
            expect(useStore.getState().minhaFicha.forca.base).toBe(1);
            expect(fichaPadrao.forca.base).toBe(100000);
        });
    });

    describe('updateFicha', () => {
        it('mutates ficha via immer callback', () => {
            useStore.getState().updateFicha(f => {
                f.vida.base = 500;
                f.vida.atual = 500;
            });
            expect(useStore.getState().minhaFicha.vida.base).toBe(500);
            expect(useStore.getState().minhaFicha.vida.atual).toBe(500);
        });

        it('can add poderes', () => {
            useStore.getState().updateFicha(f => {
                f.poderes.push({ nome: 'Super Saiyan', ativa: true, efeitos: [] });
            });
            expect(useStore.getState().minhaFicha.poderes).toHaveLength(1);
            expect(useStore.getState().minhaFicha.poderes[0].nome).toBe('Super Saiyan');
        });
    });

    describe('addFeedEntry', () => {
        it('appends entry to feedCombate', () => {
            useStore.getState().addFeedEntry({ tipo: 'dano', valor: 1000 });
            useStore.getState().addFeedEntry({ tipo: 'cura', valor: 500 });
            expect(useStore.getState().feedCombate).toHaveLength(2);
            expect(useStore.getState().feedCombate[0].tipo).toBe('dano');
            expect(useStore.getState().feedCombate[1].tipo).toBe('cura');
        });
    });

    describe('carregarDadosFicha', () => {
        it('does nothing for null dados', () => {
            const before = deepClone(useStore.getState().minhaFicha);
            useStore.getState().carregarDadosFicha(null);
            expect(useStore.getState().minhaFicha).toEqual(before);
        });

        it('loads ascensaoBase', () => {
            useStore.getState().carregarDadosFicha({ ascensaoBase: 5 });
            expect(useStore.getState().minhaFicha.ascensaoBase).toBe(5);
        });

        it('loads poderes array', () => {
            const poderes = [{ nome: 'Bankai', ativa: false, efeitos: [] }];
            useStore.getState().carregarDadosFicha({ poderes });
            expect(useStore.getState().minhaFicha.poderes).toEqual(poderes);
        });

        it('defaults poderes to empty array when not present', () => {
            useStore.getState().updateFicha(f => { f.poderes.push({ nome: 'x' }); });
            useStore.getState().carregarDadosFicha({});
            expect(useStore.getState().minhaFicha.poderes).toEqual([]);
        });

        it('merges divisores with defaults', () => {
            useStore.getState().carregarDadosFicha({ divisores: { vida: 10 } });
            expect(useStore.getState().minhaFicha.divisores.vida).toBe(10);
            expect(useStore.getState().minhaFicha.divisores.status).toBe(1); // from default
        });

        it('loads stat objects with defaults for missing numeric fields', () => {
            useStore.getState().carregarDadosFicha({
                forca: { base: 50000 }
            });
            const f = useStore.getState().minhaFicha.forca;
            expect(f.base).toBe(50000);
            expect(f.mBase).toBe(1.0); // filled from fichaPadrao
            expect(f.mGeral).toBe(1.0);
        });

        it('loads inventario', () => {
            const inv = [{ nome: 'Espada', tipo: 'arma' }];
            useStore.getState().carregarDadosFicha({ inventario: inv });
            expect(useStore.getState().minhaFicha.inventario).toEqual(inv);
        });

        it('loads bio with defaults', () => {
            useStore.getState().carregarDadosFicha({ bio: { raca: 'Saiyan' } });
            expect(useStore.getState().minhaFicha.bio.raca).toBe('Saiyan');
            expect(useStore.getState().minhaFicha.bio.classe).toBe(''); // default
        });

        it('loads iniciativa', () => {
            useStore.getState().carregarDadosFicha({ iniciativa: 15 });
            expect(useStore.getState().minhaFicha.iniciativa).toBe(15);
        });

        it('loads avatar or defaults to empty', () => {
            useStore.getState().carregarDadosFicha({});
            expect(useStore.getState().minhaFicha.avatar).toEqual({ base: '' });
        });

        it('loads ataqueConfig with defaults', () => {
            useStore.getState().carregarDadosFicha({ ataqueConfig: { armaPercEnergia: 15 } });
            expect(useStore.getState().minhaFicha.ataqueConfig.armaPercEnergia).toBe(15);
            expect(useStore.getState().minhaFicha.ataqueConfig.armaStatusUsados).toEqual(['forca']); // default
        });
    });

    describe('other setters', () => {
        it('setIsMestre', () => {
            useStore.getState().setIsMestre(true);
            expect(useStore.getState().isMestre).toBe(true);
        });

        it('setAbaAtiva', () => {
            useStore.getState().setAbaAtiva('aba-poderes');
            expect(useStore.getState().abaAtiva).toBe('aba-poderes');
        });

        it('setPersonagens', () => {
            const p = { goku: {}, vegeta: {} };
            useStore.getState().setPersonagens(p);
            expect(useStore.getState().personagens).toEqual(p);
        });

        it('setPoderEditandoId', () => {
            useStore.getState().setPoderEditandoId('abc123');
            expect(useStore.getState().poderEditandoId).toBe('abc123');
        });
    });
});
