import React, { createContext, useContext, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso } from '../../services/firebase-sync';

export const NIVEIS_DOMINIO = {
    1: { nome: "Básico", cor: "#44ff44", desc: "+10% Dano Mágico" },
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

export const CATEGORIAS_DOMINIO = {
    'elementais': { titulo: 'Manipulação Elemental', icone: '🔥', cor: '#ff6600' },
    'mana': { titulo: 'Artes de Mana (Grimório)', icone: '🔮', cor: '#0088ff' },
    'chakra': { titulo: 'Artes de Chakra (Shinobi)', icone: '🌀', cor: '#00ffcc' },
    'aura': { titulo: 'Artes de Aura (Manifestação)', icone: '✨', cor: '#ff00ff' },
    'primordiais': { titulo: 'Artes Primordiais Cósmicas', icone: '🌌', cor: '#aa00ff' },
    'astrais': { titulo: 'Artes Astrais (Vida/Morte)', icone: '👁️', cor: '#ffffff' },
    'marciais': { titulo: 'Artes Marciais (Taijutsu)', icone: '🥋', cor: '#ff3333' },
    'armas': { titulo: 'Maestria de Armas (Kenjutsu)', icone: '⚔️', cor: '#aaaaaa' },
    'cura': { titulo: 'Atributos de Cura e Suporte', icone: '💚', cor: '#00ff00' },
    'summons': { titulo: 'Contratos & Invocações', icone: '👹', cor: '#ffcc00' }
};

// 🔥 LORE ATUALIZADA (Idêntica à Print 3) 🔥
export const PREDEFINIDOS_LORE = {
    elementais: [
        { label: 'Elementos Básicos', itens: ['Fogo', 'Raio', 'Agua', 'Vento', 'Terra'] },
        { label: 'Básicos Verdadeiros', itens: ['Fogo Verdadeiro', 'Raio Verdadeiro', 'Agua Verdadeira', 'Vento Verdadeiro', 'Terra Verdadeira'] },
        { label: 'Elementos Avançados', itens: ['Solar', 'Energia', 'Gelo', 'Vacuo', 'Natureza'] }
    ],
    mana: [
        { label: 'Magias de Ciclo', itens: ['Truques de Ciclo', 'Magias de 1º a 10º Ciclo'] },
        { label: 'Magias Arcanas/Negras', itens: ['Truques Arcanos/Negras', 'Magias Arcanas/Negra de 1º a 10º Ciclo'] },
        { label: 'Magias Ancestrais', itens: ['Truques Ancestrais', 'Magia de Sangue', 'Magia de Osso', 'Magia Draconica', 'Magia de Alma', 'Magia de Tempo', 'Magia de Gravidade', 'Magia Espacial', 'Magia de Borracha', 'Magia de Espelho', 'Magia de Sal', 'Magia de Tremor'] }
    ],
    chakra: [
        { label: 'Naturezas de Chakra', itens: ['Katon (Fogo)', 'Suiton (Água)', 'Doton (Terra)', 'Fuuton (Vento)', 'Raiton (Raio)'] }
    ],
    aura: [
        { label: 'Manifestações', itens: ['Aura de Combate', 'Instinto Assassino', 'Aura de Cura', 'Pressão Espiritual'] }
    ],
    primordiais: [
        { label: 'Poderes Cósmicos', itens: ['Criação Constelar', 'Distorção Espacial', 'Manipulação do Tempo'] }
    ]
};

const MarcadosFormContext = createContext(null);

export function useMarcadosForm() {
    return useContext(MarcadosFormContext);
}

export function MarcadosFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);

    const callSave = useCallback(() => { salvarFichaSilencioso(); }, []);

    const handleAddDominio = useCallback((catKey, val) => {
        const nome = val?.trim();
        if (!nome) return;
        updateFicha(f => {
            if (!f.dominios) f.dominios = {};
            if (!f.dominios[catKey]) f.dominios[catKey] = {};
            if (!f.dominios[catKey][nome]) {
                f.dominios[catKey][nome] = { nivel: 1 };
            }
        });
        callSave();
    }, [updateFicha, callSave]);

    const handleRemoveDominio = useCallback((catKey, nome) => {
        if (!window.confirm(`Riscar o domínio [${nome}] das suas páginas?`)) return;
        updateFicha(f => {
            if (f.dominios && f.dominios[catKey]) delete f.dominios[catKey][nome];
        });
        callSave();
    }, [updateFicha, callSave]);

    const handleChangeNivelDominio = useCallback((catKey, nome, nivel) => {
        updateFicha(f => {
            if (f.dominios && f.dominios[catKey] && f.dominios[catKey][nome]) {
                f.dominios[catKey][nome].nivel = parseInt(nivel);
            }
        });
        callSave();
    }, [updateFicha, callSave]);

    const handleMoveDominio = useCallback((oldCat, newCat, nome) => {
        if (!newCat || oldCat === newCat) return;
        updateFicha(f => {
            if (!f.dominios) f.dominios = {};
            if (!f.dominios[newCat]) f.dominios[newCat] = {};
            f.dominios[newCat][nome] = f.dominios[oldCat][nome];
            delete f.dominios[oldCat][nome];
        });
        callSave();
    }, [updateFicha, callSave]);

    const value = useMemo(() => ({
        minhaFicha, updateFicha,
        handleAddDominio, handleRemoveDominio, 
        handleChangeNivelDominio, handleMoveDominio
    }), [
        minhaFicha, updateFicha,
        handleAddDominio, handleRemoveDominio, 
        handleChangeNivelDominio, handleMoveDominio
    ]);

    return (
        <MarcadosFormContext.Provider value={value}>
            {children}
        </MarcadosFormContext.Provider>
    );
}