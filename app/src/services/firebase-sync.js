import { ref, set, get, push, remove, onValue, onChildAdded, limitToLast, query } from 'firebase/database';
import { db } from './firebase-config';
import useStore from '../stores/useStore';
import { sanitizarNome } from '../stores/useStore';

let debounceTimer = null;

/**
 * Salva a ficha no localStorage e Firebase com debounce de 500ms.
 */
export function salvarFichaSilencioso() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        salvarFirebaseImediato();
    }, 500);
}

/**
 * Salva a ficha imediatamente no localStorage e Firebase.
 */
export function salvarFirebaseImediato() {
    const { minhaFicha, meuNome } = useStore.getState();
    const nomeSanitizado = sanitizarNome(meuNome);

    if (!nomeSanitizado) {
        console.warn('[Sync] Nome vazio, salvamento cancelado.');
        return;
    }

    // Save to localStorage
    try {
        localStorage.setItem('rpgFicha_' + nomeSanitizado, JSON.stringify(minhaFicha));
        localStorage.setItem('rpgNome', nomeSanitizado);
    } catch (err) {
        console.error('[Sync] Erro ao salvar no localStorage:', err);
    }

    // Save to Firebase
    if (!db) return Promise.resolve();

    const fichaRef = ref(db, 'personagens/' + nomeSanitizado);
    return set(fichaRef, minhaFicha).catch((err) => {
        console.error('[Sync] Erro ao salvar no Firebase:', err);
    });
}

/**
 * Carrega uma ficha do Firebase (leitura única).
 * @param {string} nome - Nome do personagem
 * @returns {Promise<Object|null>} Dados da ficha ou null
 */
export async function carregarFichaDoFirebase(nome) {
    const nomeSanitizado = sanitizarNome(nome);
    if (!nomeSanitizado || !db) return null;

    try {
        const fichaRef = ref(db, 'personagens/' + nomeSanitizado);
        const snapshot = await get(fichaRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (err) {
        console.error('[Sync] Erro ao carregar do Firebase:', err);
        return null;
    }
}

/**
 * Inicia listener real-time em /personagens.
 * @param {function} callback - Chamado com o objeto de personagens a cada mudança
 * @returns {function} Função para cancelar o listener (unsubscribe)
 */
export function iniciarListenerPersonagens(callback) {
    if (!db) return () => {};

    const personagensRef = ref(db, 'personagens');
    const unsubscribe = onValue(personagensRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de personagens:', err);
    });

    return unsubscribe;
}

/**
 * Inicia listener no feed de combate (último item adicionado).
 * @param {function} callback - Chamado com cada nova entrada do feed
 * @returns {function} Função para cancelar o listener (unsubscribe)
 */
export function iniciarListenerFeed(callback) {
    if (!db) return () => {};

    const feedRef = query(ref(db, 'feed_combate'), limitToLast(1));
    const unsubscribe = onChildAdded(feedRef, (snapshot) => {
        const entry = snapshot.val();
        if (entry && callback) callback(entry);
    }, (err) => {
        console.error('[Sync] Erro no listener de feed:', err);
    });

    return unsubscribe;
}

/**
 * Envia uma entrada para o feed de combate.
 * @param {Object} d - Dados da entrada do feed
 */
export function enviarParaFeed(d) {
    if (!db) return;

    const feedRef = ref(db, 'feed_combate');
    push(feedRef, d).catch((err) => {
        console.error('[Sync] Erro ao enviar para feed:', err);
    });
}

/**
 * Deleta um personagem do Firebase e localStorage.
 * @param {string} nome - Nome do personagem a deletar
 */
export async function deletarPersonagem(nome) {
    const nomeSanitizado = sanitizarNome(nome);
    if (!nomeSanitizado) return;

    // Remove from localStorage
    try {
        localStorage.removeItem('rpgFicha_' + nomeSanitizado);
    } catch (err) {
        console.error('[Sync] Erro ao remover do localStorage:', err);
    }

    // Remove from Firebase
    if (!db) return;

    try {
        const personagemRef = ref(db, 'personagens/' + nomeSanitizado);
        await remove(personagemRef);
    } catch (err) {
        console.error('[Sync] Erro ao deletar do Firebase:', err);
    }
}
