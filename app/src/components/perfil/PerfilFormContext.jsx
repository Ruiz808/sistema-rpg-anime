import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore, { sanitizarNome } from '../../stores/useStore';
import { carregarFichaDoFirebase, salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';
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
    
    // Novas variáveis puxadas do Cérebro para a mágica da Nuvem
    const mesaId = useStore(s => s.mesaId);
    const userLogado = useStore(s => s.userLogado);

    const [nomeInput, setNomeInput] = useState(meuNome || '');
    const [listaLocal, setListaLocal] = useState([]);
    const [uploadingImg, setUploadingImg] = useState(false);

    // ==========================================
    // 🔥 RADAR DE IDENTIDADE: HISTÓRICO PESSOAL NA NUVEM 🔥
    // ==========================================
    useEffect(() => {
        if (!userLogado || !mesaId) return;
        const refHistorico = ref(db, `usuarios/${sanitizarNome(userLogado)}/historicoPersonagens_${mesaId}`);

        const unsub = onValue(refHistorico, (snap) => {
            if (snap.exists()) {
                setListaLocal(snap.val());
            } else {
                // 🚀 MIGRAÇÃO AUTOMÁTICA (Web -> Nuvem)
                // Se não houver histórico na nuvem, ele procura no navegador e envia para o Firebase!
                const nomesMigrados = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('rpgFicha_')) nomesMigrados.push(k.replace('rpgFicha_', ''));
                }
                if (nomesMigrados.length > 0) {
                    set(refHistorico, nomesMigrados).catch(()=>{});
                    setListaLocal(nomesMigrados);
                } else {
                    setListaLocal([]);
                }
            }
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

        // 📝 REGISTAR POSSE: Adiciona o personagem ao histórico do jogador na Nuvem
        if (userLogado && mesaId) {
            const refHistorico = ref(db, `usuarios/${sanitizarNome(userLogado)}/historicoPersonagens_${mesaId}`);
            get(refHistorico).then(snap => {
                let lista = snap.exists() ? snap.val() : [];
                lista = [n, ...lista.filter(x => x !== n)].slice(0, 15); // Guarda os últimos 15
                set(refHistorico, lista).catch(()=>{});
            });
        }
        
        // Tenta carregar do localStorage (apenas como fallback de milissegundos)
        const bl = localStorage.getItem('rpgFicha_' + n);
        if (bl) { try { carregarDadosFicha(JSON.parse(bl)); } catch (e) {} }
        
        // Força a busca da Ficha atualizada diretamente do Firebase!
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
        } catch (err) { alert('Erro ao sincronizar o avatar! O upload pode ter falhado ou o Firebase rejeitou o salvamento.'); } 
        finally { setUploadingImg(false); }
    }, [meuNome, updateFicha]);

    const value = useMemo(() => ({ minhaFicha, meuNome, isMestre, nomeInput, setNomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload }), [ minhaFicha, meuNome, isMestre, nomeInput, listaLocal, uploadingImg, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, toggleMestre, alterarAvatarBase, handleImageUpload ]);
    return <PerfilFormContext.Provider value={value}>{children}</PerfilFormContext.Provider>;
}