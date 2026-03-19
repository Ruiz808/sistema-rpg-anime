import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rolarDadosComVantagem, calcularAcerto } from './engine';

// Mock puro para estabilizar os dados
vi.stubGlobal('Math', {
    ...Math,
    random: () => 0.5 // Sempre vai retornar o meio do dado (ex: 10 em um D20)
});

describe('Engine - Vantagem/Desvantagem', () => {
    it('deve somar dados normalmente se não houver vantagem', () => {
        const result = rolarDadosComVantagem(1, 20, 0, 0); // 1d20
        expect(result.sD).toBe(11); // Math.floor(0.5 * 20) + 1 = 11
    });

    it('deve rolar dados extras e descartar os menores se houver VANTAGEM', () => {
        // Simulando dados viciados para testar o descarte
        vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.1) // Dado 1 = 3
            .mockReturnValueOnce(0.9); // Dado 2 = 19
            
        // Rola 1 dado com 1 vantagem (joga 2, fica com 1 maior)
        const result = rolarDadosComVantagem(1, 20, 1, 0); 
        
        expect(result.sD).toBe(19); // Manteve o maior
        expect(result.rolagemTexto).toContain('<strike'); // O número 3 foi riscado
        expect(result.rolagemTexto).toContain('[VANTAGEM]');
    });

    it('deve acumular vantagens e desvantagens (ex: 2 V, 1 D = 1 Vantagem)', () => {
        vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.9) // 19
            .mockReturnValueOnce(0.1); // 3

        // 2 Vantagens - 1 Desvantagem = 1 Vantagem Líquida (Joga 2 dados, fica com 1 maior)
        const result = rolarDadosComVantagem(1, 20, 2, 1);
        expect(result.sD).toBe(19);
    });
});