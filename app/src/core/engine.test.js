import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularDano } from './engine';
import { getBuffs, getMaximo } from './attributes';

vi.mock('./attributes', () => ({
    getBuffs: vi.fn(),
    getMaximo: vi.fn()
}));

vi.mock('./utils', () => ({
    contarDigitos: vi.fn(() => 5),
    tratarUnico: vi.fn(() => [1.0]),
    pegarDoisPrimeirosDigitos: vi.fn()
}));

describe('Engine - Calcular Dano', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Simula que a Força base do personagem é 10.000
        getMaximo.mockReturnValue(10000);

        // O Mock crucial: O sistema pede o buff de 'dano' na rolagem
        getBuffs.mockImplementation((ficha, tipo) => {
            if (tipo === 'dano') {
                return { mbase: 2.0, mgeral: 1.0, mformas: 1.0, mabs: 1.0, munico: [], reducaoCusto: 0 };
            }
            return { mbase: 1.0, mgeral: 1.0, mformas: 1.0, mabs: 1.0, munico: [], reducaoCusto: 0 };
        });
    });

    it('deve calcular os multiplicadores baseados exclusivamente na categoria DANO', () => {
        const result = calcularDano({
            qDBase: 1, qDExtra: 0, qDMagia: 0, fD: 20,
            pE: 0, pMagiaTotal: 0, rE: 0, mE: 1.0, db: 0, mdb: 1.0,
            engs: ['mana'], sels: ['forca'], minhaFicha: {},
            m1: 1.0, m2: 1.0, m3: 1.0, m4: 1.0, m5: 1.0, uArr: [1.0],
            itensEquipados: [], magiasEquipadas: []
        });

        // O multiplicador total (multTotal) deve ser afetado pelo mbase: 2.0 do 'dano'
        // Como MÁXIMO (10000) * DADO (aprox 10) = ~100.000. 
        // Com o MultBase x2 (do Dano), o total deve ser próximo de 200.000
        expect(result.detalheConta).toContain('x2');
        expect(getBuffs).toHaveBeenCalledWith(expect.anything(), 'dano');
    });
});