import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { calcularAcerto } from '../../core/engine';
import { getPoderesDefesa, getEfeitosDeClasse } from '../../core/attributes'; 
import { enviarParaFeed, salvarFichaSilencioso } from '../../services/firebase-sync';

const STATS_LIST = [
    { value: 'forca', label: 'Forca' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' },
    { value: 'energiaEsp', label: 'Energia Esp.' },
    { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' },
    { value: 'constituicao', label: 'Constituicao' },
];

export default function AcertoPanel() {
    const { minhaFicha, meuNome, setAbaAtiva, updateFicha, alvoSelecionado, dummies, cenario } = useStore(); 

    const [dados, setDados] = useState(1);
    const [faces, setFaces] = useState(20);
    const [usarProficiencia, setUsarProficiencia] = useState(false);
    const [bonus, setBonus] = useState(0);
    
    const vantagens = minhaFicha.ataqueConfig?.vantagens || 0;
    const desvantagens = minhaFicha.ataqueConfig?.desvantagens || 0;
    const profGlobal = parseInt(minhaFicha.proficienciaBase) || 0;
    
    const [statsSelecionados, setStatsSelecionados] = useState(['destreza']);

    const bonusAcertoClasse = minhaFicha ? getPoderesDefesa(minhaFicha, 'bonus_acerto') : 0;

    const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    const armasEquipadas = itensEquipados.filter(i => i.tipo === 'arma' || i.tipo === 'artefato');
    
    const tiposArmasEquipadas = armasEquipadas.map(i => 
        String(i.armaTipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const efeitosClasse = minhaFicha ? getEfeitosDeClasse(minhaFicha) : [];
    let bonusMaestriaArma = 0;
    let nomesMaestriaArma = [];

    efeitosClasse.forEach(ef => {
        let propNormalizada = (ef.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (propNormalizada === 'proficiencia_arma') {
            const armaAlvo = (ef.atributo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (tiposArmasEquipadas.includes(armaAlvo)) {
                bonusMaestriaArma += (parseFloat(ef.valor) || 0);
                nomesMaestriaArma.push(ef.atributo.trim().toUpperCase());
            }
        }
    });

    // 🔥 O RADAR TÁTICO: Cálculo de Distância e Área (Chebyshev para Grid)
    const alvoDummie = alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado] : null;
    let distQuadrados = 0;
    let distReal = 0;
    let maxAlcance = 1;
    let maxArea = 0; 
    let isForaDeAlcance = false;
    let unidadeEscala = 'm';

    if (alvoDummie && minhaFicha.posicao && alvoDummie.posicao) {
        const cenaAtivaId = cenario?.ativa || 'default';
        const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5, unidade: 'm' };
        const escala = cenaAtual.escala || 1.5;
        unidadeEscala = cenaAtual.unidade || 'm';

        const dx = Math.abs((minhaFicha.posicao.x || 0) - (alvoDummie.posicao.x || 0));
        const dy = Math.abs((minhaFicha.posicao.y || 0) - (alvoDummie.posicao.y || 0));
        const dz = Math.abs((minhaFicha.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala;

        distQuadrados = Math.max(dx, dy, Math.floor(dz));
        distReal = distQuadrados * escala;

        const maxAlcanceArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.alcance || 1)) : 1;
        const maxAreaArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.areaQuad || a.area || 0)) : 0;
        
        const poderesAtivos = (minhaFicha.poderes || []).filter(p => p.ativa);
        const maxAlcancePoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.alcance || 1)) : 1;
        const maxAreaPoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.areaQuad || p.area || 0)) : 0;
        
        // 🔥 INCLUSÃO DO GRIMÓRIO (Corrigindo o Bug da Bola de Fogo!)
        const magiasEquipadas = (minhaFicha.ataquesElementais || []).filter(m => m.equipado);
        const maxAlcanceMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.alcanceQuad || 1)) : 1;
        const maxAreaMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.areaQuad || 0)) : 0;
        
        maxAlcance = Math.max(maxAlcanceArmas, maxAlcancePoderes, maxAlcanceMagias);
        maxArea = Math.max(maxAreaArmas, maxAreaPoderes, maxAreaMagias);
        
        isForaDeAlcance = distQuadrados > maxAlcance;
    }

    function changeVantagem(e) {
        updateFicha(f => {
            if(!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.vantagens = parseInt(e.target.value) || 0;
        });
        salvarFichaSilencioso();
    }

    function changeDesvantagem(e) {
        updateFicha(f => {
            if(!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.desvantagens = parseInt(e.target.value) || 0;
        });
        salvarFichaSilencioso();
    }

    function toggleStat(value) {
        setStatsSelecionados(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value);
            return [...prev, value];
        });
    }

    function rolarAcerto() {
        if (isForaDeAlcance) {
            alert('Aviso: O alvo está fora do seu alcance efetivo!');
            return;
        }

        const qD = parseInt(dados) || 1;
        const fD = parseInt(faces) || 20;
        const bon = parseInt(bonus) || 0; 
        const prof = usarProficiencia ? profGlobal : 0;
        
        const v = parseInt(vantagens) || 0;
        const d = parseInt(desvantagens) || 0;
        
        const sels = statsSelecionados.length > 0 ? statsSelecionados : ['destreza'];
        
        const result = calcularAcerto({ 
            qD, fD, prof, bonus: bon, sels, minhaFicha, itensEquipados, 
            vantagens: v, desvantagens: d 
        });

        let alvosAtingidos = [];

        // 🔥 VARREDURA DE MAPA (MÚLTIPLOS ALVOS NA ÁREA DA EXPLOSÃO) 🔥
        if (alvoDummie) {
            if (maxArea > 0) {
                const cenaAtivaId = cenario?.ativa || 'default';
                const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5 };
                const escala = cenaAtual.escala || 1.5;

                Object.entries(dummies).forEach(([id, dummieObj]) => {
                    const isSameScene = (dummieObj.cenaId || 'default') === (alvoDummie.cenaId || 'default');
                    if (isSameScene && dummieObj.posicao && alvoDummie.posicao) {
                        const dX = Math.abs(dummieObj.posicao.x - alvoDummie.posicao.x);
                        const dY = Math.abs(dummieObj.posicao.y - alvoDummie.posicao.y);
                        const dZ = Math.floor(Math.abs((dummieObj.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);
                        
                        if (Math.max(dX, dY, dZ) <= maxArea) {
                            alvosAtingidos.push({
                                nome: dummieObj.nome,
                                defesa: dummieObj.valorDefesa,
                                acertou: result.acertoTotal >= dummieObj.valorDefesa
                            });
                        }
                    }
                });
            } else {
                alvosAtingidos.push({
                    nome: alvoDummie.nome,
                    defesa: alvoDummie.valorDefesa,
                    acertou: result.acertoTotal >= alvoDummie.valorDefesa
                });
            }
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, alvosArea: alvosAtingidos, areaEf: maxArea };
        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }

    return (
        <div className="acerto-panel">
            <div className="def-box">
                <h3 style={{ color: '#f90', marginBottom: 5 }}>Rolagem de Acerto</h3>

                {bonusAcertoClasse > 0 && (
                    <p style={{ color: '#0f0', fontSize: '0.85em', margin: '0 0 10px 0', textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>
                        ✨ Instinto de Batalha: A sua classe concede +{bonusAcertoClasse} de Acerto passivo!
                    </p>
                )}

                {bonusMaestriaArma > 0 && (
                    <p style={{ color: '#00ffcc', fontSize: '0.85em', margin: '0 0 10px 0', textShadow: '0 0 5px rgba(0,255,204,0.5)' }}>
                        ⚔️ Mestre de Armas: A sua classe concede +{bonusMaestriaArma} de Acerto ao usar [{nomesMaestriaArma.join(', ')}]!
                    </p>
                )}

                <div style={{ marginBottom: 10 }}>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Atributos de Acerto:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                        {STATS_LIST.map(st => (
                            <label key={st.value} style={{ color: statsSelecionados.includes(st.value) ? '#f90' : '#888', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="checkbox"
                                    className="chk-stat-act"
                                    value={st.value}
                                    checked={statsSelecionados.includes(st.value)}
                                    onChange={() => toggleStat(st.value)}
                                />
                                {st.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Base</label>
                        <input className="input-neon" type="number" value={dados} onChange={e => setDados(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces</label>
                        <input className="input-neon" type="number" value={faces} onChange={e => setFaces(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Arma Proficiente?</label>
                        <div style={{ display: 'flex', alignItems: 'center', height: '34px' }}>
                            <input 
                                type="checkbox" 
                                checked={usarProficiencia} 
                                onChange={e => setUsarProficiencia(e.target.checked)} 
                                style={{ transform: 'scale(1.5)', marginLeft: 10 }} 
                                title={`Soma a sua Proficiência Global (+${profGlobal}) ao Acerto`}
                            />
                            {usarProficiencia && <span style={{ color: '#00ffcc', marginLeft: 8, fontWeight: 'bold' }}>+{profGlobal}</span>}
                        </div>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Bônus Fixo / Temp.
                            {(bonusAcertoClasse > 0 || bonusMaestriaArma > 0) && (
                                <span style={{ color: '#0f0', fontSize: '0.9em', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,0,0.3)' }}>
                                    (Buff: +{bonusAcertoClasse + bonusMaestriaArma})
                                </span>
                            )}
                        </label>
                        <input className="input-neon" type="number" value={bonus} onChange={e => setBonus(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 5 }}>
                    <div>
                        <label style={{ color: '#0f0', fontSize: '0.85em', textShadow: '0 0 5px #0f0' }}>+ Vantagens</label>
                        <input className="input-neon" type="number" min="0" value={vantagens} onChange={changeVantagem} style={{ borderColor: '#0f0', color: '#0f0' }} />
                    </div>
                    <div>
                        <label style={{ color: '#ff003c', fontSize: '0.85em', textShadow: '0 0 5px #ff003c' }}>- Desvantagens</label>
                        <input className="input-neon" type="number" min="0" value={desvantagens} onChange={changeDesvantagem} style={{ borderColor: '#ff003c', color: '#ff003c' }} />
                    </div>
                </div>

                {armasEquipadas.length > 0 && (
                    <div style={{ marginTop: 15, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '2px solid #aaa' }}>
                        <span style={{ color: '#aaa', fontSize: '0.75em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🔍 Scanner de Arsenal:</span>
                        {armasEquipadas.map((w, idx) => (
                            <div key={idx} style={{ color: '#ccc', fontSize: '0.8em' }}>
                                • {w.nome} <span style={{color: '#00ffcc'}}>(Categoria: {w.armaTipo || 'Nenhuma'})</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 🔥 HUD DE DISTÂNCIA E ALCANCE ATUALIZADO */}
                {alvoDummie && (
                    <div style={{ marginTop: 15, padding: '10px', background: isForaDeAlcance ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', border: `1px solid ${isForaDeAlcance ? '#ff003c' : '#0f0'}`, borderRadius: '5px', textAlign: 'center' }}>
                        <span style={{ color: isForaDeAlcance ? '#ff003c' : '#0f0', fontWeight: 'bold', fontSize: '1.1em' }}>
                            🎯 Alvo: {alvoDummie.nome} | Distância: {distQuadrados}Q ({distReal.toFixed(1)} {unidadeEscala})
                        </span>
                        <br/>
                        <span style={{ color: '#aaa', fontSize: '0.85em' }}>Seu Alcance Efetivo: {maxAlcance}Q {maxArea > 0 && <span style={{color: '#ff00ff', fontWeight: 'bold'}}>| Explosão: {maxArea}Q</span>}</span>
                        {isForaDeAlcance && <div style={{ color: '#ff003c', marginTop: 5, fontWeight: 'bold', textShadow: '0 0 5px #ff003c' }}>⚠️ FORA DE ALCANCE! APROXIME-SE!</div>}
                    </div>
                )}

                <button 
                    className="btn-neon btn-gold" 
                    onClick={rolarAcerto} 
                    disabled={isForaDeAlcance}
                    style={{ marginTop: 15, width: '100%', borderColor: isForaDeAlcance ? '#555' : '#f90', color: isForaDeAlcance ? '#555' : '#f90', opacity: isForaDeAlcance ? 0.5 : 1 }}
                >
                    {alvoSelecionado && alvoDummie 
                        ? (isForaDeAlcance ? 'MUITO LONGE PARA ATACAR' : (maxArea > 0 ? `💥 DISPARAR EXPLOSÃO NO ALVO` : `TENTAR ACERTAR ${alvoDummie.nome.toUpperCase()}`)) 
                        : 'ROLAR ACERTO (SEM ALVO)'}
                </button>
            </div>
        </div>
    );
}