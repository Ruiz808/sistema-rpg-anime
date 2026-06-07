import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';

// ==========================================
// 🌌 CONSTANTES EXPORTADAS
// ==========================================
export const NIVEIS_DOMINIO = {
    1: { nome: "Básico", cor: "#44ff44", desc: "+10% Dano Mágico" },
    2: { nome: "Intermediário", cor: "#44ff44", desc: "+25% Dano | -5% Custo" },
    3: { nome: "Avançado", cor: "#44ff44", desc: "+50% Dano | -10% Custo" },
    4: { nome: "Virtuoso", cor: "#0088ff", desc: "Dano x2 | Ignora Resistências Menores" },
    5: { nome: "Maestria", cor: "#0088ff", desc: "Dano x3.5 | -25% Custo | -50% Dano Sofrido" }
    // ... adicione os outros níveis até o 10 aqui ...
};

export const CATEGORIAS_DOMINIO = {
    'elementais': { titulo: 'Manipulação Elemental', icone: '🔥', cor: '#ff6600' },
    'mana': { titulo: 'Artes de Mana (Grimório)', icone: '🔮', cor: '#0088ff' },
    'chakra': { titulo: 'Artes de Chakra (Shinobi)', icone: '🌀', cor: '#00ffcc' },
    'aura': { titulo: 'Artes de Aura (Manifestação)', icone: '✨', cor: '#ff00ff' },
    'primordiais': { titulo: 'Artes Primordiais Cósmicas', icone: '🌌', cor: '#aa00ff' }
    // ... adicione o resto das categorias ...
};

export const PREDEFINIDOS_LORE = {
    elementais: [
        { label: 'Elementos Básicos', itens: ['Fogo', 'Raio', 'Agua', 'Vento', 'Terra'] },
        { label: 'Básicos Verdadeiros', itens: ['Fogo Verdadeiro', 'Raio Verdadeiro', 'Agua Verdadeira'] },
        { label: 'Elementos Avançados', itens: ['Solar', 'Energia', 'Gelo', 'Vacuo', 'Natureza'] }
    ],
    mana: [
        { label: 'Artes Mágicas Básicas', itens: ['Magia Branca', 'Magia Negra', 'Magia de Sangue'] }
    ]
    // ... adicione o resto da lore ...
};

// ==========================================
// 🛡️ CRIAÇÃO DO CONTEXTO
// ==========================================
const MarcadosFormContext = createContext(null);

export function useMarcadosForm() {
    return useContext(MarcadosFormContext);
}

export function MarcadosFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);

    // 📌 Estados do Painel de Domínios
    const [inputsDominios, setInputsDominios] = useState({});
    const [selectsDominios, setSelectsDominios] = useState({});

    // 📌 Funções de Manipulação de Domínios
    const callSave = useCallback(() => {
        salvarFichaSilencioso();
    }, []);

    const handleAddDominioInput = useCallback((catKey) => {
        const val = inputsDominios[catKey]?.trim();
        if (!val) return;
        updateFicha(f => {
            if (!f.dominios) f.dominios = {};
            if (!f.dominios[catKey]) f.dominios[catKey] = {};
            f.dominios[catKey][val] = { nivel: 1 };
        });
        setInputsDominios(prev => ({...prev, [catKey]: ''}));
        callSave();
    }, [inputsDominios, updateFicha, callSave]);

    const handleAddDominioSelect = useCallback((catKey) => {
        const val = selectsDominios[catKey];
        if (!val) return;
        updateFicha(f => {
            if (!f.dominios) f.dominios = {};
            if (!f.dominios[catKey]) f.dominios[catKey] = {};
            f.dominios[catKey][val] = { nivel: 1 };
        });
        setSelectsDominios(prev => ({...prev, [catKey]: ''}));
        callSave();
    }, [selectsDominios, updateFicha, callSave]);

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

    // 📦 O que o Provider exporta
    const value = useMemo(() => ({
        minhaFicha, updateFicha,
        inputsDominios, setInputsDominios,
        selectsDominios, setSelectsDominios,
        handleAddDominioInput, handleAddDominioSelect,
        handleRemoveDominio, handleChangeNivelDominio
    }), [
        minhaFicha, updateFicha, inputsDominios, selectsDominios,
        handleAddDominioInput, handleAddDominioSelect, handleRemoveDominio, handleChangeNivelDominio
    ]);

    return (
        <MarcadosFormContext.Provider value={value}>
            {children}
        </MarcadosFormContext.Provider>
    );
}