import React, { useState } from 'react';
import { useMarcadosForm, CATEGORIAS_DOMINIO, PREDEFINIDOS_LORE, NIVEIS_DOMINIO } from './MarcadosFormContext';

// COMPONENTE ISOLADO: Garante que os inputs não conversem entre si
function QuadranteCategoria({ catKey, catData, dominiosDaCategoria }) {
    const { handleAddDominio, handleRemoveDominio, handleChangeNivelDominio, handleMoveDominio } = useMarcadosForm();
    const [selectValue, setSelectValue] = useState('');
    const [inputValue, setInputValue] = useState('');

    const corTema = catData.cor || '#ffffff';
    const nomes = Object.keys(dominiosDaCategoria);

    return (
        <div className="def-box fade-in" style={{ padding: '20px', border: `1px solid ${corTema}`, borderRadius: '8px', marginTop: 0, boxShadow: `inset 0 0 10px ${corTema}15` }}>
            <h3 style={{ color: corTema, margin: '0 0 15px 0', borderBottom: `1px dotted ${corTema}`, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{catData.icone}</span> {catData.titulo}
            </h3>

            {/* 1. SELETOR DA LORE (Estilo Input Neon) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                    className="input-neon"
                    value={selectValue}
                    onChange={e => setSelectValue(e.target.value)}
                    style={{ flex: 1, borderColor: corTema, margin: 0, color: '#fff' }}
                >
                    <option value="">-- Escolher da Lore --</option>
                    {(PREDEFINIDOS_LORE[catKey] || []).map(grupo => (
                        <optgroup key={grupo.label} label={`— ${grupo.label} —`}>
                            {grupo.itens.map(item => <option key={item} value={item}>{item}</option>)}
                        </optgroup>
                    ))}
                </select>
                <button
                    className="btn-neon"
                    onClick={() => { handleAddDominio(catKey, selectValue); setSelectValue(''); }}
                    style={{ margin: 0, borderColor: corTema, color: corTema, padding: '8px 15px', fontWeight: 'bold' }}
                >
                    ADICIONAR
                </button>
            </div>

            {/* 2. INPUT CRIAR MANUAL (Estilo Input Neon) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    className="input-neon"
                    type="text"
                    placeholder={`Criar novo (Ex: Punho das Sombras)`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    style={{ flex: 1, borderColor: '#ffcc00', margin: 0, color: '#fff' }}
                />
                <button
                    className="btn-neon"
                    onClick={() => { handleAddDominio(catKey, inputValue); setInputValue(''); }}
                    style={{ margin: 0, borderColor: '#ffcc00', color: '#ffcc00', padding: '8px 15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
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
                            <div key={nomeDom} style={{ padding: '12px', border: `1px solid ${infoNivel.cor}`, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', position: 'relative' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '1.1em', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
                                        {nomeDom}
                                    </strong>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                        <select
                                            className="input-neon"
                                            value={nivel}
                                            onChange={e => handleChangeNivelDominio(catKey, nomeDom, e.target.value)}
                                            style={{ margin: 0, borderColor: infoNivel.cor, color: infoNivel.cor, padding: '4px 8px', fontWeight: 'bold' }}
                                        >
                                            {Object.entries(NIVEIS_DOMINIO).map(([n, d]) => (
                                                <option key={n} value={n} style={{ color: '#fff' }}>Lv {n} - {d.nome}</option>
                                            ))}
                                        </select>

                                        {/* DROPDOWN PARA MOVER/CORRIGIR MAGIA */}
                                        <select
                                            className="input-neon"
                                            title="Mover para outro quadrante"
                                            onChange={e => handleMoveDominio(catKey, e.target.value, nomeDom)}
                                            value=""
                                            style={{ margin: 0, padding: '2px', borderColor: '#444', color: '#aaa', cursor: 'pointer', width: '35px', textAlign: 'center' }}
                                        >
                                            <option value="" disabled>⮀</option>
                                            {Object.entries(CATEGORIAS_DOMINIO).filter(([k]) => k !== catKey).map(([k, d]) => (
                                                <option key={k} value={k} style={{ color: '#fff' }}>Mover p/: {d.titulo}</option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={() => handleRemoveDominio(catKey, nomeDom)}
                                            style={{ background: 'transparent', border: 'none', color: '#ff003c', fontSize: '1.4em', cursor: 'pointer', padding: '0 2px', fontWeight: 'bold' }}
                                            title="Apagar Registo"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.85em', fontStyle: 'italic', color: '#ccc' }}>
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