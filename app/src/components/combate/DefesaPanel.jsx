import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { calcularReducao } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';
import { resolverEfeitosEntidade } from '../../core/efeitos-resolver';

export function calcularCA(ficha, tipo) {
    if (!ficha) return 10;

    const getDoisDigitos = (valor) => {
        if (!valor) return 0;
        const strVal = String(valor).replace(/[^0-9]/g, '');
        if (!strVal) return 0;
        return parseInt(strVal.substring(0, 2), 10);
    };

    let base = 5;
    if (tipo === 'evasiva') base += getDoisDigitos(ficha.destreza?.base);
    if (tipo === 'resistencia') base += getDoisDigitos(ficha.forca?.base);

    let bonus = 0;

    const somarBonus = (efeitos) => {
        (efeitos || []).forEach(e => {
            if (e && e.atributo === tipo && e.propriedade === 'base') bonus += parseFloat(e.valor) || 0;
        });
    };

    // Poderes (com resolucao de formas)
    (ficha.poderes || []).forEach(p => {
        let resolved = resolverEfeitosEntidade(p);
        if (p.ativa) somarBonus(resolved.efeitos);
        somarBonus(resolved.efeitosPassivos);
    });

    // Passivas da Ficha
    (ficha.passivas || []).forEach(p => {
        somarBonus(p.efeitos);
    });

    // Itens Equipados (com resolucao de formas)
    (ficha.inventario || []).filter(i => i.equipado).forEach(i => {
        let resolved = resolverEfeitosEntidade(i);
        somarBonus(resolved.efeitos);
        somarBonus(resolved.efeitosPassivos);
    });

    return Math.floor(base + bonus);
}

export default function DefesaPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);

    const caEvasiva = calcularCA(minhaFicha, 'evasiva');
    const caResistencia = calcularCA(minhaFicha, 'resistencia');

    // Evasion States
    const [evaDados, setEvaDados] = useState(0); 
    const [evaFaces, setEvaFaces] = useState(20);
    const [evaProf, setEvaProf] = useState(0);
    const [evaBonus, setEvaBonus] = useState(0);

    // Resistance States
    const [resDados, setResDados] = useState(0);
    const [resFaces, setResFaces] = useState(20);
    const [resProf, setResProf] = useState(0);
    const [resBonus, setResBonus] = useState(0);

    // Shield States
    const [redEnergia, setRedEnergia] = useState('mana');
    const [redPerc, setRedPerc] = useState(0);
    const [redMult, setRedMult] = useState(1);

    function rolar(qtd, faces) {
        let sum = 0;
        let rolls = [];
        for (let i = 0; i < qtd; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            rolls.push(r);
            sum += r;
        }
        return { sum, str: `[${rolls.join(', ')}]` };
    }

    function declararEvasiva() {
        const qD = parseInt(evaDados) || 0;
        const fD = parseInt(evaFaces) || 20;
        const prof = parseInt(evaProf) || 0;
        const bonus = parseInt(evaBonus) || 0;
        
        let diceTotal = 0;
        let diceStr = '';
        if (qD > 0) {
            const r = rolar(qD, fD);
            diceTotal = r.sum;
            diceStr = `🎲 +Dados: ${r.str} | `;
        }

        const total = caEvasiva + diceTotal + prof + bonus;
        const baseCalc = `${diceStr}CA Evasiva (${caEvasiva}) + Prof (${prof}) + Bónus Extra (${bonus})`;

        const feedData = { tipo: 'evasiva', nome: meuNome, total, baseCalc };
        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }

    function declararResistencia() {
        const qD = parseInt(resDados) || 0;
        const fD = parseInt(resFaces) || 20;
        const prof = parseInt(resProf) || 0;
        const bonus = parseInt(resBonus) || 0;
        
        let diceTotal = 0;
        let diceStr = '';
        if (qD > 0) {
            const r = rolar(qD, fD);
            diceTotal = r.sum;
            diceStr = `🎲 +Dados: ${r.str} | `;
        }

        const total = caResistencia + diceTotal + prof + bonus;
        const baseCalc = `${diceStr}CA Resistência (${caResistencia}) + Prof (${prof}) + Bónus Extra (${bonus})`;

        const feedData = { tipo: 'resistencia', nome: meuNome, total, baseCalc };
        enviarParaFeed(feedData);
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
        setAbaAtiva('aba-log');
    }

    return (
        <div className="defesa-panel">
            {/* 🔥 EVASIVA ATIVA/PASSIVA */}
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

            {/* 🔥 RESISTÊNCIA ATIVA/PASSIVA */}
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

            {/* SHIELD (Mantido intacto) */}
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
        </div>
    );
}