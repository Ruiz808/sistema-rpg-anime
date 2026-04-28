import React, { useState, useEffect } from 'react';

export default function AIArvoreGenealogica() {
    // Carrega do LocalStorage ou inicia com uma família base
    const [familias, setFamilias] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_arvore');
        if (salvo) return JSON.parse(salvo);
        return {
            "Ackermann": [
                { id: 1, nome: "Natsu Ackermann", papel: "Protagonista", classe: "Mago Psíquico", elemento: "Fogo Sombrio", hp: "150", mana: "200", status: "Vivo", lore: "Acordou na vila Hage sem memórias.", parentId: null }
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

    // ==========================================
    // 🛠️ LÓGICA DO SISTEMA
    // ==========================================
    const criarFamilia = () => {
        if (novaFamiliaInput.trim() !== '' && !familias[novaFamiliaInput]) {
            setFamilias({ ...familias, [novaFamiliaInput]: [] });
            setFamiliaAtiva(novaFamiliaInput);
            setNovaFamiliaInput('');
        }
    };

    const adicionarMembro = (parentId = null) => {
        const novoId = Date.now();
        const novoNpc = { 
            id: novoId, 
            nome: parentId ? "Novo Herdeiro" : "Fundador(a)", 
            papel: "", classe: "", elemento: "", hp: "", mana: "", status: "Vivo", lore: "", 
            parentId: parentId 
        };
        
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
        if(window.confirm("Apagar este NPC? (Seus filhos continuarão na árvore como fundadores independentes)")) {
            // Se deletar o pai, os filhos ficam órfãos (parentId = null) para não sumirem
            const listaAtualizada = familias[familiaAtiva]
                .filter(npc => npc.id !== id)
                .map(npc => npc.parentId === id ? { ...npc, parentId: null } : npc);
            
            setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
            if (npcSelecionado && npcSelecionado.id === id) setNpcSelecionado(null);
        }
    };

    // ==========================================
    // 🌳 MOTOR DA ÁRVORE GENEALÓGICA (RECURSIVO)
    // ==========================================
    const renderArvore = (parentId = null) => {
        const filhos = familias[familiaAtiva]?.filter(npc => npc.parentId === parentId) || [];
        
        if (filhos.length === 0) return null;

        return (
            <ul>
                {filhos.map(npc => {
                    const isMorto = npc.status === 'Morto';
                    const isSelecionado = npcSelecionado?.id === npc.id;

                    return (
                        <li key={npc.id}>
                            <div 
                                className="arvore-node"
                                style={{ 
                                    background: isSelecionado ? 'rgba(0, 255, 204, 0.1)' : 'rgba(0,0,0,0.6)', 
                                    borderColor: isSelecionado ? '#00ffcc' : (isMorto ? '#ff4444' : '#333'),
                                    boxShadow: isSelecionado ? '0 0 15px rgba(0, 255, 204, 0.3)' : 'none'
                                }}
                                onClick={() => setNpcSelecionado(npc)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); deletarNpc(npc.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '12px', cursor: 'pointer' }} title="Deletar">✖</button>
                                </div>
                                <div style={{ fontWeight: 'bold', color: isMorto ? '#ff4444' : (isSelecionado ? '#00ffcc' : '#fff'), fontSize: '14px', marginTop: '5px' }}>
                                    {npc.nome || 'Desconhecido'}
                                </div>
                                <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
                                    {npc.papel || 'NPC'} • {npc.status}
                                </div>
                                <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '8px' }}>
                                    <button 
                                        className="btn-neon" 
                                        onClick={(e) => { e.stopPropagation(); adicionarMembro(npc.id); }} 
                                        style={{ padding: '2px 8px', fontSize: '10px', margin: 0, borderColor: '#0088ff', color: '#0088ff' }}
                                        title="Adicionar Herdeiro/Filho"
                                    >
                                        ➕ Herdeiro
                                    </button>
                                </div>
                            </div>
                            
                            {/* Renderiza os filhos deste NPC (Recursão pura!) */}
                            {renderArvore(npc.id)}
                        </li>
                    );
                })}
            </ul>
        );
    };


    // ==========================================
    // 🎨 RENDERIZAÇÃO PRINCIPAL
    // ==========================================
    return (
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', minHeight: '65vh' }}>
            
            {/* 🌳 LADO ESQUERDO: O VISUALIZADOR DA ÁRVORE */}
            <div className="def-box" style={{ flex: '1.5', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ color: '#b180ff', margin: 0 }}>🌳 Linhagens & Clãs</h3>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            className="input-neon"
                            placeholder="Nome do Novo Clã..." 
                            value={novaFamiliaInput} 
                            onChange={(e) => setNovaFamiliaInput(e.target.value)}
                            style={{ padding: '5px 10px', borderColor: '#b180ff', color: '#fff', width: '150px' }}
                        />
                        <button className="btn-neon" onClick={criarFamilia} style={{ borderColor: '#b180ff', color: '#b180ff', padding: '0 15px', margin: 0 }}>➕ CLÃ</button>
                    </div>
                </div>

                {/* Seleção do Clã Atual */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
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

                {/* O MAPA GENEALÓGICO */}
                {familiaAtiva && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #1a2333', borderRadius: '8px', padding: '20px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <button className="btn-neon btn-green" onClick={() => adicionarMembro(null)} style={{ padding: '8px 15px', margin: 0, boxShadow: '0 0 10px rgba(0,255,0,0.2)' }}>
                                👑 Adicionar Fundador (Linhagem Principal)
                            </button>
                        </div>

                        {/* O Motor CSS que desenha as linhas da árvore */}
                        <div className="genealogy-tree">
                            {familias[familiaAtiva]?.filter(n => n.parentId === null).length === 0 ? (
                                <p style={{ color: '#555', fontStyle: 'italic' }}>Este clã ainda não possui membros.</p>
                            ) : (
                                renderArvore(null)
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* 📋 LADO DIREITO: FICHA DE NPC */}
            <div className="def-box" style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>📋 Construtor de Ficha</h3>
                    {npcSelecionado && <span style={{ fontSize: '0.8em', color: '#888', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #333' }}>ID: {npcSelecionado.id}</span>}
                </div>

                {!npcSelecionado ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', textAlign: 'center', fontStyle: 'italic' }}>
                        Clique em um membro da árvore <br/> para visualizar e editar sua ficha.
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

            {/* 🎨 O MOTOR CSS QUE DESENHA AS LINHAS DA ÁRVORE */}
            <style dangerouslySetInnerHTML={{__html: `
                .genealogy-tree {
                    display: inline-block;
                    text-align: center;
                }
                .genealogy-tree ul {
                    padding-top: 20px; 
                    position: relative;
                    transition: all 0.5s;
                    display: flex;
                    justify-content: center;
                    padding-left: 0;
                    margin: 0;
                }
                .genealogy-tree li {
                    float: left; text-align: center;
                    list-style-type: none;
                    position: relative;
                    padding: 20px 10px 0 10px;
                    transition: all 0.5s;
                }
                /* As linhas conectoras */
                .genealogy-tree li::before, .genealogy-tree li::after {
                    content: '';
                    position: absolute; top: 0; right: 50%;
                    border-top: 2px solid #1a2333;
                    width: 50%; height: 20px;
                }
                .genealogy-tree li::after {
                    right: auto; left: 50%;
                    border-left: 2px solid #1a2333;
                }
                /* Limpeza de bordas paras folhas únicas e fundadores */
                .genealogy-tree li:only-child::after, .genealogy-tree li:only-child::before {
                    display: none;
                }
                .genealogy-tree li:only-child { padding-top: 0; }
                .genealogy-tree li:first-child::before, .genealogy-tree li:last-child::after {
                    border: 0 none;
                }
                /* Curvas nas pontas */
                .genealogy-tree li:last-child::before {
                    border-right: 2px solid #1a2333;
                    border-radius: 0 5px 0 0;
                }
                .genealogy-tree li:first-child::after {
                    border-radius: 5px 0 0 0;
                }
                /* Linha descendo do pai */
                .genealogy-tree ul::before {
                    content: '';
                    position: absolute; top: 0; left: 50%;
                    border-left: 2px solid #1a2333;
                    width: 0; height: 20px;
                    margin-left: -1px;
                }
                /* O Design do Card do Personagem (Node) */
                .arvore-node {
                    border: 1px solid #333;
                    padding: 10px 15px;
                    text-decoration: none;
                    display: inline-block;
                    border-radius: 8px;
                    transition: all 0.3s;
                    min-width: 140px;
                    cursor: pointer;
                    position: relative;
                }
                .arvore-node:hover {
                    background: rgba(0, 255, 204, 0.05) !important;
                    border-color: rgba(0, 255, 204, 0.5) !important;
                }
                /* Efeito Neon na linha quando seleciona */
                .genealogy-tree li:hover > .arvore-node {
                    border-color: #00ffcc;
                }
            `}} />
        </div>
    );
}