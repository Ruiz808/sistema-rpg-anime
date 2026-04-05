import { ref, set, get, remove, onValue } from "firebase/database";
import { database } from "./firebase-storage";
import { sanitizarNome } from "../utils/sanitizarNome";

const TEMAS_PATH = "temas";

export async function salvarTema(nome, variaveis) {
  const id = sanitizarNome(nome);
  const temaRef = ref(database, `${TEMAS_PATH}/${id}`);
  await set(temaRef, { nome, variaveis, atualizadoEm: Date.now() });
  return id;
}

export async function listarTemas() {
  const snap = await get(ref(database, TEMAS_PATH));
  if (!snap.exists()) return [];
  const dados = snap.val();
  return Object.entries(dados).map(([id, tema]) => ({ id, ...tema }));
}

export async function deletarTema(id) {
  await remove(ref(database, `${TEMAS_PATH}/${id}`));
}

export async function duplicarTema(id, novoNome) {
  const snap = await get(ref(database, `${TEMAS_PATH}/${id}`));
  if (!snap.exists()) throw new Error("Tema não encontrado");
  const { variaveis } = snap.val();
  return salvarTema(novoNome, variaveis);
}

export function aplicarTema(variaveis) {
  const root = document.documentElement;
  Object.entries(variaveis).forEach(([chave, valor]) => {
    root.style.setProperty(chave, valor);
  });
}

export function observarTemaAtivo(callback) {
  const temaAtivoRef = ref(database, "temaAtivo");
  return onValue(temaAtivoRef, async (snap) => {
    if (!snap.exists()) return;
    const id = snap.val();
    const temaSnap = await get(ref(database, `${TEMAS_PATH}/${id}`));
    if (temaSnap.exists()) {
      const { variaveis } = temaSnap.val();
      aplicarTema(variaveis);
      callback({ id, variaveis });
    }
  });
}

export async function ativarTema(id) {
  await set(ref(database, "temaAtivo"), id);
}
