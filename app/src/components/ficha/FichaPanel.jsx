import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { contarDigitos } from '../../core/utils';
import { getMaximo, getRawBase } from '../../core/attributes';
import { getPrestigioReal } from '../../core/prestige';
import { salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';

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

    // Prestige
    const [presAsc, setPresAsc] = useState(1);
    const [presVida, setPresVida] = useState(0);
    const [presStatus, setPresStatus] = useState(0);
    const [presMana, setPresMana] = useState(0);
    const [presAura, setPresAura] = useState(0);
    const [presChakra, setPresChakra] = useState(0);
    const [presCorpo, setPresCorpo] = useState(0);

    // Divisores
    const [divVida, setDivVida] = useState(1);
    const [divStatus, setDivStatus] = useState(1);
    const [divMana, setDivMana] = useState(1);
    const [divAura, setDivAura] = useState(1);
    const [divChakra, setDivChakra] = useState(1);
    const [divCorpo, setDivCorpo] = useState(1);

    const carregarAtributoNaTela = useCallback(() => {
        const s = selAtributo;
        const k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
        const st = minhaFicha[k];
        if (!st) return;
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

    // Load prestige table
    const carregarTabelaPrestigio = useCallback(() => {
        let m = 0;
        for (let i = 0; i < STATS.length; i++) {
            m += getRawBase(minhaFicha, STATS[i]);
        }
        setPresAsc(minhaFicha.ascensaoBase || 1);
        setPresVida(getPrestigioReal('vida', getRawBase(minhaFicha, 'vida')));
        setPresStatus(Math.floor((m / 8) / 1000));
        setPresMana(getPrestigioReal('mana', getRawBase(minhaFicha, 'mana')));
        setPresAura(getPrestigioReal('aura', getRawBase(minhaFicha, 'aura')));
        setPresChakra(getPrestigioReal('chakra', getRawBase(minhaFicha, 'chakra')));
        setPresCorpo(getPrestigioReal('corpo', getRawBase(minhaFicha, 'corpo')));

        const d = minhaFicha.divisores || { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
        setDivVida(d.vida || 1);
        setDivStatus(d.status || 1);
        setDivMana(d.mana || 1);
        setDivAura(d.aura || 1);
        setDivChakra(d.chakra || 1);
        setDivCorpo(d.corpo || 1);
    }, [minhaFicha]);

    useEffect(() => {
        carregarTabelaPrestigio();
    }, [carregarTabelaPrestigio]);

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

                if (c === 'vida' || c === 'mana' || c === 'aura' || c === 'chakra' || c === 'corpo') {
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

    function aplicarPrestigioNaFicha() {
        const ascB = Math.max(1, parseInt(presAsc) || 1);
        const v1 = Math.max(0, parseInt(presVida) || 0);
        const v2 = Math.max(0, parseInt(presStatus) || 0);
        const v3 = Math.max(0, parseInt(presMana) || 0);
        const v4 = Math.max(0, parseInt(presAura) || 0);
        const v5 = Math.max(0, parseInt(presChakra) || 0);
        const v6 = Math.max(0, parseInt(presCorpo) || 0);

        updateFicha((ficha) => {
            ficha.ascensaoBase = ascB;
            ficha.vida.base = v1 * 1000000;
            ficha.mana.base = v3 * 10000000;
            ficha.aura.base = v4 * 10000000;
            ficha.chakra.base = v5 * 10000000;
            ficha.corpo.base = v6 * 10000000;

            const stBase = v2 * 1000;
            for (let i = 0; i < STATS.length; i++) {
                ficha[STATS[i]].base = stBase;
            }
        });
    }

    function atualizarDivisores() {
        updateFicha((ficha) => {
            if (!ficha.divisores) ficha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
            ficha.divisores.vida = parseFloat(divVida) || 1;
            ficha.divisores.status = parseFloat(divStatus) || 1;
            ficha.divisores.mana = parseFloat(divMana) || 1;
            ficha.divisores.aura = parseFloat(divAura) || 1;
            ficha.divisores.chakra = parseFloat(divChakra) || 1;
            ficha.divisores.corpo = parseFloat(divCorpo) || 1;
        });
        salvarFichaSilencioso();
    }

    function salvarTabelaAoServidor() {
        aplicarPrestigioNaFicha();
        salvarFirebaseImediato();
        alert('Tabela de Prestigio salva!');
    }

    function handleCampo(field, val) {
        setCampos(prev => ({ ...prev, [field]: val }));
    }

    return (
        <div className="ficha-panel">
            {/* Attribute Editor */}
            <div className="def-box">
                <h3 style={{ color: '#ffcc00', marginBottom: 10 }}>Editor de Atributos</h3>
                <select
                    className="input-neon"
                    value={selAtributo}
                    onChange={(e) => setSelAtributo(e.target.value)}
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

                <button className="btn-neon btn-gold" onClick={salvarAtributo} style={{ marginTop: 15, width: '100%' }}>
                    Salvar Atributo
                </button>
            </div>

            {/* Prestige Table */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#f0f', marginBottom: 10 }}>Tabela de Prestigio</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Ascensao Base</label>
                        <input className="input-neon" type="number" value={presAsc} onChange={e => setPresAsc(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Vida</label>
                        <input className="input-neon" type="number" value={presVida} onChange={e => setPresVida(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Status</label>
                        <input className="input-neon" type="number" value={presStatus} onChange={e => setPresStatus(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mana</label>
                        <input className="input-neon" type="number" value={presMana} onChange={e => setPresMana(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Aura</label>
                        <input className="input-neon" type="number" value={presAura} onChange={e => setPresAura(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Chakra</label>
                        <input className="input-neon" type="number" value={presChakra} onChange={e => setPresChakra(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Corpo</label>
                        <input className="input-neon" type="number" value={presCorpo} onChange={e => setPresCorpo(e.target.value)} onBlur={aplicarPrestigioNaFicha} />
                    </div>
                </div>
                <button className="btn-neon btn-gold" onClick={salvarTabelaAoServidor} style={{ marginTop: 15, width: '100%' }}>
                    Salvar Prestigio no Servidor
                </button>
            </div>

            {/* Divisores */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#0ff', marginBottom: 10 }}>Divisores</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Vida</label>
                        <input className="input-neon" type="number" value={divVida} onChange={e => setDivVida(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Status</label>
                        <input className="input-neon" type="number" value={divStatus} onChange={e => setDivStatus(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mana</label>
                        <input className="input-neon" type="number" value={divMana} onChange={e => setDivMana(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Aura</label>
                        <input className="input-neon" type="number" value={divAura} onChange={e => setDivAura(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Chakra</label>
                        <input className="input-neon" type="number" value={divChakra} onChange={e => setDivChakra(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Corpo</label>
                        <input className="input-neon" type="number" value={divCorpo} onChange={e => setDivCorpo(e.target.value)} onBlur={atualizarDivisores} />
                    </div>
                </div>
            </div>
        </div>
    );
}
