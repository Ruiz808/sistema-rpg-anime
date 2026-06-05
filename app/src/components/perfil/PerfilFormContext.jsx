import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore, { sanitizarNome } from '../../stores/useStore';
import { carregarFichaDoFirebase, salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';
import { ref, onValue, set, get } from 'firebase/database';
import { db, auth } from '../../services/firebase-config';

const PerfilFormContext = createContext(null);

export function usePerfilForm() {
    const ctx = useContext(PerfilFormContext);
    if (!ctx) return null;
    return ctx;
}

export function PerfilFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const meuNome = useStore(s => s.meuNome);
    const setMeuNome = useStore(s => s.setMeuNome);
    const isMestre = useStore(s => s.isMestre);
    const setIsMestre = useStore(s => s.setIsMestre);
    const resetFicha = useStore(s => s.resetFicha);
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha);
    const setPersonagemParaDeletar = useStore(s => s.setPersonagemParaDeletar);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    
    const mesaId = useStore(s => s.mesaId);

    const [nomeInput, setNomeInput] = useState(meuNome || '');
    const [listaLocal, setListaLocal] = useState([]);
    const [uploadingImg, setUploadingImg] = useState(false);

    // ==========================================
    // 🔥 IDENTIDADE BLINDADA DIRETO DO FIREBASE 🔥
    // ==========================================
    const [contaAtual, setContaAtual] = useState(null);
    useEffect(() => {
        // Lê diretamente do motor de autenticação, sobrevive a qualquer recarregamento da página
        const unsub = auth.onAuthStateChanged(u => {
            if (u && u.email) setContaAtual(sanitizarNome(u.email.split('@')[0]));
        });
        return () => unsub();
    }, []);

    // ==========================================
    // 🔥 RADAR DE IDENTIDADE: FUSÃO DA NUVEM COM LOCAL 🔥
    // ==========================================
    useEffect(() => {
        // Função rápida para ler o disco local
        const carregarLocal = () => {
            const local = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('rpgFicha_')) local.push(k.replace('rpgFicha_', ''));
            }
            return local;
        };

        // Se a Nuvem ainda está a carregar, mostra o que tem no PC para a tela nunca ficar vazia
        if (!contaAtual || !mesaId) {
            setListaLocal(carregarLocal());
            return;
        }

        const refHistorico = ref(db, `usuarios/${contaAtual}/historicoPersonagens_${mesaId}`);

        const unsub = onValue(refHistorico, (snap) => {
            let nuvemLista = snap.exists() ? snap.val() : [];
            if (!Array.isArray(nuvemLista)) nuvemLista = Object.values(nuvemLista);

            const localLista = carregarLocal();

            // Unifica as realidades e remove duplicatas
            const listaUnificada = [...new Set([...nuvemLista, ...localLista])];

            // Atualiza a Nuvem automaticamente se o jogador tiver personagens locais antigos
            if (listaUnificada.length > nuvemLista.length) {
                set(refHistorico, listaUnificada).catch(()=>{});
            }

            setListaLocal(listaUnificada);
        });
        return () => unsub();
    }, [contaAtual, mesaId]);

    useEffect(() => { setNomeInput(meuNome || ''); }, [meuNome]);

    const processarCarregamento = useCallback(async (nomeCru) => {
        const n = sanitizarNome(nomeCru);
        if (!n || (n === 'Jogador' && nomeCru.trim() === '')) return;
        
        setMeuNome(n); 
        localStorage.setItem('rpgNome', n); 
        resetFicha();

        // 1. Tenta carregar do LocalStorage
        let dadosEncontrados = null;
        const bl = localStorage.getItem('rpgFicha_' + n);
        if (bl) { 
            try { 
                dadosEncontrados = JSON.parse(bl);
                carregarDadosFicha(dadosEncontrados); 
            } catch (e) {} 
        }
        
        // 2. Busca na Nuvem e SOBRESCREVE o local para manter as coisas atualizadas
        const dadosNuven = await carregarFichaDoFirebase(n);
        if (dadosNuven && Object.keys(dadosNuven).length > 2) {
            carregarDadosFicha(dadosNuven);
            // 🔥 A CORREÇÃO: Força o salvamento no computador para aparecer na lista IMEDIATAMENTE
            localStorage.setItem('rpgFicha_' + n, JSON.stringify(dadosNuven));
        }

        // 3. REGISTRA A POSSE NO HISTÓRICO DA NUVEM IMEDIATAMENTE 🔥
        if (contaAtual && mesaId) {
            const refHistorico = ref(db, `usuarios/${contaAtual}/historicoPersonagens_${mesaId}`);
            get(refHistorico).then(snap => {
                let lista = snap.exists() ? snap.val() : [];
                if (!Array.isArray(lista)) lista = Object.values(lista);
                // Coloca o personagem carregado no topo da lista e garante que não há duplicados
                lista = [n, ...lista.filter(x => x !== n)].slice(0, 20);
                set(refHistorico, lista).catch(()=>{});
            });
        }

        // Força a atualização da lista visual na hora
        setListaLocal(prev => [...new Set([n, ...prev])]);
        setAbaAtiva('aba-status');
    }, [setMeuNome, resetFicha, carregarDadosFicha, setAbaAtiva, contaAtual, mesaId]);

    const trocarPersonagem = useCallback(() => processarCarregamento(nomeInput), [nomeInput, processarCarregamento]);
    const carregarPersonagemExistente = useCallback((n) => { setNomeInput(n); processarCarregamento(n); }, [processarCarregamento]);
    const abrirModalDelete = useCallback((n) => setPersonagemParaDeletar(n), [setPersonagemParaDeletar]);

    const toggleMestre = useCallback(() => {
        const novoVal = !isMestre;
        setIsMestre(novoVal); localStorage.setItem('rpgIsMestre', novoVal ? 'sim' : 'nao');
    }, [isMestre, setIsMestre]);

    const alterarAvatarBase = useCallback((e) => {
        updateFicha(ficha => { if (!ficha.avatar) ficha.avatar = { base: "" }; ficha.avatar.base = e.target.value; });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const handleImageUpload = useCallback(async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadingImg(true);
        try {
            const url = await uploadImagem(file, `avatars/${meuNome || 'desconhecido'}`);
            updateFicha(ficha => { if (!ficha.avatar) ficha.avatar = { base: "" }; ficha.avatar.base = url; });
            await salvarFirebaseImediato();
        } catch (err) { alert('Erro ao sincronizar o avatar!'); } 
        finally { setUploadingImg(false); }
    }, [meuNome, updateFicha]);

    const value = useMemo(() => ({ minhaFicha, meuNome, isMestre, nomeInput, setNomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload }), [ minhaFicha, meuNome, isMestre, nomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload ]);
    return <PerfilFormContext.Provider value={value}>{children}</PerfilFormContext.Provider>;
}