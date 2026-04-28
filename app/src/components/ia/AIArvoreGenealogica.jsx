import React, { useState, useEffect } from 'react';

export default function AIArvoreGenealogica() {
    // Carrega do LocalStorage ou inicia com uma família base
    const [familias, setFamilias] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_arvore');
        if (salvo) return JSON.parse(salvo);
        return {
            "Ackermann": [
                { id: 1, nome: "Natsu Ackermann", papel: "Protagonista", classe: "Mago Psíquico", elemento: "Fogo Sombrio", hp: "150", mana: "200", status: "Vivo", lore: "Acordou na vila Hage sem memórias." }
            ]
        };
    });

    const [familiaAtiva, setFamiliaAtiva] = useState('Ackermann');
    const [npcSelecionado, setNpcSelecionado] = useState(null);
    const [novaFamiliaInput, setNovaFamiliaInput] = useState('');

    // Salva automaticamente no LocalStorage qualquer alteração
    useEffect(() => {
        localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(familias));
    }, [familias]);

    const criarFamilia = () => {
        if (novaFamiliaInput.trim() !== '' && !familias[novaFamiliaInput]) {
            setFamilias({ ...familias, [novaFamiliaInput]: [] });
            setFamiliaAtiva(novaFamiliaInput);
            setNovaFamiliaInput('');
        }
    };

    const adicionarNovoMembro = () => {
        const novoId = Date.now();
        const novoNpc = { id: novoId, nome: "Novo Personagem", papel: "", classe: "", elemento: "", hp: "", mana: "", status: "Vivo", lore: "" };
        setFamilias({
            ...familias,
            [familiaAtiva]: [...familias[familiaAtiva], novoNpc]
        });
        setNpcSelecionado(novoNpc); 
    };

    const atualizarNpc = (campo, valor) => {
        if (!npcSelecionado) return;
        const npcAtualizado = { ...npcSelecionado, [campo]: valor };
        setNpcSelecionado(npcAtualizado);
        
        const listaAtualizada = familias[familiaAtiva].map(npc => 
            npc.id === npcSelecionado.id ? npcAtualizado : npc
        );
        setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
    };

    const deletarNpc = (id) => {
        if(window.confirm("Tem certeza que deseja apagar este NPC permanentemente?")) {
            const listaAtualizada = familias[familiaAtiva].filter(npc => npc.id !== id);
            setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
            if (npcSelecionado && npcSelecionado.id === id) setNpcSelecionado(null);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', minHeight: '60vh' }}>
            
            {/* 🌳 LADO ESQUERDO: LISTA DE FAMÍLIAS E MEMBROS */}
            <div className="def-box" style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                <h3 style={{ color: '#b180ff', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>🌳 Clãs & Famílias</h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input 
                        type="text" 
                        className="input-neon"
                        placeholder="Nome do Novo Clã..." 
                        value={novaFamiliaInput} 
                        onChange={(e) => setNovaFamiliaInput(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderColor: '#b180ff', color: '#fff' }}
                    />
                    <button className="btn-neon" onClick={criarFamilia} style={{ borderColor: '#b180ff', color: '#b180ff', padding: '0 15px', margin: 0 }}>➕ CRIAR</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {Object.keys(familias).map(fam => (
                        <button 
                            key={fam} 
                            className="btn-neon"
                            onClick={() => { setFamiliaAtiva(fam); setNpcSelecionado(null); }}
                            style={{ 
                                background: familiaAtiva === fam ? 'rgba(177, 128, 255, 0.2)' : 'transparent', 
                                color: familiaAtiva === fam ? '#fff' : '#aaa', 
                                borderColor: familiaAtiva === fam ? '#b180ff' : '#444', 
                                padding: '5px 15px', margin: 0
                            }}
                        >
                            {fam}
                        </button>
                    ))}
                </div>

                {familiaAtiva && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #333', borderRadius: '8px', padding: '15px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ color: '#00ffcc', margin: 0 }}>Membros ({familias[familiaAtiva].length})</h4>
                            <button className="btn-neon btn-green" onClick={adicionarNovoMembro} style={{ padding: '5px 10px', fontSize: '0.8em', margin: 0 }}>➕ NOVO MEMBRO</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {familias[familiaAtiva].map(npc => (
                                <div 
                                    key={npc.id} 
                                    onClick={() => setNpcSelecionado(npc)}
                                    style={{ 
                                        background: npcSelecionado?.id === npc.id ? 'rgba(0, 255, 204, 0.1)' : 'rgba(0,0,0,0.6)', 
                                        border: `1px solid ${npcSelecionado?.id === npc.id ? '#00ffcc' : '#333'}`, 
                                        padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: '0.2s'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: npcSelecionado?.id === npc.id ? '#00ffcc' : '#fff' }}>{npc.nome || 'Desconhecido'}</div>
                                        <div style={{ color: '#888', fontSize: '0.8em', marginTop: '4px' }}>{npc.papel || 'NPC'} • {npc.status}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deletarNpc(npc.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '1.2em', cursor: 'pointer' }} title="Deletar">🗑️</button>
                                </div>
                            ))}
                            {familias[familiaAtiva].length === 0 && <p style={{ color: '#555', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>Nenhum membro neste clã.</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* 📋 LADO DIREITO: FICHA DE NPC AUTOMÁTICA */}
            <div className="def-box" style={{ flex: '1.2', display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>📋 Construtor de Ficha</h3>
                    {npcSelecionado && <span style={{ fontSize: '0.8em', color: '#888', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #333' }}>ID: {npcSelecionado.id}</span>}
                </div>

                {!npcSelecionado ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', textAlign: 'center', fontStyle: 'italic' }}>
                        Selecione um membro na árvore <br/> para visualizar e editar sua ficha.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <div>
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Nome Completo</label>
                            <input type="text" className="input-neon" value={npcSelecionado.nome} onChange={(e) => atualizarNpc('nome', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Papel na Lore</label>
                                <input type="text" className="input-neon" placeholder="Ex: Vilão, Aliado..." value={npcSelecionado.papel} onChange={(e) => atualizarNpc('papel', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Status Atual</label>
                                <select className="input-neon" value={npcSelecionado.status} onChange={(e) => atualizarNpc('status', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', background: 'rgba(0,0,0,0.8)', boxSizing: 'border-box' }}>
                                    <option value="Vivo">Vivo</option>
                                    <option value="Morto">Morto</option>
                                    <option value="Desaparecido">Desaparecido</option>
                                    <option value="Selado">Selado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#ffcc00', fontSize: '0.8em', textTransform: 'uppercase' }}>Classe / Raça</label>
                                <input type="text" className="input-neon" value={npcSelecionado.classe} onChange={(e) => atualizarNpc('classe', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#ff4444', fontSize: '0.8em', textTransform: 'uppercase' }}>Elemento Mágico</label>
                                <input type="text" className="input-neon" value={npcSelecionado.elemento} onChange={(e) => atualizarNpc('elemento', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Pontos de Vida (HP)</label>
                                <input type="number" className="input-neon" value={npcSelecionado.hp} onChange={(e) => atualizarNpc('hp', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#44ff44', marginTop: '5px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Mana / Energia</label>
                                <input type="number" className="input-neon" value={npcSelecionado.mana} onChange={(e) => atualizarNpc('mana', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#44bbff', marginTop: '5px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Histórico / Lore (Sincronizado)</label>
                            <textarea 
                                className="input-neon"
                                value={npcSelecionado.lore} 
                                onChange={(e) => atualizarNpc('lore', e.target.value)} 
                                style={{ width: '100%', flex: 1, minHeight: '150px', padding: '10px', borderColor: '#333', color: '#aaa', marginTop: '5px', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box' }} 
                            />
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}