import React, { useState, useMemo, useRef, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie, uploadImagem, salvarCenarioCompleto, zerarIniciativaGlobal } from '../../services/firebase-sync';
import { calcularAcerto } from '../../core/engine';
import { getClassIconById } from '../../core/classIcons';
import { resolverEfeitosEntidade } from '../../core/efeitos-resolver';

import Tabuleiro3D from './Tabuleiro3D';
import DummieToken from '../combat/DummieToken';

const MAP_SIZE = 30;
const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

function urlSeguraParaCss(url) {
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

export default function MapaPanel() {
    const { minhaFicha, meuNome, personagens, updateFicha, feedCombate = [], isMestre, dummies, alvoSelecionado, cenario } = useStore(); 

    // 🔥 BLINDAGEM MÁXIMA AQUI: Garantir que se a ficha for null, usamos um objeto vazio para o ecrã não explodir 🔥
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

    // O CÉREBRO DA VISÃO DUPLA (GLOBAL vs MESTRE)
    const [cenaVisualizadaId, setCenaVisualizadaId] = useState(null);
    const cenaAtivaIdGlobal = cenario?.ativa || 'default';
    
    const cenaRenderId = (isMestre && cenaVisualizadaId) ? cenaVisualizadaId : cenaAtivaIdGlobal;
    const cenaAtual = cenario?.lista?.[cenaRenderId] || { nome: 'Desconhecido', img: '', escala: 1.5, unidade: 'm' };

    // 🔥 MODO TAVERNA / ROLEPLAY (SISTEMA DE LOBBY CROSS-TIMELINE) 🔥
    const isModoRP = cenario?.modoRP === true;
    const [mestreVendoRP, setMestreVendoRP] = useState(false);
    
    const tavernaAtivos = Array.isArray(cenario?.tavernaAtivos) ? cenario.tavernaAtivos : [];
    const isPresenteNaTaverna = tavernaAtivos.includes(meuNome);

    const toggleModoRP = () => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        novoCenario.modoRP = !novoCenario.modoRP;
        
        if (!novoCenario.modoRP) {
            novoCenario.tavernaAtivos = [];
        }
        
        salvarCenarioCompleto(novoCenario);
        enviarParaFeed({ 
            tipo: 'sistema', 
            nome: 'SISTEMA', 
            texto: novoCenario.modoRP 
                ? '🍻 A Party entrou na Sala de Espera! O Mestre está a moldar a realidade...' 
                : '🌍 O VÉU FOI LEVANTADO! A REALIDADE É REVELADA!' 
        });
    };

    const togglePresencaTaverna = () => {
        const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
        if (!Array.isArray(novoCenario.tavernaAtivos)) novoCenario.tavernaAtivos = [];
        
        if (isPresenteNaTaverna) {
            novoCenario.tavernaAtivos = novoCenario.tavernaAtivos.filter(n => n !== meuNome);
        } else {
            novoCenario.tavernaAtivos.push(meuNome);
        }
        salvarCenarioCompleto(novoCenario);
    };

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
                            
                            setTimeout(() => {
                                setDadoAnim({ ativo: false, numero: 20, finalResult: null, cor: '#00ffcc', quemRolou: '' });
                            }, 2000);
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

    function changeVantagem(e) {
        const val = parseInt(e.target.value) || 0;
        setMapVantagens(val);
        updateFicha(f => {
            if(!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.vantagens = val;
        });
        salvarFichaSilencioso();
    }

    function changeDesvantagem(e) {
        const val = parseInt(e.target.value) || 0;
        setMapDesvantagens(val);
        updateFicha(f => {
            if(!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.desvantagens = val;
        });
        salvarFichaSilencioso();
    }

    const handleUploadNovaCena = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!novaCenaNome.trim()) {
            alert('Por favor, dê um nome à cena antes de anexar o mapa!');
            return;
        }

        setUploadingMap(true);
        try {
            const urlPermanente = await uploadImagem(file, `mapas/${Date.now()}`);
            const novaCenaId = 'cena_' + Date.now();
            
            const novoCenario = JSON.parse(JSON.stringify(cenario));
            if (!novoCenario.lista) novoCenario.lista = {};
            
            novoCenario.lista[novaCenaId] = {
                nome: novaCenaNome,
                img: urlPermanente,
                escala: parseFloat(novaCenaEscala) || 1.5,
                unidade: novaCenaUnidade
            };
            
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
    };

    const ativarCena = (id) => {
        const novoCenario = JSON.parse(JSON.stringify(cenario));
        novoCenario.ativa = id;
        salvarCenarioCompleto(novoCenario);
        setCenaVisualizadaId(null); 
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `🗺️ O cenário mudou para: ${novoCenario.lista[id].nome}!` });
    };

    const deletarCena = (id) => {
        if(id === 'default') return alert("A cena inicial não pode ser apagada.");
        if(!window.confirm("Tem certeza que deseja apagar esta cena?")) return;
        
        const novoCenario = JSON.parse(JSON.stringify(cenario));
        delete novoCenario.lista[id];
        if(novoCenario.ativa === id) novoCenario.ativa = 'default';
        salvarCenarioCompleto(novoCenario);
        if(cenaVisualizadaId === id) setCenaVisualizadaId(null);
    };

    const coresJogadoresRef = useRef({});
    const corIndexRef = useRef(0);
    function corDoJogador(nome) {
        if (!coresJogadoresRef.current[nome]) {
            coresJogadoresRef.current[nome] = PALETA[corIndexRef.current % PALETA.length];
            corIndexRef.current++;
        }
        return coresJogadoresRef.current[nome];
    }

    function getAvatarInfo(ficha) {
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
    }

    const cells = useMemo(() => {
        const arr = [];
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                arr.push({ x, y });
            }
        }
        return arr;
    }, []);

    const jogadores = useMemo(() => {
        const result = {};
        if (meuNome && minhaFicha?.posicao && minhaFicha.posicao.x !== undefined) {
            result[meuNome] = minhaFicha;
        }
        if (personagens) {
            const nomes = Object.keys(personagens);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === meuNome) continue;
                const ficha = personagens[nome];
                if (ficha && ficha.posicao && ficha.posicao.x !== undefined) {
                    result[nome] = ficha;
                }
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

    function handleCellClick(x, y) {
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
    }

    function alterarZoom(direcao) {
        setTamanhoCelula(prev => {
            let novo = prev + (direcao > 0 ? 5 : -5);
            if (novo < 15) novo = 15;
            if (novo > 80) novo = 80;
            return novo;
        });
    }

    function setMinhaIniciativa() {
        const val = parseInt(iniciativaInput) || 0;
        updateFicha((ficha) => {
            ficha.iniciativa = val;
            if (!ficha.posicao) ficha.posicao = {};
            ficha.posicao.cenaId = cenaRenderId; 
        });
        salvarFichaSilencioso();
        setFeedIndexTurnoAtual(feedCombate.length); 
    }

    function avancarTurno() {
        if (ordemIniciativa.length === 0) return;
        setTurnoAtualIndex(prev => {
            let next = prev + 1;
            if (next >= ordemIniciativa.length) next = 0;
            return next;
        });
        setFeedIndexTurnoAtual(feedCombate.length);
        setJogadorHistory(null);
    }

    function sairDoCombate() {
        updateFicha(ficha => { ficha.iniciativa = 0; });
        setIniciativaInput(0);
        salvarFichaSilencioso();
        setJogadorHistory(null);
    }

    function encerrarCombate() {
        if (!window.confirm(`Tem a certeza que deseja ZERAR A INICIATIVA DE TODOS OS JOGADORES presentes na cena "${cenaAtual.nome}"?`)) return;
        
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: `⚔️ O COMBATE EM ${cenaAtual.nome.toUpperCase()} FOI ENCERRADO PELO MESTRE! ⚔️` });
        
        const nomesNaCena = ordemIniciativa.map(j => j.nome);
        zerarIniciativaGlobal(nomesNaCena);

        updateFicha(ficha => { ficha.iniciativa = 0; });
        setIniciativaInput(0);
        salvarFichaSilencioso();

        setJogadorHistory(null);
        setTurnoAtualIndex(0);
    }

    function rolarAcertoRapido() {
        const qD = parseInt(mapQD) || 1;
        const fD = parseInt(mapFD) || 20;
        const bonus = parseInt(mapBonus) || 0;
        
        const prof = mapUsarProf ? profGlobal : 0;
        
        const sels = [mapStat]; 
        const itensEquipados = minhaFicha?.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];

        const result = calcularAcerto({ 
            qD, fD, prof, bonus, sels, minhaFicha, itensEquipados, 
            vantagens: mapVantagens, desvantagens: mapDesvantagens 
        });
        
        let extraFeed = {};
        if (alvoSelecionado && dummies[alvoSelecionado]) {
            const alvo = dummies[alvoSelecionado];
            const acertou = result.acertoTotal >= alvo.valorDefesa;
            extraFeed = { alvoNome: alvo.nome, alvoDefesa: alvo.valorDefesa, acertouAlvo: acertou };
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, ...extraFeed };
        enviarParaFeed(feedData); 
    }

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
                nome,
                x: ficha.posicao?.x || 0,
                y: ficha.posicao?.y || 0,
                z: ficha.posicao?.z || 0,
                cor: corDoJogador(nome)
            }));
    }, [jogadores, cenaRenderId]);

    const jogadorDaVez = ordemIniciativa.length > 0 ? ordemIniciativa[turnoAtualIndex % ordemIniciativa.length] : null;
    const infoDaVez = jogadorDaVez ? getAvatarInfo(jogadorDaVez.ficha) : null;
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    function renderHologramaAcao() {
        if (dadoAnim.ativo) {
            return (
                <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 10, 15, 0.95)', border: `2px solid ${dadoAnim.cor}`, boxShadow: `0 0 30px ${dadoAnim.cor}50` }}>
                    <h2 style={{ color: dadoAnim.cor, textShadow: `0 0 10px ${dadoAnim.cor}`, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }}>
                        {dadoAnim.quemRolou}<br/>está a jogar os dados...
                    </h2>
                </div>
            );
        }

        const emCombate = ordemIniciativa.length > 0;
        const acaoNovaNoTurno = feedCombate.length > feedIndexTurnoAtual ? feedCombate[feedCombate.length - 1] : null;
        const acaoGeralForaDeCombate = feedCombate.length > 0 ? feedCombate[feedCombate.length - 1] : null;
        const acaoExibir = emCombate ? acaoNovaNoTurno : acaoGeralForaDeCombate;

        if (!emCombate && !acaoExibir) {
            return (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontStyle: 'italic', border: '2px dashed #333', borderRadius: 8 }}>
                    O campo de batalha aguarda o primeiro movimento...
                </div>
            );
        }

        let nomeBase = jogadorDaVez ? jogadorDaVez.nome : (acaoExibir ? acaoExibir.nome : '');
        let fichaBase = jogadorDaVez ? jogadorDaVez.ficha : (acaoExibir ? jogadores[acaoExibir.nome] : null);
        let infoBase = getAvatarInfo(fichaBase);

        // 🔥 A MÁGICA DA COROA DO GRAND/CANDIDATO NO HOLOGRAMA 🔥
        let classId = fichaBase?.bio?.classe;
        if ((classId === 'pretender' || classId === 'alterego') && fichaBase?.bio?.subClasse) {
            classId = fichaBase?.bio?.subClasse;
        }

        let mesaBase = fichaBase?.bio?.mesa || 'presente';
        const isGrand = classId && overridesCompendio?.grands?.[`${classId}_${mesaBase}`] === nomeBase;
        const listaCands = overridesCompendio?.grands?.[`${classId}_${mesaBase}_candidatos`] || [];
        const isCandidato = classId && !isGrand && listaCands.includes(nomeBase);
        const grandIconUrl = overridesCompendio?.grands?.[`${classId}_${mesaBase}_icone`];
        
        const customClassIcon = classId ? overridesCompendio[classId]?.iconeUrl : null;
        const defaultClassSymbol = getClassIconById(classId);

        let isCritNormal = false, isCritFatal = false, isFalha = false;

        if (acaoExibir && acaoExibir.rolagem && (acaoExibir.tipo === 'acerto' || acaoExibir.tipo === 'dano')) {
            let maxDado = 0;
            let regexStrong = /<strong>(\d+)<\/strong>/g;
            let match;
            while ((match = regexStrong.exec(acaoExibir.rolagem)) !== null) {
                let v = parseInt(match[1]);
                if (v > maxDado) maxDado = v;
            }

            if (maxDado === 0) {
                let regexArr = /\[(.*?)\]/;
                let mArr = regexArr.exec(acaoExibir.rolagem);
                if (mArr) {
                    let clean = mArr[1].replace(/<[^>]*>?/gm, ''); 
                    let nums = clean.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                    if (nums.length > 0) maxDado = Math.max(...nums);
                }
            }

            const acCfg = fichaBase?.ataqueConfig || minhaFicha?.ataqueConfig || {};
            const cNMin = acCfg.criticoNormalMin || 16;
            const cNMax = acCfg.criticoNormalMax || 18;
            const cFMin = acCfg.criticoFatalMin || 19;
            const cFMax = acCfg.criticoFatalMax || 20;

            if (maxDado >= cFMin && maxDado <= cFMax) {
                isCritFatal = true;
            } else if (maxDado >= cNMin && maxDado <= cNMax) {
                isCritNormal = true;
            } else if (maxDado === 1) {
                isFalha = true;
            }

            if (acaoExibir.tipo === 'dano') {
                if (acaoExibir.armaStr?.includes('FATAL')) { isCritFatal = true; isCritNormal = false; }
                else if (acaoExibir.armaStr?.includes('CRÍTICO')) { isCritNormal = true; isCritFatal = false; }
            }
        }

        const isForaDeCombate = acaoExibir && emCombate && (!ordemIniciativa.find(j => j.nome === acaoExibir.nome));
        const isForaDeTurno = acaoExibir && emCombate && !isForaDeCombate && acaoExibir.nome !== nomeBase;

        let corImpacto = '#333';
        let corHeader = '#00ffcc';
        let corTextoHeader = '#000';
        let tituloImpacto = 'AÇÃO';
        let valorImpacto = 0;

        if (acaoExibir) {
            switch (acaoExibir.tipo) {
                case 'dano': corImpacto = '#ff003c'; tituloImpacto = 'DANO'; valorImpacto = acaoExibir.dano; break;
                case 'acerto': corImpacto = '#f90'; tituloImpacto = 'ACERTO'; valorImpacto = acaoExibir.acertoTotal; break;
                case 'evasiva': corImpacto = '#0088ff'; tituloImpacto = 'ESQUIVA'; valorImpacto = acaoExibir.total; break;
                case 'resistencia': corImpacto = '#ccc'; tituloImpacto = 'BLOQUEIO'; valorImpacto = acaoExibir.total; break;
                case 'escudo': corImpacto = '#f0f'; tituloImpacto = 'ESCUDO'; valorImpacto = acaoExibir.escudoReduzido; break;
                case 'sistema': corImpacto = '#ffcc00'; tituloImpacto = 'AVISO DO SISTEMA'; valorImpacto = 0; break;
                default: break;
            }
        }

        if (isCritFatal) {
            corImpacto = '#ff003c'; corHeader = '#ff003c'; corTextoHeader = '#fff'; tituloImpacto = '🔥 CRÍTICO FATAL 🔥';
        } else if (isCritNormal) {
            corImpacto = '#ffcc00'; corHeader = '#ffcc00'; corTextoHeader = '#000'; tituloImpacto = '⚡ CRÍTICO NORMAL ⚡';
        } else if (isFalha) {
            corImpacto = '#660000'; corHeader = '#660000'; corTextoHeader = '#ff003c'; tituloImpacto = '☠️ FALHA CRÍTICA ☠️';
        } else if (acaoExibir) {
            corHeader = corImpacto; corTextoHeader = '#000';
            if (acaoExibir.tipo === 'sistema') tituloImpacto = 'AVISO DO SISTEMA';
            else if (jogadorDaVez && !isForaDeTurno && !isForaDeCombate) tituloImpacto = `TURNO DE ${nomeBase}`;
            else tituloImpacto = 'AÇÃO LIVRE';
        } else {
            tituloImpacto = `⚡ TURNO DE ${nomeBase} ⚡`;
        }

        return (
            <div className="def-box" style={{ 
                height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', 
                border: isGrand ? `3px solid #ffcc00` : (isCandidato ? `2px solid #00ccff` : `2px solid ${corImpacto}`), 
                boxShadow: isGrand ? `0 0 30px rgba(255,0,60,0.6), inset 0 0 20px rgba(255,204,0,0.3)` : (isCandidato ? `0 0 20px rgba(0,204,255,0.4)` : `0 0 20px ${corImpacto}40`) 
            }}>
                
                <div style={{ background: corHeader, color: corTextoHeader, padding: '10px', textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: '1.2em', textTransform: 'uppercase' }}>
                    {tituloImpacto}
                </div>

                {acaoExibir?.tipo === 'sistema' ? (
                     <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center', background: 'rgba(0,0,0,0.8)' }}>
                        <h2 style={{ color: '#ffcc00', textShadow: '0 0 20px #ffcc00' }}>{acaoExibir.texto}</h2>
                     </div>
                ) : (
                    <>
                        <div style={{ 
                            flex: '1', minHeight: '250px', 
                            backgroundImage: urlSeguraParaCss(infoBase.img) || 'none',
                            backgroundSize: 'cover', backgroundPosition: 'top center',
                            position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            boxShadow: 'inset 0 -100px 50px -20px rgba(0,0,0,0.9)' 
                        }}>
                            {/* 🔥 O GRADIENTE ÉPICO DOS GRANDS E CANDIDATOS 🔥 */}
                            <div style={{ 
                                padding: '20px', zIndex: 2, 
                                background: isGrand ? 'linear-gradient(to top, rgba(255,0,60,0.9), transparent)' : (isCandidato ? 'linear-gradient(to top, rgba(0,136,255,0.8), transparent)' : 'none') 
                            }}>
                                
                                {isGrand && <div style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #ff003c', letterSpacing: 2, marginBottom: '5px' }}>👑 GRAND {classId?.toUpperCase()}</div>}
                                {isCandidato && <div style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #0088ff', letterSpacing: 2, marginBottom: '5px' }}>🌟 CANDIDATO A {classId?.toUpperCase()}</div>}

                                <h2 style={{ margin: 0, color: '#fff', fontSize: '2em', textShadow: isGrand ? '0 0 15px #ffcc00, 2px 2px 0px #000' : '0 0 10px #000, 2px 2px 0px #000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    
                                    {isGrand && grandIconUrl ? (
                                        <img src={grandIconUrl} alt="Grand" style={{ height: '1.5em', width: '1.5em', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ffcc00', boxShadow: '0 0 10px #ff003c' }} />
                                    ) : customClassIcon ? (
                                        <img src={customClassIcon} alt={classId} style={{ height: '1.2em', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }} />
                                    ) : defaultClassSymbol ? (
                                        <span style={{ fontSize: '0.9em', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }}>{defaultClassSymbol}</span>
                                    ) : null}
                                    
                                    {nomeBase}
                                </h2>
                                
                                {infoBase.forma && (
                                    <div style={{ color: '#00ffcc', fontSize: '1.2em', fontWeight: 'bold', textShadow: '0 0 5px #000' }}>
                                        ☄️ {infoBase.forma}
                                    </div>
                                )}
                            </div>
                        </div>

                        {acaoExibir && (
                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.85)', textAlign: 'center', borderTop: `1px solid ${corImpacto}` }}>
                                
                                {isForaDeCombate && (
                                    <div style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid #ffcc00', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>
                                        ⚠️ Rolagem Fora de Combate (Feita por: {acaoExibir.nome})
                                    </div>
                                )}
                                {isForaDeTurno && (
                                    <div style={{ background: 'rgba(255,0,60,0.1)', color: '#ff003c', border: '1px solid #ff003c', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>
                                        ❌ Ação Fora de Turno (Feita por: {acaoExibir.nome})
                                    </div>
                                )}

                                <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '-10px', textTransform: 'uppercase' }}>
                                    {tituloImpacto} {(!isForaDeCombate && !isForaDeTurno) ? '' : `(${acaoExibir.nome})`}
                                </div>
                                <h1 style={{ margin: 0, fontSize: '4em', color: corImpacto, textShadow: `0 0 20px ${corImpacto}` }}>
                                    {fmt(valorImpacto)}
                                </h1>
                                
                                {/* SUBTITUIR O BLOCO DE RENDERIZAÇÃO DO RESULTADO DO ATAQUE POR ESTE: */}
                                {acaoExibir.tipo === 'dano' && acaoExibir.letalidade !== undefined && (
                                    <div style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px', textShadow: '0 0 5px #ffcc00' }}>
                                    LETALIDADE: +{acaoExibir.letalidade}
                                    </div>
                                )}

                                {acaoExibir.alvosArea && acaoExibir.alvosArea.length > 0 && (
                                    <div style={{ marginTop: 15, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, borderLeft: `3px solid ${acaoExibir.alvosArea.some(a=>a.acertou) ? '#0f0' : '#f00'}`, textAlign: 'left' }}>
                                    {acaoExibir.areaEf > 0 && <div style={{ color: '#00ccff', fontSize: '0.85em', marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase' }}>💥 Explosão em Área ({acaoExibir.areaEf} Quadrados) atingiu {acaoExibir.alvosArea.length} alvo(s):</div>}
                                    {acaoExibir.alvosArea.map((a, i) => (
                                    <div key={i} style={{ color: a.acertou ? '#0f0' : '#f00', fontWeight: 'bold', fontSize: '0.9em', marginBottom: 2 }}>
                                    {a.acertou ? `🎯 Superou ${a.nome} (Def: ${a.defesa})!` : `❌ Falhou vs ${a.nome} (Def: ${a.defesa})!`}
                                    </div>
                                    ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {fichaBase && (
                            <div style={{ padding: '15px', background: '#050505' }}>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: 6,
                                    background: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4d', fontWeight: 'bold' }}>
                                        <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>HP</span><span>{fmt(fichaBase.vida?.atual)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4dffff', fontWeight: 'bold' }}>
                                        <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>MP</span><span>{fmt(fichaBase.mana?.atual)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffff4d', fontWeight: 'bold' }}>
                                        <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>AU</span><span>{fmt(fichaBase.aura?.atual)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold' }}>
                                        <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CK</span><span>{fmt(fichaBase.chakra?.atual)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff66ff', fontWeight: 'bold' }}>
                                        <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CP</span><span>{fmt(fichaBase.corpo?.atual)}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ color: '#0088ff', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #0088ff' }}>
                                            🛡️ EVA: {calcularCA(fichaBase, 'evasiva')}
                                        </div>
                                        <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #ccc' }}>
                                            🛡️ RES: {calcularCA(fichaBase, 'resistencia')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    const playerCount = playersNaTaverna.length;
    let cardSize = '280px'; 
    if (playerCount === 1) cardSize = '400px';
    else if (playerCount === 2) cardSize = '350px';
    else if (playerCount === 3 || playerCount === 4) cardSize = '280px';
    else cardSize = '220px';

    return (
        <div className="mapa-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes d20-spin {
                    0% { transform: rotate(0deg) scale(1); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                    25% { transform: rotate(90deg) scale(1.1); filter: brightness(1.2) drop-shadow(0 0 20px #00ffcc); }
                    50% { transform: rotate(180deg) scale(0.9); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                    75% { transform: rotate(270deg) scale(1.1); filter: brightness(1.2) drop-shadow(0 0 20px #00ffcc); }
                    100% { transform: rotate(360deg) scale(1); filter: brightness(1) drop-shadow(0 0 10px #00ffcc); }
                }
                @keyframes d20-land {
                    0% { transform: scale(1.5); filter: brightness(2) drop-shadow(0 0 40px var(--land-color)); }
                    100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 15px var(--land-color)); }
                }
                .d20-spinning { animation: d20-spin 0.2s infinite linear; }
                .d20-landed { animation: d20-land 0.4s ease-out forwards; }
            `}} />

            {dadoAnim.ativo && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(3px)', zIndex: 9999, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <div 
                        className={dadoAnim.finalResult ? 'd20-landed' : 'd20-spinning'}
                        style={{ '--land-color': dadoAnim.cor }}
                    >
                        <svg viewBox="0 0 100 100" style={{ width: '250px', height: '250px' }}>
                            <polygon points="50,5 95,30 95,75 50,95 5,75 5,30" fill="rgba(10,10,15,0.95)" stroke={dadoAnim.cor} strokeWidth="4" strokeLinejoin="round" />
                            <polygon points="50,85 20,35 80,35" fill="none" stroke={dadoAnim.cor} strokeWidth="3" strokeLinejoin="round" opacity="0.8" />
                            <line x1="50" y1="5" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="50" y1="5" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="95" y1="30" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="95" y1="75" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="95" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="50" y1="95" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="5" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="5" y1="75" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <line x1="5" y1="30" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                            <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="bold" fontFamily="sans-serif">
                                {dadoAnim.numero}
                            </text>
                        </svg>
                    </div>
                    {dadoAnim.finalResult && (
                        <div style={{ marginTop: '30px', color: dadoAnim.cor, fontSize: '2em', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', textShadow: `0 0 20px ${dadoAnim.cor}` }}>
                            {dadoAnim.cor === '#ff003c' ? 'CRÍTICO FATAL!' : dadoAnim.cor === '#ffcc00' ? 'CRÍTICO!' : dadoAnim.cor === '#660000' ? 'FALHA CRÍTICA' : 'ROLADO!'}
                        </div>
                    )}
                </div>
            )}

            <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                
               {isMestre && (
                    <div style={{ background: isModoRP ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 255, 136, 0.2)', border: `2px dashed ${isModoRP ? '#ff00ff' : '#00ff88'}`, padding: '10px 15px', borderRadius: '5px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <span style={{ color: isModoRP ? '#ff00ff' : '#00ff88', fontWeight: 'bold', fontSize: '1.1em' }}>
                            {isModoRP ? '🍻 MODO TAVERNA ATIVO: Os jogadores não vêem o mapa! (Apenas Sala de RP)' : '🌍 MODO COMBATE ATIVO: O Mapa está visível para todos os jogadores!'}
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {isModoRP && (
                                <button className={`btn-neon ${mestreVendoRP ? 'btn-blue' : 'btn-gold'}`} onClick={() => setMestreVendoRP(!mestreVendoRP)} style={{ padding: '5px 15px', margin: 0 }}>
                                    {mestreVendoRP ? '🗺️ VER MAPA OCULTO' : '👁️ ESPIAR SALA DE RP'}
                                </button>
                            )}
                            <button className={`btn-neon ${isModoRP ? 'btn-green' : 'btn-purple'}`} onClick={toggleModoRP} style={{ padding: '5px 15px', margin: 0 }}>
                                {isModoRP ? '🌍 REVELAR A REALIDADE (MOSTRAR MAPA)' : '🍻 ATIVAR TAVERNA (OCULTAR MAPA)'}
                            </button>
                        </div>
                    </div>
               )}

               {isMestre && cenaVisualizadaId && cenaVisualizadaId !== cenaAtivaIdGlobal && (
                    <div style={{ background: 'rgba(0, 136, 255, 0.2)', border: '2px dashed #0088ff', padding: '10px 15px', borderRadius: '5px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <span style={{ color: '#0088ff', fontWeight: 'bold', fontSize: '1.1em' }}>👁️ MODO EDIÇÃO OCULTA: Apenas você vê a cena "{cenaAtual.nome}".</span>
                        <button className="btn-neon btn-green" onClick={() => ativarCena(cenaRenderId)} style={{ padding: '5px 15px', margin: 0 }}>
                            🌍 PUBLICAR ESTA CENA PARA TODOS
                        </button>
                    </div>
               )}

               {isMestre && (!isModoRP || !mestreVendoRP) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 15, background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 5, border: '1px solid #ffcc00' }}>
                    <h3 style={{ color: '#ffcc00', margin: 0 }}>🎬 Gerenciador de Cenas</h3>
                    
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: '#0a0a0a', padding: 10, borderRadius: 5 }}>
                        {Object.entries(cenario?.lista || {}).map(([id, cena]) => {
                            const isAtivaGlobal = cenaAtivaIdGlobal === id;
                            const isVisualizada = cenaRenderId === id;

                            return (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: isAtivaGlobal ? 'rgba(0, 255, 136, 0.2)' : isVisualizada ? 'rgba(0, 136, 255, 0.2)' : '#222', border: `1px solid ${isAtivaGlobal ? '#00ff88' : isVisualizada ? '#0088ff' : '#555'}`, padding: '5px 10px', borderRadius: 4, flexWrap: 'wrap' }}>
                                    <span style={{ color: isAtivaGlobal ? '#00ff88' : isVisualizada ? '#0088ff' : '#fff', fontWeight: 'bold' }}>{cena.nome}</span>
                                    
                                    {isAtivaGlobal && <span style={{ fontSize: '0.6em', background: '#00ff88', color: '#000', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold', marginLeft: 4 }}>🌍 PUBLICA</span>}
                                    {isVisualizada && !isAtivaGlobal && <span style={{ fontSize: '0.6em', background: '#0088ff', color: '#fff', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold', marginLeft: 4 }}>👁️ VENDO</span>}

                                    {!isVisualizada && (
                                        <button className="btn-neon btn-blue btn-small" onClick={() => setCenaVisualizadaId(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: '0 0 0 5px' }}>
                                            Ver Cena Oculta
                                        </button>
                                    )}
                                    {!isAtivaGlobal && (
                                        <button className="btn-neon btn-green btn-small" onClick={() => ativarCena(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: '0 0 0 5px' }}>
                                            Publicar para Todos
                                        </button>
                                    )}
                                    <button className="btn-neon btn-red btn-small" onClick={() => deletarCena(id)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>
                                        X
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #444', paddingTop: 10 }}>
                        <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>Nova Cena:</span>
                        <input className="input-neon" type="text" placeholder="Nome (Ex: Taverna)" value={novaCenaNome} onChange={e => setNovaCenaNome(e.target.value)} style={{ width: 150, padding: 5 }}/>
                        
                        <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, opacity: uploadingMap ? 0.5 : 1 }}>
                            {uploadingMap ? 'Enviando...' : '📁 Anexar Fundo'}
                            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleUploadNovaCena} style={{ display: 'none' }} disabled={uploadingMap} />
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>Escala:</span>
                            <input className="input-neon" type="number" min="0.1" step="0.1" value={novaCenaEscala} onChange={e => setNovaCenaEscala(e.target.value)} style={{ width: 60, padding: 4, margin: 0 }} />
                            <select className="input-neon" value={novaCenaUnidade} onChange={e => setNovaCenaUnidade(e.target.value)} style={{ padding: 4, margin: 0 }}>
                                <option value="m">m</option>
                                <option value="km">km</option>
                                <option value="milhas">mi</option>
                                <option value="anos-luz">Ly</option>
                            </select>
                        </div>
                    </div>
                </div>
               )}

               {isMestre && (!isModoRP || !mestreVendoRP) && (
                <div style={{ marginBottom: 15, padding: 10, border: '1px solid #0088ff', borderRadius: 5, background: 'rgba(0, 136, 255, 0.1)' }}>
                <h4 style={{ color: '#0088ff', marginTop: 0, marginBottom: 10 }}>🤖 Gerador de Entidades (Nesta Cena)</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input-neon" type="text" placeholder="Nome" id="dummieNome" defaultValue="Boneco" style={{ width: 100, padding: 5 }}/>
            
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8em' }}>HP Base:</span>
                    <input className="input-neon" type="number" id="dummieHp" defaultValue="100" style={{ width: 60, padding: 4, margin: 0 }} />
                    <span style={{ color: '#0f0', fontSize: '0.8em', fontWeight: 'bold' }}>+Vit:</span>
                    <input className="input-neon" type="number" id="dummieVitalidade" defaultValue="0" min="0" max="15" style={{ width: 45, padding: 4, margin: 0, borderColor: '#0f0', color: '#0f0' }} title="Ex: Vit 3 = adiciona 3 zeros" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', padding: '3px 8px', borderRadius: 5, border: '1px solid #444' }}>
                    <select className="input-neon" id="dummieDefTipo" style={{ width: 90, padding: 4, margin: 0 }}>
                        <option value="evasiva">Evasiva</option>
                        <option value="resistencia">Resistência</option>
                    </select>
                    <span style={{ color: '#0088ff', fontSize: '0.8em', fontWeight: 'bold' }}>CA:</span>
                    <input className="input-neon" type="number" id="dummieDef" defaultValue="10" style={{ width: 50, padding: 4, margin: 0 }} title="Classe de Armadura (5 + Base)"/>
                    </div>
            
                    <select className="input-neon" id="dummieVisivel" style={{ width: 110, padding: 5 }} title="Visibilidade do HP">
                    <option value="todos">HP Visível</option>
                    <option value="mestre">HP Oculto</option>
                    </select>

                    <button className="btn-neon btn-blue" onClick={() => {
                        const n = document.getElementById('dummieNome').value || 'Entidade';
                        const hBase = parseInt(document.getElementById('dummieHp').value) || 100;
                        const vit = parseInt(document.getElementById('dummieVitalidade').value) || 0;
                        const h = hBase * Math.pow(10, vit);

                        const dt = document.getElementById('dummieDefTipo').value;
                        const dv = parseInt(document.getElementById('dummieDef').value) || 10;
                        const vHp = document.getElementById('dummieVisivel').value;
                        const id = 'dummie_' + Date.now();
                        salvarDummie(id, { nome: n, hpMax: h, hpAtual: h, tipoDefesa: dt, valorDefesa: dv, visibilidadeHp: vHp, cenaId: cenaRenderId, posicao: { x: 0, y: 0 } });
                    }} style={{ padding: '5px 15px', margin: 0 }}>
                    + Injetar na Cena
                    </button>
                    </div>
                    </div>
                )}

                {isModoRP && (!isMestre || mestreVendoRP) ? (
                    <div className="fade-in" style={{ 
                        minHeight: '60vh', 
                        background: 'radial-gradient(circle, rgba(30,10,20,0.9) 0%, rgba(0,0,0,1) 100%)', 
                        borderRadius: 5, border: '2px solid #ffcc00', boxShadow: '0 0 30px rgba(255, 204, 0, 0.2)', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        padding: 20, marginBottom: 15 
                    }}>
                        <div style={{ fontSize: '3em', marginBottom: 10, filter: 'drop-shadow(0 0 10px #ffcc00)' }}>🎲</div>
                        <h1 style={{ color: '#ffcc00', textShadow: '0 0 15px #ffcc00', margin: 0, letterSpacing: 3 }}>SESSÃO RP</h1>
                        <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: 20, fontSize: '1.1em' }}>
                            {playersNaTaverna.length} Lenda(s) Presente(s). O Mestre está a moldar o tecido da realidade...
                        </p>
                        
                        <button 
                            className={`btn-neon ${isPresenteNaTaverna ? 'btn-red' : 'btn-green'}`} 
                            onClick={togglePresencaTaverna} 
                            style={{ marginBottom: '30px', padding: '10px 20px', fontSize: '1.1em', fontWeight: 'bold' }}
                        >
                            {isPresenteNaTaverna ? '🚪 SAIR DA MESA (ESCONDER CÂMERA)' : '🚪 SENTAR NA MESA (LIGAR CÂMERA)'}
                        </button>
                        
                        {playersNaTaverna.length > 0 && (
                            <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
                                {playersNaTaverna.map(([n, f]) => {
                                    const info = getAvatarInfo(f);
                                    
                                    return (
                                        <div key={n} className="fade-in" style={{
                                            position: 'relative', width: cardSize, aspectRatio: '4/3', background: '#111',
                                            border: '2px solid #333', borderRadius: 6, overflow: 'hidden',
                                            backgroundImage: urlSeguraParaCss(info.img) || 'none',
                                            backgroundSize: 'cover', backgroundPosition: 'top center',
                                            boxShadow: '0 0 15px rgba(0,0,0,0.8)'
                                        }}>
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,15,0.9)', borderTop: '2px solid #222', padding: '6px 10px', backdropFilter: 'blur(3px)' }}>
                                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.8em', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1, textShadow: '1px 1px 2px #000', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                                    <span style={{ color: '#ff003c', fontSize: '0.6em', fontWeight: 'bold', width: '15px' }}>HP</span>
                                                    <div style={{ flex: 1, background: '#300', height: 6, border: '1px solid #000', position: 'relative' }}>
                                                        <div style={{ width: '100%', height: '100%', background: '#ff003c', boxShadow: '0 0 5px #ff003c' }}></div>
                                                    </div>
                                                    <span style={{ color: '#fff', fontSize: '0.6em', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' }}>{fmt(f?.vida?.atual)}</span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 6px', fontSize: '0.55em', fontWeight: 'bold' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0088ff', textShadow: '0 0 3px #0088ff' }}><span>MP</span> <span>{fmt(f?.mana?.atual)}</span></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa00ff', textShadow: '0 0 3px #aa00ff' }}><span>AU</span> <span>{fmt(f?.aura?.atual)}</span></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffaa', textShadow: '0 0 3px #00ffaa' }}><span>CK</span> <span>{fmt(f?.chakra?.atual)}</span></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff8800', textShadow: '0 0 3px #ff8800' }}><span>CP</span> <span>{fmt(f?.corpo?.atual)}</span></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', textShadow: '0 0 3px #fff' }}><span>PV</span> <span>{fmt(f?.pontosVitais?.atual)}</span></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff3333', textShadow: '0 0 3px #ff3333' }}><span>PM</span> <span>{fmt(f?.pontosMortais?.atual)}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255, 204, 0, 0.3)', padding: 25, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 15, width: '100%', maxWidth: '600px' }}>
                            <h3 style={{ color: '#00ffcc', margin: '0 0 5px 0', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>Rolagem Livre (Teste de Perícia)</h3>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                                <select className="input-neon" value={mapStat} onChange={e => setMapStat(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 120, fontSize: '1.1em' }} title="Atributo">
                                    <option value="forca">Força</option>
                                    <option value="destreza">Destreza</option>
                                    <option value="inteligencia">Inteligência</option>
                                    <option value="sabedoria">Sabedoria</option>
                                    <option value="energiaEsp">Energia Espiritual</option>
                                    <option value="carisma">Carisma</option>
                                    <option value="stamina">Stamina</option>
                                    <option value="constituicao">Constituição</option>
                                </select>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <input className="input-neon" type="number" value={mapQD} onChange={e => setMapQD(e.target.value)} style={{ width: 55, padding: 8, fontSize: '1.1em' }} title="Quantidade de Dados" />
                                    <span style={{ color: '#aaa', fontSize: '1.2em', fontWeight: 'bold' }}>D</span>
                                    <input className="input-neon" type="number" value={mapFD} onChange={e => setMapFD(e.target.value)} style={{ width: 65, padding: 8, fontSize: '1.1em' }} title="Faces do Dado" />
                                    <span style={{ color: '#aaa', fontSize: '1.2em', fontWeight: 'bold' }}>+</span>
                                    <input className="input-neon" type="number" value={mapBonus} onChange={e => setMapBonus(e.target.value)} style={{ width: 65, padding: 8, fontSize: '1.1em' }} title="Bônus" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ color: '#0f0', fontSize: '0.9em', fontWeight: 'bold' }}>VANTAGEM:</span>
                                    <input className="input-neon" type="number" min="0" value={mapVantagens} onChange={changeVantagem} style={{ width: 50, padding: 6, borderColor: '#0f0', color: '#0f0', fontSize: '1em' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ color: '#f00', fontSize: '0.9em', fontWeight: 'bold' }}>DESVANTAGEM:</span>
                                    <input className="input-neon" type="number" min="0" value={mapDesvantagens} onChange={changeDesvantagem} style={{ width: 50, padding: 6, borderColor: '#f00', color: '#f00', fontSize: '1em' }} />
                                </div>
                                <label style={{ color: '#00ffcc', fontSize: '1em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 10 }}>
                                    <input type="checkbox" checked={mapUsarProf} onChange={e => setMapUsarProf(e.target.checked)} style={{ transform: 'scale(1.3)' }} />
                                    Somar Proficiência
                                </label>
                            </div>

                            {/* 🔥 RADAR TÁTICO NA TAVERNA 🔥 */}
                            {alvoSelecionado && dummies?.[alvoSelecionado] ? (() => {
                                const alvoD = dummies[alvoSelecionado];
                                const dx = Math.abs((fichaSegura?.posicao?.x || 0) - (alvoD.posicao?.x || 0));
                                const dy = Math.abs((fichaSegura?.posicao?.y || 0) - (alvoD.posicao?.y || 0));
                                const dz = Math.abs((fichaSegura?.posicao?.z || 0) - (alvoD.posicao?.z || 0)) / (cenaAtual.escala || 1.5);
                                const dQuad = Math.max(dx, dy, Math.floor(dz));
                                
                                const armasEq = (fichaSegura?.inventario || []).filter(i => i.tipo === 'arma' && i.equipado);
                                const maxAlcArmas = armasEq.length > 0 ? Math.max(...armasEq.map(a => a.alcance || 1)) : 1;
                                const podAt = (fichaSegura?.poderes || []).filter(p => p.ativa);
                                const maxAlcPoderes = podAt.length > 0 ? Math.max(...podAt.map(p => p.alcance || 1)) : 1;
                                const alcanceEf = Math.max(maxAlcArmas, maxAlcPoderes);

                                const foraAlc = dQuad > alcanceEf;

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                        <div style={{ textAlign: 'center', color: foraAlc ? '#ff003c' : '#0f0', fontWeight: 'bold', fontSize: '0.9em' }}>
                                            🎯 Alvo a {dQuad}Q | Alcance: {alcanceEf}Q {foraAlc ? '(MUITO LONGE!)' : '(EM ALCANCE)'}
                                        </div>
                                        <button 
                                            className="btn-neon btn-gold" 
                                            onClick={() => !foraAlc && rolarAcertoRapido()} 
                                            disabled={foraAlc}
                                            style={{ padding: '12px', fontSize: '1.2em', width: '100%', letterSpacing: 1, opacity: foraAlc ? 0.5 : 1, borderColor: foraAlc ? '#555' : '#ffcc00' }}
                                        >
                                            🎲 ROLAR ACERTO
                                        </button>
                                    </div>
                                );
                            })() : (
                                <button className="btn-neon btn-gold" onClick={rolarAcertoRapido} style={{ padding: '12px', fontSize: '1.2em', width: '100%', marginTop: 5, letterSpacing: 1 }}>
                                    🎲 ROLAR DADOS LIVRE
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: modo3D ? 0.3 : 1 }}>
                                <button className="btn-neon" onClick={() => alterarZoom(-1)} style={{ padding: '5px 15px' }} disabled={modo3D}>-</button>
                                <span style={{ color: '#aaa' }}>Zoom: {tamanhoCelula}px</span>
                                <button className="btn-neon" onClick={() => alterarZoom(1)} style={{ padding: '5px 15px' }} disabled={modo3D}>+</button>
                            </div>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderLeft: '2px solid #333', paddingLeft: 20 }}>
                                <span style={{ color: isMestre && cenaVisualizadaId && cenaVisualizadaId !== cenaAtivaIdGlobal ? '#0088ff' : '#ffcc00', fontWeight: 'bold' }}>
                                    {isMestre && cenaVisualizadaId && cenaVisualizadaId !== cenaAtivaIdGlobal ? '👁️ Preparando:' : 'Cena Atual:'}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                                    {cenaAtual.nome} (1Q = {cenaAtual.escala} {cenaAtual.unidade})
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderLeft: '2px solid #333', paddingLeft: 20 }}>
                                <span style={{ color: '#00ccff', fontWeight: 'bold' }}>Altitude (Z):</span>
                                <input
                                    className="input-neon"
                                    type="number"
                                    value={altitudeInput}
                                    onChange={e => setAltitudeInput(e.target.value)}
                                    style={{ width: 70, padding: 4, borderColor: '#00ccff', color: '#fff' }}
                                    title="0 = chao. Valores maiores = voo."
                                />
                                <span style={{ fontSize: '0.8em', color: '#888' }}>m</span>
                            </div>

                            <button 
                                className={`btn-neon ${modo3D ? 'btn-gold' : ''}`} 
                                onClick={() => setModo3D(!modo3D)} 
                                style={{ marginLeft: 'auto', padding: '5px 15px', borderColor: modo3D ? '#ffcc00' : '#00ffcc' }}
                            >
                                {modo3D ? '🌌 VOLTAR AO 2D' : '🌌 VISÃO 3D'}
                            </button>
                        </div>

                        {modo3D && (
                            <div style={{ height: '60vh', background: '#000', borderRadius: 5, overflow: 'hidden', border: '2px solid #0088ff', boxShadow: '0 0 20px rgba(0, 136, 255, 0.4)' }}>
                                <Tabuleiro3D 
                                    mapSize={MAP_SIZE} 
                                    tokens={tokens3D} 
                                    moverJogador={handleCellClick} 
                                    mapUrl={cenaAtual.img} 
                                />
                            </div>
                        )}

                        {!modo3D && (
                            <div id="combat-grid" style={{ 
                                display: 'grid', gridTemplateColumns: `repeat(${MAP_SIZE}, ${tamanhoCelula}px)`, gap: 1, 
                                overflow: 'auto', maxHeight: '60vh', background: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 5,
                                backgroundImage: urlSeguraParaCss(cenaAtual.img), backgroundSize: 'cover', backgroundPosition: 'center'
                            }}>
                                {cells.map((cell) => {
                                    const key = `${cell.x},${cell.y}`;
                                    const tokens = tokenMap[key] || [];
                                    
                                    const cellDummies = Object.entries(dummies || {}).filter(([id, d]) => {
                                        const dCena = d.cenaId || 'default';
                                        return d.posicao?.x === cell.x && d.posicao?.y === cell.y && dCena === cenaRenderId;
                                    });

                                    return (
                                        <div key={key} className="map-cell" data-x={cell.x} data-y={cell.y} onClick={() => handleCellClick(cell.x, cell.y)}
                                            style={{ width: tamanhoCelula, height: tamanhoCelula, border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                                            
                                            {cellDummies.map(([id, d]) => (
                                                <DummieToken key={id} id={id} dummie={d} />
                                            ))}

                                            {tokens.map((tk) => {
                                                const info = getAvatarInfo(tk.ficha);
                                                const isMe = tk.nome === meuNome;
                                                const altitude = tk.ficha?.posicao?.z || 0;
                                                const isFlying = altitude > 0;
                                                
                                                // 🔥 TOKENS ÉPICOS NO MAPA PARA OS GRANDS E CANDIDATOS 🔥
                                                const tkMesa = tk.ficha?.bio?.mesa || 'presente';
                                                let tkClass = tk.ficha?.bio?.classe;
                                                if ((tkClass === 'pretender' || tkClass === 'alterego') && tk.ficha?.bio?.subClasse) {
                                                    tkClass = tk.ficha?.bio?.subClasse;
                                                }

                                                const tkGrand = tkClass && overridesCompendio?.grands?.[`${tkClass}_${tkMesa}`] === tk.nome;
                                                const tkCand = tkClass && !tkGrand && (overridesCompendio?.grands?.[`${tkClass}_${tkMesa}_candidatos`] || []).includes(tk.nome);

                                                let bordaToken = isFlying ? '3px solid #00ccff' : (isMe ? '2px solid #00ffcc' : '1px solid rgba(255,255,255,0.3)');
                                                let sombraToken = isFlying ? '0 10px 15px rgba(0, 204, 255, 0.5)' : 'none';

                                                if (tkGrand) {
                                                    bordaToken = '3px solid #ffcc00';
                                                    sombraToken = '0 0 15px #ff003c, inset 0 0 10px #ffcc00';
                                                } else if (tkCand) {
                                                    bordaToken = '2px solid #0088ff';
                                                    sombraToken = '0 0 10px #00ccff';
                                                }

                                                const style = {
                                                    position: 'absolute', top: 2, left: 2, width: tamanhoCelula - 4, height: tamanhoCelula - 4,
                                                    borderRadius: '50%', backgroundColor: corDoJogador(tk.nome), display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '0.7em', fontWeight: 'bold',
                                                    border: bordaToken,
                                                    boxShadow: sombraToken,
                                                    transform: isFlying ? 'translateY(-5px)' : 'none',
                                                    backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                                    zIndex: isFlying ? 10 : (tkGrand ? 5 : 1)
                                                };
                                                return (
                                                    <div key={tk.nome} className={`player-token${isMe ? ' my-token' : ''}`} title={`${tk.nome} | Altura: ${altitude}m`} style={style}>
                                                        {!info.img && tk.nome.charAt(0).toUpperCase()}
                                                        {isFlying && (
                                                            <div style={{ position: 'absolute', bottom: '-15px', background: '#00ccff', color: '#000', fontSize: '0.8em', padding: '0 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                {altitude}m
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <div className="def-box" style={{ marginTop: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                        <h3 style={{ color: '#00ffcc', margin: 0 }}>Sistema de Iniciativa</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {minhaFicha?.iniciativa > 0 && (
                                <button className="btn-neon btn-red" onClick={sairDoCombate} style={{ padding: '4px 10px', fontSize: '0.8em' }}>Sair do Combate</button>
                            )}
                            {isMestre && (
                                <button className="btn-neon" onClick={encerrarCombate} style={{ borderColor: '#ff003c', color: '#ff003c', padding: '4px 10px', fontSize: '0.8em' }}>Zerar Combate</button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input className="input-neon" type="number" id="minha-iniciativa" value={iniciativaInput} onChange={e => setIniciativaInput(e.target.value)} style={{ width: 80 }} />
                        <button className="btn-neon btn-gold" onClick={setMinhaIniciativa}>Definir Iniciativa</button>
                        <button className="btn-neon" onClick={avancarTurno} style={{ borderColor: '#00ffcc', color: '#00ffcc' }}>Encerrar Turno</button>
                    </div>

                    <div id="lista-turnos" style={{ display: 'flex', gap: 8, marginTop: 15, overflowX: 'auto', paddingBottom: 5 }}>
                        {ordemIniciativa.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '0.8em', margin: 0 }}>Nenhum jogador rolou iniciativa ainda.</p>
                        ) : (
                            ordemIniciativa.map((j, i) => {
                                const info = getAvatarInfo(j.ficha);
                                const isActive = (i === turnoAtualIndex % ordemIniciativa.length);
                                return (
                                    <div key={j.nome} title={`Clique para ver o Histórico de ${j.nome}`}
                                        onClick={() => setJogadorHistory(j.nome)}
                                        style={{
                                            cursor: 'pointer',
                                            minWidth: 50, height: 50, borderRadius: '50%', border: isActive ? '3px solid #00ffcc' : '2px solid #444', opacity: isActive ? 1 : 0.5,
                                            backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7em', color: 'white', textShadow: '1px 1px 2px black',
                                            transition: 'transform 0.2s',
                                        }}>
                                        {!info.img && j.nome.charAt(0)}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {jogadorHistory && (
                        <div style={{ marginTop: 15, padding: 15, background: 'rgba(0, 20, 40, 0.8)', border: '1px solid #0088ff', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h4 style={{ margin: 0, color: '#0088ff' }}>Histórico de Ações: {jogadorHistory}</h4>
                                <button className="btn-neon btn-red" onClick={() => setJogadorHistory(null)} style={{ padding: '2px 8px', fontSize: '0.8em' }}>X Fechar</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 5 }}>
                                {feedCombate.filter(f => f.nome === jogadorHistory).slice(-6).reverse().map((h, i) => (
                                    <div key={i} style={{ fontSize: '0.85em', color: '#ccc', background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 5, borderLeft: `3px solid ${h.tipo === 'dano' ? '#ff003c' : '#f90'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <strong style={{ color: h.tipo === 'dano' ? '#ff003c' : h.tipo === 'acerto' ? '#f90' : '#0088ff', textTransform: 'uppercase' }}>
                                                [{h.tipo}]
                                            </strong>
                                            {h.acertoTotal && <strong style={{ color: '#fff' }}>Total Resultante: {fmt(h.acertoTotal)}</strong>}
                                            {h.dano && <strong style={{ color: '#fff' }}>Dano Bruto: {fmt(h.dano)}</strong>}
                                        </div>

                                        {h.rolagem && <div style={{ marginBottom: 4 }}>🎲 <strong>Dados:</strong> <span dangerouslySetInnerHTML={{ __html: h.rolagem }} /></div>}
                                        {h.atributosUsados && <div style={{ color: '#888', fontSize: '0.9em' }}><strong>Status Lidos:</strong> {h.atributosUsados}</div>}
                                        {h.profBonusTexto && <div style={{ color: '#888', fontSize: '0.9em' }}><strong>Cálculo Extra:</strong> {h.profBonusTexto}</div>}
                                        {h.armaStr && <div style={{ color: '#888', fontSize: '0.9em' }} dangerouslySetInnerHTML={{ __html: h.armaStr }} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {jogadorDaVez && (
                        <div style={{ marginTop: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                            <div id="turno-destaque" style={{
                                width: 80, height: 80, borderRadius: '50%', border: '3px solid #00ffcc',
                                backgroundImage: urlSeguraParaCss(infoDaVez?.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold', color: '#fff'
                            }}>
                                {(!infoDaVez || !infoDaVez.img) && jogadorDaVez.nome.charAt(0)}
                            </div>
                            <div>
                                <div id="turno-nome" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2em' }}>{jogadorDaVez.nome}</div>
                                {infoDaVez && infoDaVez.forma && (<div id="turno-forma" style={{ color: '#00ffcc', fontSize: '0.9em' }}>{infoDaVez.forma}</div>)}
                                
                                {jogadorDaVez.nome === meuNome && (
                                    <div style={{ marginTop: 8, padding: 8, background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        
                                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <select className="input-neon" value={mapStat} onChange={e => setMapStat(e.target.value)} style={{ padding: 4, width: 100 }} title="Atributo">
                                                <option value="forca">Força</option>
                                                <option value="destreza">Destreza</option>
                                                <option value="inteligencia">Intelig.</option>
                                                <option value="sabedoria">Sabedoria</option>
                                                <option value="energiaEsp">Energ. Esp.</option>
                                                <option value="carisma">Carisma</option>
                                                <option value="stamina">Stamina</option>
                                                <option value="constituicao">Constit.</option>
                                            </select>

                                            <input className="input-neon" type="number" value={mapQD} onChange={e => setMapQD(e.target.value)} style={{ width: 45, padding: 4 }} title="Dados" />
                                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>D</span>
                                            <input className="input-neon" type="number" value={mapFD} onChange={e => setMapFD(e.target.value)} style={{ width: 55, padding: 4 }} title="Faces" />
                                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>+</span>
                                            <input className="input-neon" type="number" value={mapBonus} onChange={e => setMapBonus(e.target.value)} style={{ width: 60, padding: 4 }} title="Bônus" />
                                            
                                            <span style={{ color: '#0f0', fontSize: '0.8em', marginLeft: 5, fontWeight: 'bold' }}>V:</span>
                                            <input className="input-neon" type="number" min="0" value={mapVantagens} onChange={changeVantagem} style={{ width: 45, padding: 4, borderColor: '#0f0', color: '#0f0' }} title="Vantagens" />
                                            
                                            <span style={{ color: '#f00', fontSize: '0.8em', marginLeft: 5, fontWeight: 'bold' }}>D:</span>
                                            <input className="input-neon" type="number" min="0" value={mapDesvantagens} onChange={changeDesvantagem} style={{ width: 45, padding: 4, borderColor: '#f00', color: '#f00' }} title="Desvantagens" />

                                            <label style={{ color: '#00ffcc', fontSize: '0.85em', marginLeft: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                                <input type="checkbox" checked={mapUsarProf} onChange={e => setMapUsarProf(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                                Prof.
                                            </label>
                                        </div>

                                        {/* 🔥 RADAR TÁTICO NO MAPA 🔥 */}
                                        {alvoSelecionado && dummies?.[alvoSelecionado] ? (() => {
                                            const alvoD = dummies[alvoSelecionado];
                                            const dx = Math.abs((fichaSegura?.posicao?.x || 0) - (alvoD.posicao?.x || 0));
                                            const dy = Math.abs((fichaSegura?.posicao?.y || 0) - (alvoD.posicao?.y || 0));
                                            const dz = Math.abs((fichaSegura?.posicao?.z || 0) - (alvoD.posicao?.z || 0)) / (cenaAtual.escala || 1.5);
                                            const dQuad = Math.max(dx, dy, Math.floor(dz));
                                            
                                            const armasEq = (fichaSegura?.inventario || []).filter(i => i.tipo === 'arma' && i.equipado);
                                            const maxAlcArmas = armasEq.length > 0 ? Math.max(...armasEq.map(a => a.alcance || 1)) : 1;
                                            const podAt = (fichaSegura?.poderes || []).filter(p => p.ativa);
                                            const maxAlcPoderes = podAt.length > 0 ? Math.max(...podAt.map(p => p.alcance || 1)) : 1;
                                            const alcanceEf = Math.max(maxAlcArmas, maxAlcPoderes);

                                            const foraAlc = dQuad > alcanceEf;

                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, padding: '5px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 5 }}>
                                                    <div style={{ color: foraAlc ? '#ff003c' : '#0f0', fontWeight: 'bold', fontSize: '0.85em' }}>
                                                        🎯 Alvo a {dQuad}Q | Alcance: {alcanceEf}Q {foraAlc ? '(LONGE)' : '(OK)'}
                                                    </div>
                                                    <button 
                                                        className="btn-neon btn-gold" 
                                                        onClick={() => !foraAlc && rolarAcertoRapido()} 
                                                        disabled={foraAlc}
                                                        style={{ padding: '4px 10px', fontSize: '0.85em', opacity: foraAlc ? 0.5 : 1, borderColor: foraAlc ? '#555' : '#ffcc00' }}
                                                    >
                                                        🎲 Rolar Acerto
                                                    </button>
                                                </div>
                                            );
                                        })() : (
                                            <button className="btn-neon btn-gold" onClick={rolarAcertoRapido} style={{ padding: '4px 10px', fontSize: '0.85em', marginTop: 5, alignSelf: 'flex-start' }}>
                                                🎲 Rolar Acerto Livre
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: 10, height: '85vh' }}>
                {renderHologramaAcao()}
            </div>
        </div>
    );
}