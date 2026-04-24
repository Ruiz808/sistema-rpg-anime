import React, { useState } from 'react';

export default function MapaMundi({ children }) {
    // Controla a "altura" da câmera: 'globo' -> 'continente' -> 'reino'
    const [nivelVisao, setNivelVisao] = useState('globo'); 
    
    // Guarda o que o jogador clicou para sabermos o que renderizar
    const [localAtual, setLocalAtual] = useState({ continente: null, reino: null });

    // Funções de Navegação
    const entrarNoContinente = (nomeContinente) => {
        setLocalAtual({ continente: nomeContinente, reino: null });
        setNivelVisao('continente');
    };

    const entrarNoReino = (nomeReino) => {
        setLocalAtual({ ...localAtual, reino: nomeReino });
        setNivelVisao('reino');
    };

    const voltarCamera = () => {
        if (nivelVisao === 'reino') setNivelVisao('continente');
        else if (nivelVisao === 'continente') {
            setNivelVisao('globo');
            setLocalAtual({ continente: null, reino: null });
        }
    };

    // ==========================================
    // 🌍 CAMADA 1: O GLOBO
    // ==========================================
    if (nivelVisao === 'globo') {
        return (
            <div className="fade-in" style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', borderRadius: '10px', border: '1px solid #0088ff', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 50px rgba(0,136,255,0.1)' }}>
                <div style={{ position: 'absolute', top: '20px', textAlign: 'center' }}>
                    <h2 style={{ color: '#00ffcc', margin: 0, letterSpacing: '3px', textShadow: '0 0 10px #00ffcc', textTransform: 'uppercase' }}>O Multiverso</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0 0' }}>Selecione um Continente para focar a visão orbital.</p>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin-globe { 100% { transform: rotate(360deg); } }
                    .globo-esfera {
                        width: 350px; height: 350px; border-radius: 50%;
                        background: radial-gradient(circle at 30% 30%, #003366, #000510);
                        border: 2px solid #0088ff;
                        box-shadow: 0 0 40px rgba(0,136,255,0.4), inset -20px -20px 40px rgba(0,0,0,0.8);
                        position: relative;
                        animation: spin-globe 40s linear infinite;
                    }
                    .btn-continente {
                        position: absolute; background: rgba(0,255,204,0.1); border: 1px solid #00ffcc;
                        color: #00ffcc; padding: 8px 12px; border-radius: 20px; cursor: pointer;
                        box-shadow: 0 0 10px rgba(0,255,204,0.3); font-weight: bold; font-size: 0.85em;
                        transition: 0.3s;
                    }
                    .btn-continente:hover { background: #00ffcc; color: #000; box-shadow: 0 0 20px #00ffcc; transform: scale(1.1); }
                `}} />

                <div className="globo-esfera">
                    {/* Aqui você poderá substituir no futuro por uma imagem do seu próprio mapa mundi! */}
                    <button onClick={() => entrarNoContinente('Pangea')} className="btn-continente" style={{ top: '35%', left: '15%' }}>
                        🌍 Pangea
                    </button>
                    <button onClick={() => entrarNoContinente('Terras Sombrias')} className="btn-continente" style={{ top: '60%', right: '15%', borderColor: '#ff003c', color: '#ff003c', boxShadow: '0 0 10px rgba(255,0,60,0.3)' }}>
                        🌋 Terras Sombrias
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🗺️ CAMADA 2: O CONTINENTE
    // ==========================================
    if (nivelVisao === 'continente') {
        return (
            <div className="fade-in" style={{ width: '100%', minHeight: '65vh', background: '#0a0a0f', borderRadius: '10px', border: '1px solid #0088ff', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '25px' }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ padding: '6px 12px', margin: 0, fontSize: '0.85em' }}>⬅ Voltar ao Globo</button>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#0088ff', margin: 0, textShadow: '0 0 10px #0088ff', textTransform: 'uppercase', letterSpacing: '2px' }}>{localAtual.continente}</h2>
                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>Visão Continental</span>
                    </div>
                    <div style={{ width: '120px' }}></div> {/* Espaçador */}
                </div>

                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'center', alignContent: 'center' }}>
                    {/* Botões provisórios dos Reinos (Depois você vai poder colocar mapas de cada um) */}
                    <div onClick={() => entrarNoReino('Reino Central')} style={{ width: '220px', height: '160px', border: '2px dashed #00ffcc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', cursor: 'pointer', background: 'rgba(0,255,204,0.05)', transition: '0.3s', fontSize: '1.1em', fontWeight: 'bold' }} className="hover-brilho">
                        🏰 Reino Central
                    </div>
                    <div onClick={() => entrarNoReino('Fronteira Sombria')} style={{ width: '220px', height: '160px', border: '2px dashed #ff003c', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff003c', cursor: 'pointer', background: 'rgba(255,0,60,0.05)', transition: '0.3s', fontSize: '1.1em', fontWeight: 'bold' }} className="hover-brilho-red">
                        ☠️ Fronteira Sombria
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    .hover-brilho:hover { background: rgba(0,255,204,0.2) !important; box-shadow: 0 0 20px rgba(0,255,204,0.4); transform: translateY(-5px); }
                    .hover-brilho-red:hover { background: rgba(255,0,60,0.2) !important; box-shadow: 0 0 20px rgba(255,0,60,0.4); transform: translateY(-5px); }
                `}} />
            </div>
        );
    }

    // ==========================================
    // ⚔️ CAMADA 3: O REINO (Onde entra o seu mapa tático!)
    // ==========================================
    if (nivelVisao === 'reino') {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <button onClick={voltarCamera} className="btn-neon btn-red" style={{ margin: 0, padding: '4px 12px', fontSize: '0.85em' }}>⬅ Mapa Maior</button>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#ffcc00', margin: 0, textShadow: '0 0 10px #ffcc00', textTransform: 'uppercase', letterSpacing: '1px' }}>{localAtual.reino}</h3>
                        <span style={{ color: '#aaa', fontSize: '0.75em' }}>Região de {localAtual.continente}</span>
                    </div>
                    <div style={{ width: '120px' }}></div>
                </div>
                
                {/* A MAGIA ACONTECE AQUI: 
                    O seu Grid de Combate intacto é "injetado" dento desta div! 
                */}
                <div className="fade-in" style={{ position: 'relative' }}>
                    {children}
                </div>
            </div>
        );
    }

    return null;
}