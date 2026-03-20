import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo, getBuffs } from '../../core/attributes.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';
import TabelaPrestigio from './TabelaPrestigio'; 

const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
const ENERGIAS = ['mana', 'aura', 'chakra', 'corpo'];

const ATRIBUTO_OPTIONS = [
    { value: 'forca', label: 'Forca' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' },
    { value: 'energiaEsp', label: 'Energia Espiritual' },
    { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' },
    { value: 'constituicao', label: 'Constituicao' },
    { value: 'vida', label: 'Vida' },
    { value: 'mana', label: 'Mana' },
    { value: 'aura', label: 'Aura' },
    { value: 'chakra', label: 'Chakra' },
    { value: 'corpo', label: 'Corpo' },
    { value: 'todos_status', label: 'TODOS OS STATUS' },
    { value: 'todas_energias', label: 'TODAS AS ENERGIAS' },
];

export default function FichaPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);

    const [selAtributo, setSelAtributo] = useState('forca');
    const [campos, setCampos] = useState({
        base: 0, mBase: 1, mGeral: 1, mFormas: 1, mUnico: '1.0', mAbsoluto: 1, reducaoCusto: 0, regeneracao: 0
    });

    // Multiplicadores de Dano
    const [dmBase, setDmBase] = useState(1.0);
    const [dmPotencial, setDmPotencial] = useState(1.0);
    const [dmGeral, setDmGeral] = useState(1.0);
    const [dmFormas, setDmFormas] = useState(1.0);
    const [dmAbsoluto, setDmAbsoluto] = useState(1.0);
    const [dmUnico, setDmUnico] = useState('1.0');
    const [salvandoMult, setSalvandoMult] = useState(false);

    const carregarAtributoNaTela = useCallback(() => {
        const s = selAtributo;
        const k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
        if (!minhaFicha || !minhaFicha[k]) return;
        const st = minhaFicha[k];
        
        setCampos({
            base: st.base || 0,
            mBase: st.mBase || 1,
            mGeral: st.mGeral || 1,
            mFormas: st.mFormas || 1,
            mUnico: st.mUnico || '1.0',
            mAbsoluto: st.mAbsoluto || 1,
            reducaoCusto: st.reducaoCusto || 0,
            regeneracao: st.regeneracao || 0
        });
    }, [selAtributo, minhaFicha]);

    useEffect(() => {
        carregarAtributoNaTela();
    }, [selAtributo, carregarAtributoNaTela]);

    function salvarAtributo() {
        const s = selAtributo;
        let chs = [];
        if (s === 'todos_status') chs = [...STATS];
        else if (s === 'todas_energias') chs = [...ENERGIAS];
        else chs = [s];

        const v = {
            b: parseInt(campos.base) || 0,
            mb: parseFloat(campos.mBase) || 1,
            mg: parseFloat(campos.mGeral) || 1,
            mf: parseFloat(campos.mFormas) || 1,
            mu: campos.mUnico || '1.0',
            ma: parseFloat(campos.mAbsoluto) || 1,
            rc: parseFloat(campos.reducaoCusto) || 0,
            rg: parseFloat(campos.regeneracao) || 0
        };

        updateFicha((ficha) => {
            for (let i = 0; i < chs.length; i++) {
                const c = chs[i];
                if (!ficha[c]) continue;
                ficha[c].base = v.b;
                ficha[c].mBase = v.mb;
                ficha[c].mGeral = v.mg;
                ficha[c].mFormas = v.mf;
                ficha[c].mUnico = v.mu;
                ficha[c].mAbsoluto = v.ma;
                ficha[c].reducaoCusto = v.rc;
                ficha[c].regeneracao = v.rg;

                if (['vida', 'mana', 'aura', 'chakra', 'corpo'].includes(c)) {
                    let mx = getMaximo(ficha, c);
                    if (c === 'vida') {
                        const p = Math.max(0, contarDigitos(mx) - 8);
                        if (p > 0) mx = Math.floor(mx / Math.pow(10, p));
                    } else {
                        const p = Math.max(0, contarDigitos(mx) - 9);
                        if (p > 0) mx = Math.floor(mx / Math.pow(10, p));
                    }
                    ficha[c].atual = mx;
                }
            }
        });
        salvarFichaSilencioso();
        alert('Salvo!');
    }

    // Carregar multiplicadores de dano
    useEffect(() => {
        const d = minhaFicha.dano || {};
        setDmBase(d.mBase ?? 1.0);
        setDmPotencial(d.mPotencial ?? 1.0);
        setDmGeral(d.mGeral ?? 1.0);
        setDmFormas(d.mFormas ?? 1.0);
        setDmAbsoluto(d.mAbsoluto ?? 1.0);
        setDmUnico(d.mUnico ?? '1.0');
    }, [minhaFicha.dano]);

    const buffsDano = useMemo(() => getBuffs(minhaFicha, 'dano'), [minhaFicha.poderes, minhaFicha.passivas]);

    function salvarMultiplicadores() {
        updateFicha((ficha) => {
            if (!ficha.dano) ficha.dano = {};
            ficha.dano.mBase = parseFloat(dmBase) || 1.0;
            ficha.dano.mPotencial = parseFloat(dmPotencial) || 1.0;
            ficha.dano.mGeral = parseFloat(dmGeral) || 1.0;
            ficha.dano.mFormas = parseFloat(dmFormas) || 1.0;
            ficha.dano.mAbsoluto = parseFloat(dmAbsoluto) || 1.0;
            ficha.dano.mUnico = dmUnico || '1.0';
        });
        salvarFichaSilencioso();
        setSalvandoMult(true);
        setTimeout(() => setSalvandoMult(false), 2000);
    }

    function handleCampo(field, val) {
        setCampos(prev => ({ ...prev, [field]: val }));
    }

    // --- LÓGICA DO HOLOGRAMA (RENDERIZA OS BUFFS) ---
    const sKeyForBuffs = (selAtributo === 'todos_status') ? 'forca' : (selAtributo === 'todas_energias') ? 'mana' : selAtributo;
    const buffsAtuais = minhaFicha ? getBuffs(minhaFicha, sKeyForBuffs) : null;

    const renderBuffHolograma = (rawVal, buffVal, hasBuff, isMult = false) => {
        if (isMult && !hasBuff) return null;
        if (!isMult && !buffVal) return null;

        let v = parseFloat(rawVal);
        if (isNaN(v)) v = isMult ? 1.0 : 0;
        
        // Aplica a mesma matemática de combate
        let total = isMult ? ((v === 1.0 ? 0 : v) + buffVal) : (v + buffVal);

        return (
            <div style={{ fontSize: '0.75em', color: '#0f0', marginTop: '4px', textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>
                ↳ Buff Ativo: <b>+{buffVal}</b> ➔ Efetivo: <b style={{color: '#fff'}}>{total}</b>
            </div>
        );
    };

    if (!minhaFicha) return <div style={{ color: '#aaa', textAlign: 'center' }}>Carregando ficha...</div>;

    return (
        <div className="ficha-panel">
            <div className="def-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Editor de Atributos</h3>
                <select
                    className="input-neon"
                    value={selAtributo}
                    onChange={(e) => setSelAtributo(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                >
                    {ATRIBUTO_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 15 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Base</label>
                        <input className="input-neon" type="number" value={campos.base} onChange={e => handleCampo('base', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.base, buffsAtuais.base, false, false)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mBase} onChange={e => handleCampo('mBase', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.mBase, buffsAtuais.mbase, buffsAtuais._hasBuff.mbase, true)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Geral</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mGeral} onChange={e => handleCampo('mGeral', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.mGeral, buffsAtuais.mgeral, buffsAtuais._hasBuff.mgeral, true)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Formas</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mFormas} onChange={e => handleCampo('mFormas', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.mFormas, buffsAtuais.mformas, buffsAtuais._hasBuff.mformas, true)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Unico</label>
                        <input className="input-neon" type="text" value={campos.mUnico} onChange={e => handleCampo('mUnico', e.target.value)} />
                        {/* Mult Unico usa array, entao nao renderizamos holograma direto aqui para nao complicar a string */}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Absoluto</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mAbsoluto} onChange={e => handleCampo('mAbsoluto', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.mAbsoluto, buffsAtuais.mabs, buffsAtuais._hasBuff.mabs, true)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Reducao Custo</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.reducaoCusto} onChange={e => handleCampo('reducaoCusto', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.reducaoCusto, buffsAtuais.reducaoCusto, false, false)}
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Regeneracao</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.regeneracao} onChange={e => handleCampo('regeneracao', e.target.value)} />
                        {buffsAtuais && renderBuffHolograma(campos.regeneracao, buffsAtuais.regeneracao, false, false)}
                    </div>
                </div>

                <button className="btn-neon btn-gold" onClick={salvarAtributo} style={{ marginTop: 15, width: '100%', height: '44px' }}>
                    SALVAR ATRIBUTOS
                </button>
            </div>

            {/* Multiplicadores de Dano */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#ff003c', marginBottom: 10 }}>Multiplicadores de Dano</h3>
                <p style={{ color: '#888', fontSize: '0.8em', margin: '0 0 10px' }}>Valores base. Habilidades ativas somam automaticamente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base {buffsDano._hasBuff.mbase && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mbase.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmBase} onChange={e => setDmBase(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Potencial</label>
                        <input className="input-neon" type="number" step="0.01" value={dmPotencial} onChange={e => setDmPotencial(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Geral {buffsDano._hasBuff.mgeral && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mgeral.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmGeral} onChange={e => setDmGeral(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Formas {buffsDano._hasBuff.mformas && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mformas.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmFormas} onChange={e => setDmFormas(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Absoluto {buffsDano._hasBuff.mabs && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: +{buffsDano.mabs.toFixed(2)})</span>}</label>
                        <input className="input-neon" type="number" step="0.01" value={dmAbsoluto} onChange={e => setDmAbsoluto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Unico {buffsDano.munico.length > 0 && <span style={{ color: '#0f0', fontSize: '0.8em' }}>(Buff: x{buffsDano.munico.join(',')})</span>}</label>
                        <input className="input-neon" type="text" value={dmUnico} onChange={e => setDmUnico(e.target.value)} />
                    </div>
                </div>
                <button
                    className="btn-neon btn-gold"
                    onClick={salvarMultiplicadores}
                    style={{
                        marginTop: 10, width: '100%',
                        backgroundColor: salvandoMult ? 'rgba(0, 255, 100, 0.2)' : undefined,
                        borderColor: salvandoMult ? '#00ffcc' : undefined,
                        color: salvandoMult ? '#fff' : undefined
                    }}
                >
                    {salvandoMult ? 'SALVO COM SUCESSO!' : 'SALVAR MULTIPLICADORES'}
                </button>
            </div>

            <TabelaPrestigio />
        </div>
    );
}