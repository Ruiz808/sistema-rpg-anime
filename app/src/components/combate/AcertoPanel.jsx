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
    const { minhaFicha, meuNome, setAbaAtiva, updateFicha, alvoSelecionado, dummies } = useStore(); 

    const [dados, setDados] = useState(1);
    const [faces, setFaces] = useState(20);
    const [proficiencia, setProficiencia] = useState(0);
    const [bonus, setBonus] = useState(0);
    
    const vantagens = minhaFicha.ataqueConfig?.vantagens || 0;
    const desvantagens = minhaFicha.ataqueConfig?.desvantagens || 0;
    
    const [statsSelecionados, setStatsSelecionados] = useState(['destreza']);

    const bonusAcertoClasse = minhaFicha ? getPoderesDefesa(minhaFicha, 'bonus_acerto') : 0;

    // 🔥 FILTRO SUPREMO PARA VISUALIZAÇÃO DA MAESTRIA DE ARMA
    const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    const tiposArmasEquipadas = itensEquipados
        .filter(i => i.tipo === 'arma' || i.tipo === 'artefato')
        .map(i => String(i.arma || i.subTipo || i.categoria || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

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
        const qD = parseInt(dados) || 1;
        const fD = parseInt(faces) || 20;
        const prof = parseInt(proficiencia) || 0;
        const bon = parseInt(bonus) || 0;
        const v = parseInt(vantagens) || 0;
        const d = parseInt(desvantagens) || 0;
        
        const sels = statsSelecionados.length > 0 ? statsSelecionados : ['destreza'];
        
        const result = calcularAcerto({ 
            qD, fD, prof, bonus: bon, sels, minhaFicha, itensEquipados, 
            vantagens: v, desvantagens: d 
        });

        let extraData = {};
        if (alvoSelecionado && dummies[alvoSelecionado]) {
            const alvo = dummies[alvoSelecionado];
            const acertou = result.acertoTotal >= alvo.valorDefesa; 
            extraData = { alvoNome: alvo.nome, alvoDefesa: alvo.valorDefesa, acertouAlvo: acertou };
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, ...extraData };
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

                {/* 🔥 AVISO VISUAL DA MAESTRIA DE ARMA COM O NOVO FILTRO */}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Base</label>
                        <input className="input-neon" type="number" value={dados} onChange={e => setDados(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces</label>
                        <input className="input-neon" type="number" value={faces} onChange={e => setFaces(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiência</label>
                        <input className="input-neon" type="number" value={proficiencia} onChange={e => setProficiencia(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bônus Fixo</label>
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

                <button className="btn-neon btn-gold" onClick={rolarAcerto} style={{ marginTop: 15, width: '100%', borderColor: '#f90', color: '#f90' }}>
                    {alvoSelecionado && dummies[alvoSelecionado] ? `TENTAR ACERTAR ${dummies[alvoSelecionado].nome.toUpperCase()}` : 'ROLAR ACERTO (SEM ALVO)'}
                </button>
            </div>
        </div>
    );
}