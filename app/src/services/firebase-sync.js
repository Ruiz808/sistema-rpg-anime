import { ref, set, get, push, remove, onValue, onChildAdded, limitToLast, query } from 'firebase/database';
import { db } from './firebase-config';
import useStore, { sanitizarNome } from '../stores/useStore';

let debounceTimer = null;

export function salvarFichaSilencioso() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        salvarFirebaseImediato();
    }, 500);
}

export function salvarFirebaseImediato() {
    const { minhaFicha, meuNome } = useStore.getState();
    const nomeSanitizado = sanitizarNome(meuNome);

    if (!nomeSanitizado) {
        console.warn('[Sync] Nome vazio, salvamento cancelado.');
        return Promise.resolve();
    }

    // 🔥 O CLONE DE SACRIFÍCIO: Impede que o Firebase tente mutar o estado congelado do Zustand
    const fichaParaSalvar = JSON.parse(JSON.stringify(minhaFicha));

    try {
        localStorage.setItem('rpgFicha_' + nomeSanitizado, JSON.stringify(fichaParaSalvar));
        localStorage.setItem('rpgNome', nomeSanitizado);
    } catch (err) {
        console.error('[Sync] Erro ao salvar no localStorage:', err);
    }

    if (!db) return Promise.resolve();

    const fichaRef = ref(db, `personagens/${nomeSanitizado}`);
    return set(fichaRef, fichaParaSalvar).catch((err) => {
        console.error('[Sync] Erro ao salvar no Firebase:', err);
    });
}

export async function carregarFichaDoFirebase(nome) {
    const nomeSanitizado = sanitizarNome(nome);
    if (!nomeSanitizado || !db) return null;

    try {
        const fichaRef = ref(db, `personagens/${nomeSanitizado}`);
        const snapshot = await get(fichaRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.error('[Sync] Erro ao carregar do Firebase:', err);
        return null;
    }
}

export function iniciarListenerPersonagens(callback) {
    if (!db) return () => {};

    const personagensRef = ref(db, 'personagens');
    // Retorna o unsubscribe garantindo que não haverá memory leak
    return onValue(personagensRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de personagens:', err);
    });
}

export function iniciarListenerFeed(callback) {
    if (!db) return () => {};

    const feedRef = query(ref(db, 'feed_combate'), limitToLast(1));
    return onChildAdded(feedRef, (snapshot) => {
        const entry = snapshot.val();
        if (entry && callback) callback(entry);
    }, (err) => {
        console.error('[Sync] Erro no listener de feed:', err);
    });
}

export function enviarParaFeed(d) {
    if (!db) return;

    const feedRef = ref(db, 'feed_combate');
    push(feedRef, d).catch((err) => {
        console.error('[Sync] Erro ao enviar para feed:', err);
    });
}

export async function deletarPersonagem(nome) {
    const nomeSanitizado = sanitizarNome(nome);
    if (!nomeSanitizado) return;

    try {
        localStorage.removeItem('rpgFicha_' + nomeSanitizado);
    } catch (err) {
        console.error('[Sync] Erro ao remover do localStorage:', err);
    }

    if (!db) return;

    try {
        const personagemRef = ref(db, `personagens/${nomeSanitizado}`);
        await remove(personagemRef);
    } catch (err) {
        console.error('[Sync] Erro ao deletar do Firebase:', err);
    }
}