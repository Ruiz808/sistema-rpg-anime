import React, { useState, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { getDatabase, ref, update } from 'firebase/database';

const TODAS_CONDICOES_BASE = [
    { id: 'sangrando', icone: '🩸', cor: '#ff003c', nome: 'Sangrando' },
    { id: 'queimado', icone: '🔥', cor: '#ff4400', nome: 'Queimado' },
    { id: 'exausto', icone: '😮‍💨', cor: '#aaaaaa', nome: 'Exausto' },
    { id: 'envenenado', icone: '🤢', cor: '#00ff00', nome: 'Envenenado' },
    { id: 'criogenia', icone: '❄️', cor: '#00ffff', nome: 'Criogenia' },
    { id: 'lento', icone: '🐢', cor: '#aadd00', nome: 'Lento' },
    { id: 'imobilizado', icone: '⛓️', cor: '#888888', nome: 'Imobilizado' },
    { id: 'incapacitado', icone: '☠️', cor: '#444444', nome: 'Incapacitado' },
    { id: 'vulneravel', icone: '🛡️', cor: '#ffaa00', nome: 'Vulnerável' },
    { id: 'amedrontado', icone: '👻', cor: '#8a2be2', nome: 'Amedrontado' },
    { id: 'enlouquecido', icone: '🌀', cor: '#ff00ff', nome: 'Enlouquecido' },
    { id: 'necrosado', icone: '💀', cor: '#222222', nome: 'Necrosado' },
    { id: 'cegosurdo', icone: '🙈', cor: '#dddddd', nome: 'Cego/Surdo' },
    { id: 'petrificado', icone: '🗿', cor: '#555555', nome: 'Petrificado' },
    { id: 'charmado', icone: '💖', cor: '#ff66b2', nome: 'Charmado' },
    { id: 'provocado', icone: '💢', cor: '#ff5500', nome: 'Provocado' }
];

export default function PainelMestreSandbox({ personagemId, ficha }) {
    const mesaId = useStore(s => s.mesaId);
    const personagens = useStore(s => s.personagens);
    const minhaFicha = useStore(s => s.minhaFicha);
    const db = getDatabase();
    
    const [expandido, setExpandido] = useState(false);
    const [valorRapido, setValorRapido] = useState('');
    const [energiaAlvo, setEnergiaAlvo] = useState('vida'); // Define qual barra será afetada

    // 🔥 LEITURA GLOBAL DE CONDIÇÕES (Para incluir as criadas pelo Mestre no Compêndio)
    const condicoesDinamicas = useMemo(() => {
        const overrides = {};
        if (personagens) {
            Object.values(personagens).forEach(p => {
                if (p?.compendioOverrides?.condicoes) Object.assign(overrides, p.compendioOverrides.condicoes);
            });
        }
        if (minhaFicha?.compendioOverrides?.condicoes) {
            Object.assign(overrides, minhaFicha.compendioOverrides.condicoes);
        }

        const map = {};
        TODAS_CONDICOES_BASE.forEach(c => map[c.id] = { ...c });
        Object.keys(overrides).forEach(k => {
            if (overrides[k].deletado) delete map[k];
            else if (map[k]) map[k] = { ...map[k], ...overrides[k] };
            else map[k] = overrides[k];
        });
        return Object.values(map);
    }, [personagens, minhaFicha]);

    // 🔥 1. MOTOR DE RECURSOS (DANO / CURA EM QUALQUER BARRA)
    const aplicarCuraDano = (tipo) => {
        const val = parseInt(valorRapido);
        if (!val || isNaN(val) || val <= 0) return;

        // Tenta achar o valor atual da energia selecionada, se não existir, assume 0
        let valorAtual = ficha?.[energiaAlvo]?.atual !== undefined ? ficha[energiaAlvo].atual : 0;
        let novoValor = tipo === 'dano' ? valorAtual - val : valorAtual + val;
        
        if (novoValor < 0) novoValor = 0; // Impede números negativos

        // Atualiza diretamente no Firebase do jogador
        update(ref(db, `mesas/${mesaId}/personagens/${personagemId}/${energiaAlvo}`), {
            atual: novoValor
        }).then(() => {
            setValorRapido('');
        }).catch(err => alert("Erro ao atualizar os recursos: " + err.message));
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
        <div style={{ marginTop: '15px', width: '100%' }}>
            <button 
                onClick={() => setExpandido(!expandido)}
                style={{ 
                    width: '100%', background: expandido ? 'rgba(255, 204, 0, 0.2)' : 'rgba(0,0,0,0.6)', 
                    border: expandido ? '2px solid #ffcc00' : '1px solid #ffcc00', color: '#ffcc00', padding: '10px', 
                    borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em',
                    transition: 'all 0.3s', textShadow: expandido ? '0 0 5px #ffcc00' : 'none'
                }}
            >
                {expandido ? '▼ FECHAR PAINEL DE CONTROLE' : '⚡ EXPANDIR SANDBOX DO MESTRE'}
            </button>

            {expandido && (
                <div className="fade-in" style={{ background: 'rgba(10,10,15,0.95)', border: '2px solid #ffcc00', borderTop: 'none', padding: '15px', borderRadius: '0 0 8px 8px', boxShadow: '0 5px 15px rgba(0,0,0,0.8)' }}>
                    
                    {/* MODIFICADOR DE RECURSOS (VIDA, MANA, ETC) */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '6px', border: '1px solid #333', marginBottom: '15px' }}>
                        <div style={{ fontSize: '0.8em', color: '#ffcc00', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Manipulação de Recursos</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <select 
                                value={energiaAlvo} 
                                onChange={e => setEnergiaAlvo(e.target.value)} 
                                style={{ flex: '1 1 90px', padding: '8px', background: '#111', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontWeight: 'bold' }}
                            >
                                <option value="vida">HP (Vida)</option>
                                <option value="mana">Mana</option>
                                <option value="aura">Aura</option>
                                <option value="chakra">Chakra</option>
                                <option value="corpo">Corpo</option>
                            </select>
                            
                            <input 
                                type="number" 
                                placeholder="Ex: 5000" 
                                value={valorRapido} 
                                onChange={e => setValorRapido(e.target.value)} 
                                style={{ flex: '2 1 120px', padding: '8px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '1.1em', textAlign: 'center' }} 
                            />
                            
                            <button 
                                onClick={() => aplicarCuraDano('dano')} 
                                style={{ flex: '1 1 80px', background: 'rgba(255, 0, 60, 0.2)', color: '#ff003c', border: '1px solid #ff003c', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', transition: '0.2s' }}
                            >
                                - DRENAR
                            </button>
                            <button 
                                onClick={() => aplicarCuraDano('cura')} 
                                style={{ flex: '1 1 80px', background: 'rgba(0, 255, 204, 0.2)', color: '#00ffcc', border: '1px solid #00ffcc', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', transition: '0.2s' }}
                            >
                                + CURAR
                            </button>
                        </div>
                    </div>

                    {/* MODIFICADOR DE CONDIÇÕES GERAIS */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '6px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '0.8em', color: '#ff003c', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Injeção de Condições</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                            {condicoesDinamicas.map(c => {
                                const ativa = condicoesDaFicha.find(ca => ca.id === c.id);
                                const corDef = c.cor || '#fff';
                                return (
                                    <div key={c.id} title={c.nome} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: ativa ? `${corDef}20` : 'rgba(255,255,255,0.02)', border: `1px solid ${ativa ? corDef : '#222'}`, padding: '8px 4px', borderRadius: '6px', transition: '0.3s' }}>
                                        <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>{c.icone}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '15px' }}>
                                            <button onClick={() => modificarCondicaoSandbox(c.id, -1)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 0, fontSize: '1.2em', fontWeight: 'bold' }}>-</button>
                                            <strong style={{ color: ativa ? corDef : '#555', fontSize: '1em', minWidth: '12px', textAlign: 'center' }}>{ativa ? ativa.stacks : 0}</strong>
                                            <button onClick={() => modificarCondicaoSandbox(c.id, 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '1.2em', fontWeight: 'bold' }}>+</button>
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