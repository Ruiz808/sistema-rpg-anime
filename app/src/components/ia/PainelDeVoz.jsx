import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import useStore from '../../stores/useStore';

// Função auxiliar para injetar as imagens com segurança no CSS
function urlSegura(url) {
    if (!url || typeof url !== 'string') return 'none';
    return `url("${url.trim().replace(/["\\)]/g, '')}")`;
}

export default function PainelDeVoz() {
    const meuNome = useStore(s => s.meuNome) || 'Desconhecido';
    const minhaFicha = useStore(s => s.minhaFicha);
    const personagens = useStore(s => s.personagens);
    
    const meuIDTelefone = meuNome.toLowerCase().replace(/[^a-z0-9]/g, '');

    const [peer, setPeer] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const [idDestino, setIdDestino] = useState('');
    const [conexoes, setConexoes] = useState([]); 
    const [mutado, setMutado] = useState(false);
    const [surdo, setSurdo] = useState(false); // Novo estado: Deafen
    const [status, setStatus] = useState('Conectando à Rede...');
    const [expandido, setExpandido] = useState(true); // Agora começa aberto por padrão

    const audioRefs = useRef({});

    // Vai buscar a foto de perfil baseada no nome da ficha
    const getAvatarImg = (nomePlayer) => {
        if (nomePlayer === meuNome) return minhaFicha?.avatar?.base || '';
        // Para os amigos, procuramos nas fichas partilhadas
        const nomeOriginal = Object.keys(personagens || {}).find(n => n.toLowerCase().replace(/[^a-z0-9]/g, '') === nomePlayer.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (nomeOriginal && personagens[nomeOriginal]) return personagens[nomeOriginal].avatar?.base || '';
        return '';
    };

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            setMeuStream(stream);
            const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`);
            
            novoPeer.on('open', (id) => {
                setPeer(novoPeer);
                setStatus(`Conectado como ${meuIDTelefone.toUpperCase()}`);
            });

            novoPeer.on('call', (call) => {
                setStatus(`Recebendo chamada...`);
                call.answer(stream); 
                call.on('stream', (remoteStream) => {
                    adicionarVoz(call.peer, remoteStream);
                });
            });

        }).catch(err => {
            setStatus(`Erro de Mic: ${err.message}`);
        });

        return () => {
            if (peer) peer.destroy();
            if (meuStream) meuStream.getTracks().forEach(t => t.stop());
        };
    }, [meuIDTelefone]);

    const fazerChamada = () => {
        if (!peer || !meuStream || !idDestino) return;
        
        const idFormatado = `anime-rpg-${idDestino.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        setStatus(`Chamando ${idDestino.toUpperCase()}...`);
        
        const call = peer.call(idFormatado, meuStream);
        
        call.on('stream', (remoteStream) => {
            adicionarVoz(idFormatado, remoteStream);
            setStatus(`Conectado!`);
            setIdDestino(''); 
        });

        call.on('error', (err) => {
            setStatus(`Jogador offline.`);
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

    const desconectarTudo = () => {
        conexoes.forEach(c => removerVoz(c.id));
        setStatus(`Desconectado da Party.`);
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
            meuStream.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
            setMutado(!meuStream.getAudioTracks()[0].enabled);
        }
    };

    const toggleDeafen = () => {
        setSurdo(!surdo);
        // Muta os elementos de áudio HTML dos outros jogadores
        Object.values(audioRefs.current).forEach(audioEl => {
            if (audioEl) audioEl.muted = !surdo;
        });
    };

    // Total de participantes (Nós + Conexões)
    const totalParticipantes = conexoes.length + 1;

    if (!expandido) {
        return (
            <div 
                onClick={() => setExpandido(true)}
                title="Abrir Party Call"
                style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99998,
                    background: 'rgba(20, 30, 35, 0.85)', border: '2px solid #00ffcc', borderRadius: '30px', 
                    padding: '8px 25px', color: '#00ffcc', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)', backdropFilter: 'blur(5px)'
                }}
            >
                🎙️ PARTY CALL ({totalParticipantes})
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99998, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            
            {/* CAIXA PRINCIPAL ESTILO DISCORD */}
            <div style={{ background: 'rgba(25, 35, 40, 0.95)', border: '1px solid rgba(0, 255, 204, 0.3)', borderRadius: '15px', padding: '20px 30px', boxShadow: '0 15px 35px rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '350px' }}>
                
                {/* CABEÇALHO */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        PARTY CALL - {totalParticipantes} PARTICIPANTE(S)
                    </div>
                    <button onClick={() => setExpandido(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2em' }}>_</button>
                </div>

                {/* BOTÕES DE AÇÃO REDONDOS */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <button onClick={toggleMute} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: mutado ? '#ff003c' : '#00ffcc', color: mutado ? '#fff' : '#000', fontSize: '1.2em', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${mutado ? '#ff003c' : '#00ffcc'}` }}>
                            {mutado ? '🔇' : '🎙️'}
                        </button>
                        <span style={{ color: '#aaa', fontSize: '0.65em', textTransform: 'uppercase' }}>Mute</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <button onClick={toggleDeafen} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: surdo ? '#ff003c' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.2em', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {surdo ? '🔕' : '🎧'}
                        </button>
                        <span style={{ color: '#aaa', fontSize: '0.65em', textTransform: 'uppercase' }}>Deafen</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <button style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.2em', cursor: 'not-allowed', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            📹
                        </button>
                        <span style={{ color: '#555', fontSize: '0.65em', textTransform: 'uppercase' }}>Video</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <button onClick={desconectarTudo} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: '#ff003c', color: '#fff', fontSize: '1.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #ff003c' }}>
                            ❌
                        </button>
                        <span style={{ color: '#aaa', fontSize: '0.65em', textTransform: 'uppercase' }}>Disconnect</span>
                    </div>
                </div>

                {/* ÁREA DOS AVATARES */}
                <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', padding: '10px 0' }}>
                    
                    {/* NOSSO AVATAR */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative' }}>
                        <div style={{ 
                            width: '90px', height: '90px', borderRadius: '50%', 
                            border: `4px solid ${mutado ? '#555' : '#00ffcc'}`, // Anel Azul/Verde Neon
                            backgroundImage: urlSegura(getAvatarImg(meuNome)), backgroundSize: 'cover', backgroundPosition: 'top center',
                            backgroundColor: '#222', boxShadow: mutado ? 'none' : '0 0 20px rgba(0,255,204,0.5)', transition: '0.3s'
                        }} />
                        <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '15px', color: '#fff', fontSize: '0.75em', fontWeight: 'bold' }}>
                            {meuNome} (Você)
                        </div>
                        {mutado && <div style={{ position: 'absolute', top: 0, right: 0, background: '#ff003c', borderRadius: '50%', padding: '5px', fontSize: '12px', boxShadow: '0 0 5px #000' }}>🔇</div>}
                    </div>

                    {/* AVATARES DOS AMIGOS CONECTADOS */}
                    {conexoes.map(con => {
                        const nomeLimpo = con.id.replace('anime-rpg-', '');
                        // Capitaliza a primeira letra para ficar bonito
                        const nomeExibicao = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1);
                        
                        return (
                            <div key={con.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative' }}>
                                <div style={{ 
                                    width: '90px', height: '90px', borderRadius: '50%', 
                                    border: '4px solid #ff8800', // Anel Laranja para os outros
                                    backgroundImage: urlSegura(getAvatarImg(nomeLimpo)), backgroundSize: 'cover', backgroundPosition: 'top center',
                                    backgroundColor: '#222', boxShadow: '0 0 15px rgba(255, 136, 0, 0.3)'
                                }}>
                                    {!getAvatarImg(nomeLimpo) && <span style={{ color: '#555', fontSize: '30px', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>👤</span>}
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '15px', color: '#fff', fontSize: '0.75em', fontWeight: 'bold' }}>
                                    {nomeExibicao}
                                </div>
                                <audio ref={el => audioRefs.current[con.id] = el} autoPlay />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BARRA INFERIOR PARA LIGAR A NOVOS JOGADORES */}
            <div style={{ background: 'rgba(10,15,20,0.9)', border: '1px solid #333', borderRadius: '10px', padding: '10px 15px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', width: '350px' }}>
                <span style={{ color: '#aaa', fontSize: '0.8em' }}>Adicionar:</span>
                <input 
                    className="input-neon" 
                    placeholder="Nome da ficha" 
                    value={idDestino} 
                    onChange={e => setIdDestino(e.target.value)} 
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.85em', background: '#000', border: '1px solid #444' }} 
                />
                <button className="btn-neon btn-blue" onClick={fazerChamada} style={{ padding: '6px 15px', margin: 0, fontSize: '0.85em' }}>Ligar</button>
            </div>
            
            <div style={{ color: '#aaa', fontSize: '0.7em', marginTop: '-5px' }}>{status}</div>
        </div>
    );
}