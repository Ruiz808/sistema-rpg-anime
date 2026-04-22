import { ref, set, get, push, remove, onValue, onChildAdded, limitToLast, query } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase-config';
import useStore, { sanitizarNome } from '../stores/useStore';

let _modoPlasmic = false;

export function setModoPlasmic(ativo) { _modoPlasmic = ativo; }
function isInPlasmicCanvas() { return _modoPlasmic; }

let debounceTimer = null;

export function salvarFichaSilencioso() {
    if (isInPlasmicCanvas()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        salvarFirebaseImediato().catch(() => { });
    }, 500);
}

// 🔥 INJEÇÃO DE MESA EM TODOS OS SALVAMENTOS 🔥
export function salvarFirebaseImediato() {
    if (isInPlasmicCanvas()) return Promise.resolve();
    const { minhaFicha, meuNome, mesaId } = useStore.getState();
    const nomeSanitizado = sanitizarNome(meuNome);

    if (!nomeSanitizado || !mesaId) return Promise.resolve(); // Proteção

    const fichaParaSalvar = JSON.parse(JSON.stringify(minhaFicha));

    try { localStorage.setItem(`rpg_ficha_${meuNome}`, JSON.stringify(fichaParaSalvar)); } catch (e) {}

    if (!db) return Promise.resolve();

    const dbRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
    return set(dbRef, fichaParaSalvar).catch((err) => {
        console.error('[Sync] Erro ao salvar:', err);
    });
}

export async function carregarFichaDoFirebase(nomeReal) {
    if (isInPlasmicCanvas()) return null;
    if (!db) return null;
    const { mesaId } = useStore.getState();
    if (!mesaId) return null;

    const nomeSanitizado = sanitizarNome(nomeReal);
    try {
        const dbRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log('[Sync] Ficha não encontrada na mesa. Retornando null.');
            return null;
        }
    } catch (err) {
        console.error('[Sync] Erro ao ler ficha do Firebase:', err);
        return null;
    }
}

export function iniciarListenerPersonagens(callback) {
    if (isInPlasmicCanvas()) return () => {};
    if (!db) return () => {};
    const { mesaId } = useStore.getState();
    if (!mesaId) return () => {};

    const personagensRef = ref(db, `mesas/${mesaId}/personagens`);
    return onValue(personagensRef, (snapshot) => {
        const data = snapshot.val();
        if (data && callback) callback(data);
    }, (err) => {
        console.error('[Sync] Erro listener personagens:', err);
    });
}

export function enviarParaFeed(entry) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const feedRef = ref(db, `mesas/${mesaId}/feed`);
    const novaRef = push(feedRef);
    return set(novaRef, entry).catch(err => console.error('[Sync] Erro enviar feed:', err));
}

export function iniciarListenerFeed(callback) {
    if (isInPlasmicCanvas()) return () => {};
    if (!db) return () => {};
    const { mesaId } = useStore.getState();
    if (!mesaId) return () => {};

    const feedQuery = query(ref(db, `mesas/${mesaId}/feed`), limitToLast(50));
    return onChildAdded(feedQuery, (snapshot) => {
        if (callback) callback(snapshot.val());
    }, (err) => {
        console.error('[Sync] Erro listener feed:', err);
    });
}

export function limparFeed() {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const feedRef = ref(db, `mesas/${mesaId}/feed`);
    return remove(feedRef).catch(err => console.error('[Sync] Erro limpar feed:', err));
}

export function salvarCenarioCompleto(dadosCenario) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const cenarioRef = ref(db, `mesas/${mesaId}/cenario`);
    return set(cenarioRef, dadosCenario).catch(err => console.error('[Sync] Erro salvar cenario:', err));
}

export function iniciarListenerCenario(callbackCenario, callbackDummies) {
    if (isInPlasmicCanvas()) return { unsubCenario: ()=>{}, unsubDummies: ()=>{} };
    if (!db) return { unsubCenario: ()=>{}, unsubDummies: ()=>{} };
    const { mesaId } = useStore.getState();
    if (!mesaId) return { unsubCenario: ()=>{}, unsubDummies: ()=>{} };

    const cenarioRef = ref(db, `mesas/${mesaId}/cenario`);
    const unsubCenario = onValue(cenarioRef, (snapshot) => {
        if (callbackCenario) callbackCenario(snapshot.val() || { mapaAtual: '', tokensOcultos: [], escala: 1.5, unidade: 'm', zonas: [] });
    });

    const dummiesRef = ref(db, `mesas/${mesaId}/cenario/dummies`);
    const unsubDummies = onValue(dummiesRef, (snapshot) => {
        if (callbackDummies) callbackDummies(snapshot.val() || {});
    });

    return { unsubCenario, unsubDummies };
}

export function salvarDummie(id, dummieData) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const dummieRef = ref(db, `mesas/${mesaId}/cenario/dummies/${id}`);
    return set(dummieRef, dummieData).catch(err => console.error('[Sync] Erro salvar dummie:', err));
}

export function deletarDummie(id) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const dummieRef = ref(db, `mesas/${mesaId}/cenario/dummies/${id}`);
    return remove(dummieRef).catch(err => console.error('[Sync] Erro deletar dummie:', err));
}

export async function uploadImagem(file, pathFolder = 'uploads') {
    if (isInPlasmicCanvas()) return '';
    if (!storage) return '';
    const { mesaId } = useStore.getState();
    if (!mesaId) return '';

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fullPath = `mesas/${mesaId}/${pathFolder}/${safeName}`;
    const sRef = storageRef(storage, fullPath);
    await uploadBytes(sRef, file);
    return await getDownloadURL(sRef);
}

export function deletarPersonagem(nomeReal) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const nomeSanitizado = sanitizarNome(nomeReal);
    const charRef = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}`);
    return remove(charRef).catch(err => console.error('[Sync] Erro deletar personagem:', err));
}
export const apagarFicha = deletarPersonagem;

export function zerarIniciativaGlobal(nomesArray) {
    if (isInPlasmicCanvas()) return;
    if (!db) return;
    const { mesaId } = useStore.getState();
    if (!mesaId) return;

    nomesArray.forEach(nome => {
        const nomeSanitizado = sanitizarNome(nome);
        const refIni = ref(db, `mesas/${mesaId}/personagens/${nomeSanitizado}/iniciativa`);
        set(refIni, 0).catch(err => console.error('[Sync] Erro ao zerar iniciativa:', err));
    });
}

// 🔥 TEMAS (Agora são únicos por Mesa!) 🔥
export function iniciarListenerTemasCustom(callback) {
    if (isInPlasmicCanvas()) return () => {};
    if (!db) return () => {};
    const { mesaId } = useStore.getState();
    if (!mesaId) return () => {};

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
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const temaRef = ref(db, `mesas/${mesaId}/temas/${id}`);
    return set(temaRef, dadosTema).catch((err) => {
        console.error('[Sync] Erro ao salvar tema no Firebase:', err);
    });
}

export function deletarTemaFirebase(id) {
    if (isInPlasmicCanvas()) return Promise.resolve();
    if (!db) return Promise.resolve();
    const { mesaId } = useStore.getState();
    if (!mesaId) return Promise.resolve();

    const temaRef = ref(db, `mesas/${mesaId}/temas/${id}`);
    return remove(temaRef).catch((err) => {
        console.error('[Sync] Erro ao deletar tema no Firebase:', err);
    });
}