import React, { useState, useEffect, useRef } from 'react';
import useStore, { sanitizarNome } from '../../stores/useStore'; 
import { ref, set } from 'firebase/database'; 
import { database } from '../../services/firebase-config'; 

export default function AIArvoreGenealogica() {
    // 💾 CONEXÃO COM O ZUSTAND 
    const personagens = useStore(s => s.personagens);

    // 💾 CARREGA DO LOCALSTORAGE DA ÁRVORE (Ou inicia vazio)
    const [familias, setFamilias] = useState(() => {
        const salvo = localStorage.getItem('rpgSextaFeira_arvore');
        if (salvo) return JSON.parse(salvo);
        return {
            "Ackermann": [
                { id: 1, nome: "Natsu Ackermann", avatar: "", parceiros: "Lucy Heartfilia", papel: "Protagonista", classe: "Mago Psíquico", elemento: "Fogo Sombrio", hp: "150000", mana: "200000", status: "Vivo", lore: "Fundador principal.", parentId: null },
                { id: 2, nome: "Filho do Natsu", avatar: "", parceiros: "", genitor2: "Lucy Heartfilia", papel: "Herdeiro", classe: "Mago", elemento: "Fogo", hp: "100000", mana: "100000", status: "Vivo", lore: "Herdeiro da família.", parentId: 1 }
            ]
        };
    });

    const [familiaAtiva, setFamiliaAtiva] = useState('Ackermann');
    const [npcSelecionado, setNpcSelecionado] = useState(null);
    const [novaArvoreInput, setNovaArvoreInput] = useState('');
    const fileInputRef = useRef(null);

    // 💾 SALVA QUALQUER MUDANÇA NA HORA
    useEffect(() => {
        localStorage.setItem('rpgSextaFeira_arvore', JSON.stringify(familias));
    }, [familias]);

    const getIniciais = (nome) => {
        if (!nome) return "?";
        const partes = nome.trim().split(' ').filter(Boolean);
        if (partes.length === 0) return "?";
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    };

    // ==========================================
    // 🛠️ SISTEMA DE ÁRVORES E MEMBROS
    // ==========================================
    const criarFamilia = () => {
        if (novaArvoreInput.trim() !== '' && !familias[novaArvoreInput]) {
            setFamilias({ ...familias, [novaArvoreInput]: [] });
            setFamiliaAtiva(novaArvoreInput);
            setNovaArvoreInput('');
            setNpcSelecionado(null);
        }
    };

    const editarNomeFamilia = (nomeAtual) => {
        const novoNome = window.prompt("Digite o novo nome para esta Árvore:", nomeAtual);
        if (!novoNome || novoNome.trim() === '' || novoNome === nomeAtual) return;
        if (familias[novoNome]) return alert("Já existe uma árvore com este nome!");

        const novasFamilias = { ...familias };
        novasFamilias[novoNome] = novasFamilias[nomeAtual];
        delete novasFamilias[nomeAtual];

        setFamilias(novasFamilias);
        if (familiaAtiva === nomeAtual) setFamiliaAtiva(novoNome);
    };

    const deletarFamilia = (nomeFam) => {
        if(window.confirm(`ATENÇÃO! Deseja apagar a ÁRVORE "${nomeFam}" e TODOS os seus membros permanentemente?`)) {
            const novasFamilias = { ...familias };
            delete novasFamilias[nomeFam];
            setFamilias(novasFamilias);
            const chaves = Object.keys(novasFamilias);
            setFamiliaAtiva(chaves.length > 0 ? chaves[0] : null);
            setNpcSelecionado(null);
        }
    }

    const adicionarMembro = (parentId = null, genitor2 = "") => {
        if (!familiaAtiva) return alert("Crie ou selecione uma árvore primeiro!");
        
        const novoId = Date.now();
        const novoNpc = { 
            id: novoId, 
            nome: parentId ? "Novo Herdeiro" : "Fundador(a)", 
            avatar: "", 
            parceiros: "", 
            genitor2: genitor2, 
            papel: "", classe: "", elemento: "", hp: "100000", mana: "100000", status: "Vivo", lore: "", 
            parentId: parentId 
        };
        
        setFamilias({
            ...familias,
            [familiaAtiva]: [...(familias[familiaAtiva] || []), novoNpc]
        });
        setNpcSelecionado(novoNpc); 
    };

    const atualizarNpc = (campo, valor) => {
        if (!npcSelecionado || !familiaAtiva) return;
        
        if (campo === 'parentId' && valor === npcSelecionado.id) return alert("Erro de paradoxo: Você não pode ser pai de si mesmo.");

        const npcAtualizado = { ...npcSelecionado, [campo]: valor };
        setNpcSelecionado(npcAtualizado);
        
        const listaAtualizada = (familias[familiaAtiva] || []).map(npc => 
            npc.id === npcSelecionado.id ? npcAtualizado : npc
        );
        setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
    };

    const deletarNpc = (id) => {
        if (!familiaAtiva) return;
        if(window.confirm("Apagar este NPC? (Seus filhos se tornarão fundadores órfãos soltos na árvore para não sumirem)")) {
            const listaAtualizada = (familias[familiaAtiva] || [])
                .filter(npc => npc.id !== id)
                .map(npc => npc.parentId === id ? { ...npc, parentId: null } : npc);
            
            setFamilias({ ...familias, [familiaAtiva]: listaAtualizada });
            if (npcSelecionado && npcSelecionado.id === id) setNpcSelecionado(null);
        }
    };

    // ==========================================
    // 🚀 INTEGRAÇÃO: O CAVALO DE TROIA DO FIREBASE
    // ==========================================
    const injetarNaMesa = async () => {
        if (!npcSelecionado || !npcSelecionado.nome || npcSelecionado.nome.trim() === '') {
            return alert("O NPC precisa ter um Nome Completo antes de ser enviado para a mesa!");
        }

        const nomeOriginal = npcSelecionado.nome.trim();
        // Fallback caso a importação do sanitizarNome falhe por algum motivo
        const funcSanitizar = typeof sanitizarNome === 'function' ? sanitizarNome : (n) => n.replace(/[.#$\[\]\/]/g, '_');
        const nomePersonagem = funcSanitizar(nomeOriginal);

        if (personagens && personagens[nomePersonagem]) {
            if (!window.confirm(`⚠️ O personagem "${nomePersonagem}" já está no Banco de Dados! Deseja sobrescrever a ficha atual dele com os dados da Árvore Genealógica?`)) {
                return;
            }
        }

        const hpValor = Number(npcSelecionado.hp) || 100000;
        const manaValor = Number(npcSelecionado.mana) || 100000;

        // 🔥 A FORJA PERFEITA: Estrutura 100% igual ao MestreForjaNPC 🔥
        // Transformamos a Lore em um Poder para o Firebase não rejeitar chaves extras!
        const fichaParaServidor = {
            bio: { 
                classe: npcSelecionado.classe || 'NPC - Ameaça', 
                raca: npcSelecionado.papel || 'Criatura', 
                mesa: 'npc'
            },
            vida: { atual: hpValor, base: hpValor },
            mana: { atual: manaValor, base: manaValor },
            forca: { base: 1 },         
            destreza: { base: 1 },      
            inteligencia: { base: 1 },  
            avatar: npcSelecionado.avatar ? npcSelecionado.avatar.trim() : "",
            poderes: [
                {
                    nome: "📖 Linhagem & Lore",
                    dano: "0",
                    descricao: `Status: ${npcSelecionado.status || 'Vivo'}\nElemento Mágico: ${npcSelecionado.elemento || 'Nenhum'}\nClã de Origem: ${familiaAtiva}\n\nHistória: ${npcSelecionado.lore || 'Sem registros.'}`
                }
            ],
            formas: [],
            isNPC: true,
            dataCriacao: Date.now()
        };

        try {
            await set(ref(database, `personagens/${nomePersonagem}`), fichaParaServidor);
            alert(`✅ INJEÇÃO CONCLUÍDA! "${nomePersonagem}" driblou a segurança do Firebase e já está na Aba de NPCs do Mestre!`);
        } catch (erro) {
            console.error("Erro Firebase:", erro);
            alert(`❌ Firebase ainda está negando o acesso. \nMotivo: ${erro.message}`);
        }
    };

    // ==========================================
    // 💾 SISTEMA DE BACKUP (SAVE/LOAD DA ÁRVORE)
    // ==========================================
    const exportarBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(familias, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", `rpg_arvores_backup_${new Date().toISOString().slice(0,10)}.json`);
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
                alert("✅ Backup das Árvores carregado com sucesso!");
            } catch (err) {
                alert("❌ Erro ao ler o arquivo. Tem certeza que é o JSON gerado pelo sistema?");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; 
    };

    // ==========================================
    // 🌳 MOTOR DA ÁRVORE (RECURSIVO)
    // ==========================================
    const renderNPC = (npc) => {
        const isMorto = npc.status === 'Morto';
        const isSelecionado = npcSelecionado?.id === npc.id;

        const parceirosRaw = npc.parceiros || npc.conjuge || ""; 
        const parceirosSet = new Set(parceirosRaw.split(',').map(s => s.trim()).filter(Boolean));
        
        const filhos = (familias[familiaAtiva] || []).filter(n => n.parentId === npc.id);
        
        filhos.forEach(f => { if (f.genitor2 && f.genitor2.trim()) parceirosSet.add(f.genitor2.trim()); });
        const parceirosUnicos = Array.from(parceirosSet);

        const corBordaAvatar = isSelecionado ? '#00ffcc' : (isMorto ? '#ff4444' : '#555');

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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-5px' }}>
                        <button onClick={(e) => { e.stopPropagation(); deletarNpc(npc.id); }} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '14px', cursor: 'pointer' }} title="Deletar Personagem">✖</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ 
                                width: '45px', height: '45px', borderRadius: '50%', background: '#1a2333', 
                                border: `2px solid ${corBordaAvatar}`, display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', marginBottom: '8px', overflow: 'hidden',
                                boxShadow: isSelecionado ? '0 0 10px rgba(0,255,204,0.5)' : 'none'
                            }}>
                                {npc.avatar && npc.avatar.trim() !== '' ? (
                                    <img src={npc.avatar} alt={npc.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                ) : null}
                                <span style={{ color: '#aaa', fontSize: '16px', fontWeight: 'bold', display: (npc.avatar && npc.avatar.trim() !== '') ? 'none' : 'block' }}>
                                    {getIniciais(npc.nome)}
                                </span>
                            </div>

                            <div style={{ fontWeight: 'bold', color: isMorto ? '#ff4444' : (isSelecionado ? '#00ffcc' : '#fff'), fontSize: '15px' }}>
                                {npc.nome || 'Desconhecido'}
                            </div>
                            <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                                {npc.papel || 'NPC'}
                            </div>
                        </div>

                        {parceirosUnicos.length === 1 && (
                            <>
                                <div style={{ color: '#ffcc00', fontSize: '12px' }}>💍</div>
                                <div style={{ textAlign: 'center', paddingLeft: '5px', borderLeft: '1px dashed #555' }}>
                                    <div style={{ fontWeight: 'bold', color: '#ccc', fontSize: '13px' }}>{parceirosUnicos[0]}</div>
                                    <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>Parceiro(a)</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '8px' }}>
                        <button 
                            className="btn-neon" 
                            onClick={(e) => { e.stopPropagation(); adicionarMembro(npc.id, parceirosUnicos.length === 1 ? parceirosUnicos[0] : ""); }} 
                            style={{ padding: '2px 8px', fontSize: '11px', margin: 0, borderColor: '#0088ff', color: '#0088ff' }}
                        >
                            ➕ {parceirosUnicos.length > 1 ? 'Herdeiro Geral' : 'Gerar Herdeiro'}
                        </button>
                    </div>
                </div>

                {filhos.length > 0 && parceirosUnicos.length <= 1 && (
                    <ul>{filhos.map(f => renderNPC(f))}</ul>
                )}

                {parceirosUnicos.length > 1 && (
                    <ul>
                        {parceirosUnicos.map(parceiroNome => {
                            const filhosDesteParceiro = filhos.filter(f => (f.genitor2 || "").trim() === parceiroNome);
                            return (
                                <li key={parceiroNome}>
                                    <div className="arvore-node-container" style={{ borderColor: '#ffcc00', padding: '8px 15px', background: 'rgba(255, 204, 0, 0.05)', minWidth: '120px' }}>
                                        <div style={{ color: '#ffcc00', fontSize: '12px', marginBottom: '5px' }}>💍 União com:</div>
                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{parceiroNome}</div>
                                        <div style={{ marginTop: '8px', borderTop: '1px solid #555', paddingTop: '8px' }}>
                                            <button className="btn-neon" onClick={(e) => { e.stopPropagation(); adicionarMembro(npc.id, parceiroNome); }} style={{ padding: '2px 8px', fontSize: '10px', margin: 0, borderColor: '#ffcc00', color: '#ffcc00' }}>➕ Filho(a)</button>
                                        </div>
                                    </div>
                                    {filhosDesteParceiro.length > 0 && (
                                        <ul>{filhosDesteParceiro.map(f => renderNPC(f))}</ul>
                                    )}
                                </li>
                            )
                        })}
                        {filhos.filter(f => !(f.genitor2||"").trim()).length > 0 && (
                            <li key="desconhecido">
                                <div className="arvore-node-container" style={{ borderColor: '#888', padding: '8px 15px', background: 'rgba(255, 255, 255, 0.05)' }}>
                                    <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px' }}>🧬 Outras Linhagens</div>
                                    <div style={{ marginTop: '8px', borderTop: '1px solid #555', paddingTop: '8px' }}>
                                        <button className="btn-neon" onClick={(e) => { e.stopPropagation(); adicionarMembro(npc.id, ""); }} style={{ padding: '2px 8px', fontSize: '10px', margin: 0, borderColor: '#aaa', color: '#aaa' }}>➕ Adicionar</button>
                                    </div>
                                </div>
                                <ul>{filhos.filter(f => !(f.genitor2||"").trim()).map(f => renderNPC(f))}</ul>
                            </li>
                        )}
                    </ul>
                )}
            </li>
        );
    };

    const paiAtivo = (npcSelecionado?.parentId && familiaAtiva) 
        ? (familias[familiaAtiva] || []).find(n => n.id === npcSelecionado.parentId) 
        : null;
    const opcoesGenitor2 = paiAtivo ? Array.from(new Set((paiAtivo.parceiros || paiAtivo.conjuge || "").split(',').map(s=>s.trim()).filter(Boolean))) : [];

    // ==========================================
    // 🎨 RENDERIZAÇÃO PRINCIPAL DA TELA
    // ==========================================
    return (
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', minHeight: '65vh' }}>
            
            {/* 🌳 LADO ESQUERDO: O VISUALIZADOR DA ÁRVORE */}
            <div className="def-box" style={{ flex: '1.5', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden', position: 'relative' }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0, textShadow: '0 0 10px rgba(0,255,204,0.4)' }}>🌳 Suas Árvores</h3>
                    
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-neon btn-blue" onClick={exportarBackup} style={{ padding: '5px 10px', fontSize: '11px', margin: 0 }} title="Baixar todas as Árvores">💾 Backup</button>
                        <input type="file" ref={fileInputRef} accept=".json" onChange={importarBackup} style={{ display: 'none' }} />
                        <button className="btn-neon btn-gold" onClick={() => fileInputRef.current?.click()} style={{ padding: '5px 10px', fontSize: '11px', margin: 0 }}>📂 Carregar</button>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            className="input-neon"
                            placeholder="Criar Nova Árvore..." 
                            value={novaArvoreInput} 
                            onChange={(e) => setNovaArvoreInput(e.target.value)}
                            style={{ padding: '5px 10px', borderColor: '#00ffcc', color: '#fff', width: '140px', fontSize: '12px' }}
                        />
                        <button className="btn-neon btn-green" onClick={criarFamilia} style={{ padding: '0 10px', margin: 0, fontSize: '12px' }}>➕ ADICIONAR</button>
                    </div>
                </div>

                {/* ABAS DAS ÁRVORES */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', maxHeight: '60px', overflowY: 'auto' }}>
                    {Object.keys(familias).map(fam => (
                        <div key={fam} style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                className="btn-neon"
                                onClick={() => { setFamiliaAtiva(fam); setNpcSelecionado(null); }}
                                style={{ 
                                    background: familiaAtiva === fam ? 'rgba(0, 255, 204, 0.2)' : 'transparent', 
                                    color: familiaAtiva === fam ? '#fff' : '#aaa', 
                                    borderColor: familiaAtiva === fam ? '#00ffcc' : '#444', 
                                    padding: '5px 15px', margin: 0, borderRight: 'none', borderRadius: '5px 0 0 5px'
                                }}
                            >
                                {fam}
                            </button>
                            <button 
                                onClick={() => editarNomeFamilia(fam)}
                                style={{ background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #444', borderLeft: '1px dashed #555', borderRight: 'none', padding: '6px 8px', color: '#ffcc00', cursor: 'pointer' }}
                                title="Editar Nome da Árvore"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={() => deletarFamilia(fam)}
                                style={{ background: '#ff003c22', border: '1px solid #444', borderLeft: 'none', borderRadius: '0 5px 5px 0', padding: '6px 8px', color: '#ff4444', cursor: 'pointer' }}
                                title="Apagar Árvore Inteira"
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
                                👑 Adicionar Fundador (Novo Início de Sangue)
                            </button>
                        </div>

                        {/* Motor CSS */}
                        <div className="genealogy-tree">
                            {(familias[familiaAtiva] || []).filter(n => n.parentId === null).length === 0 ? (
                                <p style={{ color: '#555', fontStyle: 'italic' }}>Esta árvore está vazia. Adicione um fundador.</p>
                            ) : (
                                <ul>
                                    {(familias[familiaAtiva] || []).filter(n => n.parentId === null).map(n => renderNPC(n))}
                                </ul>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* 📋 LADO DIREITO: FICHA E FOTO */}
            <div className="def-box" style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                
                {/* HEADER DIREITO + BOTÃO DE INJEÇÃO NA MESA 🔥 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>📋 Editor de Ficha</h3>
                    
                    {npcSelecionado && (
                        <button 
                            onClick={injetarNaMesa}
                            className="btn-neon btn-green"
                            style={{ padding: '5px 15px', margin: 0, fontSize: '12px', boxShadow: '0 0 10px rgba(0, 255, 0, 0.4)' }}
                            title="Criar/Atualizar a ficha deste personagem na Aba de NPCs do Mestre"
                        >
                            🚀 INJETAR NOS NPCs
                        </button>
                    )}
                </div>

                {!npcSelecionado ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', textAlign: 'center', fontStyle: 'italic' }}>
                        Clique em um membro da árvore <br/> para visualizar e editar sua ficha.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* AREA DO AVATAR NA FICHA */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(0, 255, 204, 0.05)', padding: '10px', borderRadius: '8px', border: '1px dashed #00ffcc' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #00ffcc', background: '#05070a', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                {npcSelecionado.avatar && npcSelecionado.avatar.trim() !== '' ? (
                                    <img src={npcSelecionado.avatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                ) : null}
                                <span style={{ color: '#00ffcc', fontSize: '20px', fontWeight: 'bold', display: (npcSelecionado.avatar && npcSelecionado.avatar.trim() !== '') ? 'none' : 'block' }}>
                                    {getIniciais(npcSelecionado.nome)}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase', fontWeight: 'bold' }}>🔗 URL da Foto (Avatar)</label>
                                <input type="text" className="input-neon" placeholder="Cole o link da imagem aqui..." value={npcSelecionado.avatar || ''} onChange={(e) => atualizarNpc('avatar', e.target.value)} style={{ width: '100%', padding: '8px', borderColor: '#00ffcc', color: '#fff', marginTop: '5px', background: '#05070a', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        {/* MOVER DE GALHO */}
                        <div style={{ background: 'rgba(0, 136, 255, 0.1)', border: '1px solid #0088ff', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ color: '#0088ff', fontSize: '0.8em', textTransform: 'uppercase', fontWeight: 'bold' }}>🧬 Descende de (Pai/Mãe Direto):</label>
                            <select 
                                className="input-neon" 
                                value={npcSelecionado.parentId || ""} 
                                onChange={(e) => atualizarNpc('parentId', e.target.value === "" ? null : Number(e.target.value))} 
                                style={{ width: '100%', padding: '8px', borderColor: '#0088ff', color: '#fff', marginTop: '5px', background: '#05070a', boxSizing: 'border-box' }}
                            >
                                <option value="">👑 Nenhum (É um Fundador)</option>
                                {(familias[familiaAtiva] || []).filter(n => n.id !== npcSelecionado.id).map(n => (
                                    <option key={n.id} value={n.id}>↳ {n.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Nome do Titular da Ficha</label>
                            <input type="text" className="input-neon" value={npcSelecionado.nome} onChange={(e) => atualizarNpc('nome', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                        </div>

                        {/* CAMPO DE CÔNJUGES */}
                        <div>
                            <label style={{ color: '#ffcc00', fontSize: '0.8em', textTransform: 'uppercase' }}>💍 Parceiro(s) de Sangue / Cônjuge</label>
                            <input type="text" className="input-neon" placeholder="Separe por vírgulas se houver mais de um. Ex: Lilith, Eva" value={npcSelecionado.parceiros || npcSelecionado.conjuge || ""} onChange={(e) => atualizarNpc('parceiros', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#ffcc00', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            <span style={{ fontSize: '10px', color: '#aaa', display: 'block', marginTop: '4px' }}>Se colocar mais de um nome, a árvore criará divisões separadas.</span>
                        </div>

                        {/* ESCOLHER QUAL PARCEIRO GEROU ELE */}
                        {paiAtivo && opcoesGenitor2.length > 0 && (
                            <div style={{ background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', padding: '10px', borderRadius: '8px' }}>
                                <label style={{ color: '#ffcc00', fontSize: '0.8em', textTransform: 'uppercase', fontWeight: 'bold' }}>👼 Fruto da União com:</label>
                                <select 
                                    className="input-neon" 
                                    value={npcSelecionado.genitor2 || ""} 
                                    onChange={(e) => atualizarNpc('genitor2', e.target.value)} 
                                    style={{ width: '100%', padding: '8px', borderColor: '#ffcc00', color: '#fff', marginTop: '5px', background: '#05070a', boxSizing: 'border-box' }}
                                >
                                    <option value="">Desconhecido / Linhagem Indefinida</option>
                                    {opcoesGenitor2.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase' }}>Papel na Lore / Raça</label>
                                <input type="text" className="input-neon" placeholder="Ex: Demônio, Divindade..." value={npcSelecionado.papel} onChange={(e) => atualizarNpc('papel', e.target.value)} style={{ width: '100%', padding: '10px', borderColor: '#333', color: '#fff', marginTop: '5px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase' }}>Status Atual</label>
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
                                <label style={{ color: '#aaa', fontSize: '0.8em', textTransform: 'uppercase' }}>Classe / Ocupação</label>
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
                            <label style={{ color: '#00ffcc', fontSize: '0.8em', textTransform: 'uppercase' }}>Histórico / Lore Base</label>
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

            {/* 🎨 O MILAGRE DO CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                .genealogy-tree {
                    display: flex;
                    justify-content: center;
                }
                .genealogy-tree ul {
                    padding-top: 20px; 
                    position: relative;
                    display: flex;
                    justify-content: center;
                    padding-left: 0;
                    margin: 0;
                }
                .genealogy-tree li {
                    text-align: center;
                    list-style-type: none;
                    position: relative;
                    padding: 20px 10px 0 10px;
                }
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
                .genealogy-tree li:last-child::before {
                    border-right: 2px solid #334455;
                    border-radius: 0 5px 0 0;
                }
                .genealogy-tree li:first-child::after {
                    border-radius: 5px 0 0 0;
                }
                .genealogy-tree ul::before {
                    content: '';
                    position: absolute; top: 0; left: 50%;
                    border-left: 2px solid #334455;
                    width: 0; height: 20px;
                    transform: translateX(-50%);
                }
                .genealogy-tree > ul::before {
                    display: none; 
                }
                
                .arvore-node-container {
                    background: rgba(0,0,0,0.7);
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