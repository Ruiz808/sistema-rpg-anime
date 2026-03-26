import React, { useEffect, useState } from 'react'
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
import PoderesPanel from './components/poderes/PoderesPanel'
import ArsenalPanel from './components/arsenal/ArsenalPanel'
import ElementosPanel from './components/arsenal/ElementosPanel'
import FeedCombate from './components/feed/FeedCombate'
import MapaPanel from './components/mapa/MapaPanel'
import Jukebox from './components/jukebox/Jukebox'
import CompendioPanel from './components/compendio/CompendioPanel'

import { carregarFichaDoFirebase, iniciarListenerDummies, enviarParaFeed, salvarDummie, iniciarListenerCenario } from './services/firebase-sync'
import { getMaximo } from './core/attributes'

// 🔥 CÁLCULO DE CA E DEFESAS 🔥
function calcularCA(ficha, tipo) {
    if (!ficha) return 10;
    const getDoisDigitos = (valor) => {
        if (!valor) return 0;
        const strVal = String(valor).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    };
    let base = 5;
    if (tipo === 'evasiva') base += getDoisDigitos(ficha.destreza?.base);
    if (tipo === 'resistencia') base += getDoisDigitos(ficha.forca?.base);
    let bonus = 0;
    (ficha.poderes || []).forEach(p => {
        if (p.ativa) {
            (p.efeitos || []).forEach(e => { if (e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0; });
        }
        (p.efeitosPassivos || []).forEach(e => { if (e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0; });
    });
    (ficha.passivas || []).forEach(p => {
        (p.efeitos || []).forEach(e => { if (e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0; });
    });
    (ficha.inventario || []).filter(i => i.equipado).forEach(i => {
        (i.efeitos || []).forEach(e => { if (e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0; });
    });
    return Math.floor(base + bonus);
}

// 🔥 MOTOR DE SINCRONIZAÇÃO BLINDADO 🔥
function getStatusLimpo(ficha, chave, threshold, fallbackChave) {
    if (!ficha) return { max: 0, atual: 0, pVit: 0 };
    
    let mx = 0;
    try {
        mx = getMaximo(ficha, chave);
        if ((!mx || isNaN(mx)) && fallbackChave) mx = getMaximo(ficha, fallbackChave);
    } catch (e) { console.warn(e) }

    // Fallback: Se o motor de atributos falhar em ler "pontosMortais", lemos direto do JSON!
    if (!mx || isNaN(mx)) {
        let baseObj = ficha[chave] || (fallbackChave ? ficha[fallbackChave] : null);
        if (baseObj && baseObj.base) mx = parseInt(baseObj.base) || 0;
    }
    if (isNaN(mx)) mx = 0;
    
    const strVal = String(Math.floor(mx));
    const pVit = Math.max(0, strVal.length - threshold);
    const maxFinal = pVit > 0 ? Math.floor(mx / Math.pow(10, pVit)) : mx;

    let atual = maxFinal;
    let baseObj = ficha[chave] || (fallbackChave ? ficha[fallbackChave] : null);
    if (baseObj && baseObj.atual !== undefined) {
        atual = parseFloat(baseObj.atual);
        if (isNaN(atual)) atual = maxFinal;
    }

    return { max: maxFinal, atual: atual, pVit: pVit };
}

// 🔥 PAINEL DO MESTRE AVANÇADO 🔥
function MestrePanel() {
    const personagens = useStore(s => s.personagens)
    const meuNome = useStore(s => s.meuNome)
    const setPersonagemParaDeletar = useStore(s => s.setPersonagemParaDeletar)
    const isMestre = useStore(s => s.isMestre)
    
    const [msgSistema, setMsgSistema] = useState('')

    const [dNome, setDNome] = useState('Goblin Espião')
    const [dHp, setDHp] = useState(100)
    const [dVit, setDVit] = useState(0)
    const [dDefTipo, setDDefTipo] = useState('evasiva')
    const [dDef, setDDef] = useState(10)
    const [dVisivelHp, setDVisivelHp] = useState('todos')
    const [dOculto, setDOculto] = useState(false)

    const [mesaVisor, setMesaVisor] = useState('presente')

    if (!isMestre) {
        return <div style={{ color: '#ff003c', textAlign: 'center', padding: 50, fontSize: '1.5em', fontWeight: 'bold' }}>Acesso Negado. Apenas o Mestre pode aceder a este domínio.</div>;
    }

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

        salvarDummie(id, {
            nome: dNome,
            hpMax: h,
            hpAtual: h,
            tipoDefesa: dDefTipo,
            valorDefesa: dv,
            visibilidadeHp: dVisivelHp,
            oculto: dOculto,
            posicao: { x: 0, y: 0 }
        });

        alert(`${dNome} injetado no mapa! ${dOculto ? '(Invisível 👻)' : ''}`);
    };

    const handleApagarJogador = (nome) => {
        if (nome === meuNome) {
            alert('Não pode apagar a si mesmo enquanto Mestre!');
            return;
        }
        setPersonagemParaDeletar(nome); 
    };

    const todosJogadores = Object.entries(personagens || {});
    const jogadoresFiltrados = todosJogadores.filter(([nome, ficha]) => {
        const m = ficha?.bio?.mesa || 'presente';
        return m === mesaVisor;
    });

    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
    const tituloVisor = mesaVisor === 'npc' ? '👁️ Visor da Entidade' : '👁️ Visor da Realidade';

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#ffcc00', textShadow: '0 0 10px #ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: 10, margin: 0 }}>
                👑 DOMÍNIO DO MESTRE
            </h2>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="def-box" style={{ flex: '1 1 65%', minWidth: '400px', borderLeft: '4px solid #0088ff' }}>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                        <button 
                            className={`btn-neon ${mesaVisor === 'presente' ? 'btn-gold' : ''}`} 
                            onClick={() => setMesaVisor('presente')} 
                            style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}
                        >
                            ⚔️ Marcados (Presente)
                        </button>
                        <button 
                            className={`btn-neon ${mesaVisor === 'futuro' ? 'btn-gold' : ''}`} 
                            onClick={() => setMesaVisor('futuro')} 
                            style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}
                        >
                            🚀 Marcados (Futuro)
                        </button>
                        <button 
                            className={`btn-neon ${mesaVisor === 'npc' ? 'btn-red' : ''}`} 
                            onClick={() => setMesaVisor('npc')} 
                            style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}
                        >
                            👹 NPCs / Inimigos
                        </button>
                    </div>

                    <h3 style={{ color: '#0088ff', margin: '0 0 15px 0' }}>{tituloVisor} ({jogadoresFiltrados.length})</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                        {jogadoresFiltrados.length === 0 ? (
                            <p style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center', fontStyle: 'italic', padding: '20px' }}>
                                Nenhuma entidade registada nesta categoria.
                            </p>
                        ) : jogadoresFiltrados.map(([nome, ficha]) => {
                            // Extração Extrema das Energias
                            const vida = getStatusLimpo(ficha, 'vida', 8);
                            const mana = getStatusLimpo(ficha, 'mana', 9);
                            const aura = getStatusLimpo(ficha, 'aura', 9);
                            const chakra = getStatusLimpo(ficha, 'chakra', 9);
                            const corpo = getStatusLimpo(ficha, 'corpo', 9);
                            const pVitais = getStatusLimpo(ficha, 'pontosVitais', 9, 'pontos_vitais');
                            const pMortais = getStatusLimpo(ficha, 'pontosMortais', 9, 'pontos_mortais');

                            const percHp = vida.max > 0 ? (vida.atual / vida.max) * 100 : 0;

                            let classId = ficha?.bio?.classe;
                            if ((classId === 'pretender' || classId === 'alterego') && ficha?.bio?.subClasse) classId = ficha?.bio?.subClasse;

                            return (
                                <div key={nome} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #333', padding: '15px', borderRadius: '5px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: `${percHp}%`, background: percHp > 50 ? '#0f0' : percHp > 20 ? '#ffcc00' : '#f00', transition: 'width 0.3s' }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '5px' }}>
                                        <strong style={{ color: '#fff', fontSize: '1.2em' }}>{nome} {nome === meuNome && <span style={{color: '#ffcc00', fontSize: '0.6em'}}>(VOCÊ)</span>}</strong>
                                        <span style={{ color: '#aaa', fontSize: '0.8em', fontStyle: 'italic' }}>{classId ? classId.toUpperCase() : 'Mundano'}</span>
                                    </div>

                                    {/* 🔥 Grelha 3x3 Perfeita para todas as Barras 🔥 */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.75em', color: '#ccc', marginBottom: '12px' }}>
                                        <div style={{ gridColumn: 'span 3', background: 'rgba(255,0,0,0.1)', padding: '6px', borderRadius: '3px', borderLeft: '3px solid #f00', display: 'flex', justifyContent: 'space-between' }}>
                                            <span><span style={{ color: '#f00', fontWeight: 'bold' }}>HP:</span> {fmt(vida.atual)} / {fmt(vida.max)}</span>
                                            {vida.pVit > 0 && <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>+{vida.pVit} Vit</span>}
                                        </div>
                                        <div style={{ background: 'rgba(0,136,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #0088ff' }}>
                                            <span style={{ color: '#0088ff', fontWeight: 'bold' }}>MP:</span><br/>{fmt(mana.atual)} / {fmt(mana.max)}
                                        </div>
                                        <div style={{ background: 'rgba(170,0,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #aa00ff' }}>
                                            <span style={{ color: '#aa00ff', fontWeight: 'bold' }}>AURA:</span><br/>{fmt(aura.atual)} / {fmt(aura.max)}
                                        </div>
                                        <div style={{ background: 'rgba(0,255,170,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #00ffaa' }}>
                                            <span style={{ color: '#00ffaa', fontWeight: 'bold' }}>CHAK:</span><br/>{fmt(chakra.atual)} / {fmt(chakra.max)}
                                        </div>
                                        <div style={{ background: 'rgba(255,136,0,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ff8800' }}>
                                            <span style={{ color: '#ff8800', fontWeight: 'bold' }}>CORP:</span><br/>{fmt(corpo.atual)} / {fmt(corpo.max)}
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #fff' }}>
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>P.VIT:</span><br/>{fmt(pVitais.atual)} / {fmt(pVitais.max)}
                                        </div>
                                        <div style={{ background: 'rgba(150,0,0,0.2)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ff3333' }}>
                                            <span style={{ color: '#ff3333', fontWeight: 'bold' }}>P.MOR:</span><br/>{fmt(pMortais.atual)} / {fmt(pMortais.max)}
                                        </div>
                                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '6px' }}>
                                            <div style={{ flex: 1, background: 'rgba(0,255,204,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #00ffcc' }}>
                                                <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>EVA:</span> {calcularCA(ficha, 'evasiva')}
                                            </div>
                                            <div style={{ flex: 1, background: 'rgba(255,204,0,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ffcc00' }}>
                                                <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>RES:</span> {calcularCA(ficha, 'resistencia')}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-neon btn-red"
                                        style={{ width: '100%', padding: '4px', fontSize: '0.8em', margin: 0, opacity: nome === meuNome ? 0.3 : 1 }}
                                        onClick={() => handleApagarJogador(nome)}
                                        disabled={nome === meuNome}
                                    >
                                        APAGAR ENTIDADE
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: '1 1 30%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="def-box" style={{ borderLeft: '4px solid #ff003c' }}>
                        <h3 style={{ color: '#ff003c', margin: '0 0 15px 0' }}>👹 Injetor de Entidades (Mapa)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input className="input-neon" type="text" placeholder="Nome (Ex: Dragão Ancião)" value={dNome} onChange={e => setDNome(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>HP Base</label><input className="input-neon" type="number" value={dHp} onChange={e => setDHp(e.target.value)} style={{ width: '100%' }} /></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0f0', fontSize: '0.8em' }}>+ Vitalidade (Zeros)</label><input className="input-neon" type="number" value={dVit} onChange={e => setDVit(e.target.value)} style={{ width: '100%', borderColor: '#0f0', color: '#0f0' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>Defesa Alvo</label><select className="input-neon" value={dDefTipo} onChange={e => setDDefTipo(e.target.value)} style={{ width: '100%' }}><option value="evasiva">Evasiva</option><option value="resistencia">Resistência</option></select></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0088ff', fontSize: '0.8em' }}>Valor (CA)</label><input className="input-neon" type="number" value={dDef} onChange={e => setDDef(e.target.value)} style={{ width: '100%' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                                <select className="input-neon" value={dVisivelHp} onChange={e => setDVisivelHp(e.target.value)} style={{ flex: 1 }}><option value="todos">HP Visível para Todos</option><option value="mestre">HP Oculto</option></select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: dOculto ? 'rgba(255,0,60,0.1)' : 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px', border: `1px solid ${dOculto ? '#ff003c' : '#444'}`, cursor: 'pointer', transition: 'all 0.3s' }}>
                                <input type="checkbox" checked={dOculto} onChange={e => setDOculto(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                <span style={{ color: dOculto ? '#ff003c' : '#aaa', fontWeight: dOculto ? 'bold' : 'normal' }}>{dOculto ? '👻 TOKEN INVISÍVEL NO MAPA' : '👁️ Token Visível no Mapa'}</span>
                            </label>
                            <button className="btn-neon btn-red" onClick={injetarDummie} style={{ marginTop: '10px', padding: '10px', fontSize: '1.1em', fontWeight: 'bold' }}>☄️ INVOCAR NO MAPA [0,0]</button>
                        </div>
                    </div>

                    <div className="def-box" style={{ borderLeft: '4px solid #ffcc00' }}>
                        <h3 style={{ color: '#ffcc00', margin: '0 0 15px 0' }}>⚡ A Voz do Sistema</h3>
                        <textarea className="input-neon" placeholder="Escreva uma mensagem global para o ecrã de todos..." value={msgSistema} onChange={e => setMsgSistema(e.target.value)} style={{ width: '100%', minHeight: '80px', borderColor: '#ffcc00', color: '#ffcc00' }} />
                        <button className="btn-neon btn-gold" onClick={enviarAviso} style={{ width: '100%', marginTop: '10px' }}>📢 ENVIAR AVISO GLOBAL</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const meuNome = useStore(s => s.meuNome)
    const setMeuNome = useStore(s => s.setMeuNome)
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha)
    const abaAtiva = useStore(s => s.abaAtiva)
    const setCenario = useStore(s => s.setCenario) 
    const setDummies = useStore(s => s.setDummies) 
    const [pronto, setPronto] = useState(false)

    useEffect(() => {
        let nomeLocal = localStorage.getItem('rpgNome')
        if (!nomeLocal) nomeLocal = localStorage.getItem('rpg_nome')
        if (nomeLocal) {
            const nomeSanitizado = sanitizarNome(nomeLocal)
            setMeuNome(nomeSanitizado)
            try {
                const backup = localStorage.getItem('rpgFicha_' + nomeSanitizado)
                if (backup) carregarDadosFicha(JSON.parse(backup))
            } catch (e) { console.warn('Falha:', e) }
            setPronto(true)
        }
    }, [setMeuNome, carregarDadosFicha])

    useEffect(() => {
        const unsubDummies = iniciarListenerDummies((dados) => {
            setDummies(dados || {})
        })
        return () => {
            if (unsubDummies) unsubDummies()
        }
    }, [setDummies])

    useEffect(() => {
        const unsubCenario = iniciarListenerCenario((dados) => {
            setCenario(dados);
        });
        return () => {
            if (unsubCenario) unsubCenario();
        };
    }, [setCenario])

    const { loading } = useFirebase()

    const handleNameSubmit = async (e) => {
        e.preventDefault()
        const input = e.target.elements.nomeInput.value.trim()
        if (!input) return
        const nomeSanitizado = sanitizarNome(input)
        if (!nomeSanitizado) return
        localStorage.setItem('rpgNome', nomeSanitizado)
        setMeuNome(nomeSanitizado)
        setPronto(true)
        try {
            const dados = await carregarFichaDoFirebase(nomeSanitizado)
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados)
        } catch (e) { console.warn('Falha:', e) }
    }

    if (!pronto && !meuNome) {
        return (
            <div className="modal-overlay" style={{ display: 'flex' }}>
                <form className="modal-box" onSubmit={handleNameSubmit}>
                    <h2 style={{ color: '#0ff', marginTop: 0 }}>Bem-vindo ao RPG</h2>
                    <p style={{ color: '#fff' }}>Digite o nome do seu personagem:</p>
                    <input name="nomeInput" type="text" autoFocus placeholder="Nome do personagem" maxLength={50} />
                    <button type="submit" className="btn-neon" style={{ marginTop: 15 }}>Entrar</button>
                </form>
            </div>
        )
    }

    const isMapMode = abaAtiva === 'aba-mapa'

    return (
        <div className="app-layout">
            <Sidebar />
            <div className={`main-content${isMapMode ? ' modo-mapa' : ''}`}>
                {!isMapMode && <h1 className="title">RPG Anime System</h1>}
                <TabPanel id="aba-perfil"><PerfilPanel /></TabPanel>
                <TabPanel id="aba-mestre"><MestrePanel /></TabPanel>
                <TabPanel id="aba-status"><StatusPanel /></TabPanel>
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
            </div>
            <ModalConfirm />
        </div>
    )
}