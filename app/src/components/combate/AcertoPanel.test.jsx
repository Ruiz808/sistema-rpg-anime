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
vi.mock('../../services/firebase-sync', () => ({
    enviarParaFeed: vi.fn()
}));

describe('AcertoPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock puro do estado, sem o addFeedEntry para garantir que não há Eco
        useStore.mockReturnValue({
            minhaFicha: { inventario: [] },
            meuNome: 'Herói',
            setAbaAtiva: vi.fn()
        });
    });

    it('deve enviar a rolagem de acerto com vantagens e desvantagens corretamente para o motor', () => {
        render(<AcertoPanel />);
        
        // Simula preenchimento tático
        const inputsVantagem = screen.getAllByRole('spinbutton');
        
        // Vamos supor que o campo de vantagem é o penúltimo e desvantagem o último
        fireEvent.change(inputsVantagem[4], { target: { value: '2' } }); // 2 Vantagens
        fireEvent.change(inputsVantagem[5], { target: { value: '1' } }); // 1 Desvantagem
        
        const btnRolar = screen.getByText('ROLAR ACERTO TÁTICO');
        fireEvent.click(btnRolar);
        
        // Verifica se chamou a engine passando os parâmetros Vantagem = 2, Desvantagem = 1
        expect(calcularAcerto).toHaveBeenCalledWith(expect.objectContaining({
            vantagens: 2,
            desvantagens: 1
        }));
        
        // Verifica se a emissão ocorreu apenas via Firebase (Sem Eco local)
        expect(enviarParaFeed).toHaveBeenCalled();
    });
});