import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { sanitizarNome } from '../../stores/useStore';
import { carregarFichaDoFirebase, deletarPersonagem, salvarFichaSilencioso } from '../../services/firebase-sync';

export default function PerfilPanel() {
    const { 
        minhaFicha, 
        updateFicha, 
        meuNome, 
        setMeuNome, 
        isMestre, 
        setIsMestre, 
        resetFicha, 
        carregarDadosFicha, 
        setPersonagemParaDeletar, 
        setAbaAtiva 
    } = useStore();

    const [nomeInput, setNomeInput] = useState(meuNome || '');
    const [listaLocal, setListaLocal] = useState([]);

    useEffect(() => {
        atualizarListaLocal();
    }, [meuNome]);

    useEffect(() => {
        setNomeInput(meuNome || '');
    }, [meuNome]);

    function atualizarListaLocal() {
        const nomes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('rpgFicha_')) {
                nomes.push(k.replace('rpgFicha_', ''));
            }
        }
        setListaLocal(nomes);
    }

    function trocarPersonagem() {
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
    }

    function carregarPersonagemExistente(n) {
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
    }

    function abrirModalDelete(n) {
        setPersonagemParaDeletar(n);
    }

    function toggleMestre() {
        const novoVal = !isMestre;
        setIsMestre(novoVal);
        localStorage.setItem('rpgIsMestre', novoVal ? 'sim' : 'nao');
    }

    // 🔥 NOVA FUNÇÃO: Atualiza a URL da Imagem Base da Ficha
    function alterarAvatarBase(e) {
        updateFicha(ficha => {
            if (!ficha.avatar) ficha.avatar = { base: "" };
            ficha.avatar.base = e.target.value;
        });
        salvarFichaSilencioso();
    }

    return (
        <div className="perfil-panel">
            <div className="def-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Perfil do Jogador</h3>
                
                <label style={{ color: '#aaa', fontSize: '0.9em' }}>Nome do Personagem:</label>
                <input
                    type="text"
                    className="input-neon"
                    value={nomeInput}
                    onChange={(e) => setNomeInput(e.target.value)}
                    placeholder="Digite o nome..."
                />

                {/* 🔥 O CAMPO DE IMAGEM RESTAURADO */}
                <label style={{ color: '#aaa', fontSize: '0.9em', marginTop: 10, display: 'block' }}>URL da Imagem Base (Avatar):</label>
                <input
                    type="text"
                    className="input-neon"
                    value={minhaFicha?.avatar?.base || ''}
                    onChange={alterarAvatarBase}
                    placeholder="Cole o link da imagem aqui..."
                />
                
                {/* PREVIEW DO AVATAR */}
                {minhaFicha?.avatar?.base && (
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-block',
                            width: '100px', height: '100px',
                            borderRadius: '10px',
                            border: '2px solid #ffcc00',
                            backgroundImage: `url('${minhaFicha.avatar.base}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center',
                            boxShadow: '0 0 10px rgba(255,204,0,0.5)'
                        }} />
                    </div>
                )}

                <button className="btn-neon btn-gold" onClick={trocarPersonagem} style={{ marginTop: 15, width: '100%' }}>
                    Trocar / Criar Personagem
                </button>
            </div>

            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#0ff', marginBottom: 10 }}>Personagens Salvos</h3>
                <div id="lista-personagens-jogador">
                    {listaLocal.length === 0 ? (
                        <p style={{ color: '#888' }}>Nenhum personagem encontrado no seu navegador.</p>
                    ) : (
                        listaLocal.map((n) => (
                            <div className="char-card" key={n}>
                                <div className="char-name">
                                    {n}
                                    {n === meuNome && (
                                        <span style={{ color: '#0f0', fontSize: '0.6em' }}> (ATUAL)</span>
                                    )}
                                </div>
                                <div className="char-actions">
                                    <button
                                        className="btn-neon btn-gold btn-small"
                                        onClick={() => carregarPersonagemExistente(n)}
                                    >
                                        Carregar
                                    </button>
                                    {isMestre && (
                                        <button
                                            className="btn-neon btn-red btn-small"
                                            onClick={() => abrirModalDelete(n)}
                                        >
                                            Apagar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="def-box" style={{ marginTop: 15 }}>
                <label style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="checkbox"
                        id="chk-mestre"
                        checked={isMestre}
                        onChange={toggleMestre}
                    />
                    Modo Mestre
                </label>
            </div>
        </div>
    );
}