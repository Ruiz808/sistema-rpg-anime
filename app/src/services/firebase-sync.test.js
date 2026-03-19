import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salvarFirebaseImediato } from './firebase-sync';
import useStore from '../stores/useStore';
import { set } from 'firebase/database';

// Mocks rigorosos para não quebrar CI/CD
vi.mock('firebase/database', () => ({
    ref: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    get: vi.fn(),
    push: vi.fn(() => Promise.resolve()),
    remove: vi.fn(),
    onValue: vi.fn(),
    onChildAdded: vi.fn(),
    limitToLast: vi.fn(),
    query: vi.fn()
}));

vi.mock('./firebase-config', () => ({
    db: {} // Simula conexão ativa
}));

vi.mock('../stores/useStore', () => ({
    default: {
        getState: vi.fn()
    },
    sanitizarNome: vi.fn((n) => n)
}));

describe('Firebase Sync Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Simula o estado congelado vindo do Zustand
        useStore.getState.mockReturnValue({
            meuNome: 'Heroi Teste',
            minhaFicha: Object.freeze({ status: 'vivo', atributos: { forca: 10 } })
        });
    });

    it('deve criar um clone profundo e enviar para o Firebase sem erro de Read Only', async () => {
        await salvarFirebaseImediato();
        
        // Verifica se o set foi chamado com o objeto clonado e NÃO com a referência original
        expect(set).toHaveBeenCalledTimes(1);
        const payloadEnviado = set.mock.calls[0][1];
        expect(payloadEnviado).toEqual({ status: 'vivo', atributos: { forca: 10 } });
        expect(Object.isFrozen(payloadEnviado)).toBe(false); // O clone não pode estar congelado
    });
});