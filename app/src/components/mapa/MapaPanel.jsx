import React, { useState, useMemo, useRef } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';
import { calcularAcerto } from '../../core/engine'; // 🔥 Importamos a máquina de Acerto!

const MAP_SIZE = 30;
const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

export default function MapaPanel() {
    const { minhaFicha, meuNome, personagens, updateFicha, feedCombate = [] } = useStore();

    const [tamanhoCelula, setTamanhoCelula] = useState(35);
    const [iniciativaInput, setIniciativaInput] = useState(minhaFicha.iniciativa || 0);
    const [turnoAtualIndex, setTurnoAtualIndex] = useState(0);
    
    // 🔥 O MARCADOR TEMPORAL: Grava o tamanho do feed quando o turno muda
    const [feedIndexTurnoAtual, setFeedIndexTurnoAtual] = useState(0);

    // Estados do Mini-Painel de Acerto
    const [mapQD, setMapQD] = useState(1);
    const [mapFD, setMapFD] = useState(20);
    const [mapBonus, setMapBonus] = useState(0);

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

    function moverJogadorPara(x, y) {
        updateFicha((ficha) => {
            if (!ficha.posicao) ficha.posicao = {};
            ficha.posicao.x = x;
            ficha.posicao.y = y;
        });
        salvarFichaSilencioso();
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
        // Zera o marcador temporal ao entrar no combate
        setFeedIndexTurnoAtual(feedCombate.length); 
    }

    function avancarTurno() {
        if (ordemIniciativa.length === 0) return;
        setTurnoAtualIndex(prev => {
            let next = prev + 1;
            if (next >= ordemIniciativa.length) next = 0;
            return next;
        });
        // 🔥 Limpa o holograma gravando a linha do tempo atual
        setFeedIndexTurnoAtual(feedCombate.length);
    }

    function rolarAcertoRapido() {
        const qD = parseInt(mapQD) || 1;
        const fD = parseInt(mapFD) || 20;
        const bonus = parseInt(mapBonus) || 0;
        // Puxa o status que o jogador deixou selecionado na aba de ataque, ou usa destreza como padrão
        const sels = minhaFicha.ataqueConfig?.statusSelecionados?.length > 0 ? minhaFicha.ataqueConfig.statusSelecionados : ['destreza'];
        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];

        const result = calcularAcerto({ qD, fD, prof: 0, bonus, sels, minhaFicha, itensEquipados, vantagens: 0, desvantagens: 0 });
        
        const feedData = { tipo: 'acerto', nome: meuNome, ...result };
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

    const jogadorDaVez = ordemIniciativa.length > 0 ? ordemIniciativa[turnoAtualIndex % ordemIniciativa.length] : null;
    const infoDaVez = jogadorDaVez ? getAvatarInfo(jogadorDaVez.ficha) : null;
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    // 🔥 O CÉREBRO TEMPORAL DO HOLOGRAMA
    function renderHologramaAcao() {
        const emCombate = ordemIniciativa.length > 0;
        
        // Ação Nova = Rolagens feitas APÓS a pessoa atual assumir o turno
        const acaoNovaNoTurno = feedCombate.length > feedIndexTurnoAtual ? feedCombate[feedCombate.length - 1] : null;
        // Ação Geral = Qualquer última rolagem se o combate não estiver rolando
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

        // Lógica de Leitura de Crítico
        let isCrit = false, isFalha = false;
        if (acaoExibir && acaoExibir.rolagem && (acaoExibir.tipo === 'acerto' || acaoExibir.tipo === 'dano')) {
            const match = acaoExibir.rolagem.match(/\[(.*?)\]/);
            if (match) {
                const clean = match[1].replace(/<[^>]*>?/gm, ''); 
                const numbers = clean.split(',').map(n => parseInt(n.trim(), 10));
                if (numbers.includes(20)) isCrit = true;
                if (numbers.includes(1)) isFalha = true;
            }
        }

        // Verificações de Violação
        const isForaDeCombate = acaoExibir && emCombate && (!ordemIniciativa.find(j => j.nome === acaoExibir.nome));
        const isForaDeTurno = acaoExibir && emCombate && !isForaDeCombate && acaoExibir.nome !== nomeBase;

        let corImpacto = '#fff';
        let tituloImpacto = 'AÇÃO';
        let valorImpacto = 0;

        if (acaoExibir) {
            switch (acaoExibir.tipo) {
                case 'dano': corImpacto = '#ff003c'; tituloImpacto = 'DANO'; valorImpacto = acaoExibir.dano; break;
                case 'acerto': corImpacto = '#f90'; tituloImpacto = 'ACERTO'; valorImpacto = acaoExibir.acertoTotal; break;
                case 'evasiva': corImpacto = '#0088ff'; tituloImpacto = 'ESQUIVA'; valorImpacto = acaoExibir.total; break;
                case 'resistencia': corImpacto = '#ccc'; tituloImpacto = 'BLOQUEIO'; valorImpacto = acaoExibir.total; break;
                case 'escudo': corImpacto = '#f0f'; tituloImpacto = 'ESCUDO'; valorImpacto = acaoExibir.escudoReduzido; break;
                default: break;
            }
        }

        return (
            <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: `2px solid ${isCrit ? '#ffcc00' : isFalha ? '#660000' : (acaoExibir ? corImpacto : '#333')}`, boxShadow: `0 0 20px ${acaoExibir ? corImpacto : '#00ffcc'}40` }}>
                
                {/* 1. O Cabeçalho (Limpo quando não há ação) */}
                <div style={{ background: isCrit ? '#ffcc00' : isFalha ? '#660000' : (acaoExibir ? corImpacto : '#00ffcc'), color: isFalha || !acaoExibir ? '#000' : '#000', padding: '10px', textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: '1.2em', textTransform: 'uppercase' }}>
                    {acaoExibir ? (isCrit ? '🔥 ACERTO CRÍTICO 🔥' : isFalha ? '☠️ FALHA CRÍTICA ☠️' : (jogadorDaVez && !isForaDeTurno && !isForaDeCombate ? `TURNO DE ${nomeBase}` : 'AÇÃO LIVRE')) : `⚡ TURNO DE ${nomeBase} ⚡`}
                </div>

                {/* 2. A Imagem do Personagem Base */}
                <div style={{ 
                    flex: '1', minHeight: '250px', 
                    backgroundImage: infoBase.img ? `url('${infoBase.img}')` : 'none', 
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

                {/* 3. A Última Ação (Só aparece se ele rolou algo) */}
                {acaoExibir && (
                    <div style={{ padding: '20px', background: 'rgba(0,0,0,0.85)', textAlign: 'center', borderTop: `1px solid ${corImpacto}` }}>
                        
                        {/* Alertas de Violação de Turno */}
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

                {/* 4. O HUD de Status do Personagem da Vez */}
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
            </div>
        );
    }

    return (
        <div className="mapa-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* LADO ESQUERDO: Mapa Grid e Controle de Turnos */}
            <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                {/* Zoom controls */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <button className="btn-neon" onClick={() => alterarZoom(-1)} style={{ padding: '5px 15px' }}>-</button>
                    <span style={{ color: '#aaa' }}>Zoom: {tamanhoCelula}px</span>
                    <button className="btn-neon" onClick={() => alterarZoom(1)} style={{ padding: '5px 15px' }}>+</button>
                </div>

                {/* Grid */}
                <div id="combat-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${MAP_SIZE}, ${tamanhoCelula}px)`, gap: 1, overflow: 'auto', maxHeight: '60vh', background: 'rgba(0,0,0,0.3)', padding: 5, borderRadius: 5 }}>
                    {cells.map((cell) => {
                        const key = `${cell.x},${cell.y}`;
                        const tokens = tokenMap[key] || [];

                        return (
                            <div key={key} className="map-cell" data-x={cell.x} data-y={cell.y} onClick={() => moverJogadorPara(cell.x, cell.y)}
                                style={{ width: tamanhoCelula, height: tamanhoCelula, border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                                {tokens.map((tk) => {
                                    const info = getAvatarInfo(tk.ficha);
                                    const isMe = tk.nome === meuNome;
                                    const style = {
                                        position: 'absolute', top: 2, left: 2, width: tamanhoCelula - 4, height: tamanhoCelula - 4,
                                        borderRadius: '50%', backgroundColor: corDoJogador(tk.nome), display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '0.7em', fontWeight: 'bold', border: isMe ? '2px solid #00ffcc' : '1px solid rgba(255,255,255,0.3)',
                                        backgroundImage: info.img ? `url('${info.img}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'
                                    };
                                    return (
                                        <div key={tk.nome} className={`player-token${isMe ? ' my-token' : ''}`} title={tk.nome} style={style}>
                                            {!info.img && tk.nome.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Iniciativa e Turnos */}
                <div className="def-box" style={{ marginTop: 15 }}>
                    <h3 style={{ color: '#00ffcc', marginBottom: 10 }}>Sistema de Iniciativa</h3>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input className="input-neon" type="number" id="minha-iniciativa" value={iniciativaInput} onChange={e => setIniciativaInput(e.target.value)} style={{ width: 80 }} />
                        <button className="btn-neon btn-gold" onClick={setMinhaIniciativa}>Definir Iniciativa</button>
                        <button className="btn-neon" onClick={avancarTurno} style={{ borderColor: '#00ffcc', color: '#00ffcc' }}>Encerrar Turno</button>
                    </div>

                    {/* Fila de Turnos Visual */}
                    <div id="lista-turnos" style={{ display: 'flex', gap: 8, marginTop: 15, overflowX: 'auto', paddingBottom: 5 }}>
                        {ordemIniciativa.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '0.8em', margin: 0 }}>Nenhum jogador rolou iniciativa ainda.</p>
                        ) : (
                            ordemIniciativa.map((j, i) => {
                                const info = getAvatarInfo(j.ficha);
                                const isActive = (i === turnoAtualIndex % ordemIniciativa.length);
                                return (
                                    <div key={j.nome} title={`${j.nome} (${j.iniciativa})`}
                                        style={{
                                            minWidth: 50, height: 50, borderRadius: '50%', border: isActive ? '3px solid #00ffcc' : '2px solid #444', opacity: isActive ? 1 : 0.5,
                                            backgroundImage: info.img ? `url('${info.img}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'top center',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7em', color: 'white', textShadow: '1px 1px 2px black'
                                        }}>
                                        {!info.img && j.nome.charAt(0)}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Destaque do Turno Atual + BOTÃO DE AÇÃO RÁPIDA */}
                    {jogadorDaVez && (
                        <div style={{ marginTop: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                            <div id="turno-destaque" style={{
                                width: 80, height: 80, borderRadius: '50%', border: '3px solid #00ffcc',
                                backgroundImage: infoDaVez && infoDaVez.img ? `url('${infoDaVez.img}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold', color: '#fff'
                            }}>
                                {(!infoDaVez || !infoDaVez.img) && jogadorDaVez.nome.charAt(0)}
                            </div>
                            <div>
                                <div id="turno-nome" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2em' }}>{jogadorDaVez.nome}</div>
                                {infoDaVez && infoDaVez.forma && (<div id="turno-forma" style={{ color: '#00ffcc', fontSize: '0.9em' }}>{infoDaVez.forma}</div>)}
                                
                                {/* 🔥 AÇÃO RÁPIDA (Só aparece se for a MINHA vez!) */}
                                {jogadorDaVez.nome === meuNome && (
                                    <div style={{ marginTop: 8, padding: 8, background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', borderRadius: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <input className="input-neon" type="number" value={mapQD} onChange={e => setMapQD(e.target.value)} style={{ width: 45, padding: 4 }} title="Dados" />
                                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>D</span>
                                        <input className="input-neon" type="number" value={mapFD} onChange={e => setMapFD(e.target.value)} style={{ width: 55, padding: 4 }} title="Faces" />
                                        <span style={{ color: '#aaa', fontSize: '0.8em' }}>+</span>
                                        <input className="input-neon" type="number" value={mapBonus} onChange={e => setMapBonus(e.target.value)} style={{ width: 60, padding: 4 }} title="Bônus" />
                                        <button className="btn-neon btn-gold" onClick={rolarAcertoRapido} style={{ padding: '4px 10px', fontSize: '0.85em' }}>
                                            Rolar Acerto
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LADO DIREITO: Holograma de Ação */}
            <div style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: 10, height: '85vh' }}>
                {renderHologramaAcao()}
            </div>
        </div>
    );
}