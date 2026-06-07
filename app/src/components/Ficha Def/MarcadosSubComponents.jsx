import React, { useState } from 'react';
import { useMarcadosForm, CATEGORIAS_DOMINIO, PREDEFINIDOS_LORE, NIVEIS_DOMINIO, encontrarCategoriaPorLore } from './MarcadosFormContext';

function QuadranteCategoria({ catKey, catData, dominiosSalvos }) {
    const { handleAddDominio, handleRemoveDominio, handleChangeNivelDominio, handleMoveDominio } = useMarcadosForm();
    const [selectValue, setSelectValue] = useState('');
    const [inputValue, setInputValue] = useState('');

    const corTema = catData.cor || '#ffffff';

    // Distribuidor dinâmico inteligente (Conserta e organiza os dados na hora da renderização)
    const dominiosFiltrados = Object.entries(dominiosSalvos).filter(([nome, dados]) => {
        if (!dados || typeof dados !== 'object') return false;
        
        const catAuto = encontrarCategoriaPorLore(nome);
        if (catAuto) return catAuto === catKey; // Se está mapeado na Lore, vai pra gaveta certa automaticamente
        
        // Se for customizado por input livre, segue a chave gravada ou cai na padrão
        return dados.categoria === catKey || (!dados.categoria && catKey === 'elementais');
    });

    return (
        <div style={{ 
            border: `1px solid ${corTema}`, 
            padding: '20px', borderRadius: '8px', 
            background: 'rgba(0,0,0,0.1)', position: 'relative',
            display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: corTema }}>
                <span>{catData.icone}</span> {catData.titulo}
            </h3>
            <div style={{ width: '100%', borderBottom: '1px dotted currentColor', opacity: 0.2, marginBottom: '5px' }} />

            {/* DROPDOWN DE LORE */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <select
                    value={selectValue}
                    onChange={e => setSelectValue(e.target.value)}
                    style={{ 
                        flex: 1, background: '#0a0a0f', border: `1px solid ${corTema}`, 
                        color: '#fff', padding: '10px', borderRadius: '4px', outline: 'none', 
                        fontFamily: 'inherit', fontSize: '0.95em' 
                    }}
                >
                    <option value="">-- Escolher da Lore --</option>
                    {(PREDEFINIDOS_LORE[catKey] || []).map(grupo => (
                        <optgroup key={grupo.label} label={`— ${grupo.label} —`} style={{ color: '#fff', background: '#0a0a0f' }}>
                            {grupo.itens.map(item => <option key={item} value={item}>{item}</option>)}
                        </optgroup>
                    ))}
                </select>
                <button 
                    onClick={() => { handleAddDominio(catKey, selectValue); setSelectValue(''); }} 
                    style={{ 
                        background: 'transparent', border: `1px solid ${corTema}`, color: corTema, 
                        cursor: 'pointer', padding: '10px 20px', borderRadius: '4px', 
                        fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'inherit'
                    }}
                >
                    ADICIONAR
                </button>
            </div>

            {/* INPUT MANUAL DE CRIAÇÃO */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Criar novo (Ex: Punho das Sombras)"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    style={{ 
                        flex: 1, background: '#0a0a0f', border: '1px solid #ffcc00', 
                        color: '#fff', padding: '10px', borderRadius: '4px', outline: 'none', 
                        fontFamily: 'inherit', fontSize: '0.95em' 
                    }}
                />
                <button 
                    onClick={() => { handleAddDominio(catKey, inputValue); setInputValue(''); }} 
                    style={{ 
                        background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', 
                        cursor: 'pointer', padding: '10px 20px', borderRadius: '4px', 
                        fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit'
                    }}
                >
                    + CRIAR
                </button>
            </div>

            {/* LISTA DE CARDS ESTILO DESIGN NOVO */}
            {dominiosFiltrados.length === 0 ? (
                <div style={{ opacity: 0.3, fontStyle: 'italic', textAlign: 'center', padding: '15px 0', fontSize: '0.95em' }}>Nenhum registo ainda...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
                    {dominiosFiltrados.map(([nomeDom, dadosDom]) => {
                        const nivel = dadosDom?.nivel || 1;
                        const infoNivel = NIVEIS_DOMINIO[nivel] || NIVEIS_DOMINIO[1];
                        return (
                            <div key={nomeDom} style={{ 
                                padding: '14px', border: `1px solid ${corTema}`, 
                                background: '#050508', borderRadius: '6px',
                                position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px'
                            }}>
                                <button 
                                    onClick={() => handleRemoveDominio(nomeDom)} 
                                    style={{ position: 'absolute', top: '10px', right: '12px', background: 'transparent', border: 'none', color: '#ff003c', fontSize: '1.3em', cursor: 'pointer', padding: '0', fontWeight: 'bold' }} 
                                >
                                    ✖
                                </button>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '25px' }}>
                                    <strong style={{ fontSize: '1.2em', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
                                        {nomeDom}
                                    </strong>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Dropdown de correção visível apenas para magias customizadas feitas à mão */}
                                        {!encontrarCategoriaPorLore(nomeDom) && (
                                            <select
                                                value={dadosDom.categoria || catKey}
                                                onChange={e => handleMoveDominio(nomeDom, e.target.value)}
                                                style={{ background: '#0a0a0f', color: '#aaa', border: '1px dashed #444', borderRadius: '4px', padding: '4px 6px', fontSize: '0.85em', fontFamily: 'inherit', outline: 'none' }}
                                            >
                                                {Object.entries(CATEGORIAS_DOMINIO).map(([k, c]) => (
                                                    <option key={k} value={k}>➔ {c.titulo.split(' ')[0]}</option>
                                                ))}
                                            </select>
                                        )}

                                        <select
                                            value={nivel}
                                            onChange={e => handleChangeNivelDominio(nomeDom, e.target.value)}
                                            style={{ 
                                                background: '#0a0a0f', color: infoNivel.cor, border: `1px solid ${infoNivel.cor}`, 
                                                borderRadius: '4px', padding: '4px 8px', fontFamily: 'inherit', outline: 'none', 
                                                fontWeight: 'bold', fontSize: '0.9em', cursor: 'pointer' 
                                            }}
                                        >
                                            {Object.entries(NIVEIS_DOMINIO).map(([n, d]) => (
                                                <option key={n} value={n} style={{ background: '#0a0a0f', color: '#fff' }}>Lv {n} - {d.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#ccc' }}>
                                    <span style={{ color: infoNivel.cor, fontWeight: 'bold' }}>⚡ :</span> {infoNivel.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function AbaDominios() {
    const ctx = useMarcadosForm();
    if (!ctx) return <div style={{ color: '#888', padding: 10 }}>Contexto não encontrado</div>;
    const { minhaFicha } = ctx;
    const dominiosSalvos = minhaFicha?.dominios || {};

    return (
        <div style={{ width: '100%', padding: '10px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px' }}>
                {Object.entries(CATEGORIAS_DOMINIO).map(([catKey, catData]) => (
                    <QuadranteCategoria 
                        key={catKey} 
                        catKey={catKey} 
                        catData={catData} 
                        dominiosSalvos={dominiosSalvos} 
                    />
                ))}
            </div>
        </div>
    );
}