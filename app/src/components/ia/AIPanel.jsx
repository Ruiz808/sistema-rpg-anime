import React, { useState, useRef, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore';

// IMPORT DO SEU GRAVADOR
import GravadorPanel from './GravadorPanel';

// --- GERADOR DE RANKS (EX, Z+, Z, Z-, S+, S... até R-) ---
const baseRanks = [
    { id: 'EX', cor: '#ffffff', text: '#000' },
    { id: 'Z+', cor: '#e040fb', text: '#000' }, { id: 'Z', cor: '#aa00ff', text: '#fff' }, { id: 'Z-', cor: '#7b1fa2', text: '#fff' },
    { id: 'S+', cor: '#ff5252', text: '#000' }, { id: 'S', cor: '#ff003c', text: '#fff' }, { id: 'S-', cor: '#c50000', text: '#fff' },
    { id: 'A+', cor: '#ffff00', text: '#000' }, { id: 'A', cor: '#ffcc00', text: '#000' }, { id: 'A-', cor: '#f57f17', text: '#000' },
    { id: 'B+', cor: '#18ffff', text: '#000' }, { id: 'B', cor: '#00ffcc', text: '#000' }, { id: 'B-', cor: '#00b8d4', text: '#000' },
    { id: 'C+', cor: '#448aff', text: '#000' }, { id: 'C', cor: '#0088ff', text: '#fff' }, { id: 'C-', cor: '#01579b', text: '#fff' },
    { id: 'D+', cor: '#69f0ae', text: '#000' }, { id: 'D', cor: '#00e676', text: '#000' }, { id: 'D-', cor: '#00c853', text: '#000' },
];
const extendedLetters = ['E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];
const extendedRanks = [];
extendedLetters.forEach((letra, i) => {
    const val = Math.max(40, 140 - (i * 7)); 
    const hex = val.toString(16).padStart(2, '0');
    const cor = `#${hex}${hex}${hex}`; 
    extendedRanks.push({ id: `${letra}+`, cor: cor, text: '#fff' });
    extendedRanks.push({ id: `${letra}`, cor: cor, text: '#fff' });
    extendedRanks.push({ id: `${letra}-`, cor: cor, text: '#fff' });
});
const TODOS_RANKS = [...baseRanks, ...extendedRanks];

export default function AIPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome) || 'Desconhecido';
    const personagens = useStore(s => s.personagens) || {};

    // --- ESTADOS BÁSICOS ---
    const [subAba, setSubAba] = useState('chat');
    const [mensagem, setMensagem] = useState('');
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const chatRef = useRef(null);

    const [loreFoco, setLoreFoco] = useState('presente'); 

    // --- ESTADOS PARA CRIAR PERSONAGEM CUSTOMIZADO ---
    const [novoPersonagem, setNovoPersonagem] = useState('');
    const [novoAvatar, setNovoAvatar] = useState('');
    
    // --- CAPÍTULOS DO PRESENTE ---
    const [capitulosPresente, setCapitulosPresente] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_capitulos');
        if (salvo) return JSON.parse(salvo).map(c => ({ ...c, tierList: c.tierList || [] }));
        return [{ id: 1, titulo: 'Capítulo 1 - Reino de Faku', texto: 'A marca da fênix...', tierList: [] }];
    });
    const [capituloAtivoId, setCapituloAtivoId] = useState(() => Number(localStorage.getItem('rpgSextaFeira_capituloAtivo')) || 1);

    // --- CAPÍTULOS DO FUTURO ---
    const [capitulosFuturo, setCapitulosFuturo] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_capitulosFuturo');
        if (salvo) return JSON.parse(salvo).map(c => ({ ...c, tierList: c.tierList || [] }));
        return [{ id: 100, titulo: 'Ecos do Futuro - Parte 1', texto: 'Crônicas do Amanhã...', tierList: [] }];
    });
    const [capFuturoAtivoId, setCapFuturoAtivoId] = useState(() => Number(localStorage.getItem('rpgSextaFeira_capFuturoAtivo')) || 100);

    // --- IDENTIFICANDO CAPÍTULO ATIVO ---
    const capituloAtivoObj = loreFoco === 'presente' 
        ? capitulosPresente.find(cap => cap.id === capituloAtivoId)
        : capitulosFuturo.find(cap => cap.id === capFuturoAtivoId);
    
    const textoAtivo = capituloAtivoObj?.texto || '';
    const tierListAtiva = capituloAtivoObj?.tierList || [];

    // --- SALVAMENTO AUTOMÁTICO ---
    useEffect(() => {
        localStorage.setItem('rpgSextaFeira_capitulos', JSON.stringify(capitulosPresente));
        localStorage.setItem('rpgSextaFeira_capituloAtivo', capituloAtivoId);
        localStorage.setItem('rpgSextaFeira_capitulosFuturo', JSON.stringify(capitulosFuturo));
        localStorage.setItem('rpgSextaFeira_capFuturoAtivo', capFuturoAtivoId);
    }, [capitulosPresente, capituloAtivoId, capitulosFuturo, capFuturoAtivoId]);


    // 🔥 O BANCO DE AVATARES EXPANDIDO E FUNDIDO 🔥
    const avataresDoServidor = [];
    
    // Junta a sua ficha com a dos outros jogadores para o scanner não pular você!
    const todasFichas = { ...personagens };
    if (minhaFicha && meuNome) {
        todasFichas[meuNome] = minhaFicha;
    }

    Object.entries(todasFichas).forEach(([nomeFicha, ficha]) => {
        if (!ficha || typeof ficha !== 'object') return;

        // Tradutor de Imagens (Ainda mais agressivo para caçar URLs)
        const extrairUrl = (img) => {
            if (!img) return '';
            if (typeof img === 'string') return img.trim();
            if (typeof img === 'object') {
                const url = img.url || img.link || img.src || img.imagem || img.img || Object.values(img).find(v => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))) || '';
                return typeof url === 'string' ? url.trim() : '';
            }
            return '';
        };

        // 1. Pega a foto principal da Ficha
        const urlBase = extrairUrl(ficha.avatar || ficha.bio?.avatar || ficha.token || ficha.imagem || ficha.img);
        if (urlBase) avataresDoServidor.push({ nome: nomeFicha, avatar: urlBase });

        const nomesJaAdicionados = new Set();
        if (urlBase) nomesJaAdicionados.add(nomeFicha);

        // 2. Vasculha TODOS os cantos da ficha recursivamente
        const varrerObjeto = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            // Tenta achar qualquer combinação de "Nome" + "Imagem" no mesmo bloco
            const nomeObj = obj.nome || obj.titulo || obj.name;
            const imgObj = obj.imagem || obj.icone || obj.avatar || obj.url || obj.img || obj.foto || obj.icon;

            if (nomeObj && typeof nomeObj === 'string' && imgObj) {
                const url = extrairUrl(imgObj);
                if (url && url !== urlBase) {
                    const nomeCombo = `${nomeFicha} (${nomeObj})`; // Ex: Natsu Ackermann (Modo Assalto)
                    if (!nomesJaAdicionados.has(nomeCombo)) {
                        avataresDoServidor.push({ nome: nomeCombo, avatar: url });
                        nomesJaAdicionados.add(nomeCombo);
                    }
                }
            }

            // Entra nos sub-arrays e sub-objetos (busca profunda)
            Object.values(obj).forEach(valor => {
                if (valor && typeof valor === 'object') {
                    varrerObjeto(valor);
                }
            });
        };

        varrerObjeto(ficha);
    });

    // Remove do Banco quem já está na Tier List Atual
    const poolPersonagens = avataresDoServidor
        .filter(srvPers => srvPers.avatar !== '') 
        .filter(srvPers => !tierListAtiva.some(tPers => tPers.nome === srvPers.nome));


    // --- SISTEMA DE DRAG AND DROP ---
    const handleDragStart = (e, personagem) => {
        e.dataTransfer.setData('personagem', JSON.stringify(personagem));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, novoRank) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('personagem');
        if (data) {
            const personagemArrastado = JSON.parse(data);
            moverPersonagem(personagemArrastado, novoRank);
        }
    };

    const moverPersonagem = (personagem, novoRank) => {
        const isPresente = loreFoco === 'presente';
        const setCapitulos = isPresente ? setCapitulosPresente : setCapitulosFuturo;
        const ativoId = isPresente ? capituloAtivoId : capFuturoAtivoId;

        setCapitulos(prev => prev.map(cap => {
            if (cap.id !== ativoId) return cap;

            // Remove o personagem de onde ele estiver atualmente
            let novaTierList = cap.tierList.filter(p => p.nome !== personagem.nome);

            // Adiciona no novo rank (se não for para o banco)
            if (novoRank !== 'pool') {
                novaTierList.push({ ...personagem, rank: novoRank });
            }

            return { ...cap, tierList: novaTierList };
        }));
    };

    // --- FUNÇÃO PARA ADICIONAR PERSONAGEM CUSTOMIZADO ---
    const adicionarCustomizado = () => {
        if (!novoPersonagem.trim()) return;
        const personagem = { nome: novoPersonagem.trim(), avatar: novoAvatar.trim() };
        moverPersonagem(personagem, 'C');
        setNovoPersonagem('');
        setNovoAvatar('');
    };


    // --- FUNÇÕES DE CAPÍTULOS ---
    const adicionarCapitulo = () => {
        const titulo = window.prompt(`Nome do novo capítulo para o ${loreFoco}:`);
        if (!titulo || titulo.trim() === '') return;
        const novoId = Date.now();
        if (loreFoco === 'presente') {
            setCapitulosPresente(prev => [...prev, { id: novoId, titulo, texto: '', tierList: [] }]);
            setCapituloAtivoId(novoId);
        } else {
            setCapitulosFuturo(prev => [...prev, { id: novoId, titulo, texto: '', tierList: [] }]);
            setCapFuturoAtivoId(novoId);
        }
    };

    const editarTituloCapitulo = () => {
        const lista = loreFoco === 'presente' ? capitulosPresente : capitulosFuturo;
        const idAtivo = loreFoco === 'presente' ? capituloAtivoId : capFuturoAtivoId;
        const capAtual = lista.find(cap => cap.id === idAtivo);
        const novoTitulo = window.prompt("Editar nome do capítulo:", capAtual.titulo);
        if (!novoTitulo || novoTitulo.trim() === '') return;
        if (loreFoco === 'presente') setCapitulosPresente(prev => prev.map(cap => cap.id === idAtivo ? { ...cap, titulo: novoTitulo } : cap));
        else setCapitulosFuturo(prev => prev.map(cap => cap.id === idAtivo ? { ...cap, titulo: novoTitulo } : cap));
    };

    const apagarCapitulo = () => {
        const lista = loreFoco === 'presente' ? capitulosPresente : capitulosFuturo;
        if (lista.length <= 1) return alert("Não pode apagar o único capítulo!");
        const idAtivo = loreFoco === 'presente' ? capituloAtivoId : capFuturoAtivoId;
        if (!window.confirm("Tem certeza que deseja apagar?")) return;
        if (loreFoco === 'presente') {
            const nova = capitulosPresente.filter(cap => cap.id !== idAtivo);
            setCapitulosPresente(nova); setCapituloAtivoId(nova[0].id);
        } else {
            const nova = capitulosFuturo.filter(cap => cap.id !== idAtivo);
            setCapitulosFuturo(nova); setCapFuturoAtivoId(nova[0].id);
        }
    };

    const atualizarTexto = (novoTexto) => {
        if (loreFoco === 'presente') setCapitulosPresente(prev => prev.map(cap => cap.id === capituloAtivoId ? { ...cap, texto: novoTexto } : cap));
        else setCapitulosFuturo(prev => prev.map(cap => cap.id === capFuturoAtivoId ? { ...cap, texto: novoTexto } : cap));
    };

    // --- LÓGICA DO CHAT ---
    useEffect(() => { if (subAba === 'chat' && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [historico, subAba]);

    const montarContextoFicha = useCallback(() => {
        const bio = minhaFicha?.bio || {};
        const hierarquia = minhaFicha?.hierarquia || {};
        return {
            nome: meuNome, raca: bio.raca || 'Desconhecida', classe: bio.classe || 'Desconhecida', nivel: minhaFicha?.ascensaoBase || 1,
            hp: minhaFicha?.vida?.atual ?? 0, hpMax: minhaFicha?.vida?.base ?? 0, mana: minhaFicha?.mana?.atual ?? 0, manaMax: minhaFicha?.mana?.base ?? 0,
            forca: minhaFicha?.forca?.base ?? 0, destreza: minhaFicha?.destreza?.base ?? 0, inteligencia: minhaFicha?.inteligencia?.base ?? 0, sabedoria: minhaFicha?.sabedoria?.base ?? 0, carisma: minhaFicha?.carisma?.base ?? 0, constituicao: minhaFicha?.constituicao?.base ?? 0,
            hierarquia: { poder: hierarquia.poder || false, poderNome: hierarquia.poderNome || '', infinity: hierarquia.infinity || false, infinityNome: hierarquia.infinityNome || '', singularidade: hierarquia.singularidade || '', singularidadeNome: hierarquia.singularidadeNome || '' },
            poderes: (minhaFicha?.poderes || []).map(p => p.nome).slice(0, 10), inventario: (minhaFicha?.inventario || []).map(i => i.nome).slice(0, 10)
        };
    }, [minhaFicha, meuNome]);

    const enviarMensagem = useCallback(async () => {
        if (!mensagem.trim() || carregando) return;
        const msgUsuario = mensagem.trim();
        setMensagem(''); setHistorico(prev => [...prev, { role: 'user', texto: msgUsuario }]); setCarregando(true);
        try {
            const chamarIA = httpsCallable(functions, 'falarComSextaFeira');
            const resultado = await chamarIA({ mensagem: msgUsuario, contextoFicha: montarContextoFicha() });
            setHistorico(prev => [...prev, { role: 'ai', texto: resultado.data?.resposta || 'Sem resposta.' }]);
        } catch (err) { setHistorico(prev => [...prev, { role: 'erro', texto: 'Erro ao contactar a IA.' }]); }
        finally { setCarregando(false); }
    }, [mensagem, carregando, montarContextoFicha]);

    const handleKeyDown = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }, [enviarMensagem]);

    // --- UI COMPARTILHADA DE TEMPO E CAPÍTULOS ---
    const renderizadorDeCabecalhoDeCapitulo = () => (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div>
                    <h3 style={{ color: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', marginTop: 0, margin: 0, transition: 'color 0.3s' }}>
                        {subAba === 'lore' ? '📜 Registros Akáshicos' : '📊 Níveis de Ameaça (Tier List Interativa)'}
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.9em', margin: 0 }}>
                        {loreFoco === 'presente' ? 'Visualizando: Linha do Tempo Atual' : 'Visualizando: Ecos do Futuro'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`btn-neon ${loreFoco === 'presente' ? 'btn-green' : ''}`} onClick={() => setLoreFoco('presente')} style={{ padding: '8px 15px', fontSize: '0.9em', margin: 0, opacity: loreFoco === 'presente' ? 1 : 0.5 }}>⏳ Presente</button>
                    <button className={`btn-neon ${loreFoco === 'futuro' ? 'btn-gold' : ''}`} onClick={() => setLoreFoco('futuro')} style={{ padding: '8px 15px', fontSize: '0.9em', margin: 0, opacity: loreFoco === 'futuro' ? 1 : 0.5 }}>🚀 Futuro</button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
                <span style={{ color: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', fontWeight: 'bold' }}>📖 Capítulo:</span>
                <select className="input-neon" value={loreFoco === 'presente' ? capituloAtivoId : capFuturoAtivoId} onChange={(e) => loreFoco === 'presente' ? setCapituloAtivoId(Number(e.target.value)) : setCapFuturoAtivoId(Number(e.target.value))} style={{ flex: 1, minWidth: '150px', borderColor: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', color: '#fff', padding: '8px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    {(loreFoco === 'presente' ? capitulosPresente : capitulosFuturo).map(cap => <option key={cap.id} value={cap.id} style={{ color: '#000' }}>{cap.titulo}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn-neon btn-gold" onClick={editarTituloCapitulo} style={{ padding: '8px 15px', margin: 0 }} title="Editar Nome do Capítulo">✏️</button>
                    <button className="btn-neon btn-red" onClick={apagarCapitulo} style={{ padding: '8px 15px', margin: 0 }} title="Apagar Capítulo">🗑️</button>
                    <button className="btn-neon btn-green" onClick={adicionarCapitulo} style={{ padding: '8px 15px', margin: 0 }}>➕ Novo</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
            {/* CABEÇALHO GLOBAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #00ffcc', paddingBottom: 10 }}>
                <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: 0 }}>Sexta-Feira (IA Central)</h2>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className={`btn-neon ${subAba === 'chat' ? 'btn-green' : ''}`} onClick={() => setSubAba('chat')} style={{ padding: '5px 10px', margin: 0 }}>💬 Chat</button>
                    <button className={`btn-neon ${subAba === 'gravador' ? 'btn-red' : ''}`} onClick={() => setSubAba('gravador')} style={{ padding: '5px 10px', margin: 0 }}>🎙️ Gravador</button>
                    <button className={`btn-neon ${subAba === 'tierlist' ? 'btn-gold' : ''}`} onClick={() => setSubAba('tierlist')} style={{ padding: '5px 10px', margin: 0 }}>🏆 Tier List</button>
                    <button className={`btn-neon ${subAba === 'lore' ? 'btn-blue' : ''}`} onClick={() => setSubAba('lore')} style={{ padding: '5px 10px', margin: 0 }}>📜 Registros</button>
                </div>
            </div>

            {/* CHAT - COM ARMADURA PARA NÃO QUEBRAR O LAYOUT */}
            {subAba === 'chat' && (
                <>
                    <div ref={chatRef} className="def-box" style={{ flex: 1, minHeight: '300px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px' }}>
                        {historico.length === 0 && <div style={{ color: '#555', textAlign: 'center', fontStyle: 'italic', marginTop: '40px' }}>A Sexta-Feira está online e pronta para ajudar.</div>}
                        {historico.map((msg, i) => (
                            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: '8px', background: msg.role === 'user' ? 'rgba(0, 255, 204, 0.15)' : msg.role === 'erro' ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 136, 255, 0.15)', border: `1px solid ${msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff'}`, color: '#ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95em' }}>
                                <div style={{ fontSize: '0.7em', fontWeight: 'bold', marginBottom: '4px', color: msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff' }}>{msg.role === 'user' ? meuNome?.toUpperCase() : msg.role === 'erro' ? 'ERRO' : 'SEXTA-FEIRA'}</div>
                                {msg.texto}
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '15px', alignItems: 'flex-start', marginTop: '10px', width: '100%' }}>
                        <textarea 
                            className="input-neon" 
                            placeholder="Fale com a Sexta-Feira..." 
                            value={mensagem} 
                            onChange={e => setMensagem(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            disabled={carregando} 
                            style={{ flex: 1, minHeight: '60px', resize: 'vertical', borderColor: '#00ffcc', color: '#fff', padding: '12px', boxSizing: 'border-box' }} 
                        />
                        <button 
                            className="btn-neon" 
                            onClick={enviarMensagem} 
                            disabled={carregando || !mensagem.trim()} 
                            style={{ flex: '0 0 auto', width: '120px', minWidth: '120px', height: '60px', padding: '0 20px', borderColor: '#00ffcc', color: '#00ffcc', margin: 0, opacity: (carregando || !mensagem.trim()) ? 0.4 : 1 }}
                        >
                            {carregando ? '...' : 'ENVIAR'}
                        </button>
                    </div>
                </>
            )}

            {/* GRAVADOR */}
            {subAba === 'gravador' && <div style={{ flex: 1, overflowY: 'auto' }}><GravadorPanel /></div>}

            {/* TIER LIST */}
            {subAba === 'tierlist' && (
                <div className="def-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    {renderizadorDeCabecalhoDeCapitulo()}
                    
                    {/* ZONA 1: AS FILEIRAS DOS RANKS (ZONAS DE DROP) */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '5px', marginBottom: '20px' }}>
                        {TODOS_RANKS.map(rank => {
                            const personagensNesteRank = tierListAtiva.filter(p => p.rank === rank.id);
                            const isEmpty = personagensNesteRank.length === 0;

                            return (
                                <div 
                                    key={rank.id} 
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, rank.id)}
                                    style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', border: `1px dashed ${rank.cor}80`, borderRadius: '5px', minHeight: isEmpty ? '40px' : '65px', opacity: isEmpty ? 0.5 : 1, transition: 'all 0.2s' }}
                                >
                                    <div style={{ width: isEmpty ? '50px' : '80px', background: rank.cor, color: rank.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isEmpty ? '1em' : '1.6em', fontWeight: 'bold', textShadow: '0 0 3px rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                                        {rank.id}
                                    </div>
                                    
                                    <div style={{ flex: 1, padding: '5px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                        {personagensNesteRank.map((pers, i) => (
                                            <div 
                                                key={i} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, pers)}
                                                style={{ cursor: 'grab', background: 'rgba(0,0,0,0.8)', padding: '5px 12px', borderRadius: '30px', border: `1px solid ${rank.cor}`, color: '#fff', fontSize: '0.9em', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: `0 0 8px ${rank.cor}40` }}
                                            >
                                                {pers.avatar && <img src={pers.avatar} alt={pers.nome} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${rank.cor}`, backgroundColor: '#222' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                                                {pers.nome}
                                                <span style={{ cursor: 'pointer', color: '#ff003c', fontSize: '1.4em', lineHeight: '0.5', paddingLeft: '5px' }} onClick={() => moverPersonagem(pers, 'pool')} title="Devolver ao Banco">×</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* ZONA 2: O BANCO DE PERSONAGENS E CRIADOR MANUAL */}
                    <div style={{ borderTop: '2px solid #333', paddingTop: '15px' }}>
                        
                        {/* O BANCO (ÁREA DE DROP PARA REMOVER) */}
                        <div 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'pool')}
                            style={{ minHeight: '80px', background: 'rgba(0,0,0,0.3)', border: '2px dashed #555', borderRadius: '8px', padding: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                            <h4 style={{ margin: 0, color: '#aaa' }}>📦 Banco de Entidades Expandido (Arraste para classificar)</h4>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {poolPersonagens.length === 0 && <span style={{ color: '#555', fontStyle: 'italic', fontSize: '0.9em' }}>Nenhum avatar ou transformação sobrando.</span>}
                                
                                {poolPersonagens.map((pers, i) => (
                                    <div 
                                        key={i} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, pers)}
                                        style={{ cursor: 'grab', background: '#222', padding: '5px 15px', borderRadius: '20px', border: '1px solid #555', color: '#ccc', fontSize: '0.85em', display: 'flex', gap: '8px', alignItems: 'center' }}
                                    >
                                        <img src={pers.avatar} alt={pers.nome} style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                        {pers.nome}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BARRA MANUAL PARA CRIAR INIMIGOS/NPCS CUSTOMIZADOS */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: '#666', fontSize: '0.8em', flex: '1 1 100%' }}>Criar entidade manual (NPCs sem ficha):</span>
                            <input className="input-neon" placeholder="Nome do Inimigo" value={novoPersonagem} onChange={(e) => setNovoPersonagem(e.target.value)} style={{ flex: '1 1 200px', padding: '8px', color: '#fff', borderColor: '#444' }} />
                            <input className="input-neon" placeholder="URL da Foto (opcional)" value={novoAvatar} onChange={(e) => setNovoAvatar(e.target.value)} style={{ flex: '1 1 200px', padding: '8px', color: '#fff', borderColor: '#444' }} />
                            <button className="btn-neon btn-blue" onClick={adicionarCustomizado} style={{ flex: 'none', width: 'auto', padding: '0 20px', height: '40px', margin: 0 }}>
                                + CRIAR NOVO
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* REGISTROS (LORE) */}
            {subAba === 'lore' && (
                <div className="def-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    {renderizadorDeCabecalhoDeCapitulo()}
                    <textarea className="input-neon" value={textoAtivo} onChange={e => atualizarTexto(e.target.value)} placeholder={`Escreva os registros da linha do tempo aqui...`} style={{ flex: 1, width: '100%', resize: 'none', borderColor: loreFoco === 'presente' ? '#00ffcc' : '#ffcc00', color: '#ddd', lineHeight: '1.6', padding: '15px', boxSizing: 'border-box', transition: 'border-color 0.3s' }} />
                </div>
            )}
        </div>
    );
}