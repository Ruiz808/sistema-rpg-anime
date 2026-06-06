import React from 'react';
import { createPortal } from 'react-dom';
import useStore from '../../stores/useStore';
import { useMapaForm, urlSeguraParaCss, calcularCA } from './MapaFormContext';
import { salvarDummie, salvarFichaSilencioso } from '../../services/firebase-sync';

export function MapaDadoAnimado() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    const { dadoAnim, abaAtiva } = ctx;

    const painelMapa = document.querySelector('.mapa-panel');
    const mapaVisivel = painelMapa && (painelMapa.offsetWidth > 0 || painelMapa.offsetHeight > 0);
    const isAbaMapa = String(abaAtiva || '').toLowerCase().includes('map');

    if (!dadoAnim.ativo || (!mapaVisivel && !isAbaMapa)) return null;

    return createPortal(
        <>
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
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(3px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div className={dadoAnim.finalResult ? 'd20-landed' : 'd20-spinning'} style={{ '--land-color': dadoAnim.cor }}>
                    <svg viewBox="0 0 100 100" style={{ width: '250px', height: '250px' }}>
                        <polygon points="50,5 95,30 95,75 50,95 5,75 5,30" fill="rgba(10,10,15,0.95)" stroke={dadoAnim.cor} strokeWidth="4" strokeLinejoin="round" />
                        <polygon points="50,85 20,35 80,35" fill="none" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="50" y1="5" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="50" y1="5" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="30" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="75" x2="80" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="95" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="50" y1="95" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="75" x2="50" y2="85" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="75" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <line x1="5" y1="30" x2="20" y2="35" stroke={dadoAnim.cor} strokeWidth="3" opacity="0.8" />
                        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="bold" fontFamily="sans-serif">{dadoAnim.numero}</text>
                    </svg>
                </div>
                {dadoAnim.finalResult && (
                    <div style={{ marginTop: '30px', color: dadoAnim.cor, fontSize: '2em', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', textShadow: `0 0 20px ${dadoAnim.cor}` }}>
                        {dadoAnim.cor === '#ff003c' ? 'CRÍTICO FATAL!' : dadoAnim.cor === '#ffcc00' ? 'CRÍTICO!' : dadoAnim.cor === '#660000' ? 'FALHA CRÍTICA' : 'ROLADO!'}
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}

export function MapaEconomiaAcoes() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    const { minhaFicha, meuNome, isMestre, jogadorHistory, dummies, personagens, toggleActionDot, jogadorDaVez } = ctx;

    let targetEntidade = { tipo: 'player', nome: meuNome, id: meuNome, data: minhaFicha };

    if (isMestre) {
        if (jogadorHistory) {
            const foundDummie = Object.entries(dummies || {}).find(([k,v]) => v.nome === jogadorHistory || k === jogadorHistory);
            if (foundDummie) targetEntidade = { tipo: 'dummie', nome: foundDummie[1].nome, id: foundDummie[0], data: foundDummie[1] };
            else if (personagens[jogadorHistory]) targetEntidade = { tipo: 'player', nome: jogadorHistory, id: jogadorHistory, data: personagens[jogadorHistory] };
        } else if (jogadorDaVez) {
            targetEntidade = { tipo: jogadorDaVez.isDummie ? 'dummie' : 'player', nome: jogadorDaVez.nome, id: jogadorDaVez.id || jogadorDaVez.nome, data: jogadorDaVez.ficha };
        }
    }

    const acoes = targetEntidade.data?.acoes || { padrao: {max:1, atual:1}, bonus: {max:1, atual:1}, reacao: {max:1, atual:1} };
    const canEdit = targetEntidade.nome === meuNome || (isMestre && targetEntidade.tipo === 'dummie');

    const renderDots = (tipo, label, color) => {
        const max = acoes[tipo]?.max || 1;
        const atual = acoes[tipo]?.atual || 0;
        const dots = [];
        for (let i = 0; i < max; i++) {
            const isAvail = i < atual;
            dots.push(
                <div key={i} onClick={() => canEdit && toggleActionDot(tipo, isAvail, targetEntidade.nome, targetEntidade.tipo === 'dummie', targetEntidade.id)}
                    style={{ width: 14, height: 14, borderRadius: '50%', background: isAvail ? color : 'transparent', border: `2px solid ${color}`, cursor: canEdit ? 'pointer' : 'default', boxShadow: isAvail ? `0 0 8px ${color}` : 'none', opacity: isAvail ? 1 : 0.3 }}
                />
            );
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.65em', color: color, fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</span>
                <div style={{ display: 'flex', gap: 4 }}>{dots}</div>
            </div>
        );
    };

    return (
        <div style={{ marginTop: 15, padding: '10px 15px', background: 'rgba(0,0,0,0.6)', border: '1px solid #333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold' }}>⚡ Ações de: <span style={{ color: '#00ffcc' }}>{targetEntidade.nome}</span>{!canEdit && <span style={{ fontSize: '0.7em', color: '#888', marginLeft: 8 }}>(Apenas Visão)</span>}</span>
                {canEdit && (
                    <button onClick={() => {
                        if (targetEntidade.tipo === 'dummie') {
                            const dData = dummies[targetEntidade.id];
                            if(dData) {
                                const nAcoes = dData.acoes ? JSON.parse(JSON.stringify(dData.acoes)) : { padrao: {max:1, atual:1}, bonus: {max:1, atual:1}, reacao: {max:1, atual:1} };
                                if (nAcoes.padrao) nAcoes.padrao.atual = nAcoes.padrao.max;
                                if (nAcoes.bonus) nAcoes.bonus.atual = nAcoes.bonus.max;
                                if (nAcoes.reacao) nAcoes.reacao.atual = nAcoes.reacao.max;
                                salvarDummie(targetEntidade.id, { ...dData, acoes: nAcoes });
                            }
                        } else {
                            ctx.updateFicha(f => {
                                if (!f.acoes) f.acoes = { padrao: {max:1, atual:1}, bonus: {max:1, atual:1}, reacao: {max:1, atual:1} };
                                if (f.acoes.padrao) f.acoes.padrao.atual = f.acoes.padrao.max;
                                if (f.acoes.bonus) f.acoes.bonus.atual = f.acoes.bonus.max;
                                if (f.acoes.reacao) f.acoes.reacao.atual = f.acoes.reacao.max;
                            });
                            salvarFichaSilencioso();
                        }
                    }} style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: '0.8em' }}>↻ Resetar</button>
                )}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
                {renderDots('padrao', 'Ação', '#00ffcc')}
                {renderDots('bonus', 'Bônus', '#ffcc00')}
                {renderDots('reacao', 'Reação', '#ff00ff')}
            </div>
        </div>
    );
}

export function MapaIniciativaTracker() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    
    const { 
        minhaFicha, iniciativaInput, setIniciativaInput, isMestre, sairDoCombate, encerrarCombate, 
        setMinhaIniciativa, avancarTurno, ordemIniciativa, turnoAtualIndex, jogadorHistory, 
        setJogadorHistory, feedCombate, getAvatarInfo, fmt, jogadorDaVez, infoDaVez, cenario,
        todasEntidades, toggleVisibilidadeToken
    } = ctx;

    return (
        <div className="def-box" style={{ marginTop: 15, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '1.1em' }}>⚡ Iniciativa & Entidades</h3>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <input className="input-neon" type="number" value={iniciativaInput} onChange={e => setIniciativaInput(e.target.value)} style={{ width: 50, padding: 4, height: 26, margin: 0 }} />
                        <button className="btn-neon btn-gold" onClick={setMinhaIniciativa} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>Rolar</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-neon" onClick={avancarTurno} style={{ borderColor: '#00ffcc', color: '#00ffcc', padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Passar Turno</button>
                    {minhaFicha?.iniciativa > 0 && <button className="btn-neon btn-red" onClick={sairDoCombate} style={{ padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Sair</button>}
                    {isMestre && <button className="btn-neon" onClick={encerrarCombate} style={{ borderColor: '#ff003c', color: '#ff003c', padding: '2px 10px', fontSize: '0.8em', margin: 0 }}>Zerar</button>}
                </div>
            </div>

            <div id="lista-turnos" style={{ display: 'flex', gap: 8, marginTop: 15, overflowX: 'auto', paddingBottom: 5, minHeight: 50 }}>
                {todasEntidades.length === 0 ? <p style={{ color: '#888', fontSize: '0.8em', margin: 0 }}>Nenhuma entidade no mapa.</p> : (
                    todasEntidades.map((entidade) => {
                        const isOculto = cenario?.tokensOcultos?.includes(entidade.id);
                        if (!isMestre && isOculto) return null;

                        const info = getAvatarInfo(entidade.ficha);
                        const isRolled = entidade.init > 0;
                        const isActive = isRolled && ordemIniciativa.length > 0 && (ordemIniciativa[turnoAtualIndex % ordemIniciativa.length]?.nome === entidade.nome);

                        return (
                            <div key={entidade.id} style={{ position: 'relative' }}>
                                <div onClick={() => setJogadorHistory(entidade.nome)} style={{ 
                                    cursor: 'pointer', minWidth: 40, height: 40, borderRadius: '50%', 
                                    border: isActive ? '3px solid #00ffcc' : (isRolled ? '2px solid #aaa' : '2px dashed #444'), 
                                    opacity: isActive ? 1 : (isOculto ? 0.3 : (isRolled ? 0.8 : 0.5)), 
                                    backgroundImage: urlSeguraParaCss(info.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7em', color: 'white', textShadow: '1px 1px 2px black' 
                                }}>{!info.img && entidade.nome.charAt(0)}</div>
                                {isMestre && <button onClick={(e) => toggleVisibilidadeToken(e, entidade.id)} style={{ position: 'absolute', top: -5, right: -5, background: isOculto ? '#ff003c' : '#000', borderRadius: '50%', padding: '2px 4px', fontSize: '10px', cursor: 'pointer', border: '1px solid #fff' }}>{isOculto ? '👻' : '👁️'}</button>}
                            </div>
                        );
                    })
                )}
            </div>

            <MapaEconomiaAcoes />

            {jogadorHistory && (
                <div style={{ marginTop: 15, padding: 15, background: 'rgba(0, 20, 40, 0.8)', border: '1px solid #0088ff', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <h4 style={{ margin: 0, color: '#0088ff' }}>Histórico: {jogadorHistory}</h4>
                        <button className="btn-neon btn-red" onClick={() => setJogadorHistory(null)} style={{ padding: '2px 8px', fontSize: '0.8em', margin: 0 }}>X</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                        {feedCombate.filter(f => f.nome === jogadorHistory).slice(-6).reverse().map((h, i) => (
                            <div key={i} style={{ fontSize: '0.85em', color: '#ccc', background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 5, borderLeft: `3px solid ${h.tipo === 'dano' ? '#ff003c' : '#f90'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ color: h.tipo === 'dano' ? '#ff003c' : h.tipo === 'acerto' ? '#f90' : '#0088ff', textTransform: 'uppercase' }}>[{h.tipo}]</strong>{h.acertoTotal && <strong style={{ color: '#fff' }}>Total: {fmt(h.acertoTotal)}</strong>}{h.dano && <strong style={{ color: '#fff' }}>Dano: {fmt(h.dano)}</strong>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {jogadorDaVez && (
                <div style={{ marginTop: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #00ffcc', backgroundImage: urlSeguraParaCss(infoDaVez?.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold', color: '#fff' }}>{(!infoDaVez || !infoDaVez.img) && jogadorDaVez.nome.charAt(0)}</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1em' }}>{jogadorDaVez.nome}</div>
                        {infoDaVez?.forma && <div style={{ color: '#00ffcc', fontSize: '0.8em' }}>{infoDaVez.forma}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

export function MapaRolagemRapida() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    const { mapStat, setMapStat, mapQD, setMapQD, mapFD, setMapFD, mapBonus, setMapBonus, mapVantagens, changeVantagem, mapDesvantagens, changeDesvantagem, mapUsarProf, setMapUsarProf, rolarAcertoRapido } = ctx;

    return (
        <div className="def-box" style={{ marginTop: 15, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap', border: '1px solid #f90' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ color: '#f90', margin: 0 }}>🎯 Ação Rápida</h4>
                <select className="input-neon" value={mapStat} onChange={e => setMapStat(e.target.value)} style={{ padding: '2px 4px', width: 90, height: 26, margin: 0 }}>
                    <option value="forca">Força</option><option value="destreza">Des</option><option value="inteligencia">Int</option><option value="sabedoria">Sab</option>
                    <option value="energiaEsp">Aura</option><option value="carisma">Car</option><option value="stamina">Sta</option><option value="constituicao">Con</option>
                </select>
                <input className="input-neon" type="number" value={mapQD} onChange={e => setMapQD(e.target.value)} style={{ width: 40, padding: 2, height: 26, margin: 0 }} /> <span style={{ color: '#aaa', fontWeight: 'bold' }}>D</span>
                <input className="input-neon" type="number" value={mapFD} onChange={e => setMapFD(e.target.value)} style={{ width: 45, padding: 2, height: 26, margin: 0 }} /> <span style={{ color: '#aaa', fontWeight: 'bold' }}>+</span>
                <input className="input-neon" type="number" value={mapBonus} onChange={e => setMapBonus(e.target.value)} style={{ width: 45, padding: 2, height: 26, margin: 0 }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #444', paddingLeft: 15 }}>
                <span style={{ color: '#0f0', fontWeight: 'bold', fontSize: '0.85em' }}>V:</span>
                <input className="input-neon" type="number" min="0" value={mapVantagens} onChange={changeVantagem} style={{ width: 40, padding: 2, height: 26, margin: 0, borderColor: '#0f0', color: '#0f0' }} />
                <span style={{ color: '#f00', fontWeight: 'bold', fontSize: '0.85em' }}>D:</span>
                <input className="input-neon" type="number" min="0" value={mapDesvantagens} onChange={changeDesvantagem} style={{ width: 40, padding: 2, height: 26, margin: 0, borderColor: '#f00', color: '#f00' }} />
                <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 5 }}><input type="checkbox" checked={mapUsarProf} onChange={e => setMapUsarProf(e.target.checked)} /> Prof</label>
            </div>

            <div style={{ flex: 1, textAlign: 'right' }}>
                <button className="btn-neon btn-gold" onClick={rolarAcertoRapido} style={{ margin: 0, padding: '4px 15px' }}>🎲 ROLAR</button>
            </div>
        </div>
    );
}

export function MapaHologramaAcao() {
    const ctx = useMapaForm();
    if (!ctx) return null;
    const { ordemIniciativa, acaoExibir, nomeBase, fichaBase, infoBase, isGrand, isCandidato, grandIconUrl, customClassIcon, defaultClassSymbol, isCritNormal, isCritFatal, isFalha, isForaDeCombate, isForaDeTurno, corImpacto, corHeader, corTextoHeader, tituloImpacto, valorImpacto, fmt, classId } = ctx;

    const emCombate = ordemIniciativa.length > 0;

    if (!emCombate && !acaoExibir) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontStyle: 'italic', border: '2px dashed #333', borderRadius: 8 }}>O campo de batalha aguarda...</div>;

    return (
        <div className="def-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: isGrand ? `3px solid #ffcc00` : (isCandidato ? `2px solid #00ccff` : `2px solid ${corImpacto}`), boxShadow: isGrand ? `0 0 30px rgba(255,0,60,0.6), inset 0 0 20px rgba(255,204,0,0.3)` : (isCandidato ? `0 0 20px rgba(0,204,255,0.4)` : `0 0 20px ${corImpacto}40`) }}>
            <div style={{ background: corHeader, color: corTextoHeader, padding: '10px', textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: '1.2em', textTransform: 'uppercase' }}>{tituloImpacto}</div>
            {acaoExibir?.tipo === 'sistema' && !acaoExibir.texto.includes('É a vez de') ? (
                 <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <h2 style={{ color: '#ffcc00', textShadow: '0 0 20px #ffcc00' }}>{acaoExibir.texto}</h2>
                 </div>
            ) : (
                <>
                    <div style={{ flex: '1', minHeight: '250px', backgroundImage: urlSeguraParaCss(infoBase?.img) || 'none', backgroundSize: 'cover', backgroundPosition: 'top center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'inset 0 -100px 50px -20px rgba(0,0,0,0.9)' }}>
                        <div style={{ padding: '20px', zIndex: 2, background: isGrand ? 'linear-gradient(to top, rgba(255,0,60,0.9), transparent)' : (isCandidato ? 'linear-gradient(to top, rgba(0,136,255,0.8), transparent)' : 'none') }}>
                            {isGrand && <div style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #ff003c', letterSpacing: 2, marginBottom: '5px' }}>👑 GRAND {classId?.toUpperCase()}</div>}
                            {isCandidato && <div style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', textShadow: '0 0 5px #0088ff', letterSpacing: 2, marginBottom: '5px' }}>🌟 CANDIDATO A {classId?.toUpperCase()}</div>}
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '2em', textShadow: isGrand ? '0 0 15px #ffcc00, 2px 2px 0px #000' : '0 0 10px #000, 2px 2px 0px #000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isGrand && grandIconUrl ? <img src={grandIconUrl} alt="Grand" style={{ height: '1.5em', width: '1.5em', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ffcc00', boxShadow: '0 0 10px #ff003c' }} /> : customClassIcon ? <img src={customClassIcon} alt={classId} style={{ height: '1.2em', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }} /> : defaultClassSymbol ? <span style={{ fontSize: '0.9em', filter: 'drop-shadow(0 0 5px rgba(0,255,204,0.5))' }}>{defaultClassSymbol}</span> : null}
                                {nomeBase}
                            </h2>
                            {infoBase?.forma && <div style={{ color: '#00ffcc', fontSize: '1.2em', fontWeight: 'bold', textShadow: '0 0 5px #000' }}>☄️ {infoBase.forma}</div>}
                        </div>
                    </div>
                    {acaoExibir && (
                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.85)', textAlign: 'center', borderTop: `1px solid ${corImpacto}` }}>
                            {isForaDeCombate && <div style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid #ffcc00', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>⚠️ Fora de Combate</div>}
                            {isForaDeTurno && <div style={{ background: 'rgba(255,0,60,0.1)', color: '#ff003c', border: '1px solid #ff003c', padding: 4, fontSize: '0.8em', marginBottom: 10, borderRadius: 4 }}>❌ Fora de Turno</div>}
                            
                            <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '5px', textTransform: 'uppercase' }}>{tituloImpacto} {(!isForaDeCombate && !isForaDeTurno && acaoExibir.tipo !== 'sistema') ? '' : `(${acaoExibir.nome})`}</div>

                            {acaoExibir.tipo === 'sistema' ? (
                                <h2 style={{ margin: '15px 0', color: '#ffcc00', textShadow: '0 0 10px #ffcc00' }}>{acaoExibir.texto}</h2>
                            ) : (
                                <>
                                    <h1 style={{ margin: 0, fontSize: '4em', color: corImpacto, textShadow: `0 0 20px ${corImpacto}` }}>{fmt(valorImpacto)}</h1>
                                    {acaoExibir.tipo === 'dano' && acaoExibir.letalidade !== undefined && <div style={{ color: '#ffcc00', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px', textShadow: '0 0 5px #ffcc00' }}>LETALIDADE: +{acaoExibir.letalidade}</div>}
                                </>
                            )}
                            
                            {acaoExibir.alvosArea && acaoExibir.alvosArea.length > 0 && (
                                <div style={{ marginTop: 15, padding: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, borderLeft: `3px solid ${acaoExibir.alvosArea.some(a=>a.acertou) ? '#0f0' : '#f00'}`, textAlign: 'left' }}>
                                    {acaoExibir.areaEf > 0 && <div style={{ color: '#00ccff', fontSize: '0.85em', marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase' }}>💥 Explosão atingiu {acaoExibir.alvosArea.length} alvo(s):</div>}
                                    {acaoExibir.alvosArea.map((a, i) => (
                                        <div key={i} style={{ color: a.acertou ? '#0f0' : '#f00', fontWeight: 'bold', fontSize: '0.9em', marginBottom: 2 }}>
                                            {a.acertou ? `🎯 Superou ${a.nome} (Def: ${a.defesa})!` : `❌ Falhou vs ${a.nome} (Def: ${a.defesa})!`}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {fichaBase && acaoExibir?.tipo !== 'sistema' && (
                        <div style={{ padding: '15px', background: '#050505' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4d', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>HP</span><span>{fmt(fichaBase.vida?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4dffff', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>MP</span><span>{fmt(fichaBase.mana?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffff4d', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>AU</span><span>{fmt(fichaBase.aura?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CK</span><span>{fmt(fichaBase.chakra?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff66ff', fontWeight: 'bold' }}><span style={{ fontSize: '0.8em', alignSelf: 'center' }}>CP</span><span>{fmt(fichaBase.corpo?.atual)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ color: '#0088ff', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #0088ff' }}>🛡️ EVA: {calcularCA(fichaBase, 'evasiva')}</div>
                                    <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9em', textShadow: '0 0 5px #ccc' }}>🛡️ RES: {calcularCA(fichaBase, 'resistencia')}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}