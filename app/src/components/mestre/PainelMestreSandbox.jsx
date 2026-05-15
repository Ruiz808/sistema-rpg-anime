import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { getDatabase, ref, update } from 'firebase/database';

// As 6 condições mais usadas para acesso rápido do Mestre
const CONDICOES_RAPIDAS = [
    { id: 'sangrando', icone: '🩸', cor: '#ff003c', nome: 'Sangrando' },
    { id: 'queimado', icone: '🔥', cor: '#ff4400', nome: 'Queimado' },
    { id: 'exausto', icone: '😮‍💨', cor: '#aaaaaa', nome: 'Exausto' },
    { id: 'envenenado', icone: '🤢', cor: '#00ff00', nome: 'Envenenado' },
    { id: 'criogenia', icone: '❄️', cor: '#00ffff', nome: 'Criogenia' },
    { id: 'lento', icone: '🐢', cor: '#aadd00', nome: 'Lento' }
];

export default function PainelMestreSandbox({ personagemId, ficha }) {
    const mesaId = useStore(s => s.mesaId);
    const db = getDatabase();
    
    const [expandido, setExpandido] = useState(false);
    const [valorRapido, setValorRapido] = useState('');

    // 🔥 1. MOTOR DE VIDA (DANO / CURA INSTANTÂNEO)
    const aplicarCuraDano = (tipo) => {
        const val = parseInt(valorRapido);
        if (!val || isNaN(val) || val <= 0) return;

        let hpAtual = ficha?.vida?.atual !== undefined ? ficha.vida.atual : 100;
        let novoHp = tipo === 'dano' ? hpAtual - val : hpAtual + val;
        
        if (novoHp < 0) novoHp = 0; // Impede HP negativo

        // Atualiza diretamente no Firebase do jogador
        update(ref(db, `mesas/${mesaId}/personagens/${personagemId}/vida`), {
            atual: novoHp
        }).then(() => {
            setValorRapido('');
        }).catch(err => alert("Erro ao atualizar HP: " + err.message));
    };

    // 🔥 2. MOTOR DE CONDIÇÕES (STACKS INSTANTÂNEOS)
    const modificarCondicaoSandbox = (condId, delta) => {
        let condicoesAtuais = ficha?.condicoes ? [...ficha.condicoes] : [];
        const index = condicoesAtuais.findIndex(c => c.id === condId);

        if (index > -1) {
            condicoesAtuais[index].stacks += delta;
            if (condicoesAtuais[index].stacks <= 0) {
                condicoesAtuais.splice(index, 1);
            } else if (condicoesAtuais[index].stacks > 6) {
                condicoesAtuais[index].stacks = 6;
            }
        } else if (delta > 0) {
            condicoesAtuais.push({ id: condId, stacks: 1 });
        }

        update(ref(db, `mesas/${mesaId}/personagens/${personagemId}`), {
            condicoes: condicoesAtuais
        });
    };

    const condicoesDaFicha = ficha?.condicoes || [];

    return (
        <div style={{ marginTop: '10px', width: '100%' }}>
            <button 
                onClick={() => setExpandido(!expandido)}
                style={{ 
                    width: '100%', background: expandido ? 'rgba(255, 204, 0, 0.2)' : 'rgba(0,0,0,0.5)', 
                    border: '1px solid #ffcc00', color: '#ffcc00', padding: '6px', 
                    borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em',
                    transition: 'all 0.3s'
                }}
            >
                {expandido ? '▼ FECHAR SANDBOX' : '⚡ AÇÃO RÁPIDA (SANDBOX)'}
            </button>

            {expandido && (
                <div className="fade-in" style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #ffcc00', borderTop: 'none', padding: '10px', borderRadius: '0 0 4px 4px' }}>
                    
                    {/* MODIFICADOR DE HP */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                        <input 
                            type="number" 
                            placeholder="Valor..." 
                            value={valorRapido} 
                            onChange={e => setValorRapido(e.target.value)} 
                            style={{ flex: 1, padding: '6px', background: '#111', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '0.9em' }} 
                        />
                        <button 
                            onClick={() => aplicarCuraDano('dano')} 
                            style={{ background: '#ff003c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            DANO
                        </button>
                        <button 
                            onClick={() => aplicarCuraDano('cura')} 
                            style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            CURAR
                        </button>
                    </div>

                    {/* MODIFICADOR DE CONDIÇÕES */}
                    <div style={{ borderTop: '1px dashed #444', paddingTop: '10px' }}>
                        <div style={{ fontSize: '0.7em', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>Aplicar Condições Rápidas</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {CONDICOES_RAPIDAS.map(c => {
                                const ativa = condicoesDaFicha.find(ca => ca.id === c.id);
                                return (
                                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: ativa ? `${c.cor}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${ativa ? c.cor : '#333'}`, padding: '4px', borderRadius: '4px' }}>
                                        <div style={{ fontSize: '1.2em' }}>{c.icone}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <button onClick={() => modificarCondicaoSandbox(c.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>-</button>
                                            <strong style={{ color: ativa ? c.cor : '#666', fontSize: '0.9em' }}>{ativa ? ativa.stacks : 0}</strong>
                                            <button onClick={() => modificarCondicaoSandbox(c.id, 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}