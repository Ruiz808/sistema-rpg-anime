import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
// 🔥 1. Importamos o Functions aqui:
import { getFunctions } from 'firebase/functions';

// ⚠️ COLE AS SUAS CHAVES REAIS AQUI DENTRO:
const firebaseConfig = {
apiKey: "AIzaSyDJnV8y4fLq3QhuWcPiJsVOszDR3MRNz0Q",
  authDomain: "databaserpg-5595b.firebaseapp.com",
  databaseURL: "https://databaserpg-5595b-default-rtdb.firebaseio.com",
  projectId: "databaserpg-5595b",
  storageBucket: "databaserpg-5595b.firebasestorage.app",
  messagingSenderId: "1027188876320",
  appId: "1:1027188876320:web:a5b588228ddbc1749cc845"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as ferramentas para o resto do site usar
export const db = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// 🔥 2. Exportamos o motor de Functions para o Mapa parar de chorar:
export const functions = getFunctions(app);