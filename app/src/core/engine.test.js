import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rolarDadosComVantagem, calcularAcerto } from './engine';

describe('Engine - Vantagem/Desvantagem', () => {
    let randomSpy;

    beforeEach(() => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('deve somar dados normalmente se nao houver vantagem', () => {
        const result = rolarDadosComVantagem(1, 20, 0, 0);
        expect(result.sD).toBe(11);
    });

    it('deve rolar dados extras e descartar os menores se houver VANTAGEM', () => {
        randomSpy
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.9);

        const result = rolarDadosComVantagem(1, 20, 1, 0);

        expect(result.sD).toBe(19);
        expect(result.rolagemTexto).toContain('<strike');
        expect(result.rolagemTexto).toContain('[VANTAGEM]');
    });

    it('deve acumular vantagens e desvantagens (ex: 2 V, 1 D = 1 Vantagem)', () => {
        randomSpy
            .mockReturnValueOnce(0.9)
            .mockReturnValueOnce(0.1);

        const result = rolarDadosComVantagem(1, 20, 2, 1);
        expect(result.sD).toBe(19);
    });
});