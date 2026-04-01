import React from 'react';
import { useDefesaForm } from './DefesaFormContext';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Defesa provider não encontrado</div>;

export function DefesaEvasaoBox() {
    const ctx = useDefesaForm();
    if (!ctx) return FALLBACK;

    const {
        evaDados, setEvaDados,
        evaFaces, setEvaFaces,
        evaProf, setEvaProf,
        evaBonus, setEvaBonus,
        caEvasiva,
        declararEvasiva,
    } = ctx;

    return (
        <div className="def-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#0088ff', marginBottom: 5, marginTop: 0 }}>Esquiva Acrobática</h3>
                <h2 style={{ color: '#0088ff', margin: 0, textShadow: '0 0 10px #0088ff' }}>CA: {caEvasiva}</h2>
            </div>
            <p style={{ color: '#888', fontSize: '0.85em', marginTop: 0 }}>Pode rolar dados caso use uma Reação para se esquivar ativamente.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados (+)</label>
                    <input className="input-neon" type="number" min="0" value={evaDados} onChange={e => setEvaDados(e.target.value)} title="Se 0, apenas a CA base é enviada" />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                    <input className="input-neon" type="number" min="1" value={evaFaces} onChange={e => setEvaFaces(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiência</label>
                    <input className="input-neon" type="number" value={evaProf} onChange={e => setEvaProf(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bónus Fixo</label>
                    <input className="input-neon" type="number" value={evaBonus} onChange={e => setEvaBonus(e.target.value)} />
                </div>
            </div>
            <button className="btn-neon btn-blue" onClick={declararEvasiva} style={{ marginTop: 10, width: '100%' }}>
                DECLARAR ESQUIVA
            </button>
        </div>
    );
}

export function DefesaResistenciaBox() {
    const ctx = useDefesaForm();
    if (!ctx) return FALLBACK;

    const {
        resDados, setResDados,
        resFaces, setResFaces,
        resProf, setResProf,
        resBonus, setResBonus,
        caResistencia,
        declararResistencia,
    } = ctx;

    return (
        <div className="def-box" style={{ marginTop: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#ccc', marginBottom: 5, marginTop: 0 }}>Bloqueio Bruto</h3>
                <h2 style={{ color: '#ccc', margin: 0, textShadow: '0 0 10px #ccc' }}>CA: {caResistencia}</h2>
            </div>
            <p style={{ color: '#888', fontSize: '0.85em', marginTop: 0 }}>Pode rolar dados caso use uma Reação para tentar parar o golpe.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados (+)</label>
                    <input className="input-neon" type="number" min="0" value={resDados} onChange={e => setResDados(e.target.value)} title="Se 0, apenas a CA base é enviada" />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                    <input className="input-neon" type="number" min="1" value={resFaces} onChange={e => setResFaces(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Proficiência</label>
                    <input className="input-neon" type="number" value={resProf} onChange={e => setResProf(e.target.value)} />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Bónus Fixo</label>
                    <input className="input-neon" type="number" value={resBonus} onChange={e => setResBonus(e.target.value)} />
                </div>
            </div>
            <button className="btn-neon" onClick={declararResistencia} style={{ marginTop: 10, width: '100%' }}>
                DECLARAR BLOQUEIO
            </button>
        </div>
    );
}

export function DefesaEscudoBox() {
    const ctx = useDefesaForm();
    if (!ctx) return FALLBACK;

    const {
        redEnergia, setRedEnergia,
        redPerc, setRedPerc,
        redMult, setRedMult,
        declararReducao,
    } = ctx;

    return (
        <div className="def-box" style={{ marginTop: 15 }}>
            <h3 style={{ color: '#f0f', marginBottom: 10, marginTop: 0 }}>Escudo de Energia (Redução)</h3>
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
    );
}
