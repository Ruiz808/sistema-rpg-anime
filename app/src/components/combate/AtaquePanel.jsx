import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../../stores/useStore';
import { tratarUnico } from '../../core/utils';
import { getBuffs } from '../../core/attributes';
import { calcularDano } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

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

const ENERGIA_LIST = [
    { value: 'mana', label: 'Mana' },
    { value: 'aura', label: 'Aura' },
    { value: 'chakra', label: 'Chakra' },
    { value: 'corpo', label: 'Corpo' },
];

export default function AtaquePanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const addFeedEntry = useStore(s => s.addFeedEntry);

    const ac = minhaFicha.ataqueConfig || {};

    const [dados, setDados] = useState(ac.dadosBase || 1);
    const [faces, setFaces] = useState(ac.faces || 20);
    const [dadosExtra, setDadosExtra] = useState(ac.dExtra || 0);
    const [bruto, setBruto] = useState(ac.bruto || 0);
    const [mBruto, setMBruto] = useState(ac.mBruto || 1.0);
    const [mBase, setMBase] = useState(ac.mBase || 1.0);
    const [mGeral, setMGeral] = useState(ac.mGeral || 1.0);
    const [mFormas, setMFormas] = useState(ac.mFormas || 1.0);
    const [mAbsoluto, setMAbsoluto] = useState(ac.mAbsoluto || 1.0);
    const [mPotencial, setMPotencial] = useState(ac.mPotencial || 1.0);
    const [mUnico, setMUnico] = useState(ac.mUnico || '1.0');
    const [percEnergia, setPercEnergia] = useState(ac.percEnergia || 0);
    const [redCusto, setRedCusto] = useState(ac.redCusto || 0);
    const [mEnergia, setMEnergia] = useState(ac.mEnergia || 1.0);
    const [statusSelecionados, setStatusSelecionados] = useState(ac.statusSelecionados || ['forca']);
    const [energiasSelecionadas, setEnergiasSelecionadas] = useState(ac.energiasSelecionadas || ['mana']);

    // Computed from equipped elementals
    const [dadosMagia, setDadosMagia] = useState(0);
    const [percMagia, setPercMagia] = useState(0);

    // Buff labels
    const [buffLabels, setBuffLabels] = useState({ base: '', geral: '', formas: '', abs: '', uni: '' });

    // Load config when ficha changes
    useEffect(() => {
        const ac2 = minhaFicha.ataqueConfig || {};
        setDados(ac2.dadosBase || 1);
        setFaces(ac2.faces || 20);
        setDadosExtra(ac2.dExtra || 0);
        setBruto(ac2.bruto || 0);
        setMBruto(ac2.mBruto || 1.0);
        setMBase(ac2.mBase || 1.0);
        setMGeral(ac2.mGeral || 1.0);
        setMFormas(ac2.mFormas || 1.0);
        setMAbsoluto(ac2.mAbsoluto || 1.0);
        setMPotencial(ac2.mPotencial || 1.0);
        setMUnico(ac2.mUnico || '1.0');
        setPercEnergia(ac2.percEnergia || 0);
        setRedCusto(ac2.redCusto || 0);
        setMEnergia(ac2.mEnergia || 1.0);
        if (ac2.statusSelecionados && ac2.statusSelecionados.length > 0) setStatusSelecionados(ac2.statusSelecionados);
        if (ac2.energiasSelecionadas && ac2.energiasSelecionadas.length > 0) setEnergiasSelecionadas(ac2.energiasSelecionadas);
    }, [minhaFicha.ataqueConfig]);

    // Update elemental data and buff labels
    const atualizarInputsDeDano = useCallback(() => {
        try {
            const sels = statusSelecionados.length > 0 ? statusSelecionados : ['forca'];
            const main = sels[0];
            if (!minhaFicha || !minhaFicha[main]) return;

            const b = getBuffs(minhaFicha, main);
            setBuffLabels({
                base: b.mbase > 1 ? `(Forma: x${b.mbase.toFixed(2)})` : '',
                geral: b.mgeral > 1 ? `(Forma: x${b.mgeral.toFixed(2)})` : '',
                formas: b.mformas > 1 ? `(Forma: x${b.mformas.toFixed(2)})` : '',
                abs: b.mabs > 1 ? `(Forma: x${b.mabs.toFixed(2)})` : '',
                uni: b.munico.length > 0 ? `(Forma: x${b.munico.join(', ')})` : ''
            });

            const magiasEquipadas = minhaFicha.ataquesElementais ? minhaFicha.ataquesElementais.filter(e => e.equipado) : [];
            let custoMagiaTotal = 0;
            let dadosMagiaTotal = 0;
            let facesMagiaVal = null;
            magiasEquipadas.forEach(atk => {
                custoMagiaTotal += parseFloat(atk.custoValor) || 0;
                if (parseInt(atk.dadosExtraQtd) > 0) {
                    dadosMagiaTotal += parseInt(atk.dadosExtraQtd);
                    facesMagiaVal = parseInt(atk.dadosExtraFaces);
                }
            });
            setPercMagia(custoMagiaTotal);
            setDadosMagia(dadosMagiaTotal);
            if (dadosMagiaTotal > 0 && facesMagiaVal) {
                setFaces(facesMagiaVal);
            }
        } catch (e) { /* ignore */ }
    }, [minhaFicha, statusSelecionados]);

    useEffect(() => {
        atualizarInputsDeDano();
    }, [atualizarInputsDeDano]);

    function salvarConfigAtaque(silent) {
        updateFicha((ficha) => {
            if (!ficha.ataqueConfig) ficha.ataqueConfig = {};
            const a = ficha.ataqueConfig;
            a.dadosBase = parseInt(dados) || 1;
            a.faces = parseInt(faces) || 20;
            a.dExtra = parseInt(dadosExtra) || 0;
            a.bruto = parseInt(bruto) || 0;
            a.mBruto = parseFloat(mBruto) || 1.0;
            a.mBase = parseFloat(mBase) || 1.0;
            a.mGeral = parseFloat(mGeral) || 1.0;
            a.mFormas = parseFloat(mFormas) || 1.0;
            a.mAbsoluto = parseFloat(mAbsoluto) || 1.0;
            a.mPotencial = parseFloat(mPotencial) || 1.0;
            a.mUnico = mUnico || '1.0';
            a.percEnergia = parseFloat(percEnergia) || 0;
            a.redCusto = parseFloat(redCusto) || 0;
            a.mEnergia = parseFloat(mEnergia) || 1.0;
            a.statusSelecionados = statusSelecionados;
            a.energiasSelecionadas = energiasSelecionadas;
        });
        salvarFichaSilencioso();
    }

    function toggleStat(value) {
        setStatusSelecionados(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value);
            return [...prev, value];
        });
    }

    function toggleEnergia(value) {
        setEnergiasSelecionadas(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value);
            return [...prev, value];
        });
    }

    function rolarDano() {
        salvarConfigAtaque(true);

        const qDBase = parseInt(dados) || 1;
        const qDExtra = parseInt(dadosExtra) || 0;
        const qDMagia = dadosMagia;
        const fD = parseInt(faces) || 20;
        const pE = parseFloat(percEnergia) || 0;
        const pMagiaTotal = percMagia;
        const rE = parseFloat(redCusto) || 0;
        const mEVal = parseFloat(mEnergia) || 1;
        const dbVal = parseInt(bruto) || 0;
        const mdbVal = parseFloat(mBruto) || 1;

        const engs = energiasSelecionadas.length > 0 ? energiasSelecionadas : ['mana'];
        const sels = statusSelecionados.length > 0 ? statusSelecionados : ['forca'];

        const m1 = parseFloat(mGeral) || 1;
        const m2 = parseFloat(mBase) || 1;
        const m3 = parseFloat(mPotencial) || 1;
        const m4 = parseFloat(mFormas) || 1;
        const m5 = parseFloat(mAbsoluto) || 1;
        const uArr = tratarUnico(mUnico);

        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
        const magiasEquipadas = minhaFicha.ataquesElementais ? minhaFicha.ataquesElementais.filter(e => e.equipado) : [];

        const result = calcularDano({
            qDBase, qDExtra, qDMagia, fD, pE, pMagiaTotal, rE, mE: mEVal,
            db: dbVal, mdb: mdbVal, engs, sels, minhaFicha,
            m1, m2, m3, m4, m5, uArr, itensEquipados, magiasEquipadas
        });

        if (result.erro) {
            alert(result.erro);
            return;
        }

        // Apply energy drains
        if (result.drenos) {
            updateFicha((ficha) => {
                for (let i = 0; i < result.drenos.length; i++) {
                    ficha[result.drenos[i].key].atual -= result.drenos[i].valor;
                }
            });
        }
        salvarFichaSilencioso();

        const feedData = {
            tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade,
            rolagem: result.rolagem, rolagemMagica: result.rolagemMagica,
            atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia,
            armaStr: result.armaStr, detalheConta: result.detalheConta
        };
        enviarParaFeed(feedData);
        addFeedEntry(feedData);
        setAbaAtiva('aba-log');
    }

    return (
        <div className="ataque-panel">
            <div className="def-box">
                <h3 style={{ color: '#ff003c', marginBottom: 10 }}>Configuracao de Ataque</h3>

                {/* Status checkboxes */}
                <div style={{ marginBottom: 10 }}>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Status usados no dano:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                        {STATS_LIST.map(st => (
                            <label key={st.value} style={{ color: statusSelecionados.includes(st.value) ? '#0f0' : '#888', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="checkbox"
                                    className="chk-stat"
                                    value={st.value}
                                    checked={statusSelecionados.includes(st.value)}
                                    onChange={() => toggleStat(st.value)}
                                />
                                {st.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Energy checkboxes */}
                <div style={{ marginBottom: 10 }}>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Energias de combustao:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
                        {ENERGIA_LIST.map(en => (
                            <label key={en.value} style={{ color: energiasSelecionadas.includes(en.value) ? '#0ff' : '#888', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="checkbox"
                                    className="chk-energia"
                                    value={en.value}
                                    checked={energiasSelecionadas.includes(en.value)}
                                    onChange={() => toggleEnergia(en.value)}
                                />
                                {en.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Dice and damage inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados</label>
                        <input className="input-neon" type="number" value={dados} onChange={e => setDados(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces</label>
                        <input className="input-neon" type="number" value={faces} onChange={e => setFaces(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Extra</label>
                        <input className="input-neon" type="number" value={dadosExtra} onChange={e => setDadosExtra(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bruto</label>
                        <input className="input-neon" type="number" value={bruto} onChange={e => setBruto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Bruto</label>
                        <input className="input-neon" type="number" step="0.01" value={mBruto} onChange={e => setMBruto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados Magia</label>
                        <input className="input-neon" type="number" value={dadosMagia} readOnly style={{ opacity: 0.6 }} />
                    </div>
                </div>

                {/* Multiplier inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Base <span style={{ color: '#0f0', fontSize: '0.8em' }}>{buffLabels.base}</span></label>
                        <input className="input-neon" type="number" step="0.01" value={mBase} onChange={e => setMBase(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Geral <span style={{ color: '#0f0', fontSize: '0.8em' }}>{buffLabels.geral}</span></label>
                        <input className="input-neon" type="number" step="0.01" value={mGeral} onChange={e => setMGeral(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Formas <span style={{ color: '#0f0', fontSize: '0.8em' }}>{buffLabels.formas}</span></label>
                        <input className="input-neon" type="number" step="0.01" value={mFormas} onChange={e => setMFormas(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Absoluto <span style={{ color: '#0f0', fontSize: '0.8em' }}>{buffLabels.abs}</span></label>
                        <input className="input-neon" type="number" step="0.01" value={mAbsoluto} onChange={e => setMAbsoluto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Unico <span style={{ color: '#0f0', fontSize: '0.8em' }}>{buffLabels.uni}</span></label>
                        <input className="input-neon" type="text" value={mUnico} onChange={e => setMUnico(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Potencial</label>
                        <input className="input-neon" type="number" step="0.01" value={mPotencial} onChange={e => setMPotencial(e.target.value)} />
                    </div>
                </div>

                {/* Energy inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>% Energia</label>
                        <input className="input-neon" type="number" value={percEnergia} onChange={e => setPercEnergia(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>% Magia</label>
                        <input className="input-neon" type="number" value={percMagia} readOnly style={{ opacity: 0.6 }} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Red Custo</label>
                        <input className="input-neon" type="number" value={redCusto} onChange={e => setRedCusto(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Mult Energia</label>
                        <input className="input-neon" type="number" step="0.01" value={mEnergia} onChange={e => setMEnergia(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                    <button className="btn-neon btn-gold" onClick={() => salvarConfigAtaque(false)} style={{ flex: 1 }}>
                        Salvar Config
                    </button>
                    <button className="btn-neon btn-red" onClick={rolarDano} style={{ flex: 1 }}>
                        ROLAR DANO
                    </button>
                </div>
            </div>
        </div>
    );
}
