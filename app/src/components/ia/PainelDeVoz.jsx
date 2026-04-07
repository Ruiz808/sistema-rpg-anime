import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import useStore from '../../stores/useStore'; 

export default function PainelDeVoz() {
    const meuNome = useStore(s => s.meuNome) || 'Desconhecido';
    const meuIDTelefone = meuNome.toLowerCase().replace(/[^a-z0-9]/g, '');

    const [peer, setPeer] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const [idDestino, setIdDestino] = useState('');
    const [conexoes, setConexoes] = useState([]); 
    const [mutado, setMutado] = useState(false);
    const [status, setStatus] = useState('A ligar à Rede...');
    
    // 🔥 CONTROLE DO WIDGET FLUTUANTE 🔥
    const [expandido, setExpandido] = useState(false);

    const audioRefs = useRef({});

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            setMeuStream(stream);
            
            const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`);
            
            novoPeer.on('open', (id) => {
                setPeer(novoPeer);
                setStatus(`🟢 Canal: ${meuIDTelefone.toUpperCase()}`);
            });

            novoPeer.on('call', (call) => {
                setStatus(`Recebendo chamada...`);
                call.answer(stream); 
                
                call.on('stream', (remoteStream) => {
                    adicionarVoz(call.peer, remoteStream);
                });
            });

        }).catch(err => {
            setStatus(`❌ Erro de Microfone: ${err.message}`);
        });

        // Isto só vai rodar agora se fechar o site inteiro!
        return () => {
            if (peer) peer.destroy();
            if (meuStream) meuStream.getTracks().forEach(t => t.stop());
        };
    }, [meuIDTelefone]);

    const fazerChamada = () => {
        if (!peer || !meuStream || !idDestino) return;
        
        const idFormatado = `anime-rpg-${idDestino.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        setStatus(`A ligar para ${idDestino.toUpperCase()}...`);
        
        const call = peer.call(idFormatado, meuStream);
        
        call.on('stream', (remoteStream) => {
            adicionarVoz(idFormatado, remoteStream);
            setStatus(`🟢 Conectado com ${idDestino.toUpperCase()}!`);
            setIdDestino(''); 
        });

        call.on('error', (err) => {
            setStatus(`❌ Erro ao ligar: Jogador offline.`);
        });
    };

    const adicionarVoz = (peerId, stream) => {
        setConexoes(prev => {
            if (prev.find(c => c.id === peerId)) return prev; 
            return [...prev, { id: peerId, stream }];
        });
    };

    const removerVoz = (peerId) => {
        setConexoes(prev => prev.filter(c => c.id !== peerId));
    };

    useEffect(() => {
        window.remoteAudioStreams = conexoes.map(c => c.stream);
        
        conexoes.forEach(con => {
            if (audioRefs.current[con.id] && !audioRefs.current[con.id].srcObject) {
                audioRefs.current[con.id].srcObject = con.stream;
            }
        });
    }, [conexoes]);

    const toggleMute = () => {
        if (meuStream) {
            meuStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled; 
            });
            setMutado(!meuStream.getAudioTracks()[0].enabled);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '90px', right: '25px', zIndex: 99998, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            
            {/* O PAINEL ABERTO */}
            {expandido && (
                <div className="fade-in def-box" style={{ padding: '15px', border: '2px solid #00ffcc', borderRadius: '10px', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(5px)', width: '280px', boxShadow: '0 0 20px rgba(0,255,204,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h4 style={{ color: '#00ffcc', margin: 0 }}>📻 Rádio da Party</h4>
                        <button onClick={() => setExpandido(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>
                    <p style={{ color: '#aaa', fontSize: '0.8em', margin: '0 0 10px 0' }}>{status}</p>

                    <button className={`btn-neon ${mutado ? 'btn-red' : 'btn-green'}`} onClick={toggleMute} style={{ padding: '8px', fontWeight: 'bold', width: '100%', marginBottom: '15px', fontSize: '0.85em' }}>
                        {mutado ? '🔇 MUTADO' : '🎙️ MICROFONE ABERTO'}
                    </button>

                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '15px' }}>
                        <input className="input-neon" placeholder="Ex: Kiriya" value={idDestino} onChange={e => setIdDestino(e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '0.85em' }} />
                        <button className="btn-neon btn-blue" onClick={fazerChamada} style={{ padding: '6px 10px', margin: 0, fontSize: '0.85em' }}>📞 LIGAR</button>
                    </div>

                    <div>
                        <h5 style={{ color: '#ffcc00', margin: '0 0 5px 0' }}>👥 Na Frequência:</h5>
                        {conexoes.length === 0 ? (
                            <div style={{ color: '#555', fontStyle: 'italic', fontSize: '0.8em' }}>Sozinho no canal.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '120px', overflowY: 'auto' }}>
                                {conexoes.map(con => {
                                    const nomeLimpo = con.id.replace('anime-rpg-', '').toUpperCase();
                                    return (
                                        <div key={con.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '6px', borderRadius: '5px', border: '1px solid #444' }}>
                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.8em' }}>🔊 {nomeLimpo}</span>
                                            <audio ref={el => audioRefs.current[con.id] = el} autoPlay />
                                            <button className="btn-neon btn-red" onClick={() => removerVoz(con.id)} style={{ padding: '2px 6px', fontSize: '0.7em', margin: 0 }}>Desligar</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BOTÃO FLUTUANTE (WALKIE-TALKIE) */}
            <div 
                onClick={() => setExpandido(!expandido)}
                title="Rádio da Party"
                style={{
                    width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(10,10,15,0.9)', 
                    border: '2px solid #00ffcc', boxShadow: '0 0 10px #00ffcc', color: '#00ffcc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    cursor: 'pointer', transition: 'all 0.3s', backdropFilter: 'blur(3px)'
                }}
            >
                📻
            </div>
        </div>
    );
}