import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { sanitizarNome } from '../../stores/useStore';
import { carregarFichaDoFirebase, salvarFichaSilencioso, salvarFirebaseImediato, uploadImagem } from '../../services/firebase-sync';

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

    const [nomeInput, setNomeInput] = useState(meuNome || '');
    const [listaLocal, setListaLocal] = useState([]);
    const [uploadingImg, setUploadingImg] = useState(false);

    const atualizarListaLocal = useCallback(() => {
        const nomes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('rpgFicha_')) {
                nomes.push(k.replace('rpgFicha_', ''));
            }
        }
        setListaLocal(nomes);
    }, []);

    useEffect(() => {
        atualizarListaLocal();
    }, [meuNome, atualizarListaLocal]);

    useEffect(() => {
        setNomeInput(meuNome || '');
    }, [meuNome]);

    const trocarPersonagem = useCallback(() => {
        const n = sanitizarNome(nomeInput);
        if (n === 'Jogador' && nomeInput.trim() === '') return;
        setMeuNome(n);
        localStorage.setItem('rpgNome', n);
        resetFicha();

        const bl = localStorage.getItem('rpgFicha_' + n);
        if (bl) {
            try { carregarDadosFicha(JSON.parse(bl)); } catch (e) { /* ignore */ }
        }

        carregarFichaDoFirebase(n).then((dados) => {
            if (dados && Object.keys(dados).length > 2) {
                carregarDadosFicha(dados);
            }
        });

        atualizarListaLocal();
        setAbaAtiva('aba-status');
    }, [nomeInput, setMeuNome, resetFicha, carregarDadosFicha, atualizarListaLocal, setAbaAtiva]);

    const carregarPersonagemExistente = useCallback((n) => {
        setNomeInput(n);
        const nome = sanitizarNome(n);
        if (!nome) return;
        setMeuNome(nome);
        localStorage.setItem('rpgNome', nome);
        resetFicha();

        const bl = localStorage.getItem('rpgFicha_' + nome);
        if (bl) {
            try { carregarDadosFicha(JSON.parse(bl)); } catch (e) { /* ignore */ }
        }

        carregarFichaDoFirebase(nome).then((dados) => {
            if (dados && Object.keys(dados).length > 2) {
                carregarDadosFicha(dados);
            }
        });

        atualizarListaLocal();
        setAbaAtiva('aba-status');
    }, [setMeuNome, resetFicha, carregarDadosFicha, atualizarListaLocal, setAbaAtiva]);

    const abrirModalDelete = useCallback((n) => {
        setPersonagemParaDeletar(n);
    }, [setPersonagemParaDeletar]);

    const toggleMestre = useCallback(() => {
        const novoVal = !isMestre;
        setIsMestre(novoVal);
        localStorage.setItem('rpgIsMestre', novoVal ? 'sim' : 'nao');
    }, [isMestre, setIsMestre]);

    const alterarAvatarBase = useCallback((e) => {
        updateFicha(ficha => {
            if (!ficha.avatar) ficha.avatar = { base: "" };
            ficha.avatar.base = e.target.value;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const handleImageUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImg(true);
        try {
            const urlPermanente = await uploadImagem(file, `avatars/${meuNome || 'desconhecido'}`);
            updateFicha(ficha => {
                if (!ficha.avatar) ficha.avatar = { base: "" };
                ficha.avatar.base = urlPermanente;
            });
            await salvarFirebaseImediato();
        } catch (err) {
            console.error('[PerfilPanel] Erro no upload/sync do avatar:', err);
            alert('Erro ao sincronizar o avatar! O upload pode ter falhado ou o Firebase rejeitou o salvamento.');
        } finally {
            setUploadingImg(false);
        }
    }, [meuNome, updateFicha]);

    const avatarBase = minhaFicha?.avatar?.base || '';

    const value = useMemo(() => ({
        nomeInput, setNomeInput,
        listaLocal,
        uploadingImg,
        avatarBase,
        meuNome,
        isMestre,
        trocarPersonagem,
        carregarPersonagemExistente,
        abrirModalDelete,
        toggleMestre,
        alterarAvatarBase,
        handleImageUpload,
    }), [
        nomeInput, listaLocal, uploadingImg, avatarBase, meuNome, isMestre,
        trocarPersonagem, carregarPersonagemExistente, abrirModalDelete,
        toggleMestre, alterarAvatarBase, handleImageUpload,
    ]);

    return (
        <PerfilFormContext.Provider value={value}>
            {children}
        </PerfilFormContext.Provider>
    );
}
