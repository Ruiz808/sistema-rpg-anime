import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ==========================================
// Helpers — Firebase rule simulator
// ==========================================

/**
 * Simulates Firebase Realtime Database validate rules for the jukebox node.
 * Rules use named children: playing (boolean, required), videoId (string, length == 11, optional),
 * inputUrl (string, <= 200, empty or YouTube URL, optional). $unknown blocks extra fields.
 */
function avaliarRegraJukebox(payload) {
    // Firebase strips null values — simulate by removing them
    const dados = {};
    for (const [k, v] of Object.entries(payload)) {
        if (v !== null && v !== undefined) dados[k] = v;
    }

    // Top-level: newData.hasChildren(['playing'])
    if (!('playing' in dados)) return false;

    // playing: newData.isBoolean()
    if (typeof dados.playing !== 'boolean') return false;

    // videoId: !newData.exists() || (newData.isString() && newData.val().length == 11)
    if ('videoId' in dados) {
        if (typeof dados.videoId !== 'string') return false;
        if (dados.videoId.length !== 11) return false;
    }

    // inputUrl: newData.isString() && length <= 200 && (val === '' || matches YouTube regex)
    if ('inputUrl' in dados) {
        if (typeof dados.inputUrl !== 'string') return false;
        if (dados.inputUrl.length > 200) return false;
        if (dados.inputUrl !== '' && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(dados.inputUrl)) return false;
    }

    // $unknown: block extra fields
    const camposPermitidos = new Set(['playing', 'videoId', 'inputUrl']);
    for (const key of Object.keys(dados)) {
        if (!camposPermitidos.has(key)) return false;
    }

    return true;
}

// ==========================================
// JSON structure tests
// ==========================================

describe('database.rules.json — estrutura do no jukebox', () => {
    let rules;

    beforeAll(() => {
        const rulesPath = resolve(__dirname, '../../../database.rules.json');
        const raw = readFileSync(rulesPath, 'utf-8');
        rules = JSON.parse(raw);
    });

    it('o arquivo e JSON valido e possui a chave raiz "rules"', () => {
        expect(rules).toBeDefined();
        expect(rules).toHaveProperty('rules');
    });

    it('o no jukebox existe dentro de rules', () => {
        expect(rules.rules).toHaveProperty('jukebox');
    });

    it('jukebox tem permissao de leitura publica (.read: true)', () => {
        expect(rules.rules.jukebox['.read']).toBe(true);
    });

    it('jukebox tem permissao de escrita publica (.write: true)', () => {
        expect(rules.rules.jukebox['.write']).toBe(true);
    });

    it('jukebox possui regra .validate que exige playing', () => {
        expect(rules.rules.jukebox['.validate']).toContain("hasChildren(['playing'])");
    });

    it('playing tem validacao de booleano', () => {
        expect(rules.rules.jukebox.playing['.validate']).toContain('isBoolean()');
    });

    it('videoId permite ausencia ou string de 11 chars', () => {
        const validate = rules.rules.jukebox.videoId['.validate'];
        expect(validate).toContain('!newData.exists()');
        expect(validate).toContain('length == 11');
    });

    it('inputUrl valida comprimento e formato YouTube', () => {
        const validate = rules.rules.jukebox.inputUrl['.validate'];
        expect(validate).toContain('length <= 200');
        expect(validate).toContain('youtube');
    });

    it('$unknown bloqueia campos extras', () => {
        expect(rules.rules.jukebox.$unknown['.validate']).toBe(false);
    });
});

// ==========================================
// Happy Path — payloads validos
// ==========================================

describe('jukebox — regra de validacao: happy path', () => {
    it('aceita payload de play completo com videoId, inputUrl e playing: true', () => {
        expect(avaliarRegraJukebox({
            videoId: 'dQw4w9WgXcQ',
            inputUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            playing: true,
        })).toBe(true);
    });

    it('aceita payload de stop sem videoId (null stripped) e playing: false', () => {
        expect(avaliarRegraJukebox({
            videoId: null,
            inputUrl: '',
            playing: false,
        })).toBe(true);
    });

    it('aceita payload apenas com playing: true', () => {
        expect(avaliarRegraJukebox({ playing: true })).toBe(true);
    });

    it('aceita payload apenas com playing: false', () => {
        expect(avaliarRegraJukebox({ playing: false })).toBe(true);
    });

    it('aceita inputUrl vazia (string vazia e valida)', () => {
        expect(avaliarRegraJukebox({
            inputUrl: '',
            playing: true,
        })).toBe(true);
    });

    it('aceita URL do youtu.be', () => {
        expect(avaliarRegraJukebox({
            videoId: 'dQw4w9WgXcQ',
            inputUrl: 'https://youtu.be/dQw4w9WgXcQ',
            playing: true,
        })).toBe(true);
    });

    it('aceita URL do www.youtube.com', () => {
        expect(avaliarRegraJukebox({
            videoId: 'dQw4w9WgXcQ',
            inputUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            playing: true,
        })).toBe(true);
    });
});

// ==========================================
// Edge Cases
// ==========================================

describe('jukebox — regra de validacao: edge cases', () => {
    it('rejeita videoId com 10 caracteres (abaixo do limite)', () => {
        expect(avaliarRegraJukebox({
            videoId: '1234567890',
            playing: true,
        })).toBe(false);
    });

    it('rejeita videoId com 12 caracteres (acima do limite)', () => {
        expect(avaliarRegraJukebox({
            videoId: '123456789012',
            playing: true,
        })).toBe(false);
    });

    it('aceita videoId com exatamente 11 caracteres', () => {
        expect(avaliarRegraJukebox({
            videoId: '12345678901',
            playing: true,
        })).toBe(true);
    });

    it('rejeita inputUrl com 201 caracteres', () => {
        expect(avaliarRegraJukebox({
            inputUrl: 'https://youtube.com/' + 'a'.repeat(181),
            playing: false,
        })).toBe(false);
    });

    it('aceita inputUrl com exatamente 200 caracteres', () => {
        expect(avaliarRegraJukebox({
            inputUrl: 'https://youtube.com/' + 'a'.repeat(180),
            playing: true,
        })).toBe(true);
    });
});

// ==========================================
// Error Cases — payloads invalidos
// ==========================================

describe('jukebox — regra de validacao: error cases', () => {
    it('rejeita payload sem o campo playing', () => {
        expect(avaliarRegraJukebox({
            videoId: 'dQw4w9WgXcQ',
            inputUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        })).toBe(false);
    });

    it('rejeita playing como string "true"', () => {
        expect(avaliarRegraJukebox({ playing: 'true' })).toBe(false);
    });

    it('rejeita playing como numero 1', () => {
        expect(avaliarRegraJukebox({ playing: 1 })).toBe(false);
    });

    it('rejeita playing como null', () => {
        expect(avaliarRegraJukebox({ playing: null })).toBe(false);
    });

    it('rejeita payload vazio', () => {
        expect(avaliarRegraJukebox({})).toBe(false);
    });

    it('rejeita videoId sendo numero', () => {
        expect(avaliarRegraJukebox({ videoId: 12345678901, playing: true })).toBe(false);
    });

    it('rejeita inputUrl sendo numero', () => {
        expect(avaliarRegraJukebox({ inputUrl: 42, playing: false })).toBe(false);
    });

    it('rejeita inputUrl que nao e do YouTube', () => {
        expect(avaliarRegraJukebox({
            inputUrl: 'https://evil.com/malware',
            playing: true,
        })).toBe(false);
    });

    it('rejeita inputUrl HTTP (sem HTTPS)', () => {
        expect(avaliarRegraJukebox({
            inputUrl: 'http://youtube.com/watch?v=abc',
            playing: true,
        })).toBe(false);
    });

    it('rejeita campos extras (simulando $unknown)', () => {
        expect(avaliarRegraJukebox({
            playing: true,
            videoId: 'dQw4w9WgXcQ',
            campoExtra: 'malicioso',
        })).toBe(false);
    });
});
