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
    const [status, setStatus] = useState('A ligar à Rede Akáshica...');

    const audioRefs = useRef({});

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            setMeuStream(stream);
            
            const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`);
            
            novoPeer.on('open', (id) => {
                setPeer(novoPeer);
                setStatus(`🟢 Rádio Online! O seu canal é: ${meuIDTelefone.toUpperCase()}`);
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

    // 🔥 O TRUQUE DE MESTRE AQUI 🔥
    // Sempre que alguém entra ou sai, partilhamos as vozes globalmente para a Sexta-Feira!
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
        <div className="def-box" style={{ padding: '20px', border: '2px solid #00ffcc', borderRadius: '10px', background: 'rgba(0,0,0,0.8)' }}>
            <h3 style={{ color: '#00ffcc', marginTop: 0 }}>📻 Rádio da Party</h3>
            <p style={{ color: '#aaa', fontSize: '0.85em' }}>{status}</p>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                <button className={`btn-neon ${mutado ? 'btn-red' : 'btn-green'}`} onClick={toggleMute} style={{ padding: '10px 20px', fontWeight: 'bold' }}>
                    {mutado ? '🔇 MICROFONE MUTADO' : '🎙️ MICROFONE ABERTO'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#fff' }}>Conectar a:</span>
                <input className="input-neon" placeholder="Ex: Kiriya" value={idDestino} onChange={e => setIdDestino(e.target.value)} style={{ flex: 1, padding: '8px' }} />
                <button className="btn-neon btn-blue" onClick={fazerChamada} style={{ padding: '8px 20px' }}>📞 LIGAR</button>
            </div>

            <div>
                <h4 style={{ color: '#ffcc00', marginBottom: '10px' }}>👥 Na Frequência:</h4>
                {conexoes.length === 0 ? (
                    <span style={{ color: '#555', fontStyle: 'italic' }}>Você está sozinho no canal.</span>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {conexoes.map(con => {
                            const nomeLimpo = con.id.replace('anime-rpg-', '').toUpperCase();
                            return (
                                <div key={con.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px', borderRadius: '5px', border: '1px solid #444' }}>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>🔊 {nomeLimpo}</span>
                                    <audio ref={el => audioRefs.current[con.id] = el} autoPlay />
                                    <button className="btn-neon btn-red" onClick={() => removerVoz(con.id)} style={{ padding: '5px 10px', fontSize: '0.8em', margin: 0 }}>Desligar</button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}