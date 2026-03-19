import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils.js';
import { getMaximo } from '../../core/attributes.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';
import TabelaPrestigio from './TabelaPrestigio'; // <-- O NOSSO NOVO MÓDULO

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

    function handleCampo(field, val) {
        setCampos(prev => ({ ...prev, [field]: val }));
    }

    if (!minhaFicha) return <div style={{ color: '#aaa', textAlign: 'center' }}>Carregando ficha...</div>;

    return (
        <div className="ficha-panel">
            {/* Editor de Atributos Mantido */}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Base</label>
                        <input className="input-neon" type="number" value={campos.base} onChange={e => handleCampo('base', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mBase} onChange={e => handleCampo('mBase', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Geral</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mGeral} onChange={e => handleCampo('mGeral', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Formas</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mFormas} onChange={e => handleCampo('mFormas', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Unico</label>
                        <input className="input-neon" type="text" value={campos.mUnico} onChange={e => handleCampo('mUnico', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Absoluto</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.mAbsoluto} onChange={e => handleCampo('mAbsoluto', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Reducao Custo</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.reducaoCusto} onChange={e => handleCampo('reducaoCusto', e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Regeneracao</label>
                        <input className="input-neon" type="number" step="0.01" value={campos.regeneracao} onChange={e => handleCampo('regeneracao', e.target.value)} />
                    </div>
                </div>

                <button className="btn-neon btn-gold" onClick={salvarAtributo} style={{ marginTop: 15, width: '100%', height: '44px' }}>
                    SALVAR ATRIBUTOS
                </button>
            </div>

            {/* A NOSSA NOVA TABELA ASSUME O CONTROLE AQUI */}
            <TabelaPrestigio />

        </div>
    );
}