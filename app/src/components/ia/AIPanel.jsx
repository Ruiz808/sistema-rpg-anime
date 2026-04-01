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

    // --- ESTADOS DA LORE DIVIDIDA E CAPÍTULOS ---
    const [loreFoco, setLoreFoco] = useState('presente'); 
    
    // O Presente agora é um Livro com vários Capítulos!
    const [capitulosPresente, setCapitulosPresente] = useState([
        { 
            id: 1, 
            titulo: 'Capítulo 1 - Reino de Faku', 
            texto: 'A marca da fênix entrelaçada com o símbolo do infinito e o número quatro arde nas páginas deste diário...\n\n(Escreva os registros da primeira parte aqui)' 
        }
    ]);
    const [capituloAtivoId, setCapituloAtivoId] = useState(1);
    
    // O Futuro continua como uma visão única (por enquanto)
    const [loreFuturo, setLoreFuturo] = useState('Crônicas do Amanhã...\n\n(O mundo mudou. Registre aqui os ecos da linha do tempo futura e o que sobrou dos Marcados...)');

    // Exemplo de dados para a Tier List 
    const [tierList, setTierList] = useState([
        { rank: 'S', cor: '#ff003c', personagens: ['Natsu Ackermann', 'Elizabeth Frisk (Memória)', 'Chefe Final Desconhecido'] },
        { rank: 'A', cor: '#ffcc00', personagens: ['Jogador 2', 'Jogador 3'] },
        { rank: 'B', cor: '#00ffcc', personagens: ['NPC Aliado', 'Vilão Menor'] },
        { rank: 'C', cor: '#0088ff', personagens: ['Goblin Espião', 'Capanga'] },
        { rank: 'D', cor: '#888888', personagens: ['Figurante que morreu na primeira sessão'] },
    ]);

    // --- FUNÇÕES DE LORE E CAPÍTULOS ---
    const adicionarCapitulo = () => {
        const titulo = window.prompt("Nome do novo capítulo (Ex: Capítulo 2 - Guerra Santa):");
        if (!titulo || titulo.trim() === '') return;
        
        const novoId = Date.now(); // Gera um ID único baseado no tempo
        setCapitulosPresente(prev => [...prev, { id: novoId, titulo, texto: '' }]);
        setCapituloAtivoId(novoId); // Já muda automaticamente para o capítulo novo
    };

    const editarTituloCapitulo = () => {
        const capAtual = capitulosPresente.find(cap => cap.id === capituloAtivoId);
        if (!capAtual) return;
        
        const novoTitulo = window.prompt("Editar nome do capítulo:", capAtual.titulo);
        if (!novoTitulo || novoTitulo.trim() === '') return;
        
        setCapitulosPresente(prev => prev.map(cap => 
            cap.id === capituloAtivoId ? { ...cap, titulo: novoTitulo } : cap
        ));
    };

    const atualizarTextoPresente = (novoTexto) => {
        setCapitulosPresente(prev => prev.map(cap => 
            cap.id === capituloAtivoId ? { ...cap, texto: novoTexto } : cap
        ));
    };
    
    // Pega o texto do capítulo que está selecionado agora
    const textoAtivoPresente = capitulosPresente.find(cap => cap.id === capituloAtivoId)?.texto || '';


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

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginTop: '10px', width: '100%' }}>
                        <textarea 
                            className="input-neon" 
                            placeholder="Fale com a Sexta-Feira..." 
                            value={mensagem} 
                            onChange={e => setMensagem(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            disabled={carregando} 
                            maxLength={2000} 
                            style={{ 
                                flex: '1 1 auto', 
                                width: '100%', 
                                minHeight: '60px', 
                                maxHeight: '150px', 
                                resize: 'vertical', 
                                borderColor: '#00ffcc', 
                                color: '#fff',
                                padding: '12px',
                                boxSizing: 'border-box'
                            }} 
                        />
                        <button 
                            className="btn-neon" 
                            onClick={enviarMensagem} 
                            disabled={carregando || !mensagem.trim()} 
                            style={{ 
                                flex: 'none', 
                                width: 'auto',
                                minWidth: '120px',
                                height: '60px', 
                                padding: '0 20px',
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
                            <div style={{ width: '80px', background: tier.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', fontWeight: 'bold', color: '#000', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>
                                {tier.rank}
                            </div>
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

            {/* CONTEÚDO: LORE E HISTÓRIA (AGORA COM EDIÇÃO DE CAPÍTULOS!) */}
            {subAba === 'lore' && (
                <div className="def-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                    
                    {/* CABEÇALHO DA LORE COM OS BOTÕES DE TEMPO */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ color: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', marginTop: 0, margin: 0, transition: 'color 0.3s' }}>
                                📜 Registros Akáshicos
                            </h3>
                            <p style={{ color: '#aaa', fontSize: '0.9em', margin: 0 }}>
                                {loreFoco === 'presente' ? 'Lendo: Linha do Tempo Atual' : 'Lendo: Ecos do Futuro'}
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className={`btn-neon ${loreFoco === 'presente' ? 'btn-green' : ''}`} 
                                onClick={() => setLoreFoco('presente')} 
                                style={{ padding: '8px 15px', fontSize: '0.9em', margin: 0, opacity: loreFoco === 'presente' ? 1 : 0.5 }}>
                                ⏳ Presente
                            </button>
                            <button 
                                className={`btn-neon ${loreFoco === 'futuro' ? 'btn-gold' : ''}`} 
                                onClick={() => setLoreFoco('futuro')} 
                                style={{ padding: '8px 15px', fontSize: '0.9em', margin: 0, opacity: loreFoco === 'futuro' ? 1 : 0.5 }}>
                                🚀 Futuro
                            </button>
                        </div>
                    </div>

                    {/* SELETOR E EDIÇÃO DE CAPÍTULOS (SÓ APARECE NO PRESENTE) */}
                    {loreFoco === 'presente' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>📖 Capítulo:</span>
                            <select 
                                className="input-neon" 
                                value={capituloAtivoId} 
                                onChange={(e) => setCapituloAtivoId(Number(e.target.value))}
                                style={{ flex: 1, minWidth: '150px', borderColor: '#00ffcc', color: '#fff', padding: '8px', backgroundColor: 'rgba(0,0,0,0.5)' }}
                            >
                                {capitulosPresente.map(cap => (
                                    <option key={cap.id} value={cap.id} style={{ color: '#000' }}>
                                        {cap.titulo}
                                    </option>
                                ))}
                            </select>
                            
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button className="btn-neon btn-gold" onClick={editarTituloCapitulo} style={{ padding: '8px 15px', margin: 0 }}>
                                    ✏️ Editar Nome
                                </button>
                                <button className="btn-neon btn-green" onClick={adicionarCapitulo} style={{ padding: '8px 15px', margin: 0 }}>
                                    ➕ Novo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CAIXA DE TEXTO PRINCIPAL */}
                    <textarea 
                        className="input-neon"
                        value={loreFoco === 'presente' ? textoAtivoPresente : loreFuturo}
                        onChange={e => loreFoco === 'presente' ? atualizarTextoPresente(e.target.value) : setLoreFuturo(e.target.value)}
                        placeholder={`Escreva os registros do ${loreFoco} aqui...`}
                        style={{ 
                            flex: 1, 
                            width: '100%', 
                            resize: 'none', 
                            borderColor: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', 
                            color: '#ddd', 
                            lineHeight: '1.6', 
                            padding: '15px',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.3s'
                        }}
                    />
                </div>
            )}

        </div>
    );
}