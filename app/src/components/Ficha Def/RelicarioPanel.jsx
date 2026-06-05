import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, uploadImagem } from '../../services/firebase-sync';

// ==========================================
// 📖 OS CAPÍTULOS DO RELICÁRIO
// ==========================================
const CAPITULOS = [
    { id: 'altar', label: 'Altar da Relíquia', icon: '🗡️' },
    { id: 'passivas', label: 'Estigmas & Runas', icon: '🪨' },
    { id: 'formas', label: 'Despertar das Formas', icon: '🌌' },
    { id: 'mochila', label: 'Mochila Mundana', icon: '🎒' }
];

// ==========================================
// 🧠 CONTEXTO ISOLADO DO RELICÁRIO
// ==========================================
const RelicarioContext = createContext(null);

export function useRelicario() {
    return useContext(RelicarioContext);
}

export function RelicarioProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const isMestre = useStore(s => s.isMestre);
    const meuNome = useStore(s => s.meuNome);
    const [abaAtual, setAbaAtual] = useState('altar');

    const callSave = useCallback(() => { salvarFichaSilencioso(); }, []);

    // Inicializa a estrutura da Arma Espiritual se não existir
    useEffect(() => {
        if (minhaFicha && !minhaFicha.armaEspiritual) {
            updateFicha(f => {
                f.armaEspiritual = {
                    nome: '', epiteto: '', cantico: '', danoBase: '',
                    avatarHumano: '', avatarArma: '',
                    passivas: [], runas: [], formas: []
                };
            });
            callSave();
        }
    }, [minhaFicha, updateFicha, callSave]);

    const handleArrayItem = useCallback((chave, acao, index, campo, valor, subIndex = null, subCampo = null) => {
        updateFicha((ficha) => {
            if (!ficha.armaEspiritual) return;
            const target = ficha.armaEspiritual[chave];
            
            if (acao === 'add') {
                if (chave === 'formas') target.push({ id: Date.now(), nome: '', dano: '', img: '', configs: [] });
                else target.push({ id: Date.now(), texto: '' });
            } 
            else if (acao === 'remove') target.splice(index, 1);
            else if (acao === 'update') target[index][campo] = valor;
            
            // Lógica para as Sub-Configurações dentro das Formas
            else if (acao === 'add-config') {
                if (!target[index].configs) target[index].configs = [];
                target[index].configs.push({ id: Date.now(), nome: '', desc: '', img: '' });
            }
            else if (acao === 'remove-config') target[index].configs.splice(subIndex, 1);
            else if (acao === 'update-config') target[index].configs[subIndex][subCampo] = valor;
        });
        callSave();
    }, [updateFicha, callSave]);

    const value = {
        minhaFicha, updateFicha, isMestre, meuNome, abaAtual, setAbaAtual, callSave, handleArrayItem
    };

    return <RelicarioContext.Provider value={value}>{children}</RelicarioContext.Provider>;
}

// ==========================================
// 🖋️ COMPONENTES VISUAIS E UPLOADERS
// ==========================================
const CampoMagico = ({ valor, onChange, placeholder, styleExtra = {}, type = "text", disabled = false }) => {
    const { callSave } = useRelicario();
    return (
        <input 
            type={type} value={valor || ''} onChange={e => onChange(e.target.value)} 
            onBlur={callSave} placeholder={placeholder} disabled={disabled}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed currentColor', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', outline: 'none', padding: '5px', width: '100%', opacity: disabled ? 0.7 : 1, ...styleExtra }} 
        />
    );
};

const AreaMagica = ({ valor, onChange, placeholder, styleExtra = {}, disabled = false }) => {
    const { callSave } = useRelicario();
    return (
        <textarea 
            value={valor || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            onBlur={callSave} disabled={disabled}
            style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', borderBottom: '2px dotted currentColor', color: 'inherit', fontFamily: 'inherit', padding: '8px', outline: 'none', resize: 'vertical', opacity: disabled ? 0.7 : 1, ...styleExtra }}
        />
    );
};

const ImageUploader = ({ valorAtual, onUploadComplete, placeholder }) => {
    const [loading, setLoading] = useState(false);
    const { meuNome, callSave } = useRelicario();

    const handleUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setLoading(true);
        try {
            const url = await uploadImagem(file, `relicario/${meuNome}_${Date.now()}`);
            onUploadComplete(url);
            callSave();
        } catch (err) { alert('Erro na forja da imagem!'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', border: valorAtual ? 'none' : '2px dashed currentColor', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            {loading ? <span style={{ fontWeight: 'bold' }}>Forjando...</span> : 
             valorAtual ? <img src={valorAtual} alt="Relíquia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
             <span style={{ opacity: 0.5, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>{placeholder}</span>}
            
            <label style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}>
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
        </div>
    );
};

// 📚 O NAVEGADOR DE CAPÍTULOS
function RelicarioNavegacao() {
    const { abaAtual, setAbaAtual } = useRelicario();
    const indexAtual = CAPITULOS.findIndex(c => c.id === abaAtual);
    const total = CAPITULOS.length;
    const dadosAba = CAPITULOS[indexAtual];

    const irPara = (novoIndex) => { if (novoIndex >= 0 && novoIndex < total) setAbaAtual(CAPITULOS[novoIndex].id); };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed currentColor', paddingBottom: '15px', marginBottom: '20px' }}>
            <button onClick={() => irPara(indexAtual - 1)} disabled={indexAtual === 0} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: indexAtual === 0 ? 'default' : 'pointer', opacity: indexAtual === 0 ? 0.3 : 1, fontWeight: 'bold' }}>⮜ FOLHEAR</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <select value={abaAtual} onChange={(e) => setAbaAtual(e.target.value)} style={{ background: 'transparent', color: 'inherit', border: 'none', borderBottom: '1px dotted currentColor', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px', outline: 'none', cursor: 'pointer', textAlign: 'center', opacity: 0.8 }}>
                    {CAPITULOS.map((c, i) => <option key={c.id} value={c.id} style={{ background: '#1e1423', color: '#e6d5b8' }}>CAPÍTULO {i + 1}: {c.label.toUpperCase()}</option>)}
                </select>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '1.8em', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}><span>{dadosAba.icon}</span> {dadosAba.label}</h2>
            </div>
            <button onClick={() => irPara(indexAtual + 1)} disabled={indexAtual === total - 1} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2em', cursor: indexAtual === total - 1 ? 'default' : 'pointer', opacity: indexAtual === total - 1 ? 0.3 : 1, fontWeight: 'bold' }}>FOLHEAR ⮞</button>
        </div>
    );
}

// ==========================================
// 🗡️ PÁGINA 1: O ALTAR DA RELÍQUIA
// ==========================================
function PaginaAltar() {
    const { minhaFicha, updateFicha, callSave } = useRelicario();
    const arma = minhaFicha?.armaEspiritual || {};

    const updateArma = (campo, valor) => {
        updateFicha(f => { if(f.armaEspiritual) f.armaEspiritual[campo] = valor; });
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', border: '3px double currentColor', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                <CampoMagico valor={arma.nome} onChange={v => updateArma('nome', v)} placeholder="Nome da Entidade/Arma (Ex: EA - Scathach Tilith)" styleExtra={{ fontSize: '2.5em', fontWeight: '900', textAlign: 'center', color: '#ff003c', letterSpacing: '2px', border: 'none' }} />
                <CampoMagico valor={arma.epiteto} onChange={v => updateArma('epiteto', v)} placeholder="Epíteto (Ex: Soberania da Rainha)" styleExtra={{ fontSize: '1.2em', fontStyle: 'italic', textAlign: 'center', color: 'currentColor', border: 'none', opacity: 0.8 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ border: '1px dashed currentColor', padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', opacity: 0.8 }}>📜 Cântico de Invocação</h3>
                        <AreaMagica valor={arma.cantico} onChange={v => updateArma('cantico', v)} placeholder={"Ex: I am the bone of my sword...\nUnknown to life,\nBut known for death."} styleExtra={{ minHeight: '180px', fontStyle: 'italic', fontSize: '1.1em', lineHeight: '1.5', border: 'none', background: 'transparent' }} />
                    </div>

                    <div style={{ border: '2px solid currentColor', padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#ff003c' }}>💥 Dano Base da Relíquia</h3>
                        <CampoMagico valor={arma.danoBase} onChange={v => updateArma('danoBase', v)} placeholder="Ex: 250d8 + Des x2 + Energia Espiritual x2" styleExtra={{ fontSize: '1.3em', fontWeight: 'bold' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1em', textAlign: 'center', opacity: 0.8 }}>Forma Humanoide</h3>
                        <div style={{ flex: 1, minHeight: '300px' }}>
                            <ImageUploader valorAtual={arma.avatarHumano} onUploadComplete={v => updateArma('avatarHumano', v)} placeholder="Adicionar Retrato Humanoide 📸" />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1em', textAlign: 'center', opacity: 0.8 }}>Forma Espada</h3>
                        <div style={{ flex: 1, minHeight: '300px' }}>
                            <ImageUploader valorAtual={arma.avatarArma} onUploadComplete={v => updateArma('avatarArma', v)} placeholder="Adicionar Retrato da Lâmina 📸" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 🪨 PÁGINA 2: ESTIGMAS & RUNAS (PASSIVAS)
// ==========================================
function PaginaPassivas() {
    const { minhaFicha, handleArrayItem } = useRelicario();
    const arma = minhaFicha?.armaEspiritual || {};

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            
            {/* PASSIVAS */}
            <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4em', color: '#00ffcc' }}>✨ Passivas da Relíquia</h2>
                    <button onClick={() => handleArrayItem('passivas', 'add')} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '5px 10px', cursor: 'pointer' }}>+ Inscrever</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(arma.passivas || []).map((p, i) => (
                        <div key={p.id} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ fontSize: '1.5em', opacity: 0.5 }}>-</span>
                            <AreaMagica valor={p.texto} onChange={v => handleArrayItem('passivas', 'update', i, 'texto', v)} placeholder="Ex: Absorção de Armas: EA pode absorver armas de nível inferior..." styleExtra={{ minHeight: '40px', padding: '5px' }} />
                            <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('passivas', 'remove', i); }} style={{ background: 'transparent', border: 'none', color: '#ff003c', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        </div>
                    ))}
                    {(!arma.passivas || arma.passivas.length === 0) && <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>Nenhuma passiva gravada.</div>}
                </div>
            </div>

            {/* RUNAS */}
            <div style={{ border: '1px dashed currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4em', color: '#ff00ff' }}>🔮 Runas & Multiplicadores</h2>
                    <button onClick={() => handleArrayItem('runas', 'add')} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '5px 10px', cursor: 'pointer' }}>+ Inscrever</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(arma.runas || []).map((r, i) => (
                        <div key={r.id} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ fontSize: '1.5em', opacity: 0.5 }}>•</span>
                            <AreaMagica valor={r.texto} onChange={v => handleArrayItem('runas', 'update', i, 'texto', v)} placeholder="Ex: EA multiplica o dano geral na forma base em 10x..." styleExtra={{ minHeight: '40px', padding: '5px' }} />
                            <button onClick={() => { if(window.confirm('Apagar?')) handleArrayItem('runas', 'remove', i); }} style={{ background: 'transparent', border: 'none', color: '#ff003c', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        </div>
                    ))}
                    {(!arma.runas || arma.runas.length === 0) && <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>Nenhuma runa gravada.</div>}
                </div>
            </div>

        </div>
    );
}

// ==========================================
// 🌌 PÁGINA 3: DESPERTAR DAS FORMAS
// ==========================================
function PaginaFormas() {
    const { minhaFicha, handleArrayItem } = useRelicario();
    const arma = minhaFicha?.armaEspiritual || {};

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid currentColor', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.8em', color: '#ffcc00' }}>🌌 O Despertar da Lâmina</h2>
                <button onClick={() => handleArrayItem('formas', 'add')} style={{ padding: '10px 20px', background: 'transparent', border: '2px solid currentColor', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>+ CRIAR NOVA FORMA</button>
            </div>

            {(arma.formas || []).map((forma, i) => (
                <div key={forma.id} style={{ border: '2px double currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', position: 'relative' }}>
                    <button onClick={() => { if(window.confirm('Destruir Forma?')) handleArrayItem('formas', 'remove', i); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ff003c', fontSize: '1.2em', cursor: 'pointer' }}>✖</button>
                    
                    {/* CABEÇALHO DA FORMA */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <div style={{ flex: '0 0 150px', height: '200px' }}>
                            <ImageUploader valorAtual={forma.img} onUploadComplete={v => handleArrayItem('formas', 'update', i, 'img', v)} placeholder="Foto Forma 📸" />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <CampoMagico valor={forma.nome} onChange={v => handleArrayItem('formas', 'update', i, 'nome', v)} placeholder="Ex: 1ª Forma: Pecados / Forma Verdadeira" styleExtra={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ff00ff' }} />
                            <CampoMagico valor={forma.dano} onChange={v => handleArrayItem('formas', 'update', i, 'dano', v)} placeholder="Dano Adicional/Específico desta Forma (Ex: 36d4)" styleExtra={{ fontSize: '1.1em', fontWeight: 'bold' }} />
                            
                            {/* SUB-CONFIGURAÇÕES */}
                            <div style={{ marginTop: '15px', borderTop: '1px dashed currentColor', paddingTop: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, opacity: 0.8 }}>Sub-Configurações Elementais</h4>
                                    <button onClick={() => handleArrayItem('formas', 'add-config', i)} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '4px 8px', fontSize: '0.8em', cursor: 'pointer' }}>+ Adicionar Sub-Configuração</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {(forma.configs || []).map((cfg, cIdx) => (
                                        <div key={cfg.id} style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '6px', position: 'relative' }}>
                                            <button onClick={() => { if(window.confirm('Apagar Configuração?')) handleArrayItem('formas', 'remove-config', i, null, null, cIdx); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'transparent', border: 'none', color: '#ff003c', cursor: 'pointer' }}>✖</button>
                                            
                                            <div style={{ flex: '0 0 80px', height: '100px' }}>
                                                <ImageUploader valorAtual={cfg.img} onUploadComplete={v => handleArrayItem('formas', 'update-config', i, null, v, cIdx, 'img')} placeholder="Lâmina 📸" />
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <CampoMagico valor={cfg.nome} onChange={v => handleArrayItem('formas', 'update-config', i, null, v, cIdx, 'nome')} placeholder="Ex: Tiamat Branca-Gelo" styleExtra={{ fontWeight: 'bold', fontSize: '1.1em', color: '#00ccff' }} />
                                                <AreaMagica valor={cfg.desc} onChange={v => handleArrayItem('formas', 'update-config', i, null, v, cIdx, 'desc')} placeholder="Efeitos específicos da lâmina de gelo..." styleExtra={{ minHeight: '40px', fontSize: '0.9em' }} />
                                            </div>
                                        </div>
                                    ))}
                                    {(!forma.configs || forma.configs.length === 0) && <div style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.85em' }}>Sem sub-configurações.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {(!arma.formas || arma.formas.length === 0) && <div style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '40px' }}>A Lâmina ainda não despertou nenhuma forma oculta.</div>}
        </div>
    );
}

// ==========================================
// 🎒 PÁGINA 4: MOCHILA MUNDANA
// ==========================================
function PaginaMochila() {
    const { minhaFicha, updateFicha, callSave } = useRelicario();
    const inventario = minhaFicha?.inventario || [];

    const addItem = () => {
        updateFicha(f => {
            if (!f.inventario) f.inventario = [];
            f.inventario.push({ id: Date.now(), nome: '', quantidade: 1, peso: 0, desc: '', equipado: false });
        });
        callSave();
    };

    const updateItem = (index, campo, valor) => {
        updateFicha(f => { f.inventario[index][campo] = valor; });
        callSave();
    };

    const removeItem = (index) => {
        if(window.confirm('Deitar fora o item?')) {
            updateFicha(f => { f.inventario.splice(index, 1); });
            callSave();
        }
    };

    return (
        <div className="fade-in" style={{ border: '2px solid currentColor', padding: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px dotted currentColor', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5em' }}>🎒 Itens e Suprimentos Mundanos</h2>
                <button onClick={addItem} style={{ padding: '8px 15px', background: 'transparent', border: '1px solid currentColor', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>+ Guardar Novo Item</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {inventario.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '5px', borderLeft: '3px solid currentColor' }}>
                        <CampoMagico valor={item.nome} onChange={v => updateItem(i, 'nome', v)} placeholder="Nome do Item" styleExtra={{ flex: 3, fontWeight: 'bold' }} />
                        
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Qtd:</span>
                            <CampoMagico valor={item.quantidade} onChange={v => updateItem(i, 'quantidade', Number(v))} type="number" styleExtra={{ textAlign: 'center' }} />
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Kg:</span>
                            <CampoMagico valor={item.peso} onChange={v => updateItem(i, 'peso', Number(v))} type="number" step="0.1" styleExtra={{ textAlign: 'center' }} />
                        </div>
                        
                        <button onClick={() => removeItem(i)} style={{ background: 'transparent', border: 'none', color: '#ff003c', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2em' }}>✖</button>
                    </div>
                ))}
                {inventario.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '20px' }}>A sua mochila está vazia.</div>}
            </div>
        </div>
    );
}

// ==========================================
// 🚀 O RENDERIZADOR PRINCIPAL DO LIVRO
// ==========================================
export default function RelicarioPanel() {
    return (
        <RelicarioProvider>
            <div className="grimorio-estilo-papel" style={{ width: '100%' }}>
                <RelicarioNavegacao />
                <ConteudoDinamico />
            </div>
        </RelicarioProvider>
    );
}

function ConteudoDinamico() {
    const { abaAtual } = useRelicario();
    if (abaAtual === 'altar') return <PaginaAltar />;
    if (abaAtual === 'passivas') return <PaginaPassivas />;
    if (abaAtual === 'formas') return <PaginaFormas />;
    if (abaAtual === 'mochila') return <PaginaMochila />;
    return null;
}