import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapaPanel from './MapaPanel';
import useStore from '../../stores/useStore';

vi.mock('../../stores/useStore');
vi.mock('../../services/firebase-sync', () => ({
    salvarFichaSilencioso: vi.fn()
}));

describe('MapaPanel - Holograma de Ação', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir o Holograma de Ação vazio inicialmente', () => {
        useStore.mockReturnValue({
            minhaFicha: { posicao: { x: 0, y: 0 } },
            meuNome: 'Herói',
            personagens: {},
            feedCombate: [], // Feed vazio
            updateFicha: vi.fn()
        });

        render(<MapaPanel />);
        expect(screen.getByText('O campo de batalha aguarda o primeiro movimento...')).toBeDefined();
    });

    it('deve renderizar o Holograma com os dados do último ataque do feed', () => {
        useStore.mockReturnValue({
            minhaFicha: { posicao: { x: 0, y: 0 }, vida: { atual: 500 } },
            meuNome: 'Kakaroto',
            personagens: {},
            feedCombate: [
                { tipo: 'acerto', nome: 'Inimigo', acertoTotal: 15 }, // Antigo
                { tipo: 'dano', nome: 'Kakaroto', dano: 9999 } // Ação mais recente
            ],
            updateFicha: vi.fn()
        });

        render(<MapaPanel />);
        
        // Verifica se o painel detectou que foi um DANO e puxou o valor 9999
        expect(screen.getByText('⚡ DANO ⚡')).toBeDefined();
        expect(screen.getByText('Kakaroto')).toBeDefined();
        expect(screen.getByText('9.999')).toBeDefined(); // Testando a formatação (fmt)
    });
});