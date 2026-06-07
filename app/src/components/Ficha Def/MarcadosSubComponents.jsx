import React from 'react';
import { useMarcadosForm, CATEGORIAS_DOMINIO, PREDEFINIDOS_LORE, NIVEIS_DOMINIO } from './MarcadosFormContext';

export function AbaDominios() {
    const ctx = useMarcadosForm();
    if (!ctx) return <div style={{ color: '#888', padding: 10 }}>Contexto não encontrado</div>;

    const { 
        minhaFicha, inputsDominios, setInputsDominios, selectsDominios, setSelectsDominios,
        handleAddDominioInput, handleAddDominioSelect, handleRemoveDominio, handleChangeNivelDominio, handleMoveDominio
    } = ctx;

    const dominiosSalvos = minhaFicha?.dominios || {};

    return (
        <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed currentColor` }}>
                    A Hierarquia de Domínios
                </h1>
                <p style={{ opacity: 0.7, fontStyle: 'italic', marginTop: '5px' }}>O Conhecimento Absoluto das Artes Místicas e Marciais</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
                
                {Object.entries(CATEGORIAS_DOMINIO).map(([catKey, catData]) => {
                    const listaDestaCategoria = dominiosSalvos[catKey] || {};
                    const nomes = Object.keys(listaDestaCategoria);
                    const corTema = catData.cor || 'currentColor'; // Ex: Laranja para Elemental, Azul para Mana

                    return (
                        <div key={catKey} style={{ 
                            border: `1px solid ${corTema}`, 
                            padding: '20px', borderRadius: '8px', 
                            background: 'rgba(0,0,0,0.03)', position: 'relative',
                            boxShadow: `inset 0 0 20px ${corTema}10` // Brilho suave interno
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2em', borderBottom: `1px dotted ${corTema}`, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: corTema }}>
                                <span>{catData.icone}</span> {catData.titulo}
                            </h3>

                            {/* 1. SELETOR DA LORE (Estilo Marcados) */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    value={selectsDominios[catKey] || ''}
                                    onChange={e => setSelectsDominios({...selectsDominios, [catKey]: e.target.value})}
                                    style={{ 
                                        flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${corTema}`, 
                                        color: 'inherit', padding: '8px', borderRadius: '4px', outline: 'none', 
                                        fontFamily: 'inherit', fontSize: '0.9em' 
                                    }}
                                >
                                    <option value="" style={{ color: '#000' }}>-- Escolher da Lore --</option>
                                    {(PREDEFINIDOS_LORE[catKey] || []).map(grupo => (
                                        <optgroup key={grupo.label} label={`— ${grupo.label} —`} style={{ color: '#000' }}>
                                            {grupo.itens.map(item => <option key={item} value={item} style={{ color: '#000' }}>{item}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <button 
                                    onClick={() => handleAddDominioSelect(catKey)} 
                                    style={{ 
                                        background: 'transparent', border: `1px solid ${corTema}`, color: corTema, 
                                        cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', 
                                        fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'inherit'
                                    }}
                                >
                                    ADICIONAR
                                </button>
                            </div>

                            {/* 2. INPUT DE CRIAÇÃO LIVRE (Estilo Marcados) */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder={`Criar novo (Ex: Punho das Sombras)`}
                                    value={inputsDominios[catKey] || ''}
                                    onChange={e => setInputsDominios({...inputsDominios, [catKey]: e.target.value})}
                                    style={{ 
                                        flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #ffcc00', 
                                        color: 'inherit', padding: '8px', borderRadius: '4px', outline: 'none', 
                                        fontFamily: 'inherit', fontSize: '0.9em' 
                                    }}
                                />
                                <button 
                                    onClick={() => handleAddDominioInput(catKey)} 
                                    style={{ 
                                        background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', 
                                        cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', 
                                        fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2em' }}>+</span> CRIAR
                                </button>
                            </div>

                            {/* 3. LISTA DE HABILIDADES ADICIONADAS */}
                            {nomes.length === 0 ? (
                                <div style={{ opacity: 0.4, fontStyle: 'italic', textAlign: 'center', padding: '10px 0', fontSize: '0.9em' }}>Nenhum registo ainda...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {nomes.map(nomeDom => {
                                        const nivel = listaDestaCategoria[nomeDom]?.nivel || 1;
                                        const infoNivel = NIVEIS_DOMINIO[nivel] || NIVEIS_DOMINIO[1];
                                        return (
                                            <div key={nomeDom} style={{ 
                                                padding: '12px', 
                                                border: `1px solid ${infoNivel.cor}`, 
                                                background: 'rgba(0,0,0,0.4)', 
                                                borderRadius: '6px',
                                                position: 'relative'
                                            }}>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    {/* NOME DA HABILIDADE */}
                                                    <strong style={{ fontSize: '1.1em', textTransform: 'uppercase', letterSpacing: '1px', color: 'inherit' }}>
                                                        {nomeDom}
                                                    </strong>
                                                    
                                                    {/* CONTROLES */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        
                                                        {/* Seletor de Nível */}
                                                        <select
                                                            value={nivel}
                                                            onChange={e => handleChangeNivelDominio(catKey, nomeDom, e.target.value)}
                                                            style={{ 
                                                                background: 'transparent', color: infoNivel.cor, 
                                                                border: `1px solid ${infoNivel.cor}`, borderRadius: '4px', 
                                                                padding: '2px 6px', fontFamily: 'inherit', outline: 'none', 
                                                                fontWeight: 'bold', fontSize: '0.85em', cursor: 'pointer' 
                                                            }}
                                                        >
                                                            {Object.entries(NIVEIS_DOMINIO).map(([n, d]) => (
                                                                <option key={n} value={n} style={{ color: '#000' }}>Lv {n} - {d.nome}</option>
                                                            ))}
                                                        </select>

                                                        {/* 🔄 MIGRAR PARA OUTRO QUADRANTE */}
                                                        <select 
                                                            title="Mover para outro quadrante"
                                                            onChange={e => handleMoveDominio(catKey, e.target.value, nomeDom)}
                                                            value=""
                                                            style={{ 
                                                                margin: 0, padding: '4px', border: '1px dashed currentColor', 
                                                                background: 'transparent', color: 'inherit', cursor: 'pointer',
                                                                fontFamily: 'inherit', borderRadius: '4px', opacity: 0.7
                                                            }}
                                                        >
                                                            <option value="" disabled>⮀</option>
                                                            {Object.entries(CATEGORIAS_DOMINIO).filter(([k]) => k !== catKey).map(([k, d]) => (
                                                                <option key={k} value={k} style={{ color: '#000' }}>Mover para: {d.titulo}</option>
                                                            ))}
                                                        </select>

                                                        {/* Remover */}
                                                        <button 
                                                            onClick={() => handleRemoveDominio(catKey, nomeDom)} 
                                                            style={{ 
                                                                background: 'transparent', border: 'none', color: '#ff003c', 
                                                                fontSize: '1.2em', cursor: 'pointer', padding: '0', fontWeight: 'bold' 
                                                            }} 
                                                            title="Apagar Registo"
                                                        >
                                                            ✖
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: '0.85em', fontStyle: 'italic', opacity: 0.8, color: infoNivel.cor }}>
                                                    <span style={{ fontWeight: 'bold' }}>⚡ :</span> {infoNivel.desc}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}