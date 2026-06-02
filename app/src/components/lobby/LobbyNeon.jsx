import React, { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db } from '../../services/firebase-config';
import useStore, { sanitizarNome } from '../../stores/useStore';
import { verificarMesaExistente, registrarNovaMesa, sairConta } from '../../services/firebase-sync';
import Swal from 'sweetalert2';

export default function LobbyNeon() {
    const { setMesaId, userLogado } = useStore();
    const [codigoSala, setCodigoSala] = useState('');
    const [abaMesas, setAbaMesas] = useState('jogador');

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

    const salvarNoHistorico = (id, nomePersonalizado = id, isMestreTable = false) => {
        let existing = minhasMesas.find(m => m.id === id);
        let finalName = existing ? existing.nome : nomePersonalizado;
        const filtrado = minhasMesas.filter(m => m.id !== id);
        const novaLista = [{ id, nome: finalName, isMestre: isMestreTable }, ...filtrado].slice(0, 5);
        atualizarHistoricoNuvem(novaLista);
    };

    const editarNomeMesa = (id, e) => {
        e.stopPropagation();
        const mesa = minhasMesas.find(m => m.id === id);
        const novoNome = window.prompt("Como deseja apelidar esta mesa?", mesa?.nome || id);
        if (!novoNome || !novoNome.trim()) return;
        const novaLista = minhasMesas.map(m => m.id === id ? { ...m, nome: novoNome.trim() } : m);
        atualizarHistoricoNuvem(novaLista);
    };

    const removerDoHistorico = (idParaRemover, e) => {
        e.stopPropagation();
        const novaLista = minhasMesas.filter(m => m.id !== idParaRemover);
        atualizarHistoricoNuvem(novaLista);
    };

    const criarMesa = async () => {
        const decisao = await Swal.fire({
            title: 'Proteger com Senha?',
            showDenyButton: true, showCancelButton: true,
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
        if (!id) return alert('Digite o código da mesa para entrar!');
        const resultado = await verificarMesaExistente(id);
        if (!resultado.existe) return alert('Mesa não encontrada!');
        let checkFinal = resultado;
        if (!resultado.senhaCorreta) {
            const { value: senhaDigitada } = await Swal.fire({ title: 'Sala Protegida!', input: 'password', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#0088ff', showCancelButton: true });
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
        <div key={m.id} style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${borderColor}`, padding: '6px', borderRadius: '8px', alignItems: 'stretch' }}>
            <button onClick={() => entrarMesa(m.id)} className={`btn-neon ${colorClass}`} style={{ flex: 1, margin: 0, padding: '10px 15px', fontWeight: 'bold', fontSize: '1.1em', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3em' }}>{icon}</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</span>
            </button>
            <button onClick={(e) => editarNomeMesa(m.id, e)} style={{ width: '45px', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', color: '#ffcc00', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em' }}>✏️</button>
            <button onClick={(e) => removerDoHistorico(m.id, e)} style={{ width: '45px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c', color: '#ff003c', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em' }}>🗑️</button>
        </div>
    );

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '30px', maxWidth: '500px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.95)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.6)', padding: '12px 20px', borderRadius: '12px', border: '1px solid #00ffcc', marginBottom: '25px', boxShadow: 'inset 0 0 15px rgba(0,255,204,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #00ffcc, #0088ff)', color: '#000', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2em', boxShadow: '0 0 10px rgba(0,255,204,0.5)' }}>
                            {userLogado.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ color: '#aaa', fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Identificação</span>
                            <strong style={{ color: '#fff', fontSize: '1.1em', letterSpacing: '1px' }}>{userLogado}</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button title="Sair da Conta" onClick={() => { if(window.confirm('Sair da conta?')) sairConta(); }} style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c', color: '#ff003c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em' }}>🚪</button>
                    </div>
                </div>

                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                
                <div style={{ width: '100%', marginBottom: '25px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(0, 255, 204, 0.3)', boxShadow: '0 0 20px rgba(0,255,204,0.1)' }}>
                    <img src="/capa-lobby.png" alt="Capa do Multiverso" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} onError={(e) => e.target.style.display = 'none'} />
                </div>

                <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '25px', borderRadius: '10px' }}>🌌 CRIAR NOVA MESA (Mestre)</button>
                
                <a href="COLOQUE_AQUI_O_LINK_COMPARTILHADO_DO_DRIVE" target="_blank" rel="noopener noreferrer" className="btn-neon btn-blue" style={{ display: 'block', width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '25px', textDecoration: 'none', boxSizing: 'border-box', textAlign: 'center', borderRadius: '10px' }}>
                    🖥️ BAIXAR APLICATIVO PARA WINDOWS
                </a>

                {minhasMesas.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button className={`btn-neon ${abaMesas === 'mestre' ? 'btn-gold' : ''}`} onClick={() => setAbaMesas('mestre')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', margin: 0, opacity: abaMesas === 'mestre' ? 1 : 0.5 }}>👑 MESTRANDO ({mesasMestre.length})</button>
                            <button className={`btn-neon ${abaMesas === 'jogador' ? 'btn-blue' : ''}`} onClick={() => setAbaMesas('jogador')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', margin: 0, opacity: abaMesas === 'jogador' ? 1 : 0.5 }}>⚔️ JOGANDO ({mesasJogador.length})</button>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', border: '1px solid #222', minHeight: '180px' }}>
                            {abaMesas === 'mestre' && (mesasMestre.length > 0 ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{mesasMestre.map(m => renderTableButton(m, 'btn-gold', '👑', '#ffcc00'))}</div> : <div style={{ color: '#666', fontStyle: 'italic', padding: '20px' }}>Você não mestra nenhuma mesa.</div>)}
                            {abaMesas === 'jogador' && (mesasJogador.length > 0 ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{mesasJogador.map(m => renderTableButton(m, 'btn-blue', '⚔️', '#0088ff'))}</div> : <div style={{ color: '#666', fontStyle: 'italic', padding: '20px' }}>Você não participa de nenhuma aventura.</div>)}
                        </div>
                    </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="input-neon" type="text" placeholder="Cole o Código (Ex: MESA-A8X9P)" value={codigoSala} onChange={e => setCodigoSala(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '1.1em', textAlign: 'center', textTransform: 'uppercase', boxSizing: 'border-box' }} />
                    <button className="btn-neon btn-blue" onClick={() => entrarMesa()} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', borderRadius: '10px' }}>🚪 ENTRAR NA SALA</button>
                </div>
            </div>
        </div>
    );
}