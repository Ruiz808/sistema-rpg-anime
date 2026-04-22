import { ref, set, get, push, remove, onValue, onChildAdded, limitToLast, query } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase-config';
import useStore, { sanitizarNome } from '../stores/useStore';

let _modoPlasmic = false;

export function setModoPlasmic(ativo) {
    _modoPlasmic = ativo;
}

function isInPlasmicCanvas() {
    return _modoPlasmic;
}

let debounceTimer = null;

export function salvarFichaSilencioso() {
    if (isInPlasmicCanvas()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        salvarFirebaseImediato().catch(() => { /* erro ja logado em salvarFirebaseImediato */ });
    }, 500);
}

export function salvarFirebaseImediato() {
    if (isInPlasmicCanvas()) return Promise.resolve();
    const { minhaFicha, meuNome, mesaId } = useStore.getState();
    const nomeSanitizado = sanitizarNome(meuNome);

    // Bloqueia o salvamento se não houver mesa ou nome
    if (!nomeSanitizado || !mesaId) {
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

    const fichaRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
    return set(fichaRef, fichaParaSalvar).catch((err) => {
        console.error('[Sync] Erro ao salvar no Firebase:', err);
        throw err;
    });
}

export async function carregarFichaDoFirebase(nome) {
    if (isInPlasmicCanvas()) return null;
    const nomeSanitizado = sanitizarNome(nome);
    const { mesaId } = useStore.getState();
    
    if (!nomeSanitizado || !db || !mesaId) return null;

    try {
        const fichaRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
        const snapshot = await get(fichaRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.error('[Sync] Erro ao carregar do Firebase:', err);
        return null;
    }
}

export function iniciarListenerPersonagens(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    
    if (!db || !mesaId) return () => {};

    const personagensRef = ref(db, `mesas/${mesaId}/personagens`);
    return onValue(personagensRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de personagens:', err);
    });
}

export function iniciarListenerFeed(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    
    if (!db || !mesaId) return () => {};

    const feedRef = query(ref(db, `mesas/${mesaId}/feed_combate`), limitToLast(50));
    return onChildAdded(feedRef, (snapshot) => {
        const entry = snapshot.val();
        if (entry && callback) callback(entry);
    }, (err) => {
        console.error('[Sync] Erro no listener de feed:', err);
    });
}

export function enviarParaFeed(d) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;

    const feedRef = ref(db, `mesas/${mesaId}/feed_combate`);
    push(feedRef, d).catch((err) => {
        console.error('[Sync] Erro ao enviar para feed:', err);
    });
}

export async function deletarPersonagem(nome) {
    if (isInPlasmicCanvas()) return;
    const nomeSanitizado = sanitizarNome(nome);
    const { mesaId } = useStore.getState();
    
    if (!nomeSanitizado || !mesaId) return;

    try {
        localStorage.removeItem('rpgFicha_' + nomeSanitizado);
    } catch (err) {
        console.error('[Sync] Erro ao remover do localStorage:', err);
    }

    if (!db) return;

    try {
        const personagemRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
        await remove(personagemRef);
    } catch (err) {
        console.error('[Sync] Erro ao deletar do Firebase:', err);
    }
}
export const apagarFicha = deletarPersonagem;

// ==========================================
// 🔥 O JUKEBOX VOLTOU À VIDA! 🔥
// ==========================================
export function enviarParaJukebox(estado) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return Promise.resolve();
    
    const jukeboxRef = ref(db, `mesas/${mesaId}/jukebox`);
    return set(jukeboxRef, estado).catch((err) => {
        console.error('[Sync] Erro ao enviar para jukebox:', err);
    });
}

export function iniciarListenerJukebox(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return () => {};
    
    const jukeboxRef = ref(db, `mesas/${mesaId}/jukebox`);
    return onValue(jukeboxRef, (snapshot) => {
        const dados = snapshot.val() || null;
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener da jukebox:', err);
    });
}

// ==========================================
// 🔥 IMAGENS E DUMMIES 🔥
// ==========================================
export async function uploadImagem(file, pasta = 'imagens') {
    if (isInPlasmicCanvas()) return '';
    const { mesaId } = useStore.getState();
    
    if (!storage || !mesaId) throw new Error("Firebase Storage não está inicializado ou Mesa indefinida.");
    const extensao = file.name.split('.').pop();
    const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extensao}`;
    const caminhoRef = storageRef(storage, `mesas/${mesaId}/${pasta}/${nomeUnico}`);
    
    await uploadBytes(caminhoRef, file);
    const downloadUrl = await getDownloadURL(caminhoRef);
    return downloadUrl;
}

export function iniciarListenerDummies(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return () => {};
    
    const dummiesRef = ref(db, `mesas/${mesaId}/dummies`);
    return onValue(dummiesRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de dummies:', err);
    });
}

export function salvarDummie(id, dadosDummie) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;
    
    const dummieRef = ref(db, `mesas/${mesaId}/dummies/${id}`);
    set(dummieRef, dadosDummie).catch((err) => {
        console.error('[Sync] Erro ao salvar Dummie:', err);
    });
}

export function deletarDummie(id) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;
    
    const dummieRef = ref(db, `mesas/${mesaId}/dummies/${id}`);
    remove(dummieRef).catch((err) => {
        console.error('[Sync] Erro ao deletar Dummie:', err);
    });
}

// ==========================================
// 🔥 CENÁRIOS E MAPAS 🔥
// ==========================================
export function iniciarListenerCenario(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return () => {};
    
    const cenarioRef = ref(db, `mesas/${mesaId}/cenario`);
    return onValue(cenarioRef, (snapshot) => {
        const dados = snapshot.val() || { ativa: 'default', lista: { default: { nome: 'Cenário Inicial', img: '', escala: 1.5, unidade: 'm' } } };
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de cenario:', err);
    });
}

export function salvarCenarioCompleto(dadosCenario) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;
    
    const cenarioRef = ref(db, `mesas/${mesaId}/cenario`);
    set(cenarioRef, dadosCenario).catch(err => console.error('[Sync] Erro ao salvar Cenario:', err));
}

export function zerarIniciativaGlobal(nomesArray) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;
    
    nomesArray.forEach(nome => {
        const nomeSanitizado = sanitizarNome(nome);
        const refIni = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}/iniciativa`);
        set(refIni, 0).catch(err => console.error('[Sync] Erro ao zerar iniciativa:', err));
    });
}

// ==========================================
// 🔥 TEMAS CUSTOMIZADOS 🔥
// ==========================================
export function iniciarListenerTemasCustom(callback) {
    if (isInPlasmicCanvas()) return () => {};
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return () => {};

    const temasRef = ref(db, `mesas/${mesaId}/temas`);
    return onValue(temasRef, (snapshot) => {
        const dados = snapshot.val() || {};
        if (callback) callback(dados);
    }, (err) => {
        console.error('[Sync] Erro no listener de temas:', err);
    });
}

export function salvarTemaFirebase(id, dadosTema) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return Promise.resolve();

    const temaRef = ref(db, `mesas/${mesaId}/temas/${id}`);
    return set(temaRef, dadosTema).catch((err) => {
        console.error('[Sync] Erro ao salvar tema no Firebase:', err);
        throw err;
    });
}

export function deletarTemaFirebase(id) {
    if (isInPlasmicCanvas()) return;
    const { mesaId } = useStore.getState();
    if (!db || !mesaId) return;

    const temaRef = ref(db, `mesas/${mesaId}/temas/${id}`);
    remove(temaRef).catch((err) => {
        console.error('[Sync] Erro ao deletar tema do Firebase:', err);
    });
}