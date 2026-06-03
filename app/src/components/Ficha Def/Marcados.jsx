import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { uploadImagem, salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';
import { getMaximo } from '../../core/attributes';

// 🖋️ INPUT INVISÍVEL PARA VALORES (Com linha tracejada)
const CampoMagico = ({ valor, onChange, placeholder, styleExtra = {}, type = "text" }) => (
    <input 
        type={type}
        value={valor || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ 
            background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', 
            fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', 
            fontWeight: 'inherit', fontStyle: 'inherit', outline: 'none', 
            padding: '0 5px', width: '100px', ...styleExtra 
        }} 
    />
);

// 🏷️ NOVO: INPUT INVISÍVEL PARA RÓTULOS (Parece texto normal, mas é editável se clicar)
const LabelMagico = ({ valor, onChange, fallback }) => (
    <input 
        type="text"
        value={valor !== undefined ? valor : fallback} 
        onChange={(e) => onChange(e.target.value)}
        size={Math.max((valor !== undefined ? valor : fallback).length, 3)}
        style={{ 
            background: 'transparent', border: 'none', borderBottom: '1px solid transparent', 
            fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', 
            fontWeight: 'bold', fontStyle: 'italic', outline: 'none', 
            padding: '0', cursor: 'text', transition: '0.2s'
        }}
        onFocus={(e) => e.target.style.borderBottom = '1px dashed rgba(0,0,0,0.5)'}
        onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
    />
);

export default function MarcadosPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const meuNome = useStore(s => s.meuNome);
    const importarDaAbaStatus = useStore(s => s.importarDaAbaStatus);

    const [uploadingImg, setUploadingImg] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [textoImport, setTextoImport] = useState('');
    const [modalEstilo, setModalEstilo] = useState(false); // 🎨 NOVO MODAL DE ESTILO

    if (!minhaFicha) return <div style={{ color: '#000', padding: 20, fontFamily: 'cursive' }}>Lendo a Membrana...</div>;

    // 💾 Função central para guardar dados
    const salvar = (caminho, valor) => {
        updateFicha(f => {
            const chaves = caminho.split('.');
            let atual = f;
            for (let i = 0; i < chaves.length - 1; i++) {
                if (!atual[chaves[i]]) atual[chaves[i]] = {};
                atual = atual[chaves[i]];
            }
            atual[chaves[chaves.length - 1]] = valor;
        });
        salvarFichaSilencioso();
    };

    // Função de Atalho para os Rótulos Personalizáveis
    const getLabel = (key, fallback) => minhaFicha.labels?.[key] !== undefined ? minhaFicha.labels[key] : fallback;
    const setLabel = (key, val) => salvar(`labels.${key}`, val);

    // Variáveis de Estilo Dinâmicas (Guardadas na Ficha!)
    const corFundo = minhaFicha.estetica?.diarioCor || '#bba9d8'; // Lavanda por padrão
    const fonteDiario = minhaFicha.estetica?.diarioFonte || '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive';

    // 📸 Upload de Avatar
    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadingImg(true);
        try {
            const url = await uploadImagem(file, `avatars/${meuNome || 'desconhecido'}`);
            updateFicha(f => { if (!f.avatar) f.avatar = { base: "" }; f.avatar.base = url; });
            await salvarFirebaseImediato();
        } catch (err) { alert('Ocorreu uma falha ao pintar o avatar na Membrana!'); } 
        finally { setUploadingImg(false); }
    };

    // 📥 Importador
    const executarImportacao = () => {
        if (!textoImport.trim()) return alert("Cole o texto do Google Docs primeiro!");
        importarDaAbaStatus(textoImport);
        setModalImport(false);
        setTextoImport('');
        alert("O seu diário foi sincronizado com as nuvens!");
    };

    // 🩸 Linha de Atributos Base Flexível
    const LinhaVital = ({ labelKey, fallbackLabel, vitalKey, subItens }) => {
        const [aberto, setAberta] = useState(false);
        const atual = minhaFicha[vitalKey]?.atual || '';
        let maximo = 0;
        try { maximo = getMaximo(minhaFicha, vitalKey); } catch(e) { maximo = minhaFicha[vitalKey]?.base || 0; }

        return (
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2em' }}>
                    {subItens && (
                        <span onClick={() => setAberta(!aberto)} style={{ cursor: 'pointer', width: '20px', display: 'inline-block', userSelect: 'none', fontWeight: 'bold' }}>
                            {aberto ? 'v ' : '> '}
                        </span>
                    )}
                    {/* 👇 O título agora é editável! */}
                    <LabelMagico valor={getLabel(labelKey, fallbackLabel)} onChange={(v) => setLabel(labelKey, v)} />
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic', marginRight: '5px' }}>:</span>
                    
                    <CampoMagico valor={atual} onChange={(v) => salvar(`${vitalKey}.atual`, v)} styleExtra={{ width: '130px', textAlign: 'right' }} />
                    <span style={{ margin: '0 5px', fontWeight: 'bold' }}>/</span>
                    <span style={{ opacity: 0.7, fontWeight: 'bold' }}>{Number(maximo).toLocaleString('pt-BR')}</span>
                </div>
                
                {aberto && subItens && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '35px', marginTop: '8px' }}>
                        {subItens.map(sub => {
                            const valBase = minhaFicha[sub.key]?.base || '';
                            return (
                                <div key={sub.labelKey} style={{ fontSize: '1.05em', display: 'flex', alignItems: 'center' }}>
                                    <LabelMagico valor={getLabel(sub.labelKey, sub.fallbackLabel)} onChange={(v) => setLabel(sub.labelKey, v)} />
                                    <span style={{ fontWeight: 'bold', fontStyle: 'italic', margin: '0 5px' }}>: (</span>
                                    <CampoMagico valor={valBase} onChange={(v) => salvar(`${sub.key}.base`, v)} styleExtra={{ width: '90px' }} />
                                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>)</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ 
            width: '100%', minHeight: '85vh', 
            background: corFundo, // 🎨 APLICANDO A COR DINÂMICA
            color: '#000', 
            fontFamily: fonteDiario, // 🎨 APLICANDO A FONTE DINÂMICA
            padding: '40px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '40px',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative', transition: 'background 0.5s ease'
        }}>
            
            {/* 📌 PAINEL DE POST-ITS (Controles do Diário) */}
            <div style={{ position: 'absolute', top: '-15px', right: '30px', zIndex: 10, display: 'flex', gap: '10px' }}>
                
                {/* 🎨 Botão de Estilo */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setModalEstilo(!modalEstilo); setModalImport(false); }} style={{ background: '#ff94c2', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(-2deg)', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform = 'rotate(0deg) scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'rotate(-2deg) scale(1)'}>
                        🎨 Estilo
                    </button>
                    {modalEstilo && (
                        <div className="fade-in" style={{ position: 'absolute', top: '50px', right: '0', background: '#ffe4f0', padding: '15px', border: '1px solid #ccc', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', width: '250px', zIndex: 20 }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '1em', fontWeight: 'bold' }}>Personalizar Diário</p>
                            
                            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px' }}>Cor do Papel:</label>
                            <input type="color" value={corFundo} onChange={(e) => salvar('estetica.diarioCor', e.target.value)} style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer', marginBottom: '15px', background: 'transparent' }} />
                            
                            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px' }}>Fonte da Letra:</label>
                            <select value={fonteDiario} onChange={(e) => salvar('estetica.diarioFonte', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', fontFamily: 'inherit' }}>
                                <option value='"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive'>✏️ Escrito à Mão (Padrão)</option>
                                <option value="'Courier New', Courier, monospace">🖨️ Máquina de Escrever</option>
                                <option value="'Times New Roman', Times, serif">📖 Grimório Clássico</option>
                                <option value="'Trebuchet MS', 'Lucida Sans Unicode', sans-serif">📝 Moderno & Limpo</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* 📌 Botão de Importar */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setModalImport(!modalImport); setModalEstilo(false); }} style={{ background: '#ffeb3b', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(2deg)', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform = 'rotate(0deg) scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'rotate(2deg) scale(1)'}>
                        📌 Importar Docs
                    </button>
                    {modalImport && (
                        <div className="fade-in" style={{ position: 'absolute', top: '50px', right: '0', background: '#fff9c4', padding: '15px', border: '1px solid #ccc', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', width: '300px', zIndex: 20 }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>Cole os status do diário aqui:</p>
                            <textarea value={textoImport} onChange={e => setTextoImport(e.target.value)} style={{ width: '100%', height: '100px', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
                            <button onClick={executarImportacao} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '8px', marginTop: '10px', fontFamily: 'inherit', cursor: 'pointer' }}>Sincronizar ✍️</button>
                        </div>
                    )}
                </div>
            </div>

            {/* 📜 COLUNA ESQUERDA: PERFIL E AVATAR */}
            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                
                {/* Títulos */}
                <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '2px solid rgba(0,0,0,0.8)', paddingBottom: '5px', marginBottom: '10px', width: 'fit-content' }}>
                    <h1 style={{ fontSize: '3.5em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>
                        /{meuNome}©
                    </h1>
                </div>
                <h2 style={{ fontSize: '2.2em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
                    <LabelMagico valor={getLabel('tituloLv', '- Limite quebrado - LV')} onChange={(v) => setLabel('tituloLv', v)} />
                    <CampoMagico valor={minhaFicha.bio?.nivel} onChange={(v) => salvar('bio.nivel', v)} styleExtra={{ width: '60px', borderBottom: 'none', marginLeft: '10px' }} />
                </h2>

                {/* Lista de Bio Totalmente Editável */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '1.2em' }}>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio1', 'Idade')} onChange={(v) => setLabel('bio1', v)} />: <CampoMagico valor={minhaFicha.bio?.idade} onChange={(v) => salvar('bio.idade', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio2', 'Aniversário')} onChange={(v) => setLabel('bio2', v)} />: <CampoMagico valor={minhaFicha.bio?.aniversario} onChange={(v) => salvar('bio.aniversario', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio3', 'Altura / Peso')} onChange={(v) => setLabel('bio3', v)} />: <CampoMagico valor={minhaFicha.bio?.alturaPeso} onChange={(v) => salvar('bio.alturaPeso', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio4', 'Raça')} onChange={(v) => setLabel('bio4', v)} />: <CampoMagico valor={minhaFicha.bio?.raca} onChange={(v) => salvar('bio.raca', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio5', 'Tipo Sanguíneo')} onChange={(v) => setLabel('bio5', v)} />: <CampoMagico valor={minhaFicha.bio?.tipoSanguineo} onChange={(v) => salvar('bio.tipoSanguineo', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio6', 'Alinhamento')} onChange={(v) => setLabel('bio6', v)} />: <CampoMagico valor={minhaFicha.bio?.alinhamento} onChange={(v) => salvar('bio.alinhamento', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio7', 'Afiliação')} onChange={(v) => setLabel('bio7', v)} />: <CampoMagico valor={minhaFicha.bio?.afiliacao} onChange={(v) => salvar('bio.afiliacao', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio8', 'Classe')} onChange={(v) => setLabel('bio8', v)} />: <CampoMagico valor={minhaFicha.bio?.classe} onChange={(v) => salvar('bio.classe', v)} styleExtra={{ flex: 1 }} /></div>
                    <div style={{ display: 'flex' }}><LabelMagico valor={getLabel('bio9', 'Dinheiro')} onChange={(v) => setLabel('bio9', v)} />: <CampoMagico valor={minhaFicha.inventario?.dinheiroText} onChange={(v) => salvar('inventario.dinheiroText', v)} placeholder="PO - 5600 PP - 5000" styleExtra={{ flex: 1 }} /></div>
                </div>

                {/* Avatar */}
                <div style={{ marginTop: '30px', position: 'relative', width: 'fit-content' }}>
                    <label style={{ cursor: 'pointer', display: 'block' }} title="Clique para alterar a imagem do personagem">
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                        {uploadingImg ? (
                            <div style={{ width: '320px', height: '480px', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #000' }}>Desenhando... ✍️</div>
                        ) : minhaFicha.avatar?.base ? (
                            <img src={minhaFicha.avatar.base} alt="Avatar" style={{ width: '320px', height: 'auto', objectFit: 'cover', border: '2px solid rgba(0,0,0,0.8)', boxShadow: '8px 8px 0px rgba(0,0,0,0.2)' }} />
                        ) : (
                            <div style={{ width: '320px', height: '480px', border: '2px dashed #000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Colar Fotografia Aqui 📸</div>
                        )}
                    </label>
                </div>
            </div>

            {/* ⚔️ COLUNA DIREITA: ESTATÍSTICAS BASE E COMBATE */}
            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '2.5em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 30px 20px', display: 'flex' }}>
                    <LabelMagico valor={getLabel('tituloBase', 'Base')} onChange={(v) => setLabel('tituloBase', v)} />
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <LinhaVital labelKey="lblVida" fallbackLabel="Vida" vitalKey="vida" />
                    <LinhaVital labelKey="lblMana" fallbackLabel="Mana" vitalKey="mana" subItens={[ { labelKey: 'lblInt', fallbackLabel: 'Inteligência', key: 'inteligencia' }, { labelKey: 'lblSab', fallbackLabel: 'Sabedoria', key: 'sabedoria' } ]} />
                    <LinhaVital labelKey="lblAura" fallbackLabel="Aura" vitalKey="aura" subItens={[ { labelKey: 'lblEsp', fallbackLabel: 'Energia Espiritual', key: 'energiaEsp' }, { labelKey: 'lblCar', fallbackLabel: 'Carisma', key: 'carisma' } ]} />
                    <LinhaVital labelKey="lblChakra" fallbackLabel="Chakra" vitalKey="chakra" subItens={[ { labelKey: 'lblSta', fallbackLabel: 'Stamina', key: 'stamina' }, { labelKey: 'lblCon', fallbackLabel: 'Constituição', key: 'constituicao' } ]} />
                    <LinhaVital labelKey="lblCorpo" fallbackLabel="Corpo" vitalKey="corpo" subItens={[ { labelKey: 'lblDes', fallbackLabel: 'Destreza', key: 'destreza' }, { labelKey: 'lblFor', fallbackLabel: 'Força', key: 'forca' } ]} />
                    
                    <div style={{ fontStyle: 'italic', fontSize: '1.2em', marginLeft: '20px', marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                        <LabelMagico valor={getLabel('lblCa', 'CA')} onChange={(v) => setLabel('lblCa', v)} /><span style={{fontWeight:'bold', margin:'0 5px'}}>:</span>
                        <CampoMagico valor={minhaFicha.ca?.base} onChange={(v) => salvar('ca.base', v)} />
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '1.2em', marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
                        <LabelMagico valor={getLabel('lblCd', 'CD')} onChange={(v) => setLabel('lblCd', v)} /><span style={{fontWeight:'bold', margin:'0 5px'}}>:</span>
                        <CampoMagico valor={minhaFicha.cd?.base} onChange={(v) => salvar('cd.base', v)} />
                    </div>
                </div>

                {/* ⌛ ECONOMIA DE AÇÕES */}
                <div style={{ marginTop: '50px', border: '2px dashed rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-15px', left: '20px', background: corFundo, padding: '0 10px', fontSize: '1.2em', transition: 'background 0.5s ease' }}>
                        <LabelMagico valor={getLabel('tituloTurno', 'Ações de Turno')} onChange={(v) => setLabel('tituloTurno', v)} />
                    </span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px' }}>
                        {['padrao', 'bonus', 'reacao'].map(tipo => {
                            const acao = minhaFicha.acoes?.[tipo] || { max: 1, atual: 1 };
                            const fallbackName = tipo === 'padrao' ? 'Ação Padrão' : tipo === 'bonus' ? 'Ação Bônus' : 'Reação';
                            
                            return (
                                <div key={tipo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.1em' }}>
                                        <LabelMagico valor={getLabel(`acao_${tipo}`, fallbackName)} onChange={(v) => setLabel(`acao_${tipo}`, v)} />
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {Array.from({ length: acao.max }).map((_, i) => {
                                            const gasto = i >= acao.atual;
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => salvar(`acoes.${tipo}.atual`, gasto ? acao.atual + 1 : acao.atual - 1)}
                                                    style={{ 
                                                        width: '25px', height: '25px', 
                                                        border: '2px solid #000', borderRadius: '4px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', fontSize: '1.2em', color: '#ff003c'
                                                    }}
                                                >
                                                    {gasto ? 'X' : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}