import { describe, it, expect } from 'vitest';
import { TEMAS_PADRAO, obterTema, listarTemasIds, validarTemaId } from '../core/temas.js';

// ==========================================
// TEMAS_PADRAO structure tests
// ==========================================
describe('TEMAS_PADRAO', () => {
  it('exports TEMAS_PADRAO as an object', () => {
    expect(TEMAS_PADRAO).toBeDefined();
    expect(typeof TEMAS_PADRAO).toBe('object');
  });

  it('contains exactly 6 default themes', () => {
    expect(Object.keys(TEMAS_PADRAO)).toHaveLength(6);
  });

  it('contains all expected theme IDs', () => {
    const expectedIds = ['neon-ciano', 'sangue-crimsono', 'ouro-imperial', 'nexo-violeta', 'verde-mata', 'abismo-branco'];
    const actualIds = Object.keys(TEMAS_PADRAO);
    expectedIds.forEach(id => {
      expect(actualIds).toContain(id);
    });
  });

  describe('Theme structure - each theme', () => {
    const temasIds = Object.keys(TEMAS_PADRAO);

    temasIds.forEach(id => {
      describe(`${id}`, () => {
        const tema = TEMAS_PADRAO[id];

        it('has required properties', () => {
          expect(tema).toHaveProperty('id');
          expect(tema).toHaveProperty('nome');
          expect(tema).toHaveProperty('emoji');
          expect(tema).toHaveProperty('descricao');
          expect(tema).toHaveProperty('vars');
        });

        it('has matching id property', () => {
          expect(tema.id).toBe(id);
        });

        it('has non-empty nome', () => {
          expect(tema.nome).toBeDefined();
          expect(typeof tema.nome).toBe('string');
          expect(tema.nome.length).toBeGreaterThan(0);
        });

        it('has emoji property (single character or emoji)', () => {
          expect(tema.emoji).toBeDefined();
          expect(typeof tema.emoji).toBe('string');
          expect(tema.emoji.length).toBeGreaterThan(0);
        });

        it('has non-empty descricao', () => {
          expect(tema.descricao).toBeDefined();
          expect(typeof tema.descricao).toBe('string');
          expect(tema.descricao.length).toBeGreaterThan(0);
        });

        it('has vars as an object', () => {
          expect(tema.vars).toBeDefined();
          expect(typeof tema.vars).toBe('object');
          expect(Array.isArray(tema.vars)).toBe(false);
        });

        it('has required CSS variable keys in vars', () => {
          const requiredVars = [
            '--cor-primaria',
            '--cor-primaria-rgb',
            '--cor-secundaria',
            '--cor-secundaria-rgb',
            '--cor-destaque',
            '--cor-destaque-rgb',
            '--cor-sucesso',
            '--cor-info',
            '--bg-body-1',
            '--bg-body-2',
            '--bg-panel',
            '--bg-panel-hover',
            '--border-primary',
            '--grid-color',
            '--shadow-primary',
            '--font-family'
          ];

          requiredVars.forEach(varKey => {
            expect(tema.vars).toHaveProperty(varKey);
          });
        });

        it('has non-empty values for all CSS variables', () => {
          Object.entries(tema.vars).forEach(([key, value]) => {
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
          });
        });

        it('has exactly 16 CSS variables', () => {
          expect(Object.keys(tema.vars)).toHaveLength(16);
        });
      });
    });
  });

  describe('Theme-specific color properties', () => {
    it('neon-ciano has correct primary color', () => {
      expect(TEMAS_PADRAO['neon-ciano'].vars['--cor-primaria']).toBe('#0ff');
      expect(TEMAS_PADRAO['neon-ciano'].vars['--cor-primaria-rgb']).toBe('0, 255, 255');
    });

    it('sangue-crimsono has correct primary color', () => {
      expect(TEMAS_PADRAO['sangue-crimsono'].vars['--cor-primaria']).toBe('#ff003c');
      expect(TEMAS_PADRAO['sangue-crimsono'].vars['--cor-primaria-rgb']).toBe('255, 0, 60');
    });

    it('ouro-imperial has correct primary color', () => {
      expect(TEMAS_PADRAO['ouro-imperial'].vars['--cor-primaria']).toBe('#ffcc00');
      expect(TEMAS_PADRAO['ouro-imperial'].vars['--cor-primaria-rgb']).toBe('255, 204, 0');
    });

    it('nexo-violeta has correct primary color', () => {
      expect(TEMAS_PADRAO['nexo-violeta'].vars['--cor-primaria']).toBe('#d946ef');
      expect(TEMAS_PADRAO['nexo-violeta'].vars['--cor-primaria-rgb']).toBe('217, 70, 239');
    });

    it('verde-mata has correct primary color', () => {
      expect(TEMAS_PADRAO['verde-mata'].vars['--cor-primaria']).toBe('#00ff00');
      expect(TEMAS_PADRAO['verde-mata'].vars['--cor-primaria-rgb']).toBe('0, 255, 0');
    });

    it('abismo-branco has correct primary color', () => {
      expect(TEMAS_PADRAO['abismo-branco'].vars['--cor-primaria']).toBe('#e0f2ff');
      expect(TEMAS_PADRAO['abismo-branco'].vars['--cor-primaria-rgb']).toBe('224, 242, 255');
    });
  });

  describe('Theme consistency checks', () => {
    it('all themes use Rajdhani font family', () => {
      Object.values(TEMAS_PADRAO).forEach(tema => {
        expect(tema.vars['--font-family']).toContain('Rajdhani');
      });
    });

    it('all themes have alpha values for panel-hover', () => {
      Object.values(TEMAS_PADRAO).forEach(tema => {
        expect(tema.vars['--bg-panel-hover']).toMatch(/rgba\(/);
      });
    });

    it('all themes have rgba format for border-primary', () => {
      Object.values(TEMAS_PADRAO).forEach(tema => {
        expect(tema.vars['--border-primary']).toMatch(/rgba\(/);
      });
    });

    it('all themes have rgba format for grid-color', () => {
      Object.values(TEMAS_PADRAO).forEach(tema => {
        expect(tema.vars['--grid-color']).toMatch(/rgba\(/);
      });
    });

    it('all themes have rgba format for shadow-primary', () => {
      Object.values(TEMAS_PADRAO).forEach(tema => {
        expect(tema.vars['--shadow-primary']).toMatch(/rgba\(/);
      });
    });
  });
});

// ==========================================
// obterTema function tests
// ==========================================
describe('obterTema', () => {
  it('returns theme object for valid ID', () => {
    const tema = obterTema('neon-ciano');
    expect(tema).toBeDefined();
    expect(tema.id).toBe('neon-ciano');
    expect(tema.nome).toBe('Neon Ciano');
  });

  it('returns null for invalid ID', () => {
    const tema = obterTema('tema-inexistente');
    expect(tema).toBeNull();
  });

  it('returns null for empty string', () => {
    const tema = obterTema('');
    expect(tema).toBeNull();
  });

  it('returns null for undefined', () => {
    const tema = obterTema(undefined);
    expect(tema).toBeNull();
  });

  it('returns null for null', () => {
    const tema = obterTema(null);
    expect(tema).toBeNull();
  });

  it('returns all valid themes without error', () => {
    const ids = ['neon-ciano', 'sangue-crimsono', 'ouro-imperial', 'nexo-violeta', 'verde-mata', 'abismo-branco'];
    ids.forEach(id => {
      const tema = obterTema(id);
      expect(tema).not.toBeNull();
      expect(tema.id).toBe(id);
    });
  });

  it('returns complete theme object with all properties', () => {
    const tema = obterTema('neon-ciano');
    expect(tema).toHaveProperty('id');
    expect(tema).toHaveProperty('nome');
    expect(tema).toHaveProperty('emoji');
    expect(tema).toHaveProperty('descricao');
    expect(tema).toHaveProperty('vars');
  });

  it('returns independent object (not reference issue)', () => {
    const tema1 = obterTema('neon-ciano');
    const tema2 = obterTema('neon-ciano');
    expect(tema1).toEqual(tema2);
    // They should be the same reference from TEMAS_PADRAO
    expect(tema1).toBe(tema2);
  });

  it('is case sensitive', () => {
    expect(obterTema('Neon-Ciano')).toBeNull();
    expect(obterTema('NEON-CIANO')).toBeNull();
    expect(obterTema('neon-ciano')).not.toBeNull();
  });
});

// ==========================================
// listarTemasIds function tests
// ==========================================
describe('listarTemasIds', () => {
  it('returns an array', () => {
    const ids = listarTemasIds();
    expect(Array.isArray(ids)).toBe(true);
  });

  it('returns exactly 6 IDs', () => {
    const ids = listarTemasIds();
    expect(ids).toHaveLength(6);
  });

  it('returns all expected theme IDs', () => {
    const ids = listarTemasIds();
    const expected = ['neon-ciano', 'sangue-crimsono', 'ouro-imperial', 'nexo-violeta', 'verde-mata', 'abismo-branco'];
    expected.forEach(id => {
      expect(ids).toContain(id);
    });
  });

  it('returns only valid IDs that exist in TEMAS_PADRAO', () => {
    const ids = listarTemasIds();
    ids.forEach(id => {
      expect(TEMAS_PADRAO).toHaveProperty(id);
    });
  });

  it('returns unique IDs (no duplicates)', () => {
    const ids = listarTemasIds();
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('returns strings', () => {
    const ids = listarTemasIds();
    ids.forEach(id => {
      expect(typeof id).toBe('string');
    });
  });

  it('returns consistent results on multiple calls', () => {
    const ids1 = listarTemasIds();
    const ids2 = listarTemasIds();
    expect(ids1).toEqual(ids2);
  });
});

// ==========================================
// validarTemaId function tests
// ==========================================
describe('validarTemaId', () => {
  it('returns true for valid theme IDs', () => {
    expect(validarTemaId('neon-ciano')).toBe(true);
    expect(validarTemaId('sangue-crimsono')).toBe(true);
    expect(validarTemaId('ouro-imperial')).toBe(true);
    expect(validarTemaId('nexo-violeta')).toBe(true);
    expect(validarTemaId('verde-mata')).toBe(true);
    expect(validarTemaId('abismo-branco')).toBe(true);
  });

  it('returns false for invalid theme IDs', () => {
    expect(validarTemaId('tema-inexistente')).toBe(false);
    expect(validarTemaId('outro-tema')).toBe(false);
    expect(validarTemaId('neon')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validarTemaId('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(validarTemaId(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validarTemaId(undefined)).toBe(false);
  });

  it('is case sensitive', () => {
    expect(validarTemaId('Neon-Ciano')).toBe(false);
    expect(validarTemaId('NEON-CIANO')).toBe(false);
    expect(validarTemaId('neon-ciano')).toBe(true);
  });

  it('returns boolean type always', () => {
    expect(typeof validarTemaId('neon-ciano')).toBe('boolean');
    expect(typeof validarTemaId('invalid')).toBe('boolean');
    expect(typeof validarTemaId(null)).toBe('boolean');
  });

  it('validates all IDs from listarTemasIds', () => {
    const ids = listarTemasIds();
    ids.forEach(id => {
      expect(validarTemaId(id)).toBe(true);
    });
  });

  it('is consistent with obterTema', () => {
    const ids = ['neon-ciano', 'sangue-crimsono', 'invalid-id', 'outro-tema'];
    ids.forEach(id => {
      const isValid = validarTemaId(id);
      const tema = obterTema(id);
      if (isValid) {
        expect(tema).not.toBeNull();
      } else {
        expect(tema).toBeNull();
      }
    });
  });
});
