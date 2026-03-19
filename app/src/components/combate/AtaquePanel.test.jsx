import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AtaquePanel from './AtaquePanel';
import useStore from '../../stores/useStore';
import { getBuffs } from '../../core/attributes';

vi.mock('../../stores/useStore');
vi.mock('../../core/attributes', () => ({
    getBuffs: vi.fn()
}));
vi.mock('../../core/engine', () => ({
    calcularDano: vi.fn(() => ({ dano: 100, letalidade: 0, rolagem: '1d20' }))
}));
vi.mock('../../services/firebase-sync', () => ({
    salvarFichaSilencioso: vi.fn(),
    enviarParaFeed: vi.fn()
}));

describe('AtaquePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock da Ficha e dos hooks do Zustand
        useStore.mockReturnValue({
            minhaFicha: { 
                ataqueConfig: { statusSelecionados: ['forca'] } 
            },
            meuNome: 'Herói',
            updateFicha: vi.fn(),
            setAbaAtiva: vi.fn(),
            addFeedEntry: vi.fn()
        });

        // Simula que existe um buff ativo especificamente em DANO
        getBuffs.mockReturnValue({
            mbase: 2.0, mgeral: 1.0, mformas: 1.0, mabs: 1.0, munico: []
        });
    });

    it('deve ler os buffs de DANO para renderizar as labels e não os de Status', () => {
        render(<AtaquePanel />);
        // Verifica se a função getBuffs foi chamada com 'dano' na renderização
        expect(getBuffs).toHaveBeenCalledWith(expect.anything(), 'dano');
        
        // Verifica se o multiplicador x2.00 apareceu na label (e não o status do personagem)
        expect(screen.getByText('(Poder: x2.00)')).toBeDefined();
    });
});