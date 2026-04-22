import React, { useEffect, useState, useMemo } from 'react'
import useStore, { sanitizarNome } from './stores/useStore'
import useFirebase from './hooks/useFirebase'
import Sidebar from './components/layout/Sidebar'
import TabPanel from './components/layout/TabPanel'
import StatusPanel from './components/status/StatusPanel'
import PerfilPanel from './components/perfil/PerfilPanel'
import ModalConfirm from './components/perfil/ModalConfirm'
import FichaPanel from './components/ficha/FichaPanel'
import AtaquePanel from './components/combate/AtaquePanel'
import AcertoPanel from './components/combate/AcertoPanel'
import DefesaPanel from './components/combate/DefesaPanel'
import TestesPanel from './components/combate/TestesPanel'
import PoderesPanel from './components/poderes/PoderesPanel'
import ArsenalPanel from './components/arsenal/ArsenalPanel'
import ElementosPanel from './components/arsenal/ElementosPanel'
import FeedCombate from './components/feed/FeedCombate'
import MapaPanel from './components/mapa/MapaPanel'
import Jukebox from './components/jukebox/Jukebox'
import CompendioPanel from './components/compendio/CompendioPanel'
import MestrePanel from './components/mestre/MestrePanel'
import { MestreForjaNPC } from './components/mestre/MestreSubComponents'
import AIPanel from './components/ia/AIPanel'

// ============================================================================
// 🔥 COMPONENTE DO LOBBY (A RECEÇÃO DO RPG) 🔥
// ============================================================================
function LobbyNeon() {
    const setMesaId = useStore(s => s.setMesaId);
    const setIsMestre = useStore(s => s.setIsMestre);
    const [codigoSala, setCodigoSala] = useState('');

    const criarMesa = () => {
        // Gera um código único estilo MESA-A8X9P
        const novoCodigo = 'MESA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        setIsMestre(true); // Quem cria a mesa é automaticamente o Mestre
        setMesaId(novoCodigo);
    };

    const entrarMesa = () => {
        if (!codigoSala.trim()) return alert('Digita o código da mesa para entrar!');
        setIsMestre(false); // Quem entra por link começa como jogador
        setMesaId(codigoSala.trim().toUpperCase());
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.9)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px', position: 'relative' }}>
                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                <p style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '30px' }}>Bem-vindo à Taverna Central. Cria a tua própria campanha ou entra numa mesa existente.</p>
                
                <div style={{ marginBottom: '30px' }}>
                    <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold' }}>
                        🌌 CRIAR NOVA MESA (Mestre)
                    </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '30px' }}>
                    <hr style={{ borderColor: '#333', margin: 0 }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0f', padding: '0 10px', color: '#666', fontSize: '0.8em', fontWeight: 'bold' }}>OU</span>
                </div>

                <div>
                    <input 
                        className="input-neon" 
                        type="text" 
                        placeholder="Ex: MESA-A8X9P" 
                        value={codigoSala}
                        onChange={e => setCodigoSala(e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: '1.1em', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase' }}
                    />
                    <button className="btn-neon btn-blue" onClick={entrarMesa} style={{ width: '100%', padding: '12px', fontSize: '1.1em', fontWeight: 'bold' }}>
                        🚪 ENTRAR NA MESA
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// 🔥 A APLICAÇÃO PRINCIPAL 🔥
// ============================================================================
function App() {
    const meuNome = useStore(s => s.meuNome);
    const mesaId = useStore(s => s.mesaId);
    const setMesaId = useStore(s => s.setMesaId);
    const limparFeedStore = useStore(s => s.limparFeedStore);
    
    const { loading } = useFirebase();

    const [modalAberto, setModalAberto] = useState(false);
    const [themeReady, setThemeReady] = useState(false);

    useEffect(() => {
        setTimeout(() => setThemeReady(true), 50);
    }, []);

    // Se o jogador não estiver conectado a uma mesa, apresenta a Recepção (Lobby)
    if (!mesaId) {
        return <LobbyNeon />;
    }

    if (loading || !themeReady) {
        return (
            <div style={{ padding: 20, color: '#0ff', fontFamily: 'monospace' }}>
                Conectando ao Multiverso e carregando a Mesa {mesaId}...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            
            {/* 🔥 BOTÃO DE SAÍDA FLUTUANTE (Check-out do Hotel) 🔥 */}
            <div style={{ position: 'absolute', top: '10px', right: '15px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                <span style={{ color: '#00ffcc', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '1px' }}>SALA: {mesaId}</span>
                <button 
                    onClick={() => {
                        if(window.confirm('Tem a certeza que deseja sair desta mesa e voltar ao Lobby principal?')) {
                            limparFeedStore(); // Limpa o feed visualmente
                            setMesaId(''); // Volta ao Lobby
                        }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#ff003c', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold', padding: '0 5px' }}
                >
                    Sair 🚪
                </button>
            </div>

            <Sidebar onResetClick={() => setModalAberto(true)} />
            
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <TabPanel id="aba-perfil"><PerfilPanel /></TabPanel>
                <TabPanel id="aba-mestre"><MestrePanel /></TabPanel>
                <TabPanel id="aba-status"><StatusPanel /></TabPanel>
                <TabPanel id="aba-testes"><TestesPanel /></TabPanel>
                <TabPanel id="aba-ataque"><AtaquePanel /></TabPanel>
                <TabPanel id="aba-acerto"><AcertoPanel /></TabPanel>
                <TabPanel id="aba-defesa"><DefesaPanel /></TabPanel>
                <TabPanel id="aba-ficha"><FichaPanel /></TabPanel>
                <TabPanel id="aba-poderes"><PoderesPanel /></TabPanel>
                <TabPanel id="aba-arsenal"><ArsenalPanel /></TabPanel>
                <TabPanel id="aba-elementos"><ElementosPanel /></TabPanel>
                <TabPanel id="aba-log"><FeedCombate /></TabPanel>
                <TabPanel id="aba-mapa"><MapaPanel /></TabPanel>
                <TabPanel id="aba-musica"><Jukebox /></TabPanel>
                <TabPanel id="aba-compendio"><CompendioPanel /></TabPanel>
                <TabPanel id="aba-oraculo"><AIPanel /></TabPanel>
            </main>

            <ModalConfirm isOpen={modalAberto} onClose={() => setModalAberto(false)} onConfirm={() => {
                setModalAberto(false);
                // A lógica de apagar a ficha está no useStore/firebase, mantivemos intacta.
            }} />
        </div>
    )
}

export default App;