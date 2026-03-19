import React, { useState, useMemo, useRef } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

const MAP_SIZE = 30;
const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

export default function MapaPanel() {
    const { minhaFicha, meuNome, personagens, updateFicha, feedCombate = [] } = useStore();

    const [tamanhoCelula, setTamanhoCelula] = useState(35);
    const [iniciativaInput, setIniciativaInput] = useState(minhaFicha.iniciativa || 0);
    const [turnoAtualIndex, setTurnoAtualIndex] = useState(0);

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
    }

    function avancarTurno() {
        if (ordemIniciativa.length === 0) return;
        setTurnoAtualIndex(prev => {
            let next = prev + 1;
            if (next >= ordemIniciativa.length) next = 0;
            return next;
        });
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

    // 🔥 O CÉREBRO DO HOLOGRAMA: Busca a última ação que caiu no feed
    const ultimaAcao = feedCombate.length > 0 ? feedCombate[feedCombate.length - 1] : null;
    
    function renderHologramaAcao() {
        if (!ultimaAcao) {
            return (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontStyle: 'italic', border: '2px dashed #333', borderRadius: 8 }}>
                    O campo de batalha aguarda o primeiro movimento...
                </div>
            );
        }

        const atorFicha = jogadores[ultimaAcao.nome] || null;
        const atorInfo = getAvatarInfo(atorFicha);
        
        let corImpacto = '#fff';
        let tituloImpacto = 'AÇÃO';
        let valorImpacto = 0;

        switch (ultimaAcao.tipo) {
            case 'dano': corImpacto = '#ff003c'; tituloImpacto = 'DANO'; valorImpacto = ultimaAcao.dano; break;
            case 'acerto': corImpacto = '#f90'; tituloImpacto = 'ACERTO'; valorImpacto = ultimaAcao.acertoTotal; break;
            case 'evasiva': corImpacto = '#0088ff'; tituloImpacto = 'ESQUIVA'; valorImpacto = ultimaAcao.total; break;
            case 'resistencia': corImpacto = '#ccc'; tituloImpacto = 'BLOQUEIO'; valorImpacto = ultimaAcao.total; break;
            case 'escudo': corImpacto = '#f0f'; tituloImpacto = 'ESCUDO'; valorImpacto = ultimaAcao.escudoReduzido; break;
            default: break;
        }

        return (
            <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: `2px solid ${corImpacto}`, boxShadow: `0 0 20px ${corImpacto}40` }}>
                
                {/* 1. O Cabeçalho da Ação */}
                <div style={{ background: corImpacto, color: '#000', padding: '10px', textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: '1.2em', textTransform: 'uppercase' }}>
                    ⚡ {tituloImpacto} ⚡
                </div>

                {/* 2. A Imagem do Personagem (Cut-in) */}
                <div style={{ 
                    flex: '1', minHeight: '250px', 
                    backgroundImage: atorInfo.img ? `url('${atorInfo.img}')` : 'none', 
                    backgroundSize: 'cover', backgroundPosition: 'top center',
                    position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    boxShadow: 'inset 0 -100px 50px -20px rgba(0,0,0,0.9)' 
                }}>
                    <div style={{ padding: '20px', zIndex: 2 }}>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '2em', textShadow: '0 0 10px #000, 2px 2px 0px #000' }}>
                            {ultimaAcao.nome}
                        </h2>
                        {atorInfo.forma && (
                            <div style={{ color: corImpacto, fontSize: '1.2em', fontWeight: 'bold', textShadow: '0 0 5px #000' }}>
                                ☄️ {atorInfo.forma}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. O Dano/Número Gigante & LETALIDADE */}
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.8)', textAlign: 'center', borderTop: `1px solid ${corImpacto}` }}>
                    <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '-10px', textTransform: 'uppercase' }}>Impacto Resultante</div>
                    <h1 style={{ margin: 0, fontSize: '4em', color: corImpacto, textShadow: `0 0 20px ${corImpacto}` }}>
                        {fmt(valorImpacto)}
                    </h1>
                    
                    {/* 🔥 EXIBIÇÃO DA LETALIDADE AQUI */}
                    {ultimaAcao.tipo === 'dano' && ultimaAcao.letalidade !== undefined && (
                        <div style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px', textShadow: '0 0 5px #ffcc00' }}>
                            LETALIDADE: +{ultimaAcao.letalidade}
                        </div>
                    )}
                </div>

                {/* 4. O HUD de Status do Atacante/Defensor */}
                {atorFicha && (
                    <div style={{ padding: '15px', background: '#050505' }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: 6,
                            background: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4d', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>HP</span><span>{fmt(atorFicha.vida?.atual)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4dffff', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>MP</span><span>{fmt(atorFicha.mana?.atual)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffff4d', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>AU</span><span>{fmt(atorFicha.aura?.atual)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CK</span><span>{fmt(atorFicha.chakra?.atual)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff66ff', fontWeight: 'bold' }}>
                                <span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CP</span><span>{fmt(atorFicha.corpo?.atual)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mapa-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* LADO ESQUERDO: Mapa Grid e Controle de Turnos (70% da tela) */}
            <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                {/* Zoom controls */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <button className="btn-neon" onClick={() => alterarZoom(-1)} style={{ padding: '5px 15px' }}>-</button>
                    <span style={{ color: '#aaa' }}>Zoom: {tamanhoCelula}px</span>
                    <button className="btn-neon" onClick={() => alterarZoom(1)} style={{ padding: '5px 15px' }}>+</button>
                </div>

                {/* Grid */}
                <div
                    id="combat-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${MAP_SIZE}, ${tamanhoCelula}px)`,
                        gap: 1,
                        overflow: 'auto',
                        maxHeight: '60vh',
                        background: 'rgba(0,0,0,0.3)',
                        padding: 5,
                        borderRadius: 5
                    }}
                >
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
                        <button className="btn-neon" onClick={avancarTurno} style={{ borderColor: '#00ffcc', color: '#00ffcc' }}>Avançar Turno</button>
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

                    {/* Destaque do Turno Atual */}
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
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LADO DIREITO: Holograma de Ação (30% da tela) */}
            <div style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: 10, height: '85vh' }}>
                {renderHologramaAcao()}
            </div>
        </div>
    );
}