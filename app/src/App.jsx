import React, { useEffect, useState, useMemo } from 'react'
import { ref, get, set } from 'firebase/database'
import { db } from './services/firebase-config'
import useStore, { sanitizarNome } from './stores/useStore'
import useFirebase from './hooks/useFirebase'

// Import de Layout e Componentes
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
import AIPanel from './components/ia/AIPanel'
import GravadorPanel from './components/ia/GravadorPanel'

// Funções de Sincronização e Engine
import { 
    carregarFichaDoFirebase, 
    iniciarListenerDummies, 
    enviarParaFeed, 
    salvarDummie, 
    iniciarListenerCenario 
} from './services/firebase-sync'
import { getMaximo } from './core/attributes'
import { calcularCA } from './core/engine'

// ============================================================================
// 🛠️ FUNÇÕES AUXILIARES (LÓGICA DO TEU APP ORIGINAL)
// ============================================================================

function getStatusLimpo(ficha, chave, threshold) {
    if (!ficha) return { max: 0, atual: 0, pVit: 0 };
    let mx = 0;
    try { mx = getMaximo(ficha, chave); } catch(e){}
    if (!mx || isNaN(mx)) mx = parseInt(ficha[chave]?.base) || 0;
    
    const strVal = String(Math.floor(mx));
    const pVit = Math.max(0, strVal.length - threshold);
    const maxFinal = pVit > 0 ? Math.floor(mx / Math.pow(10, pVit)) : mx;

    let atual = maxFinal;
    if (ficha[chave] && ficha[chave].atual !== undefined) {
        let at = parseFloat(ficha[chave].atual);
        if (!isNaN(at)) atual = (pVit > 0 && at > maxFinal * 10) ? Math.floor(at / Math.pow(10, pVit)) : at;
    }
    return { max: maxFinal, atual: atual, pVit: pVit };
}

function getEnergiasSupremas(ficha) {
    if (!ficha) return { vitais: {max:0, atual:0}, mortais: {max:0, atual:0} };
    const getRawBase = (attr) => parseFloat(ficha[attr]?.base) || 0;
    const getPrestAtual = (k) => {
        let baseP = 0;
        if (k === 'status') {
            const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
            let m = 0;
            STATS.forEach(s => m += getRawBase(s));
            baseP = Math.floor((m / 8) / 1000);
        } else {
            const mults = { vida: 1000000, mana: 10000000, aura: 10000000, chakra: 10000000, corpo: 10000000 };
            baseP = Math.floor(getRawBase(k) / (mults[k] || 1));
        }
        const anchor = k === 'status' ? 'forca' : k;
        let mFormas = parseFloat(ficha[anchor]?.mFormas) || 1.0;
        let bMFormas = 0;
        let hasMFormas = false;
        const processarEfeitos = (efeitos) => {
            if(!efeitos) return;
            efeitos.forEach(e => {
                let atr = (e.atributo||'').toLowerCase();
                let prop = (e.propriedade||'').toLowerCase();
                let afeta = (atr === anchor) || (atr === 'todos_status' && k==='status') || (atr === 'todas_energias' && k!=='status');
                if(afeta && prop === 'mformas') { bMFormas += parseFloat(e.valor) || 0; hasMFormas = true; }
            });
        };
        (ficha.inventario || []).filter(i => i.equipado).forEach(i => {
            processarEfeitos(i.efeitos);
            if (i.formaAtivaId && i.formas) {
                let activeForm = i.formas.find(f => f.id === i.formaAtivaId);
                if (activeForm && activeForm.acumulaFormaBase !== false) {
                   let activeConfig = (activeForm.configs || []).find(c => c.id === i.configAtivaId) || activeForm.configs?.[0];
                   if (activeConfig) processarEfeitos(activeConfig.efeitos);
                }
            }
        });
        (ficha.poderes || []).filter(p => p.ativa).forEach(p => processarEfeitos(p.efeitos));
        let efetivoMFormas = (mFormas === 1.0 && hasMFormas ? 0 : mFormas) + bMFormas;
        const multForma = efetivoMFormas >= 10 ? (efetivoMFormas / 10) : 1;
        return Math.floor(baseP * multForma);
    };
    const maxVitais = Math.floor((getPrestAtual('vida') + getPrestAtual('chakra') + getPrestAtual('corpo')) / 3);
    const maxMortais = Math.floor((getPrestAtual('mana') + getPrestAtual('status') + getPrestAtual('aura')) / 3);
    let atualVitais = ficha.pontosVitais?.atual;
    if (atualVitais === undefined || isNaN(atualVitais)) atualVitais = maxVitais;
    let atualMortais = ficha.pontosMortais?.atual;
    if (atualMortais === undefined || isNaN(atualMortais)) atualMortais = maxMortais;
    return { vitais: { max: maxVitais, atual: atualVitais }, mortais: { max: maxMortais, atual: atualMortais } };
}

// ============================================================================
// 🏰 COMPONENTE DO LOBBY (RECEÇÃO DAS SALAS)
// ============================================================================

function LobbyNeon() {
    const setMesaId = useStore(s => s.setMesaId);
    const setIsMestre = useStore(s => s.setIsMestre);
    const [codigoSala, setCodigoSala] = useState('');

    const criarMesa = () => {
        const novoCodigo = 'MESA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        setIsMestre(true); 
        setMesaId(novoCodigo);
    };

    const entrarMesa = () => {
        if (!codigoSala.trim()) return alert('Digita o código da mesa para entrar!');
        setIsMestre(false); 
        setMesaId(codigoSala.trim().toUpperCase());
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.9)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                <p style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '30px' }}>Bem-vindo à Taverna Central. Cria a tua própria campanha ou entra numa mesa existente.</p>
                <div style={{ marginBottom: '30px' }}>
                    <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold' }}>🌌 CRIAR NOVA MESA</button>
                </div>
                <div style={{ position: 'relative', marginBottom: '30px' }}>
                    <hr style={{ borderColor: '#333', margin: 0 }} /><span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0f', padding: '0 10px', color: '#666', fontSize: '0.8em', fontWeight: 'bold' }}>OU</span>
                </div>
                <input className="input-neon" type="text" placeholder="Ex: MESA-A8X9P" value={codigoSala} onChange={e => setCodigoSala(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1.1em', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase' }} />
                <button className="btn-neon btn-blue" onClick={entrarMesa} style={{ width: '100%', padding: '12px', fontSize: '1.1em', fontWeight: 'bold' }}>🚪 ENTRAR NA MESA</button>
            </div>
        </div>
    );
}

// ============================================================================
// 👑 APLICAÇÃO PRINCIPAL (APP)
// ============================================================================

export default function App() {
    // 1. CHAMADA DE TODOS OS HOOKS (Obrigatório no topo para evitar erro #310)
    const { 
        meuNome, setMeuNome, carregarDadosFicha, abaAtiva, setCenario, setDummies, 
        mesaId, setMesaId, limparFeedStore, isMestre, minhaFicha 
    } = useStore();

    const { loading } = useFirebase();
    const [pronto, setPronto] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [themeReady, setThemeReady] = useState(false);

    useEffect(() => { setTimeout(() => setThemeReady(true), 50); }, []);

    useEffect(() => {
        let nomeLocal = localStorage.getItem('rpgNome') || localStorage.getItem('rpg_nome');
        if (nomeLocal) {
            const nomeSanitizado = sanitizarNome(nomeLocal);
            setMeuNome(nomeSanitizado);
            try {
                const backup = localStorage.getItem('rpgFicha_' + nomeSanitizado);
                if (backup) carregarDadosFicha(JSON.parse(backup));
            } catch (e) { console.warn('Falha backup:', e); }
            setPronto(true);
        }
    }, [setMeuNome, carregarDadosFicha]);

    useEffect(() => {
        const unsubDummies = iniciarListenerDummies((dados) => setDummies(dados || {}));
        const unsubCenario = iniciarListenerCenario((dados) => setCenario(dados));
        return () => { if (unsubDummies) unsubDummies(); if (unsubCenario) unsubCenario(); };
    }, [setDummies, setCenario]);

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        const input = e.target.elements.nomeInput.value.trim();
        if (!input) return;
        const nomeSanitizado = sanitizarNome(input);
        localStorage.setItem('rpgNome', nomeSanitizado);
        setMeuNome(nomeSanitizado);
        setPronto(true);
        try {
            const dados = await carregarFichaDoFirebase(nomeSanitizado);
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
        } catch (e) { console.warn('Falha Firebase:', e); }
    };

    // 2. BLOQUEIOS DE RENDERIZAÇÃO (Depois dos hooks!)
    if (!mesaId) return <LobbyNeon />;
    if (loading || !themeReady) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#0ff', fontFamily: 'monospace' }}>
                A carregar realidade da sala {mesaId}...
            </div>
        );
    }

    if (!pronto && !meuNome) {
        return (
            <div className="modal-overlay" style={{ display: 'flex' }}>
                <form className="modal-box" onSubmit={handleNameSubmit}>
                    <h2 style={{ color: '#0ff', marginTop: 0 }}>Bem-vindo à Sala {mesaId}</h2>
                    <p style={{ color: '#fff' }}>Digita o nome do teu personagem para entrar:</p>
                    <input className="input-neon" name="nomeInput" type="text" autoFocus placeholder="Nome do personagem" maxLength={50} style={{ width: '100%', boxSizing: 'border-box' }}/>
                    <button type="submit" className="btn-neon" style={{ marginTop: 15, width: '100%' }}>Entrar</button>
                </form>
            </div>
        );
    }

    const isMapMode = abaAtiva === 'aba-mapa';

    // 3. LAYOUT FINAL
    return (
        <div className="app-layout">
            
            {/* BARRA DE CONTROLO DE MESA */}
            <div style={{ position: 'absolute', top: '10px', right: '15px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                <span style={{ color: '#00ffcc', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '1px' }}>SALA: {mesaId}</span>
                
                {/* 🔥 BOTÃO MÁGICO DE RESGATE PARA O MESTRE 🔥 */}
                {isMestre && (
                    <button 
                        onClick={async () => {
                            if(!window.confirm('⚠️ MESTRE: Deseja copiar TODOS os dados antigos para esta sala nova?')) return;
                            try {
                                const oldPers = await get(ref(db, 'personagens'));
                                const oldCen = await get(ref(db, 'cenario'));
                                const oldDum = await get(ref(db, 'dummies'));
                                const oldFeed = await get(ref(db, 'feed_combate'));
                                if (oldPers.exists()) await set(ref(db, `mesas/${mesaId}/personagens`), oldPers.val());
                                if (oldCen.exists()) await set(ref(db, `mesas/${mesaId}/cenario`), oldCen.val());
                                if (oldDum.exists()) await set(ref(db, `mesas/${mesaId}/dummies`), oldDum.val());
                                if (oldFeed.exists()) await set(ref(db, `mesas/${mesaId}/feed_combate`), oldFeed.val());
                                alert('✅ Dados teletransportados! Atualize a página (F5).');
                            } catch (err) { alert('❌ Erro: ' + err.message); }
                        }} 
                        style={{ background: '#ff003c', border: '1px solid #fff', color: '#fff', cursor: 'pointer', fontSize: '0.7em', fontWeight: 'bold', padding: '3px 8px', borderRadius: '5px' }}
                    >
                        🧲 RESGATAR DADOS
                    </button>
                )}

                <button onClick={() => { if(window.confirm('Sair da mesa?')) { limparFeedStore(); setMesaId(''); } }} style={{ background: 'none', border: 'none', color: '#ff003c', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold' }}>Sair 🚪</button>
            </div>

            <Sidebar onResetClick={() => setModalAberto(true)} />
            
            <div className={`main-content${isMapMode ? ' modo-mapa' : ''}`}>
                {!isMapMode && <h1 className="title">RPG Anime System</h1>}
                <TabPanel id="aba-perfil"><PerfilPanel /></TabPanel>
                {/* Aqui entra a MestrePanel original que definimos acima */}
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
                <TabPanel id="aba-gravador"><GravadorPanel /></TabPanel>
            </div>
            
            <ModalConfirm isOpen={modalAberto} onClose={() => setModalAberto(false)} />
        </div>
    );
}