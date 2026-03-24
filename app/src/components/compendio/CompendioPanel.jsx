import React, { useState, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

const CLASSES_REGULARES_BASE = [
    { id: 'saber', nome: 'Saber', icone: '⚔️', titulo: 'Cavaleiro da Espada', cor: '#0088ff', passiva: 'Resistência Mágica', desc: 'A classe mais equilibrada das sete. Especialistas no domínio de lâminas.', efeito: 'Excelentes atributos base em Força, Constituição e Destreza.', efeitosMatematicos: [{ atributo: 'corpo', propriedade: 'mbase', valor: 0.5 }, { atributo: 'constituicao', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'archer', nome: 'Archer', icone: '🏹', titulo: 'Cavaleiro do Arco', cor: '#ff003c', passiva: 'Ação Independente', desc: 'Especialistas em combate à distância e projéteis.', efeito: 'Possuem bónus massivo em precisão e Letalidade.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'letalidade', valor: 20 }] },
    { id: 'lancer', nome: 'Lancer', icone: '🗡️', titulo: 'Cavaleiro da Lança', cor: '#00ffcc', passiva: 'Proteção contra Flechas', desc: 'Guerreiros velozes que empunham armas de haste.', efeito: 'Altamente ágeis e letais no corpo a corpo.', efeitosMatematicos: [{ atributo: 'destreza', propriedade: 'mbase', valor: 0.5 }, { atributo: 'stamina', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'rider', nome: 'Rider', icone: '🏇', titulo: 'Cavaleiro de Montaria', cor: '#ff8800', passiva: 'Montaria (Riding)', desc: 'Espíritos associados a grandes lendas de montarias.', efeito: 'Altíssima velocidade de movimento no mapa e evasão.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'bonus_evasiva', valor: 200 }] },
    { id: 'caster', nome: 'Caster', icone: '🧙‍♂️', titulo: 'Conjurador Magus', cor: '#cc00ff', passiva: 'Criação de Território', desc: 'Estudiosos dos mistérios mágicos e construtores de domínios.', efeito: 'Fracos no corpo a corpo, mas com Inteligência e Sabedoria supremas.', efeitosMatematicos: [{ atributo: 'inteligencia', propriedade: 'mbase', valor: 0.5 }, { atributo: 'sabedoria', propriedade: 'mbase', valor: 0.5 }, { atributo: 'mana', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'assassin', nome: 'Assassin', icone: '🔪', titulo: 'Assassino Furtivo', cor: '#444444', passiva: 'Ocultação de Presença', desc: 'Mestres da furtividade e ataques críticos.', efeito: 'Aumenta permanentemente o multiplicador dos Críticos.', efeitosMatematicos: [{ atributo: 'geral', propriedade: 'criticonormal', valor: 1 }, { atributo: 'geral', propriedade: 'criticofatal', valor: 1 }] },
    { id: 'berserker', nome: 'Berserker', icone: '狂', titulo: 'O Guerreiro Insano', cor: '#ff0000', passiva: 'Mad Enhancement', desc: 'Heróis que sucumbiram à fúria ou à loucura.', efeito: 'Monstruoso em Corpo e Pontos Vitais, mas com menos Sanidade/Status.', efeitosMatematicos: [{ atributo: 'vida', propriedade: 'munico', valor: 1.5 }, { atributo: 'corpo', propriedade: 'munico', valor: 1.5 }, { atributo: 'status', propriedade: 'mbase', valor: -0.5 }, { atributo: 'inteligencia', propriedade: 'mbase', valor: -0.5 }] }
];

const CLASSES_EXTRA_BASE = [
    { id: 'shielder', nome: 'Shielder', icone: '🛡️', titulo: 'O Escudo Protetor', cor: '#00ffff', passiva: 'Frente de Batalha', desc: 'Classe defensiva suprema.', efeito: 'Consegue transferir o dano de aliados para si mesmo e criar barreiras.', efeitosMatematicos: [{ atributo: 'constituicao', propriedade: 'mbase', valor: 1.0 }, { atributo: 'forca', propriedade: 'mbase', valor: 1.0 }, { atributo: 'geral', propriedade: 'bonus_resistencia', valor: 500 }] },
    { id: 'ruler', nome: 'Ruler', icone: '⚖️', titulo: 'O Árbitro Santo', cor: '#ffcc00', passiva: 'Resolução Divina', desc: 'Invocados para manter as regras do mundo.', efeito: 'Recebem metade do dano das 6 classes regulares.', efeitosMatematicos: [{ atributo: 'todos_status', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'avenger', nome: 'Avenger', icone: '⛓️', titulo: 'O Vingador', cor: '#880000', passiva: 'Vingança Eterna', desc: 'Nascidos do ódio e traição.', efeito: 'Multiplicador único de x10 em Status e Dano.', efeitosMatematicos: [{ atributo: 'dano', propriedade: 'munico', valor: 10 }, { atributo: 'todos_status', propriedade: 'munico', valor: 10 }] },
    { id: 'alterego', nome: 'Alter Ego', icone: '🎭', titulo: 'O Fragmento de Ego', cor: '#ff00ff', passiva: 'Dualidade', desc: 'Fusão de múltiplos espíritos.', efeito: 'Têm vantagem contra as classes da Cavalaria.', efeitosMatematicos: [{ atributo: 'carisma', propriedade: 'mbase', valor: 0.5 }, { atributo: 'energiaesp', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'foreigner', nome: 'Foreigner', icone: '🐙', titulo: 'O Viajante do Abismo', cor: '#00ff88', passiva: 'Existência Fora do Domínio', desc: 'Conectados a entidades além do universo conhecido.', efeito: 'Resistência passiva a dano psicológico.', efeitosMatematicos: [{ atributo: 'sabedoria', propriedade: 'mbase', valor: 1.0 }] },
    { id: 'mooncancer', nome: 'Moon Cancer', icone: '🌕', titulo: 'A Anomalia Digital', cor: '#8888aa', passiva: 'Erro de Sistema', desc: 'Capazes de corromper as próprias regras do combate.', efeito: 'Causam dano extra aos Avengers.', efeitosMatematicos: [{ atributo: 'inteligencia', propriedade: 'mbase', valor: 1.0 }] },
    { id: 'pretender', nome: 'Pretender', icone: '🤥', titulo: 'O Falso Heroico', cor: '#ffaa00', passiva: 'Engano Perfeito', desc: 'Aqueles que assumem a identidade de outros.', efeito: 'Imunes a habilidades de leitura de status.', efeitosMatematicos: [{ atributo: 'carisma', propriedade: 'mbase', valor: 0.5 }, { atributo: 'destreza', propriedade: 'mbase', valor: 0.5 }] },
    { id: 'beast', nome: 'Beast', icone: '👹', titulo: 'O Mal da Humanidade', cor: '#4a0000', passiva: 'Autoridade da Besta', desc: 'Os Males Originais da humanidade.', efeito: 'Possuem barras de HP massivas.', efeitosMatematicos: [{ atributo: 'pv', propriedade: 'munico', valor: 3.0 }, { atributo: 'pm', propriedade: 'munico', valor: 3.0 }, { atributo: 'dano', propriedade: 'mgeral', valor: 1.0 }] },
    { id: 'savior', nome: 'Savior', icone: '☀️', titulo: 'O Iluminado', cor: '#ffffff', passiva: 'Iluminação', desc: 'Seres messiânicos transcendentes.', efeito: 'Focam-se em curas monumentais.', efeitosMatematicos: [{ atributo: 'aura', propriedade: 'mbase', valor: 2.0 }, { atributo: 'chakra', propriedade: 'mbase', valor: 2.0 }] }
];

export default function CompendioPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const personagens = useStore(s => s.personagens);
    const isMestre = useStore(s => s.isMestre);
    const updateFicha = useStore(s => s.updateFicha);

    const [secaoAtiva, setSecaoAtiva] = useState('classes');
    const [editandoId, setEditandoId] = useState(null);
    const [tempNome, setTempNome] = useState('');
    const [tempTitulo, setTempTitulo] = useState('');
    const [tempPassiva, setTempPassiva] = useState('');
    const [tempDesc, setTempDesc] = useState('');
    const [tempEfeito, setTempEfeito] = useState('');
    const [tempIconeUrl, setTempIconeUrl] = useState('');
    const [tempEfeitosMat, setTempEfeitosMat] = useState([]);

    const overridesCompendio = useMemo(() => {
        if (!minhaFicha) return {};
        if (isMestre && minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for (let k of chaves) {
                if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides;
            }
        }
        return {};
    }, [isMestre, minhaFicha, personagens]);

    const mesclarComOverrides = (classesBase) => {
        return classesBase.map(cls => {
            const custom = overridesCompendio[cls.id];
            if (custom) {
                return { 
                    ...cls, 
                    nome: custom.nome || cls.nome,
                    titulo: custom.titulo || cls.titulo,
                    passiva: custom.passiva || cls.passiva, 
                    desc: custom.desc || cls.desc,
                    efeito: custom.efeito || cls.efeito,
                    iconeUrl: custom.iconeUrl || cls.iconeUrl,
                    efeitosMatematicos: custom.efeitosMatematicos || cls.efeitosMatematicos 
                };
            }
            return cls;
        });
    };

    const regulares = mesclarComOverrides(CLASSES_REGULARES_BASE);
    const extras = mesclarComOverrides(CLASSES_EXTRA_BASE);

    const iniciarEdicao = (classe) => {
        setEditandoId(classe.id);
        setTempNome(classe.nome || '');
        setTempTitulo(classe.titulo || '');
        setTempPassiva(classe.passiva || '');
        setTempDesc(classe.desc || '');
        setTempEfeito(classe.efeito || '');
        setTempIconeUrl(classe.iconeUrl || '');
        // 🔥 CORREÇÃO 1: Criar clones profundos para o React não bloquear a edição
        setTempEfeitosMat(classe.efeitosMatematicos ? classe.efeitosMatematicos.map(ef => ({ ...ef })) : []); 
    };

    const salvarEdicao = (id) => {
        updateFicha(f => {
            if (!f.compendioOverrides) f.compendioOverrides = {};
            f.compendioOverrides[id] = {
                nome: tempNome,
                titulo: tempTitulo,
                passiva: tempPassiva,
                desc: tempDesc,
                efeito: tempEfeito,
                iconeUrl: tempIconeUrl,
                efeitosMatematicos: tempEfeitosMat 
            };
        });
        salvarFichaSilencioso();
        setEditandoId(null);
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: '📜 O Mestre reescreveu os registos matemáticos do Compêndio!' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
    };

    // 🔥 CORREÇÃO 2: Atualização de estado segura para campos de edição no React
    const handleEfMat = (index, campo, valor) => {
        const novosEfeitos = tempEfeitosMat.map((ef, i) => {
            if (i === index) {
                return { ...ef, [campo]: valor }; // Guarda como texto temporariamente para evitar falhas ao apagar vírgulas
            }
            return ef;
        });
        setTempEfeitosMat(novosEfeitos);
    };
    
    const addEfMat = () => setTempEfeitosMat([...tempEfeitosMat, { atributo: '', propriedade: '', valor: '' }]);
    const removeEfMat = (index) => setTempEfeitosMat(tempEfeitosMat.filter((_, i) => i !== index));

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTempIconeUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const renderCardClasse = (classe, index) => {
        const isEditando = editandoId === classe.id;

        return (
            <div key={index} style={{ 
                background: 'rgba(0,0,0,0.5)', border: `1px solid ${classe.cor}50`, borderLeft: `4px solid ${classe.cor}`,
                borderRadius: '5px', padding: '15px', boxShadow: `0 4px 10px rgba(0,0,0,0.5)`,
                display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '50px', height: '50px', background: `${classe.cor}20`, borderRadius: '50%', border: `1px solid ${classe.cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {classe.iconeUrl ? <img src={classe.iconeUrl} alt={classe.nome} style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: '2em' }}>{classe.icone}</span>}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: classe.cor, letterSpacing: '1px', textShadow: `0 0 5px ${classe.cor}80` }}>{classe.nome.toUpperCase()}</h3>
                            <div style={{ color: '#aaa', fontSize: '0.9em', fontStyle: 'italic' }}>{classe.titulo}</div>
                        </div>
                    </div>
                    {isMestre && !isEditando && (
                        <button className="btn-neon btn-gold btn-small" onClick={() => iniciarEdicao(classe)} style={{ padding: '4px 10px', fontSize: '0.8em', margin: 0 }}>✏️ Editar</button>
                    )}
                </div>

                {isEditando ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.8em', color: '#0088ff' }}>Nome da Classe:</label>
                                <input type="text" className="input-neon" value={tempNome} onChange={(e) => setTempNome(e.target.value)} style={{ width: '100%', padding: '5px', borderColor: '#0088ff', color: '#fff', fontWeight: 'bold' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8em', color: '#aaa' }}>Título / Alcunha:</label>
                                <input type="text" className="input-neon" value={tempTitulo} onChange={(e) => setTempTitulo(e.target.value)} style={{ width: '100%', padding: '5px', borderColor: '#aaa', color: '#ccc', fontStyle: 'italic' }} />
                            </div>
                        </div>

                        {/* MOTOR MATEMÁTICO (UI CORRIGIDA) */}
                        <div style={{ background: 'rgba(0, 255, 204, 0.05)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(0, 255, 204, 0.3)' }}>
                            <h4 style={{ color: '#00ffcc', margin: '0 0 10px 0', fontSize: '0.9em' }}>⚙️ Motor Matemático (Efeitos Base)</h4>
                            {tempEfeitosMat.map((ef, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                    <input type="text" placeholder="Atributo (ex: dano)" value={ef.atributo} onChange={e => handleEfMat(idx, 'atributo', e.target.value)} className="input-neon" style={{ flex: 1, padding: '4px' }} title="Ex: forca, dano, vida, todos_status" />
                                    <input type="text" placeholder="Prop. (ex: munico)" value={ef.propriedade} onChange={e => handleEfMat(idx, 'propriedade', e.target.value)} className="input-neon" style={{ flex: 1, padding: '4px' }} title="Ex: base, mbase, munico, letalidade" />
                                    <input type="text" placeholder="Valor" value={ef.valor} onChange={e => handleEfMat(idx, 'valor', e.target.value)} className="input-neon" style={{ width: '80px', padding: '4px' }} title="Pode usar decimais. Ex: 10 ou 0.5" />
                                    <button className="btn-neon btn-red" onClick={() => removeEfMat(idx)} style={{ padding: '0 8px', margin: 0 }}>X</button>
                                </div>
                            ))}
                            <button className="btn-neon btn-small" onClick={addEfMat} style={{ marginTop: '5px', fontSize: '0.7em' }}>+ Adicionar Efeito Matemático</button>
                        </div>

                        <div style={{ background: 'rgba(255, 204, 0, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(255, 204, 0, 0.3)' }}>
                            <label style={{ fontSize: '0.8em', color: '#ffcc00', display: 'block', marginBottom: '5px' }}>Anexar Ícone (Upload do Computador):</label>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ color: '#fff', fontSize: '0.9em' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8em', color: '#ffcc00' }}>Habilidade de Classe:</label>
                            <input type="text" className="input-neon" value={tempPassiva} onChange={(e) => setTempPassiva(e.target.value)} style={{ width: '100%', padding: '5px', borderColor: '#ffcc00', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8em', color: '#aaa' }}>Descrição (História / Lore):</label>
                            <textarea className="input-neon" value={tempDesc} onChange={(e) => setTempDesc(e.target.value)} style={{ width: '100%', padding: '5px', minHeight: '60px', borderColor: '#444', color: '#ccc', fontStyle: 'italic' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8em', color: '#00ffcc' }}>Efeitos Mecânicos (Regras Visuais):</label>
                            <textarea className="input-neon" value={tempEfeito} onChange={(e) => setTempEfeito(e.target.value)} style={{ width: '100%', padding: '5px', minHeight: '60px', borderColor: '#00ffcc', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                            <button className="btn-neon btn-red btn-small" onClick={cancelarEdicao} style={{ margin: 0 }}>Cancelar</button>
                            <button className="btn-neon btn-green btn-small" onClick={() => salvarEdicao(classe.id)} style={{ margin: 0 }}>💾 Guardar Regras</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', borderLeft: `2px solid #fff` }}>
                            <strong style={{ color: '#fff', fontSize: '0.85em', textTransform: 'uppercase' }}>Habilidade de Classe: </strong> 
                            <span style={{ color: '#ffcc00', fontSize: '0.9em' }}>{classe.passiva}</span>
                        </div>
                        <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.85em', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>"{classe.desc}"</p>
                        <div style={{ background: 'rgba(0, 255, 204, 0.05)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(0, 255, 204, 0.3)', marginTop: '5px' }}>
                            <div style={{ color: '#00ffcc', fontSize: '0.75em', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Efeitos da Classe</div>
                            <div style={{ color: '#fff', fontSize: '0.9em', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>⚔️ {classe.efeito}</div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', gap: '20px', minHeight: '70vh', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 220px', background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '8px', border: '1px solid #00ffcc', boxShadow: '0 0 15px rgba(0, 255, 204, 0.1)' }}>
                <h3 style={{ color: '#00ffcc', marginTop: 0, textAlign: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '15px', letterSpacing: '2px' }}>📖 GRIMÓRIO</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <button className={`btn-neon ${secaoAtiva === 'classes' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('classes')} style={{ textAlign: 'left', paddingLeft: '15px' }}>🛡️ Classes</button>
                    <button className={`btn-neon ${secaoAtiva === 'condicoes' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('condicoes')} style={{ textAlign: 'left', paddingLeft: '15px' }}>🩸 Condições</button>
                    <button className={`btn-neon ${secaoAtiva === 'danos' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('danos')} style={{ textAlign: 'left', paddingLeft: '15px' }}>⚔️ Tipos de Dano</button>
                    <button className={`btn-neon ${secaoAtiva === 'regras' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('regras')} style={{ textAlign: 'left', paddingLeft: '15px' }}>📜 Regras da Casa</button>
                </div>
            </div>
            <div style={{ flex: '1', background: 'rgba(20, 20, 30, 0.8)', padding: '30px', borderRadius: '8px', border: '1px solid #444', height: '70vh', overflowY: 'auto' }}>
                {secaoAtiva === 'classes' && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #ffcc00', paddingBottom: '10px', marginBottom: '30px' }}>
                            <h2 style={{ color: '#ffcc00', margin: 0, textShadow: '0 0 10px #ffcc00' }}>🛡️ O Trono dos Heróis: Classes</h2>
                            {isMestre && <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8em' }}>Modo de Edição de Mestre Ativo 👑</span>}
                        </div>
                        <h3 style={{ color: '#0088ff', borderBottom: '1px dotted #0088ff', paddingBottom: '5px' }}>🌟 Classes Regulares</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            {regulares.map((classe, i) => renderCardClasse(classe, i))}
                        </div>
                        <h3 style={{ color: '#ff00ff', borderBottom: '1px dotted #ff00ff', paddingBottom: '5px' }}>✨ Classes Extra (Irregulares)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {extras.map((classe, i) => renderCardClasse(classe, i))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}