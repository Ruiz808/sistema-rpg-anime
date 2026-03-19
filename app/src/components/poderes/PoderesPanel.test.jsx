import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PoderesPanel from './PoderesPanel';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

// Mock das dependências externas
vi.mock('../../stores/useStore');
vi.mock('../../core/attributes', () => ({
    getMaximo: vi.fn()
}));
vi.mock('../../services/firebase-sync', () => ({
    salvarFichaSilencioso: vi.fn()
}));

describe('PoderesPanel', () => {
    let mockUpdateFicha;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateFicha = vi.fn((callback) => {
            // Simula o comportamento do Immer no updateFicha
            const draft = { 
                poderes: [{ id: 1, nome: 'Modo Sábio', ativa: false, efeitos: [] }],
                vida: { atual: 100 }
            };
            callback(draft);
        });

        useStore.mockReturnValue({
            minhaFicha: { poderes: [{ id: 1, nome: 'Modo Sábio', ativa: false, efeitos: [] }] },
            updateFicha: mockUpdateFicha,
            efeitosTemp: [],
            setEfeitosTemp: vi.fn(),
            poderEditandoId: null,
            setPoderEditandoId: vi.fn()
        });

        getMaximo.mockReturnValue(100);
    });

    it('deve renderizar o painel e o poder existente', () => {
        render(<PoderesPanel />);
        expect(screen.getByText('Criar Novo Poder')).toBeDefined();
        expect(screen.getByText('Modo Sábio')).toBeDefined();
    });

    it('deve alternar a ativação do poder e chamar o salvamento silencioso', () => {
        render(<PoderesPanel />);
        const btnLigar = screen.getByText('DESLIGADO');
        fireEvent.click(btnLigar);

        expect(mockUpdateFicha).toHaveBeenCalled();
        expect(salvarFichaSilencioso).toHaveBeenCalled();
    });
});