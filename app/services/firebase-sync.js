// ==========================================
// FIREBASE SYNC — Toda comunicação com Firebase
// ==========================================
import { db } from './firebase-config.js';
import { minhaFicha, meuNome } from '../state/store.js';

let _saveTimer = null;

function fichaLimpa() {
    return JSON.parse(JSON.stringify(minhaFicha));
}

export function salvarFichaSilencioso() {
    try {
        localStorage.setItem("rpgFicha_" + meuNome, JSON.stringify(minhaFicha));
    } catch (e) { }
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
        if (db && meuNome) {
            db.ref('personagens/' + meuNome).set(fichaLimpa())
                .catch(function (e) { console.warn('Firebase save error:', e); });
        }
    }, 500);
}

export function salvarFirebaseImediato() {
    try {
        localStorage.setItem("rpgFicha_" + meuNome, JSON.stringify(minhaFicha));
    } catch (e) { }
    clearTimeout(_saveTimer);
    if (db && meuNome) {
        return db.ref('personagens/' + meuNome).set(fichaLimpa())
            .catch(function (e) { console.warn('Firebase save error:', e); });
    }
    return Promise.resolve();
}

export function carregarFichaDoFirebase(nome) {
    if (!db) return Promise.resolve(null);
    return db.ref('personagens/' + nome).once('value').then(function (snapshot) {
        return snapshot.val();
    }).catch(function (e) {
        console.warn('Firebase load error:', e);
        return null;
    });
}

export function iniciarListenerPersonagens(callback) {
    if (!db) return;
    db.ref('personagens').on('value', function (snapshot) {
        let dados = snapshot.val() || {};
        callback(dados);
    });
}

export function iniciarListenerFeed(callback) {
    if (!db) return;
    db.ref('feed_combate').limitToLast(1).on('child_added', function (snapshot) {
        let d = snapshot.val();
        if (d) callback(d);
    });
}

export function enviarParaFeed(d) {
    if (db) {
        db.ref('feed_combate').push(d).catch(function (e) { console.warn('Firebase feed error:', e); });
    }
    return !db; // retorna true se offline (precisa renderizar local)
}

export function deletarPersonagem(nome) {
    if (db && nome) {
        db.ref('personagens/' + nome).remove().catch(function (e) { console.warn('Firebase delete error:', e); });
    }
    localStorage.removeItem("rpgFicha_" + nome);
}
