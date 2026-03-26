import { ref, set, get, push, remove, onValue, onChildAdded, limitToLast, query } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase-config';
import useStore, { sanitizarNome } from '../stores/useStore';

let debounceTimer = null;

export function salvarFichaSilencioso() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        salvarFirebaseImediato().catch(() => { /* erro ja logado em salvarFirebaseImediato */ });
    }, 500);
}

export function salvarFirebaseImediato() {
    const { minhaFicha, meuNome } = useStore.getState();
    const nomeSanitizado = sanitizarNome(meuNome);

    if (!nomeSanitizado) {
        console.warn('[Sync] Nome vazio, salvamento cancelado.');
        return Promise.resolve();
    }

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
        throw err;
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

export function enviarParaJukebox(estado) {
    if (!db) return;
    const jukeboxRef = ref(db, 'jukebox');
    set(jukeboxRef, estado).catch((err) => {
        console.error('[Sync] Erro ao enviar para jukebox:', err);
    });
}

export function iniciarListenerJukebox(callback) {
    if (!db) return () => {};
    const jukeboxRef = ref(db, 'jukebox');
    return onValue(jukeboxRef, (snapshot) => {
        const dados = snapshot.val() || null;
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener da jukebox:', err);
    });
}

export async function uploadImagem(file, pasta = 'imagens') {
    if (!storage) throw new Error("Firebase Storage não está inicializado.");
    const extensao = file.name.split('.').pop();
    const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extensao}`;
    const caminhoRef = storageRef(storage, `${pasta}/${nomeUnico}`);
    await uploadBytes(caminhoRef, file);
    const downloadUrl = await getDownloadURL(caminhoRef);
    return downloadUrl;
}

// 🔥 MOTOR DE SINCRONIZAÇÃO DOS DUMMIES (ALVOS DE TREINO)
export function iniciarListenerDummies(callback) {
    if (!db) return () => {};
    const dummiesRef = ref(db, 'dummies');
    return onValue(dummiesRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de dummies:', err);
    });
}

export function salvarDummie(id, dadosDummie) {
    if (!db) return;
    const dummieRef = ref(db, `dummies/${id}`);
    set(dummieRef, dadosDummie).catch((err) => {
        console.error('[Sync] Erro ao salvar Dummie:', err);
    });
}

export function deletarDummie(id) {
    if (!db) return;
    const dummieRef = ref(db, `dummies/${id}`);
    remove(dummieRef).catch((err) => {
        console.error('[Sync] Erro ao deletar Dummie:', err);
    });
}

// 🔥 MOTOR DE SINCRONIZAÇÃO DE CENAS (MAPAS)
export function iniciarListenerCenario(callback) {
    if (!db) return () => {};
    const cenarioRef = ref(db, 'cenario');
    return onValue(cenarioRef, (snapshot) => {
        const dados = snapshot.val() || { ativa: 'default', lista: { default: { nome: 'Cenário Inicial', img: '', escala: 1.5, unidade: 'm' } } };
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de cenario:', err);
    });
}

export function salvarCenarioCompleto(dadosCenario) {
    if (!db) return;
    const cenarioRef = ref(db, 'cenario');
    set(cenarioRef, dadosCenario).catch(err => console.error('[Sync] Erro ao salvar Cenario:', err));
}

// 🔥 MOTOR DE INICIATIVA GLOBAL
export function zerarIniciativaGlobal(nomesArray) {
    if (!db) return;
    nomesArray.forEach(nome => {
        const nomeSanitizado = sanitizarNome(nome);
        const refIni = ref(db, `personagens/${nomeSanitizado}/iniciativa`);
        set(refIni, 0).catch(err => console.error('[Sync] Erro ao zerar iniciativa:', err));
    });
}