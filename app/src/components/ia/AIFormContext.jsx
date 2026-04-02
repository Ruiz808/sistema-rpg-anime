import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- GERADOR DE RANKS (EX, Z+, Z, Z-, S+, S... até R-) ---
export const baseRanks = [
    { id: 'EX', cor: '#ffffff', text: '#000' },
    { id: 'Z+', cor: '#e040fb', text: '#000' }, { id: 'Z', cor: '#aa00ff', text: '#fff' }, { id: 'Z-', cor: '#7b1fa2', text: '#fff' },
    { id: 'S+', cor: '#ff5252', text: '#000' }, { id: 'S', cor: '#ff003c', text: '#fff' }, { id: 'S-', cor: '#c50000', text: '#fff' },
    { id: 'A+', cor: '#ffff00', text: '#000' }, { id: 'A', cor: '#ffcc00', text: '#000' }, { id: 'A-', cor: '#f57f17', text: '#000' },
    { id: 'B+', cor: '#18ffff', text: '#000' }, { id: 'B', cor: '#00ffcc', text: '#000' }, { id: 'B-', cor: '#00b8d4', text: '#000' },
    { id: 'C+', cor: '#448aff', text: '#000' }, { id: 'C', cor: '#0088ff', text: '#fff' }, { id: 'C-', cor: '#01579b', text: '#fff' },
    { id: 'D+', cor: '#69f0ae', text: '#000' }, { id: 'D', cor: '#00e676', text: '#000' }, { id: 'D-', cor: '#00c853', text: '#000' },
];

export const extendedLetters = ['E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];
export const extendedRanks = [];
extendedLetters.forEach((letra, i) => {
    const val = Math.max(40, 140 - (i * 7)); 
    const hex = val.toString(16).padStart(2, '0');
    const cor = `#${hex}${hex}${hex}`; 
    extendedRanks.push({ id: `${letra}+`, cor: cor, text: '#fff' });
    extendedRanks.push({ id: `${letra}`, cor: cor, text: '#fff' });
    extendedRanks.push({ id: `${letra}-`, cor: cor, text: '#fff' });
});
export const TODOS_RANKS = [...baseRanks, ...extendedRanks];

const AIFormContext = createContext(null);

export function useAIForm() {
    const ctx = useContext(AIFormContext);
    if (!ctx) return null;
    return ctx;
}

export function AIFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome) || 'Desconhecido';
    const personagens = useStore(s => s.personagens) || {};
    const poderesGlobais = useStore(s => s.poderes) || {};
    const habilidadesGlobais = useStore(s => s.habilidades) || {};
    const formasGlobais = useStore(s => s.formas) || {};
    const inventarioGlobal = useStore(s => s.inventario) || {};

    const [subAba, setSubAba] = useState('chat');
    const [mensagem, setMensagem] = useState('');
    
    // 🔥 IA SEM AMNÉSIA: O Histórico agora fica vazio até o useEffect carregar o localStorage 🔥
    const [historico, setHistorico] = useState([]);
    
    const [carregando, setCarregando] = useState(false);
    const [arquivoTexto, setArquivoTexto] = useState('');
    const [nomeArquivo, setNomeArquivo] = useState('');
    const chatRef = useRef(null);
    const fileInputRef = useRef(null);

    const [loreFoco, setLoreFoco] = useState('presente'); 
    const [novoPersonagem, setNovoPersonagem] = useState('');
    const [novoAvatar, setNovoAvatar] = useState('');
    
    const [capitulosPresente, setCapitulosPresente] = useState(() => {
        try {
            const salvo = localStorage.getItem('rpgSextaFeira_capitulos');
            if (salvo) return JSON.parse(salvo).map(c => ({ ...c, tierList: c.tierList || [] }));
        } catch (e) { }
        return [{ id: 1, titulo: 'Capítulo 1 - Reino de Faku', texto: 'A marca da fênix...', tierList: [] }];
    });
    const [capituloAtivoId, setCapituloAtivoId] = useState(() => Number(localStorage.getItem('rpgSextaFeira_capituloAtivo')) || 1);

    const [capitulosFuturo, setCapitulosFuturo] = useState(() => {
        try {
            const salvo = localStorage.getItem('rpgSextaFeira_capitulosFuturo');
            if (salvo) return JSON.parse(salvo).map(c => ({ ...c, tierList: c.tierList || [] }));
        } catch (e) { }
        return [{ id: 100, titulo: 'Ecos do Futuro - Parte 1', texto: 'Crônicas do Amanhã...', tierList: [] }];
    });
    const [capFuturoAtivoId, setCapFuturoAtivoId] = useState(() => Number(localStorage.getItem('rpgSextaFeira_capFuturoAtivo')) || 100);

    const capituloAtivoObj = useMemo(() => {
        return loreFoco === 'presente' 
            ? capitulosPresente.find(cap => cap.id === capituloAtivoId)
            : capitulosFuturo.find(cap => cap.id === capFuturoAtivoId);
    }, [loreFoco, capitulosPresente, capituloAtivoId, capitulosFuturo, capFuturoAtivoId]);
    
    const textoAtivo = capituloAtivoObj?.texto || '';
    const tierListAtiva = capituloAtivoObj?.tierList || [];

    // 🔥 MEMÓRIA DO CHAT: Carrega a conversa do personagem ativo 🔥
    useEffect(() => {
        if (meuNome) {
            try {
                const salvo = localStorage.getItem(`rpgSextaFeira_chat_${meuNome}`);
                if (salvo) setHistorico(JSON.parse(salvo));
                else setHistorico([]); 
            } catch(e) { setHistorico([]); }
        }
    }, [meuNome]);

    // 🔥 MEMÓRIA DO CHAT: Salva a conversa sempre que ela for atualizada 🔥
    useEffect(() => {
        if (meuNome) {
            localStorage.setItem(`rpgSextaFeira_chat_${meuNome}`, JSON.stringify(historico));
        }
    }, [historico, meuNome]);

    useEffect(() => {
        localStorage.setItem('rpgSextaFeira_capitulos', JSON.stringify(capitulosPresente));
        localStorage.setItem('rpgSextaFeira_capituloAtivo', capituloAtivoId);
        localStorage.setItem('rpgSextaFeira_capitulosFuturo', JSON.stringify(capitulosFuturo));
        localStorage.setItem('rpgSextaFeira_capFuturoAtivo', capFuturoAtivoId);
    }, [capitulosPresente, capituloAtivoId, capitulosFuturo, capFuturoAtivoId]);

    // Botão para o utilizador limpar a memória se quiser começar de novo
    const limparChat = useCallback(() => {
        if (window.confirm("Deseja formatar a memória desta conversa? A Sexta-Feira esquecerá tudo o que falaram aqui.")) {
            setHistorico([]);
            localStorage.removeItem(`rpgSextaFeira_chat_${meuNome}`);
        }
    }, [meuNome]);

    const poolPersonagens = useMemo(() => {
        const avataresDoServidor = [];
        const nomesJaAdicionados = new Set();

        const extrairUrl = (img) => {
            if (!img) return '';
            if (typeof img === 'string') return img.trim();
            if (typeof img === 'object') {
                const url = img.base || img.downloadURL || img.downloadUrl || img.url || img.link || img.src || img.imagem || img.img || img.foto || img.icon || img.uri || img.capa || Object.values(img).find(v => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))) || '';
                return typeof url === 'string' ? url.trim() : '';
            }
            return '';
        };

        const varrerGaveta = (gaveta, nomeDono) => {
            if (!gaveta) return;
            const itens = Array.isArray(gaveta) ? gaveta : Object.values(gaveta);
            
            itens.forEach(item => {
                if (!item || typeof item !== 'object') return;
                const nomeObj = item.nome || item.titulo || item.name;
                const imgObj = item.imagemUrl || item.imagem || item.icone || item.avatar || item.url || item.img || item.foto || item.icon || item.token || item.capa;

                if (nomeObj && typeof nomeObj === 'string' && imgObj) {
                    const url = extrairUrl(imgObj);
                    if (url) {
                        const jaTemNome = nomeDono && nomeObj.toLowerCase().includes(nomeDono.toLowerCase().split(' ')[0]);
                        const nomeCombo = (nomeDono && !jaTemNome) ? `${nomeDono} (${nomeObj})` : nomeObj;
                        
                        if (!nomesJaAdicionados.has(nomeCombo)) {
                            avataresDoServidor.push({ nome: nomeCombo, avatar: url });
                            nomesJaAdicionados.add(nomeCombo);
                        }
                    }
                }
                Object.values(item).forEach(sub => {
                    if (sub && typeof sub === 'object') {
                        if (sub.$$typeof) return;
                        varrerGaveta(Array.isArray(sub) ? sub : [sub], nomeDono);
                    }
                });
            });
        };

        if (minhaFicha) {
            const urlBase = extrairUrl(minhaFicha.avatar || minhaFicha.bio?.avatar || minhaFicha.token || minhaFicha.imagem || minhaFicha.img);
            if (urlBase && !nomesJaAdicionados.has(meuNome)) {
                avataresDoServidor.push({ nome: meuNome, avatar: urlBase });
                nomesJaAdicionados.add(meuNome);
            }
            varrerGaveta(minhaFicha, meuNome);
        }

        Object.entries(personagens).forEach(([nomeFicha, ficha]) => {
            const urlBase = extrairUrl(ficha.avatar || ficha.bio?.avatar || ficha.token || ficha.imagem || ficha.img);
            if (urlBase && !nomesJaAdicionados.has(nomeFicha)) {
                avataresDoServidor.push({ nome: nomeFicha, avatar: urlBase });
                nomesJaAdicionados.add(nomeFicha);
            }
            varrerGaveta(ficha, nomeFicha);
        });

        varrerGaveta(poderesGlobais, meuNome);
        varrerGaveta(habilidadesGlobais, meuNome);
        varrerGaveta(formasGlobais, meuNome);
        varrerGaveta(inventarioGlobal, meuNome);

        return avataresDoServidor
            .filter(srvPers => srvPers.avatar !== '') 
            .filter(srvPers => !tierListAtiva.some(tPers => tPers.nome === srvPers.nome));
    }, [minhaFicha, meuNome, personagens, poderesGlobais, habilidadesGlobais, formasGlobais, inventarioGlobal, tierListAtiva]);

    const moverPersonagem = useCallback((personagem, novoRank) => {
        const isPresente = loreFoco === 'presente';
        const setCapitulos = isPresente ? setCapitulosPresente : setCapitulosFuturo;
        const ativoId = isPresente ? capituloAtivoId : capFuturoAtivoId;

        setCapitulos(prev => prev.map(cap => {
            if (cap.id !== ativoId) return cap;
            let novaTierList = cap.tierList.filter(p => p.nome !== personagem.nome);
            if (novoRank !== 'pool') novaTierList.push({ ...personagem, rank: novoRank });
            return { ...cap, tierList: novaTierList };
        }));
    }, [loreFoco, capituloAtivoId, capFuturoAtivoId]);

    const handleDragStart = useCallback((e, personagem) => {
        e.dataTransfer.setData('personagem', JSON.stringify(personagem));
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e, novoRank) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('personagem');
        if (data) moverPersonagem(JSON.parse(data), novoRank);
    }, [moverPersonagem]);

    const adicionarCustomizado = useCallback(() => {
        if (!novoPersonagem.trim()) return;
        const personagem = { nome: novoPersonagem.trim(), avatar: novoAvatar.trim() };
        moverPersonagem(personagem, 'C');
        setNovoPersonagem('');
        setNovoAvatar('');
    }, [novoPersonagem, novoAvatar, moverPersonagem]);

    const adicionarCapitulo = useCallback(() => {
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
    }, [loreFoco]);

    const editarTituloCapitulo = useCallback(() => {
        const lista = loreFoco === 'presente' ? capitulosPresente : capitulosFuturo;
        const idAtivo = loreFoco === 'presente' ? capituloAtivoId : capFuturoAtivoId;
        const capAtual = lista.find(cap => cap.id === idAtivo);
        const novoTitulo = window.prompt("Editar nome do capítulo:", capAtual.titulo);
        if (!novoTitulo || novoTitulo.trim() === '') return;
        if (loreFoco === 'presente') setCapitulosPresente(prev => prev.map(cap => cap.id === idAtivo ? { ...cap, titulo: novoTitulo } : cap));
        else setCapitulosFuturo(prev => prev.map(cap => cap.id === idAtivo ? { ...cap, titulo: novoTitulo } : cap));
    }, [loreFoco, capitulosPresente, capitulosFuturo, capituloAtivoId, capFuturoAtivoId]);

    const apagarCapitulo = useCallback(() => {
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
    }, [loreFoco, capitulosPresente, capitulosFuturo, capituloAtivoId, capFuturoAtivoId]);

    const atualizarTexto = useCallback((novoTexto) => {
        if (loreFoco === 'presente') setCapitulosPresente(prev => prev.map(cap => cap.id === capituloAtivoId ? { ...cap, texto: novoTexto } : cap));
        else setCapitulosFuturo(prev => prev.map(cap => cap.id === capFuturoAtivoId ? { ...cap, texto: novoTexto } : cap));
    }, [loreFoco, capituloAtivoId, capFuturoAtivoId]);

    const adicionarCapituloComTexto = useCallback((titulo, texto) => {
        const novoId = Date.now();
        setCapitulosPresente(prev => [...prev, { id: novoId, titulo, texto, tierList: [] }]);
        setCapituloAtivoId(novoId);
        setLoreFoco('presente');
    }, []);

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

    const extrairTextoPDF = useCallback(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textoCompleto = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            textoCompleto += content.items.map(item => item.str).join(' ') + '\n';
        }
        return textoCompleto;
    }, []);

    // 🔥 ATUALIZADO: Agora aceita ficheiros .md também 🔥
    const handleArquivoSelecionado = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            let texto = '';
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                texto = await extrairTextoPDF(file);
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                texto = await file.text();
            } else {
                alert('Formato não suportado. Use PDF, TXT ou MD.');
                return;
            }
            const MAX_CHARS = 15000;
            if (texto.length > MAX_CHARS) {
                texto = texto.substring(0, MAX_CHARS) + '\n...[TEXTO TRUNCADO]';
            }
            setArquivoTexto(texto);
            setNomeArquivo(file.name);
        } catch (err) {
            console.error('[AIPanel] Erro ao extrair texto:', err);
            alert('Erro ao ler o arquivo.');
        } finally {
            e.target.value = '';
        }
    }, [extrairTextoPDF]);

    const enviarMensagem = useCallback(async () => {
        if ((!mensagem.trim() && !arquivoTexto) || carregando) return;
        const msgUsuario = mensagem.trim();
        const textoAnexo = arquivoTexto;
        const nomeAnexo = nomeArquivo;
        setMensagem(''); setArquivoTexto(''); setNomeArquivo('');
        
        const displayMsg = nomeAnexo ? `${msgUsuario || 'Analise o documento anexado.'}\n📄 [Arquivo: ${nomeAnexo}]` : msgUsuario;
        setHistorico(prev => [...prev, { role: 'user', texto: displayMsg }]); setCarregando(true);
        
        try {
            const chamarIA = httpsCallable(functions, 'falarComSextaFeira');
            
            // 🔥 DIRETRIZ ANTI-ALUCINAÇÃO: Colocamos uma ordem invisível no prompt para a IA não inventar lore 🔥
            const instrucaoRestrita = "\n\n[DIRETRIZ DE SISTEMA: Aja de forma cirúrgica e objetiva. Baseie-se EXCLUSIVAMENTE nas informações fornecidas nesta mensagem ou no arquivo anexado. É ESTRITAMENTE PROIBIDO inventar histórias, adicionar 'lore', ou preencher lacunas de forma criativa. Atenha-se aos factos enviados.]";
            
            const payload = { 
                mensagem: (msgUsuario || 'Resuma o documento anexado.') + instrucaoRestrita, 
                contextoFicha: montarContextoFicha() 
            };
            if (textoAnexo) payload.conteudoArquivo = textoAnexo;
            
            const resultado = await chamarIA(payload);
            setHistorico(prev => [...prev, { role: 'ai', texto: resultado.data?.resposta || 'Sem resposta.' }]);
        } catch (err) { setHistorico(prev => [...prev, { role: 'erro', texto: 'Erro ao contactar a IA.' }]); }
        finally { setCarregando(false); }
    }, [mensagem, arquivoTexto, nomeArquivo, carregando, montarContextoFicha]);

    const handleKeyDown = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }, [enviarMensagem]);

    const value = useMemo(() => ({
        minhaFicha, meuNome, personagens, subAba, setSubAba, mensagem, setMensagem,
        historico, setHistorico, carregando, setCarregando, chatRef, loreFoco, setLoreFoco,
        novoPersonagem, setNovoPersonagem, novoAvatar, setNovoAvatar,
        capitulosPresente, setCapitulosPresente, capituloAtivoId, setCapituloAtivoId,
        capitulosFuturo, setCapitulosFuturo, capFuturoAtivoId, setCapFuturoAtivoId,
        capituloAtivoObj, textoAtivo, tierListAtiva, poolPersonagens,
        moverPersonagem, handleDragStart, handleDragOver, handleDrop, adicionarCustomizado,
        adicionarCapitulo, editarTituloCapitulo, apagarCapitulo, atualizarTexto, adicionarCapituloComTexto,
        montarContextoFicha, enviarMensagem, handleKeyDown,
        arquivoTexto, nomeArquivo, setArquivoTexto, setNomeArquivo,
        fileInputRef, handleArquivoSelecionado, limparChat // <- Adicionámos o limparChat aqui
    }), [
        minhaFicha, meuNome, personagens, subAba, mensagem, historico, carregando,
        loreFoco, novoPersonagem, novoAvatar, capitulosPresente, capituloAtivoId,
        capitulosFuturo, capFuturoAtivoId, capituloAtivoObj, textoAtivo, tierListAtiva, poolPersonagens,
        moverPersonagem, handleDragStart, handleDragOver, handleDrop, adicionarCustomizado,
        adicionarCapitulo, editarTituloCapitulo, apagarCapitulo, atualizarTexto, adicionarCapituloComTexto,
        montarContextoFicha, enviarMensagem, handleKeyDown,
        arquivoTexto, nomeArquivo, handleArquivoSelecionado, limparChat
    ]);

    return (
        <AIFormContext.Provider value={value}>
            {children}
        </AIFormContext.Provider>
    );
}