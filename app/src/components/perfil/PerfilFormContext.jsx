import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore, { sanitizarNome } from '../../stores/useStore';
import { carregarFichaDoFirebase, salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem, iniciarListenerPersonagens } from '../../services/firebase-sync';
import { ref, onValue, set, get } from 'firebase/database';
import { db } from '../../services/firebase-config';

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
    const userLogado = useStore(s => s.userLogado);

    const [nomeInput, setNomeInput] = useState(meuNome || '');
    const [listaLocal, setListaLocal] = useState([]);
    const [uploadingImg, setUploadingImg] = useState(false);
    
    // 🔥 NOVO: Armazena temporariamente todos os personagens da sala para o Scanner
    const [todosMesa, setTodosMesa] = useState([]);

    useEffect(() => {
        if (!mesaId) return;
        const unsub = iniciarListenerPersonagens((dados) => {
            setTodosMesa(dados ? Object.keys(dados) : []);
        });
        return () => unsub();
    }, [mesaId]);

    // ==========================================
    // 🔥 RADAR DE IDENTIDADE: FUSÃO DA NUVEM COM LOCAL 🔥
    // ==========================================
    useEffect(() => {
        if (!userLogado || !mesaId) return;
        const refHistorico = ref(db, `usuarios/${sanitizarNome(userLogado)}/historicoPersonagens_${mesaId}`);

        const unsub = onValue(refHistorico, (snap) => {
            let nuvemLista = snap.exists() ? snap.val() : [];
            if (!Array.isArray(nuvemLista)) nuvemLista = Object.values(nuvemLista);

            const localLista = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('rpgFicha_')) localLista.push(k.replace('rpgFicha_', ''));
            }

            const listaUnificada = [...new Set([...nuvemLista, ...localLista])];

            if (listaUnificada.length > nuvemLista.length) {
                set(refHistorico, listaUnificada).catch(()=>{});
            }

            setListaLocal(listaUnificada);
        });
        return () => unsub();
    }, [userLogado, mesaId]);

    useEffect(() => { setNomeInput(meuNome || ''); }, [meuNome]);

    const processarCarregamento = useCallback(async (nomeCru) => {
        const n = sanitizarNome(nomeCru);
        if (!n || (n === 'Jogador' && nomeCru.trim() === '')) return;
        
        setMeuNome(n); 
        localStorage.setItem('rpgNome', n); 
        resetFicha();

        // Regista a posse ao abrir/carregar o personagem
        if (userLogado && mesaId) {
            const refHistorico = ref(db, `usuarios/${sanitizarNome(userLogado)}/historicoPersonagens_${mesaId}`);
            get(refHistorico).then(snap => {
                let lista = snap.exists() ? snap.val() : [];
                if (!Array.isArray(lista)) lista = Object.values(lista);
                lista = [n, ...lista.filter(x => x !== n)].slice(0, 15);
                set(refHistorico, lista).catch(()=>{});
            });
        }
        
        const bl = localStorage.getItem('rpgFicha_' + n);
        if (bl) { try { carregarDadosFicha(JSON.parse(bl)); } catch (e) {} }
        
        const dadosNuven = await carregarFichaDoFirebase(n);
        if (dadosNuven && Object.keys(dadosNuven).length > 2) {
            carregarDadosFicha(dadosNuven);
        }
        
        setAbaAtiva('aba-status');
    }, [setMeuNome, resetFicha, carregarDadosFicha, setAbaAtiva, userLogado, mesaId]);

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

    const value = useMemo(() => ({ minhaFicha, meuNome, isMestre, nomeInput, setNomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload, todosMesa }), [ minhaFicha, meuNome, isMestre, nomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload, todosMesa ]);
    return <PerfilFormContext.Provider value={value}>{children}</PerfilFormContext.Provider>;
}