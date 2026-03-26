import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { enviarParaFeed, salvarFichaSilencioso } from '../../services/firebase-sync';

const SAVES = [
    { id: 'forca', label: 'Força', attr: 'forca', cor: '#ff4d4d' },
    { id: 'destreza', label: 'Destreza', attr: 'destreza', cor: '#ffaa00' },
    { id: 'constituicao', label: 'Constituição', attr: 'constituicao', cor: '#ffcc00' },
    { id: 'stamina', label: 'Stamina', attr: 'stamina', cor: '#aaff00' },
    { id: 'sabedoria', label: 'Sabedoria', attr: 'sabedoria', cor: '#00ffcc' },
    { id: 'inteligencia', label: 'Inteligência', attr: 'inteligencia', cor: '#0088ff' },
    { id: 'energiaEsp', label: 'Energia Esp.', attr: 'energiaEsp', cor: '#cc00ff' },
    { id: 'carisma', label: 'Carisma', attr: 'carisma', cor: '#ff00ff' }
];

const SKILLS = [
    { id: 'acrobacia', label: 'Acrobacia', attr: 'destreza' },
    { id: 'adestrar', label: 'Adestrar Animal', attr: 'carisma' },
    { id: 'arcana', label: 'Arcana', attr: 'inteligencia' },
    { id: 'armamento', label: 'Armamento', attr: 'sabedoria' },
    { id: 'atletismo', label: 'Atletismo', attr: 'forca' },
    { id: 'atuacao', label: 'Atuação', attr: 'carisma' },
    { id: 'atualidades', label: 'Atualidades', attr: 'sabedoria' },
    { id: 'barganha', label: 'Barganha', attr: 'carisma' }, 
    { id: 'criacao', label: 'Criação', attr: 'sabedoria' },
    { id: 'diplomacia', label: 'Diplomacia', attr: 'carisma' },
    { id: 'furtividade', label: 'Furtividade', attr: 'destreza' },
    { id: 'geografia', label: 'Geografia', attr: 'sabedoria' },
    { id: 'historia', label: 'História', attr: 'sabedoria' },
    { id: 'intimida', label: 'Intimidação', attr: 'carisma' },
    { id: 'intuicao', label: 'Intuição', attr: 'sabedoria' },
    { id: 'linguas', label: 'Línguas', attr: 'sabedoria' },
    { id: 'medicina', label: 'Medicina', attr: 'sabedoria' },
    { id: 'natureza', label: 'Natureza', attr: 'stamina' },
    { id: 'ocultismo', label: 'Ocultismo', attr: 'energiaEsp' },
    { id: 'percepcao', label: 'Percepção', attr: 'sabedoria' },
    { id: 'pilot_barcos', label: 'Pilotagem (Barcos)', attr: 'destreza' },
    { id: 'pilot_carros', label: 'Pilotagem (Carros)', attr: 'destreza' },
    { id: 'pilot_aereo', label: 'Pilotagem (Helic/Aviões)', attr: 'destreza' },
    { id: 'pilot_motos', label: 'Pilotagem (Motos/Cavalos)', attr: 'destreza' },
    { id: 'prestidigitacao', label: 'Prestidigitação', attr: 'destreza' },
    { id: 'procurar', label: 'Procurar', attr: 'sabedoria' },
    { id: 'religiao', label: 'Religião', attr: 'sabedoria' },
    { id: 'sentir_motiv', label: 'Sentir Motivação', attr: 'energiaEsp' },
    { id: 'sobrevivencia', label: 'Sobrevivência', attr: 'sabedoria' },
    { id: 'tecnologia', label: 'Tecnologia', attr: 'sabedoria' },
    { id: 'topografia', label: 'Topografia', attr: 'sabedoria' },
    { id: 'trapacear', label: 'Trapacear', attr: 'carisma' },
    { id: 'voo', label: 'Voo', attr: 'destreza' }
];

export default function TestesPanel() {
    const { minhaFicha, meuNome, setAbaAtiva, updateFicha } = useStore();

    const [dadosConfig, setDadosConfig] = useState(1);
    const [facesConfig, setFacesConfig] = useState(20);
    const [bonusConfig, setBonusConfig] = useState(0);
    const [filtro, setFiltro] = useState('');

    const profGlobal = parseInt(minhaFicha.proficienciaBase) || 0;

    const getModificadorDoisDigitos = (valorAttr) => {
        if (!valorAttr) return 0;
        const strVal = String(valorAttr).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    };

    const rolarDado = (qtd, faces) => {
        let sum = 0;
        let rolls = [];
        for (let i = 0; i < qtd; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            rolls.push(r);
            sum += r;
        }
        return { sum, details: rolls };
    };

    // 🔥 ALTERNAR O NÍVEL DE PROFICIÊNCIA (0, 1, 2)
    const toggleProf = (id) => {
        updateFicha(f => {
            if (!f.proficiencias) f.proficiencias = {};
            const cur = f.proficiencias[id] || 0;
            f.proficiencias[id] = (cur + 1) % 3; // Gira entre: 0 (Sem), 1 (Prof), 2 (Expertise)
        });
        salvarFichaSilencioso();
    };

    const getProfLevel = (id) => minhaFicha.proficiencias?.[id] || 0;

    const executarRolagem = (skillId, nomeTeste, tipoAttr, isSavingThrow = false) => {
        const qD = parseInt(dadosConfig) || 1;
        const fD = parseInt(facesConfig) || 20;
        const bonusFixo = parseInt(bonusConfig) || 0;

        const valBruto = minhaFicha[tipoAttr]?.base || 0;
        const modBase = getModificadorDoisDigitos(valBruto);

        // 🧠 CÁLCULO DA PROFICIÊNCIA (Base x Nível)
        const profNivel = getProfLevel(skillId);
        const valorProficiencia = profNivel * profGlobal; 

        const rolagem = rolarDado(qD, fD);
        const total = rolagem.sum + modBase + valorProficiencia + bonusFixo;

        const tipoFeed = isSavingThrow ? 'saving' : 'skill';
        
        let stringDados = `[${rolagem.details.join(', ')}]`;
        if (qD === 1) {
            if (rolagem.sum === 20 && fD === 20) stringDados = `[<strong>20</strong>] (CRÍTICO!)`;
            if (rolagem.sum === 1 && fD === 20) stringDados = `[<strong style="color:#ff003c;">1</strong>] (FALHA CRÍTICA!)`;
        }

        let detalheProf = profNivel === 2 ? `Expertise (+${valorProficiencia})` : profNivel === 1 ? `Proficiente (+${valorProficiencia})` : `S/ Prof (+0)`;

        const detalheCalc = `🎲 Dados: ${stringDados} <br/> 📈 Mod. ${tipoAttr.toUpperCase()} (${modBase}) + ${detalheProf} + Bônus (${bonusFixo})`;

        enviarParaFeed({
            tipo: tipoFeed,
            nome: meuNome,
            nomeTeste: nomeTeste,
            atributoAlvo: tipoAttr,
            total: total,
            detalheCalc: detalheCalc
        });

        setAbaAtiva('aba-log');
    };

    const skillsFiltradas = SKILLS.filter(s => s.label.toLowerCase().includes(filtro.toLowerCase()));

    return (
        <div className="testes-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 🔥 CONFIGURAÇÕES DE DADOS E PROFICIÊNCIA BASE */}
            <div className="def-box" style={{ border: '1px solid #00ffcc', background: 'rgba(0, 255, 204, 0.05)' }}>
                <h3 style={{ color: '#00ffcc', marginTop: 0, marginBottom: 10 }}>⚙️ Modificadores Globais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 15 }}>
                    
                    <div style={{ background: 'rgba(255,204,0,0.1)', padding: '5px 10px', borderRadius: 5, borderLeft: '3px solid #ffcc00' }}>
                        <label style={{ color: '#ffcc00', fontSize: '0.85em', fontWeight: 'bold' }}>Sua Proficiência (Base)</label>
                        <input 
                            className="input-neon" 
                            type="number" 
                            min="0"
                            value={minhaFicha.proficienciaBase ?? 2} 
                            onChange={e => {
                                updateFicha(f => { f.proficienciaBase = parseInt(e.target.value) || 0; });
                                salvarFichaSilencioso();
                            }}
                            style={{ borderColor: '#ffcc00', color: '#ffcc00', width: '100%' }} 
                        />
                    </div>

                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Qtd. Dados</label>
                        <input className="input-neon" type="number" min="1" value={dadosConfig} onChange={e => setDadosConfig(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                        <input className="input-neon" type="number" min="2" value={facesConfig} onChange={e => setFacesConfig(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bônus Fixo Extra (+)</label>
                        <input className="input-neon" type="number" value={bonusConfig} onChange={e => setBonusConfig(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* SAVING THROWS */}
            <div className="def-box">
                <h3 style={{ color: '#ffcc00', marginTop: 0, marginBottom: 15 }}>🛡️ Saving Throws (Resistências)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {SAVES.map(save => {
                        const pNivel = getProfLevel(save.id);
                        const valBase = getModificadorDoisDigitos(minhaFicha[save.attr]?.base);
                        const totalMod = valBase + (pNivel * profGlobal);

                        return (
                            <div key={save.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button 
                                    className="btn-neon" 
                                    onClick={() => executarRolagem(save.id, save.label, save.attr, true)}
                                    style={{ borderColor: save.cor, color: save.cor, margin: 0, padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{save.label}</span>
                                    <span style={{ fontSize: '0.8em', color: '#fff', marginTop: 4 }}>Mod Total: +{totalMod}</span>
                                </button>
                                <button 
                                    className="btn-neon"
                                    onClick={() => toggleProf(save.id)}
                                    style={{ padding: '2px', fontSize: '0.8em', borderColor: pNivel === 2 ? '#ffcc00' : pNivel === 1 ? '#00ffcc' : '#444', color: '#fff', margin: 0, background: pNivel > 0 ? 'rgba(0,0,0,0.5)' : 'transparent' }}
                                >
                                    {pNivel === 2 ? '🌟 Expertise (x2)' : pNivel === 1 ? '🟢 Proficiente' : '⭕ S/ Prof.'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* TESTES DE HABILIDADE */}
            <div className="def-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                    <h3 style={{ color: '#0088ff', margin: 0 }}>🎯 Testes de Perícia</h3>
                    <input 
                        className="input-neon" 
                        type="text" 
                        placeholder="🔍 Buscar Perícia..." 
                        value={filtro} 
                        onChange={e => setFiltro(e.target.value)} 
                        style={{ width: '200px', margin: 0, borderColor: '#0088ff' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    {skillsFiltradas.length > 0 ? skillsFiltradas.map(skill => {
                        const pNivel = getProfLevel(skill.id);
                        const valBase = getModificadorDoisDigitos(minhaFicha[skill.attr]?.base);
                        const totalMod = valBase + (pNivel * profGlobal);

                        return (
                            <div key={skill.id} style={{ display: 'flex', gap: 5, alignItems: 'stretch' }}>
                                <button 
                                    className="btn-neon" 
                                    onClick={() => executarRolagem(skill.id, skill.label, skill.attr, false)}
                                    style={{ flex: 1, borderColor: '#444', color: '#fff', margin: 0, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', transition: 'border-color 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = '#0088ff'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = '#444'}
                                >
                                    <span style={{ fontWeight: 'bold', textAlign: 'left' }}>{skill.label}</span>
                                    <span style={{ fontSize: '0.7em', color: '#0088ff', background: 'rgba(0,136,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                                        {skill.attr.substring(0, 3).toUpperCase()} (+{totalMod})
                                    </span>
                                </button>
                                <button 
                                    className="btn-neon"
                                    onClick={() => toggleProf(skill.id)}
                                    style={{ padding: '0 10px', fontSize: '1.2em', borderColor: pNivel === 2 ? '#ffcc00' : pNivel === 1 ? '#00ffcc' : '#444', margin: 0, background: 'rgba(0,0,0,0.5)' }}
                                    title={pNivel === 2 ? 'Expertise' : pNivel === 1 ? 'Proficiente' : 'Sem Proficiência'}
                                >
                                    {pNivel === 2 ? '🌟' : pNivel === 1 ? '🟢' : '⭕'}
                                </button>
                            </div>
                        );
                    }) : (
                        <p style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center' }}>Nenhuma perícia encontrada.</p>
                    )}
                </div>
            </div>

        </div>
    );
}