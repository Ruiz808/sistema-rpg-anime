import React, { useState } from 'react';
import { useMarcadosForm, CATEGORIAS_DOMINIO, PREDEFINIDOS_LORE, NIVEIS_DOMINIO } from './MarcadosFormContext';

// COMPONENTE ISOLADO: Garante que os inputs de uma caixa NUNCA conversem com a outra
function QuadranteCategoria({ catKey, catData, dominiosDaCategoria }) {
    const { handleAddDominio, handleRemoveDominio, handleChangeNivelDominio, handleMoveDominio } = useMarcadosForm();
    const [selectValue, setSelectValue] = useState('');
    const [inputValue, setInputValue] = useState('');

    const corTema = catData.cor || '#ffffff';
    const nomes = Object.keys(dominiosDaCategoria);

    return (
        <div style={{ 
            border: `1px solid ${corTema}`, 
            padding: '20px', borderRadius: '8px', 
            background: 'rgba(0,0,0,0.03)', position: 'relative',
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2em', borderBottom: `1px dotted ${corTema}`, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: corTema }}>
                <span>{catData.icone}</span> {catData.titulo}
            </h3>

            {/* 1. SELETOR DA LORE */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                    value={selectValue}
                    onChange={e => setSelectValue(e.target.value)}
                    style={{ 
                        flex: 1, background: 'rgba(0,0,0,0.5)', border: `1px solid ${corTema}`, 
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
                    onClick={() => { handleAddDominio(catKey, selectValue); setSelectValue(''); }} 
                    style={{ 
                        background: 'transparent', border: `1px solid ${corTema}`, color: corTema, 
                        cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', 
                        fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'inherit'
                    }}
                >
                    ADICIONAR
                </button>
            </div>

            {/* 2. INPUT CRIAR MANUAL */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder={`Criar novo (Ex: Punho das Sombras)`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    style={{ 
                        flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #ffcc00', 
                        color: 'inherit', padding: '8px', borderRadius: '4px', outline: 'none', 
                        fontFamily: 'inherit', fontSize: '0.9em' 
                    }}
                />
                <button 
                    onClick={() => { handleAddDominio(catKey, inputValue); setInputValue(''); }} 
                    style={{ 
                        background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', 
                        cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', 
                        fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit'
                    }}
                >
                    <span style={{ fontSize: '1.2em' }}>+</span> CRIAR
                </button>
            </div>

            {/* 3. LISTA DE HABILIDADES SALVAS NO QUADRANTE */}
            {nomes.length === 0 ? (
                <div style={{ opacity: 0.4, fontStyle: 'italic', textAlign: 'center', padding: '10px 0', fontSize: '0.9em' }}>Nenhum registo ainda...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {nomes.map(nomeDom => {
                        const nivel = dominiosDaCategoria[nomeDom]?.nivel || 1;
                        const infoNivel = NIVEIS_DOMINIO[nivel] || NIVEIS_DOMINIO[1];
                        return (
                            <div key={nomeDom} style={{ 
                                padding: '12px', border: `1px solid ${infoNivel.cor}`, 
                                background: 'rgba(0,0,0,0.85)', borderRadius: '6px', position: 'relative'
                            }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '1.1em', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
                                        {nomeDom}
                                    </strong>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        
                                        <select
                                            value={nivel}
                                            onChange={e => handleChangeNivelDominio(catKey, nomeDom, e.target.value)}
                                            style={{ 
                                                background: 'transparent', color: infoNivel.cor, border: `1px solid ${infoNivel.cor}`, 
                                                borderRadius: '4px', padding: '2px 6px', fontFamily: 'inherit', outline: 'none', 
                                                fontWeight: 'bold', fontSize: '0.85em', cursor: 'pointer' 
                                            }}
                                        >
                                            {Object.entries(NIVEIS_DOMINIO).map(([n, d]) => (
                                                <option key={n} value={n} style={{ color: '#000' }}>Lv {n} - {d.nome}</option>
                                            ))}
                                        </select>

                                        {/* DROPDOWN PARA MOVER/CORRIGIR MAGIA */}
                                        <select 
                                            title="Corrigir Quadrante"
                                            onChange={e => handleMoveDominio(catKey, e.target.value, nomeDom)}
                                            value=""
                                            style={{ 
                                                background: '#111', color: '#fff', border: '1px solid #444', 
                                                borderRadius: '4px', padding: '3px', fontSize: '0.85em', cursor: 'pointer', outline: 'none' 
                                            }}
                                        >
                                            <option value="" disabled>⮀</option>
                                            {Object.entries(CATEGORIAS_DOMINIO).filter(([k]) => k !== catKey).map(([k, d]) => (
                                                <option key={k} value={k} style={{ color: '#000' }}>Mover p/: {d.titulo}</option>
                                            ))}
                                        </select>

                                        <button 
                                            onClick={() => handleRemoveDominio(catKey, nomeDom)} 
                                            style={{ background: 'transparent', border: 'none', color: '#ff003c', fontSize: '1.2em', cursor: 'pointer', padding: '0', fontWeight: 'bold' }} 
                                            title="Apagar Registo"
                                        >
                                            X
                                        </button>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.85em', fontStyle: 'italic', opacity: 0.9, color: infoNivel.cor }}>
                                    <span style={{ fontWeight: 'bold', color: '#ffcc00' }}>⚡ :</span> {infoNivel.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// O PAINEL QUE ENGLOBA TODOS OS QUADRANTES
export function AbaDominios() {
    const ctx = useMarcadosForm();
    if (!ctx) return <div style={{ color: '#888', padding: 10 }}>Contexto não encontrado</div>;
    const { minhaFicha } = ctx;
    const dominiosSalvos = minhaFicha?.dominios || {};

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
                {Object.entries(CATEGORIAS_DOMINIO).map(([catKey, catData]) => (
                    <QuadranteCategoria 
                        key={catKey} 
                        catKey={catKey} 
                        catData={catData} 
                        dominiosDaCategoria={dominiosSalvos[catKey] || {}} 
                    />
                ))}
            </div>
        </div>
    );
}