import { describe, it, expect } from 'vitest';

// Copia local da funcao (nao exportada do MapaPanel)
function urlSeguraParaCss(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '';
    return 'url("' + trimmed.replace(/["\\)]/g, '') + '")';
}

describe('urlSeguraParaCss - Happy Path', () => {
    it('retorna url("...") para URL https valida', () => {
        expect(urlSeguraParaCss('https://example.com/image.png')).toBe('url("https://example.com/image.png")');
    });

    it('retorna url("...") para URL http valida', () => {
        expect(urlSeguraParaCss('http://example.com/image.jpg')).toBe('url("http://example.com/image.jpg")');
    });

    it('retorna url("...") para data:image/ valida', () => {
        expect(urlSeguraParaCss('data:image/png;base64,abc123==')).toBe('url("data:image/png;base64,abc123==")');
    });

    it('remove espacos ao redor da URL', () => {
        expect(urlSeguraParaCss('  https://example.com/img.png  ')).toBe('url("https://example.com/img.png")');
    });
});

describe('urlSeguraParaCss - Edge Cases', () => {
    it('retorna vazio para string vazia', () => {
        expect(urlSeguraParaCss('')).toBe('');
    });

    it('retorna vazio para null', () => {
        expect(urlSeguraParaCss(null)).toBe('');
    });

    it('retorna vazio para undefined', () => {
        expect(urlSeguraParaCss(undefined)).toBe('');
    });

    it('retorna vazio para numero', () => {
        expect(urlSeguraParaCss(42)).toBe('');
    });

    it('retorna vazio para espacos', () => {
        expect(urlSeguraParaCss('   ')).toBe('');
    });
});

describe('urlSeguraParaCss - Security', () => {
    it('bloqueia javascript:', () => {
        expect(urlSeguraParaCss('javascript:alert(1)')).toBe('');
    });

    it('bloqueia data:text/html', () => {
        expect(urlSeguraParaCss('data:text/html,test')).toBe('');
    });

    it('bloqueia URL relativa', () => {
        expect(urlSeguraParaCss('/images/avatar.png')).toBe('');
    });

    it('bloqueia ftp:', () => {
        expect(urlSeguraParaCss('ftp://example.com/file.png')).toBe('');
    });

    it('remove aspas duplas da URL', () => {
        const resultado = urlSeguraParaCss('https://example.com/image"evil".png');
        expect(resultado).toBe('url("https://example.com/imageevil.png")');
    });

    it('remove barra invertida da URL', () => {
        const resultado = urlSeguraParaCss('https://example.com/path\\to\\image.png');
        expect(resultado).not.toContain('\\');
    });

    it('remove parentese de fechamento da URL', () => {
        const resultado = urlSeguraParaCss('https://example.com/image).png');
        expect(resultado).toBe('url("https://example.com/image.png")');
    });

    it('neutraliza CSS injection com aspas e url() aninhado', () => {
        const entrada = '") url("https://evil.com';
        expect(urlSeguraParaCss(entrada)).toBe('');
    });

    it('neutraliza URL https com payload de CSS injection', () => {
        const entrada = 'https://ok.com/img.png") background: url("https://evil.com/x.png';
        const resultado = urlSeguraParaCss(entrada);
        // Extrai o conteudo entre url(" e ") - nao deve conter aspas internas
        const conteudo = resultado.slice(5, -2);
        expect(conteudo).not.toContain('"');
        expect(conteudo).not.toContain(')');
    });
});
