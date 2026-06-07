import React from 'react';
import { useMarcadosForm, CATEGORIAS_DOMINIO, PREDEFINIDOS_LORE, NIVEIS_DOMINIO } from './MarcadosFormContext';

export function AbaDominios() {
    const ctx = useMarcadosForm();
    if (!ctx) return <div style={{ color: '#888', padding: 10 }}>Contexto não encontrado</div>;

    const { 
        minhaFicha, inputsDominios, setInputsDominios, selectsDominios, setSelectsDominios,
        handleAddDominioInput, handleAddDominioSelect, handleRemoveDominio, handleChangeNivelDominio 
    } = ctx;

    const dominiosSalvos = minhaFicha?.dominios || {};

    return (
        <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed currentColor` }}>
                    A Hierarquia de Domínios
                </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
                {Object.entries(CATEGORIAS_DOMINIO).map(([catKey, catData]) => {
                    const listaDestaCategoria = dominiosSalvos[catKey] || {};
                    const nomes = Object.keys(listaDestaCategoria);
                    const corTema = catData.cor;

                    return (
                        <div key={catKey} style={{ 
                            border: `1px solid ${corTema}`, borderStyle: 'double',
                            padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)',
                            boxShadow: `inset 0 0 20px ${corTema}10`
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2em', borderBottom: `1px dotted ${corTema}`, paddingBottom: '10px', color: corTema }}>
                                <span>{catData.icone}</span> {catData.titulo}
                            </h3>

                            {/* DROPDOWN DE LORE */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    value={selectsDominios[catKey] || ''}
                                    onChange={e => setSelectsDominios({...selectsDominios, [catKey]: e.target.value})}
                                    style={{ flex: 1, background: 'rgba(0,0,0,0.7)', border: `1px solid ${corTema}`, color: '#fff', padding: '8px', borderRadius: '4px' }}
                                >
                                    <option value="">-- Escolher da Lore --</option>
                                    {(PREDEFINIDOS_LORE[catKey] || []).map(grupo => (
                                        <optgroup key={grupo.label} label={`— ${grupo.label} —`} style={{ color: corTema }}>
                                            {grupo.itens.map(item => <option key={item} value={item} style={{ color: '#fff' }}>{item}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <button onClick={() => handleAddDominioSelect(catKey)} style={{ background: 'transparent', border: `1px solid ${corTema}`, color: corTema, cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    ADICIONAR
                                </button>
                            </div>

                            {/* INPUT PARA CRIAR NOVO */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Criar novo (Ex: Punho das Sombras)"
                                    value={inputsDominios[catKey] || ''}
                                    onChange={e => setInputsDominios({...inputsDominios, [catKey]: e.target.value})}
                                    style={{ flex: 1, background: 'rgba(0,0,0,0.7)', border: '1px solid #ffcc00', color: '#fff', padding: '8px', borderRadius: '4px' }}
                                />
                                <button onClick={() => handleAddDominioInput(catKey)} style={{ background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', cursor: 'pointer', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    + CRIAR
                                </button>
                            </div>

                            {/* QUADRANTES / LISTA DE CARDS ADICIONADOS */}
                            {nomes.length === 0 ? (
                                <div style={{ opacity: 0.4, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Nenhum registo ainda...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {nomes.map(nomeDom => {
                                        const nivel = listaDestaCategoria[nomeDom]?.nivel || 1;
                                        const infoNivel = NIVEIS_DOMINIO[nivel] || NIVEIS_DOMINIO[1];
                                        return (
                                            <div key={nomeDom} style={{ padding: '12px', border: `1px solid ${infoNivel.cor}`, background: 'rgba(0,0,0,0.85)', borderRadius: '6px', position: 'relative' }}>
                                                <button onClick={() => handleRemoveDominio(catKey, nomeDom)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'transparent', border: 'none', color: '#ff003c', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingRight: '20px' }}>
                                                    <strong style={{ fontSize: '1.1em', textTransform: 'uppercase', color: '#fff' }}>{nomeDom}</strong>
                                                    <select value={nivel} onChange={e => handleChangeNivelDominio(catKey, nomeDom, e.target.value)} style={{ background: 'transparent', color: infoNivel.cor, border: `1px solid ${infoNivel.cor}`, borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }}>
                                                        {Object.entries(NIVEIS_DOMINIO).map(([n, d]) => <option key={n} value={n} style={{ background: '#111', color: '#fff' }}>Lv {n} - {d.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ fontSize: '0.85em', color: '#ccc' }}>
                                                    <span style={{ color: infoNivel.cor, fontWeight: 'bold' }}>⚡ :</span> {infoNivel.desc}
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

// Nota: Você criaria outras funções aqui como: export function AbaStatusPrincipais(), export function AbaAnalisePoder(), etc.