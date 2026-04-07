import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import useStore from '../../stores/useStore'; // Para sabermos o nome de quem está logado

export default function PainelDeVoz() {
    const meuNome = useStore(s => s.meuNome) || 'Desconhecido';
    
    // Formata o nome para ser um ID válido de "telefone" (sem espaços, minúsculas)
    const meuIDTelefone = meuNome.toLowerCase().replace(/[^a-z0-9]/g, '');

    const [peer, setPeer] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const [idDestino, setIdDestino] = useState('');
    const [conexoes, setConexoes] = useState([]); // Lista de quem estamos a ouvir
    const [mutado, setMutado] = useState(false);
    const [status, setStatus] = useState('A ligar à Rede Akáshica...');

    // Referência para guardar os elementos de áudio HTML
    const audioRefs = useRef({});

    // 1. LIGAR O RÁDIO ASSIM QUE ABRIR O PAINEL
    useEffect(() => {
        // Pede permissão para o microfone
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            setMeuStream(stream);
            
            // Cria a ligação Peer usando o nome da ficha como ID!
            const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`);
            
            novoPeer.on('open', (id) => {
                setPeer(novoPeer);
                setStatus(`🟢 Rádio Online! O seu canal é: ${meuIDTelefone.toUpperCase()}`);
            });

            // O QUE ACONTECE QUANDO ALGUÉM NOS LIGA:
            novoPeer.on('call', (call) => {
                setStatus(`Recebendo chamada de alguém...`);
                // Atendemos a chamada e enviamos o nosso microfone de volta
                call.answer(stream); 
                
                // Quando recebermos a voz da pessoa, guardamos na nossa lista
                call.on('stream', (remoteStream) => {
                    adicionarVoz(call.peer, remoteStream);
                });
            });

        }).catch(err => {
            setStatus(`❌ Erro de Microfone: ${err.message}`);
        });

        // Desliga tudo quando fechamos a aba
        return () => {
            if (peer) peer.destroy();
            if (meuStream) meuStream.getTracks().forEach(t => t.stop());
        };
    }, [meuIDTelefone]);

    // 2. FUNÇÃO PARA LIGAR PARA UM AMIGO
    const fazerChamada = () => {
        if (!peer || !meuStream || !idDestino) return;
        
        const idFormatado = `anime-rpg-${idDestino.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        setStatus(`A ligar para ${idDestino.toUpperCase()}...`);
        
        const call = peer.call(idFormatado, meuStream);
        
        call.on('stream', (remoteStream) => {
            adicionarVoz(idFormatado, remoteStream);
            setStatus(`🟢 Conectado com ${idDestino.toUpperCase()}!`);
            setIdDestino(''); // Limpa o campo
        });

        call.on('error', (err) => {
            setStatus(`❌ Erro ao ligar: O jogador não está online ou recusou.`);
        });
    };

    // 3. GERIR AS VOZES QUE ESTAMOS A OUVIR
    const adicionarVoz = (peerId, stream) => {
        setConexoes(prev => {
            if (prev.find(c => c.id === peerId)) return prev; // Evita duplicação
            return [...prev, { id: peerId, stream }];
        });
    };

    const removerVoz = (peerId) => {
        setConexoes(prev => prev.filter(c => c.id !== peerId));
    };

    // Atualiza os elementos <audio> sempre que alguém novo entra na chamada
    useEffect(() => {
        conexoes.forEach(con => {
            if (audioRefs.current[con.id] && !audioRefs.current[con.id].srcObject) {
                audioRefs.current[con.id].srcObject = con.stream;
            }
        });
    }, [conexoes]);

    // 4. BOTÃO DE MUTE
    const toggleMute = () => {
        if (meuStream) {
            meuStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled; // Liga ou desliga a captação
            });
            setMutado(!meuStream.getAudioTracks()[0].enabled);
        }
    };

    return (
        <div className="def-box" style={{ padding: '20px', border: '2px solid #00ffcc', borderRadius: '10px', background: 'rgba(0,0,0,0.8)' }}>
            <h3 style={{ color: '#00ffcc', marginTop: 0 }}>📻 Rádio da Party (Comunicação Direta)</h3>
            <p style={{ color: '#aaa', fontSize: '0.85em' }}>{status}</p>

            {/* O NOSSO MICROFONE */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                <button 
                    className={`btn-neon ${mutado ? 'btn-red' : 'btn-green'}`} 
                    onClick={toggleMute}
                    style={{ padding: '10px 20px', fontWeight: 'bold' }}
                >
                    {mutado ? '🔇 MICROFONE MUTADO' : '🎙️ MICROFONE ABERTO'}
                </button>
            </div>

            {/* LIGAR PARA ALGUÉM */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#fff' }}>Conectar a:</span>
                <input 
                    className="input-neon" 
                    placeholder="Nome da ficha (ex: Kiriya)" 
                    value={idDestino} 
                    onChange={e => setIdDestino(e.target.value)} 
                    style={{ flex: 1, padding: '8px' }}
                />
                <button className="btn-neon btn-blue" onClick={fazerChamada} style={{ padding: '8px 20px' }}>
                    📞 LIGAR
                </button>
            </div>

            {/* QUEM ESTAMOS A OUVIR */}
            <div>
                <h4 style={{ color: '#ffcc00', marginBottom: '10px' }}>👥 Na Frequência:</h4>
                {conexoes.length === 0 ? (
                    <span style={{ color: '#555', fontStyle: 'italic' }}>Você está sozinho no canal. Ligue para alguém!</span>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {conexoes.map(con => {
                            const nomeLimpo = con.id.replace('anime-rpg-', '').toUpperCase();
                            return (
                                <div key={con.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px', borderRadius: '5px', border: '1px solid #444' }}>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>🔊 {nomeLimpo}</span>
                                    
                                    {/* ELEMENTO DE ÁUDIO INVISÍVEL (É O QUE FAZ O SOM SAIR NAS COLUNAS) */}
                                    <audio ref={el => audioRefs.current[con.id] = el} autoPlay />
                                    
                                    <button className="btn-neon btn-red" onClick={() => removerVoz(con.id)} style={{ padding: '5px 10px', fontSize: '0.8em', margin: 0 }}>
                                        Desligar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}