import React, { createContext, useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie, uploadImagem, salvarCenarioCompleto, zerarIniciativaGlobal } from '../../services/firebase-sync';
import { calcularAcerto } from '../../core/engine';
import { resolverEfeitosEntidade } from '../../core/efeitos-resolver';

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

    const toggleModoRP = useCallback(() => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        novoCenario.modoRP = !novoCenario.modoRP;
        if (!novoCenario.modoRP) novoCenario.tavernaAtivos = [];
        salvarCenarioCompleto(novoCenario);
        enviarParaFeed({ 
            tipo: 'sistema', 
            nome: 'SISTEMA', 
            texto: novoCenario.modoRP 
                ? '🍻 A Party entrou na Sala de Espera! O Mestre está a moldar a realidade...' 
                : '🌍 O VÉU FOI LEVANTADO! A REALIDADE É REVELADA!' 
        });
    }, [cenario]);

    const togglePresencaTaverna = useCallback(() => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        if (!Array.isArray(novoCenario.tavernaAtivos)) novoCenario.tavernaAtivos = [];
        if (isPresenteNaTaverna) {
            novoCenario.tavernaAtivos = novoCenario.tavernaAtivos.filter(n => n !== meuNome);
        } else {
            novoCenario.tavernaAtivos.push(meuNome);
        }
        salvarCenarioCompleto(novoCenario);
    }, [cenario, isPresenteNaTaverna, meuNome]);

    const overridesCompendio = useMemo(() => {
        if (!minhaFicha) return {};
        if (isMestre && minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for(let k of chaves) {
                if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides;
            }
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

    useEffect(() => {
        setMapVantagens(fichaSegura.ataqueConfig?.vantagens || 0);
        setMapDesvantagens(fichaSegura.ataqueConfig?.desvantagens || 0);
    }, [fichaSegura.ataqueConfig?.vantagens, fichaSegura.ataqueConfig?.desvantagens]);

    useEffect(() => {
        setAltitudeInput(fichaSegura.posicao?.z || 0);
    }, [fichaSegura.posicao?.z]);

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
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar a imagem para o Mapa. Verifique o Firebase Storage.');
        } finally {
            setUploadingMap(false);
        }
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
        if (!coresJogadoresRef.current[nome]) {
            coresJogadoresRef.current[nome] = PALETA[corIndexRef.current % PALETA.length];
            corIndexRef.current++;
        }
        return coresJogadoresRef.current[nome];
    }, []);

    const getAvatarInfo = useCallback((ficha) => {
        if (!ficha) return { img: '', forma: null };
        const result = { img: ficha.avatar ? ficha.avatar.base : '', forma: null };
        if (ficha.poderes) {
            for (let j = 0; j < ficha.poderes.length; j++) {
                const p = ficha.poderes[j];
                if (p.ativa && p.imagemUrl && p.imagemUrl.trim() !== '') {
                    result.img = p.imagemUrl;
                    result.forma = p.nome;
                }
            }
        }
        return result;
    }, []);

    const fmt = useCallback((n) => Number(n || 0).toLocaleString('pt-BR'), []);

    const cells = useMemo(() => {
        const arr = [];
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) { arr.push({ x, y }); }
        }
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

    const handleCellClick = useCallback((x, y) => {
        if (isMestre && alvoSelecionado && dummies[alvoSelecionado]) {
            const d = dummies[alvoSelecionado];
            salvarDummie(alvoSelecionado, { ...d, posicao: { x, y }, cenaId: cenaRenderId });
        } else {
            const z = parseInt(altitudeInput) || 0;
            updateFicha((ficha) => {
                if (!ficha.posicao) ficha.posicao = {};
                ficha.posicao.x = x;
                ficha.posicao.y = y;
                ficha.posicao.z = z;
                ficha.posicao.cenaId = cenaRenderId; 
            });
            salvarFichaSilencioso();
        }
    }, [isMestre, alvoSelecionado, dummies, cenaRenderId, altitudeInput, updateFicha]);

    const alterarZoom = useCallback((direcao) => {
        setTamanhoCelula(prev => {
            let novo = prev + (direcao > 0 ? 5 : -5);
            if (novo < 15) novo = 15;
            if (novo > 80) novo = 80;
            return novo;
        });
    }, []);

    const setMinhaIniciativa = useCallback(() => {
        const val = parseInt(iniciativaInput) || 0;
        updateFicha((ficha) => {
            ficha.iniciativa = val;
            if (!ficha.posicao) ficha.posicao = {};
            ficha.posicao.cenaId = cenaRenderId; 
        });
        salvarFichaSilencioso();
        setFeedIndexTurnoAtual(feedCombate.length); 
    }, [iniciativaInput, cenaRenderId, updateFicha, feedCombate.length]);

    const avancarTurno = useCallback(() => {
        if (ordemIniciativa.length === 0) return;
        setTurnoAtualIndex(prev => {
            let next = prev + 1;
            if (next >= ordemIniciativa.length) next = 0;
            return next;
        });
        setFeedIndexTurnoAtual(feedCombate.length);
        setJogadorHistory(null);
    }, [ordemIniciativa.length, feedCombate.length]);

    const sairDoCombate = useCallback(() => {
        updateFicha(ficha => { ficha.iniciativa = 0; });
        setIniciativaInput(0);
        salvarFichaSilencioso();
        setJogadorHistory(null);
    }, [updateFicha]);

    const encerrarCombate = useCallback(() => {
        if (!window.confirm(`Tem a certeza que deseja ZERAR A INICIATIVA DE TODOS OS JOGADORES presentes na cena "${cenaAtual.nome}"?`)) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `⚔️ O COMBATE EM ${cenaAtual.nome.toUpperCase()} FOI ENCERRADO PELO MESTRE! ⚔️` });
        const nomesNaCena = ordemIniciativa.map(j => j.nome);
        zerarIniciativaGlobal(nomesNaCena);
        updateFicha(ficha => { ficha.iniciativa = 0; });
        setIniciativaInput(0);
        salvarFichaSilencioso();
        setJogadorHistory(null);
        setTurnoAtualIndex(0);
    }, [cenaAtual.nome, ordemIniciativa, updateFicha]);

    // 🔥 MOTOR DE ACERTO RÁPIDO DO MAPA ATUALIZADO (Área de Efeito e Múltiplos Alvos)
    const rolarAcertoRapido = useCallback(() => {
        const qD = parseInt(mapQD) || 1;
        const fD = parseInt(mapFD) || 20;
        const bonus = parseInt(mapBonus) || 0;
        const prof = mapUsarProf ? profGlobal : 0;
        const sels = [mapStat]; 
        const itensEq = fichaSegura?.inventario ? fichaSegura.inventario.filter(i => i.equipado) : [];

        const result = calcularAcerto({ 
            qD, fD, prof, bonus, sels, minhaFicha: fichaSegura, itensEquipados: itensEq, 
            vantagens: mapVantagens, desvantagens: mapDesvantagens 
        });

        let alvosAtingidos = [];
        let maxArea = 0;
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
                        const dX = Math.abs(dObj.posicao.x - alvoDummie.posicao.x);
                        const dY = Math.abs(dObj.posicao.y - alvoDummie.posicao.y);
                        const dZ = Math.floor(Math.abs((dObj.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);
                        
                        if (Math.max(dX, dY, dZ) <= maxArea) {
                            alvosAtingidos.push({ nome: dObj.nome, defesa: dObj.valorDefesa, acertou: result.acertoTotal >= dObj.valorDefesa });
                        }
                    }
                });
            } else {
                alvosAtingidos.push({ nome: alvoDummie.nome, defesa: alvoDummie.valorDefesa, acertou: result.acertoTotal >= alvoDummie.valorDefesa });
            }
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, alvosArea: alvosAtingidos, areaEf: maxArea };
        enviarParaFeed(feedData); 
    }, [mapQD, mapFD, mapBonus, mapUsarProf, profGlobal, mapStat, fichaSegura, mapVantagens, mapDesvantagens, alvoSelecionado, dummies, meuNome, cenario]);

    const tokenMap = useMemo(() => {
        const map = {};
        const nomes = Object.keys(jogadores);
        for (let i = 0; i < nomes.length; i++) {
            const nome = nomes[i];
            const pos = jogadores[nome].posicao;
            const pCena = pos?.cenaId || 'default'; 
            if (pos && pos.x !== undefined && pCena === cenaRenderId) {
                const key = `${pos.x},${pos.y}`;
                if (!map[key]) map[key] = [];
                map[key].push({ nome, ficha: jogadores[nome] });
            }
        }
        return map;
    }, [jogadores, cenaRenderId]);

    const tokens3D = useMemo(() => {
        return Object.entries(jogadores)
            .filter(([nome, ficha]) => (ficha.posicao?.cenaId || 'default') === cenaRenderId)
            .map(([nome, ficha]) => ({
                nome, x: ficha.posicao?.x || 0, y: ficha.posicao?.y || 0, z: ficha.posicao?.z || 0, cor: corDoJogador(nome)
            }));
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
        rolarAcertoRapido, tokenMap, tokens3D, jogadorDaVez, infoDaVez, fmt
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
        sairDoCombate, encerrarCombate, rolarAcertoRapido
    ]);

    return (
        <MapaFormContext.Provider value={value}>
            {children}
        </MapaFormContext.Provider>
    );
}