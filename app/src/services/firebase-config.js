import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyDJnV8y4fLq3QhuWcPiJsVOszDR3MRNz0Q",
    authDomain: "databaserpg-5595b.firebaseapp.com",
    databaseURL: "https://databaserpg-5595b-default-rtdb.firebaseio.com",
    projectId: "databaserpg-5595b",
    storageBucket: "databaserpg-5595b.firebasestorage.app",
    messagingSenderId: "1027188876320",
    appId: "1:1027188876320:web:a5b588228ddbc1749cc845"
};

let app = null;
let db = null;
let storage = null;
let functions = null;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    storage = getStorage(app);
    functions = getFunctions(app);
} catch (err) {
    console.error('[Firebase] Erro ao inicializar:', err);
}

export { db, storage, app, functions };
export const database = getDatabase(app);