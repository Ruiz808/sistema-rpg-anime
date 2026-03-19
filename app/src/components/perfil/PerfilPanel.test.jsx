import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PerfilPanel from './PerfilPanel';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

vi.mock('../../stores/useStore');
vi.mock('../../services/firebase-sync', () => ({
    carregarFichaDoFirebase: vi.fn(() => Promise.resolve()),
    deletarPersonagem: vi.fn(),
    salvarFichaSilencioso: vi.fn()
}));

describe('PerfilPanel', () => {
    let mockUpdateFicha;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockUpdateFicha = vi.fn((callback) => {
            const draft = { avatar: { base: '' } };
            callback(draft);
        });

        useStore.mockReturnValue({
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
        });
    });

    it('deve atualizar o link do Avatar Base e salvar silenciosamente', () => {
        render(<PerfilPanel />);
        
        const inputAvatar = screen.getByPlaceholderText('Cole o link da imagem aqui...');
        fireEvent.change(inputAvatar, { target: { value: 'http://imagem-personagem.jpg' } });
        
        expect(mockUpdateFicha).toHaveBeenCalled();
        expect(salvarFichaSilencioso).toHaveBeenCalled();
    });
});