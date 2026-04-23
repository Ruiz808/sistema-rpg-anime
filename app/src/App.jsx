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
import { MestreForjaNPC } from './components/mestre/MestreSubComponents'

// Funções de Sync
import { carregarFichaDoFirebase, iniciarListenerDummies, enviarParaFeed, salvarDummie, iniciarListenerCenario, registrarNovaMesa, verificarMesaExistente } from './services/firebase-sync'
import { getMaximo } from './core/attributes'
import { calcularCA } from './core/engine'

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

// 🔥 PAINEL DO MESTRE 🔥
function MestrePanel() {
    const personagens = useStore(s => s.personagens)
    const meuNome = useStore(s => s.meuNome)
    const setPersonagemParaDeletar = useStore(s => s.setPersonagemParaDeletar)
    const isMestre = useStore(s => s.isMestre)

    const setMeuNome = useStore(s => s.setMeuNome)
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha)
    const setAbaAtiva = useStore(s => s.setAbaAtiva)
    
    const [msgSistema, setMsgSistema] = useState('')
    const [dNome, setDNome] = useState('Goblin Espião')
    const [dHp, setDHp] = useState(100)
    const [dVit, setDVit] = useState(0)
    const [dDefTipo, setDDefTipo] = useState('evasiva')
    const [dDef, setDDef] = useState(10)
    const [dVisivelHp, setDVisivelHp] = useState('todos')
    const [dOculto, setDOculto] = useState(false)
    const [mesaVisor, setMesaVisor] = useState('presente')

    const grandsGlobais = useMemo(() => {
        let g = {};
        if (personagens) Object.values(personagens).forEach(p => { if (p?.compendioOverrides?.grands) g = { ...g, ...p.compendioOverrides.grands }; });
        return g;
    }, [personagens]);

    if (!isMestre) return <div style={{ color: '#ff003c', textAlign: 'center', padding: 50, fontSize: '1.5em', fontWeight: 'bold' }}>Acesso Negado.</div>;

    const enviarAviso = () => {
        if (!msgSistema.trim()) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: msgSistema.trim() });
        setMsgSistema('');
    };

    const injetarDummie = () => {
        const hBase = parseInt(dHp) || 100;
        const vit = parseInt(dVit) || 0;
        const h = hBase * Math.pow(10, vit);
        const dv = parseInt(dDef) || 10;
        const id = 'dummie_' + Date.now();
        salvarDummie(id, { nome: dNome, hpMax: h, hpAtual: h, tipoDefesa: dDefTipo, valorDefesa: dv, visibilidadeHp: dVisivelHp, oculto: dOculto, posicao: { x: 0, y: 0 } });
        alert(`${dNome} injetado no mapa!`);
    };

    const handleApagarJogador = (nome) => {
        if (nome === meuNome) return alert('Não pode apagar a si mesmo!');
        setPersonagemParaDeletar(nome); 
    };

    const handleAssumirFicha = (nome, ficha) => {
        if (nome === meuNome) return;
        if (window.confirm(`🎭 ASSUMIR O CONTROLE DE ${nome.toUpperCase()}?`)) {
            setMeuNome(nome);
            carregarDadosFicha(ficha);
            localStorage.setItem('rpgNome', nome); 
            setAbaAtiva('aba-ficha'); 
        }
    };

    const handleClonarFicha = (nomeOriginal, fichaOriginal) => {
        const novoNome = window.prompt(`🖨️ CLONAR ENTIDADE: ${nomeOriginal}\nNome do clone:`, `${nomeOriginal} (Futuro)`);
        if (!novoNome || novoNome.trim() === '') return;
        const nomeSanitizado = sanitizarNome(novoNome);
        if (personagens[nomeSanitizado]) return alert('❌ Já existe uma entidade com esse nome!');
        if (window.confirm(`Criar "${nomeSanitizado}" e controlar?`)) {
            setMeuNome(nomeSanitizado);
            localStorage.setItem('rpgNome', nomeSanitizado);
            const fichaClone = JSON.parse(JSON.stringify(fichaOriginal));
            carregarDadosFicha(fichaClone);
            setAbaAtiva('aba-ficha'); 
            setTimeout(() => alert(`✨ CLONE CRIADO! Clique em "SALVAR" na ficha para forjá-lo na Base de Dados!`), 600);
        }
    };

    const todosJogadores = Object.entries(personagens || {});
    const jogadoresFiltrados = todosJogadores.filter(([nome, ficha]) => (ficha?.bio?.mesa || 'presente') === mesaVisor);
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#ffcc00', textShadow: '0 0 10px #ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: 10, margin: 0 }}>👑 DOMÍNIO DO MESTRE</h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="def-box" style={{ flex: '1 1 65%', minWidth: '400px', borderLeft: '4px solid #0088ff' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                        <button className={`btn-neon ${mesaVisor === 'presente' ? 'btn-gold' : ''}`} onClick={() => setMesaVisor('presente')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>⚔️ Marcados (Presente)</button>
                        <button className={`btn-neon ${mesaVisor === 'futuro' ? 'btn-gold' : ''}`} onClick={() => setMesaVisor('futuro')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>🚀 Marcados (Futuro)</button>
                        <button className={`btn-neon ${mesaVisor === 'npc' ? 'btn-red' : ''}`} onClick={() => setMesaVisor('npc')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>👹 NPCs</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                        {jogadoresFiltrados.map(([nome, ficha]) => {
                            const vida = getStatusLimpo(ficha, 'vida', 8);
                            const mana = getStatusLimpo(ficha, 'mana', 9);
                            const aura = getStatusLimpo(ficha, 'aura', 9);
                            const chakra = getStatusLimpo(ficha, 'chakra', 9);
                            const corpo = getStatusLimpo(ficha, 'corpo', 9);
                            const supremas = getEnergiasSupremas(ficha);
                            const percHp = vida.max > 0 ? (vida.atual / vida.max) * 100 : 0;
                            return (
                                <div key={nome} style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${nome===meuNome?'#0f0':'#333'}`, padding: '15px', borderRadius: '5px', overflow: 'hidden' }}>
                                    <strong style={{ color: '#fff', fontSize: '1.2em' }}>{nome}</strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.75em', color: '#ccc', margin: '10px 0' }}>
                                        <div style={{ gridColumn: 'span 3', borderLeft: '3px solid #f00', padding: '6px' }}><span style={{color: '#f00', fontWeight: 'bold'}}>HP:</span> {fmt(vida.atual)} / {fmt(vida.max)}</div>
                                        <div style={{ borderLeft: '2px solid #0088ff', padding: '4px' }}><span style={{color: '#0088ff', fontWeight: 'bold'}}>MP:</span> {fmt(mana.atual)}</div>
                                        <div style={{ borderLeft: '2px solid #aa00ff', padding: '4px' }}><span style={{color: '#aa00ff', fontWeight: 'bold'}}>AURA:</span> {fmt(aura.atual)}</div>
                                        <div style={{ borderLeft: '2px solid #00ffaa', padding: '4px' }}><span style={{color: '#00ffaa', fontWeight: 'bold'}}>CK:</span> {fmt(chakra.atual)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-neon btn-gold" style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0 }} onClick={() => handleAssumirFicha(nome, ficha)}>✏️ EDITAR</button>
                                        <button className="btn-neon btn-red" style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0 }} onClick={() => handleApagarJogador(nome)}>❌ APAGAR</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="def-box" style={{ borderLeft: '4px solid #ff003c' }}>
                        <h3 style={{ color: '#ff003c', margin: '0 0 15px 0' }}>👹 Injetor no Mapa</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input className="input-neon" type="text" placeholder="Nome" value={dNome} onChange={e => setDNome(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input className="input-neon" type="number" placeholder="HP" value={dHp} onChange={e => setDHp(e.target.value)} style={{ flex: 1 }} />
                                <input className="input-neon" type="number" placeholder="CA" value={dDef} onChange={e => setDDef(e.target.value)} style={{ flex: 1 }} />
                            </div>
                            <button className="btn-neon btn-red" onClick={injetarDummie}>☄️ INVOCAR NO MAPA</button>
                        </div>
                    </div>
                    <div className="def-box" style={{ borderLeft: '4px solid #ffcc00' }}>
                        <h3 style={{ color: '#ffcc00', margin: '0 0 15px 0' }}>⚡ A Voz do Sistema</h3>
                        <textarea className="input-neon" value={msgSistema} onChange={e => setMsgSistema(e.target.value)} style={{ width: '100%', minHeight: '80px', borderColor: '#ffcc00', color: '#ffcc00' }} />
                        <button className="btn-neon btn-gold" onClick={enviarAviso} style={{ width: '100%', marginTop: '10px' }}>📢 ENVIAR AVISO</button>
                    </div>
                </div>
            </div>
            <MestreForjaNPC />
        </div>
    );
}

// 🔥 LOBBY DE MESAS 🔥
function LobbyNeon() {
    const { setMesaId, setIsMestre } = useStore();
    const [codigoSala, setCodigoSala] = useState('');
    const [minhasMesas, setMinhasMesas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rpg_historico_mesas')) || []; }
        catch(e) { return []; }
    });

    const salvarNoHistorico = (id) => {
        const novaLista = [id, ...minhasMesas.filter(m => m !== id)].slice(0, 5);
        setMinhasMesas(novaLista);
        localStorage.setItem('rpg_historico_mesas', JSON.stringify(novaLista));
    };

    const criarMesa = async () => {
        const nomeMestre = window.prompt("Qual seu nome de Mestre?");
        if (!nomeMestre) return;
        const novoCodigo = 'MESA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        try {
            await registrarNovaMesa(novoCodigo, nomeMestre);
            salvarNoHistorico(novoCodigo);
            setIsMestre(true); 
            setMesaId(novoCodigo);
        } catch (e) { alert("Erro ao criar mesa no servidor!"); }
    };

    const entrarMesa = async (idForcado = null) => {
        const id = (idForcado || codigoSala).trim().toUpperCase();
        if (!id) return alert('Digite o código da mesa!');
        const existe = await verificarMesaExistente(id);
        if (!existe) return alert('Mesa não encontrada! Verifique o código.');
        salvarNoHistorico(id);
        setIsMestre(false);
        setMesaId(id);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.95)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '20px' }}>🌌 CRIAR NOVA MESA (Mestre)</button>
                {minhasMesas.length > 0 && (
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <span style={{ color: '#aaa', fontSize: '0.8em', fontWeight: 'bold' }}>SUAS MESAS RECENTES:</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {minhasMesas.map(m => (
                                <button key={m} onClick={() => entrarMesa(m)} className="btn-neon btn-small" style={{ margin: 0, padding: '5px 10px', borderColor: '#00aaff', color: '#00aaff' }}>{m}</button>
                            ))}
                        </div>
                    </div>
                )}
                <div style={{ position: 'relative', marginBottom: '20px' }}><hr style={{ borderColor: '#333' }} /><span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0f', padding: '0 10px', color: '#666', fontSize: '0.8em' }}>OU ENTRAR COM CONVITE</span></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="input-neon" type="text" placeholder="Ex: MESA-A8X9P" value={codigoSala} onChange={e => setCodigoSala(e.target.value)} style={{ flex: 1, padding: '12px', fontSize: '1.1em', textAlign: 'center', textTransform: 'uppercase' }} />
                    <button className="btn-neon btn-blue" onClick={() => entrarMesa()} style={{ padding: '0 20px', fontWeight: 'bold' }}>🚪 IR</button>
                </div>
            </div>
        </div>
    );
}

// 🔥 APLICAÇÃO PRINCIPAL 🔥
export default function App() {
    const meuNome = useStore(s => s.meuNome);
    const setMeuNome = useStore(s => s.setMeuNome);
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha);
    const abaAtiva = useStore(s => s.abaAtiva);
    const setCenario = useStore(s => s.setCenario);
    const setDummies = useStore(s => s.setDummies);
    
    const mesaId = useStore(s => s.mesaId);
    const setMesaId = useStore(s => s.setMesaId);
    const limparFeedStore = useStore(s => s.limparFeedStore);
    const isMestre = useStore(s => s.isMestre);

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

    if (!mesaId) return <LobbyNeon />;
    if (loading || !themeReady) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#0ff', fontFamily: 'monospace' }}>A carregar realidade da sala {mesaId}...</div>;

    if (!pronto && !meuNome) {
        return (
            <div className="modal-overlay" style={{ display: 'flex' }}>
                <form className="modal-box" onSubmit={handleNameSubmit}>
                    <h2 style={{ color: '#0ff', marginTop: 0 }}>Bem-vindo à Sala {mesaId}</h2>
                    <p style={{ color: '#fff' }}>Digita o nome do teu personagem para entrar:</p>
                    <input className="input-neon" name="nomeInput" type="text" autoFocus placeholder="Ex: Natsu" maxLength={50} style={{ width: '100%', boxSizing: 'border-box' }}/>
                    <button type="submit" className="btn-neon" style={{ marginTop: 15, width: '100%' }}>Entrar</button>
                </form>
            </div>
        );
    }

    const isMapMode = abaAtiva === 'aba-mapa';

    return (
        <div className="app-layout">
            <div style={{ position: 'absolute', top: '10px', right: '15px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '20px', border: '1px solid #333' }}>
                <span style={{ color: '#00ffcc', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '1px' }}>SALA: {mesaId}</span>
                
                {isMestre && (
                    <button 
                        onClick={async () => {
                            if(!window.confirm('⚠️ MESTRE: Deseja copiar TODOS os dados antigos do limbo para esta sala nova?')) return;
                            try {
                                const oldPers = await get(ref(db, 'personagens'));
                                if (oldPers.exists()) { const data = oldPers.val(); for (const key in data) await set(ref(db, `mesas/${mesaId}/personagens/${key}`), data[key]); }
                                const oldFeed = await get(ref(db, 'feed_combate'));
                                if (oldFeed.exists()) { const data = oldFeed.val(); for (const key in data) await set(ref(db, `mesas/${mesaId}/feed_combate/${key}`), data[key]); }
                                const oldCen = await get(ref(db, 'cenario'));
                                if (oldCen.exists()) await set(ref(db, `mesas/${mesaId}/cenario`), oldCen.val());
                                const oldDum = await get(ref(db, 'dummies'));
                                if (oldDum.exists()) await set(ref(db, `mesas/${mesaId}/dummies`), oldDum.val());
                                alert('✅ Dados teletransportados com sucesso! Atualize a página (F5).');
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