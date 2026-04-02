import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PerfilPanel from './PerfilPanel';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

vi.mock('../../stores/useStore');
vi.mock('../../services/firebase-sync', () => ({
    carregarFichaDoFirebase: vi.fn(() => Promise.resolve()),
    deletarPersonagem: vi.fn(),
    salvarFichaSilencioso: vi.fn(),
    uploadImagem: vi.fn()
}));

describe('PerfilPanel', () => {
    let mockUpdateFicha;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockUpdateFicha = vi.fn((callback) => {
            const draft = { avatar: { base: '' } };
            callback(draft);
        });

        const mockState = {
            minhaFicha: { avatar: { base: '' } },
            meuNome: 'Herói',
            isMestre: false,
            updateFicha: mockUpdateFicha,
            setMeuNome: vi.fn(),
            setIsMestre: vi.fn(),
            resetFicha: vi.fn(),
            carregarDadosFicha: vi.fn(),
            setPersonagemParaDeletar: vi.fn(),
            setAbaAtiva: vi.fn()
        };
        useStore.mockImplementation(selector => selector ? selector(mockState) : mockState);
    });

    it('deve atualizar o link do Avatar Base e salvar silenciosamente', () => {
        render(<PerfilPanel />);
        
        const inputAvatar = screen.getByPlaceholderText('URL da imagem (Ou anexe ao lado 👉)');
        fireEvent.change(inputAvatar, { target: { value: 'http://imagem-personagem.jpg' } });
        
        expect(mockUpdateFicha).toHaveBeenCalled();
        expect(salvarFichaSilencioso).toHaveBeenCalled();
    });
});