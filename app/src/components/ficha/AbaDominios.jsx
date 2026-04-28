import React from 'react';
import useStore from '../../stores/useStore';

// 📜 A TABELA DE REFERÊNCIA DE NÍVEIS E BUFFS
const NIVEIS_INFO = {
    1: { nome: "Básico", cor: "#44ff44", desc: "+10% Dano" },
    2: { nome: "Intermediário", cor: "#44ff44", desc: "+25% Dano | -5% Custo Mana" },
    3: { nome: "Avançado", cor: "#44ff44", desc: "+50% Dano | -10% Custo Mana" },
    4: { nome: "Virtuoso", cor: "#0088ff", desc: "Dano x2 | Ignora Resistências Menores" },
    5: { nome: "Maestria", cor: "#0088ff", desc: "Dano x3.5 | -25% Custo | -50% Dano Sofrido" },
    6: { nome: "Perfeito", cor: "#0088ff", desc: "Dano x6 | Imunidade Total | Incancelável" },
    7: { nome: "Molecular", cor: "#aa00ff", desc: "Dano x10 | Ignora Imunidades | Dano Persistente" },
    8: { nome: "Atômico", cor: "#aa00ff", desc: "Dano x50 | -50% Custo | Desintegração de Armadura" },
    9: { nome: "Absoluto", cor: "#ff003c", desc: "Dano x100 | Custo ZERO | Silenciamento de Elemento" },
    10: { nome: "Eterno", cor: "#ffcc00", desc: "Dano Incalculável | Apagamento Conceitual" }
};

// ⚔️ LISTA OFICIAL SINCRONIZADA COM O SEU SISTEMA DE MAGIAS
const PREDEFINICOES = {
    elementais: [
        // Elementos Básicos e Verdadeiros
        "Fogo", "Raio", "Agua", "Vento", "Terra",
        "Fogo Verdadeiro", "Raio Verdadeiro", "Agua Verdadeira", "Vento Verdadeiro", "Terra Verdadeira",
        // Elementos Avançados e Primordiais
        "Solar", "Energia", "Gelo", "Vacuo", "Natureza",
        "Solar Verdadeiro", "Energia Verdadeira", "Gelo Verdadeiro", "Vacuo Verdadeiro", "Natureza Verdadeira",
        "Luz", "Trevas", "Ether", "Celestial", "Infernal", "Caos", "Criacao", "Destruicao", "Cosmos", "Neutro",
        "Vida", "Morte", "Vazio",
        // Chakra e Kekkei Genkai/Touta
        "Elemento Madeira", "Elemento Mineral", "Elemento Cinzas", "Elemento Igneo", "Elemento Lava", "Elemento Vapor", "Elemento Nevoa", "Elemento Tempestade", "Elemento Areia", "Elemento Tufao",
        "Elemento Velocidade", "Elemento Poeira", "Elemento Veneno", "Elemento Cal", "Elemento Carbono", "Elemento Calor", "Elemento Som", "Elemento Magnetismo",
        // Magias e Arcanas
        "Truques de Ciclo", "Magias de 1º a 10º Ciclo", 
        "Truques Arcanos/Negros", "Magias Arcanas/Negra de 1º a 10º Ciclo",
        "Truques Ancestrais", "Magia de Sangue", "Magia de Osso", "Magia Draconica", "Magia de Borracha", "Magia de Espelho", "Magia de Sal", "Magia de Alma", "Magia de Tremor", "Magia de Gravidade", "Magia de Tempo", "Magia de Equipamento", "Magia de Explosao", "Magia Espacial", "Magia de Metamorfose",
        // Outros (Aura, Fusões)
        "Aura Pura", "Projeção de Aura", "Fusões Básicas", "Fusões Avançadas"
    ],
    marciais: [
        "Artes Marciais (Combate Básico)", "Reforço Físico (Aura/Mana)",
        "Punho do Dragão (Agressivo)", "Palma Suave (Controle Interno)", "Caminho do Tigre (Força Bruta)", 
        "Passos de Vento (Esquiva/Velocidade)", "Boxe Demoníaco (Impacto)", "Estilo Bêbado (Imprevisível)", 
        "Punho de Ferro (Defesa Absoluta)", "Artes de Assassino (Furtividade)"
    ],
    armas: [
        "Ittouryu (1 Espada)", "Nitouryu (2 Espadas)", "Santouryu (3 Espadas)", "Iaido (Saque Rápido Cortante)", 
        "Postura da Montanha (Defesa Pesada)", "Postura da Água (Contra-ataque Fluido)", 
        "Postura do Vento (Cortes Velozes)", "Postura do Trovão (Estocadas Fatais)", 
        "Maestria com Lança", "Maestria com Foice", "Maestria com Arco/Projéteis",
        "Maestria com Armas de Fogo", "Maestria com Escudo"
    ],
    cura: [
        "Magia de Regeneração Básica", "Cura Celular Avançada", "Purificação de Status (Antídoto)", 
        "Reversão Temporal Localizada", "Transferência de Força Vital", "Ressurreição Limitada"
    ],
    summons: [
        "Pacto Demoníaco", "Invocação de Feras Divinas", "Espíritos Ancestrais", 
        "Contrato Dracônico", "Exército de Sombras Familiares", "Invocação de Armamento Sagrado"
    ]
};

export default function AbaDominios() {
    const { minhaFicha, updateFicha } = useStore();
    
    // 🛡️ TRAVA DE SEGURANÇA CONTRA UNDEFINED
    if (!minhaFicha) return <div style={{ color: '#888', padding: 20 }}>Carregando ficha...</div>;
    
    const dominios = minhaFicha.dominios || {};

    const atualizarDominio = (categoria, item, nivel) => {
        updateFicha(f => {
            if (!f.dominios) f.dominios = { elementais: {}, marciais: {}, armas: {}, cura: {}, summons: {} };
            if (!f.dominios[categoria]) f.dominios[categoria] = {};

            if (nivel === 0) {
                delete f.dominios[categoria][item];
            } else {
                f.dominios[categoria][item] = {
                    nivel: nivel,
                    nome: NIVEIS_INFO[nivel].nome
                };
            }
        });
    };

    const adicionarNovo = (categoria) => {
        const selectElement = document.getElementById(`select-${categoria}`);
        let nome = selectElement.value;
        
        if (!nome) return alert("Selecione um domínio na lista ou escolha 'Outro' para digitar um nome.");
        
        if (nome === 'custom') {
            nome = window.prompt(`Digite o nome do Domínio personalizado para ${categoria.toUpperCase()}:`);
        }

        if (nome && nome.trim() !== '') {
            atualizarDominio(categoria, nome, 1);
            selectElement.value = ""; // Reseta o select
        }
    };

    const renderCategoria = (titulo, chave, corBase) => (
        <div className="def-box" style={{ borderLeft: `4px solid ${corBase}`, marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: corBase, margin: '0 0 10px 0' }}>{titulo}</h3>
                
                {/* MENU DE SELEÇÃO RÁPIDA COM AS SUGESTÕES */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select id={`select-${chave}`} className="input-neon" style={{ flex: 1, minWidth: '200px', borderColor: corBase, color: '#fff', background: 'rgba(0,0,0,0.5)' }}>
                        <option value="">-- Escolher da Lista --</option>
                        {PREDEFINICOES[chave].map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="custom" style={{ color: '#ffcc00' }}>✍️ Outro (Personalizado)...</option>
                    </select>
                    <button className="btn-neon" onClick={() => adicionarNovo(chave)} style={{ padding: '8px 15px', fontSize: '12px', borderColor: corBase, color: corBase, margin: 0 }}>➕ Adicionar</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(dominios[chave] || {}).map(([nome, dados]) => (
                    <div key={nome} style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '5px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <strong style={{ color: '#fff', fontSize: '1.1em' }}>{nome.toUpperCase()}</strong>
                            
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select 
                                    className="input-neon"
                                    value={dados.nivel}
                                    onChange={(e) => atualizarDominio(chave, nome, Number(e.target.value))}
                                    style={{ borderColor: NIVEIS_INFO[dados.nivel].cor, color: NIVEIS_INFO[dados.nivel].cor, fontWeight: 'bold' }}
                                >
                                    {[...Array(11).keys()].map(n => (
                                        <option key={n} value={n}>{n === 0 ? "❌ Remover (Esquecer)" : `Nível ${n} - ${NIVEIS_INFO[n].nome}`}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#aaa', fontStyle: 'italic', borderTop: '1px dashed #222', paddingTop: '5px' }}>
                            <span style={{ color: NIVEIS_INFO[dados.nivel].cor }}>⚡ Pressão de Domínio:</span> {NIVEIS_INFO[dados.nivel].desc}
                        </div>
                    </div>
                ))}
                {Object.keys(dominios[chave] || {}).length === 0 && <p style={{ color: '#444', fontSize: '0.9em', margin: 0 }}>Nenhum domínio registrado. Comece o seu treino!</p>}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
            <h2 style={{ color: '#ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: '10px', marginBottom: '20px' }}>💎 HIERARQUIA DE DOMÍNIOS</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {renderCategoria("Manipulação Elemental", "elementais", "#00ffcc")}
                {renderCategoria("Técnicas Marciais (Taijutsu)", "marciais", "#ff003c")}
                {renderCategoria("Maestria de Armas (Kenjutsu)", "armas", "#0088ff")}
                {renderCategoria("Atributos de Cura / Restauração", "cura", "#44ff44")}
                {renderCategoria("Summons & Contratos", "summons", "#aa00ff")}
            </div>
        </div>
    );
}