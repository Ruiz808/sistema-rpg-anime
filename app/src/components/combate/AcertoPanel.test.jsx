import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AcertoPanel from './AcertoPanel';
import useStore from '../../stores/useStore';
import { calcularAcerto } from '../../core/engine';
import { enviarParaFeed } from '../../services/firebase-sync';

vi.mock('../../stores/useStore');
vi.mock('../../core/engine', () => ({
    calcularAcerto: vi.fn(() => ({ acertoTotal: 25, rolagem: '1d20' }))
}));
vi.mock('../../core/attributes', () => ({
    getPoderesDefesa: vi.fn(() => 0),
    getEfeitosDeClasse: vi.fn(() => [])
}));
vi.mock('../../services/firebase-sync', () => ({
    enviarParaFeed: vi.fn(),
    salvarFichaSilencioso: vi.fn()
}));

describe('AcertoPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        const mockState = {
            minhaFicha: { inventario: [], ataqueConfig: { vantagens: 0, desvantagens: 0 } },
            meuNome: 'Herói',
            setAbaAtiva: vi.fn(),
            updateFicha: vi.fn(),
            alvoSelecionado: null,
            dummies: {},
            cenario: {}
        };
        useStore.mockImplementation(selector => selector ? selector(mockState) : mockState);
    });

    it('deve enviar a rolagem de acerto corretamente para o motor', () => {
        render(<AcertoPanel />);
        
        const btnRolar = screen.getByText(/ROLAR ACERTO/i);
        fireEvent.click(btnRolar);
        
        // Verifica se chamou a engine passando os parâmetros
        expect(calcularAcerto).toHaveBeenCalledWith(expect.objectContaining({
            vantagens: 0,
            desvantagens: 0
        }));
        
        // Verifica se a emissão ocorreu apenas via Firebase (Sem Eco local)
        expect(enviarParaFeed).toHaveBeenCalled();
    });
});