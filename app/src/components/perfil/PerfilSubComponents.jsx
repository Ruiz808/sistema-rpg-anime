import React from 'react';
import { usePerfilForm } from './PerfilFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Perfil provider não encontrado</div>;

export function PerfilNomeInput() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { nomeInput, setNomeInput, trocarPersonagem } = ctx;

    return (
        <div>
            <label style={{ color: '#aaa', fontSize: '0.9em' }}>Nome do Personagem:</label>
            <input
                type="text"
                className="input-neon"
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                placeholder="Digite o nome..."
            />
            <button className="btn-neon btn-gold" onClick={trocarPersonagem} style={{ marginTop: 15, width: '100%' }}>
                Trocar / Criar Personagem
            </button>
        </div>
    );
}

export function PerfilAvatarUploader() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { avatarBase, alterarAvatarBase, handleImageUpload, uploadingImg } = ctx;

    return (
        <div>
            <label style={{ color: '#aaa', fontSize: '0.9em', marginTop: 10, display: 'block' }}>URL da Imagem Base (Avatar):</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                    type="text"
                    className="input-neon"
                    value={avatarBase}
                    onChange={alterarAvatarBase}
                    placeholder="URL da imagem (Ou anexe ao lado)"
                    style={{ flex: 1, margin: 0 }}
                />
                <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, whiteSpace: 'nowrap', opacity: uploadingImg ? 0.5 : 1 }}>
                    {uploadingImg ? 'Enviando...' : 'Anexar'}
                    <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                </label>
            </div>

            {avatarBase && (
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        width: '100px', height: '100px',
                        borderRadius: '10px',
                        border: '2px solid #ffcc00',
                        backgroundImage: `url('${avatarBase}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'top center',
                        boxShadow: '0 0 10px rgba(255,204,0,0.5)'
                    }} />
                </div>
            )}
        </div>
    );
}

export function PerfilListaPersonagens() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { listaLocal, meuNome, isMestre, carregarPersonagemExistente, abrirModalDelete } = ctx;

    return (
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
    );
}

export function PerfilMestreToggle() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { isMestre, toggleMestre } = ctx;

    return (
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
    );
}
