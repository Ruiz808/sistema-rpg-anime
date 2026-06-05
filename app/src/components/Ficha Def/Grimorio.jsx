import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import PoderesPanel from '../poderes/PoderesPanel';
import ElementosPanel from '../arsenal/ElementosPanel';
import { salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';

export default function GrimorioPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [animDirection, setAnimDirection] = useState('next');
    const [modalEstilo, setModalEstilo] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [localCorFundo, setLocalCorFundo] = useState('#bba9d8');
    const [localCorTexto, setLocalCorTexto] = useState('#000000');
    const [localCorTinta, setLocalCorTinta] = useState('#000000');
    const [localBgImg, setLocalBgImg] = useState('');
    const [localModoFundo, setLocalModoFundo] = useState('normal');
    const [localCorFundoTint, setLocalCorFundoTint] = useState('#ffffff');
    
    useEffect(() => {
        if (minhaFicha) {
            setLocalCorFundo(minhaFicha.estetica?.diarioCor || '#bba9d8');
            setLocalCorTexto(minhaFicha.estetica?.corTexto || '#000000');
            setLocalCorTinta(minhaFicha.estetica?.corTintaRadar || '#000000');
            setLocalBgImg(minhaFicha.estetica?.bgImg || '');
            setLocalModoFundo(minhaFicha.estetica?.modoFundo || 'normal');
            setLocalCorFundoTint(minhaFicha.estetica?.corFundoTint || '#ffffff');
        }
    }, [minhaFicha?.estetica]);

    if (!minhaFicha) return <div style={{ color: '#fff', padding: 20 }}>Invocando o Grimório...</div>;

    const fonteDiario = minhaFicha.estetica?.diarioFonte || '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive';

    const mudarPagina = (nova) => {
        setAnimDirection(nova > paginaAtual ? 'next' : 'prev');
        setPaginaAtual(nova);
    };

    const handleSalvarTudo = () => {
        setSalvando(true);
        if (typeof salvarFirebaseImediato === 'function') {
            salvarFirebaseImediato()
                .then(() => setTimeout(() => setSalvando(false), 1500))
                .catch(() => { alert("Erro ao sincronizar na nuvem!"); setSalvando(false); });
        } else {
            salvarFichaSilencioso();
            setTimeout(() => setSalvando(false), 1500);
        }
    };

    return (
        <div style={{ width: '100%', minHeight: '85vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* 🔥 CSS MAGICO DO LIVRO E DA PÁGINA 🔥 */}
            <style>{`
                .swoop-container { transform-style: preserve-3d; z-index: 1; position: relative; width: 100%; }
                @keyframes pageSwoopNext { 0% { transform: perspective(1500px) rotateY(-15deg) translateX(30px) scale(0.98); opacity: 0; } 100% { transform: perspective(1500px) rotateY(0deg) translateX(0) scale(1); opacity: 1; } }
                @keyframes pageSwoopPrev { 0% { transform: perspective(1500px) rotateY(15deg) translateX(-30px) scale(0.98); opacity: 0; } 100% { transform: perspective(1500px) rotateY(0deg) translateX(0) scale(1); opacity: 1; } }
                .page-swoop-next { animation: pageSwoopNext 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .page-swoop-prev { animation: pageSwoopPrev 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                
                /* Magia da Estética nas Sub-telas */
                .grimorio-estilo-papel { --tinta: ${localCorTinta || '#000'}; --fundo: ${localCorFundo || '#fff'}; color: currentColor !important; width: 100%; }
                .grimorio-estilo-papel * { font-family: ${fonteDiario}, 'Courier New', serif !important; text-shadow: none !important; box-shadow: none !important; }
                .grimorio-estilo-papel .def-box, .grimorio-estilo-papel [style*="background: rgba"] { background: transparent !important; border: 2px solid var(--tinta) !important; border-radius: 2px 255px 3px 25px / 255px 5px 225px 3px !important; position: relative; }
                .grimorio-estilo-papel .def-box::before, .grimorio-estilo-papel [style*="background: rgba"]::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: var(--tinta); opacity: 0.03; pointer-events: none; border-radius: inherit; }
                .grimorio-estilo-papel h2, .grimorio-estilo-papel h3, .grimorio-estilo-papel h4 { color: var(--tinta) !important; display: inline-block; }
                .grimorio-estilo-papel button { background: transparent !important; border: 2px dashed var(--tinta) !important; border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px !important; color: var(--tinta) !important; font-weight: bold !important; text-transform: uppercase !important; transition: all 0.2s ease !important; }
                .grimorio-estilo-papel button:hover { background: var(--tinta) !important; color: var(--fundo) !important; border-style: solid !important; transform: scale(1.02) rotate(-1deg) !important; }
                .grimorio-estilo-papel input, .grimorio-estilo-papel textarea, .grimorio-estilo-papel select { background: rgba(0,0,0,0.03) !important; border: none !important; border-bottom: 2px dotted var(--tinta) !important; color: currentColor !important; border-radius: 0 !important; }
                .grimorio-estilo-papel input:focus, .grimorio-estilo-papel textarea:focus { background: rgba(0,0,0,0.06) !important; border-bottom: 2px solid var(--tinta) !important; }
                .grimorio-estilo-papel input::placeholder, .grimorio-estilo-papel textarea::placeholder { color: currentColor !important; opacity: 0.5 !important; font-style: italic !important; }
                .grimorio-estilo-papel .poderes-sidebar .def-box { border: none !important; border-right: 2px dashed var(--tinta) !important; border-radius: 0 !important; }
            `}</style>

            {/* 📖 A ESTRUTURA FÍSICA DO LIVRO */}
            <div style={{
                display: 'flex', width: '100%', minHeight: '85vh',
                background: '#1a0f14', // Capa de couro escuro
                border: '2px solid #3a2a2f', borderRadius: '12px 25px 25px 12px',
                padding: '10px 20px 10px 45px', boxShadow: '20px 20px 50px rgba(0,0,0,0.9), inset 15px 0 30px rgba(0,0,0,0.9)',
                position: 'relative'
            }}>
                
                {/* 🛡️ A Lombada 3D do Livro */}
                <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: '15px', width: '20px',
                    background: 'linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.8) 60%, rgba(255,255,255,0.05) 100%)',
                    borderRadius: '5px', boxShadow: '2px 0 5px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 15
                }}/>
                
                {/* ✨ Fio de Ouro na Capa */}
                <div style={{
                    position: 'absolute', top: '15px', bottom: '15px', left: '40px', right: '15px',
                    border: '1px solid rgba(255, 204, 0, 0.2)', borderRadius: '5px 15px 15px 5px', pointerEvents: 'none', zIndex: 10
                }}/>

                {/* 📄 AS PÁGINAS DE PAPEL (Herda as cores da Ficha) */}
                <div style={{
                    flex: 1, position: 'relative', backgroundColor: localCorFundo, color: localCorTexto,
                    borderRadius: '5px 15px 15px 5px', boxShadow: '-5px 0 15px rgba(0,0,0,0.5), inset -2px 0 5px rgba(0,0,0,0.1)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '40px', transition: 'background 0.3s ease, color 0.3s ease'
                }}>
                    
                    {/* Fundo Alquímico da Página */}
                    {localBgImg && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', mixBlendMode: localModoFundo, isolation: 'isolate' }}>
                            <img src={localBgImg} alt="Fundo" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, filter: localModoFundo !== 'normal' ? 'contrast(1.2) saturate(1.2)' : 'none' }} />
                            {localCorFundoTint && localCorFundoTint !== '#ffffff' && (
                                <>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: localCorFundoTint, mixBlendMode: 'color' }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: localCorFundoTint, mixBlendMode: 'overlay', opacity: 0.8 }} />
                                </>
                            )}
                        </div>
                    )}

                    {/* Sombra da Dobra Central da Página */}
                    <div style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, width: '50px',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)',
                        pointerEvents: 'none', zIndex: 10
                    }}/>

                    {/* 📌 CONTROLES DE SAVE */}
                    <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                        <button onClick={handleSalvarTudo} style={{ background: salvando ? '#a5d6a7' : '#4caf50', color: '#fff', border: '1px solid #333', borderBottom: '3px solid #222', padding: '8px 15px', fontFamily: 'inherit', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', boxShadow: '2px 4px 8px rgba(0,0,0,0.4)', transform: 'rotate(1deg)' }}>
                            {salvando ? '✅ Escrito!' : '💾 Gravar Magia'}
                        </button>
                    </div>

                    {/* 📖 CONTEÚDO DO LIVRO (SWOOP) */}
                    <div key={paginaAtual} className={`swoop-container ${animDirection === 'next' ? 'page-swoop-next' : 'page-swoop-prev'}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {paginaAtual === 1 && (
                            <div className="grimorio-estilo-papel" style={{ flex: 1 }}>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed ${localCorTinta}` }}>
                                        O Livro dos Poderes
                                    </h1>
                                </div>
                                <PoderesPanel />
                            </div>
                        )}

                        {paginaAtual === 2 && (
                            <div className="grimorio-estilo-papel" style={{ flex: 1 }}>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed ${localCorTinta}` }}>
                                        Afinidades & Elementos
                                    </h1>
                                </div>
                                <ElementosPanel />
                            </div>
                        )}
                    </div>

                    {/* 🗂️ NAVEGAÇÃO DAS PÁGINAS DO LIVRO */}
                    <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', fontFamily: 'inherit', zIndex: 10 }}>
                        <button onClick={() => mudarPagina(1)} disabled={paginaAtual === 1} style={{ background: 'transparent', border: 'none', fontSize: '1.2em', fontWeight: 'bold', cursor: paginaAtual === 1 ? 'default' : 'pointer', opacity: paginaAtual === 1 ? 0.3 : 1, fontFamily: 'inherit', color: 'currentColor' }}>⮜ Poderes</button>
                        <span style={{ fontSize: '1.1em', fontWeight: 'bold', borderBottom: '2px solid currentColor', padding: '0 10px' }}>Página {paginaAtual} de 2</span>
                        <button onClick={() => mudarPagina(2)} disabled={paginaAtual === 2} style={{ background: 'transparent', border: 'none', fontSize: '1.2em', fontWeight: 'bold', cursor: paginaAtual === 2 ? 'default' : 'pointer', opacity: paginaAtual === 2 ? 0.3 : 1, fontFamily: 'inherit', color: 'currentColor' }}>Elementos ⮞</button>
                    </div>

                </div>
            </div>
        </div>
    );
}