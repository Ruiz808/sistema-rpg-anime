import React, { createContext, useContext, useState, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';
import { getMaximo } from '../../core/attributes';

// ==========================================
// 📖 OS CAPÍTULOS DA CLASSIFICAÇÃO
// ==========================================
const CAPITULOS = [
    { id: 'registros', label: 'Registros da Alma', icon: '📖' },
    { id: 'acumulativo', label: 'Marcadores de Cena', icon: '📈' },
    { id: 'forja', label: 'Forja de Calamidade', icon: '🌌' },
    { id: 'elemental', label: 'Reator de Ressonância', icon: '🌪️' },
    { id: 'conceitual', label: 'Distorção Conceitual', icon: '🧩' },
    { id: 'utilitario', label: 'Matriz Utilitária', icon: '🛠️' }
];

// ==========================================
// 🧠 CONTEXTO ISOLADO DA CLASSIFICAÇÃO
// ==========================================
const ClassificacaoContext = createContext(null);

export function useClassificacao() {
    return useContext(ClassificacaoContext);
}

export function ClassificacaoProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const [abaAtual, setAbaAtual] = useState('registros');

    // Funções de Save e Inputs
    const callSave = useCallback(() => { salvarFichaSilencioso(); }, []);

    const handleArrayItem = useCallback((chave, acao, index, campo, valor) => {
        updateFicha((ficha) => {
            if (!ficha[chave]) ficha[chave] = [];
            if (acao === 'add') ficha[chave].push({ nome: '', custo: '', dano: '', descricao: '' });
            else if (acao === 'remove') ficha[chave].splice(index, 1);
            else if (acao === 'update') ficha[chave][index][campo] = valor;
        });
        callSave();
    }, [updateFicha, callSave]);

    // Marcadores
    const [novoTrackerNome, setNovoTrackerNome] = useState('');
    const [novoTrackerValor, setNovoTrackerValor] = useState('');

    // Forja
    const [forja, setForja] = useState({ vida: true, energias: true, status: false, multGeral: false, danoBruto: true });
    const [forjaValor, setForjaValor] = useState('');

    // Distorção & Utilitária
    const [novaLeiNome, setNovaLeiNome] = useState('');
    const [novaCopiaNome, setNovaCopiaNome] = useState('');
    const [novaCopiaEfeito, setNovaCopiaEfeito] = useState('');

    const value = {
        minhaFicha, updateFicha, abaAtual, setAbaAtual, callSave, handleArrayItem,
        novoTrackerNome, setNovoTrackerNome, novoTrackerValor, setNovoTrackerValor,
        forja, setForja, forjaValor, setForjaValor,
        novaLeiNome, setNovaLeiNome, novaCopiaNome, setNovaCopiaNome, novaCopiaEfeito, setNovaCopiaEfeito
    };

    return <ClassificacaoContext.Provider value={value}>{children}</ClassificacaoContext.Provider>;
}

// ==========================================
// 🖋️ COMPONENTES VISUAIS (ESTILO GRIMÓRIO)
// ==========================================
const CampoMagico = ({ valor, onChange, placeholder, styleExtra = {}, type = "text" }) => {
    const { callSave } = useClassificacao();
    return (
        <input 
            type={type} value={valor || ''} onChange={e => onChange(e.target.value)} 
            onBlur={callSave} placeholder={placeholder}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed currentColor', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', outline: 'none', padding: '5px', width: '100%', ...styleExtra }} 
        />
    );
};

const AreaMagica = ({ valor, onChange, placeholder, styleExtra = {} }) => {
    const { callSave } = useClassificacao();
    return (
        <textarea 
            value={valor || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            onBlur={callSave}
            style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', borderBottom: '2px dotted currentColor', color: 'inherit', fontFamily: 'inherit', padding: '8px', outline: 'none', resize: 'vertical', ...styleExtra }}
        />
    );
};

// 📚 O NAVEGADOR DE CAPÍTULOS
function ClassificacaoNavegacao() {
    const { abaAtual, setAbaAtual } = useClassificacao();
    const indexAtual = CAPITULOS.findIndex(c => c.id === abaAtual);
    const total = CAPITULOS.length;
    const dadosAba = CAPITULOS[indexAtual];

    const irPara = (novoIndex) => {
        if (novoIndex >= 0 && novoIndex < total) setAbaAtual(CAPITULOS[novoIndex].id);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed currentColor', paddingBottom: '15px', marginBottom: '20px' }}>
            <button onClick={() => irPara(indexAtual - 1)} disabled={indexAtual === 0} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: indexAtual === 0 ? 'default' : 'pointer', opacity: indexAtual === 0 ? 0.3 : 1, fontWeight: 'bold' }}>
                ⮜ FOLHEAR PARA TRÁS
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <select 
                    value={abaAtual} 
                    onChange={(e) => setAbaAtual(e.target.value)}
                    style={{ background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px dotted currentColor', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px', outline: 'none', cursor: 'pointer', textAlign: 'center', opacity: 0.8 }}
                >
                    {CAPITULOS.map((c, i) => (
                        <option key={c.id} value={c.id} style={{ background: '#1e1423', color: '#e6d5b8' }}>
                            CAPÍTULO {i + 1} DE {total}: {c.label.toUpperCase()}
                        </option>
                    ))}
                </select>
                
                <h2 style={{ margin: '5px 0 0 0', fontSize: '1.8em', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{dadosAba.icon}</span> {dadosAba.label}
                </h2>
            </div>

            <button onClick={() => irPara(indexAtual + 1)} disabled={indexAtual === total - 1} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: indexAtual === total - 1 ? 'default' : 'pointer', opacity: indexAtual === total - 1 ? 0.3 : 1, fontWeight: 'bold' }}>
                FOLHEAR PARA FRENTE ⮞
            </button>
        </div>
    );
}

// ==========================================
// 📖 CAPÍTULOS (SUB-PÁGINAS)
// ==========================================

function PaginaRegistros() {
    const { minhaFicha, handleArrayItem } = useClassificacao();
    const hierarquia = minhaFicha?.hierarquia || {};
    
    let tituloSupremo = 'MUNDANO';
    let corSuprema = minhaFicha?.estetica?.corTintaRadar || '#000000';
    let nomeHabilidadeDestaque = hierarquia.singularidadeNome || hierarquia.infinityNome || hierarquia.poderNome || '';

    if (hierarquia.singularidade === '0') { tituloSupremo = 'SINGULARIDADE GRAU 0'; corSuprema = '#ff00ff'; } 
    else if (hierarquia.singularidade === '1') { tituloSupremo = 'SINGULARIDADE GRAU 1'; corSuprema = '#ff003c'; } 
    else if (hierarquia.singularidade === '2') { tituloSupremo = 'SINGULARIDADE GRAU 2'; corSuprema = '#ff8800'; } 
    else if (hierarquia.singularidade === '3') { tituloSupremo = 'SINGULARIDADE GRAU 3'; corSuprema = '#ffcc00'; } 
    else if (hierarquia.infinity) { tituloSupremo = 'INFINITY'; corSuprema = '#00ccff'; } 
    else if (hierarquia.poder) { tituloSupremo = 'PODER'; corSuprema = '#00ffcc'; }

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
            {/* 👑 BANNER DO GRAU */}
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', border: `3px double ${corSuprema}`, background: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '1.2em', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>Grau de Calamidade Atual</h2>
                <div style={{ fontSize: '2.5em', fontWeight: '900', color: corSuprema, textTransform: 'uppercase', letterSpacing: '2px' }}>{tituloSupremo}</div>
                {nomeHabilidadeDestaque && <div style={{ fontSize: '1.8em', fontWeight: 'bold', fontStyle: 'italic', marginTop: '10px' }}>"{nomeHabilidadeDestaque}"</div>}
            </div>

            <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4em' }}>🌀 Poderes Inatos</h2>
                    <button onClick={() => handleArrayItem('poderes', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em', background: 'transparent', border: '1px solid currentColor', color: 'inherit', cursor: 'pointer' }}>+ Escrever</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {(minhaFicha.poderes || []).map((pod, i) => (
                        <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                            <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('poderes', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'inherit' }}>✖</button>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '5px', paddingRight: '20px' }}>
                                <CampoMagico valor={pod.nome} onChange={v => handleArrayItem('poderes', 'update', i, 'nome', v)} placeholder="Nome do Poder" styleExtra={{ fontWeight: 'bold' }} />
                                <CampoMagico valor={pod.custo} onChange={v => handleArrayItem('poderes', 'update', i, 'custo', v)} placeholder="Custo" styleExtra={{ width: '80px' }} />
                            </div>
                            <AreaMagica valor={pod.descricao} onChange={v => handleArrayItem('poderes', 'update', i, 'descricao', v)} placeholder="Efeitos inatos..." styleExtra={{ minHeight: '40px' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4em' }}>♾️ Infinitys</h2>
                    <button onClick={() => handleArrayItem('infinitys', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em', background: 'transparent', border: '1px solid currentColor', color: 'inherit', cursor: 'pointer' }}>+ Escrever</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {(minhaFicha.infinitys || []).map((inf, i) => (
                        <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                            <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('infinitys', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'inherit' }}>✖</button>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '5px', paddingRight: '20px' }}>
                                <CampoMagico valor={inf.nome} onChange={v => handleArrayItem('infinitys', 'update', i, 'nome', v)} placeholder="Nome do Domínio" styleExtra={{ fontWeight: 'bold' }} />
                                <CampoMagico valor={inf.custo} onChange={v => handleArrayItem('infinitys', 'update', i, 'custo', v)} placeholder="Gatilho" styleExtra={{ width: '80px' }} />
                            </div>
                            <AreaMagica valor={inf.descricao} onChange={v => handleArrayItem('infinitys', 'update', i, 'descricao', v)} placeholder="Regras absolutas..." styleExtra={{ minHeight: '40px' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4em' }}>✨ Singularidades</h2>
                    <button onClick={() => handleArrayItem('singularidades', 'add')} style={{ padding: '5px 10px', fontSize: '0.85em', background: 'transparent', border: '1px solid currentColor', color: 'inherit', cursor: 'pointer' }}>+ Escrever</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {(minhaFicha.singularidades || []).map((sing, i) => (
                        <div key={i} style={{ position: 'relative', borderLeft: '3px solid currentColor', paddingLeft: '15px' }}>
                            <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('singularidades', 'remove', i); }} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'inherit' }}>✖</button>
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
    );
}

function PaginaMarcadores() {
    const { minhaFicha, updateFicha, callSave, novoTrackerNome, setNovoTrackerNome, novoTrackerValor, setNovoTrackerValor } = useClassificacao();
    const corSuprema = minhaFicha?.estetica?.corTintaRadar || '#000000';

    const addMarcador = () => {
        if (!novoTrackerNome.trim() || !novoTrackerValor) return;
        updateFicha(f => {
            if (!f.marcadores) f.marcadores = [];
            f.marcadores.push({ nome: novoTrackerNome.trim(), bonus: Number(novoTrackerValor), stacks: 1 });
        });
        setNovoTrackerNome(''); setNovoTrackerValor(''); callSave();
    };

    const updateStack = (index, delta) => {
        updateFicha(f => {
            if (!f.marcadores) return;
            f.marcadores[index].stacks = Math.max(0, f.marcadores[index].stacks + delta);
        });
        callSave();
    };

    const resetCena = () => {
        if (!window.confirm("Apagar todos os marcadores desta cena?")) return;
        updateFicha(f => { f.marcadores = []; }); callSave();
    };

    return (
        <div className="fade-in" style={{ border: '2px solid currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.9em', opacity: 0.7, fontStyle: 'italic' }}>Acumule buffs durante a batalha. Valor soma-se aos dados.</span>
                <button onClick={resetCena} style={{ padding: '8px 15px', border: '1px solid currentColor', color: 'inherit', background: 'transparent', cursor: 'pointer', opacity: 0.8 }}>🧹 Limpar Cena</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <CampoMagico valor={novoTrackerNome} onChange={setNovoTrackerNome} placeholder="Nome (Ex: Fúria...)" styleExtra={{ flex: 2, border: '1px dashed currentColor' }} />
                <CampoMagico valor={novoTrackerValor} onChange={setNovoTrackerValor} placeholder="Bônus por Stack (Ex: 8)" type="number" styleExtra={{ flex: 1, border: '1px dashed currentColor', textAlign: 'center' }} />
                <button onClick={addMarcador} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid currentColor', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>+ Inscrever</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!minhaFicha.marcadores || minhaFicha.marcadores.length === 0) ? (
                    <div style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '10px' }}>Nenhum marcador ativo.</div>
                ) : (
                    minhaFicha.marcadores.map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '10px 15px', borderRadius: '6px', borderLeft: '3px solid currentColor' }}>
                            <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{m.nome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ fontSize: '1em', opacity: 0.8 }}>(+{m.bonus}/stack)</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.05)', padding: '5px 10px', borderRadius: '20px', border: '1px dotted currentColor' }}>
                                    <button onClick={() => updateStack(i, -1)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontSize: '1.2em', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{m.stacks}</span>
                                    <button onClick={() => updateStack(i, 1)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: 'pointer' }}>+</button>
                                </div>
                                <div style={{ fontSize: '1.4em', fontWeight: 'bold', width: '80px', textAlign: 'right', color: corSuprema }}>= +{m.stacks * m.bonus}</div>
                                <button onClick={() => { updateFicha(f => f.marcadores.splice(i,1)); callSave(); }} style={{ padding: '5px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.5 }}>✖</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function PaginaForja() {
    const { updateFicha, callSave, forja, setForja, forjaValor, setForjaValor } = useClassificacao();

    const injetarForja = () => {
        const val = Number(forjaValor);
        if (isNaN(val) || val === 0) return alert("A Forja exige um valor numérico válido.");
        if (!window.confirm(`Fundir +${val} aos atributos selecionados permanentemente?`)) return;

        updateFicha(f => {
            if (forja.vida) { f.vida = f.vida || {}; f.vida.base = (Number(f.vida.base) || 0) + val; }
            if (forja.energias) { ['mana', 'aura', 'chakra', 'corpo'].forEach(k => { f[k] = f[k] || {}; f[k].base = (Number(f[k].base) || 0) + val; }); }
            if (forja.status) { ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'].forEach(k => { f[k] = f[k] || {}; f[k].base = (Number(f[k].base) || 0) + val; }); }
            if (forja.multGeral) { f.dano = f.dano || {}; f.dano.mGeral = (Number(f.dano.mGeral) || 1) + val; }
            if (forja.danoBruto) { f.dano = f.dano || {}; f.dano.danoBruto = (Number(f.dano.danoBruto) || 0) + val; }
        });
        setForjaValor(''); callSave(); alert("Evolução Injetada na Alma!");
    };

    return (
        <div className="fade-in" style={{ border: '2px double currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.9em', opacity: 0.7, fontStyle: 'italic' }}>Calcule os ganhos absolutos que o seu Infinity ou Singularidade processou e funda-os na alma.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', border: '1px dashed currentColor', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={forja.vida} onChange={e => setForja({...forja, vida: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Vida Máxima Base
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={forja.energias} onChange={e => setForja({...forja, energias: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Energias Base
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={forja.status} onChange={e => setForja({...forja, status: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Status Base
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={forja.danoBruto} onChange={e => setForja({...forja, danoBruto: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Dano Bruto Flat (+)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', gridColumn: 'span 2' }}>
                    <input type="checkbox" checked={forja.multGeral} onChange={e => setForja({...forja, multGeral: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Multiplicador Geral de Dano (x)
                </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <CampoMagico valor={forjaValor} onChange={setForjaValor} placeholder="Valor da Evolução (Ex: 25000)" type="number" styleExtra={{ flex: 1, border: '2px dashed currentColor', fontSize: '1.2em', textAlign: 'center' }} />
                <button onClick={injetarForja} style={{ flex: 2, padding: '15px', background: 'transparent', color: 'inherit', border: '2px solid currentColor', borderRadius: '4px', fontSize: '1.2em', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}>
                    ⚡ Injetar Evolução
                </button>
            </div>
        </div>
    );
}

function PaginaReator() {
    const { minhaFicha } = useClassificacao();
    const getAtual = (k) => { const max = getMaximo(minhaFicha, k); return minhaFicha?.[k]?.atual !== undefined ? minhaFicha[k].atual : max; };
    const soma = getAtual('mana') + getAtual('aura') + getAtual('chakra');

    return (
        <div className="fade-in" style={{ border: '2px solid currentColor', padding: '30px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <p style={{ opacity: 0.8, fontStyle: 'italic', marginBottom: '20px' }}>A força bruta da natureza funde as suas energias passivamente para as suas habilidades Elementais.</p>
            <div style={{ fontSize: '1.4em', fontWeight: 'bold', marginBottom: '10px' }}>Soma das Energias (Mana + Aura + Chakra)</div>
            <div style={{ fontSize: '3em', fontWeight: '900', borderBottom: '3px double currentColor', display: 'inline-block', padding: '0 20px' }}>
                +{soma} <span style={{ fontSize: '0.4em', opacity: 0.6, fontWeight: 'normal' }}>Dano Flat Estimado</span>
            </div>
        </div>
    );
}

function PaginaConceitual() {
    const { minhaFicha, updateFicha, callSave, novaLeiNome, setNovaLeiNome } = useClassificacao();
    const leis = minhaFicha?.combate?.leis || [];

    const addLei = () => {
        if (!novaLeiNome.trim()) return;
        updateFicha(f => { if (!f.combate) f.combate = {}; if (!f.combate.leis) f.combate.leis = []; f.combate.leis.push({ id: Date.now(), texto: novaLeiNome }); });
        callSave(); setNovaLeiNome('');
    };

    return (
        <div className="fade-in" style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
            <p style={{ opacity: 0.8, fontStyle: 'italic', marginBottom: '20px' }}>Anomalias conceituais reescrevem as leis da realidade. Decrete as "Leis da Cena" em vigor.</p>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                <CampoMagico valor={novaLeiNome} onChange={setNovaLeiNome} placeholder="Decrete uma nova Lei (Ex: Ninguém pode esquivar)..." styleExtra={{ flex: 1, fontSize: '1.1em', padding: '10px' }} />
                <button onClick={addLei} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '10px 20px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer' }}>+ DECRETAR</button>
            </div>
            {leis.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {leis.map(lei => (
                        <div key={lei.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '10px 15px', borderRadius: '5px', borderLeft: '3px solid currentColor' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', fontStyle: 'italic' }}>"{lei.texto}"</div>
                            <button onClick={() => { updateFicha(f => { f.combate.leis = f.combate.leis.filter(x => x.id !== lei.id); }); callSave(); }} style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', fontWeight: 'bold' }}>REVOGAR</button>
                        </div>
                    ))}
                </div>
            ) : ( <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>Nenhuma lei em vigor.</div> )}
        </div>
    );
}

function PaginaUtilitaria() {
    const { minhaFicha, updateFicha, callSave, novaCopiaNome, setNovaCopiaNome, novaCopiaEfeito, setNovaCopiaEfeito } = useClassificacao();
    const copias = minhaFicha?.combate?.copias || [];

    const addCopia = () => {
        if (!novaCopiaNome.trim()) return;
        updateFicha(f => { if (!f.combate) f.combate = {}; if (!f.combate.copias) f.combate.copias = []; f.combate.copias.push({ id: Date.now(), nome: novaCopiaNome, efeito: novaCopiaEfeito }); });
        callSave(); setNovaCopiaNome(''); setNovaCopiaEfeito('');
    };

    return (
        <div className="fade-in" style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
            <p style={{ opacity: 0.8, fontStyle: 'italic', marginBottom: '20px' }}>Para Infinities de Cópia (ex: Ketsuda). Registe as habilidades ou buffs copiados temporariamente.</p>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <CampoMagico valor={novaCopiaNome} onChange={setNovaCopiaNome} placeholder="Nome do Poder Copiado" styleExtra={{ flex: '1 1 200px', fontSize: '1.1em', padding: '10px' }} />
                <CampoMagico valor={novaCopiaEfeito} onChange={setNovaCopiaEfeito} placeholder="Efeito Copiado" styleExtra={{ flex: '1 1 200px', fontSize: '1.1em', padding: '10px' }} />
                <button onClick={addCopia} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '10px 20px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer' }}>+ ARMAZENAR</button>
            </div>
            {copias.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                    {copias.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid currentColor' }}>
                            <div><div style={{ fontWeight: 'bold' }}>{c.nome}</div><div style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '2px' }}>{c.efeito}</div></div>
                            <button onClick={() => { updateFicha(f => { f.combate.copias = f.combate.copias.filter(x => x.id !== c.id); }); callSave(); }} style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        </div>
                    ))}
                </div>
            ) : ( <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>Matriz vazia. Nenhuma cópia ativa.</div> )}
        </div>
    );
}

// ==========================================
// 🚀 O RENDERIZADOR PRINCIPAL DO LIVRO
// ==========================================
export default function ClassificacaoPanel() {
    return (
        <ClassificacaoProvider>
            <div className="grimorio-estilo-papel" style={{ width: '100%' }}>
                <ClassificacaoNavegacao />
                <ConteudoDinamico />
            </div>
        </ClassificacaoProvider>
    );
}

function ConteudoDinamico() {
    const { abaAtual } = useClassificacao();
    if (abaAtual === 'registros') return <PaginaRegistros />;
    if (abaAtual === 'acumulativo') return <PaginaMarcadores />;
    if (abaAtual === 'forja') return <PaginaForja />;
    if (abaAtual === 'elemental') return <PaginaReator />;
    if (abaAtual === 'conceitual') return <PaginaConceitual />;
    if (abaAtual === 'utilitario') return <PaginaUtilitaria />;
    return null;
}