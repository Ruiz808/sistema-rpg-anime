import React, { useState, useEffect, useRef } from 'react';

export default function AIArvoreGenealogica() {
    // 💾 CARREGA DO LOCALSTORAGE (Ou inicia vazio)
    const [familias, setFamilias] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_arvore');
        if (salvo) return JSON.parse(salvo);
        return {
            "Ackermann": [
                { id: 1, nome: "Natsu Ackermann", conjuge: "Lucy Heartfilia", papel: "Protagonista", classe: "Mago Psíquico", elemento: "Fogo Sombrio", hp: "150", mana: "200", status: "Vivo", lore: "Fundador principal.", parentId: null },
                { id: 2, nome: "Filho do Natsu", conjuge: "", papel: "Herdeiro", classe: "Mago", elemento: "Fogo", hp: "100", mana: "100", status: "Vivo", lore: "Herdeiro da família.", parentId: 1 }
            ]
        };
    });

    const [familiaAtiva, setFamiliaAtiva] = useState('Ackermann');
    const [npcSelecionado, setNpcSelecionado] = useState(null);
    const [novaFamiliaInput, setNovaFamiliaInput] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(familias));
    }, [familias]);

    // ==========================================
    // 🛠️ SISTEMA DE FAMÍLIAS E MEMBROS
    // ==========================================
    const criarFamilia = () => {
        if (novaFamiliaInput.trim() !== '' && !familias[novaFamiliaInput]) {
            setFamilias({ ...familias, [novaFamiliaInput]: [] });
            setFamiliaAtiva(novaFamiliaInput);
            setNovaFamiliaInput('');
            setNpcSelecionado(null);
        }
    };

    const deletarFamilia = (nomeFam) => {
        if(window.confirm(`ATENÇÃO! Deseja apagar o CLÃ ${nomeFam} e TODOS os seus membros?`)) {
            const novasFamilias = { ...familias };
            delete novasFamilias[nomeFam];
            setFamilias(novasFamilias);
            const chaves = Object.keys(novasFamilias);
            setFamiliaAtiva(chaves.length > 0 ? chaves[0] : null);
            setNpcSelecionado(null);
        }
    }

    const adicionarMembro = (parentId = null) => {
        const novoId = Date.now();
        const novoNpc = { 
            id: novoId, 
            nome: parentId ? "Novo Herdeiro" : "Fundador(a)", 
            conjuge: "", // 💍 Novo campo de Casal
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
        
        // Regra de Ouro: Um personagem não pode ser pai dele mesmo kkkk
        if (campo === 'parentId' && valor === npcSelecionado.id) return alert("Erro no paradoxo temporal: Você não pode ser seu próprio pai.");

        const npcAtualizado = { ...npcSelecionado, [campo]: valor };
        setNpcSelecionado(npcAtualizado);
        
        const listaAtualizada = familias[familiaAtiva].map(npc => 
            npc.id === npcSelecionado.id ? npcAtualizado : npc
        );
        setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
    };

    const deletarNpc = (id) => {
        if(window.confirm("Apagar este NPC? (Seus filhos se tornarão fundadores órfãos para não serem deletados junto)")) {
            const listaAtualizada = familias[familiaAtiva]
                .filter(npc => npc.id !== id)
                .map(npc => npc.parentId === id ? { ...npc, parentId: null } : npc);
            
            setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
            if (npcSelecionado && npcSelecionado.id === id) setNpcSelecionado(null);
        }
    };

    // ==========================================
    // 💾 SISTEMA DE BACKUP (SAVE/LOAD)
    // ==========================================
    const exportarBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(familias, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", `rpg_arvore_genealogica_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const importarBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evento) => {
            try {
                const dados = JSON.parse(evento.target.result);
                setFamilias(dados);
                setFamiliaAtiva(Object.keys(dados)[0] || null);
                setNpcSelecionado(null);
                alert("✅ Backup carregado com sucesso!");
            } catch (err) {
                alert("❌ Erro ao ler o arquivo. Tem certeza que é o JSON da árvore?");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reseta o input
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
                                className="arvore-node-container"
                                style={{ 
                                    borderColor: isSelecionado ? '#00ffcc' : (isMorto ? '#ff4444' : '#333'),
                                    boxShadow: isSelecionado ? '0 0 15px rgba(0, 255, 204, 0.3)' : 'none'
                                }}
                                onClick={() => setNpcSelecionado(npc)}
                            >
                                {/* Botão Excluir */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-5px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); deletarNpc(npc.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '14px', cursor: 'pointer' }} title="Deletar Personagem">✖</button>
                                </div>

                                {/* Box do Casal / Personagem Principal */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    {/* O Titular */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: isMorto ? '#ff4444' : (isSelecionado ? '#00ffcc' : '#fff'), fontSize: '15px' }}>
                                            {npc.nome || 'Desconhecido'}
                                        </div>
                                        <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                                            {npc.papel || 'NPC'}
                                        </div>
                                    </div>

                                    {/* 💍 O Cônjuge (Se existir) */}
                                    {npc.conjuge && (
                                        <>
                                            <div style={{ color: '#ffcc00', fontSize: '12px' }}>💍</div>
                                            <div style={{ textAlign: 'center', paddingLeft: '5px', borderLeft: '1px dashed #555' }}>
                                                <div style={{ fontWeight: 'bold', color: '#ccc', fontSize: '13px' }}>
                                                    {npc.conjuge}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                                                    Cônjuge
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Botão de Adicionar Filho */}
                                <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '8px' }}>
                                    <button 
                                        className="btn-neon" 
                                        onClick={(e) => { e.stopPropagation(); adicionarMembro(npc.id); }} 
                                        style={{ padding: '2px 8px', fontSize: '11px', margin: 0, borderColor: '#0088ff', color: '#0088ff' }}
                                        title="Adicionar Herdeiro/Filho"
                                    >
                                        ➕ Gerar Herdeiro
                                    </button>
                                </div>
                            </div>
                            
                            {/* Renderiza os filhos deste Casal/NPC */}
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
            <div className="def-box" style={{ flex: '1.5', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden', position: 'relative' }}>
                
                {/* Cabeçalho da Esquerda */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ color: '#b180ff', margin: 0 }}>🌳 Linhagens & Clãs</h3>
                    
                    {/* Botões de SAVE / LOAD */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-neon btn-blue" onClick={exportarBackup} style={{ padding: '5px 10px', fontSize: '11px', margin: 0 }}>💾 Backup</button>
                        <input type="file" ref={fileInputRef} accept=".json" onChange={importarBackup} style={{ display: 'none' }} />
                        <button className="btn-neon btn-gold" onClick={() => fileInputRef.current?.click()} style={{ padding: '5px 10px', fontSize: '11px', margin: 0 }}>📂 Carregar</button>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            className="input-neon"
                            placeholder="Nome do Novo Clã..." 
                            value={novaFamiliaInput} 
                            onChange={(e) => setNovaFamiliaInput(e.target.value)}
                            style={{ padding: '5px 10px', borderColor: '#b180ff', color: '#fff', width: '130px', fontSize: '12px' }}
                        />
                        <button className="btn-neon" onClick={criarFamilia} style={{ borderColor: '#b180ff', color: '#b180ff', padding: '0 10px', margin: 0, fontSize: '12px' }}>➕ CLÃ</button>
                    </div>
                </div>

                {/* Seleção do Clã Ativo */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', maxHeight: '60px', overflowY: 'auto' }}>
                    {Object.keys(familias).map(fam => (
                        <div key={fam} style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                className="btn-neon"
                                onClick={() => { setFamiliaAtiva(fam); setNpcSelecionado(null); }}
                                style={{ 
                                    background: familiaAtiva === fam ? 'rgba(177, 128, 255, 0.2)' : 'transparent', 
                                    color: familiaAtiva === fam ? '#fff' : '#aaa', 
                                    borderColor: familiaAtiva === fam ? '#b180ff' : '#444', 
                                    padding: '5px 15px', margin: 0, borderRight: 'none', borderRadius: '5px 0 0 5px'
                                }}
                            >
                                {fam}
                            </button>
                            <button 
                                onClick={() => deletarFamilia(fam)}
                                style={{ background: '#ff003c22', border: '1px solid #444', borderLeft: 'none', borderRadius: '0 5px 5px 0', padding: '6px 8px', color: '#ff4444', cursor: 'pointer' }}
                                title="Apagar Família Inteira"
                            >
                                ✖
                            </button>
                        </div>
                    ))}
                </div>

                {/* O MAPA GENEALÓGICO */}
                {familiaAtiva && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #1a2333', borderRadius: '8px', padding: '20px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <button className="btn-neon btn-green" onClick={() => adicionarMembro(null)} style={{ padding: '8px 15px', margin: 0, boxShadow: '0 0 10px rgba(0,255,0,0.2)' }}>
                                👑 Adicionar Fundador Primordial
                            </button>
                        </div>

                        {/* Motor CSS que desenha as linhas */}
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

            {/* 📋 LADO DIREITO: FICHA E REPARENTING */}
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
                        
                        {/* 🔥 MOVER DE GALHO (Mudar a Filiação na hora) */}
                        <div style={{ background: 'rgba(0, 136, 255, 0.1)', border: '1px solid #0088ff', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ color: '#0088ff', fontSize: '0.8em', textTransform: 'uppercase', fontWeight: 'bold' }}>🧬 Descende de (Pai/Mãe na Árvore):</label>
                            <select 
                                className="input-neon" 
                                value={npcSelecionado.parentId || ""} 
                                onChange={(e) => atualizarNpc('parentId', e.target.value === "" ? null : Number(e.target.value))} 
                                style={{ width: '100%', padding: '8px', borderColor: '#0088ff', color: '#fff', marginTop: '5px', background: '#05070a', boxSizing: 'border-box' }}
                            >
                                <option value="">👑 Nenhum (É um Fundador independente)</option>
                                {/* Lista todo mundo da família, menos ele mesmo, para ser o pai */}
                                {familias[familiaAtiva].filter(n => n.id !== npcSelecionado.id).map(n => (
                                    <option key={n.id} value={n.id}>↳ {n.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Nome Completo do Titular</label>
                            <input type="text" className="input-neon" value={npcSelecionado.nome} onChange={(e) => atualizarNpc('nome', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                        </div>

                        {/* 💍 CAMPO DE CÔNJUGE */}
                        <div>
                            <label style={{ color: '#ffcc00', fontSize: '0.8em', textTransform: 'uppercase' }}>💍 Cônjuge / Parceiro(a) (Opcional)</label>
                            <input type="text" className="input-neon" placeholder="Nome de quem gerou os filhos junto..." value={npcSelecionado.conjuge || ""} onChange={(e) => atualizarNpc('conjuge', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#ffcc00', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Papel na Lore</label>
                                <input type="text" className="input-neon" placeholder="Ex: Herdeiro, Bastardo..." value={npcSelecionado.papel} onChange={(e) => atualizarNpc('papel', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Status Atual</label>
                                <select className="input-neon" value={npcSelecionado.status} onChange={(e) => atualizarNpc('status', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', background: 'rgba(0,0,0,0.8)', boxSizing: 'border-box' }}>
                                    <option value="Vivo">Vivo</option>
                                    <option value="Morto">Morto (Fica Vermelho)</option>
                                    <option value="Desaparecido">Desaparecido</option>
                                    <option value="Selado">Selado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase' }}>Classe / Raça</label>
                                <input type="text" className="input-neon" value={npcSelecionado.classe} onChange={(e) => atualizarNpc('classe', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase' }}>Elemento Mágico</label>
                                <input type="text" className="input-neon" value={npcSelecionado.elemento} onChange={(e) => atualizarNpc('elemento', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#44ff44', fontSize: '0.8em', textTransform: 'uppercase' }}>Pontos de Vida (HP)</label>
                                <input type="number" className="input-neon" value={npcSelecionado.hp} onChange={(e) => atualizarNpc('hp', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#44ff44', marginTop: '5px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#44bbff', fontSize: '0.8em', textTransform: 'uppercase' }}>Mana / Energia</label>
                                <input type="number" className="input-neon" value={npcSelecionado.mana} onChange={(e) => atualizarNpc('mana', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#44bbff', marginTop: '5px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Histórico / Lore (Sincronizado)</label>
                            <textarea 
                                className="input-neon"
                                value={npcSelecionado.lore} 
                                onChange={(e) => atualizarNpc('lore', e.target.value)} 
                                style={{ width: '100%', flex: 1, minHeight: '120px', padding: '10px', borderColor: '#333', color: '#aaa', marginTop: '5px', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box' }} 
                            />
                        </div>

                    </div>
                )}
            </div>

            {/* 🎨 MOTOR CSS DA ÁRVORE (AGORA COM CAIXA QUE EXPANDE PARA O CASAL) */}
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
                    padding: 20px 15px 0 15px;
                    transition: all 0.5s;
                }
                /* As linhas horizontais conectoras dos filhos */
                .genealogy-tree li::before, .genealogy-tree li::after {
                    content: '';
                    position: absolute; top: 0; right: 50%;
                    border-top: 2px solid #334455;
                    width: 50%; height: 20px;
                }
                .genealogy-tree li::after {
                    right: auto; left: 50%;
                    border-left: 2px solid #334455;
                }
                .genealogy-tree li:only-child::after, .genealogy-tree li:only-child::before {
                    display: none;
                }
                .genealogy-tree li:only-child { padding-top: 0; }
                .genealogy-tree li:first-child::before, .genealogy-tree li:last-child::after {
                    border: 0 none;
                }
                /* Curvas */
                .genealogy-tree li:last-child::before {
                    border-right: 2px solid #334455;
                    border-radius: 0 5px 0 0;
                }
                .genealogy-tree li:first-child::after {
                    border-radius: 5px 0 0 0;
                }
                /* Linha descendo do pai/casal para os filhos */
                .genealogy-tree ul::before {
                    content: '';
                    position: absolute; top: 0; left: 50%;
                    border-left: 2px solid #334455;
                    width: 0; height: 20px;
                    margin-left: -1px;
                }
                
                /* O Design da Caixa do Personagem/Casal */
                .arvore-node-container {
                    background: rgba(0,0,0,0.7);
                    border: 1px solid #333;
                    padding: 10px 15px;
                    text-decoration: none;
                    display: inline-block;
                    border-radius: 8px;
                    transition: all 0.3s;
                    min-width: 150px;
                    cursor: pointer;
                    position: relative;
                }
                .arvore-node-container:hover {
                    background: rgba(0, 255, 204, 0.1) !important;
                    border-color: rgba(0, 255, 204, 0.6) !important;
                }
                .genealogy-tree li:hover > .arvore-node-container {
                    border-color: #00ffcc;
                }
            `}} />
        </div>
    );
}