import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db } from '../../services/firebase-config';
import useStore, { sanitizarNome } from '../../stores/useStore';
import { verificarMesaExistente, registrarNovaMesa, sairConta } from '../../services/firebase-sync';
import Swal from 'sweetalert2';

// ==========================================
// 🌌 MOTOR GRÁFICO DE FUNDO (Puro CSS & JS)
// ==========================================
const FundoAnimado = ({ tema }) => {
    // Gera 30 partículas aleatórias fixas para não piscarem ao digitar
    const particulas = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100, // Posição horizontal (0 a 100%)
        top: Math.random() * 100, // Posição vertical inicial (0 a 100%)
        size: Math.random() * 4 + 2, // Tamanho (2px a 6px)
        delay: Math.random() * 5, // Atraso na animação
        duracao: Math.random() * 10 + 10 // Duração da flutuação (10s a 20s)
    })), []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -2, overflow: 'hidden', background: '#020202' }}>
            
            {/* 🟢 TEMA CYBER: Grelha Holográfica em Movimento */}
            <div style={{ display: tema === 'theme-cyber' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute' }}>
                <div className="anim-cyber-grid" />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, transparent 0%, #020202 90%)' }} />
            </div>

            {/* 🩸 TEMA OCULTO: Pulso de Sangue e Brasas */}
            <div style={{ display: tema === 'theme-blood' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute' }}>
                <div className="anim-blood-pulse" />
                {particulas.map(p => (
                    <div key={`blood-${p.id}`} className="anim-blood-ember" style={{
                        left: `${p.left}%`, bottom: `-10%`, width: `${p.size}px`, height: `${p.size}px`,
                        animationDuration: `${p.duracao}s`, animationDelay: `${p.delay}s`
                    }} />
                ))}
            </div>

            {/* ⚔️ TEMA VIDRO/AÇO: Fragmentos e Reflexo Cortante */}
            <div style={{ display: tema === 'theme-glass' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', background: 'linear-gradient(135deg, #05070a 0%, #000 100%)' }}>
                <div className="anim-glass-shine" />
                {particulas.slice(0, 15).map(p => ( // Menos partículas para ficar minimalista
                    <div key={`glass-${p.id}`} className="anim-glass-shard" style={{
                        left: `${p.left}%`, top: `${p.top}%`, width: `${p.size * 2}px`, height: `${p.size * 2}px`,
                        animationDuration: `${p.duracao}s`, animationDelay: `${p.delay}s`
                    }} />
                ))}
            </div>

            <style>{`
                /* KEYFRAMES GERAIS DO MOTOR GRÁFICO */
                
                /* Cyber Grid */
                .anim-cyber-grid {
                    position: absolute; width: 100%; height: 200%; top: -50%;
                    background-image: 
                        linear-gradient(rgba(0, 255, 204, 0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 204, 0.15) 1px, transparent 1px);
                    background-size: 50px 50px;
                    transform: perspective(600px) rotateX(45deg);
                    animation: cyberMove 10s linear infinite;
                }
                @keyframes cyberMove { 0% { transform: perspective(600px) rotateX(45deg) translateY(0); } 100% { transform: perspective(600px) rotateX(45deg) translateY(50px); } }

                /* Blood Pulse & Embers */
                .anim-blood-pulse {
                    position: absolute; width: 100%; height: 100%;
                    background: radial-gradient(circle at 50% 50%, #2a0000 0%, #000 80%);
                    animation: bloodPulse 6s ease-in-out infinite alternate;
                }
                @keyframes bloodPulse { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 1; transform: scale(1.1); } }
                .anim-blood-ember {
                    position: absolute; background: #ff003c; border-radius: 50%;
                    box-shadow: 0 0 10px #ff003c, 0 0 20px #ff003c;
                    animation: bloodRise linear infinite; opacity: 0;
                }
                @keyframes bloodRise { 0% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: 0.8; } 80% { opacity: 0.8; } 100% { transform: translateY(-120vh) scale(0.5); opacity: 0; } }

                /* Glass Shards & Shine */
                .anim-glass-shine {
                    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0) 100%);
                    animation: glassSweep 10s linear infinite; pointer-events: none;
                }
                @keyframes glassSweep { 0% { transform: translate(-30%, -30%); } 100% { transform: translate(30%, 30%); } }
                .anim-glass-shard {
                    position: absolute; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); /* Formato de diamante/estilhaço */
                    animation: floatShard ease-in-out infinite alternate;
                }
                @keyframes floatShard { 0% { transform: translateY(0) rotate(0deg); opacity: 0.3; } 100% { transform: translateY(-30px) rotate(45deg); opacity: 0.8; } }
            `}</style>
        </div>
    );
};
// ==========================================

export default function LobbyNeon() {
    const { setMesaId, userLogado } = useStore();
    const [codigoSala, setCodigoSala] = useState('');
    const [abaMesas, setAbaMesas] = useState('jogador');
    const [ping, setPing] = useState(12);

    // ⚙️ ESTADOS DO PAINEL E CONFIGURAÇÕES
    const [mostrarConfig, setMostrarConfig] = useState(false);
    const [temaAtivo, setTemaAtivo] = useState(localStorage.getItem('rpg_tema') || 'theme-cyber');
    const [fonteAtiva, setFonteAtiva] = useState(localStorage.getItem('rpg_fonte') || 'sans-serif');
    const [brilho, setBrilho] = useState(localStorage.getItem('rpg_brilho') || '100');

    // 🔥 PWA
    const [canInstall, setCanInstall] = useState(!!window.deferredPrompt);
    useEffect(() => {
        const handleReady = () => setCanInstall(true);
        window.addEventListener('pwa-ready', handleReady);
        return () => window.removeEventListener('pwa-ready', handleReady);
    }, []);

    const handleInstallClick = async () => {
        if (!window.deferredPrompt) return;
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            window.deferredPrompt = null;
            setCanInstall(false);
        }
    };

    // 📡 Simulador de Ping
    useEffect(() => {
        const interval = setInterval(() => setPing(Math.floor(Math.random() * 15) + 8), 3000);
        return () => clearInterval(interval);
    }, []);

    // 🎨 Aplicação Dinâmica das Configurações
    useEffect(() => {
        document.body.className = temaAtivo;
        localStorage.setItem('rpg_tema', temaAtivo);
        localStorage.setItem('rpg_fonte', fonteAtiva);
        localStorage.setItem('rpg_brilho', brilho);
    }, [temaAtivo, fonteAtiva, brilho]);

    // Histórico de Mesas
    const [minhasMesas, setMinhasMesas] = useState(() => {
        try { 
            const stored = JSON.parse(localStorage.getItem('rpg_historico_mesas')) || []; 
            return stored.map(m => typeof m === 'string' ? { id: m, nome: m, isMestre: false } : { ...m, isMestre: m.isMestre || false });
        } catch(e) { return []; }
    });

    const atualizarHistoricoNuvem = async (novaLista) => {
        setMinhasMesas(novaLista);
        localStorage.setItem('rpg_historico_mesas', JSON.stringify(novaLista));
        if (userLogado) {
            const nickSanitizado = sanitizarNome(userLogado);
            try { await set(ref(db, `usuarios/${nickSanitizado}/historicoMesas`), novaLista); } catch(e){}
        }
    };

    useEffect(() => {
        if (!userLogado) return;
        const nickSanitizado = sanitizarNome(userLogado);
        const unsub = onValue(ref(db, `usuarios/${nickSanitizado}/historicoMesas`), (snap) => {
            if (snap.exists()) {
                const dadosNuvem = snap.val();
                setMinhasMesas(dadosNuvem);
                localStorage.setItem('rpg_historico_mesas', JSON.stringify(dadosNuvem));
            } else {
                const local = localStorage.getItem('rpg_historico_mesas');
                if (local) set(ref(db, `usuarios/${nickSanitizado}/historicoMesas`), JSON.parse(local));
            }
        });
        return () => unsub();
    }, [userLogado]);

    useEffect(() => {
        if (!userLogado || minhasMesas.length === 0) return;
        let mounted = true;
        const checkMesas = async () => {
            let updated = false;
            const novasMesas = await Promise.all(minhasMesas.map(async (m) => {
                const res = await verificarMesaExistente(m.id, '');
                if (res.existe) {
                    const nickSanitizado = sanitizarNome(userLogado);
                    const isMestreReal = !!(res.mestres && res.mestres[nickSanitizado]);
                    if (m.isMestre !== isMestreReal) { updated = true; return { ...m, isMestre: isMestreReal }; }
                }
                return m;
            }));
            if (mounted && updated) atualizarHistoricoNuvem(novasMesas);
        };
        checkMesas();
        return () => { mounted = false; };
    }, [userLogado, minhasMesas]); 

    const salvarNoHistorico = (id, nomePersonalizado = id, isMestreTable = false) => {
        let existing = minhasMesas.find(m => m.id === id);
        let finalName = existing ? existing.nome : nomePersonalizado;
        const filtrado = minhasMesas.filter(m => m.id !== id);
        atualizarHistoricoNuvem([{ id, nome: finalName, isMestre: isMestreTable }, ...filtrado].slice(0, 5));
    };

    const editarNomeMesa = (id, e) => {
        e.stopPropagation();
        const mesa = minhasMesas.find(m => m.id === id);
        const novoNome = window.prompt("Como deseja apelidar esta mesa?", mesa?.nome || id);
        if (!novoNome || !novoNome.trim()) return;
        atualizarHistoricoNuvem(minhasMesas.map(m => m.id === id ? { ...m, nome: novoNome.trim() } : m));
    };

    const removerDoHistorico = (idParaRemover, e) => {
        e.stopPropagation();
        atualizarHistoricoNuvem(minhasMesas.filter(m => m.id !== idParaRemover));
    };

    const criarMesa = async () => {
        const decisao = await Swal.fire({
            title: 'Proteger com Senha?', showDenyButton: true, showCancelButton: true,
            confirmButtonText: 'Sim (Com Senha)', denyButtonText: 'Não (Pública)', cancelButtonText: 'Cancelar',
            background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00ffcc', denyButtonColor: '#333'
        });
        if (decisao.isDismissed) return;
        let senha = '';
        if (decisao.isConfirmed) {
            const { value: senhaDigitada } = await Swal.fire({ title: 'Digite a Senha', input: 'password', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#00ffcc' });
            if (!senhaDigitada) return;
            senha = senhaDigitada;
        }
        const novoCodigo = 'MESA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        try {
            await registrarNovaMesa(novoCodigo, userLogado, senha);
            salvarNoHistorico(novoCodigo, novoCodigo, true); 
            setMesaId(novoCodigo); 
        } catch (e) { alert("Erro ao criar mesa!"); }
    };

    const entrarMesa = async (idForcado = null) => {
        const id = (idForcado || codigoSala).trim().toUpperCase();
        if (!id) return alert('Digite o código da entidade/mesa para aceder!');
        const resultado = await verificarMesaExistente(id);
        if (!resultado.existe) return alert('Sinal não encontrado na Membrana!');
        let checkFinal = resultado;
        if (!resultado.senhaCorreta) {
            const { value: senhaDigitada } = await Swal.fire({ title: 'Acesso Restrito!', input: 'password', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#0088ff', showCancelButton: true });
            if (!senhaDigitada) return;
            const reCheck = await verificarMesaExistente(id, senhaDigitada);
            if (!reCheck.senhaCorreta) return Swal.fire({ title: 'Acesso Negado', text: 'Senha Incorreta!', icon: 'error', background: '#0a0a0a', color: '#fff' });
            checkFinal = reCheck;
        }
        const nickSanitizado = sanitizarNome(userLogado);
        const souMestre = !!(checkFinal.mestres && checkFinal.mestres[nickSanitizado]);
        salvarNoHistorico(id, id, souMestre);
        setMesaId(id);
    };

    const mesasMestre = minhasMesas.filter(m => m.isMestre);
    const mesasJogador = minhasMesas.filter(m => !m.isMestre);

    const renderTableButton = (m, colorClass, icon, borderColor) => (
        <div key={m.id} style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${borderColor}`, padding: '6px', borderRadius: '8px', alignItems: 'stretch', transition: 'all 0.3s' }} className="hover-lift">
            <button onClick={() => entrarMesa(m.id)} className={`btn-neon ${colorClass}`} style={{ flex: 1, margin: 0, padding: '10px 15px', fontWeight: 'bold', fontSize: '1.1em', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <span style={{ fontSize: '1.4em', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>{icon}</span> 
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '1px' }}>{m.nome}</span>
            </button>
            <button onClick={(e) => editarNomeMesa(m.id, e)} style={{ width: '45px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', transition: '0.2s' }} title="Editar Apelido">✏️</button>
            <button onClick={(e) => removerDoHistorico(m.id, e)} style={{ width: '45px', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid rgba(255,0,60,0.5)', color: '#ff3333', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', transition: '0.2s' }} title="Apagar do Histórico">🗑️</button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px 0' }}>
            
            {/* 🧙‍♂️ INJEÇÃO DA NOSSA MAGIA GRÁFICA AQUI */}
            <FundoAnimado tema={temaAtivo} />
            
            {/* 🌑 Filtro de Brilho Global */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, pointerEvents: 'none', background: 'rgba(0,0,0,1)', opacity: 1 - (brilho / 100), transition: 'opacity 0.3s' }} />
            
            {/* 💉 Injeção de Fonte Global */}
            <style>{`
                * { font-family: ${fonteAtiva} !important; }
                .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
                @keyframes pulse { 0% { opacity: 0.6; box-shadow: 0 0 5px #0f0; } 50% { opacity: 1; box-shadow: 0 0 15px #0f0, 0 0 5px #0f0 inset; } 100% { opacity: 0.6; box-shadow: 0 0 5px #0f0; } }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
            `}</style>

            <div className="def-box fade-in" style={{ padding: '0', maxWidth: '750px', width: '95%', background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.5)', borderRadius: '15px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                
                {/* 🛡️ CABEÇALHO DO AGENTE */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.8) 100%)', padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #444, #111)', color: '#fff', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.4em', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }}>
                            {userLogado.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ color: '#888', fontSize: '0.65em', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Agente Conectado</span>
                            <strong style={{ color: '#fff', fontSize: '1.2em', letterSpacing: '1px', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>{userLogado}</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '6px', border: '1px solid #333' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0f0', boxShadow: '0 0 8px #0f0', animation: 'pulse 2s infinite' }}></span>
                            <span style={{ color: '#0f0', fontSize: '0.7em', fontWeight: 'bold', letterSpacing: '1px' }}>SYS.ON: {ping}ms</span>
                        </div>
                        <button title="Desconectar do Terminal" onClick={() => { if(window.confirm('Encerrar conexão de Agente?')) sairConta(); }} style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)', color: '#ff3333', cursor: 'pointer', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }} className="hover-lift">
                            SAIR 🚪
                        </button>
                    </div>
                </div>

                {/* ⚙️ PAINEL DE CONFIGURAÇÕES */}
                {mostrarConfig ? (
                    <div className="fade-in" style={{ padding: '30px 25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                            <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.5em' }}>⚙️</span> CALIBRAÇÃO DA MEMBRANA
                            </h2>
                            <button onClick={() => setMostrarConfig(false)} className="btn-neon btn-red" style={{ padding: '8px 15px', fontSize: '0.9em', borderRadius: '8px' }}>VOLTAR AO HUB</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Tema */}
                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                                <strong style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>1. Estilo Visual (Multitema)</strong>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setTemaAtivo('theme-cyber')} className={`btn-neon ${temaAtivo === 'theme-cyber' ? 'btn-blue' : ''}`} style={{ flex: 1, padding: '10px', fontSize: '0.9em' }}>🔵 CYBER-NEON</button>
                                    <button onClick={() => setTemaAtivo('theme-blood')} className={`btn-neon ${temaAtivo === 'theme-blood' ? 'btn-red' : ''}`} style={{ flex: 1, padding: '10px', fontSize: '0.9em' }}>🩸 SANGUE OCULTO</button>
                                    <button onClick={() => setTemaAtivo('theme-glass')} className={`btn-neon ${temaAtivo === 'theme-glass' ? 'btn-gold' : ''}`} style={{ flex: 1, padding: '10px', fontSize: '0.9em' }}>⚔️ AÇO/VIDRO</button>
                                </div>
                            </div>

                            {/* Fonte */}
                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                                <strong style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>2. Tipografia Global</strong>
                                <select className="input-neon" value={fonteAtiva} onChange={(e) => setFonteAtiva(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1em', background: '#000' }}>
                                    <option value="sans-serif">Padrão Sistema (Sans-Serif)</option>
                                    <option value="'Courier New', Courier, monospace">Documento Confidencial (Monospace)</option>
                                    <option value="'Times New Roman', Times, serif">Grimório Antigo (Serif)</option>
                                    <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Interface Futurista (Segoe UI)</option>
                                </select>
                            </div>

                            {/* Brilho */}
                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                                <strong style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span>3. Brilho da Tela</span>
                                    <span style={{ color: '#fff' }}>{brilho}%</span>
                                </strong>
                                <input type="range" min="20" max="100" step="5" value={brilho} onChange={(e) => setBrilho(e.target.value)} style={{ width: '100%', cursor: 'pointer', accentColor: '#00ffcc' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: '#666', fontSize: '0.7em' }}>
                                    <span>Escuro</span><span>Normal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 🌌 PAINEL PRINCIPAL DO LOBBY */
                    <div className="fade-in" style={{ padding: '30px 25px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#00ffcc', color: '#000', fontSize: '0.6em', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', letterSpacing: '2px' }}>V.2.0.26 - CORE SYSTEM</div>
                            <h1 style={{ color: 'inherit', margin: '15px 0 15px 0', textTransform: 'uppercase', letterSpacing: '5px', fontSize: '2.2em', fontWeight: '900', opacity: 0.9 }}>
                                REFERÊNCIAS RPG
                            </h1>
                            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#000', position: 'relative', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                                <img src="/capa-lobby.png" alt="Capa do Multiverso" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block', opacity: 0.8 }} onError={(e) => e.target.style.display = 'none'} />
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(0deg, rgba(10,10,15,1) 0%, rgba(0,0,0,0) 100%)' }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ background: 'rgba(0, 255, 204, 0.05)', border: '1px solid rgba(0, 255, 204, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }} className="hover-lift">
                                <div style={{ marginBottom: '15px' }}>
                                    <span style={{ fontSize: '2.5em', display: 'block', marginBottom: '5px', filter: 'drop-shadow(0 0 10px rgba(0,255,204,0.5))' }}>🌌</span>
                                    <strong style={{ color: '#fff', fontSize: '1.1em', display: 'block' }}>FORJAR REALIDADE</strong>
                                    <span style={{ color: '#888', fontSize: '0.8em' }}>Inicie uma nova campanha e assuma o manto de Mestre.</span>
                                </div>
                                <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '12px', fontSize: '1em', fontWeight: 'bold', borderRadius: '8px' }}>CRIAR SESSÃO</button>
                            </div>

                            <div style={{ background: 'rgba(255, 0, 60, 0.05)', border: '1px solid rgba(255, 0, 60, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }} className="hover-lift">
                                <div style={{ marginBottom: '15px' }}>
                                    <span style={{ fontSize: '2.5em', display: 'block', marginBottom: '5px', filter: 'drop-shadow(0 0 10px rgba(255,0,60,0.5))' }}>👁️</span>
                                    <strong style={{ color: '#ff3333', fontSize: '1.1em', display: 'block', textShadow: '0 0 10px rgba(255,0,60,0.5)' }}>DESAFIAR ENTIDADE</strong>
                                    <span style={{ color: '#888', fontSize: '0.8em' }}>Sincronize sua marca através do código de convite.</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input className="input-neon" type="text" placeholder="CÓDIGO (EX: MESA-A8)" value={codigoSala} onChange={e => setCodigoSala(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '0.9em', textAlign: 'center', textTransform: 'uppercase', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', border: '1px solid rgba(255, 0, 60, 0.3)', color: '#ff8888' }} />
                                    <button className="btn-neon btn-red" onClick={() => entrarMesa()} style={{ width: '100%', padding: '10px', fontSize: '1em', fontWeight: 'bold', borderRadius: '6px' }}>ACESSAR PORTAL</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                            <a href="https://discord.gg/SEU-LINK-AQUI" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.5)', color: '#5865F2', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', transition: 'all 0.3s' }} className="hover-lift">
                                <span style={{ fontSize: '1.3em' }}>👾</span> DISCORD DA GUILDA
                            </a>
                            <button onClick={() => setMostrarConfig(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(170, 170, 170, 0.1)', border: '1px solid rgba(170, 170, 170, 0.5)', color: '#ccc', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }} className="hover-lift">
                                <span style={{ fontSize: '1.3em' }}>⚙️</span> CONFIGURAÇÕES
                            </button>
                        </div>

                        <a href="COLOQUE_AQUI_O_LINK_COMPARTILHADO_DO_DRIVE" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '15px 20px', background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', textDecoration: 'none', marginBottom: '25px', boxSizing: 'border-box', transition: 'all 0.3s', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }} className="hover-lift">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontSize: '1.8em', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>🖥️</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ color: '#fff', fontSize: '1em', letterSpacing: '1px' }}>DESKTOP CLIENT V2</strong>
                                    <span style={{ color: '#aaa', fontSize: '0.8em' }}>A melhor experiência para Computador (.exe)</span>
                                </div>
                            </div>
                            <span style={{ color: '#000', background: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold', boxShadow: '0 0 10px #fff' }}>DOWNLOAD</span>
                        </a>

                        {canInstall && (
                            <button type="button" onClick={handleInstallClick} style={{ width: '100%', padding: '12px', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', color: '#ffcc00', fontSize: '1em', fontWeight: 'bold', marginBottom: '25px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }} className="hover-lift">
                                📥 INSTALAR APLICATIVO WEB
                            </button>
                        )}

                        {minhasMesas.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)' }}>
                                    <button onClick={() => setAbaMesas('jogador')} style={{ flex: 1, padding: '15px', background: abaMesas === 'jogador' ? 'rgba(0, 136, 255, 0.15)' : 'transparent', border: 'none', borderBottom: abaMesas === 'jogador' ? '2px solid #0088ff' : '2px solid transparent', color: abaMesas === 'jogador' ? '#fff' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        ⚔️ HISTÓRICO DE AGENTE ({mesasJogador.length})
                                    </button>
                                    <button onClick={() => setAbaMesas('mestre')} style={{ flex: 1, padding: '15px', background: abaMesas === 'mestre' ? 'rgba(255, 204, 0, 0.15)' : 'transparent', border: 'none', borderBottom: abaMesas === 'mestre' ? '2px solid #ffcc00' : '2px solid transparent', color: abaMesas === 'mestre' ? '#fff' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        👑 DOMÍNIOS ({mesasMestre.length})
                                    </button>
                                </div>

                                <div style={{ padding: '20px', minHeight: '180px', maxHeight: '250px', overflowY: 'auto' }}>
                                    {abaMesas === 'jogador' && (
                                        mesasJogador.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{mesasJogador.map(m => renderTableButton(m, '', '⚔️', 'rgba(0,136,255,0.3)'))}</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontStyle: 'italic', gap: '10px' }}>
                                                <span style={{ fontSize: '2.5em', filter: 'grayscale(1)', opacity: 0.5 }}>🏕️</span>
                                                Nenhum registo de aventura encontrado.
                                            </div>
                                        )
                                    )}

                                    {abaMesas === 'mestre' && (
                                        mesasMestre.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{mesasMestre.map(m => renderTableButton(m, '', '👑', 'rgba(255,204,0,0.3)'))}</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontStyle: 'italic', gap: '10px' }}>
                                                <span style={{ fontSize: '2.5em', filter: 'grayscale(1)', opacity: 0.5 }}>📜</span>
                                                Nenhum domínio sob seu controlo.
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}