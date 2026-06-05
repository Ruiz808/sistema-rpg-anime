import React, { useState } from 'react';
import { usePerfilForm } from './PerfilFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Perfil provider não encontrado</div>;

export function PerfilJogadorEditor() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { minhaFicha, nomeInput, setNomeInput, uploadingImg, trocarPersonagem, alterarAvatarBase, handleImageUpload } = ctx;

    return (
        <div className="def-box">
            <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Perfil do Jogador</h3>
            <label style={{ color: '#aaa', fontSize: '0.9em' }}>Nome do Personagem:</label>
            <input type="text" className="input-neon" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} placeholder="Digite o nome..." />
            
            <label style={{ color: '#aaa', fontSize: '0.9em', marginTop: 10, display: 'block' }}>URL da Imagem Base (Avatar):</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="text" className="input-neon" value={minhaFicha?.avatar?.base || ''} onChange={alterarAvatarBase} placeholder="URL da imagem (Ou anexe ao lado 👉)" style={{ flex: 1, margin: 0 }} />
                <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, whiteSpace: 'nowrap', opacity: uploadingImg ? 0.5 : 1 }}>
                    {uploadingImg ? 'Enviando...' : '📁 Anexar'}
                    <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                </label>
            </div>
            
            {minhaFicha?.avatar?.base && (
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', width: '100px', height: '100px', borderRadius: '10px', border: '2px solid #ffcc00', backgroundImage: `url('${minhaFicha.avatar.base}')`, backgroundSize: 'cover', backgroundPosition: 'top center', boxShadow: '0 0 10px rgba(255,204,0,0.5)' }} />
                </div>
            )}
            <button className="btn-neon btn-gold" onClick={trocarPersonagem} style={{ marginTop: 15, width: '100%' }}>Trocar / Criar Personagem</button>
        </div>
    );
}

export function PerfilPersonagensSalvos() {
    const ctx = usePerfilForm();
    if (!ctx) return FALLBACK;
    const { listaLocal, meuNome, isMestre, carregarPersonagemExistente, abrirModalDelete, todosMesa } = ctx;
    
    // 🔥 NOVO: Estado para mostrar o Scanner
    const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);

    // Filtra os personagens da mesa que NÃO estão na sua lista pessoal
    const perdidos = todosMesa.filter(n => !listaLocal.includes(n));

    return (
        <div className="def-box" style={{ marginTop: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ color: '#0ff', margin: 0 }}>Personagens Salvos</h3>
                
                {/* 🔍 Botão de Emergência só aparece se houver personagens "perdidos" na Sala */}
                {perdidos.length > 0 && (
                    <button onClick={() => setMostrarRecuperacao(!mostrarRecuperacao)} className="btn-neon btn-blue btn-small" style={{ padding: '5px 10px', fontSize: '0.8em' }}>
                        {mostrarRecuperacao ? 'Ocultar Scanner' : '🔍 Scan da Mesa'}
                    </button>
                )}
            </div>

            {/* 🖥️ Interface do Scanner de Recuperação */}
            {mostrarRecuperacao && perdidos.length > 0 && (
                <div className="fade-in" style={{ background: 'rgba(0,136,255,0.1)', border: '1px dashed #0088ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <p style={{ color: '#0088ff', fontSize: '0.85em', marginTop: 0, fontWeight: 'bold' }}>Personagens encontrados no servidor desta sala. Clique para reclamar a posse:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {perdidos.map(p => (
                            <button key={p} onClick={() => { carregarPersonagemExistente(p); setMostrarRecuperacao(false); }} className="btn-neon btn-small hover-lift" style={{ background: 'rgba(0,0,0,0.5)', borderColor: '#0088ff', color: '#0088ff', fontSize: '0.85em' }}>
                                📥 {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div id="lista-personagens-jogador">
                {listaLocal.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Nenhum personagem registado no seu Histórico. Utilize o botão "Scan da Mesa" acima ou digite o nome.</p>
                ) : (
                    listaLocal.map((n) => (
                        <div className="char-card" key={n}>
                            <div className="char-name">{n}{n === meuNome && <span style={{ color: '#0f0', fontSize: '0.6em' }}> (ATUAL)</span>}</div>
                            <div className="char-actions">
                                <button className="btn-neon btn-gold btn-small" onClick={() => carregarPersonagemExistente(n)}>Carregar</button>
                                {isMestre && <button className="btn-neon btn-red btn-small" onClick={() => abrirModalDelete(n)}>Apagar</button>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function PerfilMestreToggle() {
    return null;
}