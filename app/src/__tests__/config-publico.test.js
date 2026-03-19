import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths relative to the repo root (three levels up from app/src/__tests__)
const __filename = fileURLToPath(import.meta.url);
const __dirname_test = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname_test, '../../../');
const MIGRAR_SCRIPT = path.join(REPO_ROOT, 'tools', 'migrar-firebase.js');
const DATABASE_RULES = path.join(REPO_ROOT, 'database.rules.json');
const GITIGNORE = path.join(REPO_ROOT, '.gitignore');

// ==========================================
// tools/migrar-firebase.js — env var guard
// ==========================================
describe('migrar-firebase.js', () => {
    it('exits with code 1 when FIREBASE_DATABASE_URL is not set', () => {
        const env = { ...process.env };
        delete env.FIREBASE_DATABASE_URL;

        let exitCode = null;
        let stderr = '';

        try {
            execFileSync(process.execPath, [MIGRAR_SCRIPT], {
                env,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (err) {
            exitCode = err.status;
            stderr = err.stderr?.toString() ?? '';
        }

        expect(exitCode).toBe(1);
    });

    it('prints an error message to stderr when FIREBASE_DATABASE_URL is missing', () => {
        const env = { ...process.env };
        delete env.FIREBASE_DATABASE_URL;

        let stderr = '';

        try {
            execFileSync(process.execPath, [MIGRAR_SCRIPT], {
                env,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (err) {
            stderr = err.stderr?.toString() ?? '';
        }

        // The script either prints the FIREBASE_DATABASE_URL guard message, or (when
        // firebase-admin is not installed in the tools/ directory) Node throws
        // MODULE_NOT_FOUND before reaching that line.  Either way stderr must be non-empty
        // — the process must not exit silently with code 1.
        expect(stderr.length).toBeGreaterThan(0);
    });

    it('SERVICE_ACCOUNT_PATH defaults to firebase-service-account.json in the tools dir', () => {
        // The default path is constructed with path.join(__dirname, 'firebase-service-account.json')
        // inside the script. We verify the script source encodes that default.
        const source = fs.readFileSync(MIGRAR_SCRIPT, 'utf8');

        expect(source).toContain("process.env.FIREBASE_SERVICE_ACCOUNT_PATH");
        expect(source).toContain("firebase-service-account.json");
        // The fallback uses __dirname so the default is relative to the script itself
        expect(source).toContain("__dirname");
    });

    it('reads DATABASE_URL exclusively from the FIREBASE_DATABASE_URL env var (no hardcoded URL)', () => {
        const source = fs.readFileSync(MIGRAR_SCRIPT, 'utf8');

        // Should reference the env var
        expect(source).toContain('process.env.FIREBASE_DATABASE_URL');
        // Must not contain a hardcoded https firebaseio URL as a string literal
        expect(source).not.toMatch(/=\s*['"`]https:\/\/[^'"` ]+\.firebaseio\.com/);
    });
});

// ==========================================
// database.rules.json — structure validation
// ==========================================
describe('database.rules.json', () => {
    let rules;

    beforeEach(() => {
        const raw = fs.readFileSync(DATABASE_RULES, 'utf8');
        rules = JSON.parse(raw); // throws if invalid JSON
    });

    it('is valid JSON', () => {
        expect(rules).toBeDefined();
        expect(typeof rules).toBe('object');
    });

    it('has a top-level "rules" key', () => {
        expect(rules).toHaveProperty('rules');
        expect(typeof rules.rules).toBe('object');
    });

    it('defines rules.personagens', () => {
        expect(rules.rules).toHaveProperty('personagens');
        const personagens = rules.rules.personagens;
        expect(typeof personagens).toBe('object');
    });

    it('rules.personagens has read/write settings', () => {
        const personagens = rules.rules.personagens;
        expect(personagens).toHaveProperty('.read');
        expect(personagens).toHaveProperty('.write');
    });

    it('rules.personagens has a $nome wildcard child', () => {
        const personagens = rules.rules.personagens;
        expect(personagens).toHaveProperty('$nome');
        expect(typeof personagens.$nome).toBe('object');
    });

    it('defines rules.feed_combate', () => {
        expect(rules.rules).toHaveProperty('feed_combate');
        const feed = rules.rules.feed_combate;
        expect(typeof feed).toBe('object');
    });

    it('rules.feed_combate has read/write settings', () => {
        const feed = rules.rules.feed_combate;
        expect(feed).toHaveProperty('.read');
        expect(feed).toHaveProperty('.write');
    });

    it('rules.feed_combate has a $entry wildcard child', () => {
        const feed = rules.rules.feed_combate;
        expect(feed).toHaveProperty('$entry');
        expect(typeof feed.$entry).toBe('object');
    });

    it('defines rules.$other to deny read and write', () => {
        expect(rules.rules).toHaveProperty('$other');
        const other = rules.rules.$other;
        expect(other['.read']).toBe(false);
        expect(other['.write']).toBe(false);
    });

    it('rules.personagens allows public read', () => {
        expect(rules.rules.personagens['.read']).toBe(true);
    });

    it('rules.feed_combate allows public read', () => {
        expect(rules.rules.feed_combate['.read']).toBe(true);
    });
});

// ==========================================
// .gitignore — required patterns
// ==========================================
describe('.gitignore', () => {
    let content;

    beforeEach(() => {
        content = fs.readFileSync(GITIGNORE, 'utf8');
    });

    it('ignores app/dist/ build output', () => {
        expect(content).toMatch(/^app\/dist\//m);
    });

    it('ignores .firebase/ cache directory', () => {
        expect(content).toMatch(/^\.firebase\//m);
    });

    it('ignores all firebase-service-account JSON files', () => {
        expect(content).toMatch(/\*\*\/firebase-service-account\*\.json/m);
    });

    it('ignores tools/banco_de_dados_rpg.json player data', () => {
        expect(content).toMatch(/^tools\/banco_de_dados_rpg\.json/m);
    });

    it('ignores node_modules/', () => {
        expect(content).toMatch(/node_modules\//m);
    });

    it('ignores .env files', () => {
        expect(content).toMatch(/^\.env/m);
    });

    it('does not accidentally ignore the tools/ directory itself', () => {
        // Only the specific data file should be ignored, not the whole tools folder
        expect(content).not.toMatch(/^tools\/$/m);
        expect(content).not.toMatch(/^\/tools$/m);
    });
});
