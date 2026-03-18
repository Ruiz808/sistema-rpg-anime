import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { calcularAcerto } from '../../core/engine';
import { enviarParaFeed } from '../../services/firebase-sync';

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
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const addFeedEntry = useStore(s => s.addFeedEntry);

    const [dados, setDados] = useState(1);
    const [faces, setFaces] = useState(20);
    const [proficiencia, setProficiencia] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [statsSelecionados, setStatsSelecionados] = useState(['destreza']);

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
        const sels = statsSelecionados.length > 0 ? statsSelecionados : ['destreza'];

        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];

        const result = calcularAcerto({ qD, fD, prof, bonus: bon, sels, minhaFicha, itensEquipados });

        const feedData = { tipo: 'acerto', nome: meuNome, ...result };
        enviarParaFeed(feedData);
        addFeedEntry(feedData);
        setAbaAtiva('aba-log');
    }

    return (
        <div className="acerto-panel">
            <div className="def-box">
                <h3 style={{ color: '#f90', marginBottom: 10 }}>Rolagem de Acerto</h3>

                {/* Status checkboxes */}
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
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados</label>
                        <input className="input-neon" type="number" value={dados} onChange={e => setDados(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces</label>
                        <input className="input-neon" type="number" value={faces} onChange={e => setFaces(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiencia</label>
                        <input className="input-neon" type="number" value={proficiencia} onChange={e => setProficiencia(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bonus</label>
                        <input className="input-neon" type="number" value={bonus} onChange={e => setBonus(e.target.value)} />
                    </div>
                </div>

                <button className="btn-neon btn-gold" onClick={rolarAcerto} style={{ marginTop: 15, width: '100%' }}>
                    ROLAR ACERTO
                </button>
            </div>
        </div>
    );
}
