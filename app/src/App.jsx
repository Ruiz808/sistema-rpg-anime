import React, { useEffect, useState, useMemo } from 'react'
import { ref, get, set, onValue } from 'firebase/database'
import { db } from './services/firebase-config'
import useStore, { sanitizarNome, fichaPadrao } from './stores/useStore'
import useFirebase from './hooks/useFirebase'

// Import de Layout e Componentes
import Sidebar from './components/layout/Sidebar'
import TabPanel from './components/layout/TabPanel'
import StatusPanel from './components/status/StatusPanel'
import PerfilPanel from './components/perfil/PerfilPanel'
import ModalConfirm from './components/perfil/ModalConfirm'
import FichaPanel from './components/ficha/FichaPanel'
import AtaquePanel from './components/combate/AtaquePanel'
import AcertoPanel from './components/combate/AcertoPanel'
import DefesaPanel from './components/combate/DefesaPanel'
import TestesPanel from './components/combate/TestesPanel'
import PoderesPanel from './components/poderes/PoderesPanel'
import ArsenalPanel from './components/arsenal/ArsenalPanel'
import ElementosPanel from './components/arsenal/ElementosPanel'
import FeedCombate from './components/feed/FeedCombate'
import MapaPanel from './components/mapa/MapaPanel'
import Jukebox from './components/jukebox/Jukebox'
import CompendioPanel from './components/compendio/CompendioPanel'
import AIPanel from './components/ia/AIPanel'
import GravadorPanel from './components/ia/GravadorPanel'
import { MestreForjaNPC } from './components/mestre/MestreSubComponents'

// Funções de Sync
import { 
    carregarFichaDoFirebase, iniciarListenerDummies, enviarParaFeed, salvarDummie, 
    iniciarListenerCenario, registrarNovaMesa, verificarMesaExistente, 
    registrarUsuario, entrarUsuario, sairConta, monitorarAuth,
    iniciarSistemaDePresenca, iniciarListenerPresenca, removerPresencaImediata,
    iniciarListenerMestres, promoverAMestreFirebase
} from './services/firebase-sync'

import { getMaximo } from './core/attributes'
import { calcularCA } from './core/engine'

function getStatusLimpo(ficha, chave, threshold) {
    if (!ficha) return { max: 0, atual: 0, pVit: 0 };
    let mx = 0;
    try { mx = getMaximo(ficha, chave); } catch(e){}
    if (!mx || isNaN(mx)) mx = parseInt(ficha[chave]?.base) || 0;
    const strVal = String(Math.floor(mx));
    const pVit = Math.max(0, strVal.length - threshold);
    const maxFinal = pVit > 0 ? Math.floor(mx / Math.pow(10, pVit)) : mx;
    let atual = maxFinal;
    if (ficha[chave] && ficha[chave].atual !== undefined) {
        let at = parseFloat(ficha[chave].atual);
        if (!isNaN(at)) atual = (pVit > 0 && at > maxFinal * 10) ? Math.floor(at / Math.pow(10, pVit)) : at;
    }
    return { max: maxFinal, atual: atual, pVit: pVit };
}

function getEnergiasSupremas(ficha) {
    if (!ficha) return { vitais: {max:0, atual:0}, mortais: {max:0, atual:0} };
    const getRawBase = (attr) => parseFloat(ficha[attr]?.base) || 0;
    const getPrestAtual = (k) => {
        let baseP = 0;
        if (k === 'status') {
            const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
            let m = 0;
            STATS.forEach(s => m += getRawBase(s));
            baseP = Math.floor((m / 8) / 1000);
        } else {
            const mults = { vida: 1000000, mana: 10000000, aura: 10000000, chakra: 10000000, corpo: 10000000 };
            baseP = Math.floor(getRawBase(k) / (mults[k] || 1));
        }
        const anchor = k === 'status' ? 'forca' : k;
        let mFormas = parseFloat(ficha[anchor]?.mFormas) || 1.0;
        let bMFormas = 0;
        let hasMFormas = false;
        const processarEfeitos = (efeitos) => {
            if(!efeitos) return;
            efeitos.forEach(e => {
                let atr = (e.atributo||'').toLowerCase();
                let prop = (e.propriedade||'').toLowerCase();
                let afeta = (atr === anchor) || (atr === 'todos_status' && k==='status') || (atr === 'todas_energias' && k!=='status');
                if(afeta && prop === 'mformas') { bMFormas += parseFloat(e.valor) || 0; hasMFormas = true; }
            });
        };
        (ficha.inventario || []).filter(i => i.equipado).forEach(i => {
            processarEfeitos(i.efeitos);
            if (i.formaAtivaId && i.formas) {
                let activeForm = i.formas.find(f => f.id === i.formaAtivaId);
                if (activeForm && activeForm.acumulaFormaBase !== false) {
                   let activeConfig = (activeForm.configs || []).find(c => c.id === i.configAtivaId) || activeForm.configs?.[0];
                   if (activeConfig) processarEfeitos(activeConfig.efeitos);
                }
            }
        });
        (ficha.poderes || []).filter(p => p.ativa).forEach(p => processarEfeitos(p.efeitos));
        let efetivoMFormas = (mFormas === 1.0 && hasMFormas ? 0 : mFormas) + bMFormas;
        const multForma = efetivoMFormas >= 10 ? (efetivoMFormas / 10) : 1;
        return Math.floor(baseP * multForma);
    };
    const maxVitais = Math.floor((getPrestAtual('vida') + getPrestAtual('chakra') + getPrestAtual('corpo')) / 3);
    const maxMortais = Math.floor((getPrestAtual('mana') + getPrestAtual('status') + getPrestAtual('aura')) / 3);
    let atualVitais = ficha.pontosVitais?.atual;
    if (atualVitais === undefined || isNaN(atualVitais)) atualVitais = maxVitais;
    let atualMortais = ficha.pontosMortais?.atual;
    if (atualMortais === undefined || isNaN(atualMortais)) atualMortais = maxMortais;
    return { vitais: { max: maxVitais, atual: atualVitais }, mortais: { max: maxMortais, atual: atualMortais } };
}

// 🔥 PAINEL DO MESTRE SUPREMO (COMPLETO E COM SUBPASTAS) 🔥
function MestrePanel() {
    const personagens = useStore(s => s.personagens);
    const setPersonagens = useStore(s => s.setPersonagens);
    const meuNome = useStore(s => s.meuNome);
    const isMestre = useStore(s => s.isMestre);
    const mesaId = useStore(s => s.mesaId);
    const jogadoresOnline = useStore(s => s.jogadoresOnline);
    const setMeuNome = useStore(s => s.setMeuNome);
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const setPersonagemParaDeletar = useStore(s => s.setPersonagemParaDeletar);

    const [mesaVisor, setMesaVisor] = useState('presente');
    const [pastasAbertas, setPastasAbertas] = useState({});
    const togglePasta = (nomePasta) => setPastasAbertas(prev => ({...prev, [nomePasta]: !prev[nomePasta]}));

    const [msgSistema, setMsgSistema] = useState('');
    const [dNome, setDNome] = useState('Entidade');
    const [dHp, setDHp] = useState(100);
    const [dVit, setDVit] = useState(0);
    const [dDefTipo, setDDefTipo] = useState('evasiva');
    const [dDef, setDDef] = useState(10);
    const [dVisivelHp, setDVisivelHp] = useState('todos');
    const [dOculto, setDOculto] = useState(false);
    const [novoMestreNick, setNovoMestreNick] = useState('');

    // 🔥 ESTADOS DO HUB DE CONVERGÊNCIA 🔥
    const [mesaMatriz, setMesaMatriz] = useState(() => localStorage.getItem('rpg_mesa_principal') || 'Nenhuma');
    const [capitulosGerais, setCapitulosGerais] = useState([]);
    const [arvoresGerais, setArvoresGerais] = useState({});
    const [capituloSelecionado, setCapituloSelecionado] = useState('');
    const [arvoreSelecionada, setArvoreSelecionada] = useState('');

    // 🔥 BUSCA ABSOLUTA DIRETO DA NUVEM DA MESA MATRIZ 🔥
    useEffect(() => {
        try { 
            const capBackup = localStorage.getItem('rpgSextaFeira_capitulos_MatrizBackup');
            if (capBackup) setCapitulosGerais(JSON.parse(capBackup));
            else {
                const capLocal = localStorage.getItem('rpgSextaFeira_capitulos');
                if (capLocal) setCapitulosGerais(JSON.parse(capLocal));
            }
            
            const arvBackup = localStorage.getItem('rpgSextaFeira_arvore_MatrizBackup');
            if (arvBackup) setArvoresGerais(JSON.parse(arvBackup));
            else {
                const arvLocal = localStorage.getItem('rpgSextaFeira_arvore');
                if (arvLocal) setArvoresGerais(JSON.parse(arvLocal));
            }
        } catch(e) {}

        if (!mesaMatriz || mesaMatriz === 'Nenhuma') return;

        get(ref(db, `mesas/${mesaMatriz}/lore`)).then(snap => {
            if (snap.exists()) {
                setCapitulosGerais(snap.val());
                localStorage.setItem('rpgSextaFeira_capitulos_MatrizBackup', JSON.stringify(snap.val()));
            }
        }).catch(() => {});

        get(ref(db, `mesas/${mesaMatriz}/arvore`)).then(snap => {
            if (snap.exists()) {
                setArvoresGerais(snap.val());
                localStorage.setItem('rpgSextaFeira_arvore_MatrizBackup', JSON.stringify(snap.val()));
            }
        }).catch(() => {});
    }, [mesaMatriz]);

    const grandsGlobais = useMemo(() => {
        let g = {};
        if (personagens) Object.values(personagens).forEach(p => { if (p?.compendioOverrides?.grands) g = { ...g, ...p.compendioOverrides.grands }; });
        return g;
    }, [personagens]);

    if (!isMestre) return <div style={{ color: '#ff003c', textAlign: 'center', padding: 50, fontSize: '1.5em', fontWeight: 'bold' }}>Acesso Negado.</div>;

    const enviarAviso = () => {
        if (!msgSistema.trim()) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: msgSistema.trim() });
        setMsgSistema('');
    };

    const injetarDummie = () => {
        const hBase = parseInt(dHp) || 100;
        const vit = parseInt(dVit) || 0;
        const h = hBase * Math.pow(10, vit);
        const dv = parseInt(dDef) || 10;
        const id = 'dummie_' + Date.now();
        salvarDummie(id, { nome: dNome, hpMax: h, hpAtual: h, tipoDefesa: dDefTipo, valorDefesa: dv, visibilidadeHp: dVisivelHp, oculto: dOculto, posicao: { x: 0, y: 0 } });
        alert(`${dNome} injetado no mapa!`);
    };

    const handleApagarJogador = (nome) => {
        if (nome === meuNome) return alert('Não pode apagar a si mesmo!');
        setPersonagemParaDeletar(nome); 
    };

    const handleAssumirFicha = (nome, ficha) => {
        if (nome === meuNome) return;
        if (window.confirm(`🎭 ASSUMIR O CONTROLE DE ${nome.toUpperCase()}?`)) {
            setMeuNome(nome);
            carregarDadosFicha(ficha);
            localStorage.setItem('rpgNome', nome); 
            setAbaAtiva('aba-ficha'); 
        }
    };

    const handleClonarFicha = (nomeOriginal, fichaOriginal) => {
        const novoNome = window.prompt(`🖨️ CLONAR ENTIDADE: ${nomeOriginal}\nNome do clone:`, `${nomeOriginal} (Clone)`);
        if (!novoNome || novoNome.trim() === '') return;
        const nomeSanitizado = sanitizarNome(novoNome);
        if (personagens[nomeSanitizado]) return alert('❌ Já existe uma entidade com esse nome!');
        
        setMeuNome(nomeSanitizado);
        localStorage.setItem('rpgNome', nomeSanitizado);
        const fichaClone = JSON.parse(JSON.stringify(fichaOriginal));
        carregarDadosFicha(fichaClone);
        setAbaAtiva('aba-ficha'); 
        setTimeout(() => alert(`✨ CLONE CRIADO! Clique em "SALVAR" na ficha para forjá-lo!`), 600);
    };

    const handlePromover = async () => {
        if (!novoMestreNick.trim()) return;
        if (window.confirm(`Promover ${novoMestreNick} a Mestre?`)) {
            await promoverAMestreFirebase(mesaId, novoMestreNick);
            alert(`✨ Sucesso! ${novoMestreNick} agora é um Mestre!`);
            setNovoMestreNick('');
        }
    };

    const coroarMesaMatriz = () => {
        if (!mesaId) return alert("Erro: O Mestre precisa estar conectado a uma mesa ativa.");
        if (window.confirm(`👑 COROAR A MESA [${mesaId}] COMO A MATRIZ PRINCIPAL?\n\nToda a Lore legada e Árvores criadas até aqui serão seladas como a fundação intocável do seu Multiverso.`)) {
            localStorage.setItem('rpg_mesa_principal', mesaId);
            setMesaMatriz(mesaId);
            
            const capsAtuais = localStorage.getItem('rpgSextaFeira_capitulos') || '[]';
            const arvsAtuais = localStorage.getItem('rpgSextaFeira_arvore') || '{}';
            
            localStorage.setItem('rpgSextaFeira_capitulos_MatrizBackup', capsAtuais);
            localStorage.setItem('rpgSextaFeira_arvore_MatrizBackup', arvsAtuais);
            
            try {
                setCapitulosGerais(JSON.parse(capsAtuais));
                setArvoresGerais(JSON.parse(arvsAtuais));
            } catch(e){}
            
            alert("✨ ABSOLUTO! Esta mesa é agora reconhecida como a fundação original de todas as histórias.");
        }
    };

    const importarCapituloCirurgico = async () => {
        if (!capituloSelecionado) return alert("Selecione um capítulo da base original para importar!");
        const cap = capitulosGerais.find(c => String(c.id) === String(capituloSelecionado));
        if (!cap) return;

        try {
            const snap = await get(ref(db, `mesas/${mesaId}/lore`));
            let listaMesa = snap.exists() ? snap.val() : [];
            listaMesa = listaMesa.filter(c => String(c.id) !== String(cap.id));
            listaMesa.push(cap);
            await set(ref(db, `mesas/${mesaId}/lore`), listaMesa);
            localStorage.setItem('rpgSextaFeira_capitulos', JSON.stringify(listaMesa));
            alert(`📜 Lore [${cap.titulo}] enviada para a Nuvem da Mesa!`);
        } catch(e) { alert("Erro ao sincronizar com Firebase!"); }
    };

    const importarArvoreCirurgica = async () => {
        if (!arvoreSelecionada) return alert("Selecione uma árvore/panteão da base original para importar!");
        const linhagem = arvoresGerais[arvoreSelecionada];
        if (!linhagem) return;

        const chaveMesa = `rpgSextaFeira_arvore_${mesaId}`;
        let arvoresMesa = {};
        try { arvoresMesa = JSON.parse(localStorage.getItem(chaveMesa)) || {}; } catch(e){}

        if (arvoresMesa[arvoreSelecionada]) {
            if (!window.confirm(`A linhagem "${arvoreSelecionada}" já habita esta mesa. Sobrescrever com a versão original?`)) return;
        }

        arvoresMesa[arvoreSelecionada] = linhagem;
        localStorage.setItem(chaveMesa, JSON.stringify(arvoresMesa));
        localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(arvoresMesa));

        try {
            await set(ref(db, `mesas/${mesaId}/arvore`), arvoresMesa);
        } catch(e) { console.warn("Erro ao salvar árvore na nuvem:", e); }

        if (Array.isArray(linhagem) && window.confirm(`Deseja também forjar automaticamente todos os ${linhagem.length} membros desta linhagem como NPCs ativos no Painel do Mestre?`)) {
            const funcSanitizar = typeof sanitizarNome === 'function' ? sanitizarNome : (n) => n.replace(/[.#$\[\]\/]/g, '_');
            let novosPersonagens = { ...personagens };
            
            const baseFicha = {
                bio: { mesa: 'npc', afiliacao: arvoreSelecionada },
                vida: { base: 100000, atual: 100000 },
                mana: { base: 100000, atual: 100000 },
                forca: { base: 1 }, destreza: { base: 1 }, inteligencia: { base: 1 },
                avatar: { base: "" }, dominios: { elementos: {} }, poderes: [], isNPC: true
            };

            for (const npc of linhagem) {
                if (!npc.nome) continue;
                const nomePersonagem = funcSanitizar(npc.nome.trim());
                const hpValor = Number(npc.hp) || 100000;
                const manaValor = Number(npc.mana) || 100000;
                
                let novaFicha = JSON.parse(JSON.stringify(baseFicha));
                novaFicha.bio.classe = npc.classe || 'NPC - Ameaça';
                novaFicha.bio.raca = npc.papel || 'Criatura';
                novaFicha.bio.afiliacao = npc.afiliacao || arvoreSelecionada;
                novaFicha.vida.base = hpValor; novaFicha.vida.atual = hpValor;
                novaFicha.mana.base = manaValor; novaFicha.mana.atual = manaValor;
                if (npc.avatar) novaFicha.avatar.base = npc.avatar.trim();
                
                if (npc.elemento && npc.elemento.trim() !== '') {
                    novaFicha.dominios.elementos[npc.elemento.trim()] = { nivel: 1, nome: "Básico" };
                }
                
                novaFicha.poderes = [{
                    nome: "📖 Linhagem & Lore",
                    ativa: true, dano: "0",
                    descricao: `Status: ${npc.status || 'Vivo'}\nElemento Mágico: ${npc.elemento || 'Nenhum'}\nClã / Panteão: ${npc.afiliacao || arvoreSelecionada}\n\nHistória: ${npc.lore || 'Sem registos.'}`
                }];
                novaFicha.dataCriacao = Date.now();

                novosPersonagens[nomePersonagem] = novaFicha;
                try {
                    await set(ref(db, `mesas/${mesaId}/personagens/${nomePersonagem}`), novaFicha);
                } catch(err) { console.warn("Erro ao injetar NPC na cloud:", err); }
            }
            if (setPersonagens) setPersonagens(novosPersonagens);
        }

        alert(`🌳 SUCESSO! A linhagem "${arvoreSelecionada}" foi enxertada na mesa [${mesaId}].`);
    };

    const todosJogadores = Object.entries(personagens || {});
    const jogadoresFiltrados = todosJogadores.filter(([nome, ficha]) => (ficha?.bio?.mesa || 'presente') === mesaVisor);
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    // 🔥 AGRUPAMENTO EM DOIS NÍVEIS (CATEGORIA > SUBPASTA) 🔥
    const npcsHierarquia = {};
    if (mesaVisor === 'npc') {
        jogadoresFiltrados.forEach(([nome, ficha]) => {
            let stringPasta = ficha?.bio?.afiliacao;
            
            if (!stringPasta || stringPasta.trim() === '') {
                const lorePoder = (ficha?.poderes || []).find(p => p.nome === "📖 Linhagem & Lore");
                if (lorePoder && lorePoder.descricao) {
                    const match = lorePoder.descricao.match(/Clã /);
                    if (match) stringPasta = lorePoder.descricao.split('\n').find(l => l.includes('Clã')).replace('Clã / Panteão:', '').trim();
                }
            }

            if (!stringPasta || stringPasta === 'Nenhum' || stringPasta.trim() === '') {
                stringPasta = 'Sem Clã / Bestas Soltas';
            }

            const partes = stringPasta.split('/').map(p => p.trim()).filter(Boolean);
            const catRaiz = partes[0] || 'Sem Clã';
            const subPasta = partes.length > 1 ? partes.slice(1).join(' / ') : '_geral';

            if (!npcsHierarquia[catRaiz]) npcsHierarquia[catRaiz] = {};
            if (!npcsHierarquia[catRaiz][subPasta]) npcsHierarquia[catRaiz][subPasta] = [];
            npcsHierarquia[catRaiz][subPasta].push([nome, ficha]);
        });
    }

    // 🃏 GERADOR DA CARTA DE PERSONAGEM SUPREMA 🃏
    const renderCard = ([nome, ficha]) => {
        const vida = getStatusLimpo(ficha, 'vida', 8);
        const mana = getStatusLimpo(ficha, 'mana', 9);
        const aura = getStatusLimpo(ficha, 'aura', 9);
        const chakra = getStatusLimpo(ficha, 'chakra', 9);
        const corpo = getStatusLimpo(ficha, 'corpo', 9);
        const supremas = getEnergiasSupremas(ficha);
        const percHp = vida.max > 0 ? (vida.atual / vida.max) * 100 : 0;
        
        const classeReal = ficha?.bio?.classe || '';
        let classId = classeReal;
        if (classId === 'pretender' || classId === 'alterego') classId = ficha?.bio?.subClasse || classId;

        const grandEntry = Object.entries(grandsGlobais).find(([key, val]) => val === nome && !key.includes('_candidatos'));
        const isGrandManualmente = String(classId).toLowerCase().includes('grand ');
        const isGrand = !!grandEntry || isGrandManualmente;

        const candidatoEntry = Object.entries(grandsGlobais).find(([key, val]) => key.includes('_candidatos') && Array.isArray(val) && val.includes(nome));
        const isCandidato = !isGrand && !!candidatoEntry;

        const isMisterio = classeReal === '?' || classeReal?.toLowerCase() === 'desconhecido';

        let boxBorder = `1px solid ${nome === meuNome ? '#0f0' : '#333'}`;
        let boxShadow = nome === meuNome ? '0 0 15px rgba(0,255,0,0.2)' : 'none';
        let titleColor = '#fff';
        let subColor = '#aaa';
        let subText = classId ? String(classId).toUpperCase() : 'MUNDANO';
        let gradOverlay = null;

        if (isMisterio) {
            boxBorder = '2px dashed #666';
            boxShadow = 'inset 0 0 15px rgba(255,255,255,0.05)';
            titleColor = '#aaa'; subColor = '#666';
            subText = '👤 CLASSE: ? (ENCOBERTO)';
        } else if (isGrand) {
            boxBorder = '2px solid #ffcc00';
            boxShadow = '0 0 20px rgba(255,0,60,0.4), inset 0 0 20px rgba(255,204,0,0.1)';
            titleColor = '#ffcc00';
            subColor = '#ffcc00';
            
            let displayClass = classId;
            if (grandEntry) {
                displayClass = grandEntry[0].split('_')[0]; 
            } else if (isGrandManualmente) {
                displayClass = String(displayClass).replace(/grand /ig, '');
            }
            subText = `👑 GRAND ${String(displayClass).toUpperCase()}`;
            gradOverlay = 'linear-gradient(135deg, rgba(255,0,60,0.25) 0%, rgba(255,204,0,0.1) 50%, rgba(0,0,0,0) 100%)';
            
        } else if (isCandidato) {
            boxBorder = '2px solid #00ccff';
            boxShadow = '0 0 15px rgba(0,136,255,0.4), inset 0 0 15px rgba(0,204,255,0.1)';
            titleColor = '#00ccff';
            subColor = '#00ccff';
            
            let displayClass = classId;
            if (candidatoEntry) displayClass = candidatoEntry[0].split('_')[0];
            
            subText = `🌟 CANDIDATO A ${String(displayClass).toUpperCase()}`;
            gradOverlay = 'linear-gradient(135deg, rgba(0,136,255,0.2) 0%, rgba(0,204,255,0.1) 50%, rgba(0,0,0,0) 100%)';
        }

        return (
            <div key={nome} style={{ background: 'rgba(0,0,0,0.6)', border: boxBorder, padding: '15px', borderRadius: '5px', overflow: 'hidden', position: 'relative', boxShadow: boxShadow }}>
                {gradOverlay && (<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: gradOverlay, pointerEvents: 'none', zIndex: 1 }} />)}
                <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: `${percHp}%`, background: percHp > 50 ? '#0f0' : percHp > 20 ? '#ffcc00' : '#f00', transition: 'width 0.3s', zIndex: 2 }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '5px', position: 'relative', zIndex: 2 }}>
                    <strong style={{ color: titleColor, fontSize: '1.2em', textShadow: isGrand ? '0 0 10px #ff003c' : (isCandidato ? '0 0 10px #0088ff' : 'none') }}>
                        {nome} {nome === meuNome && <span style={{color: '#0f0', fontSize: '0.6em', textShadow: 'none'}}>(VOCÊ)</span>}
                    </strong>
                    <span style={{ color: subColor, fontSize: (isGrand || isCandidato) ? '0.85em' : '0.8em', fontStyle: isMisterio ? 'normal' : 'italic', fontWeight: (isGrand || isCandidato || isMisterio) ? 'bold' : 'normal', textShadow: isGrand ? '0 0 5px #ff003c' : (isCandidato ? '0 0 5px #0088ff' : 'none'), letterSpacing: (isGrand || isCandidato) ? '1px' : 'normal' }}>
                        {subText}
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.75em', color: '#ccc', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
                    <div style={{ gridColumn: 'span 3', background: 'rgba(255,0,0,0.1)', padding: '6px', borderRadius: '3px', borderLeft: '3px solid #f00', display: 'flex', justifyContent: 'space-between' }}>
                        <span><span style={{ color: '#f00', fontWeight: 'bold' }}>HP:</span> {fmt(vida.atual)} / {fmt(vida.max)}</span>
                        {vida.pVit > 0 && <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>+{vida.pVit} Vit</span>}
                    </div>
                    <div style={{ background: 'rgba(0,136,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #0088ff' }}>
                        <span style={{ color: '#0088ff', fontWeight: 'bold' }}>MP:</span><br/>{fmt(mana.atual)} / {fmt(mana.max)}
                    </div>
                    <div style={{ background: 'rgba(170,0,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #aa00ff' }}>
                        <span style={{ color: '#aa00ff', fontWeight: 'bold' }}>AURA:</span><br/>{fmt(aura.atual)} / {fmt(aura.max)}
                    </div>
                    <div style={{ background: 'rgba(0,255,170,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #00ffaa' }}>
                        <span style={{ color: '#00ffaa', fontWeight: 'bold' }}>CHAK:</span><br/>{fmt(chakra.atual)} / {fmt(chakra.max)}
                    </div>
                    <div style={{ background: 'rgba(255,136,0,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ff8800' }}>
                        <span style={{ color: '#ff8800', fontWeight: 'bold' }}>CORP:</span><br/>{fmt(corpo.atual)} / {fmt(corpo.max)}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #fff' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>P.VIT:</span><br/>{fmt(supremas.vitais.atual)} / {fmt(supremas.vitais.max)}
                    </div>
                    <div style={{ background: 'rgba(150,0,0,0.2)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ff3333' }}>
                        <span style={{ color: '#ff3333', fontWeight: 'bold' }}>P.MOR:</span><br/>{fmt(supremas.mortais.atual)} / {fmt(supremas.mortais.max)}
                    </div>
                    <div style={{ gridColumn: 'span 3', display: 'flex', gap: '6px' }}>
                        <div style={{ flex: 1, background: 'rgba(0,255,204,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #00ffcc' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>EVA:</span> {calcularCA(ficha, 'evasiva')}
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,204,0,0.1)', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #ffcc00' }}>
                            <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>RES:</span> {calcularCA(ficha, 'resistencia')}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
                    <button className={`btn-neon ${nome === meuNome ? 'btn-green' : 'btn-gold'}`} style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0, opacity: nome === meuNome ? 0.6 : 1 }} onClick={() => handleAssumirFicha(nome, ficha)} disabled={nome === meuNome}>
                        {nome === meuNome ? '👁️ CONTROLANDO' : '✏️ EDITAR'}
                    </button>
                    <button className="btn-neon btn-blue" style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0 }} onClick={() => handleClonarFicha(nome, ficha)}>🖨️ CLONAR</button>
                    <button className="btn-neon btn-red" style={{ flex: 1, padding: '4px', fontSize: '0.8em', margin: 0, opacity: nome === meuNome ? 0.3 : 1 }} onClick={() => handleApagarJogador(nome)} disabled={nome === meuNome}>❌ APAGAR</button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#ffcc00', textShadow: '0 0 10px #ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: 10, margin: 0 }}>👑 DOMÍNIO DO MESTRE</h2>
            
            {/* 🔥 HUB DE CONVERGÊNCIA CÓSMICA (MATRIZ & HERANÇA) 🔥 */}
            <div className="def-box fade-in" style={{ borderLeft: '4px solid #aa00ff', background: 'rgba(170, 0, 255, 0.05)', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ color: '#aa00ff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🌌 Hub de Herança Cósmica <span style={{ fontSize: '0.6em', background: '#aa00ff', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>SELETOR MULTIVERSAL</span>
                        </h3>
                        <p style={{ color: '#aaa', fontSize: '0.8em', margin: '4px 0 0 0' }}>
                            Evite misturar as histórias! Defina a fundação original e enxerte dados cirurgicamente para a mesa atual.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000', padding: '6px 12px', borderRadius: '6px', border: '1px solid #444' }}>
                        <span style={{ color: '#888', fontSize: '0.85em' }}>Mesa Matriz:</span>
                        <strong style={{ color: mesaMatriz === mesaId ? '#ffcc00' : '#00ffcc' }}>{mesaMatriz}</strong>
                        <button className="btn-neon btn-small" onClick={() => {
                            const manual = window.prompt("Digite o ID exato da Mesa Matriz de onde deseja puxar as árvores e os NPCs:", mesaMatriz);
                            if (manual && manual.trim()) {
                                const idLimpo = manual.trim().toUpperCase();
                                localStorage.setItem('rpg_mesa_principal', idLimpo);
                                setMesaMatriz(idLimpo);
                                alert(`🔗 Conectado com sucesso à nuvem da matriz: ${idLimpo}`);
                            }
                        }} style={{ padding: '2px 6px', fontSize: '0.7em', margin: 0, borderColor: '#0088ff', color: '#0088ff' }} title="Definir ID da Matriz Manualmente">✏️</button>
                        {mesaMatriz !== mesaId && (
                            <button className="btn-neon btn-gold" onClick={coroarMesaMatriz} style={{ padding: '2px 8px', fontSize: '0.75em', margin: 0 }}>
                                👑 Coroar Atual
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                    {/* ENXERTO DE CAPÍTULOS DE LORE */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '6px', border: '1px solid #444' }}>
                        <strong style={{ color: '#00ccff', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>📜 Puxar Capítulo da Lore (Sexta-Feira)</strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <select 
                                className="input-neon" 
                                value={capituloSelecionado} 
                                onChange={e => setCapituloSelecionado(e.target.value)}
                                style={{ flex: 1, padding: '4px', fontSize: '0.85em', borderColor: '#00ccff', color: '#fff', margin: 0 }}
                            >
                                <option value="">-- Selecione o Capítulo da Matriz --</option>
                                {capitulosGerais.map(c => (
                                    <option key={c.id} value={c.id}>{c.titulo}</option>
                                ))}
                            </select>
                            <button className="btn-neon btn-blue" onClick={importarCapituloCirurgico} style={{ padding: '0 12px', fontSize: '0.8em', margin: 0 }}>
                                📥 Enxertar
                            </button>
                        </div>
                    </div>

                    {/* ENXERTO DE ÁRVORES GENEALÓGICAS */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '6px', border: '1px solid #444' }}>
                        <strong style={{ color: '#00ff88', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>🌳 Puxar Panteão / Clã (Árvore)</strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <select 
                                className="input-neon" 
                                value={arvoreSelecionada} 
                                onChange={e => setArvoreSelecionada(e.target.value)}
                                style={{ flex: 1, padding: '4px', fontSize: '0.85em', borderColor: '#00ff88', color: '#fff', margin: 0 }}
                            >
                                <option value="">-- Selecione o Clã da Matriz --</option>
                                {Object.keys(arvoresGerais).map(fam => (
                                    <option key={fam} value={fam}>{fam} ({arvoresGerais[fam]?.length || 0} membros)</option>
                                ))}
                            </select>
                            <button className="btn-neon btn-green" onClick={importarArvoreCirurgica} style={{ padding: '0 12px', fontSize: '0.8em', margin: 0 }}>
                                📥 Enxertar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="def-box" style={{ flex: '1 1 65%', minWidth: '400px', borderLeft: '4px solid #0088ff' }}>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                        <button className={`btn-neon ${mesaVisor === 'presente' ? 'btn-gold' : ''}`} onClick={() => setMesaVisor('presente')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>⚔️ Marcados (Presente)</button>
                        <button className={`btn-neon ${mesaVisor === 'futuro' ? 'btn-gold' : ''}`} onClick={() => setMesaVisor('futuro')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>🚀 Marcados (Futuro)</button>
                        <button className={`btn-neon ${mesaVisor === 'npc' ? 'btn-red' : ''}`} onClick={() => setMesaVisor('npc')} style={{ flex: 1, padding: '8px', fontSize: '0.9em', margin: 0 }}>👹 NPCs</button>
                    </div>

                    {/* 🔥 RENDERIZADOR HIERÁRQUICO DE SUBPASTAS VISUAIS 🔥 */}
                    {mesaVisor !== 'npc' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                            {jogadoresFiltrados.map(data => renderCard(data))}
                            {jogadoresFiltrados.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px' }}>Nenhum jogador marcado nesta linha temporal.</div>}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(npcsHierarquia).sort().map(([catRaiz, subPastasObj]) => {
                                const isCatAberta = pastasAbertas[catRaiz];
                                const totalCat = Object.values(subPastasObj).reduce((acc, curr) => acc + curr.length, 0);
                                
                                return (
                                    <div key={catRaiz} style={{ border: '1px solid #444', borderRadius: '5px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)' }}>
                                        {/* BOTÃO DA CATEGORIA PRINCIPAL */}
                                        <button 
                                            onClick={() => togglePasta(catRaiz)}
                                            style={{ 
                                                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                padding: '12px 15px', background: isCatAberta ? 'rgba(255, 0, 60, 0.2)' : 'rgba(0, 0, 0, 0.6)', 
                                                border: 'none', borderLeft: '4px solid #ff003c', color: '#ffcc00', fontWeight: 'bold', 
                                                cursor: 'pointer', textAlign: 'left', fontSize: '1.1em', transition: '0.3s'
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {isCatAberta ? '📂' : '📁'} {catRaiz.toUpperCase()}
                                            </span>
                                            <span style={{ color: '#fff', fontSize: '0.8em', background: '#ff003c', padding: '2px 8px', borderRadius: '12px' }}>{totalCat}</span>
                                        </button>
                                        
                                        {/* CONTEÚDO DA CATEGORIA (LISTA DE SUBPASTAS) */}
                                        {isCatAberta && (
                                            <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {Object.entries(subPastasObj).sort().map(([subNome, listaCards]) => {
                                                    // Se for geral, renderiza solto sem criar sub-botão
                                                    if (subNome === '_geral') {
                                                        return (
                                                            <div key={subNome} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                                                                {listaCards.map(data => renderCard(data))}
                                                            </div>
                                                        );
                                                    }

                                                    // Se for uma subpasta real com barra
                                                    const subId = `${catRaiz}|${subNome}`;
                                                    const isSubAberta = pastasAbertas[subId];

                                                    return (
                                                        <div key={subNome} style={{ border: '1px solid #333', borderRadius: '5px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', marginLeft: '10px' }}>
                                                            <button 
                                                                onClick={() => togglePasta(subId)}
                                                                style={{ 
                                                                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                                    padding: '8px 15px', background: isSubAberta ? 'rgba(0, 136, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)', 
                                                                    border: 'none', borderLeft: '3px solid #0088ff', color: '#00ccff', fontWeight: 'bold', 
                                                                    cursor: 'pointer', textAlign: 'left', fontSize: '0.95em', transition: '0.2s'
                                                                }}
                                                            >
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    ↳ {isSubAberta ? '📂' : '📁'} {subNome}
                                                                </span>
                                                                <span style={{ fontSize: '0.8em', background: '#0088ff', padding: '2px 6px', borderRadius: '8px', color: '#fff' }}>{listaCards.length}</span>
                                                            </button>
                                                            
                                                            {isSubAberta && (
                                                                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                                                                    {listaCards.map(data => renderCard(data))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {jogadoresFiltrados.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px' }}>Nenhum monstro ou entidade foi invocado.</div>}
                        </div>
                    )}
                </div>

                <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="def-box" style={{ borderLeft: '4px solid #ff003c' }}>
                        <h3 style={{ color: '#ff003c', margin: '0 0 15px 0' }}>👹 Injetor de Entidades (Mapa)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input className="input-neon" type="text" placeholder="Nome (Ex: Dragão Ancião)" value={dNome} onChange={e => setDNome(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>HP Base</label><input className="input-neon" type="number" value={dHp} onChange={e => setDHp(e.target.value)} style={{ width: '100%' }} /></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0f0', fontSize: '0.8em' }}>+ Vitalidade (Zeros)</label><input className="input-neon" type="number" value={dVit} onChange={e => setDVit(e.target.value)} style={{ width: '100%', borderColor: '#0f0', color: '#0f0' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>Defesa Alvo</label><select className="input-neon" value={dDefTipo} onChange={e => setDDefTipo(e.target.value)} style={{ width: '100%' }}><option value="evasiva">Evasiva</option><option value="resistencia">Resistência</option></select></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0088ff', fontSize: '0.8em' }}>Valor (CA)</label><input className="input-neon" type="number" value={dDef} onChange={e => setDDef(e.target.value)} style={{ width: '100%' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                                <select className="input-neon" value={dVisivelHp} onChange={e => setDVisivelHp(e.target.value)} style={{ flex: 1 }}><option value="todos">HP Visível para Todos</option><option value="mestre">HP Oculto</option></select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: dOculto ? 'rgba(255,0,60,0.1)' : 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px', border: `1px solid ${dOculto ? '#ff003c' : '#444'}`, cursor: 'pointer', transition: 'all 0.3s' }}>
                                <input type="checkbox" checked={dOculto} onChange={e => setDOculto(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                <span style={{ color: dOculto ? '#ff003c' : '#aaa', fontWeight: dOculto ? 'bold' : 'normal' }}>{dOculto ? '👻 TOKEN INVISÍVEL NO MAPA' : '👁️ Token Visível no Mapa'}</span>
                            </label>
                            <button className="btn-neon btn-red" onClick={injetarDummie} style={{ marginTop: '10px', padding: '10px', fontSize: '1.1em', fontWeight: 'bold' }}>☄️ INVOCAR NO MAPA [0,0]</button>
                        </div>
                    </div>

                    <div className="def-box" style={{ borderLeft: '4px solid #ffcc00' }}>
                        <h3 style={{ color: '#ffcc00', margin: '0 0 15px 0' }}>⚡ A Voz do Sistema</h3>
                        <textarea className="input-neon" placeholder="Escreva uma mensagem global para o ecrã de todos..." value={msgSistema} onChange={e => setMsgSistema(e.target.value)} style={{ width: '100%', minHeight: '80px', borderColor: '#ffcc00', color: '#ffcc00' }} />
                        <button className="btn-neon btn-gold" onClick={enviarAviso} style={{ width: '100%', marginTop: '10px' }}>📢 ENVIAR AVISO GLOBAL</button>
                    </div>

                    <div className="def-box" style={{ borderLeft: '4px solid #aa00ff' }}>
                        <h3 style={{ color: '#aa00ff', margin: '0 0 10px 0' }}>👑 Promover Co-Mestre</h3>
                        <p style={{ color: '#aaa', fontSize: '0.8em', marginBottom: '15px' }}>Selecione a conta de um jogador online ou digite manualmente o Nickname para dar-lhe os poderes da mesa:</p>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                            <input 
                                className="input-neon" 
                                type="text" 
                                list="online-players"
                                placeholder="Selecione/Digite o Nickname..." 
                                value={novoMestreNick} 
                                onChange={e => setNovoMestreNick(e.target.value)} 
                                style={{ flex: 1, minWidth: '150px', padding: '10px', fontSize: '1em', borderColor: '#aa00ff', color: '#aa00ff' }} 
                            />
                            
                            <datalist id="online-players">
                                {jogadoresOnline.map(nick => (
                                    <option key={nick} value={nick} />
                                ))}
                            </datalist>

                            <button 
                                className="btn-neon btn-blue" 
                                onClick={handlePromover} 
                                style={{ borderColor: '#aa00ff', color: '#aa00ff', fontWeight: 'bold', padding: '10px 25px' }}
                            >
                                PROMOVER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 🔐 TELA DE LOGIN (FALSO E-MAIL)
function AuthScreen() {
    const [isRegister, setIsRegister] = useState(false);
    const [nick, setNick] = useState('');
    const [senha, setSenha] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nick.trim() || !senha.trim()) return alert("Preencha o Nickname e a Senha!");
        if (senha.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

        setLoadingAuth(true);
        try {
            if (isRegister) {
                await registrarUsuario(nick, senha);
                alert('Conta criada com sucesso! Bem-vindo ao Multiverso.');
            } else {
                await entrarUsuario(nick, senha);
            }
        } catch(err) {
            if (err.code === 'auth/email-already-in-use') alert('Este nickname já está em uso! Tente fazer Login em vez de Registrar.');
            else if (err.code === 'auth/invalid-credential') alert('Nickname ou senha incorretos!');
            else alert('Erro: ' + err.message);
        }
        setLoadingAuth(false);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.95)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                <p style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '30px' }}>{isRegister ? 'Forje o seu destino no sistema.' : 'Identifique-se para acessar as mesas.'}</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="input-neon" type="text" placeholder="Seu Nickname Único" value={nick} onChange={e => setNick(e.target.value)} style={{ padding: '15px', fontSize: '1.1em', textAlign: 'center', textTransform: 'uppercase' }} />
                    <input className="input-neon" type="password" placeholder="Sua Senha Mestra" value={senha} onChange={e => setSenha(e.target.value)} style={{ padding: '15px', fontSize: '1.1em', textAlign: 'center' }} />
                    <button type="submit" disabled={loadingAuth} className="btn-neon btn-green" style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px' }}>
                        {loadingAuth ? 'Aguarde...' : (isRegister ? '📝 REGISTRAR CONTA' : '🚪 ENTRAR')}
                    </button>
                </form>
                <div style={{ marginTop: '25px' }}>
                    <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#00aaff', cursor: 'pointer', textDecoration: 'underline' }}>
                        {isRegister ? 'Já tem uma conta? Faça Login.' : 'Não tem conta? Registre-se aqui.'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 🏰 LOBBY DE MESAS (DESIGN TOTALMENTE NOVO E ROBUSTO)
function LobbyNeon() {
    const { setMesaId, userLogado } = useStore();
    const [codigoSala, setCodigoSala] = useState('');
    const [abaMesas, setAbaMesas] = useState('jogador');

    const [minhasMesas, setMinhasMesas] = useState(() => {
        try { 
            const stored = JSON.parse(localStorage.getItem('rpg_historico_mesas')) || []; 
            return stored.map(m => typeof m === 'string' ? { id: m, nome: m, isMestre: false } : { ...m, isMestre: m.isMestre || false });
        } catch(e) { return []; }
    });

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
                    if (m.isMestre !== isMestreReal) {
                        updated = true;
                        return { ...m, isMestre: isMestreReal };
                    }
                }
                return m;
            }));
            
            if (mounted && updated) {
                setMinhasMesas(novasMesas);
                localStorage.setItem('rpg_historico_mesas', JSON.stringify(novasMesas));
            }
        };

        checkMesas();
        return () => { mounted = false; };
    }, [userLogado]); // eslint-disable-line

    const salvarNoHistorico = (id, nomePersonalizado = id, isMestreTable = false) => {
        let existing = minhasMesas.find(m => m.id === id);
        let finalName = existing ? existing.nome : nomePersonalizado;
        
        const filtrado = minhasMesas.filter(m => m.id !== id);
        const novaLista = [{ id, nome: finalName, isMestre: isMestreTable }, ...filtrado].slice(0, 5);
        setMinhasMesas(novaLista);
        localStorage.setItem('rpg_historico_mesas', JSON.stringify(novaLista));
    };

    const editarNomeMesa = (id, e) => {
        e.stopPropagation();
        const mesa = minhasMesas.find(m => m.id === id);
        const novoNome = window.prompt("Como deseja apelidar esta mesa no seu histórico pessoal?", mesa?.nome || id);
        if (!novoNome || !novoNome.trim()) return;
        const novaLista = minhasMesas.map(m => m.id === id ? { ...m, nome: novoNome.trim() } : m);
        setMinhasMesas(novaLista);
        localStorage.setItem('rpg_historico_mesas', JSON.stringify(novaLista));
    };

    const removerDoHistorico = (idParaRemover, e) => {
        e.stopPropagation();
        const novaLista = minhasMesas.filter(m => m.id !== idParaRemover);
        setMinhasMesas(novaLista);
        localStorage.setItem('rpg_historico_mesas', JSON.stringify(novaLista));
    };

    const criarMesa = async () => {
        const definirSenha = window.confirm("Deseja proteger a mesa com uma Senha?\n(Apenas pessoas com a senha poderão entry)");
        let senha = '';
        if (definirSenha) {
            senha = window.prompt("Digite a senha para a sua mesa:");
            if (!senha) return alert("Criação cancelada porque a senha estava vazia.");
        }
        const novoCodigo = 'MESA-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        try {
            await registrarNovaMesa(novoCodigo, userLogado, senha);
            salvarNoHistorico(novoCodigo, novoCodigo, true); 
            setMesaId(novoCodigo); 
        } catch (e) { alert("Erro ao criar mesa no servidor!"); }
    };

    const entrarMesa = async (idForcado = null) => {
        const id = (idForcado || codigoSala).trim().toUpperCase();
        if (!id) return alert('Digite o código da mesa para entry!');
        
        const resultado = await verificarMesaExistente(id);
        if (!resultado.existe) return alert('Mesa não encontrada! Verifique se o código está correto.');
        
        let checkFinal = resultado;

        if (!resultado.senhaCorreta) {
            const senhaDigitada = window.prompt(`A sala ${id} é protegida!\nDigite a senha de acesso:`);
            if (!senhaDigitada) return;
            const reCheck = await verificarMesaExistente(id, senhaDigitada);
            if (!reCheck.senhaCorreta) return alert('Senha Incorreta! Acesso negado.');
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
                <span style={{ fontSize: '1.3em' }}>{icon}</span> 
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</span>
            </button>
            <button onClick={(e) => editarNomeMesa(m.id, e)} style={{ width: '45px', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', color: '#ffcc00', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', transition: '0.2s' }} title="Editar Apelido">✏️</button>
            <button onClick={(e) => removerDoHistorico(m.id, e)} style={{ width: '45px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c', color: '#ff003c', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', transition: '0.2s' }} title="Apagar do Histórico">🗑️</button>
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
                        <button title="Configurações (Em breve)" style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em', transition: '0.2s' }}>⚙️</button>
                        <button title="Sair da Conta" onClick={() => { if(window.confirm('Sair da conta?')) sairConta(); }} style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c', color: '#ff003c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em', transition: '0.2s' }}>🚪</button>
                    </div>
                </div>

                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                
                <button className="btn-neon btn-green" onClick={criarMesa} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '25px', borderRadius: '10px' }}>🌌 CRIAR NOVA MESA (Mestre)</button>
                
                {minhasMesas.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                className={`btn-neon ${abaMesas === 'mestre' ? 'btn-gold' : ''}`}
                                onClick={() => setAbaMesas('mestre')}
                                style={{ flex: 1, padding: '12px', fontWeight: 'bold', margin: 0, opacity: abaMesas === 'mestre' ? 1 : 0.5, transition: '0.3s' }}
                            >
                                👑 MESTRANDO ({mesasMestre.length})
                            </button>
                            <button
                                className={`btn-neon ${abaMesas === 'jogador' ? 'btn-blue' : ''}`}
                                onClick={() => setAbaMesas('jogador')}
                                style={{ flex: 1, padding: '12px', fontWeight: 'bold', margin: 0, opacity: abaMesas === 'jogador' ? 1 : 0.5, transition: '0.3s' }}
                            >
                                ⚔️ JOGANDO ({mesasJogador.length})
                            </button>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', border: '1px solid #222', minHeight: '180px' }}>
                            {abaMesas === 'mestre' && (
                                mesasMestre.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {mesasMestre.map(m => renderTableButton(m, 'btn-gold', '👑', '#ffcc00'))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', color: '#666', fontStyle: 'italic' }}>
                                        <span style={{ fontSize: '2em', marginBottom: '10px' }}>📜</span>
                                        Você não mestra nenhuma mesa.
                                    </div>
                                )
                            )}

                            {abaMesas === 'jogador' && (
                                mesasJogador.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {mesasJogador.map(m => renderTableButton(m, 'btn-blue', '⚔️', '#0088ff'))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', color: '#666', fontStyle: 'italic' }}>
                                        <span style={{ fontSize: '2em', marginBottom: '10px' }}>🏕️</span>
                                        Você não participa de nenhuma aventura.
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
                
                <div style={{ position: 'relative', marginBottom: '20px', marginTop: '10px' }}><hr style={{ borderColor: '#333' }} /><span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0f', padding: '0 10px', color: '#666', fontSize: '0.8em' }}>OU ENTRAR COM CONVITE</span></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="input-neon" type="text" placeholder="Cole o Código (Ex: MESA-A8X9P)" value={codigoSala} onChange={e => setCodigoSala(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '1.1em', textAlign: 'center', textTransform: 'uppercase', boxSizing: 'border-box' }} />
                    <button className="btn-neon btn-blue" onClick={() => entrarMesa()} style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', borderRadius: '10px' }}>🚪 ENTRAR NA SALA</button>
                </div>
            </div>
        </div>
    );
}

// 👑 APLICAÇÃO PRINCIPAL (APP)
export default function App() {
    const userLogado = useStore(s => s.userLogado);
    const setUserLogado = useStore(s => s.setUserLogado);
    const [authVerificada, setAuthVerificada] = useState(false);

    const jogadoresOnline = useStore(s => s.jogadoresOnline);
    const setJogadoresOnline = useStore(s => s.setJogadoresOnline);
    
    const mesaCriador = useStore(s => s.mesaCriador);
    const mesaMestres = useStore(s => s.mesaMestres);
    const setMesaInfo = useStore(s => s.setMesaInfo);

    const meuNome = useStore(s => s.meuNome);
    const setMeuNome = useStore(s => s.setMeuNome);
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha);
    const abaAtiva = useStore(s => s.abaAtiva);
    const setCenario = useStore(s => s.setCenario);
    const setDummies = useStore(s => s.setDummies);
    
    const mesaId = useStore(s => s.mesaId);
    const setMesaId = useStore(s => s.setMesaId);
    const limparFeedStore = useStore(s => s.limparFeedStore);
    
    const isMestre = useStore(s => s.isMestre);
    const setIsMestre = useStore(s => s.setIsMestre);

    const { loading } = useFirebase();
    const [pronto, setPronto] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [themeReady, setThemeReady] = useState(false);

    const [meusPersonagens, setMeusPersonagens] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rpg_historico_personagens')) || []; }
        catch(e) { return []; }
    });

    useEffect(() => { setTimeout(() => setThemeReady(true), 50); }, []);

    useEffect(() => {
        const unsub = monitorarAuth((nick) => {
            setUserLogado(nick);
            setAuthVerificada(true);
        });
        return () => unsub();
    }, [setUserLogado]);

    useEffect(() => {
        if (!mesaId || !userLogado) return;
        const unsub = iniciarListenerMestres(mesaId, (criador, mestresDict) => {
            setMesaInfo(criador, mestresDict);
            const nickSanitizado = sanitizarNome(userLogado);
            if (mestresDict[nickSanitizado]) {
                setIsMestre(true);
            } else {
                setIsMestre(false);
            }
        });
        return () => unsub();
    }, [mesaId, userLogado, setIsMestre, setMesaInfo]);

    // 🔥 SYNC CLOUD REAL-TIME: LORE E ÁRVORE GENEALÓGICA 🔥
    useEffect(() => {
        if (!mesaId || !isMestre) return;
        const unsubLore = onValue(ref(db, `mesas/${mesaId}/lore`), (snap) => {
            if (snap.exists()) {
                localStorage.setItem('rpgSextaFeira_capitulos', JSON.stringify(snap.val()));
            }
        });
        const unsubArvore = onValue(ref(db, `mesas/${mesaId}/arvore`), (snap) => {
            if (snap.exists()) {
                localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(snap.val()));
            }
        });
        return () => {
            unsubLore();
            unsubArvore();
        };
    }, [mesaId, isMestre]);

    useEffect(() => {
        let nomeLocal = localStorage.getItem('rpgNome') || localStorage.getItem('rpg_nome');
        if (nomeLocal) {
            const nomeSanitizado = sanitizarNome(nomeLocal);
            setMeuNome(nomeSanitizado);
            try {
                const backup = localStorage.getItem('rpgFicha_' + nomeSanitizado);
                if (backup) carregarDadosFicha(JSON.parse(backup));
            } catch (e) { console.warn('Falha backup:', e); }
            setPronto(true);
        }
    }, [setMeuNome, carregarDadosFicha]);

    useEffect(() => {
        const unsubDummies = iniciarListenerDummies((dados) => setDummies(dados || {}));
        const unsubCenario = iniciarListenerCenario((dados) => setCenario(dados));
        return () => { if (unsubDummies) unsubDummies(); if (unsubCenario) unsubCenario(); };
    }, [setDummies, setCenario]);

    useEffect(() => {
        if (!mesaId || !userLogado || !pronto) return;
        const unsubConnected = iniciarSistemaDePresenca(mesaId, userLogado);
        const unsubPresenca = iniciarListenerPresenca(mesaId, (dados) => {
            setJogadoresOnline(Object.keys(dados || {}));
        });
        return () => {
            if (unsubConnected) unsubConnected();
            if (unsubPresenca) unsubPresenca();
            removerPresencaImediata(mesaId, userLogado);
        };
    }, [mesaId, userLogado, pronto, setJogadoresOnline]);

    const entrarComPersonagem = async (nome) => {
        if (!nome) return;
        const nomeSanitizado = sanitizarNome(nome);
        const novaLista = [nomeSanitizado, ...meusPersonagens.filter(n => n !== nomeSanitizado)].slice(0, 5);
        setMeusPersonagens(novaLista);
        localStorage.setItem('rpg_historico_personagens', JSON.stringify(novaLista));
        localStorage.setItem('rpgNome', nomeSanitizado);
        setMeuNome(nomeSanitizado);
        setPronto(true);
        try {
            const dados = await carregarFichaDoFirebase(nomeSanitizado);
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
        } catch (e) { console.warn('Falha Firebase:', e); }
    };

    const removerPersonagemDoHistorico = (nomeParaRemover, e) => {
        e.stopPropagation();
        const novaLista = meusPersonagens.filter(n => n !== nomeParaRemover);
        setMeusPersonagens(novaLista);
        localStorage.setItem('rpg_historico_personagens', JSON.stringify(novaLista));
    };

    const criadorOn = jogadoresOnline.filter(j => j === mesaCriador);
    const coMestresOn = jogadoresOnline.filter(j => j !== mesaCriador && mesaMestres[j]);
    const playersOn = jogadoresOnline.filter(j => !mesaMestres[j]);

    let tooltipOnline = "🌟 CONTAS ONLINE NA SALA:\n\n";
    if (criadorOn.length > 0) tooltipOnline += `👑 MESTRE SUPREMO:\n- ${criadorOn.join(', ')}\n\n`;
    if (coMestresOn.length > 0) tooltipOnline += `🛡️ CO-MESTRES:\n- ${coMestresOn.join(', ')}\n\n`;
    if (playersOn.length > 0) tooltipOnline += `⚔️ AVENTUREIROS:\n- ${playersOn.join(', ')}`;
    if (jogadoresOnline.length === 0) tooltipOnline += "Ninguém online no momento.";

    if (!authVerificada) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#00ffcc', fontFamily: 'monospace' }}>Verificando as chaves do Multiverso...</div>;
    if (!userLogado) return <AuthScreen />;
    if (!mesaId) return <LobbyNeon />;
    if (loading || !themeReady) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#00ffcc', fontFamily: 'monospace' }}>Carregando a sala {mesaId}...</div>;

    if (!pronto && !meuNome) {
        return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
                <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.95)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                    <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', marginTop: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>SALA: {mesaId}</h2>
                    <p style={{ color: '#aaa', marginBottom: '30px' }}>Escolha ou crie o seu personagem para esta sessão.</p>
                    {meusPersonagens.length > 0 && (
                        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em', fontWeight: 'bold' }}>SEUS PERSONAGENS RECENTES:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {meusPersonagens.map(p => (
                                    <div key={p} style={{ display: 'flex', gap: '5px' }}>
                                        <button type="button" onClick={() => entrarComPersonagem(p)} className="btn-neon btn-blue" style={{ flex: 1, margin: 0, padding: '10px', fontWeight: 'bold' }}>👤 {p}</button>
                                        <button type="button" onClick={(e) => removerPersonagemDoHistorico(p, e)} style={{ background: 'rgba(255,0,60,0.2)', border: '1px solid #ff003c', color: '#ff003c', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' }} title="Apagar do Histórico">🗑️</button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ position: 'relative', marginBottom: '20px', marginTop: '30px' }}><hr style={{ borderColor: '#333' }} /><span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0f', padding: '0 10px', color: '#666', fontSize: '0.8em' }}>OU NOVO PERSONAGEM</span></div>
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); entrarComPersonagem(e.target.elements.nomeInput.value.trim()); }}>
                        <input className="input-neon" name="nomeInput" type="text" autoFocus placeholder="Nome (Ex: Natsu)" maxLength={50} style={{ width: '100%', boxSizing: 'border-box', padding: '15px', fontSize: '1.2em', textAlign: 'center' }}/>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn-neon btn-red" onClick={() => { limparFeedStore(); setMesaId(''); }} style={{ flex: 1, padding: '10px' }}>🚪 Voltar</button>
                            <button type="submit" className="btn-neon btn-green" style={{ flex: 2, padding: '10px', fontSize: '1.1em', fontWeight: 'bold' }}>Entrar na Mesa</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    const isMapMode = abaAtiva === 'aba-mapa';

    return (
        <div className="app-layout">
            <div style={{ position: 'absolute', top: '10px', right: '15px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '20px', border: '1px solid #333', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                
                <div title={tooltipOnline} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 255, 170, 0.1)', border: '1px solid #00ffaa', padding: '2px 8px', borderRadius: '15px', cursor: 'help', whiteSpace: 'pre-wrap' }}>
                    <span style={{ width: '8px', height: '8px', background: '#00ffaa', borderRadius: '50%', boxShadow: '0 0 8px #00ffaa' }}></span>
                    <span style={{ color: '#00ffaa', fontSize: '0.75em', fontWeight: 'bold' }}>{jogadoresOnline.length} ON</span>
                </div>

                <div style={{ borderLeft: '1px solid #444', height: '15px' }}></div>

                <span style={{ color: '#00ffcc', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '1px' }}>SALA: {mesaId}</span>
                
                <div style={{ borderLeft: '1px solid #444', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#aaa', fontSize: '0.85em', fontWeight: 'bold' }}>👤 {meuNome}</span>
                    <button onClick={() => { if(window.confirm('Deseja sair desta ficha e escolher outro personagem?')) { localStorage.removeItem('rpgNome'); localStorage.removeItem('rpg_nome'); setMeuNome(''); setPronto(false); } }} style={{ background: 'none', border: 'none', color: '#ffcc00', cursor: 'pointer', fontSize: '0.8em', padding: '0', display: 'flex', alignItems: 'center', gap: '4px' }} title="Mudar o nome/ficha atual sem sair da mesa">✏️ Trocar</button>
                </div>

                {/* 🔥 BOTÃO RESGATAR ABSOLUTO: BUSCA TUDO DA MATRIZ, COM PONTE LOCAL ANTI-ERRO 🔥 */}
                {isMestre && (
                    <button onClick={async () => {
                            const matrizId = localStorage.getItem('rpg_mesa_principal') || 'Nenhuma';
                            if (!matrizId || matrizId === 'Nenhuma') {
                                return alert('⚠️ MESTRE: Defina primeiro o ID da sua Mesa Matriz usando o botão de lápis (✏️) no Hub Cósmico!');
                            }
                            if(!window.confirm(`⚠️ MESTRE: Deseja copiar todas as fichas, NPCs e a ÁRVORE da nuvem da mesa matriz [${matrizId}] para a sala atual [${mesaId}]?`)) return;
                            
                            // 1. FORJA DOS PERSONAGENS
                            try {
                                const oldPers = await get(ref(db, `mesas/${matrizId}/personagens`));
                                if (oldPers.exists()) { 
                                    const data = oldPers.val(); 
                                    for (const key in data) {
                                        await set(ref(db, `mesas/${mesaId}/personagens/${key}`), data[key]); 
                                    }
                                }
                            } catch (err) { console.warn("Aviso na leitura de personagens:", err.message); }
                            
                            // 2. FORJA DA ÁRVORE (PONTE ANTI-PERMISSION DENIED)
                            try {
                                const oldArvore = await get(ref(db, `mesas/${matrizId}/arvore`));
                                if (oldArvore.exists()) {
                                    await set(ref(db, `mesas/${mesaId}/arvore`), oldArvore.val());
                                    localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(oldArvore.val()));
                                } else { throw new Error("Vazio"); }
                            } catch (err) {
                                console.warn("Firebase negou/falhou acesso à árvore da matriz. Injetando Ponte Local...");
                                const arvorePonte = localStorage.getItem('rpgSextaFeira_arvore_MatrizBackup');
                                if (arvorePonte) {
                                    await set(ref(db, `mesas/${mesaId}/arvore`), JSON.parse(arvorePonte));
                                    localStorage.setItem('rpgSextaFeira_arvore', arvorePonte);
                                }
                            }
                            
                            alert(`✅ INJEÇÃO SUPREMA! NPCs e Árvores de ${matrizId} foram forjados no ecrã atual! Atualize a página (F5) para ver as subpastas.`);
                        }} style={{ marginLeft: '5px', background: '#0088ff', border: '1px solid #fff', color: '#fff', fontSize: '0.7em', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🧲 RESGATAR TUDO</button>
                )}
                
                <button onClick={() => { if(window.confirm('Tem a certeza que deseja sair da mesa?')) { limparFeedStore(); setMesaId(''); } }} style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ff003c', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold', padding: 0 }} title="Desconectar do Servidor da Mesa">Sair 🚪</button>
            </div>

            <Sidebar onResetClick={() => setModalAberto(true)} />
            
            <div className={`main-content${isMapMode ? ' modo-mapa' : ''}`}>
                {!isMapMode && <h1 className="title">RPG Anime System</h1>}
                <TabPanel id="aba-perfil"><PerfilPanel /></TabPanel>
                <TabPanel id="aba-mestre"><MestrePanel /></TabPanel> 
                <TabPanel id="aba-status"><StatusPanel /></TabPanel>
                <TabPanel id="aba-testes"><TestesPanel /></TabPanel>
                <TabPanel id="aba-ataque"><AtaquePanel /></TabPanel>
                <TabPanel id="aba-acerto"><AcertoPanel /></TabPanel>
                <TabPanel id="aba-defesa"><DefesaPanel /></TabPanel>
                <TabPanel id="aba-ficha"><FichaPanel /></TabPanel>
                <TabPanel id="aba-poderes"><PoderesPanel /></TabPanel>
                <TabPanel id="aba-arsenal"><ArsenalPanel /></TabPanel>
                <TabPanel id="aba-elementos"><ElementosPanel /></TabPanel>
                <TabPanel id="aba-log"><FeedCombate /></TabPanel>
                <TabPanel id="aba-mapa"><MapaPanel /></TabPanel>
                <TabPanel id="aba-musica"><Jukebox /></TabPanel>
                <TabPanel id="aba-compendio"><CompendioPanel /></TabPanel>
                <TabPanel id="aba-oraculo"><AIPanel /></TabPanel>
                <TabPanel id="aba-gravador"><GravadorPanel /></TabPanel>
            </div>
            
            <ModalConfirm isOpen={modalAberto} onClose={() => setModalAberto(false)} />
        </div>
    );
}