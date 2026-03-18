import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { calcularEvasiva, calcularResistencia, calcularReducao } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

export default function DefesaPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const addFeedEntry = useStore(s => s.addFeedEntry);

    // Evasion
    const [evaProf, setEvaProf] = useState(0);
    const [evaBonus, setEvaBonus] = useState(0);

    // Resistance
    const [resProf, setResProf] = useState(0);
    const [resBonus, setResBonus] = useState(0);

    // Shield
    const [redEnergia, setRedEnergia] = useState('mana');
    const [redPerc, setRedPerc] = useState(0);
    const [redMult, setRedMult] = useState(1);

    function declararEvasiva() {
        const prof = parseInt(evaProf) || 0;
        const bonus = parseInt(evaBonus) || 0;
        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
        const result = calcularEvasiva({ prof, bonus, minhaFicha, itensEquipados });
        const feedData = { tipo: 'evasiva', nome: meuNome, ...result };
        enviarParaFeed(feedData);
        addFeedEntry(feedData);
        setAbaAtiva('aba-log');
    }

    function declararResistencia() {
        const prof = parseInt(resProf) || 0;
        const bonus = parseInt(resBonus) || 0;
        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
        const result = calcularResistencia({ prof, bonus, minhaFicha, itensEquipados });
        const feedData = { tipo: 'resistencia', nome: meuNome, ...result };
        enviarParaFeed(feedData);
        addFeedEntry(feedData);
        setAbaAtiva('aba-log');
    }

    function declararReducao() {
        const k = redEnergia;
        const perc = parseFloat(redPerc) || 0;
        const mb = parseFloat(redMult) || 1;
        const itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
        const result = calcularReducao({ energiaKey: k, perc, multBase: mb, minhaFicha, itensEquipados, rE: 0 });

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

        const feedData = { tipo: 'escudo', nome: meuNome, ...result };
        enviarParaFeed(feedData);
        addFeedEntry(feedData);
        setAbaAtiva('aba-log');
    }

    return (
        <div className="defesa-panel">
            {/* Evasion */}
            <div className="def-box">
                <h3 style={{ color: '#0088ff', marginBottom: 10 }}>Esquiva (Evasiva)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiencia</label>
                        <input className="input-neon" type="number" value={evaProf} onChange={e => setEvaProf(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bonus</label>
                        <input className="input-neon" type="number" value={evaBonus} onChange={e => setEvaBonus(e.target.value)} />
                    </div>
                </div>
                <button className="btn-neon btn-blue" onClick={declararEvasiva} style={{ marginTop: 10, width: '100%' }}>
                    DECLARAR ESQUIVA
                </button>
            </div>

            {/* Resistance */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#ccc', marginBottom: 10 }}>Bloqueio (Resistencia)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiencia</label>
                        <input className="input-neon" type="number" value={resProf} onChange={e => setResProf(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bonus</label>
                        <input className="input-neon" type="number" value={resBonus} onChange={e => setResBonus(e.target.value)} />
                    </div>
                </div>
                <button className="btn-neon" onClick={declararResistencia} style={{ marginTop: 10, width: '100%' }}>
                    DECLARAR BLOQUEIO
                </button>
            </div>

            {/* Shield */}
            <div className="def-box" style={{ marginTop: 15 }}>
                <h3 style={{ color: '#f0f', marginBottom: 10 }}>Escudo (Reducao)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Energia</label>
                        <select className="input-neon" value={redEnergia} onChange={e => setRedEnergia(e.target.value)}>
                            <option value="mana">Mana</option>
                            <option value="aura">Aura</option>
                            <option value="chakra">Chakra</option>
                            <option value="corpo">Corpo</option>
                            <option value="poder">PODER TOTAL</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>% Dreno</label>
                        <input className="input-neon" type="number" value={redPerc} onChange={e => setRedPerc(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ color: '#aaa', fontSize: '0.85em' }}>Multiplicador</label>
                        <input className="input-neon" type="number" step="0.01" value={redMult} onChange={e => setRedMult(e.target.value)} />
                    </div>
                </div>
                <button className="btn-neon" onClick={declararReducao} style={{ marginTop: 10, width: '100%', borderColor: '#f0f', color: '#f0f' }}>
                    ATIVAR ESCUDO
                </button>
            </div>
        </div>
    );
}
