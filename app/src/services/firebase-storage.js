import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase-config';

const TAMANHO_MAX = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function validarArquivo(arquivo) {
    if (!arquivo) return 'Nenhum arquivo selecionado.';
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) return 'Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.';
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
    if (!storage) return null;
    try {
        const storageRef = ref(storage, caminho);
        return await getDownloadURL(storageRef);
    } catch (err) {
        console.error('[Storage] Erro ao obter URL:', err);
        return null;
    }
}

export async function deletarImagem(caminho) {
    if (!storage) return;
    try {
        const storageRef = ref(storage, caminho);
        await deleteObject(storageRef);
    } catch (err) {
        console.error('[Storage] Erro ao deletar imagem:', err);
    }
}
