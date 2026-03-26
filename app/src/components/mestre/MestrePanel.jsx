import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { enviarParaFeed, salvarDummie } from '../../services/firebase-sync';
import { getMaximo, calcularCA } from '../../core/attributes';

export default function MestrePanel() {
    const { personagens, isMestre, dummies } = useStore();
    const [msgSistema, setMsgSistema] = useState('');

    const [dNome, setDNome] = useState('Goblin Espião');
    const [dHp, setDHp] = useState(100);
    const [dVit, setDVit] = useState(0);
    const [dDefTipo, setDDefTipo] = useState('evasiva');
    const [dDef, setDDef] = useState(10);
    const [dVisivelHp, setDVisivelHp] = useState('todos');
    const [dOculto, setDOculto] = useState(false); 

    if (!isMestre) {
        return <div style={{ color: '#ff003c', textAlign: 'center', padding: 50, fontSize: '1.5em', fontWeight: 'bold' }}>Acesso Negado. Apenas o Mestre pode aceder a este domínio.</div>;
    }

    const enviarAviso = () => {
        if (!msgSistema.trim()) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: msgSistema.trim() });
        setMsgSistema('');
    };

    const injetarDummie = () => {
        const hBase = parseInt(dHp) || 100;
        const vit = parseInt(dVit) || 0;
        const h = hBase * Math.pow(10, vit);
        const dv = parseInt(dDef) || 10;
        const id = 'dummie_' + Date.now();

        salvarDummie(id, { 
            nome: dNome, 
            hpMax: h, 
            hpAtual: h, 
            tipoDefesa: dDefTipo, 
            valorDefesa: dv, 
            visibilidadeHp: dVisivelHp, 
            oculto: dOculto, 
            posicao: { x: 0, y: 0 } 
        });

        alert(`${dNome} injetado no mapa! ${dOculto ? '(Invisível 👻)' : ''}`);
    };

    const jogadoresList = Object.entries(personagens || {});
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#ffcc00', textShadow: '0 0 10px #ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: 10, margin: 0 }}>
                👑 DOMÍNIO DO MESTRE
            </h2>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="def-box" style={{ flex: '1 1 60%', minWidth: '400px', borderLeft: '4px solid #0088ff' }}>
                    <h3 style={{ color: '#0088ff', margin: '0 0 15px 0' }}>👁️ Visor de Jogadores ({jogadoresList.length})</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {jogadoresList.map(([nome, ficha]) => {
                            const hpMax = getMaximo(ficha, 'vida');
                            const hpAtual = ficha.vida?.atual ?? hpMax;
                            const percHp = hpMax > 0 ? (hpAtual / hpMax) * 100 : 0;
                            const mpMax = getMaximo(ficha, 'mana');
                            const mpAtual = ficha.mana?.atual ?? mpMax;

                            let classId = ficha?.bio?.classe;
                            if ((classId === 'pretender' || classId === 'alterego') && ficha?.bio?.subClasse) classId = ficha?.bio?.subClasse;

                            return (
                                <div key={nome} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #333', padding: '15px', borderRadius: '5px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: `${percHp}%`, background: percHp > 50 ? '#0f0' : percHp > 20 ? '#ffcc00' : '#f00', transition: 'width 0.3s' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '5px' }}>
                                        <strong style={{ color: '#fff', fontSize: '1.2em' }}>{nome}</strong>
                                        <span style={{ color: '#aaa', fontSize: '0.8em', fontStyle: 'italic' }}>{classId ? classId.toUpperCase() : 'Mundano'}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85em', color: '#ccc' }}>
                                        <div style={{ background: 'rgba(255,0,0,0.1)', padding: '5px', borderRadius: '3px', borderLeft: '2px solid #f00' }}><span style={{ color: '#f00', fontWeight: 'bold' }}>HP:</span> {fmt(hpAtual)} / {fmt(hpMax)}</div>
                                        <div style={{ background: 'rgba(0,136,255,0.1)', padding: '5px', borderRadius: '3px', borderLeft: '2px solid #0088ff' }}><span style={{ color: '#0088ff', fontWeight: 'bold' }}>MP:</span> {fmt(mpAtual)} / {fmt(mpMax)}</div>
                                        <div style={{ background: 'rgba(0,255,204,0.1)', padding: '5px', borderRadius: '3px', borderLeft: '2px solid #00ffcc' }}><span style={{ color: '#00ffcc', fontWeight: 'bold' }}>EVA:</span> {calcularCA(ficha, 'evasiva')}</div>
                                        <div style={{ background: 'rgba(255,204,0,0.1)', padding: '5px', borderRadius: '3px', borderLeft: '2px solid #ffcc00' }}><span style={{ color: '#ffcc00', fontWeight: 'bold' }}>RES:</span> {calcularCA(ficha, 'resistencia')}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="def-box" style={{ borderLeft: '4px solid #ff003c' }}>
                        <h3 style={{ color: '#ff003c', margin: '0 0 15px 0' }}>👹 Injetor de Entidades (Mapa)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input className="input-neon" type="text" placeholder="Nome (Ex: Dragão Ancião)" value={dNome} onChange={e => setDNome(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>HP Base</label><input className="input-neon" type="number" value={dHp} onChange={e => setDHp(e.target.value)} style={{ width: '100%' }} /></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0f0', fontSize: '0.8em' }}>+ Vitalidade (Zeros)</label><input className="input-neon" type="number" value={dVit} onChange={e => setDVit(e.target.value)} style={{ width: '100%', borderColor: '#0f0', color: '#0f0' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={{ color: '#aaa', fontSize: '0.8em' }}>Defesa Alvo</label><select className="input-neon" value={dDefTipo} onChange={e => setDDefTipo(e.target.value)} style={{ width: '100%' }}><option value="evasiva">Evasiva</option><option value="resistencia">Resistência</option></select></div>
                                <div style={{ flex: 1 }}><label style={{ color: '#0088ff', fontSize: '0.8em' }}>Valor (CA)</label><input className="input-neon" type="number" value={dDef} onChange={e => setDDef(e.target.value)} style={{ width: '100%' }} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                                <select className="input-neon" value={dVisivelHp} onChange={e => setDVisivelHp(e.target.value)} style={{ flex: 1 }}><option value="todos">HP Visível para Todos</option><option value="mestre">HP Oculto</option></select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: dOculto ? 'rgba(255,0,60,0.1)' : 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px', border: `1px solid ${dOculto ? '#ff003c' : '#444'}`, cursor: 'pointer', transition: 'all 0.3s' }}>
                                <input type="checkbox" checked={dOculto} onChange={e => setDOculto(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                <span style={{ color: dOculto ? '#ff003c' : '#aaa', fontWeight: dOculto ? 'bold' : 'normal' }}>{dOculto ? '👻 TOKEN INVISÍVEL NO MAPA' : '👁️ Token Visível no Mapa'}</span>
                            </label>
                            <button className="btn-neon btn-red" onClick={injetarDummie} style={{ marginTop: '10px', padding: '10px', fontSize: '1.1em', fontWeight: 'bold' }}>☄️ INVOCAR NO MAPA [0,0]</button>
                        </div>
                    </div>

                    <div className="def-box" style={{ borderLeft: '4px solid #ffcc00' }}>
                        <h3 style={{ color: '#ffcc00', margin: '0 0 15px 0' }}>⚡ A Voz do Sistema</h3>
                        <textarea className="input-neon" placeholder="Escreva uma mensagem global para o ecrã de todos..." value={msgSistema} onChange={e => setMsgSistema(e.target.value)} style={{ width: '100%', minHeight: '80px', borderColor: '#ffcc00', color: '#ffcc00' }} />
                        <button className="btn-neon btn-gold" onClick={enviarAviso} style={{ width: '100%', marginTop: '10px' }}>📢 ENVIAR AVISO GLOBAL</button>
                    </div>
                </div>
            </div>
        </div>
    );
}