import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AtaquePanel from './AtaquePanel';
import useStore from '../../stores/useStore';
import { getBuffs } from '../../core/attributes';
import { enviarParaFeed } from '../../services/firebase-sync';

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
    let mockAddFeedEntry;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockAddFeedEntry = vi.fn(); // Função local que NÂO deve ser chamada

        useStore.mockReturnValue({
            minhaFicha: { 
                ataqueConfig: { statusSelecionados: ['forca'] } 
            },
            meuNome: 'Herói',
            updateFicha: vi.fn(),
            setAbaAtiva: vi.fn(),
            addFeedEntry: mockAddFeedEntry 
        });

        getBuffs.mockReturnValue({
            mbase: 2.0, mgeral: 1.0, mformas: 1.0, mabs: 1.0, munico: []
        });
    });

    it('deve enviar para o Firebase e NÃO adicionar localmente (evitando duplicidade de eco)', () => {
        render(<AtaquePanel />);
        const btnRolar = screen.getByText('ROLAR DANO');
        
        fireEvent.click(btnRolar);
        
        // Verifica se enviou para o banco de dados
        expect(enviarParaFeed).toHaveBeenCalled();
        
        // Verifica se a adição local foi bloqueada com sucesso!
        expect(mockAddFeedEntry).not.toHaveBeenCalled(); 
    });
});