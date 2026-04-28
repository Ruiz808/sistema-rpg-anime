import React from 'react';
import useStore from '../../stores/useStore';

// 📜 A TABELA DE REFERÊNCIA QUE CRIAMOS
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

export default function AbaDominios() {
    const { minhaFicha, updateFicha } = useStore();
    const dominios = minhaFicha.dominios || {};

    const atualizarDominio = (categoria, item, nivel) => {
        updateFicha(f => {
            if (!f.dominios) f.dominios = { elementais: {}, marciais: {}, armas: {}, cura: {}, summons: {} };
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
        const nome = window.prompt(`Digite o nome do novo Domínio para ${categoria.toUpperCase()}:`);
        if (nome) atualizarDominio(categoria, nome, 1);
    };

    const renderCategoria = (titulo, chave, corBase) => (
        <div className="def-box" style={{ borderLeft: `4px solid ${corBase}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: corBase, margin: 0 }}>{titulo}</h3>
                <button className="btn-neon" onClick={() => adicionarNovo(chave)} style={{ padding: '2px 10px', fontSize: '12px', borderColor: corBase, color: corBase }}>+ Adicionar</button>
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
                                        <option key={n} value={n}>{n === 0 ? "remover" : `${n} - ${NIVEIS_INFO[n].nome}`}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#aaa', fontStyle: 'italic', borderTop: '1px dashed #222', paddingTop: '5px' }}>
                            <span style={{ color: NIVEIS_INFO[dados.nivel].cor }}>⚡ Buff:</span> {NIVEIS_INFO[dados.nivel].desc}
                        </div>
                    </div>
                ))}
                {Object.keys(dominios[chave] || {}).length === 0 && <p style={{ color: '#444', fontSize: '0.9em', margin: 0 }}>Nenhum domínio registrado.</p>}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
            <h2 style={{ color: '#ffcc00', borderBottom: '2px solid #ffcc00', paddingBottom: '10px' }}>💎 HIERARQUIA DE DOMÍNIOS</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {renderCategoria("Manipulação Elemental", "elementals", "#00ffcc")}
                {renderCategoria("Técnicas Marciais", "marciais", "#ff003c")}
                {renderCategoria("Maestria de Armas", "#0088ff")} {/* Nota: Ajustar para 'armas' se usar o useStore atual */}
                {renderCategoria("Atributos de Cura", "cura", "#44ff44")}
                {renderCategoria("Summons & Contratos", "summons", "#aa00ff")}
            </div>
        </div>
    );
}