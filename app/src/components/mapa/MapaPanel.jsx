import React, { useState, useMemo, useRef, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie } from '../../services/firebase-sync'; // 🔥 salvarDummie adicionado
import { calcularAcerto } from '../../core/engine';

import Tabuleiro3D from './Tabuleiro3D';
import DummieToken from '../combat/DummieToken'; // 🔥 O Token do Alvo

const MAP_SIZE = 30;
const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

function urlSeguraParaCss(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '';
    return `url("${trimmed.replace(/["\\)]/g, '')}")`;
}

export default function MapaPanel() {
    const { minhaFicha, meuNome, personagens, updateFicha, feedCombate = [], isMestre, dummies, alvoSelecionado } = useStore(); // 🔥 dummies e alvo puxados

    const [modo3D, setModo3D] = useState(false);
    const [tamanhoCelula, setTamanhoCelula] = useState(35);
    const [iniciativaInput, setIniciativaInput] = useState(minhaFicha.iniciativa || 0);
    const [altitudeInput, setAltitudeInput] = useState(minhaFicha.posicao?.z || 0);
    const [turnoAtualIndex, setTurnoAtualIndex] = useState(0);
    const [feedIndexTurnoAtual, setFeedIndexTurnoAtual] = useState(0);
    const [jogadorHistory, setJogadorHistory] = useState(null);

    const [mapQD, setMapQD] = useState(1);
    const [mapFD, setMapFD] = useState(20);
    const [mapBonus, setMapBonus] = useState(0);
    const [mapStat, setMapStat] = useState('destreza'); 
    
    const [mapVantagens, setMapVantagens] = useState(minhaFicha.ataqueConfig?.vantagens || 0);
    const [mapDesvantagens, setMapDesvantagens] = useState(minhaFicha.ataqueConfig?.desvantagens || 0);
    const [inputMapaUrl, setInputMapaUrl] = useState('');

    useEffect(() => {
        setMapVantagens(minhaFicha.ataqueConfig?.vantagens || 0);
        setMapDesvantagens(minhaFicha.ataqueConfig?.desvantagens || 0);
    }, [minhaFicha.ataqueConfig?.vantagens, minhaFicha.ataqueConfig?.desvantagens]);

    useEffect(() => {
        setAltitudeInput(minhaFicha.posicao?.z || 0);
    }, [minhaFicha.posicao?.z]);

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

    function aplicarUrlDoMapa() {
        updateFicha(f => {
            f.mapaGlobalUrl = inputMapaUrl;
        });
        salvarFichaSilencioso();
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: '🗺️ O Mestre alterou o cenário de combate!' });
    }

    const urlMapaGlobal = useMemo(() => {
        if (isMestre && minhaFicha.mapaGlobalUrl) return minhaFicha.mapaGlobalUrl;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for(let k of chaves) {
                if (personagens[k]?.mapaGlobalUrl) return personagens[k].mapaGlobalUrl;
            }
        }
        return null;
    }, [isMestre, minhaFicha.mapaGlobalUrl, personagens]);

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
        if (meuNome && minhaFicha.posicao && minhaFicha.posicao.x !== undefined) {
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

    const ordemIniciativa = useMemo(() => {
        const lista = [];
        if (personagens) {
            const nomes = Object.keys(personagens);
            for (let i = 0; i < nomes.length; i++) {
                const n = nomes[i];
                const f = personagens[n];
                if (f && f.iniciativa !== undefined && f.iniciativa > 0) {
                    lista.push({ nome: n, ficha: f, iniciativa: f.iniciativa });
                }
            }
        }
        lista.sort((a, b) => b.iniciativa - a.iniciativa);
        return lista;
    }, [personagens]);

    // 🔥 NOVO: Lida com clique na célula. Se tiver um Dummie selecionado E for mestre, move o Dummie. Senão, move o jogador.
    function handleCellClick(x, y) {
        if (isMestre && alvoSelecionado && dummies[alvoSelecionado]) {
            const d = dummies[alvoSelecionado];
            salvarDummie(alvoSelecionado, { ...d, posicao: { x, y } });
        } else {
            const z = parseInt(altitudeInput) || 0;
            updateFicha((ficha) => {
                if (!ficha.posicao) ficha.posicao = {};
                ficha.posicao.x = x;
                ficha.posicao.y = y;
                ficha.posicao.z = z;
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
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: '⚔️ O COMBATE FOI ENCERRADO PELO MESTRE! ⚔️' });
        sairDoCombate();
        setTurnoAtualIndex(0);
    }

    function rolarAcertoRapido() {
        const qD = parseInt(mapQD) || 1;
        const fD = parseInt(mapFD) || 20;
        const bonus = parseInt(mapBonus) || 0;
        
        const sels = [mapStat]; 
        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];

        const result = calcularAcerto({ 
            qD, fD, prof: 0, bonus, sels, minhaFicha, itensEquipados, 
            vantagens: mapVantagens, desvantagens: mapDesvantagens 
        });
        
        let extraFeed = {};
        if (alvoSelecionado && dummies[alvoSelecionado]) {
            const alvo = dummies[alvoSelecionado];
            const acertou = result.acertoTotal > alvo.valorDefesa;
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
            if (pos && pos.x !== undefined) {
                const key = `${pos.x},${pos.y}`;
                if (!map[key]) map[key] = [];
                map[key].push({ nome, ficha: jogadores[nome] });
            }
        }
        return map;
    }, [jogadores]);

    const tokens3D = useMemo(() => {
        return Object.entries(jogadores).map(([nome, ficha]) => ({
            nome,
            x: ficha.posicao?.x || 0,
            y: ficha.posicao?.y || 0,
            z: ficha.posicao?.z || 0,
            cor: corDoJogador(nome)
        }));
    }, [jogadores]);

    const jogadorDaVez = ordemIniciativa.length > 0 ? ordemIniciativa[turnoAtualIndex % ordemIniciativa.length] : null;
    const infoDaVez = jogadorDaVez ? getAvatarInfo(jogadorDaVez.ficha) : null;
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    function renderHologramaAcao() {
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

            const acCfg = fichaBase?.ataqueConfig || minhaFicha.ataqueConfig || {};
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
            <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: `2px solid ${corImpacto}`, boxShadow: `0 0 20px ${corImpacto}40` }}>
                
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
                            <div style={{ padding: '20px', zIndex: 2 }}>
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '2em', textShadow: '0 0 10px #000, 2px 2px 0px #000' }}>
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
                                
                                {acaoExibir.tipo === 'dano' && acaoExibir.letalidade !== undefined && (
                                    <div style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px', textShadow: '0 0 5px #ffcc00' }}>
                                        LETALIDADE: +{acaoExibir.letalidade}
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
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="mapa-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                
                {/* 🔥 NOVO: MESA DO MESTRE PARA DUMMIES */}
                {isMestre && (
                    <div style={{ marginBottom: 15, padding: 10, border: '1px solid #ffcc00', borderRadius: 5, background: 'rgba(0,0,0,0.5)' }}>
                    <h4 style={{ color: '#ffcc00', marginTop: 0, marginBottom: 10 }}>🤖 Gerador de Entidades</h4>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input className="input-neon" type="text" placeholder="Nome" id="dummieNome" defaultValue="Boneco de Treino" style={{ width: 130, padding: 5 }}/>
                    <input className="input-neon" type="number" placeholder="HP" id="dummieHp" defaultValue="100" style={{ width: 80, padding: 5 }} title="Vida Máxima"/>
                    <select className="input-neon" id="dummieDefTipo" style={{ width: 100, padding: 5 }} title="Base da CA">
                    <option value="evasiva">Evasiva (Des)</option>
                    <option value="resistencia">Resist. (For)</option>
                    </select>
                    <input className="input-neon" type="number" placeholder="CA" id="dummieDef" defaultValue="10" style={{ width: 60, padding: 5 }} title="Classe de Armadura (5 + Base)"/>
            
                    {/* 🔥 NOVO: ESCOLHA DE VISIBILIDADE DO HP */}
                    <select className="input-neon" id="dummieVisivel" style={{ width: 110, padding: 5 }} title="Visibilidade do HP">
                    <option value="todos">HP Visível</option>
                    <option value="mestre">HP Oculto</option>
                    </select>

                    <button className="btn-neon btn-gold" onClick={() => {
                        const n = document.getElementById('dummieNome').value || 'Entidade';
                        const h = parseInt(document.getElementById('dummieHp').value) || 100;
                        const dt = document.getElementById('dummieDefTipo').value;
                        const dv = parseInt(document.getElementById('dummieDef').value) || 10;
                        const vHp = document.getElementById('dummieVisivel').value;
                        const id = 'dummie_' + Date.now();
                        salvarDummie(id, { nome: n, hpMax: h, hpAtual: h, tipoDefesa: dt, valorDefesa: dv, visibilidadeHp: vHp, posicao: { x: 0, y: 0 } });
                    }} style={{ padding: '5px 15px', margin: 0 }}>
                    + Injetar no Mapa
                    </button>
                    <span style={{ fontSize: '0.8em', color: '#aaa' }}>(Clique no grid para marcar, e clique noutra célula para mover)</span>
                    </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: modo3D ? 0.3 : 1 }}>
                        <button className="btn-neon" onClick={() => alterarZoom(-1)} style={{ padding: '5px 15px' }} disabled={modo3D}>-</button>
                        <span style={{ color: '#aaa' }}>Zoom: {tamanhoCelula}px</span>
                        <button className="btn-neon" onClick={() => alterarZoom(1)} style={{ padding: '5px 15px' }} disabled={modo3D}>+</button>
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

                {isMestre && modo3D && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, background: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5, border: '1px solid #ffcc00' }}>
                        <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>🗺️ Link do Cenário (Discord/Imgur):</span>
                        <input
                            className="input-neon"
                            type="text"
                            placeholder="Cole o link da imagem terminando em .png ou .jpg..."
                            value={inputMapaUrl}
                            onChange={e => setInputMapaUrl(e.target.value)}
                            style={{ flex: 1, padding: 4, borderColor: '#ffcc00', color: '#fff' }}
                        />
                        <button className="btn-neon btn-gold" onClick={aplicarUrlDoMapa} style={{ padding: '4px 15px', margin: 0 }}>
                            GERAR MUNDO
                        </button>
                    </div>
                )}

                {modo3D && (
                    <div style={{ height: '60vh', background: '#000', borderRadius: 5, overflow: 'hidden', border: '2px solid #0088ff', boxShadow: '0 0 20px rgba(0, 136, 255, 0.4)' }}>
                        <Tabuleiro3D 
                            mapSize={MAP_SIZE} 
                            tokens={tokens3D} 
                            moverJogador={handleCellClick} 
                            mapUrl={urlMapaGlobal} 
                        />
                    </div>
                )}

                {!modo3D && (
                    <div id="combat-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${MAP_SIZE}, ${tamanhoCelula}px)`, gap: 1, overflow: 'auto', maxHeight: '60vh', background: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 5 }}>
                        {cells.map((cell) => {
                            const key = `${cell.x},${cell.y}`;
                            const tokens = tokenMap[key] || [];
                            
                            // 🔥 Puxa os Dummies que estão nesta célula
                            const cellDummies = Object.entries(dummies || {}).filter(([id, d]) => d.posicao?.x === cell.x && d.posicao?.y === cell.y);

                            return (
                                <div key={key} className="map-cell" data-x={cell.x} data-y={cell.y} onClick={() => handleCellClick(cell.x, cell.y)}
                                    style={{ width: tamanhoCelula, height: tamanhoCelula, border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                                    
                                    {/* Renderiza os Dummies primeiro */}
                                    {cellDummies.map(([id, d]) => (
                                        <DummieToken key={id} id={id} dummie={d} />
                                    ))}

                                    {/* Renderiza os Jogadores depois */}
                                    {tokens.map((tk) => {
                                        const info = getAvatarInfo(tk.ficha);
                                        const isMe = tk.nome === meuNome;
                                        const altitude = tk.ficha.posicao?.z || 0;
                                        const isFlying = altitude > 0;
                                        const style = {
                                            position: 'absolute', top: 2, left: 2, width: tamanhoCelula - 4, height: tamanhoCelula - 4,
                                            borderRadius: '50%', backgroundColor: corDoJogador(tk.nome), display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontSize: '0.7em', fontWeight: 'bold',
                                            border: isFlying ? '3px solid #00ccff' : (isMe ? '2px solid #00ffcc' : '1px solid rgba(255,255,255,0.3)'),
                                            boxShadow: isFlying ? '0 10px 15px rgba(0, 204, 255, 0.5)' : 'none',
                                            transform: isFlying ? 'translateY(-5px)' : 'none',
                                            backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                            zIndex: isFlying ? 10 : 1
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

                <div className="def-box" style={{ marginTop: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                        <h3 style={{ color: '#00ffcc', margin: 0 }}>Sistema de Iniciativa</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {minhaFicha.iniciativa > 0 && (
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
                                    <div style={{ marginTop: 8, padding: 8, background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', borderRadius: 8, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        
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

                                        <button className="btn-neon btn-gold" onClick={rolarAcertoRapido} style={{ padding: '4px 10px', fontSize: '0.85em', marginLeft: 5 }}>
                                            Rolar Acerto
                                        </button>
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