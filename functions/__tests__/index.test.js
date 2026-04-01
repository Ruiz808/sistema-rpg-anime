/**
 * Tests for functions/index.js — formatarContexto and falarComSextaFeira
 *
 * Mocking strategy:
 *   index.js is CJS and calls require() at load time for both
 *   `firebase-functions/v2/https` and `@google/genai`. We inject
 *   fake entries directly into Node's require cache (Module._cache)
 *   BEFORE loading index.js so the CJS require() calls resolve
 *   to our controlled fakes.
 *
 * SDK shape being mocked (@google/genai v1.x):
 *   - new GoogleGenAI({ vertexai, project, location })
 *   - ai.models.generateContent({ model, contents, config }) → { text: string }
 *
 * firebase-functions/v2/https shape:
 *   - onCall(config, handler) — we capture `handler` for direct invocation
 *   - HttpsError(code, message)
 *
 * Auth shape:
 *   - request.auth must be truthy for the handler to proceed past the
 *     unauthenticated guard in index.js.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

// ---------------------------------------------------------------------------
// HttpsError stub — mirrors firebase-functions behaviour
// ---------------------------------------------------------------------------

class HttpsError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'HttpsError';
    }
}

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

/** Captured by onCall mock so tests can invoke the handler directly. */
const state = { handler: null };

/** The core mock — every test can replace its implementation. */
const mockGenerateContent = vi.fn();

// ---------------------------------------------------------------------------
// Resolve real cache keys (absolute paths on disk)
// ---------------------------------------------------------------------------

const realRequire = createRequire(import.meta.url);

const firebaseFunctionsPath = realRequire.resolve('firebase-functions/v2/https');
const genAiPath             = realRequire.resolve('@google/genai');
const indexPath             = realRequire.resolve('../index.js');

// ---------------------------------------------------------------------------
// Helper — build a minimal Module._cache entry
// ---------------------------------------------------------------------------

function cacheEntry(id, exports) {
    return { id, filename: id, loaded: true, exports, children: [], parent: null };
}

// ---------------------------------------------------------------------------
// Inject mocks into require cache BEFORE index.js is loaded
// ---------------------------------------------------------------------------

Module._cache[firebaseFunctionsPath] = cacheEntry(firebaseFunctionsPath, {
    onCall: (_config, handler) => {
        state.handler = handler;
        return handler;
    },
    HttpsError,
});

Module._cache[genAiPath] = cacheEntry(genAiPath, {
    GoogleGenAI: function (_opts) {
        // ai.models.generateContent is the call site in index.js
        this.models = { generateContent: mockGenerateContent };
    },
});

// Load index.js fresh (wipe any stale entry)
delete Module._cache[indexPath];
realRequire('../index.js');

// ---------------------------------------------------------------------------
// Request builders
// ---------------------------------------------------------------------------

/** Authenticated request (passes request.auth guard). */
function buildRequest(mensagem, contextoFicha = null) {
    return {
        auth: { uid: 'test-user-123', token: {} },
        data: { mensagem, contextoFicha },
    };
}

/** Unauthenticated request (no auth object). */
function buildUnauthRequest(mensagem = 'Oi') {
    return { data: { mensagem, contextoFicha: null } };
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
        inventario: ['Espada +2', 'Pocao de HP'],
        ...overrides,
    };
}

/** Make generateContent resolve with the given text. */
function setupGeminiSuccess(texto = 'Resposta da IA.') {
    mockGenerateContent.mockResolvedValue({ text: texto });
}

/** Make generateContent reject with an Error. */
function setupGeminiFailure(message = 'Gemini error') {
    mockGenerateContent.mockRejectedValue(new Error(message));
}

/**
 * Run falarComSextaFeira with a given contextoFicha and return the
 * systemInstruction that was passed to models.generateContent.
 */
async function captureSystemInstruction(contextoFicha) {
    setupGeminiSuccess('ok');
    await state.handler(buildRequest('Pergunta', contextoFicha));
    const call = mockGenerateContent.mock.calls.at(-1)[0];
    return call.config.systemInstruction;
}

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

describe('setup', () => {
    it('onCall capturou o handler de falarComSextaFeira', () => {
        expect(state.handler).toBeTypeOf('function');
    });
});

// ---------------------------------------------------------------------------
// Authentication guard
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — autenticacao', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupGeminiSuccess();
    });

    it('lança unauthenticated quando request.auth está ausente', async () => {
        await expect(state.handler(buildUnauthRequest())).rejects.toMatchObject({
            code: 'unauthenticated',
        });
    });

    it('lança unauthenticated quando request.auth é null', async () => {
        const req = { auth: null, data: { mensagem: 'Oi', contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'unauthenticated' });
    });

    it('lança unauthenticated quando request.auth é undefined', async () => {
        const req = { auth: undefined, data: { mensagem: 'Oi', contextoFicha: null } };
        await expect(state.handler(req)).rejects.toMatchObject({ code: 'unauthenticated' });
    });

    it('prossegue normalmente com request.auth preenchido', async () => {
        await expect(state.handler(buildRequest('Oi'))).resolves.toHaveProperty('resposta');
    });
});

// ---------------------------------------------------------------------------
// Input validation — falarComSextaFeira
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — validação de entrada', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupGeminiSuccess();
    });

    it('lança invalid-argument quando mensagem está ausente (undefined)', async () => {
        const req = { auth: { uid: 'u' }, data: { mensagem: undefined, contextoFicha: null } };
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

    it('lança invalid-argument quando mensagem é um número', async () => {
        await expect(state.handler({ auth: { uid: 'u' }, data: { mensagem: 42 } })).rejects.toMatchObject({
            code: 'invalid-argument',
        });
    });

    it('lança invalid-argument quando mensagem é boolean', async () => {
        await expect(state.handler({ auth: { uid: 'u' }, data: { mensagem: true } })).rejects.toMatchObject({
            code: 'invalid-argument',
        });
    });

    it('lança invalid-argument quando mensagem é um objeto', async () => {
        await expect(state.handler({ auth: { uid: 'u' }, data: { mensagem: {} } })).rejects.toMatchObject({
            code: 'invalid-argument',
        });
    });

    it('lança invalid-argument quando mensagem é um array', async () => {
        await expect(state.handler({ auth: { uid: 'u' }, data: { mensagem: [] } })).rejects.toMatchObject({
            code: 'invalid-argument',
        });
    });

    it('lança invalid-argument quando mensagem é uma nova linha sozinha (trim resulta em vazio)', async () => {
        await expect(state.handler(buildRequest('\n'))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem é uma tabulação sozinha', async () => {
        await expect(state.handler(buildRequest('\t'))).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('lança invalid-argument quando mensagem ultrapassa 2000 caracteres', async () => {
        const longa = 'a'.repeat(2001);
        await expect(state.handler(buildRequest(longa))).rejects.toMatchObject({
            code: 'invalid-argument',
            message: expect.stringContaining('2000'),
        });
    });

    it('aceita mensagem com exatamente 2000 caracteres (no limite)', async () => {
        const exata = 'b'.repeat(2000);
        await expect(state.handler(buildRequest(exata))).resolves.toEqual({ resposta: 'Resposta da IA.' });
    });

    it('aceita mensagem com 1999 caracteres (abaixo do limite)', async () => {
        const curta = 'c'.repeat(1999);
        await expect(state.handler(buildRequest(curta))).resolves.toBeDefined();
    });

    it('aceita mensagem de um único caractere válido', async () => {
        await expect(state.handler(buildRequest('?'))).resolves.toHaveProperty('resposta');
    });
});

// ---------------------------------------------------------------------------
// Happy path — falarComSextaFeira
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — caminho feliz', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupGeminiSuccess();
    });

    it('retorna { resposta } com o texto gerado pela IA', async () => {
        setupGeminiSuccess('Use o Rasengan!');
        const resultado = await state.handler(buildRequest('Dica de combate?'));
        expect(resultado).toEqual({ resposta: 'Use o Rasengan!' });
    });

    it('chave de retorno é exatamente "resposta", sem campos extras', async () => {
        const resultado = await state.handler(buildRequest('Oi'));
        expect(Object.keys(resultado)).toEqual(['resposta']);
    });

    it('faz trim na mensagem antes de enviar para a IA', async () => {
        await state.handler(buildRequest('  Olá Sexta-Feira  '));
        const call = mockGenerateContent.mock.calls[0][0];
        expect(call.contents).toBe('Olá Sexta-Feira');
    });

    it('passa o modelo correto (gemini-2.0-flash) para generateContent', async () => {
        await state.handler(buildRequest('Oi'));
        const call = mockGenerateContent.mock.calls[0][0];
        expect(call.model).toBe('gemini-2.0-flash');
    });

    it('chama generateContent exatamente uma vez por requisição', async () => {
        await state.handler(buildRequest('Teste'));
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('inclui cabeçalho CONTEXTO DA FICHA quando contextoFicha é fornecido', async () => {
        const si = await captureSystemInstruction(buildContextoFicha());
        expect(si).toContain('CONTEXTO DA FICHA');
    });

    it('usa somente SYSTEM_PROMPT (sem CONTEXTO DA FICHA) quando contextoFicha é null', async () => {
        const si = await captureSystemInstruction(null);
        expect(si).not.toContain('CONTEXTO DA FICHA');
        expect(si).toContain('Sexta-Feira');
    });

    it('SYSTEM_PROMPT base está presente mesmo quando a ficha tem contexto', async () => {
        const si = await captureSystemInstruction(buildContextoFicha());
        expect(si).toContain('Sexta-Feira');
    });

    it('duas requisições independentes retornam respostas corretas', async () => {
        mockGenerateContent
            .mockResolvedValueOnce({ text: 'Primeira' })
            .mockResolvedValueOnce({ text: 'Segunda' });

        const [r1, r2] = await Promise.all([
            state.handler(buildRequest('Pergunta 1')),
            state.handler(buildRequest('Pergunta 2')),
        ]);
        expect(r1).toEqual({ resposta: 'Primeira' });
        expect(r2).toEqual({ resposta: 'Segunda' });
    });
});

// ---------------------------------------------------------------------------
// Error handling — falarComSextaFeira
// ---------------------------------------------------------------------------

describe('falarComSextaFeira — tratamento de erros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lança internal quando Gemini retorna response.text como string vazia', async () => {
        mockGenerateContent.mockResolvedValue({ text: '' });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({
            code: 'internal',
            message: expect.stringContaining('vazia'),
        });
    });

    it('lança internal quando Gemini retorna response.text como null', async () => {
        mockGenerateContent.mockResolvedValue({ text: null });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'internal' });
    });

    it('lança internal quando Gemini retorna response.text como undefined', async () => {
        mockGenerateContent.mockResolvedValue({ text: undefined });
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'internal' });
    });

    it('lança internal quando generateContent rejeita com erro genérico', async () => {
        setupGeminiFailure('Network timeout');
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({ code: 'internal' });
    });

    it('repropaga HttpsError original sem encapsular em outro erro', async () => {
        const original = new HttpsError('permission-denied', 'Acesso negado');
        mockGenerateContent.mockRejectedValue(original);
        await expect(state.handler(buildRequest('Oi'))).rejects.toMatchObject({
            code: 'permission-denied',
            message: 'Acesso negado',
        });
    });

    it('não vaza detalhes internos da API no erro exposto ao cliente', async () => {
        setupGeminiFailure('API quota exceeded for project xyz-secret-123');
        const err = await state.handler(buildRequest('Oi')).catch((e) => e);
        expect(err.code).toBe('internal');
        expect(err.message).not.toContain('quota');
        expect(err.message).not.toContain('xyz-secret');
    });

    it('lança internal quando generateContent lança ECONNREFUSED', async () => {
        setupGeminiFailure('ECONNREFUSED 0.0.0.0:443');
        const err = await state.handler(buildRequest('Oi')).catch((e) => e);
        expect(err.code).toBe('internal');
    });
});

// ---------------------------------------------------------------------------
// formatarContexto — tested via systemInstruction content
// ---------------------------------------------------------------------------

describe('formatarContexto — via systemInstruction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // null / undefined / empty ------------------------------------------------

    it('retorna string vazia (sem CONTEXTO) quando contextoFicha é null', async () => {
        const si = await captureSystemInstruction(null);
        expect(si).not.toContain('CONTEXTO DA FICHA');
    });

    it('retorna string vazia (sem CONTEXTO) quando contextoFicha é undefined', async () => {
        const si = await captureSystemInstruction(undefined);
        expect(si).not.toContain('CONTEXTO DA FICHA');
    });

    it('não lança erro com contextoFicha vazio {}', async () => {
        await expect(state.handler(buildRequest('Oi', {}))).resolves.toEqual({ resposta: 'ok' });
    });

    // nome --------------------------------------------------------------------

    it('usa "Desconhecido" quando ctx.nome está ausente', async () => {
        const si = await captureSystemInstruction({ raca: 'Orc' });
        expect(si).toContain('Desconhecido');
    });

    it('usa "Desconhecido" quando ctx.nome é string vazia', async () => {
        const si = await captureSystemInstruction({ nome: '' });
        expect(si).toContain('Desconhecido');
    });

    it('inclui o nome do personagem quando fornecido', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ nome: 'Sasuke' }));
        expect(si).toContain('Sasuke');
    });

    // raça / classe / nível ---------------------------------------------------

    it('inclui raca quando fornecida', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ raca: 'Elfo' }));
        expect(si).toContain('Elfo');
    });

    it('omite raca quando ausente', async () => {
        const ctx = buildContextoFicha();
        delete ctx.raca;
        const si = await captureSystemInstruction(ctx);
        expect(si).not.toContain('Raca:');
    });

    it('inclui classe quando fornecida', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ classe: 'Mago' }));
        expect(si).toContain('Mago');
    });

    it('inclui nivel quando fornecido', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ nivel: 42 }));
        expect(si).toContain('42');
    });

    // HP ----------------------------------------------------------------------

    it('formata HP como "atual/max"', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ hp: 75, hpMax: 100 }));
        expect(si).toContain('75/100');
    });

    it('usa 0 como HP atual quando hp é undefined mas hpMax está presente', async () => {
        const ctx = buildContextoFicha({ hpMax: 100 });
        delete ctx.hp;
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('0/100');
    });

    it('omite linha HP quando hpMax está ausente', async () => {
        const si = await captureSystemInstruction({ nome: 'Sem HP', hp: 50 });
        expect(si).not.toContain('HP:');
    });

    it('inclui HP quando hp é 0 e hpMax está presente', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ hp: 0, hpMax: 100 }));
        expect(si).toContain('0/100');
    });

    // Mana --------------------------------------------------------------------

    it('formata Mana como "atual/max"', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ mana: 30, manaMax: 200 }));
        expect(si).toContain('30/200');
    });

    it('usa 0 como Mana atual quando mana é undefined mas manaMax está presente', async () => {
        const ctx = buildContextoFicha({ manaMax: 200 });
        delete ctx.mana;
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('0/200');
    });

    it('omite linha Mana quando manaMax está ausente', async () => {
        const si = await captureSystemInstruction({ nome: 'Sem Mana', mana: 30 });
        expect(si).not.toContain('Mana:');
    });

    // Stats -------------------------------------------------------------------

    it('inclui todas as seis stats quando presentes', async () => {
        const ctx = buildContextoFicha({
            forca: 18, destreza: 14, inteligencia: 10,
            sabedoria: 12, carisma: 16, constituicao: 15,
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('FOR:18');
        expect(si).toContain('DES:14');
        expect(si).toContain('INT:10');
        expect(si).toContain('SAB:12');
        expect(si).toContain('CAR:16');
        expect(si).toContain('CON:15');
    });

    it('omite stats ausentes da linha Stats', async () => {
        const si = await captureSystemInstruction({ nome: 'Parcial', forca: 10 });
        expect(si).toContain('FOR:10');
        expect(si).not.toContain('DES:');
        expect(si).not.toContain('INT:');
        expect(si).not.toContain('SAB:');
        expect(si).not.toContain('CAR:');
        expect(si).not.toContain('CON:');
    });

    it('omite seção Stats quando nenhuma stat está presente', async () => {
        const si = await captureSystemInstruction({ nome: 'Sem Stats' });
        expect(si).not.toContain('Stats:');
    });

    it('inclui stat com valor zero (0 é válido, não ausente)', async () => {
        const si = await captureSystemInstruction({ nome: 'Zero Force', forca: 0 });
        expect(si).toContain('FOR:0');
    });

    it('inclui stat com valor negativo', async () => {
        const si = await captureSystemInstruction({ nome: 'Debuffado', forca: -5 });
        expect(si).toContain('FOR:-5');
    });

    // Hierarquia --------------------------------------------------------------

    it('inclui poderNome quando hierarquia.poder é true e poderNome está presente', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: true, poderNome: 'Deus', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('Deus');
    });

    it('omite poder quando hierarquia.poder é false', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: 'Deus', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).not.toContain('Deus');
    });

    it('inclui infinityNome quando hierarquia.infinity é true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: '', infinity: true, infinityNome: 'Omega', singularidade: false, singularidadeNome: '' },
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('Omega');
    });

    it('inclui singularidadeNome quando hierarquia.singularidade é true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: false, poderNome: '', infinity: false, infinityNome: '', singularidade: true, singularidadeNome: 'Unico' },
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('Unico');
    });

    it('lida com hierarquia null sem lançar erro', async () => {
        const ctx = buildContextoFicha({ hierarquia: null });
        await expect(state.handler(buildRequest('Oi', ctx))).resolves.toHaveProperty('resposta');
    });

    it('lida com hierarquia undefined sem lançar erro', async () => {
        const ctx = buildContextoFicha();
        delete ctx.hierarquia;
        await expect(state.handler(buildRequest('Oi', ctx))).resolves.toHaveProperty('resposta');
    });

    it('omite poder quando poderNome é string vazia mesmo que poder seja true', async () => {
        const ctx = buildContextoFicha({
            hierarquia: { poder: true, poderNome: '', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).not.toContain('Poder:');
    });

    // Poderes -----------------------------------------------------------------

    it('inclui poderes separados por vírgula', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ poderes: ['Fireball', 'Teleport'] }));
        expect(si).toContain('Fireball');
        expect(si).toContain('Teleport');
    });

    it('omite seção Poderes quando array está vazio', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ poderes: [] }));
        expect(si).not.toContain('Poderes:');
    });

    it('omite seção Poderes quando poderes está ausente', async () => {
        const ctx = buildContextoFicha();
        delete ctx.poderes;
        const si = await captureSystemInstruction(ctx);
        expect(si).not.toContain('Poderes:');
    });

    it('inclui poder único sem vírgulas extras', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ poderes: ['Sharingan'] }));
        expect(si).toContain('Sharingan');
    });

    // Inventário --------------------------------------------------------------

    it('inclui inventário separado por vírgula', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ inventario: ['Escudo', 'Antidoto'] }));
        expect(si).toContain('Escudo');
        expect(si).toContain('Antidoto');
    });

    it('omite seção Inventario quando array está vazio', async () => {
        const si = await captureSystemInstruction(buildContextoFicha({ inventario: [] }));
        expect(si).not.toContain('Inventario:');
    });

    it('omite seção Inventario quando inventario está ausente', async () => {
        const ctx = buildContextoFicha();
        delete ctx.inventario;
        const si = await captureSystemInstruction(ctx);
        expect(si).not.toContain('Inventario:');
    });

    // Full integration — ficha completa ---------------------------------------

    it('ficha completa inclui todas as seções esperadas', async () => {
        const ctx = buildContextoFicha({
            nome: 'Goku', raca: 'Saiyajin', classe: 'Lutador', nivel: 99,
            hp: 9000, hpMax: 9000, mana: 100, manaMax: 100,
            forca: 20, destreza: 18, inteligencia: 10, sabedoria: 12, carisma: 15, constituicao: 20,
            hierarquia: { poder: true, poderNome: 'Super Saiyajin', infinity: false, infinityNome: '', singularidade: false, singularidadeNome: '' },
            poderes: ['Kamehameha', 'Genki-Dama'],
            inventario: ['Senzu Bean'],
        });
        const si = await captureSystemInstruction(ctx);
        expect(si).toContain('Goku');
        expect(si).toContain('Saiyajin');
        expect(si).toContain('99');
        expect(si).toContain('9000/9000');
        expect(si).toContain('FOR:20');
        expect(si).toContain('Super Saiyajin');
        expect(si).toContain('Kamehameha');
        expect(si).toContain('Senzu Bean');
        expect(si).toContain('CONTEXTO DA FICHA');
        expect(si).toContain('Sexta-Feira');
    });
});
