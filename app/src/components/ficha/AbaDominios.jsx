import React from 'react';
import useStore from '../../stores/useStore';

// 📜 A TABELA DE REFERÊNCIA DE NÍVEIS E BUFFS
const NIVEIS_INFO = {
    1: { nome: "Básico", cor: "#44ff44", desc: "+10% Dano" },
    2: { nome: "Intermediário", cor: "#44ff44", desc: "+25% Dano | -5% Custo" },
    3: { nome: "Avançado", cor: "#44ff44", desc: "+50% Dano | -10% Custo" },
    4: { nome: "Virtuoso", cor: "#0088ff", desc: "Dano x2 | Ignora Resistências Menores" },
    5: { nome: "Maestria", cor: "#0088ff", desc: "Dano x3.5 | -25% Custo | -50% Dano Sofrido" },
    6: { nome: "Perfeito", cor: "#0088ff", desc: "Dano x6 | Imunidade Total | Incancelável" },
    7: { nome: "Molecular", cor: "#aa00ff", desc: "Dano x10 | Ignora Imunidades | Dano Persistente" },
    8: { nome: "Atômico", cor: "#aa00ff", desc: "Dano x50 | -50% Custo | Desintegração de Armadura" },
    9: { nome: "Absoluto", cor: "#ff003c", desc: "Dano x100 | Custo ZERO | Silenciamento de Elemento" },
    10: { nome: "Eterno", cor: "#ffcc00", desc: "Dano Incalculável | Apagamento Conceitual" }
};

// 🛡️ LISTAS ÚNICAS POR FONTE DE ENERGIA E LORE
const PREDEFINICOES = {
    mana: [
        "Fogo", "Raio", "Agua", "Vento", "Terra", "Gelo", "Natureza", "Energia", "Vacuo", "Solar",
        "Fogo Verdadeiro", "Raio Verdadeiro", "Agua Verdadeira", "Vento Verdadeiro", "Terra Verdadeira",
        "Solar Verdadeiro", "Energia Verdadeira", "Gelo Verdadeiro", "Vacuo Verdadeiro", "Natureza Verdadeira",
        "Truques de Ciclo", "Magias de 1º a 10º Ciclo", "Truques Arcanos/Negros", "Magias Arcanas/Negra de 1º a 10º Ciclo",
        "Truques Ancestrais", "Magia de Sangue", "Magia de Osso", "Magia Draconica", "Magia de Alma", 
        "Magia de Tempo", "Magia de Gravidade", "Magia Espacial", "Magia de Borracha", "Magia de Espelho", 
        "Magia de Sal", "Magia de Tremor", "Magia de Equipamento", "Magia de Explosao", "Magia de Metamorfose"
    ],
    chakra: [
        "Elemento Madeira", "Elemento Mineral", "Elemento Cinzas", "Elemento Igneo", "Elemento Lava", 
        "Elemento Vapor", "Elemento Nevoa", "Elemento Tempestade", "Elemento Areia", "Elemento Tufao",
        "Elemento Velocidade", "Elemento Poeira", "Elemento Veneno", "Elemento Cal", "Elemento Carbono", 
        "Elemento Calor", "Elemento Som", "Elemento Magnetismo"
    ],
    aura: [
        "Aura Pura", "Projeção de Aura", "Reforço de Aura", "Fusões Básicas", "Fusões Avançadas"
    ],
    primordiais: [
        "Luz", "Trevas", "Ether", "Celestial", "Infernal", "Caos", "Criacao", "Destruicao", "Cosmos"
    ],
    astral: [
        "Vida", "Morte", "Vazio", "Neutro", "Energia Astral"
    ],
    marciais: [
        "Artes Marciais", "Punho do Dragão", "Palma Suave", "Caminho do Tigre", "Boxe Demoníaco", "Artes de Assassino"
    ],
    armas: [
        "Ittouryu (1 Espada)", "Nitouryu (2 Espadas)", "Santouryu (3 Espadas)", "Iaido", "Kenjutsu",
        "Maestria com Lança", "Maestria com Foice", "Maestria com Arco", "Maestria com Armas de Fogo", "Maestria com Escudo"
    ],
    cura: [
        "Regeneração Básica", "Cura Celular", "Purificação", "Reversão Temporal", "Transferência Vital", "Ressurreição Limitada"
    ],
    summons: [
        "Pacto Demoníaco", "Feras Divinas", "Espíritos Ancestrais", "Contrato Dracônico", "Exército de Sombras", "Invocação de Armamento Sagrado"
    ]
};

export default function AbaDominios() {
    const { minhaFicha, updateFicha } = useStore();
    if (!minhaFicha) return <div style={{ color: '#888', padding: 20 }}>Carregando ficha...</div>;
    const dominios = minhaFicha.dominios || {};

    const atualizarDominio = (categoria, item, nivel) => {
        updateFicha(f => {
            if (!f.dominios) f.dominios = { elementais: {}, marciais: {}, armas: {}, cura: {}, summons: {} };
            
            // 🔥 Mapeia as energias mágicas para a gaveta principal de elementais do useStore
            const targetCat = ['mana', 'chakra', 'aura', 'astral', 'primordiais'].includes(categoria) ? 'elementais' : categoria;
            if (!f.dominios[targetCat]) f.dominios[targetCat] = {};

            if (nivel === 0) delete f.dominios[targetCat][item];
            else f.dominios[targetCat][item] = { nivel: nivel, nome: NIVEIS_INFO[nivel].nome };
        });
    };

    const adicionarNovo = (chaveSelect) => {
        const selectElement = document.getElementById(`select-${chaveSelect}`);
        let nome = selectElement.value;
        if (!nome) return;
        if (nome === 'custom') nome = window.prompt(`Digite o nome do Domínio personalizado:`);
        if (nome && nome.trim() !== '') {
            atualizarDominio(chaveSelect, nome, 1);
            selectElement.value = "";
        }
    };

    const renderSecao = (titulo, chave, corBase) => {
        const isMagica = ['mana', 'chakra', 'aura', 'astral', 'primordiais'].includes(chave);
        const gavetaDoStore = isMagica ? 'elementais' : chave;
        
        // Junta todas as magias para saber se um nome customizado foi digitado
        const todasMagias = PREDEFINICOES.mana.concat(PREDEFINICOES.chakra, PREDEFINICOES.aura, PREDEFINICOES.astral, PREDEFINICOES.primordiais);

        return (
            <div className="def-box" style={{ borderLeft: `4px solid ${corBase}`, marginBottom: '20px' }}>
                <h3 style={{ color: corBase, margin: '0 0 10px 0', fontSize: '1em' }}>{titulo}</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <select id={`select-${chave}`} className="input-neon" style={{ flex: 1, borderColor: corBase, background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                        <option value="">-- Adicionar Domínio --</option>
                        {PREDEFINICOES[chave]?.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="custom" style={{ color: '#ffcc00' }}>✍️ Outro...</option>
                    </select>
                    <button className="btn-neon" onClick={() => adicionarNovo(chave)} style={{ borderColor: corBase, color: corBase, margin: 0 }}>➕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(dominios[gavetaDoStore] || {}).filter(([nome]) => {
                        const isNestaLista = PREDEFINICOES[chave].includes(nome);
                        // Se for uma habilidade "custom" (fora de todas as listas), jogamos na aba "Mana" ou na respectiva aba não-mágica
                        const isCustom = isMagica ? !todasMagias.includes(nome) : !PREDEFINICOES[chave].includes(nome);
                        
                        if (isNestaLista) return true;
                        if (isCustom && chave === 'mana') return true; // Custons mágicos vão para Mana
                        if (isCustom && !isMagica) return true; // Custons físicos vão para suas próprias abas
                        return false;
                    }).map(([nome, dados]) => (
                        <div key={nome} style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '5px', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#fff', fontSize: '0.9em' }}>{nome.toUpperCase()}</strong>
                                <select className="input-neon" value={dados.nivel} onChange={(e) => atualizarDominio(chave, nome, Number(e.target.value))} style={{ borderColor: NIVEIS_INFO[dados.nivel].cor, color: NIVEIS_INFO[dados.nivel].cor, width: '120px', fontSize: '0.8em' }}>
                                    {[...Array(11).keys()].map(n => <option key={n} value={n}>{n === 0 ? "❌ Apagar" : `Lv ${n} - ${NIVEIS_INFO[n].nome}`}</option>)}
                                </select>
                            </div>
                            <div style={{ marginTop: '5px', fontSize: '0.75em', color: '#aaa', fontStyle: 'italic' }}>
                                <span style={{ color: NIVEIS_INFO[dados.nivel].cor }}>⚡:</span> {NIVEIS_INFO[dados.nivel].desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '10px' }}>
            <h2 style={{ color: '#ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: '10px', marginBottom: '20px' }}>💎 HIERARQUIA DE DOMÍNIOS</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '15px' }}>
                {renderSecao("🔮 Artes de Mana (Grimório)", "mana", "#0088ff")}
                {renderSecao("🌀 Artes de Chakra (Shinobi)", "chakra", "#00ffcc")}
                {renderSecao("✨ Artes de Aura (Manifestação)", "aura", "#b366ff")}
                {renderSecao("🌌 Artes Primordiais (Cósmicas)", "primordiais", "#ff00ff")}
                {renderSecao("💫 Artes Astrais (Vida/Morte)", "astral", "#ffcc00")}
                {renderSecao("🥋 Artes Marciais (Taijutsu)", "marciais", "#ff003c")}
                {renderSecao("⚔️ Maestria de Armas (Kenjutsu)", "armas", "#ff8800")}
                {renderSecao("💚 Atributos de Cura", "cura", "#44ff44")}
                {renderSecao("👹 Summons & Contratos", "summons", "#aa00ff")}
            </div>
        </div>
    );
}