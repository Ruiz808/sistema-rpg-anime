import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { uploadImagem, salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';
import { getMaximo } from '../../core/attributes';

// 🖋️ INPUT INVISÍVEL
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

export default function MarcadosPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const meuNome = useStore(s => s.meuNome);
    const importarDaAbaStatus = useStore(s => s.importarDaAbaStatus);

    const [uploadingImg, setUploadingImg] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [textoImport, setTextoImport] = useState('');

    if (!minhaFicha) return <div style={{ color: '#000', padding: 20, fontFamily: 'cursive' }}>Lendo a Membrana...</div>;

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

    const executarImportacao = () => {
        if (!textoImport.trim()) return alert("Cole o texto do Google Docs primeiro!");
        importarDaAbaStatus(textoImport);
        setModalImport(false);
        setTextoImport('');
        alert("O seu diário foi sincronizado com as nuvens!");
    };

    const LinhaVital = ({ titulo, vitalKey, subItens }) => {
        const [aberto, setAberta] = useState(false);
        const atual = minhaFicha[vitalKey]?.atual || '';
        let maximo = 0;
        try { maximo = getMaximo(minhaFicha, vitalKey); } catch(e) { maximo = minhaFicha[vitalKey]?.base || 0; }

        return (
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontStyle: 'italic', fontSize: '1.2em' }}>
                    {subItens && (
                        <span onClick={() => setAberta(!aberto)} style={{ cursor: 'pointer', width: '20px', display: 'inline-block', userSelect: 'none' }}>
                            {aberto ? 'v ' : '> '}
                        </span>
                    )}
                    <span>{titulo}: </span>
                    <CampoMagico valor={atual} onChange={(v) => salvar(`${vitalKey}.atual`, v)} styleExtra={{ width: '130px', marginLeft: '5px', textAlign: 'right' }} />
                    <span style={{ margin: '0 5px' }}>/</span>
                    <span style={{ opacity: 0.7 }}>{Number(maximo).toLocaleString('pt-BR')}</span>
                </div>
                
                {aberto && subItens && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '35px', marginTop: '8px' }}>
                        {subItens.map(sub => {
                            const valBase = minhaFicha[sub.key]?.base || '';
                            return (
                                <div key={sub.label} style={{ fontStyle: 'italic', fontSize: '1.05em' }}>
                                    {sub.label}: (<CampoMagico valor={valBase} onChange={(v) => salvar(`${sub.key}.base`, v)} styleExtra={{ width: '90px' }} />)
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
            width: '100%', minHeight: '85vh', background: '#bba9d8', 
            color: '#000', fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive', 
            padding: '40px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '40px',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative'
        }}>
            
            <div style={{ position: 'absolute', top: '-15px', right: '30px', zIndex: 10 }}>
                <button onClick={() => setModalImport(!modalImport)} style={{ background: '#ffeb3b', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(2deg)', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform = 'rotate(0deg) scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'rotate(2deg) scale(1)'}>
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

            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '2px solid rgba(0,0,0,0.8)', paddingBottom: '5px', marginBottom: '10px', width: 'fit-content' }}>
                    <h1 style={{ fontSize: '3.5em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>
                        /{meuNome}©
                    </h1>
                </div>
                <h2 style={{ fontSize: '2.2em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0' }}>
                    - Limite quebrado - LV <CampoMagico valor={minhaFicha.bio?.nivel} onChange={(v) => salvar('bio.nivel', v)} styleExtra={{ width: '50px', borderBottom: 'none' }} />
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '1.2em' }}>
                    <div>Idade: <CampoMagico valor={minhaFicha.bio?.idade} onChange={(v) => salvar('bio.idade', v)} /></div>
                    <div>Aniversário: <CampoMagico valor={minhaFicha.bio?.aniversario} onChange={(v) => salvar('bio.aniversario', v)} /></div>
                    <div>Altura / Peso: <CampoMagico valor={minhaFicha.bio?.alturaPeso} onChange={(v) => salvar('bio.alturaPeso', v)} styleExtra={{ width: '220px' }} /></div>
                    <div>Raça: <CampoMagico valor={minhaFicha.bio?.raca} onChange={(v) => salvar('bio.raca', v)} /></div>
                    <div>Tipo sanguíneo: <CampoMagico valor={minhaFicha.bio?.tipoSanguineo} onChange={(v) => salvar('bio.tipoSanguineo', v)} styleExtra={{ width: '80px' }} /></div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        Alinhamento: <CampoMagico valor={minhaFicha.bio?.alinhamento} onChange={(v) => salvar('bio.alinhamento', v)} styleExtra={{ width: '350px', marginLeft: '5px' }} />
                    </div>
                    <div>Afiliação: <CampoMagico valor={minhaFicha.bio?.afiliacao} onChange={(v) => salvar('bio.afiliacao', v)} styleExtra={{ width: '250px' }} /></div>
                    <div>Classe: <CampoMagico valor={minhaFicha.bio?.classe} onChange={(v) => salvar('bio.classe', v)} /></div>
                    <div>Dinheiro: <CampoMagico valor={minhaFicha.inventario?.dinheiroText} onChange={(v) => salvar('inventario.dinheiroText', v)} placeholder="PO - 5600 PP - 5000" styleExtra={{ width: '300px' }} /></div>
                </div>

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

            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '2.5em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 30px 20px' }}>Base</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <LinhaVital titulo="Vida" vitalKey="vida" />
                    <LinhaVital titulo="Mana" vitalKey="mana" subItens={[ { label: 'Inteligência', key: 'inteligencia' }, { label: 'Sabedoria', key: 'sabedoria' } ]} />
                    <LinhaVital titulo="Aura" vitalKey="aura" subItens={[ { label: 'Energia Espiritual', key: 'energiaEsp' }, { label: 'Carisma', key: 'carisma' } ]} />
                    <LinhaVital titulo="Chakra" vitalKey="chakra" subItens={[ { label: 'Stamina', key: 'stamina' }, { label: 'Constituição', key: 'constituicao' } ]} />
                    <LinhaVital titulo="Corpo" vitalKey="corpo" subItens={[ { label: 'Destreza', key: 'destreza' }, { label: 'Força', key: 'forca' } ]} />
                    
                    <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '1.2em', marginLeft: '20px', marginTop: '10px' }}>
                        CA: <CampoMagico valor={minhaFicha.ca?.base} onChange={(v) => salvar('ca.base', v)} />
                    </div>
                    <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '1.2em', marginLeft: '20px' }}>
                        CD: <CampoMagico valor={minhaFicha.cd?.base} onChange={(v) => salvar('cd.base', v)} />
                    </div>
                </div>

                <div style={{ marginTop: '50px', border: '2px dashed rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-15px', left: '20px', background: '#bba9d8', padding: '0 10px', fontStyle: 'italic', fontWeight: 'bold', fontSize: '1.2em' }}>Ações de Turno</span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px' }}>
                        {['padrao', 'bonus', 'reacao'].map(tipo => {
                            const acao = minhaFicha.acoes?.[tipo] || { max: 1, atual: 1 };
                            const nomeVisual = tipo === 'padrao' ? 'Ação Padrão' : tipo === 'bonus' ? 'Ação Bônus' : 'Reação';
                            
                            return (
                                <div key={tipo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{nomeVisual}</span>
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