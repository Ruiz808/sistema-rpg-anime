import React, { useState, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { salvarFichaSilencioso, enviarParaFeed } from '../../services/firebase-sync';

const CLASSES_REGULARES_BASE = [
    { id: 'saber', nome: 'Saber', icone: '⚔️', titulo: 'Cavaleiro da Espada', cor: '#0088ff', passiva: 'Resistência Mágica', desc: 'A classe mais equilibrada. Excelentes atributos base em Força, Constituição e Destreza. Recebem bônus passivo para resistir a feitiços e efeitos mágicos diretos.' },
    { id: 'archer', nome: 'Archer', icone: '🏹', titulo: 'Cavaleiro do Arco', cor: '#ff003c', passiva: 'Ação Independente', desc: 'Especialistas em combate à distância e projéteis. Podem sobreviver e agir mesmo com baixa Mana/Aura. Possuem bônus em precisão e Letalidade.' },
    { id: 'lancer', nome: 'Lancer', icone: '🗡️', titulo: 'Cavaleiro da Lança', cor: '#00ffcc', passiva: 'Proteção contra Flechas', desc: 'Altamente ágeis e letais no corpo a corpo. Especialistas em contra-ataques e evasão. Foco extremo em Destreza e ataques de alcance médio.' },
    { id: 'rider', nome: 'Rider', icone: '🏇', titulo: 'Cavaleiro de Montaria', cor: '#ff8800', passiva: 'Montaria (Riding)', desc: 'Possuem a capacidade de domar bestas e conduzir veículos mágicos/tecnológicos. Altíssima velocidade de movimento no mapa e vantagem em ataques de investida.' },
    { id: 'caster', nome: 'Caster', icone: '🧙‍♂️', titulo: 'Conjurador Magus', cor: '#cc00ff', passiva: 'Criação de Território', desc: 'Fracos no corpo a corpo, mas com Inteligência e Sabedoria supremas. Podem alterar o campo de batalha e possuem reservas colossais de Mana.' },
    { id: 'assassin', nome: 'Assassin', icone: '🔪', titulo: 'Assassino Furtivo', cor: '#444444', passiva: 'Ocultação de Presença', desc: 'Mestres da furtividade e ataques críticos. Conseguem mover-se pelo mapa sem serem detetados até o momento do ataque. Foco no multiplicador de Dano Crítico.' },
    { id: 'berserker', nome: 'Berserker', icone: '狂', titulo: 'O Guerreiro Insano', cor: '#ff0000', passiva: 'Mad Enhancement', desc: 'Sacrificam a sanidade (Status/Inteligência) em troca de um aumento monstruoso em Força, Corpo e Pontos Vitais. Causam muito dano, mas recebem dano extra de todas as classes.' }
];

const CLASSES_EXTRA_BASE = [
    { id: 'shielder', nome: 'Shielder', icone: '🛡️', titulo: 'O Escudo Protetor', cor: '#00ffff', passiva: 'Frente de Batalha', desc: 'Classe defensiva suprema. Não possui fraquezas contra classes regulares. Consegue transferir o dano de aliados para si mesmo e criar barreiras impenetráveis.' },
    { id: 'ruler', nome: 'Ruler', icone: '⚖️', titulo: 'O Árbitro Santo', cor: '#ffcc00', passiva: 'Resolução Divina', desc: 'Invocados para manter as regras do mundo. Recebem metade do dano das 6 classes regulares (exceto Berserker). Imunes a efeitos de corrupção mental.' },
    { id: 'avenger', nome: 'Avenger', icone: '⛓️', titulo: 'O Vingador', cor: '#880000', passiva: 'Vingança Eterna', desc: 'Nascidos do ódio e traição. Quanto menos HP tiverem (ou quanto mais aliados caírem), mais forte se torna o seu Dano Base. Têm vantagem contra Rulers.' },
    { id: 'alterego', nome: 'Alter Ego', icone: '🎭', titulo: 'O Fragmento de Ego', cor: '#ff00ff', passiva: 'Dualidade', desc: 'Fusão de múltiplos espíritos ou emoções separadas de um original. Têm vantagem contra as classes da Cavalaria (Rider, Caster, Assassin), mas são fracos contra os Cavaleiros (Saber, Archer, Lancer).' },
    { id: 'foreigner', nome: 'Foreigner', icone: '🐙', titulo: 'O Viajante do Abismo', cor: '#00ff88', passiva: 'Existência Fora do Domínio', desc: 'Conectados a entidades além do universo conhecido (Deuses Exteriores). Têm vantagem absoluta contra Berserkers e resistência passiva a dano psicológico.' },
    { id: 'mooncancer', nome: 'Moon Cancer', icone: '🌕', titulo: 'A Anomalia Digital', cor: '#8888aa', passiva: 'Erro de Sistema', desc: 'Entidades irregulares que não deveriam existir, capazes de corromper as próprias regras do combate. Têm vantagem e causam dano extra aos Avengers, mas são frágeis contra Rulers.' },
    { id: 'pretender', nome: 'Pretender', icone: '🤥', titulo: 'O Falso Heroico', cor: '#ffaa00', passiva: 'Engano Perfeito', desc: 'Aqueles que assumem a identidade e os feitos de outros, enganando até o próprio mundo. Têm vantagem tática contra Alter Egos, mas recebem dano adicional de Foreigners.' },
    { id: 'beast', nome: 'Beast', icone: '👹', titulo: 'O Mal da Humanidade', cor: '#4a0000', passiva: 'Autoridade da Besta', desc: 'Manifestações dos Pecados da Humanidade. Uma classe apocalíptica desenhada para Chefes. Possuem barras de HP massivas (PV e PM multiplicados) e resistem a quase todas as formas normais de dano.' },
    { id: 'savior', nome: 'Savior', icone: '☀️', titulo: 'O Iluminado', cor: '#ffffff', passiva: 'Iluminação', desc: 'Seres messiânicos que alcançaram a salvação. Não são feitos para atacar, mas focam-se em curas monumentais, buffs impenetráveis e pacificação de inimigos no campo de batalha.' }
];

export default function CompendioPanel() {
    const { minhaFicha, personagens, isMestre, updateFicha } = useStore();
    const [secaoAtiva, setSecaoAtiva] = useState('classes');

    // 🔥 ESTADOS DE EDIÇÃO
    const [editandoId, setEditandoId] = useState(null);
    const [tempPassiva, setTempPassiva] = useState('');
    const [tempDesc, setTempDesc] = useState('');

    // 🔥 PROCURA AS EDIÇÕES GLOBAIS (Na ficha do Mestre)
    const overridesCompendio = useMemo(() => {
        if (isMestre && minhaFicha.compendioOverrides) return minhaFicha.compendioOverrides;
        if (personagens) {
            const chaves = Object.keys(personagens);
            for (let k of chaves) {
                if (personagens[k]?.compendioOverrides) return personagens[k].compendioOverrides;
            }
        }
        return {};
    }, [isMestre, minhaFicha.compendioOverrides, personagens]);

    // 🔥 MESCLA AS CLASSES BASE COM AS EDIÇÕES DO MESTRE
    const mesclarComOverrides = (classesBase) => {
        return classesBase.map(cls => {
            const custom = overridesCompendio[cls.id];
            if (custom) {
                return { ...cls, passiva: custom.passiva || cls.passiva, desc: custom.desc || cls.desc };
            }
            return cls;
        });
    };

    const regulares = mesclarComOverrides(CLASSES_REGULARES_BASE);
    const extras = mesclarComOverrides(CLASSES_EXTRA_BASE);

    // 🔥 FUNÇÕES DE EDIÇÃO (APENAS MESTRE)
    const iniciarEdicao = (classe) => {
        setEditandoId(classe.id);
        setTempPassiva(classe.passiva);
        setTempDesc(classe.desc);
    };

    const salvarEdicao = (id) => {
        updateFicha(f => {
            if (!f.compendioOverrides) f.compendioOverrides = {};
            f.compendioOverrides[id] = {
                passiva: tempPassiva,
                desc: tempDesc
            };
        });
        salvarFichaSilencioso();
        setEditandoId(null);
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: '📜 O Mestre reescreveu os registos do Compêndio!' });
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
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
                        <div style={{ fontSize: '2em', background: `${classe.cor}20`, padding: '10px', borderRadius: '50%', border: `1px solid ${classe.cor}` }}>
                            {classe.icone}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: classe.cor, letterSpacing: '1px', textShadow: `0 0 5px ${classe.cor}80` }}>
                                {classe.nome.toUpperCase()}
                            </h3>
                            <div style={{ color: '#aaa', fontSize: '0.9em', fontStyle: 'italic' }}>{classe.titulo}</div>
                        </div>
                    </div>
                    
                    {isMestre && !isEditando && (
                        <button className="btn-neon btn-gold btn-small" onClick={() => iniciarEdicao(classe)} style={{ padding: '2px 8px', fontSize: '0.7em', margin: 0 }}>
                            ✏️ Editar
                        </button>
                    )}
                </div>

                {isEditando ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.8em', color: '#ffcc00' }}>Habilidade de Classe:</label>
                            <input 
                                type="text" className="input-neon" value={tempPassiva} onChange={(e) => setTempPassiva(e.target.value)}
                                style={{ width: '100%', padding: '5px', borderColor: '#ffcc00', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8em', color: '#aaa' }}>Descrição / Efeitos:</label>
                            <textarea 
                                className="input-neon" value={tempDesc} onChange={(e) => setTempDesc(e.target.value)}
                                style={{ width: '100%', padding: '5px', minHeight: '80px', borderColor: '#444', color: '#ccc' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                            <button className="btn-neon btn-red btn-small" onClick={cancelarEdicao} style={{ margin: 0 }}>Cancelar</button>
                            <button className="btn-neon btn-green btn-small" onClick={() => salvarEdicao(classe.id)} style={{ margin: 0 }}>💾 Guardar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', borderLeft: `2px solid #fff` }}>
                            <strong style={{ color: '#fff', fontSize: '0.85em', textTransform: 'uppercase' }}>Habilidade de Classe: </strong> 
                            <span style={{ color: '#ffcc00', fontSize: '0.9em' }}>{classe.passiva}</span>
                        </div>
                        <p style={{ margin: 0, color: '#ccc', fontSize: '0.9em', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                            {classe.desc}
                        </p>
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', gap: '20px', minHeight: '70vh', alignItems: 'flex-start' }}>
            
            <div style={{ flex: '0 0 220px', background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '8px', border: '1px solid #00ffcc', boxShadow: '0 0 15px rgba(0, 255, 204, 0.1)' }}>
                <h3 style={{ color: '#00ffcc', marginTop: 0, textAlign: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '15px', letterSpacing: '2px' }}>
                    📖 GRIMÓRIO
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <button className={`btn-neon ${secaoAtiva === 'classes' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('classes')} style={{ textAlign: 'left', paddingLeft: '15px' }}>
                        🛡️ Classes
                    </button>
                    <button className={`btn-neon ${secaoAtiva === 'condicoes' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('condicoes')} style={{ textAlign: 'left', paddingLeft: '15px' }}>
                        🩸 Condições
                    </button>
                    <button className={`btn-neon ${secaoAtiva === 'danos' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('danos')} style={{ textAlign: 'left', paddingLeft: '15px' }}>
                        ⚔️ Tipos de Dano
                    </button>
                    <button className={`btn-neon ${secaoAtiva === 'regras' ? 'btn-gold' : ''}`} onClick={() => setSecaoAtiva('regras')} style={{ textAlign: 'left', paddingLeft: '15px' }}>
                        📜 Regras da Casa
                    </button>
                </div>
            </div>

            <div style={{ flex: '1', background: 'rgba(20, 20, 30, 0.8)', padding: '30px', borderRadius: '8px', border: '1px solid #444', height: '70vh', overflowY: 'auto' }}>
                
                {secaoAtiva === 'classes' && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #ffcc00', paddingBottom: '10px', marginBottom: '30px' }}>
                            <h2 style={{ color: '#ffcc00', margin: 0, textShadow: '0 0 10px #ffcc00' }}>
                                🛡️ O Trono dos Heróis: Classes
                            </h2>
                            {isMestre && <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8em' }}>Modo de Edição de Mestre Ativo 👑</span>}
                        </div>
                        
                        <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '30px' }}>
                            O recipiente que molda o Espírito. A classe de um guerreiro define o seu papel no campo de batalha, as suas resistências inatas e o estilo da sua feitiçaria. 
                        </p>

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
                
                {secaoAtiva === 'condicoes' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#ff003c', marginTop: 0, borderBottom: '1px solid #ff003c', paddingBottom: '10px' }}>🩸 Condições de Status</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>A Forja aguarda as regras das suas condições.</p>
                    </div>
                )}
                {secaoAtiva === 'danos' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#0088ff', marginTop: 0, borderBottom: '1px solid #0088ff', paddingBottom: '10px' }}>⚔️ Elementos e Tipos de Dano</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>A Forja aguarda a definição das mecânicas elementais.</p>
                    </div>
                )}
                {secaoAtiva === 'regras' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#00ff88', marginTop: 0, borderBottom: '1px solid #00ff88', paddingBottom: '10px' }}>📜 Leis da Guilda (Regras da Casa)</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>A Forja aguarda os decretos do Mestre.</p>
                    </div>
                )}

            </div>
        </div>
    );
}