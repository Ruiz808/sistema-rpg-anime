import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase-config';

const TAMANHO_MAX = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function validarArquivo(arquivo) {
    if (!arquivo) return 'Nenhum arquivo selecionado.';
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) return 'Tipo de arquivo nao permitido. Use JPG, PNG, GIF ou WebP.';
    if (arquivo.size > TAMANHO_MAX) return 'Arquivo muito grande. Maximo 5MB.';
    return null;
}

export function uploadImagem(caminho, arquivo, onProgresso) {
    return new Promise((resolve, reject) => {
        const erro = validarArquivo(arquivo);
        if (erro) return reject(new Error(erro));
        if (!storage) return reject(new Error('Firebase Storage nao inicializado.'));

        const storageRef = ref(storage, caminho);
        const uploadTask = uploadBytesResumable(storageRef, arquivo);

        uploadTask.on('state_changed',
            (snapshot) => {
                if (onProgresso) {
                    const progresso = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgresso(Math.round(progresso));
                }
            },
            (error) => reject(error),
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
            }
        );
    });
}

export async function obterUrlImagem(caminho) {
    if (!storage) throw new Error('Firebase Storage nao inicializado.');
    const storageRef = ref(storage, caminho);
    return getDownloadURL(storageRef);
}

export async function deletarImagem(caminho) {
    if (!storage) throw new Error('Firebase Storage nao inicializado.');
    const storageRef = ref(storage, caminho);
    return deleteObject(storageRef);
}
