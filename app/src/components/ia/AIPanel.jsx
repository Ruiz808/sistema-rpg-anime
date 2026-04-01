import React, { useState, useRef, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore';

// IMPORT DO SEU GRAVADOR (Ajuste o caminho se necessário)
import GravadorPanel from './GravadorPanel';

export default function AIPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);

    // --- ESTADOS DO MENUZINHO INTERNO ---
    const [subAba, setSubAba] = useState('chat');

    // --- ESTADOS DO CHAT DA IA ---
    const [mensagem, setMensagem] = useState('');
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const chatRef = useRef(null);

    // --- ESTADOS DA LORE E TIER LIST ---
    const [loreTexto, setLoreTexto] = useState('Capítulo 1: O Despertar...\n\n(Escreva a história da campanha aqui. No futuro, a Sexta-Feira poderá preencher isso sozinha com os resumos dos áudios!)');

    // Exemplo de dados para a Tier List (Você pode editar os nomes aqui!)
    const [tierList, setTierList] = useState([
        { rank: 'S', cor: '#ff003c', personagens: ['Natsu Ackermann', 'Elizabeth Frisk (Memória)', 'Chefe Final Desconhecido'] },
        { rank: 'A', cor: '#ffcc00', personagens: ['Jogador 2', 'Jogador 3'] },
        { rank: 'B', cor: '#00ffcc', personagens: ['NPC Aliado', 'Vilão Menor'] },
        { rank: 'C', cor: '#0088ff', personagens: ['Goblin Espião', 'Capanga'] },
        { rank: 'D', cor: '#888888', personagens: ['Figurante que morreu na primeira sessão'] },
    ]);

    // Rola o chat para baixo automaticamente
    useEffect(() => {
        if (subAba === 'chat' && chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [historico, subAba]);

    // Monta a ficha para enviar para a IA
    const montarContextoFicha = useCallback(() => {
        const bio = minhaFicha?.bio || {};
        const hierarquia = minhaFicha?.hierarquia || {};

        return {
            nome: meuNome,
            raca: bio.raca || 'Desconhecida',
            classe: bio.classe || 'Desconhecida',
            nivel: minhaFicha?.ascensaoBase || 1,
            hp: minhaFicha?.vida?.atual ?? 0,
            hpMax: minhaFicha?.vida?.base ?? 0,
            mana: minhaFicha?.mana?.atual ?? 0,
            manaMax: minhaFicha?.mana?.base ?? 0,
            forca: minhaFicha?.forca?.base ?? 0,
            destreza: minhaFicha?.destreza?.base ?? 0,
            inteligencia: minhaFicha?.inteligencia?.base ?? 0,
            sabedoria: minhaFicha?.sabedoria?.base ?? 0,
            carisma: minhaFicha?.carisma?.base ?? 0,
            constituicao: minhaFicha?.constituicao?.base ?? 0,
            hierarquia: {
                poder: hierarquia.poder || false,
                poderNome: hierarquia.poderNome || '',
                infinity: hierarquia.infinity || false,
                infinityNome: hierarquia.infinityNome || '',
                singularidade: hierarquia.singularidade || '',
                singularidadeNome: hierarquia.singularidadeNome || ''
            },
            poderes: (minhaFicha?.poderes || []).map(p => p.nome).slice(0, 10),
            inventario: (minhaFicha?.inventario || []).map(i => i.nome).slice(0, 10)
        };
    }, [minhaFicha, meuNome]);

    // Envia mensagem para o Firebase
    const enviarMensagem = useCallback(async () => {
        if (!mensagem.trim() || carregando) return;
        if (!functions) {
            setErro('Firebase Functions nao esta disponivel.');
            return;
        }

        const msgUsuario = mensagem.trim();
        setMensagem('');
        setErro('');
        setHistorico(prev => [...prev, { role: 'user', texto: msgUsuario }]);
        setCarregando(true);

        try {
            const chamarIA = httpsCallable(functions, 'falarComSextaFeira');
            const resultado = await chamarIA({
                mensagem: msgUsuario,
                contextoFicha: montarContextoFicha()
            });

            const resposta = resultado.data?.resposta || 'Sem resposta da IA.';
            setHistorico(prev => [...prev, { role: 'ai', texto: resposta }]);
        } catch (err) {
            console.error('[AIPanel] Erro ao chamar IA:', err);
            const msgErro = err.code === 'functions/unavailable'
                ? 'Servico indisponivel. Tente novamente em instantes.'
                : err.code === 'functions/not-found'
                ? 'Cloud Function nao encontrada. Verifique o deploy das functions.'
                : err.message || 'Erro desconhecido ao contactar a IA.';
            setHistorico(prev => [...prev, { role: 'erro', texto: msgErro }]);
        } finally {
            setCarregando(false);
        }
    }, [mensagem, carregando, montarContextoFicha]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    }, [enviarMensagem]);

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
            
            {/* CABEÇALHO E SUB-ABAS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #00ffcc', paddingBottom: 10 }}>
                <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: 0 }}>
                    Sexta-Feira (IA Central)
                </h2>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className={`btn-neon ${subAba === 'chat' ? 'btn-green' : ''}`} onClick={() => setSubAba('chat')} style={{ padding: '5px 10px', margin: 0 }}>💬 Chat</button>
                    <button className={`btn-neon ${subAba === 'gravador' ? 'btn-red' : ''}`} onClick={() => setSubAba('gravador')} style={{ padding: '5px 10px', margin: 0 }}>🎙️ Gravador</button>
                    <button className={`btn-neon ${subAba === 'tierlist' ? 'btn-gold' : ''}`} onClick={() => setSubAba('tierlist')} style={{ padding: '5px 10px', margin: 0 }}>🏆 Tier List</button>
                    <button className={`btn-neon ${subAba === 'lore' ? 'btn-blue' : ''}`} onClick={() => setSubAba('lore')} style={{ padding: '5px 10px', margin: 0 }}>📜 Registros</button>
                </div>
            </div>

            {/* CONTEÚDO: CHAT */}
            {subAba === 'chat' && (
                <>
                    <div ref={chatRef} className="def-box" style={{ flex: 1, minHeight: '300px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px' }}>
                        {historico.length === 0 && (
                            <div style={{ color: '#555', textAlign: 'center', fontStyle: 'italic', marginTop: '40px' }}>
                                A Sexta-Feira está online e pronta para ajudar.
                            </div>
                        )}

                        {historico.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%', padding: '10px 14px', borderRadius: '8px',
                                background: msg.role === 'user' ? 'rgba(0, 255, 204, 0.15)' : msg.role === 'erro' ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 136, 255, 0.15)',
                                border: `1px solid ${msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff'}`,
                                color: '#ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95em', lineHeight: '1.5'
                            }}>
                                <div style={{ fontSize: '0.7em', fontWeight: 'bold', marginBottom: '4px', color: msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff' }}>
                                    {msg.role === 'user' ? meuNome?.toUpperCase() || 'VOCE' : msg.role === 'erro' ? 'ERRO' : 'SEXTA-FEIRA'}
                                </div>
                                {msg.texto}
                            </div>
                        ))}

                        {carregando && (
                            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 136, 255, 0.1)', border: '1px solid #0088ff', color: '#0088ff', fontStyle: 'italic', fontSize: '0.9em' }}>
                                Sexta-Feira esta analisando...
                            </div>
                        )}
                    </div>

                    {erro && <div style={{ color: '#ff003c', fontSize: '0.85em', padding: '5px 10px', background: 'rgba(255,0,60,0.1)', borderRadius: '4px' }}>{erro}</div>}

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginTop: '10px' }}>
                        <textarea 
                            className="input-neon" 
                            placeholder="Fale com a Sexta-Feira..." 
                            value={mensagem} 
                            onChange={e => setMensagem(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            disabled={carregando} 
                            maxLength={2000} 
                            style={{ 
                                flex: 1, 
                                width: '100%', 
                                minHeight: '50px', 
                                maxHeight: '150px', 
                                resize: 'vertical', 
                                borderColor: '#00ffcc', 
                                color: '#fff',
                                padding: '12px'
                            }} 
                        />
                        <button 
                            className="btn-neon" 
                            onClick={enviarMensagem} 
                            disabled={carregando || !mensagem.trim()} 
                            style={{ 
                                padding: '0 25px', 
                                height: '50px', 
                                flexShrink: 0, 
                                borderColor: '#00ffcc', 
                                color: '#00ffcc', 
                                margin: 0, 
                                opacity: (carregando || !mensagem.trim()) ? 0.4 : 1 
                            }}
                        >
                            {carregando ? '...' : 'ENVIAR'}
                        </button>
                    </div>
                </>
            )}

            {/* CONTEÚDO: GRAVADOR */}
            {subAba === 'gravador' && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <GravadorPanel />
                </div>
            )}

            {/* CONTEÚDO: TIER LIST */}
            {subAba === 'tierlist' && (
                <div className="def-box" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{ color: '#fff', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>📊 Níveis de Ameaça / Força</h3>
                    
                    {tierList.map((tier, index) => (
                        <div key={index} style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', border: `1px solid ${tier.cor}`, borderRadius: '5px', minHeight: '60px' }}>
                            {/* CAIXA DA LETRA DO TIER */}
                            <div style={{ width: '80px', background: tier.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', fontWeight: 'bold', color: '#000', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>
                                {tier.rank}
                            </div>
                            
                            {/* CAIXA DOS PERSONAGENS */}
                            <div style={{ flex: 1, padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                {tier.personagens.map((pers, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '20px', border: `1px solid ${tier.cor}`, color: '#fff', fontSize: '0.9em' }}>
                                        {pers}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <p style={{ color: '#888', fontSize: '0.8em', textAlign: 'center', marginTop: '10px' }}>
                        No futuro, poderemos automatizar isso para ler os "Pontos de Prestígio" da ficha de cada jogador!
                    </p>
                </div>
            )}

            {/* CONTEÚDO: LORE E HISTÓRIA */}
            {subAba === 'lore' && (
                <div className="def-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                    <h3 style={{ color: '#0088ff', marginTop: 0, margin: 0 }}>📜 Registros Akáshicos da Mesa</h3>
                    <p style={{ color: '#aaa', fontSize: '0.9em', margin: 0 }}>
                        Quando o gravador estiver conectado ao servidor, a Sexta-Feira vai transcrever as sessões e salvar os resumos neste espaço automaticamente. Por enquanto, vocês podem editar as anotações manualmente.
                    </p>
                    <textarea 
                        className="input-neon"
                        value={loreTexto}
                        onChange={e => setLoreTexto(e.target.value)}
                        style={{ flex: 1, width: '100%', resize: 'none', borderColor: '#0088ff', color: '#ddd', lineHeight: '1.6', padding: '15px' }}
                    />
                </div>
            )}

        </div>
    );
}