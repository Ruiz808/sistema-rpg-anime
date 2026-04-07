import React, { createContext, useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie, uploadImagem, salvarCenarioCompleto, zerarIniciativaGlobal } from '../../services/firebase-sync';
import { calcularAcerto } from '../../core/engine';
import { resolverEfeitosEntidade } from '../../core/efeitos-resolver';
import { getBuffs } from '../../core/attributes';
import Peer from 'peerjs';

export const MAP_SIZE = 30;
export const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

export function urlSeguraParaCss(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '';
    return `url("${trimmed.replace(/["\\)]/g, '')}")`;
}

export function calcularCA(ficha, tipo) {
    if (!ficha) return 10;
    const getDoisDigitos = (valor) => {
        if (!valor) return 0;
        const strVal = String(valor).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    };
    let base = 5;
    if (tipo === 'evasiva') base += getDoisDigitos(ficha.destreza?.base);
    if (tipo === 'resistencia') base += getDoisDigitos(ficha.forca?.base);

    let bonus = 0;
    const somarBonus = (efeitos) => {
        (efeitos || []).forEach(e => {
            if (e && e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0;
        });
    };

    (ficha.poderes || []).forEach(p => {
        let resolved = resolverEfeitosEntidade(p);
        if (p.ativa) somarBonus(resolved.efeitos);
        somarBonus(resolved.efeitosPassivos);
    });
    (ficha.passivas || []).forEach(p => { somarBonus(p.efeitos); });
    (ficha.inventario || []).filter(i => i.equipado).forEach(i => {
        let resolved = resolverEfeitosEntidade(i);
        somarBonus(resolved.efeitos);
        somarBonus(resolved.efeitosPassivos);
    });

    return Math.floor(base + bonus);
}

const MapaFormContext = createContext(null);

export function useMapaForm() {
    const ctx = useContext(MapaFormContext);
    if (!ctx) return null;
    return ctx;
}

export function MapaFormProvider({ children }) {
    const { minhaFicha, meuNome, personagens, updateFicha, feedCombate = [], isMestre, dummies, alvoSelecionado, cenario } = useStore();
    const fichaSegura = minhaFicha || {};

    const [modo3D, setModo3D] = useState(false);
    const [tamanhoCelula, setTamanhoCelula] = useState(35);
    const [iniciativaInput, setIniciativaInput] = useState(() => fichaSegura.iniciativa || 0);
    const [altitudeInput, setAltitudeInput] = useState(() => fichaSegura.posicao?.z || 0);
    const [turnoAtualIndex, setTurnoAtualIndex] = useState(0);
    const [feedIndexTurnoAtual, setFeedIndexTurnoAtual] = useState(0);
    const [jogadorHistory, setJogadorHistory] = useState(null);

    const [mapQD, setMapQD] = useState(1);
    const [mapFD, setMapFD] = useState(20);
    const [mapBonus, setMapBonus] = useState(0);
    const [mapStat, setMapStat] = useState('destreza');
    const [mapUsarProf, setMapUsarProf] = useState(false);
    const profGlobal = parseInt(fichaSegura.proficienciaBase) || 0;
    
    const [mapVantagens, setMapVantagens] = useState(() => fichaSegura.ataqueConfig?.vantagens || 0);
    const [mapDesvantagens, setMapDesvantagens] = useState(() => fichaSegura.ataqueConfig?.desvantagens || 0);
    
    const [novaCenaNome, setNovaCenaNome] = useState('');
    const [novaCenaEscala, setNovaCenaEscala] = useState(1.5);
    const [novaCenaUnidade, setNovaCenaUnidade] = useState('m');
    const [uploadingMap, setUploadingMap] = useState(false);

    const [dadoAnim, setDadoAnim] = useState({ ativo: false, numero: 20, finalResult: null, cor: '#00ffcc', quemRolou: '' });
    const prevFeedLen = useRef(feedCombate.length);

    const [cenaVisualizadaId, setCenaVisualizadaId] = useState(null);
    const cenaAtivaIdGlobal = cenario?.ativa || 'default';
    const cenaRenderId = (isMestre && cenaVisualizadaId) ? cenaVisualizadaId : cenaAtivaIdGlobal;
    const cenaAtual = cenario?.lista?.[cenaRenderId] || { nome: 'Desconhecido', img: '', escala: 1.5, unidade: 'm' };

    const isModoRP = cenario?.modoRP === true;
    const [mestreVendoRP, setMestreVendoRP] = useState(false);
    
    const tavernaAtivos = Array.isArray(cenario?.tavernaAtivos) ? cenario.tavernaAtivos : [];
    const isPresenteNaTaverna = tavernaAtivos.includes(meuNome);

    // ========================================================================
    // 🔥 SISTEMA GLOBAL DE VOZ (PEERJS) BLINDADO + SELETOR DE MICROFONE 🔥
    // ========================================================================
    const [peerObj, setPeerObj] = useState(null);
    const [meuStream, setMeuStream] = useState(null);
    const meuStreamRef = useRef(null); 
    const [conexoes, setConexoes] = useState([]);
    const [mutado, setMutado] = useState(false);
    const [surdo, setSurdo] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('Aguardando Mic...');

    const [mics, setMics] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');

    const meuIDTelefone = meuNome ? meuNome.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const rtcInicializado = useRef(false);

    useEffect(() => {
        if (!meuIDTelefone || rtcInicializado.current) return;
        rtcInicializado.current = true;

        const iniciarSistemaDeVoz = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                meuStreamRef.current = stream;
                setMeuStream(stream);

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                setMics(audioInputs);
                if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);

                const novoPeer = new Peer(`anime-rpg-${meuIDTelefone}`, {
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });
                
                novoPeer.on('open', (id) => {
                    setPeerObj(novoPeer);
                    setVoiceStatus('Rádio Online');
                });

                novoPeer.on('call', (call) => {
                    setVoiceStatus(`Recebendo chamada de ${call.peer}...`);
                    
                    // 🔥 CORREÇÃO: Espera o microfone estar pronto antes de atender a chamada!
                    const attemptAnswer = () => {
                        if (meuStreamRef.current) {
                            call.answer(meuStreamRef.current);
                            call.on('stream', (remoteStream) => {
                                setConexoes(prev => {
                                    const existe = prev.find(c => c.id === call.peer);
                                    if (existe) return prev.map(c => c.id === call.peer ? { ...c, stream: remoteStream } : c);
                                    return [...prev, { id: call.peer, stream: remoteStream }];
                                });
                                setVoiceStatus('Conectado!'); 
                            });
                        } else {
                            setTimeout(attemptAnswer, 500); // Tenta de novo se o mic não estiver pronto
                        }
                    };
                    attemptAnswer();
                });
            } catch (err) {
                setVoiceStatus(`Erro: Sem Microfone.`);
                console.error(err);
            }
        };

        iniciarSistemaDeVoz();
    }, [meuIDTelefone]);

    const trocarMicrofone = useCallback(async (deviceId) => {
        try {
            setSelectedMic(deviceId);
            if (meuStreamRef.current) {
                meuStreamRef.current.getTracks().forEach(t => t.stop()); 
            }
            
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
            meuStreamRef.current = newStream;
            setMeuStream(newStream);

            if (peerObj) {
                Object.values(peerObj.connections).forEach(conns => {
                    conns.forEach(conn => {
                        if (conn.peerConnection) {
                            const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
                            if (sender) sender.replaceTrack(newStream.getAudioTracks()[0]);
                        }
                    });
                });
            }
        } catch (err) {
            console.error("Erro ao trocar mic:", err);
            setVoiceStatus("Erro ao trocar Mic.");
        }
    }, [peerObj]);

    const toggleMute = useCallback(() => {
        if (meuStream) {
            meuStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setMutado(!meuStream.getAudioTracks()[0].enabled);
        }
    }, [meuStream]);

    const toggleDeafen = useCallback(() => setSurdo(s => !s), []);

    const fazerChamada = useCallback((nomeDestino) => {
        if (!peerObj || !meuStreamRef.current || !nomeDestino) return;
        const idFormatado = `anime-rpg-${nomeDestino.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        setVoiceStatus(`Chamando ${nomeDestino}...`);
        
        const call = peerObj.call(idFormatado, meuStreamRef.current);
        call.on('stream', (remoteStream) => {
            setConexoes(prev => {
                const existe = prev.find(c => c.id === idFormatado);
                if (existe) return prev.map(c => c.id === idFormatado ? { ...c, stream: remoteStream } : c);
                return [...prev, { id: idFormatado, stream: remoteStream }];
            });
            setVoiceStatus('Conectado!');
        });
        call.on('error', () => setVoiceStatus(`${nomeDestino} Offline`));
    }, [peerObj]);

    const desconectarVoz = useCallback((idPeer) => {
        setConexoes(prev => prev.filter(c => c.id !== idPeer));
    }, []);

    // ========================================================================
    // RESTO DO CÓDIGO (LÓGICA DO MAPA)
    // ========================================================================

    const toggleModoRP = useCallback(() => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        novoCenario.modoRP = !novoCenario.modoRP;
        if (!novoCenario.modoRP) novoCenario.tavernaAtivos = [];
        salvarCenarioCompleto(novoCenario);
        enviarParaFeed({ 
            tipo: 'sistema', nome: 'SISTEMA', 
            texto: novoCenario.modoRP ? '🍻 A Party entrou na Sala de Espera! O Mestre está a moldar a realidade...' : '🌍 O VÉU FOI LEVANTADO! A REALIDADE É REVELADA!' 
        });
    }, [cenario]);

    const togglePresencaTaverna = useCallback(() => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        if (!Array.isArray(novoCenario.tavernaAtivos)) novoCenario.tavernaAtivos = [];
        if (isPresenteNaTaverna) novoCenario.tavernaAtivos = novoCenario.tavernaAtivos.filter(n => n !== meuNome);
        else novoCenario.tavernaAtivos.push(meuNome);
        salvarCenarioCompleto(novoCenario);
    }, [cenario, isPresenteNaTaverna, meuNome]);

    const overridesCompendio = useMemo(() => {
        if (!minhaFicha) return {};
        if (isMestre && minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for(let k of chaves) { if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides; }
        }
        return {};
    }, [isMestre, minhaFicha, personagens]);

    useEffect(() => {
        if (feedCombate.length > prevFeedLen.current) {
            const newItem = feedCombate[feedCombate.length - 1];
            if (newItem && newItem.rolagem && (newItem.tipo === 'acerto' || newItem.tipo === 'dano')) {
                let rawRoll = 0;
                let regexStrong = /<strong>(\d+)<\/strong>/g;
                let match;
                while ((match = regexStrong.exec(newItem.rolagem)) !== null) {
                    let v = parseInt(match[1]);
                    if (v > rawRoll) rawRoll = v;
                }
                if (rawRoll === 0) { 
                    let regexArr = /\[(.*?)\]/;
                    let mArr = regexArr.exec(newItem.rolagem);
                    if (mArr) {
                        let clean = mArr[1].replace(/<[^>]*>?/gm, ''); 
                        let nums = clean.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                        if (nums.length > 0) rawRoll = Math.max(...nums);
                    }
                }
                
                if (rawRoll > 0) {
                    let corFinal = '#0088ff'; 
                    if (newItem.tipo === 'dano') {
                        if (newItem.armaStr?.includes('FATAL')) corFinal = '#ff003c'; 
                        else if (newItem.armaStr?.includes('CRÍTICO')) corFinal = '#ffcc00'; 
                    } else {
                        if (rawRoll === 20) corFinal = '#ff003c'; 
                        else if (rawRoll >= 18) corFinal = '#ffcc00'; 
                        else if (rawRoll === 1) corFinal = '#660000'; 
                    }

                    setDadoAnim({ ativo: true, numero: Math.floor(Math.random() * 20) + 1, finalResult: null, cor: '#00ffcc', quemRolou: newItem.nome });
                    let intervalos = 0;
                    const tempoGiro = setInterval(() => {
                        setDadoAnim(prev => ({ ...prev, numero: Math.floor(Math.random() * 20) + 1 }));
                        intervalos++;
                        if (intervalos > 15) {
                            clearInterval(tempoGiro);
                            setDadoAnim({ ativo: true, numero: rawRoll, finalResult: rawRoll, cor: corFinal, quemRolou: newItem.nome });
                            setTimeout(() => { setDadoAnim({ ativo: false, numero: 20, finalResult: null, cor: '#00ffcc', quemRolou: '' }); }, 2000);
                        }
                    }, 80);
                }
            }
        }
        prevFeedLen.current = feedCombate.length;
    }, [feedCombate]);

    useEffect(() => { setMapVantagens(fichaSegura.ataqueConfig?.vantagens || 0); setMapDesvantagens(fichaSegura.ataqueConfig?.desvantagens || 0); }, [fichaSegura.ataqueConfig?.vantagens, fichaSegura.ataqueConfig?.desvantagens]);
    useEffect(() => { setAltitudeInput(fichaSegura.posicao?.z || 0); }, [fichaSegura.posicao?.z]);

    const changeVantagem = useCallback((e) => {
        const val = parseInt(e.target.value) || 0;
        setMapVantagens(val);
        updateFicha(f => { if(!f.ataqueConfig) f.ataqueConfig = {}; f.ataqueConfig.vantagens = val; });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const changeDesvantagem = useCallback((e) => {
        const val = parseInt(e.target.value) || 0;
        setMapDesvantagens(val);
        updateFicha(f => { if(!f.ataqueConfig) f.ataqueConfig = {}; f.ataqueConfig.desvantagens = val; });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const handleUploadNovaCena = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!novaCenaNome.trim()) return alert('Por favor, dê um nome à cena antes de anexar o mapa!');
        setUploadingMap(true);
        try {
            const urlPermanente = await uploadImagem(file, `mapas/${Date.now()}`);
            const novaCenaId = 'cena_' + Date.now();
            const novoCenario = JSON.parse(JSON.stringify(cenario));
            if (!novoCenario.lista) novoCenario.lista = {};
            novoCenario.lista[novaCenaId] = { nome: novaCenaNome, img: urlPermanente, escala: parseFloat(novaCenaEscala) || 1.5, unidade: novaCenaUnidade };
            salvarCenarioCompleto(novoCenario);
            setCenaVisualizadaId(novaCenaId);
            enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🗺️ O Mestre começou a preparar uma área desconhecida...` });
            setNovaCenaNome('');
        } catch (err) { alert('Erro ao enviar a imagem.'); } finally { setUploadingMap(false); }
    }, [novaCenaNome, novaCenaEscala, novaCenaUnidade, cenario]);

    const ativarCena = useCallback((id) => {
        const novoCenario = JSON.parse(JSON.stringify(cenario));
        novoCenario.ativa = id;
        salvarCenarioCompleto(novoCenario);
        setCenaVisualizadaId(null); 
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🗺️ O cenário mudou para: ${novoCenario.lista[id].nome}!` });
    }, [cenario]);

    const deletarCena = useCallback((id) => {
        if(id === 'default') return alert("A cena inicial não pode ser apagada.");
        if(!window.confirm("Tem certeza que deseja apagar esta cena?")) return;
        const novoCenario = JSON.parse(JSON.stringify(cenario));
        delete novoCenario.lista[id];
        if(novoCenario.ativa === id) novoCenario.ativa = 'default';
        salvarCenarioCompleto(novoCenario);
        if(cenaVisualizadaId === id) setCenaVisualizadaId(null);
    }, [cenario, cenaVisualizadaId]);

    const coresJogadoresRef = useRef({});
    const corIndexRef = useRef(0);
    const corDoJogador = useCallback((nome) => {
        if (!coresJogadoresRef.current[nome]) { coresJogadoresRef.current[nome] = PALETA[corIndexRef.current % PALETA.length]; corIndexRef.current++; }
        return coresJogadoresRef.current[nome];
    }, []);

    const deletarZona = useCallback((idZona) => {
        if(!window.confirm("Apagar a Zona de Efeito do mapa?")) return;
        const novoCenario = JSON.parse(JSON.stringify(cenario));
        novoCenario.zonas = (novoCenario.zonas || []).filter(z => z.id !== idZona);
        salvarCenarioCompleto(novoCenario);
    }, [cenario]);

    const getAvatarInfo = useCallback((ficha) => {
        if (!ficha) return { img: '', forma: null };
        const result = { img: ficha.avatar ? ficha.avatar.base : '', forma: null };
        if (ficha.poderes) {
            for (let j = 0; j < ficha.poderes.length; j++) {
                const p = ficha.poderes[j];
                if (p.ativa && p.imagemUrl && p.imagemUrl.trim() !== '') { result.img = p.imagemUrl; result.forma = p.nome; }
            }
        }
        return result;
    }, []);

    const fmt = useCallback((n) => Number(n || 0).toLocaleString('pt-BR'), []);

    const cells = useMemo(() => {
        const arr = [];
        for (let y = 0; y < MAP_SIZE; y++) { for (let x = 0; x < MAP_SIZE; x++) { arr.push({ x, y }); } }
        return arr;
    }, []);

    const jogadores = useMemo(() => {
        const result = {};
        if (meuNome && minhaFicha?.posicao && minhaFicha.posicao.x !== undefined) result[meuNome] = minhaFicha;
        if (personagens) {
            const nomes = Object.keys(personagens);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === meuNome) continue;
                const ficha = personagens[nome];
                if (ficha && ficha.posicao && ficha.posicao.x !== undefined) result[nome] = ficha;
            }
        }
        return result;
    }, [meuNome, minhaFicha, personagens]);

    const playersNaTaverna = useMemo(() => {
        return tavernaAtivos.map(nome => {
            const f = (nome === meuNome) ? minhaFicha : personagens?.[nome];
            return [nome, f];
        }).filter(([n, f]) => f != null);
    }, [tavernaAtivos, meuNome, minhaFicha, personagens]);

    const ordemIniciativa = useMemo(() => {
        const lista = [];
        if (personagens) {
            const nomes = Object.keys(personagens);
            for (let i = 0; i < nomes.length; i++) {
                const n = nomes[i];
                const f = personagens[n];
                const cenaDoJogador = f?.posicao?.cenaId || 'default';
                if (f && f.iniciativa !== undefined && f.iniciativa > 0 && cenaDoJogador === cenaRenderId) {
                    lista.push({ nome: n, ficha: f, iniciativa: f.iniciativa });
                }
            }
        }
        lista.sort((a, b) => b.iniciativa - a.iniciativa);
        return lista;
    }, [personagens, cenaRenderId]);

    const getDanoDinamicoZona = useCallback((zona) => {
        let baseResult = { dano: zona.danoOriginal || zona.danoAplicado || 0, letalidade: zona.letalidadeOriginal || 0 };
        const storeState = useStore.getState();
        const fichaCaster = (zona.conjurador === storeState.meuNome) ? storeState.minhaFicha : storeState.personagens?.[zona.conjurador];
        if (!fichaCaster) return baseResult;
        
        const buffs = getBuffs(fichaCaster);
        let maxFuria = 0; let danoBrutoAtual = 0; let letalidadeAtual = 0;
        
        const scan = (efs) => {
            (efs || []).forEach(e => {
                if (!e) return;
                const prop = (e.propriedade || '').toLowerCase().trim();
                if (prop === 'furia_berserker') { const v = parseFloat(e.valor) || 0; if (v > maxFuria) maxFuria = v; }
                if (prop === 'dano_bruto' || prop === 'dano_verdadeiro') danoBrutoAtual += parseFloat(e.valor) || 0;
                if (prop === 'letalidade') letalidadeAtual += parseFloat(e.valor) || 0;
            });
        };
        
        (fichaCaster.poderes || []).forEach(p => { if (p.ativa) scan(p.efeitos); scan(p.efeitosPassivos); });
        (fichaCaster.inventario || []).forEach(i => { if (i.equipado) { scan(i.efeitos); scan(i.efeitosPassivos); } });
        (fichaCaster.passivas || []).forEach(p => scan(p.efeitos));
        
        const furiaAtiva = maxFuria > 0 ? maxFuria : 1;
        const multAtual = (buffs?.mbase || 1) * (buffs?.mgeral || 1) * (buffs?.mformas || 1) * (buffs?.mabs || 1) * furiaAtiva;
        const baseMulti = zona.multiplicadorOriginal || 1;
        
        let somaStatusAtual = 0;
        (zona.statusKeys || []).forEach(k => {
            const str = String(fichaCaster[k]?.base || '').replace(/[^0-9]/g, '');
            somaStatusAtual += parseInt(str.substring(0, 2), 10) || 0;
        });
        
        const diffStatus = somaStatusAtual - (zona.somaStatusOriginal || somaStatusAtual);
        const diffBruto = danoBrutoAtual - (zona.danoBrutoOriginal || danoBrutoAtual);
        const diffLetalidade = letalidadeAtual - (zona.letalidadeOriginalBuffs || letalidadeAtual);
        
        const novoDanoBase = (zona.danoOriginal / baseMulti) + diffStatus + diffBruto;
        const novoDano = Math.floor(novoDanoBase * multAtual);
        
        return { dano: novoDano > 0 ? novoDano : zona.danoOriginal, letalidade: (zona.letalidadeOriginal || 0) + diffLetalidade };
    }, []);

    const dispararEfeitoDaZona = useCallback((zona) => {
        const cenaAtivaId = cenario?.ativa || 'default';
        const escala = cenario?.lista?.[cenaAtivaId]?.escala || 1.5;
        const din = getDanoDinamicoZona(zona);
        const danoAtual = din.dano;
        const letalAtual = din.letalidade;
        let hitLog = [];

        const checkHit = (pos, nome, isDummie, idDummie, dData) => {
            if ((pos?.cenaId || 'default') !== (zona.cenaId || 'default')) return;
            if (zona.alvosFiltro === 'inimigos' && !isDummie) return;
            if (zona.alvosFiltro === 'aliados' && isDummie) return;

            const dX = Math.abs(pos.x - zona.x); const dY = Math.abs(pos.y - zona.y); const dZ = Math.floor(Math.abs((pos.z || 0) - (zona.z || 0)) / escala);
            
            if (Math.max(dX, dY, dZ) <= zona.raio) {
                hitLog.push(nome);
                if (isDummie && idDummie && dData) salvarDummie(idDummie, { ...dData, hpAtual: Math.max(0, dData.hpAtual - danoAtual) });
                else if (nome === meuNome) { updateFicha(f => { if (f.vida) f.vida.atual = Math.max(0, f.vida.atual - danoAtual); }); salvarFichaSilencioso(); }
            }
        };

        Object.entries(dummies || {}).forEach(([id, d]) => checkHit(d.posicao, d.nome, true, id, d));
        if (minhaFicha?.posicao) checkHit(minhaFicha.posicao, meuNome, false, null, null);
        
        if (hitLog.length > 0) {
            const letalStr = letalAtual > 0 ? ` (+${letalAtual} Letalidade)` : '';
            enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🌪️ A Zona [${zona.nome}] castigou ${hitLog.join(', ')} com ${danoAtual} de Dano${letalStr}!` });
        }
    }, [cenario, getDanoDinamicoZona, dummies, minhaFicha, meuNome, updateFicha]);

    const processarEntradaNaZona = useCallback((oldPos, newX, newY, newZ, entidadeNome, isDummie, idDummie, dData) => {
        const cenaAtivaId = cenario?.ativa || 'default';
        const escala = cenario?.lista?.[cenaAtivaId]?.escala || 1.5;
        const zonasCena = (cenario?.zonas || []).filter(zo => (zo.cenaId || 'default') === cenaRenderId && zo.danoOriginal);
        
        zonasCena.forEach(zona => {
            if (zona.alvosFiltro === 'inimigos' && !isDummie) return;
            if (zona.alvosFiltro === 'aliados' && isDummie) return;

            let estavaDentro = false;
            if (oldPos && oldPos.x !== undefined) {
                const oldDX = Math.abs(oldPos.x - zona.x); const oldDY = Math.abs(oldPos.y - zona.y); const oldDZ = Math.floor(Math.abs((oldPos.z || 0) - (zona.z || 0)) / escala);
                estavaDentro = Math.max(oldDX, oldDY, oldDZ) <= zona.raio;
            }

            const dX = Math.abs(newX - zona.x); const dY = Math.abs(newY - zona.y); const dZ = Math.floor(Math.abs(newZ - (zona.z || 0)) / escala);
            const estaDentro = Math.max(dX, dY, dZ) <= zona.raio;

            if (!estavaDentro && estaDentro) {
                const din = getDanoDinamicoZona(zona);
                const danoAtual = din.dano; const letalAtual = din.letalidade;
                const letalStr = letalAtual > 0 ? ` (+${letalAtual} Letalidade)` : '';
                
                enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `⚠️ ${entidadeNome} pisou na área de [${zona.nome}] e sofreu ${danoAtual} de Dano${letalStr} imediatamente!` });
                if (isDummie && idDummie && dData) salvarDummie(idDummie, { ...dData, hpAtual: Math.max(0, dData.hpAtual - danoAtual) });
                else if (entidadeNome === meuNome) { updateFicha(f => { if (f.vida) f.vida.atual = Math.max(0, f.vida.atual - danoAtual); }); salvarFichaSilencioso(); }
            }
        });
    }, [cenario, cenaRenderId, meuNome, updateFicha, getDanoDinamicoZona]);

    const handleCellClick = useCallback((x, y) => {
        const z = parseInt(altitudeInput) || 0;
        const oldPos = isMestre && alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado].posicao : minhaFicha?.posicao;
        
        if (isMestre && alvoSelecionado && dummies[alvoSelecionado]) {
            const d = dummies[alvoSelecionado];
            salvarDummie(alvoSelecionado, { ...d, posicao: { x, y, z }, cenaId: cenaRenderId });
            processarEntradaNaZona(oldPos, x, y, z, d.nome, true, alvoSelecionado, d);
        } else {
            updateFicha((ficha) => {
                if (!ficha.posicao) ficha.posicao = {};
                ficha.posicao.x = x; ficha.posicao.y = y; ficha.posicao.z = z; ficha.posicao.cenaId = cenaRenderId; 
            });
            salvarFichaSilencioso();
            processarEntradaNaZona(oldPos, x, y, z, meuNome, false, null, null);
        }
    }, [isMestre, alvoSelecionado, dummies, cenaRenderId, altitudeInput, updateFicha, processarEntradaNaZona, meuNome, minhaFicha]);

    const alterarZoom = useCallback((direcao) => {
        setTamanhoCelula(prev => { let novo = prev + (direcao > 0 ? 5 : -5); if (novo < 15) novo = 15; if (novo > 80) novo = 80; return novo; });
    }, []);

    const setMinhaIniciativa = useCallback(() => {
        const val = parseInt(iniciativaInput) || 0;
        updateFicha((ficha) => { ficha.iniciativa = val; if (!ficha.posicao) ficha.posicao = {}; ficha.posicao.cenaId = cenaRenderId; });
        salvarFichaSilencioso();
        setFeedIndexTurnoAtual(feedCombate.length); 
    }, [iniciativaInput, cenaRenderId, updateFicha, feedCombate.length]);

    const avancarTurno = useCallback(() => {
        if (ordemIniciativa.length === 0) return;
        let nextIndex = turnoAtualIndex + 1;
        if (nextIndex >= ordemIniciativa.length) nextIndex = 0;
        const nextPlayer = ordemIniciativa[nextIndex];
        
        setTurnoAtualIndex(nextIndex); setFeedIndexTurnoAtual(feedCombate.length); setJogadorHistory(null);

        const storeState = useStore.getState();
        const cenarioAtual = storeState.cenario;

        if (cenarioAtual?.zonas && cenarioAtual.zonas.length > 0) {
            const novoCenario = JSON.parse(JSON.stringify(cenarioAtual));
            let mudouCenario = false;
            novoCenario.zonas = novoCenario.zonas.filter(z => {
                if (z.conjurador === nextPlayer.nome) {
                    z.duracao -= 1; mudouCenario = true;
                    if (z.duracao > 0 && z.danoOriginal) dispararEfeitoDaZona(z);
                    return z.duracao > 0;
                }
                return true; 
            });
            if (mudouCenario) salvarCenarioCompleto(novoCenario);
        }
    }, [ordemIniciativa, turnoAtualIndex, feedCombate.length, dispararEfeitoDaZona]);

    const sairDoCombate = useCallback(() => { updateFicha(ficha => { ficha.iniciativa = 0; }); setIniciativaInput(0); salvarFichaSilencioso(); setJogadorHistory(null); }, [updateFicha]);

    const encerrarCombate = useCallback(() => {
        if (!window.confirm(`Zerar a iniciativa de TODOS na cena "${cenaAtual.nome}"?`)) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `⚔️ O COMBATE EM ${cenaAtual.nome.toUpperCase()} FOI ENCERRADO PELO MESTRE! ⚔️` });
        zerarIniciativaGlobal(ordemIniciativa.map(j => j.nome));
        updateFicha(ficha => { ficha.iniciativa = 0; }); setIniciativaInput(0); salvarFichaSilencioso(); setJogadorHistory(null); setTurnoAtualIndex(0);
    }, [cenaAtual.nome, ordemIniciativa, updateFicha]);

    const rolarAcertoRapido = useCallback(() => {
        const qD = parseInt(mapQD) || 1; const fD = parseInt(mapFD) || 20; const bonus = parseInt(mapBonus) || 0; const prof = mapUsarProf ? profGlobal : 0;
        const sels = [mapStat]; const itensEq = fichaSegura?.inventario ? fichaSegura.inventario.filter(i => i.equipado) : [];
        const result = calcularAcerto({ qD, fD, prof, bonus, sels, minhaFicha: fichaSegura, itensEquipados: itensEq, vantagens: mapVantagens, desvantagens: mapDesvantagens });

        let alvosAtingidos = []; let maxArea = 0;
        const alvoDummie = alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado] : null;

        if (alvoDummie) {
            const armasEqMap = itensEq.filter(i => i.tipo === 'arma');
            const maxAreaArmas = armasEqMap.length > 0 ? Math.max(...armasEqMap.map(a => a.areaQuad || a.area || 0)) : 0;
            const podAtMap = (fichaSegura?.poderes || []).filter(p => p.ativa);
            const maxAreaPoderes = podAtMap.length > 0 ? Math.max(...podAtMap.map(p => p.areaQuad || p.area || 0)) : 0;
            const magiasEqMap = (fichaSegura?.ataquesElementais || []).filter(m => m.equipado);
            const maxAreaMagias = magiasEqMap.length > 0 ? Math.max(...magiasEqMap.map(m => m.areaQuad || 0)) : 0;

            maxArea = Math.max(maxAreaArmas, maxAreaPoderes, maxAreaMagias);

            if (maxArea > 0) {
                const cenaAtivaId = cenario?.ativa || 'default';
                const escala = cenario?.lista?.[cenaAtivaId]?.escala || 1.5;

                Object.entries(dummies).forEach(([id, dObj]) => {
                    const isSameScene = (dObj.cenaId || 'default') === (alvoDummie.cenaId || 'default');
                    if (isSameScene && dObj.posicao && alvoDummie.posicao) {
                        const dX = Math.abs(dObj.posicao.x - alvoDummie.posicao.x); const dY = Math.abs(dObj.posicao.y - alvoDummie.posicao.y); const dZ = Math.floor(Math.abs((dObj.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);
                        if (Math.max(dX, dY, dZ) <= maxArea) alvosAtingidos.push({ nome: dObj.nome, defesa: dObj.valorDefesa, acertou: result.acertoTotal >= dObj.valorDefesa });
                    }
                });
            } else { alvosAtingidos.push({ nome: alvoDummie.nome, defesa: alvoDummie.valorDefesa, acertou: result.acertoTotal >= alvoDummie.valorDefesa }); }
        }
        enviarParaFeed({ tipo: 'acerto', nome: meuNome, ...result, alvosArea: alvosAtingidos, areaEf: maxArea }); 
    }, [mapQD, mapFD, mapBonus, mapUsarProf, profGlobal, mapStat, fichaSegura, mapVantagens, mapDesvantagens, alvoSelecionado, dummies, meuNome, cenario]);

    const tokenMap = useMemo(() => {
        const map = {};
        const nomes = Object.keys(jogadores);
        for (let i = 0; i < nomes.length; i++) {
            const nome = nomes[i]; const pos = jogadores[nome].posicao; const pCena = pos?.cenaId || 'default'; 
            if (pos && pos.x !== undefined && pCena === cenaRenderId) {
                const key = `${pos.x},${pos.y}`;
                if (!map[key]) map[key] = []; map[key].push({ nome, ficha: jogadores[nome] });
            }
        }
        return map;
    }, [jogadores, cenaRenderId]);

    const tokens3D = useMemo(() => {
        return Object.entries(jogadores).filter(([nome, ficha]) => (ficha.posicao?.cenaId || 'default') === cenaRenderId)
            .map(([nome, ficha]) => ({ nome, x: ficha.posicao?.x || 0, y: ficha.posicao?.y || 0, z: ficha.posicao?.z || 0, cor: corDoJogador(nome) }));
    }, [jogadores, cenaRenderId, corDoJogador]);

    const jogadorDaVez = ordemIniciativa.length > 0 ? ordemIniciativa[turnoAtualIndex % ordemIniciativa.length] : null;
    const infoDaVez = jogadorDaVez ? getAvatarInfo(jogadorDaVez.ficha) : null;

    const value = useMemo(() => ({
        minhaFicha, meuNome, personagens, feedCombate, isMestre, dummies, alvoSelecionado, cenario,
        fichaSegura, modo3D, setModo3D, tamanhoCelula, setTamanhoCelula,
        iniciativaInput, setIniciativaInput, altitudeInput, setAltitudeInput,
        turnoAtualIndex, setTurnoAtualIndex, feedIndexTurnoAtual, setFeedIndexTurnoAtual,
        jogadorHistory, setJogadorHistory, mapQD, setMapQD, mapFD, setMapFD,
        mapBonus, setMapBonus, mapStat, setMapStat, mapUsarProf, setMapUsarProf,
        profGlobal, mapVantagens, setMapVantagens, mapDesvantagens, setMapDesvantagens,
        novaCenaNome, setNovaCenaNome, novaCenaEscala, setNovaCenaEscala,
        novaCenaUnidade, setNovaCenaUnidade, uploadingMap, setUploadingMap,
        dadoAnim, setDadoAnim, cenaVisualizadaId, setCenaVisualizadaId,
        cenaAtivaIdGlobal, cenaRenderId, cenaAtual, isModoRP, mestreVendoRP, setMestreVendoRP,
        tavernaAtivos, isPresenteNaTaverna, overridesCompendio,
        toggleModoRP, togglePresencaTaverna, changeVantagem, changeDesvantagem,
        handleUploadNovaCena, ativarCena, deletarCena, corDoJogador, getAvatarInfo,
        cells, jogadores, playersNaTaverna, ordemIniciativa, handleCellClick,
        alterarZoom, setMinhaIniciativa, avancarTurno, sairDoCombate, encerrarCombate,
        rolarAcertoRapido, tokenMap, tokens3D, jogadorDaVez, infoDaVez, fmt, deletarZona,
        meuStream, conexoes, mutado, surdo, voiceStatus, toggleMute, toggleDeafen, fazerChamada, desconectarVoz,
        mics, selectedMic, trocarMicrofone
    }), [
        minhaFicha, meuNome, personagens, feedCombate, isMestre, dummies, alvoSelecionado, cenario,
        fichaSegura, modo3D, tamanhoCelula, iniciativaInput, altitudeInput,
        turnoAtualIndex, feedIndexTurnoAtual, jogadorHistory, mapQD, mapFD,
        mapBonus, mapStat, mapUsarProf, profGlobal, mapVantagens, mapDesvantagens,
        novaCenaNome, novaCenaEscala, novaCenaUnidade, uploadingMap, dadoAnim,
        cenaVisualizadaId, cenaAtivaIdGlobal, cenaRenderId, cenaAtual, isModoRP,
        mestreVendoRP, tavernaAtivos, isPresenteNaTaverna, overridesCompendio,
        cells, jogadores, playersNaTaverna, ordemIniciativa, tokenMap, tokens3D,
        jogadorDaVez, infoDaVez, fmt, toggleModoRP, togglePresencaTaverna, changeVantagem,
        changeDesvantagem, handleUploadNovaCena, ativarCena, deletarCena, corDoJogador,
        getAvatarInfo, handleCellClick, alterarZoom, setMinhaIniciativa, avancarTurno,
        sairDoCombate, encerrarCombate, rolarAcertoRapido, deletarZona,
        meuStream, conexoes, mutado, surdo, voiceStatus, toggleMute, toggleDeafen, fazerChamada, desconectarVoz,
        mics, selectedMic, trocarMicrofone
    ]);

    return (
        <MapaFormContext.Provider value={value}>
            {children}
        </MapaFormContext.Provider>
    );
}