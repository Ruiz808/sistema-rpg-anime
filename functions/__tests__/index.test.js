/**
 * Tests for functions/index.js — falarComSextaFeira Cloud Function
 *
 * Strategy: inject mocks into Node's require cache before loading index.js
 * so that the CJS require() calls inside index.js resolve to our fakes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

// ---------------------------------------------------------------------------
// Mock infrastructure — set up before index.js is loaded
// ---------------------------------------------------------------------------

class HttpsError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

// Shared mutable state so tests can control mock behavior
const state = {
    apiKey: 'test-api-key-123',
    handler: null,
};

// Mutable mock fns re-used across tests
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({ generateContent: mockGenerateContent }));

const realRequire = createRequire(import.meta.url);

// Resolve real paths so we can inject precisely the right cache keys
const firebaseFunctionsPath = realRequire.resolve('firebase-functions/v2/https');
const paramsPath = realRequire.resolve('firebase-functions/params');
const genAiPath = realRequire.resolve('@google/generative-ai');
const indexPath = realRequire.resolve('../index.js');

function makeCacheEntry(id, exports) {
    return { id, filename: id, loaded: true, exports };
}

// Inject mocks
Module._cache[firebaseFunctionsPath] = makeCacheEntry(firebaseFunctionsPath, {
    onCall: (_config, handler) => {
        state.handler = handler;
        return handler;
    },
    HttpsError,
});

Module._cache[paramsPath] = makeCacheEntry(paramsPath, {
    defineSecret: () => ({ value: () => state.apiKey }),
});

Module._cache[genAiPath] = makeCacheEntry(genAiPath, {
    GoogleGenerativeAI: function () {
        return { getGenerativeModel: mockGetGenerativeModel };
    },
});

// Load index.js fresh (delete cache entry in case it was loaded earlier)
delete Module._cache[indexPath];
realRequire('../index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(mensagem, contextoFicha = null) {
    return { data: { mensagem, contextoFicha } };
}

function buildContextoFicha(overrides = {}) {
    return {
        nome: 'Naruto',
        raca: 'Humano',
        classe: 'Guerreiro',
        nivel: 10,
        hp: 80,
        hpMax: 100,
        mana: 50,
        manaMax: 200,
        forca: 15,
        destreza: 12,
        inteligencia: 8,
        sabedoria: 10,
        carisma: 14,
        constituicao: 13,
        hierarquia: {
            poder: true,
            poderNome: 'Lorde',
            infinity: false,
            infinityNome: '',
            singularidade: true,
            singularidadeNome: 'Singular',
        },
        poderes: ['Chidori', 'Rasengan'],
        inventario: ['Espada +2', 'Poção de HP'],
        ...overrides,
    };
}

function setupGeminiSuccess(texto = 'Resposta da IA.') {
    mockGetGenerativeModel.mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
            response: { text: () => texto },
        }),
    });
}

async function getSystemInstruction(contextoFicha) {
    setupGeminiSuccess('ok');
    await state.handler(buildRequest('Pergunta', contextoFicha));
    return mockGetGenerativeModel.mock.calls.at(-1)[0].systemInstruction;
}

// ---------------------------------------------------------------------------
// Guard test
// ---------------------------------------------------------------------------

describe('setup', () => {
    it('onCall capturou o handler de falarComSextaFeira', () => {
        expect(state.handler).toBeTypeOf('function');
    });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — validação de entrada', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.apiKey = 'test-api-key-123';
        setupGeminiSuccess();
    });

    it('lança invalid-argument quando mensagem está ausente (undefined)', async () => {
        const req = { data: { mensagem: undefined, contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é string vazia', async () => {
        await expect(state.handler(buildRequest(''))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é somente espaços em branco', async () => {
        await expect(state.handler(buildRequest('   '))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é null', async () => {
        await expect(state.handler(buildRequest(null))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é um número (tipo errado)', async () => {
        const req = { data: { mensagem: 42, contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é um boolean', async () => {
        const req = { data: { mensagem: true, contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é um objeto', async () => {
        const req = { data: { mensagem: {}, contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem ultrapassa 2000 caracteres', async () => {
        const mensagemLonga = 'a'.repeat(2001);
        await expect(state.handler(buildRequest(mensagemLonga))).rejects.toMatchObject({
            code: 'invalid-argument',
            message: expect.stringContaining('2000'),
        });
    });

    it('aceita mensagem com exatamente 2000 caracteres (no limite permitido)', async () => {
        const mensagemExata = 'b'.repeat(2000);
        const resultado = await state.handler(buildRequest(mensagemExata));
        expect(resultado).toEqual({ resposta: 'Resposta da IA.' });
    });

    it('aceita mensagem com 1999 caracteres (abaixo do limite)', async () => {
        const mensagem = 'c'.repeat(1999);
        await expect(state.handler(buildRequest(mensagem))).resolves.toBeDefined();
    });

    it('lança invalid-argument para mensagem de um único caractere de nova linha (trim resulta em vazio)', async () => {
        await expect(state.handler(buildRequest('\n'))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança failed-precondition quando API key é string vazia', async () => {
        state.apiKey = '';
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'failed-precondition' });
    });

    it('lança failed-precondition quando API key é null', async () => {
        state.apiKey = null;
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'failed-precondition' });
    });

    it('lança failed-precondition quando API key é undefined', async () => {
        state.apiKey = undefined;
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'failed-precondition' });
    });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — caminho feliz', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.apiKey = 'test-api-key-123';
    });

    it('retorna { resposta } com o texto gerado pela IA', async () => {
        setupGeminiSuccess('Use o Rasengan!');
        const resultado = await state.handler(buildRequest('Dica de combate?'));
        expect(resultado).toEqual({ resposta: 'Use o Rasengan!' });
    });

    it('faz trim na mensagem antes de enviar para a IA', async () => {
        const mockGenerateContent = vi.fn().mockResolvedValue({
            response: { text: () => 'ok' },
        });
        mockGetGenerativeModel.mockReturnValue({ generateContent: mockGenerateContent });

        await state.handler(buildRequest('  Olá Sexta-Feira  '));
        expect(mockGenerateContent).toHaveBeenCalledWith('Olá Sexta-Feira');
    });

    it('usa o modelo gemini-2.0-flash', async () => {
        setupGeminiSuccess('ok');
        await state.handler(buildRequest('Oi'));
        expect(mockGetGenerativeModel).toHaveBeenCalledWith(
            expect.objectContaining({ model: 'gemini-2.0-flash' })
        );
    });

    it('inclui cabeçalho CONTEXTO DA FICHA quando contextoFicha é fornecido', async () => {
        setupGeminiSuccess('ok');
        await state.handler(buildRequest('Oi', buildContextoFicha()));
        const chamada = mockGetGenerativeModel.mock.calls[0][0];
        expect(chamada.systemInstruction).toContain('CONTEXTO DA FICHA');
    });

    it('usa somente SYSTEM_PROMPT (sem CONTEXTO DA FICHA) quando contextoFicha é null', async () => {
        setupGeminiSuccess('ok');
        await state.handler(buildRequest('Oi', null));
        const chamada = mockGetGenerativeModel.mock.calls[0][0];
        expect(chamada.systemInstruction).not.toContain('CONTEXTO DA FICHA');
        expect(chamada.systemInstruction).toContain('Sexta-Feira');
    });

    it('chama generateContent exatamente uma vez por requisição', async () => {
        const mockGC = vi.fn().mockResolvedValue({ response: { text: () => 'resp' } });
        mockGetGenerativeModel.mockReturnValue({ generateContent: mockGC });
        await state.handler(buildRequest('Teste'));
        expect(mockGC).toHaveBeenCalledTimes(1);
    });

    it('instancia GoogleGenerativeAI e chama getGenerativeModel a cada requisição', async () => {
        setupGeminiSuccess('ok');
        await state.handler(buildRequest('Oi'));
        // Verifica que o modelo foi configurado (prova que o construtor de GoogleGenerativeAI rodou)
        expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
        expect(mockGetGenerativeModel).toHaveBeenCalledWith(
            expect.objectContaining({ model: 'gemini-2.0-flash' })
        );
    });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — tratamento de erros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.apiKey = 'test-api-key-123';
    });

    it('lança internal quando Gemini retorna resposta vazia', async () => {
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
        });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({
            code: 'internal',
            message: expect.stringContaining('vazia'),
        });
    });

    it('lança internal quando generateContent rejeita com erro genérico', async () => {
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockRejectedValue(new Error('Network timeout')),
        });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'internal' });
    });

    it('repropaga HttpsError original sem encapsular em outro erro', async () => {
        const erroOriginal = new HttpsError('permission-denied', 'Acesso negado');
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockRejectedValue(erroOriginal),
        });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({
            code: 'permission-denied',
            message: 'Acesso negado',
        });
    });

    it('não vaza detalhes internos da API no erro exposto ao cliente', async () => {
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockRejectedValue(new Error('API quota exceeded for project xyz-123')),
        });
        const erro = await state.handler(buildRequest('Oi')).catch((e) => e);
        expect(erro.code).toBe('internal');
        expect(erro.message).not.toContain('quota');
        expect(erro.message).not.toContain('xyz');
    });

    it('lança internal quando response.text lança exceção (ex: filtro de segurança)', async () => {
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: { text: () => { throw new Error('blocked by safety filter'); } },
            }),
        });
        await expect(state.handler(buildRequest('Pergunta'))).rejects.toMatchObject({ code: 'internal' });
    });

    it('lança internal (não propaga outro HttpsError code genérico) para erros de rede', async () => {
        mockGetGenerativeModel.mockReturnValue({
            generateContent: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        });
        const erro = await state.handler(buildRequest('Oi')).catch((e) => e);
        expect(erro.code).toBe('internal');
    });
});

// ---------------------------------------------------------------------------
// formatarContexto — tested indirectly via systemInstruction content
// ---------------------------------------------------------------------------

describe('formatarContexto — testado via systemInstruction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.apiKey = 'test-api-key-123';
    });

    it('retorna somente SYSTEM_PROMPT quando contextoFicha é null', async () => {
        const si = await getSystemInstruction(null);
        expect(si).toContain('Sexta-Feira');
        expect(si).not.toContain('CONTEXTO DA FICHA');
    });

    it('retorna somente SYSTEM_PROMPT quando contextoFicha é undefined', async () => {
        const si = await getSystemInstruction(undefined);
        expect(si).not.toContain('CONTEXTO DA FICHA');
    });

    it('lida com contextoFicha vazio {} sem lançar erro', async () => {
        await expect(state.handler(buildRequest('Oi', {}))).resolves.toEqual({ resposta: 'ok' });
    });

    it('usa "Desconhecido" quando ctx.nome está ausente', async () => {
        const si = await getSystemInstruction({ raca: 'Orc' });
        expect(si).toContain('Desconhecido');
    });

    it('inclui o nome do personagem', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ nome: 'Sasuke' }));
        expect(si).toContain('Sasuke');
    });

    it('inclui raça quando fornecida', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ raca: 'Elfo' }));
        expect(si).toContain('Elfo');
    });

    it('inclui classe quando fornecida', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ classe: 'Mago' }));
        expect(si).toContain('Mago');
    });

    it('inclui nível quando fornecido', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ nivel: 42 }));
        expect(si).toContain('42');
    });

    it('formata HP como "atual/max"', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ hp: 75, hpMax: 100 }));
        expect(si).toContain('75/100');
    });

    it('usa 0 como HP atual quando hp é undefined mas hpMax está presente', async () => {
        const ctx = buildContextoFicha({ hpMax: 100 });
        delete ctx.hp;
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('0/100');
    });

    it('omite linha de HP quando hpMax está ausente', async () => {
        const si = await getSystemInstruction({ nome: 'Sem HP', hp: 50 });
        expect(si).not.toContain('HP:');
    });

    it('formata Mana como "atual/max"', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ mana: 30, manaMax: 200 }));
        expect(si).toContain('30/200');
    });

    it('usa 0 como Mana atual quando mana é undefined mas manaMax está presente', async () => {
        const ctx = buildContextoFicha({ manaMax: 200 });
        delete ctx.mana;
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('0/200');
    });

    it('omite linha de Mana quando manaMax está ausente', async () => {
        const si = await getSystemInstruction({ nome: 'Sem Mana', mana: 30 });
        expect(si).not.toContain('Mana:');
    });

    it('inclui todas as seis stats quando presentes', async () => {
        const ctx = buildContextoFicha({ forca: 18, destreza: 14, inteligencia: 10, sabedoria: 12, carisma: 16, constituicao: 15 });
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('FOR:18');
        expect(si).toContain('DES:14');
        expect(si).toContain('INT:10');
        expect(si).toContain('SAB:12');
        expect(si).toContain('CAR:16');
        expect(si).toContain('CON:15');
    });

    it('omite stats ausentes da linha Stats', async () => {
        const ctx = { nome: 'Parcial', forca: 10 };
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('FOR:10');
        expect(si).not.toContain('DES:');
        expect(si).not.toContain('INT:');
        expect(si).not.toContain('SAB:');
        expect(si).not.toContain('CAR:');
        expect(si).not.toContain('CON:');
    });

    it('omite seção Stats quando nenhuma stat está presente', async () => {
        const si = await getSystemInstruction({ nome: 'Sem Stats' });
        expect(si).not.toContain('Stats:');
    });

    it('inclui stat com valor zero (0 é valor válido, não ausente)', async () => {
        const ctx = { nome: 'Zero Stats', forca: 0 };
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('FOR:0');
    });

    it('inclui poderNome quando hierarquia.poder é true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: true, poderNome: 'Deus', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
        });
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('Deus');
    });

    it('omite poder quando hierarquia.poder é false', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: 'Deus', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
        });
        const si = await getSystemInstruction(ctx);
        expect(si).not.toContain('Deus');
    });

    it('inclui infinityNome quando hierarquia.infinity é true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: '', infinity: true, infinityNome: 'Omega', singularidade: false, singularidadeNome: '' },
        });
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('Omega');
    });

    it('inclui singularidadeNome quando hierarquia.singularidade é true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: '', infinity: false, infinityNome: '', singularidade: true, singularidadeNome: 'Único' },
        });
        const si = await getSystemInstruction(ctx);
        expect(si).toContain('Único');
    });

    it('lida com hierarquia null sem lançar erro', async () => {
        const ctx = buildContextoFicha({ hierarquia: null });
        await expect(state.handler(buildRequest('Oi', ctx))).resolves.toEqual({ resposta: 'ok' });
    });

    it('lida com hierarquia undefined sem lançar erro', async () => {
        const ctx = buildContextoFicha({});
        delete ctx.hierarquia;
        await expect(state.handler(buildRequest('Oi', ctx))).resolves.toEqual({ resposta: 'ok' });
    });

    it('inclui poderes separados por vírgula', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ poderes: ['Fireball', 'Teleport'] }));
        expect(si).toContain('Fireball');
        expect(si).toContain('Teleport');
    });

    it('omite seção Poderes quando array está vazio', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ poderes: [] }));
        expect(si).not.toContain('Poderes:');
    });

    it('inclui inventário separado por vírgula', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ inventario: ['Escudo', 'Antídoto'] }));
        expect(si).toContain('Escudo');
        expect(si).toContain('Antídoto');
    });

    it('omite seção Inventario quando array está vazio', async () => {
        const si = await getSystemInstruction(buildContextoFicha({ inventario: [] }));
        expect(si).not.toContain('Inventario:');
    });

    it('inclui SYSTEM_PROMPT base mesmo quando ficha tem contexto', async () => {
        const si = await getSystemInstruction(buildContextoFicha());
        expect(si).toContain('Sexta-Feira');
    });
});
