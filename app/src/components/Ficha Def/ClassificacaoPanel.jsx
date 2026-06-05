import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

// ==========================================
// 🖋️ INPUTS MÁGICOS INTERNOS
// ==========================================
let globalTimer = null;
const callSave = () => {
    if (globalTimer) clearTimeout(globalTimer);
    globalTimer = setTimeout(() => { salvarFichaSilencioso(); }, 400);
};

const CampoMagico = ({ valor, onChange, placeholder, styleExtra = {}, type = "text" }) => {
    return (
        <input 
            type={type} value={valor || ''} onChange={e => onChange(e.target.value)} 
            onBlur={() => callSave()} placeholder={placeholder}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed currentColor', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', outline: 'none', padding: '5px', width: '100%', ...styleExtra }} 
        />
    );
};

const AreaMagica = ({ valor, onChange, placeholder, styleExtra = {} }) => (
    <textarea 
        value={valor || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onBlur={() => callSave()}
        style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', borderBottom: '2px dotted currentColor', color: 'inherit', fontFamily: 'inherit', padding: '8px', outline: 'none', resize: 'vertical', ...styleExtra }}
    />
);

// ==========================================
// 📜 O PAINEL DE CLASSIFICAÇÃO (PÁGINA 4)
// ==========================================
export default function ClassificacaoPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const isMestre = useStore(s => s.isMestre);

    // ==========================================
    // 👑 1. LÓGICA DA HIERARQUIA DE LORE
    // ==========================================
    const hierarquia = minhaFicha?.hierarquia || {};
    const hPoder = hierarquia.poder || false;
    const hInfinity = hierarquia.infinity || false;
    const hSingularidade = hierarquia.singularidade || '';
    
    let tituloSupremo = 'MUNDANO';
    let corSuprema = minhaFicha?.estetica?.corTintaRadar || '#000000';
    let nomeHabilidadeDestaque = hierarquia.singularidadeNome || hierarquia.infinityNome || hierarquia.poderNome || '';

    if (hSingularidade === '0') { tituloSupremo = 'SINGULARIDADE GRAU 0'; corSuprema = '#ff00ff'; } 
    else if (hSingularidade === '1') { tituloSupremo = 'SINGULARIDADE GRAU 1'; corSuprema = '#ff003c'; } 
    else if (hSingularidade === '2') { tituloSupremo = 'SINGULARIDADE GRAU 2'; corSuprema = '#ff8800'; } 
    else if (hSingularidade === '3') { tituloSupremo = 'SINGULARIDADE GRAU 3'; corSuprema = '#ffcc00'; } 
    else if (hInfinity) { tituloSupremo = 'INFINITY'; corSuprema = '#00ccff'; } 
    else if (hPoder) { tituloSupremo = 'PODER'; corSuprema = '#00ffcc'; }

    // Arrays para as capacidades detalhadas
    const handleArrayItem = (chave, acao, index, campo, valor) => {
        updateFicha((ficha) => {
            if (!ficha[chave]) ficha[chave] = [];
            if (acao === 'add') ficha[chave].push({ nome: '', custo: '', dano: '', descricao: '' });
            else if (acao === 'remove') ficha[chave].splice(index, 1);
            else if (acao === 'update') ficha[chave][index][campo] = valor;
        });
        callSave();
    };

    // ==========================================
    // ⚔️ 2. LÓGICA DOS MARCADORES DE CENA
    // ==========================================
    const [novoMarcadorNome, setNovoMarcadorNome] = useState('');
    const [novoMarcadorBonus, setNovoMarcadorBonus] = useState('');

    const addMarcador = () => {
        if (!novoMarcadorNome.trim() || !novoMarcadorBonus) return;
        updateFicha(f => {
            if (!f.marcadores) f.marcadores = [];
            f.marcadores.push({ nome: novoMarcadorNome.trim(), bonus: Number(novoMarcadorBonus), stacks: 1 });
        });
        setNovoMarcadorNome(''); setNovoMarcadorBonus('');
        callSave();
    };

    const updateStack = (index, delta) => {
        updateFicha(f => {
            if (!f.marcadores) return;
            f.marcadores[index].stacks += delta;
            if (f.marcadores[index].stacks < 0) f.marcadores[index].stacks = 0;
        });
        callSave();
    };

    const resetCena = () => {
        if (!window.confirm("Apagar todos os marcadores da cena?")) return;
        updateFicha(f => { f.marcadores = []; });
        callSave();
    };

    // ==========================================
    // 🌌 3. LÓGICA DA FORJA DE CALAMIDADE
    // ==========================================
    const [forja, setForja] = useState({ vida: true, energias: true, status: false, multGeral: false, danoBruto: true });
    const [forjaValor, setForjaValor] = useState('');

    const injetarForja = () => {
        const val = Number(forjaValor);
        if (isNaN(val) || val === 0) return alert("A Forja exige um valor numérico válido para injetar na alma.");
        if (!window.confirm(`Você está prestes a fundir +${val} aos atributos selecionados permanentemente. Proceder?`)) return;

        updateFicha(f => {
            if (forja.vida) { f.vida = f.vida || {}; f.vida.base = (Number(f.vida.base) || 0) + val; }
            if (forja.energias) {
                ['mana', 'aura', 'chakra', 'corpo'].forEach(k => { f[k] = f[k] || {}; f[k].base = (Number(f[k].base) || 0) + val; });
            }
            if (forja.status) {
                ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'].forEach(k => { f[k] = f[k] || {}; f[k].base = (Number(f[k].base) || 0) + val; });
            }
            if (forja.multGeral) { f.dano = f.dano || {}; f.dano.mGeral = (Number(f.dano.mGeral) || 1) + val; }
            if (forja.danoBruto) { f.dano = f.dano || {}; f.dano.danoBruto = (Number(f.dano.danoBruto) || 0) + val; }
        });
        setForjaValor('');
        callSave();
        alert("Evolução Absoluta Injetada na Alma!");
    };

    return (
        <div className="grimorio-estilo-papel" style={{ width: '100%', paddingBottom: '30px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed currentColor` }}>
                    Classificação Arcana
                </h1>
                <p style={{ opacity: 0.7, fontStyle: 'italic', marginTop: '5px' }}>As anomalias inatas, escalonamento de cena e forja absoluta.</p>
            </div>

            {/* 👑 BANNER DO GRAU */}
            <div style={{ textAlign: 'center', padding: '30px', border: `3px double ${corSuprema}`, background: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.2em', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>Grau de Calamidade Atual</h2>
                <div style={{ fontSize: '2.5em', fontWeight: '900', color: corSuprema, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {tituloSupremo}
                </div>
                {nomeHabilidadeDestaque && (
                    <div style={{ fontSize: '1.8em', fontWeight: 'bold', fontStyle: 'italic', marginTop: '10px' }}>
                        "{nomeHabilidadeDestaque}"
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                
                {/* 🌀 ARSENAL DE PODERES */}
                <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4em' }}>🌀 Poderes Inatos</h2>
                        <button onClick={() => handleArrayItem('poderes', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em' }}>+ Escrever</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {(minhaFicha.poderes || []).map((pod, i) => (
                            <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                                <button onClick={() => { if(window.confirm('Apagar Poder?')) handleArrayItem('poderes', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✖</button>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px', paddingRight: '20px' }}>
                                    <CampoMagico valor={pod.nome} onChange={v => handleArrayItem('poderes', 'update', i, 'nome', v)} placeholder="Nome do Poder" styleExtra={{ fontWeight: 'bold' }} />
                                    <CampoMagico valor={pod.custo} onChange={v => handleArrayItem('poderes', 'update', i, 'custo', v)} placeholder="Custo" styleExtra={{ width: '80px' }} />
                                </div>
                                <AreaMagica valor={pod.descricao} onChange={v => handleArrayItem('poderes', 'update', i, 'descricao', v)} placeholder="Descreva os efeitos inatos..." styleExtra={{ minHeight: '40px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ♾️ O INFINITY */}
                <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4em' }}>♾️ Infinitys</h2>
                        <button onClick={() => handleArrayItem('infinitys', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em' }}>+ Escrever</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {(minhaFicha.infinitys || []).map((inf, i) => (
                            <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                                <button onClick={() => { if(window.confirm('Apagar Infinity?')) handleArrayItem('infinitys', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✖</button>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px', paddingRight: '20px' }}>
                                    <CampoMagico valor={inf.nome} onChange={v => handleArrayItem('infinitys', 'update', i, 'nome', v)} placeholder="Nome do Domínio" styleExtra={{ fontWeight: 'bold' }} />
                                    <CampoMagico valor={inf.custo} onChange={v => handleArrayItem('infinitys', 'update', i, 'custo', v)} placeholder="Gatilho" styleExtra={{ width: '80px' }} />
                                </div>
                                <AreaMagica valor={inf.descricao} onChange={v => handleArrayItem('infinitys', 'update', i, 'descricao', v)} placeholder="Regras absolutas..." styleExtra={{ minHeight: '40px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ✨ SINGULARIDADES */}
                <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4em' }}>✨ Singularidades</h2>
                        <button onClick={() => handleArrayItem('singularidades', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em' }}>+ Escrever</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {(minhaFicha.singularidades || []).map((sing, i) => (
                            <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                                <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('singularidades', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✖</button>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px', paddingRight: '20px' }}>
                                    <CampoMagico valor={sing.nome} onChange={v => handleArrayItem('singularidades', 'update', i, 'nome', v)} placeholder="Anomalia Única" styleExtra={{ fontWeight: 'bold' }} />
                                    <CampoMagico valor={sing.custo} onChange={v => handleArrayItem('singularidades', 'update', i, 'custo', v)} placeholder="Condição" styleExtra={{ width: '80px' }} />
                                </div>
                                <AreaMagica valor={sing.descricao} onChange={v => handleArrayItem('singularidades', 'update', i, 'descricao', v)} placeholder="Como quebra a realidade?..." styleExtra={{ minHeight: '40px' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <hr style={{ border: '1px dashed currentColor', margin: '40px 0', opacity: 0.5 }} />

            {/* ⚔️ MARCADORES DE CENA */}
            <div style={{ border: '2px solid currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5em', display: 'flex', alignItems: 'center', gap: '10px' }}>⚔️ Marcadores de Cena (Escalonamento)</h2>
                        <span style={{ fontSize: '0.85em', opacity: 0.7, fontStyle: 'italic' }}>Acumule buffs durante a batalha. O valor final serve para você somar nos testes.</span>
                    </div>
                    <button onClick={resetCena} style={{ padding: '8px 15px', borderColor: '#ff003c', color: '#ff003c', background: 'rgba(255,0,60,0.05)' }}>🧹 Limpar Cena</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <CampoMagico valor={novoMarcadorNome} onChange={setNovoMarcadorNome} placeholder="Nome (Ex: Fúria, Acerto...)" styleExtra={{ flex: 2, border: '1px solid currentColor', borderRadius: '4px' }} />
                    <CampoMagico valor={novoMarcadorBonus} onChange={setNovoMarcadorBonus} placeholder="Bônus por Stack (Ex: 8)" type="number" styleExtra={{ flex: 1, border: '1px solid currentColor', borderRadius: '4px', textAlign: 'center' }} />
                    <button onClick={addMarcador} style={{ padding: '10px 20px', background: 'currentColor', color: localCorFundo, border: 'none', borderRadius: '4px' }}>+ Inscrever</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(!minhaFicha.marcadores || minhaFicha.marcadores.length === 0) ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '10px' }}>Nenhum marcador ativo nesta cena.</div>
                    ) : (
                        minhaFicha.marcadores.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '10px 15px', borderRadius: '6px', borderLeft: '3px solid currentColor' }}>
                                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{m.nome}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '1.2em', opacity: 0.8 }}>(+{m.bonus} por stack)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.1)', padding: '5px 10px', borderRadius: '20px' }}>
                                        <button onClick={() => updateStack(i, -1)} style={{ padding: '0 8px', fontSize: '1.2em', border: 'none' }}>-</button>
                                        <span style={{ fontSize: '1.2em', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{m.stacks}</span>
                                        <button onClick={() => updateStack(i, 1)} style={{ padding: '0 8px', fontSize: '1.2em', border: 'none' }}>+</button>
                                    </div>
                                    <div style={{ fontSize: '1.4em', fontWeight: 'bold', width: '80px', textAlign: 'right', color: corSuprema }}>= +{m.stacks * m.bonus}</div>
                                    <button onClick={() => { updateFicha(f => f.marcadores.splice(i,1)); callSave(); }} style={{ padding: '5px', opacity: 0.5, border: 'none' }}>✖</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 🌌 FORJA DE CALAMIDADE (PÓS-LUTA) */}
            <div style={{ border: '2px double currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5em', display: 'flex', alignItems: 'center', gap: '10px' }}>🌌 Forja de Calamidade Universal (Pós-Luta)</h2>
                    <span style={{ fontSize: '0.85em', opacity: 0.7, fontStyle: 'italic' }}>Calcule os ganhos absolutos que o seu Infinity ou Singularidade processou no combate e funda-os na sua alma.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', border: '1px dashed currentColor', borderRadius: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={forja.vida} onChange={e => setForja({...forja, vida: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Vida Máxima Base
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={forja.energias} onChange={e => setForja({...forja, energias: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Energias Base (Mana/Aura/Chakra/Corpo)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={forja.status} onChange={e => setForja({...forja, status: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Status Base (Força, Destreza, etc.)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={forja.danoBruto} onChange={e => setForja({...forja, danoBruto: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Dano Bruto Flat (+)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', gridColumn: 'span 2' }}>
                        <input type="checkbox" checked={forja.multGeral} onChange={e => setForja({...forja, multGeral: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Multiplicador Geral de Dano (x)
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <CampoMagico valor={forjaValor} onChange={setForjaValor} placeholder="Valor da Evolução (Ex: 25000)" type="number" styleExtra={{ flex: 1, border: '2px solid currentColor', borderRadius: '4px', fontSize: '1.2em', textAlign: 'center' }} />
                    <button onClick={injetarForja} style={{ flex: 2, padding: '15px', background: 'currentColor', color: localCorFundo, border: 'none', borderRadius: '4px', fontSize: '1.2em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        ⚡ Injetar Evolução na Ficha
                    </button>
                </div>
            </div>

        </div>
    );
}