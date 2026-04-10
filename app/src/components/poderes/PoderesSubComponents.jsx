import React from 'react';
import { usePoderesForm, SINGULAR } from './PoderesFormContext';
import { ATRIBUTOS_AGRUPADOS, PROPRIEDADE_OPTIONS } from '../../core/efeitos-constants';
import FormasEditor from '../shared/FormasEditor';

const FALLBACK = <div style={{ color: '#888', padding: 10 }}>Poderes provider não encontrado</div>;

export function PoderesSidebar() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { abaAtual, setAbaAtual, cancelarEdicaoPoder } = ctx;

    return (
        <div className="def-box" style={{ flex: '0 0 230px', padding: '15px', position: 'sticky', top: '20px' }}>
            <h3 style={{ color: '#fff', marginTop: 0, textAlign: 'center', marginBottom: '20px', fontSize: '1.1em', letterSpacing: '1px' }}>
                📖 ARQUIVOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button className={`btn-neon ${abaAtual === 'habilidade' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('habilidade'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                    🗡️ HABILIDADES
                </button>
                <button className={`btn-neon ${abaAtual === 'forma' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('forma'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                    🎭 FORMAS
                </button>
                <button className={`btn-neon ${abaAtual === 'poder' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('poder'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                    ✨ PODERES
                </button>
                <button className={`btn-neon ${abaAtual === 'classificacao' ? 'btn-gold' : ''}`} onClick={() => { setAbaAtual('classificacao'); cancelarEdicaoPoder(); }} style={{ padding: '12px 10px', justifyContent: 'flex-start', margin: 0 }}>
                    👑 CLASSIFICAÇÃO
                </button>
            </div>
        </div>
    );
}

export function PoderesClassificacao() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { 
        isMestre, hierarquia, hPoder, hInfinity, hSingularidade,
        hTextos, setHTextos, salvandoClassificacao,
        salvarHierarquia, salvarTextosHierarquia 
    } = ctx;

    let tituloSupremo = 'MUNDANO';
    let corSuprema = '#555';
    let glowSupremo = 'none';
    let nomeHabilidadeDestaque = '';
    let vertenteDestaque = '';

    if (hSingularidade === '0') {
        tituloSupremo = 'SINGULARIDADE GRAU 0 (MARCADO)'; corSuprema = '#ff00ff'; glowSupremo = '0 0 20px rgba(255, 0, 255, 0.8)'; nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '1') {
        tituloSupremo = 'SINGULARIDADE GRAU 1 (NASCIDA)'; corSuprema = '#ff003c'; glowSupremo = '0 0 20px rgba(255, 0, 60, 0.8)'; nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '2') {
        tituloSupremo = 'SINGULARIDADE GRAU 2 (DESENVOLVIDA)'; corSuprema = '#ff8800'; glowSupremo = '0 0 20px rgba(255, 136, 0, 0.8)'; nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hSingularidade === '3') {
        tituloSupremo = 'SINGULARIDADE GRAU 3 (HERDADA)'; corSuprema = '#ffcc00'; glowSupremo = '0 0 20px rgba(255, 204, 0, 0.8)'; nomeHabilidadeDestaque = hTextos.singularidadeNome;
    } else if (hInfinity) {
        tituloSupremo = 'INFINITY (MANIPULAÇÃO ABSOLUTA)'; corSuprema = '#00ccff'; glowSupremo = '0 0 20px rgba(0, 204, 255, 0.8)'; nomeHabilidadeDestaque = hTextos.infinityNome; vertenteDestaque = hTextos.infinityVertente;
    } else if (hPoder) {
        tituloSupremo = 'PODER (RESSONÂNCIA NATURAL)'; corSuprema = '#00ffcc'; glowSupremo = '0 0 20px rgba(0, 255, 204, 0.8)'; nomeHabilidadeDestaque = hTextos.poderNome; vertenteDestaque = hTextos.poderVertente;
    }

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isMestre && (
                <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid #f00', padding: '15px', borderRadius: '5px', color: '#f00', textAlign: 'center', fontWeight: 'bold', textShadow: '0 0 5px #f00' }}>
                    🔒 MODO LEITURA: Apenas o Mestre pode forjar e alterar Domínios Místicos.
                </div>
            )}

            <div className="def-box" style={{ textAlign: 'center', padding: '30px', border: `2px solid ${corSuprema}`, boxShadow: glowSupremo, background: 'rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle, ${corSuprema}30 0%, rgba(0,0,0,0) 70%)`, pointerEvents: 'none' }} />
                <h2 style={{ color: '#fff', fontSize: '1.2em', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>Grau de Calamidade Atual</h2>
                
                <div style={{ fontSize: '2.5em', fontWeight: '900', color: corSuprema, textShadow: glowSupremo, textTransform: 'uppercase', letterSpacing: '3px', position: 'relative', zIndex: 1 }}>
                    {tituloSupremo}
                </div>
                
                {nomeHabilidadeDestaque && (
                    <div style={{ color: '#fff', fontSize: '1.8em', fontWeight: 'bold', fontStyle: 'italic', marginTop: '10px', textShadow: '0 0 10px #000', position: 'relative', zIndex: 1 }}>
                        "{nomeHabilidadeDestaque}"
                    </div>
                )}

                {vertenteDestaque && (
                    <div style={{ display: 'inline-block', marginTop: '12px', padding: '4px 15px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${corSuprema}`, borderRadius: '20px', color: corSuprema, fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative', zIndex: 1 }}>
                        🎯 Vertente: {vertenteDestaque.replace('_', ' ')}
                    </div>
                )}

                <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '15px', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                    O sistema rastreia as suas capacidades e irradia a anomalia mais forte que corre nas suas veias.
                </p>
            </div>

            <div className="def-box" style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: isMestre ? 1 : 0.8 }}>
                <h3 style={{ color: '#0ff', margin: 0, borderBottom: '1px solid rgba(0,255,255,0.3)', paddingBottom: '10px' }}>Domínios Místicos</h3>

                <div style={{ padding: '15px', background: hPoder ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hPoder ? '#00ffcc' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                        <input type="checkbox" checked={hPoder} onChange={e => salvarHierarquia(e.target.checked, hInfinity, hSingularidade)} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                        <div>
                            <div style={{ color: hPoder ? '#00ffcc' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hPoder ? '0 0 10px #00ffcc' : 'none' }}>✨ Categoria 1: Poder</div>
                            <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>Ressonância Natural. Habilidade inata que usa as 3 energias (Mana, Aura e Chakra) para escalar o seu impacto, mas <strong>não gasta nenhuma (Custo Zero)</strong>.</div>
                        </div>
                    </label>
                    
                    {hPoder && (
                        <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(0, 255, 204, 0.3)' }}>
                            <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Vertente do Poder:</label>
                            
                            {/* 🔥 DROPDOWN UNIFICADO 1 🔥 */}
                            <select
                                className="input-neon"
                                value={hTextos.poderVertente}
                                onChange={e => setHTextos({...hTextos, poderVertente: e.target.value})}
                                disabled={!isMestre}
                                style={{ width: '100%', marginBottom: '10px', borderColor: '#00ffcc', color: '#fff', opacity: isMestre ? 1 : 0.7 }}
                            >
                                <option value="">Selecione a Vertente...</option>
                                <option value="acumulativo">📈 Acumulativo (Escala em combate e armazena permanentemente)</option>
                                <option value="elemental">🌪️ Elemental (Domínio absoluto de forças e natureza)</option>
                                <option value="conceitual">🧩 Conceitual (Quebra de regras absolutas e espaço/tempo)</option>
                                <option value="utilitario">🛠️ Utilitário (Hackers da realidade, Mimetismo, Anulação)</option>
                            </select>

                            <input className="input-neon" type="text" placeholder="Nome do seu Poder (Ex: Chamas do Purgatório)" value={hTextos.poderNome} onChange={e => setHTextos({...hTextos, poderNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#00ffcc', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                            <textarea className="input-neon" placeholder="Descreva como a ressonância da sua habilidade se manifesta na realidade..." value={hTextos.poderDesc} onChange={e => setHTextos({...hTextos, poderDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#00ffcc', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                        </div>
                    )}
                </div>

                <div style={{ padding: '15px', background: hInfinity ? 'rgba(0, 204, 255, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hInfinity ? '#00ccff' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                        <input type="checkbox" checked={hInfinity} onChange={e => salvarHierarquia(hPoder, e.target.checked, hSingularidade)} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                        <div>
                            <div style={{ color: hInfinity ? '#00ccff' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hInfinity ? '0 0 10px #00ccff' : 'none' }}>🌌 Categoria 2: Infinity</div>
                            <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>
                                Manipulação Absoluta. Controle infinito e conceitual de uma habilidade, seja ela uma força física (Gelo Absoluto) ou abstrata (Adaptação). <strong style={{color: '#00ccff'}}>⚠️ Permite Cópia (Mimetismo).</strong>
                            </div>
                        </div>
                    </label>

                    {hInfinity && (
                        <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(0, 204, 255, 0.3)' }}>
                            <label style={{ color: '#00ccff', fontSize: '0.85em', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Vertente do Infinity:</label>
                            
                            {/* 🔥 DROPDOWN UNIFICADO 2 🔥 */}
                            <select
                                className="input-neon"
                                value={hTextos.infinityVertente}
                                onChange={e => setHTextos({...hTextos, infinityVertente: e.target.value})}
                                disabled={!isMestre}
                                style={{ width: '100%', marginBottom: '10px', borderColor: '#00ccff', color: '#fff', opacity: isMestre ? 1 : 0.7 }}
                            >
                                <option value="">Selecione a Vertente...</option>
                                <option value="acumulativo">📈 Acumulativo (Escala em combate e armazena permanentemente)</option>
                                <option value="elemental">🌪️ Elemental (Domínio absoluto de forças e natureza)</option>
                                <option value="conceitual">🧩 Conceitual (Quebra de regras absolutas e espaço/tempo)</option>
                                <option value="utilitario">🛠️ Utilitário (Hackers da realidade, Mimetismo, Anulação)</option>
                            </select>

                            <input className="input-neon" type="text" placeholder="Nome do seu Infinity (Ex: Frio Zero Absoluto)" value={hTextos.infinityNome} onChange={e => setHTextos({...hTextos, infinityNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#00ccff', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                            <textarea className="input-neon" placeholder="Descreva as leis conceituais e limites dessa manipulação infinita..." value={hTextos.infinityDesc} onChange={e => setHTextos({...hTextos, infinityDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#00ccff', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: hSingularidade ? 'rgba(255, 0, 255, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hSingularidade ? '#ff00ff' : '#333'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: isMestre ? 'pointer' : 'not-allowed' }}>
                        <input type="checkbox" checked={!!hSingularidade} onChange={e => { const val = e.target.checked ? '3' : ''; salvarHierarquia(hPoder, hInfinity, val); }} disabled={!isMestre} style={{ transform: 'scale(1.5)', marginLeft: '5px', cursor: isMestre ? 'pointer' : 'not-allowed' }} />
                        <div>
                            <div style={{ color: hSingularidade ? '#ff00ff' : '#fff', fontWeight: 'bold', fontSize: '1.1em', textShadow: hSingularidade ? '0 0 10px #ff00ff' : 'none' }}>👑 Categoria 3: Singularidade</div>
                            <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>
                                A Anomalia Máxima. Uma falha na própria realidade. Existem menos de 200 no multiverso inteiro. <strong style={{color: '#ff00ff'}}>🚫 REGRA ABSOLUTA: Impossível ser copiada por qualquer habilidade de Mimetismo.</strong>
                            </div>
                        </div>
                    </label>

                    {hSingularidade && (
                        <div className="fade-in" style={{ marginTop: '10px', paddingLeft: '45px', borderLeft: '2px solid #ff00ff', marginLeft: '10px' }}>
                            <label style={{ color: '#ffcc00', fontSize: '0.9em', fontWeight: 'bold' }}>Selecione o Grau da sua Singularidade:</label>
                            <select 
                                className="input-neon" 
                                value={hSingularidade} 
                                onChange={e => salvarHierarquia(hPoder, hInfinity, e.target.value)} 
                                disabled={!isMestre}
                                style={{ width: '100%', marginTop: '8px', marginBottom: '15px', borderColor: corSuprema, color: corSuprema, background: '#111', fontSize: '1em', padding: '10px', textShadow: `0 0 5px ${corSuprema}`, opacity: isMestre ? 1 : 0.7, cursor: isMestre ? 'pointer' : 'not-allowed' }}
                            >
                                <option value="3">Grau 3: Herdada (Poder transferido ou roubado)</option>
                                <option value="2">Grau 2: Desenvolvida (Evoluída além do limite de um Poder/Infinity)</option>
                                <option value="1">Grau 1: Nascida (Anomalia inata desde o berço)</option>
                                <option value="0">Grau 0: Marcado Nascido (O próprio Marcado já nasce como Singularidade)</option>
                            </select>

                            <div style={{ paddingTop: '15px', borderTop: '1px dashed rgba(255, 0, 255, 0.3)' }}>
                                <input className="input-neon" type="text" placeholder="Nome da Singularidade (Ex: All For One)" value={hTextos.singularidadeNome} onChange={e => setHTextos({...hTextos, singularidadeNome: e.target.value})} disabled={!isMestre} style={{ width: '100%', marginBottom: '10px', borderColor: '#ff00ff', color: '#fff', fontWeight: 'bold', opacity: isMestre ? 1 : 0.7 }} />
                                <textarea className="input-neon" placeholder="Descreva como essa anomalia cósmica quebra as regras do universo..." value={hTextos.singularidadeDesc} onChange={e => setHTextos({...hTextos, singularidadeDesc: e.target.value})} disabled={!isMestre} style={{ width: '100%', minHeight: '60px', borderColor: '#ff00ff', color: '#ccc', fontStyle: 'italic', opacity: isMestre ? 1 : 0.7 }} />
                            </div>
                        </div>
                    )}
                </div>

                {isMestre && (
                    <button 
                        className="btn-neon btn-gold" 
                        onClick={salvarTextosHierarquia} 
                        style={{ 
                            marginTop: '10px', width: '100%', padding: '12px', fontSize: '1.1em', letterSpacing: '1px',
                            backgroundColor: salvandoClassificacao ? 'rgba(0, 255, 100, 0.2)' : undefined,
                            borderColor: salvandoClassificacao ? '#00ffcc' : undefined,
                            color: salvandoClassificacao ? '#fff' : undefined
                        }}
                    >
                        {salvandoClassificacao ? '💾 REGISTROS MÍSTICOS SALVOS!' : '💾 SALVAR NOMES E DESCRIÇÕES'}
                    </button>
                )}
            </div>
        </div>
    );
}

export function PoderesFormEditor() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { 
        abaAtual, poderEditandoId, nomePoder, setNomePoder,
        poderVertente, setPoderVertente, poderElemento, setPoderElemento,
        imagemUrl, setImagemUrl, uploadingImg, handleImageUpload,
        dadosQtd, setDadosQtd, dadosFaces, setDadosFaces,
        custoPercentual, setCustoPercentual, poderAlcance, setPoderAlcance,
        poderArea, setPoderArea, armaVinculada, setArmaVinculada, minhaFicha,
        descricaoPoder, setDescricaoPoder,
        nomeEfeito, setNomeEfeito, novoAtr, setNovoAtr, novoProp, setNovoProp, novoVal, setNovoVal,
        addEfeitoTemp, efeitosTemp, removerEfeitoTemp,
        nomeEfeitoPassivo, setNomeEfeitoPassivo, novoAtrPassivo, setNovoAtrPassivo,
        novoPropPassivo, setNovoPropPassivo, novoValPassivo, setNovoValPassivo,
        addEfeitoPassivoTemp, efeitosTempPassivos, removerEfeitoPassivoTemp,
        salvarNovoPoder, cancelarEdicaoPoder, formRef
    } = ctx;

    return (
        <div className="def-box" ref={formRef} id="form-poder-box">
            <h3 style={{ color: '#0ff', marginBottom: 10 }}>{poderEditandoId ? `Editando: ${nomePoder}` : `Criar ${SINGULAR[abaAtual]}`}</h3>
            
            <input className="input-neon" type="text" placeholder={`Nome da ${SINGULAR[abaAtual]}`} value={nomePoder} onChange={e => setNomePoder(e.target.value)} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, marginBottom: 5 }}>
                <div>
                    <label style={{ color: '#0ff', fontSize: '0.85em', fontWeight: 'bold' }}>Natureza da Habilidade / Poder</label>
                    
                    {/* 🔥 DROPDOWN UNIFICADO 3 🔥 */}
                    <select className="input-neon" value={poderVertente} onChange={e => setPoderVertente(e.target.value)} style={{ borderColor: '#0ff', color: '#0ff', margin: 0 }}>
                        <option value="">Padrão (Dano / Efeito Direto)</option>
                        <option value="acumulativo">📈 Acumulativo (Requer Marcadores e Forja)</option>
                        <option value="elemental">🌪️ Elemental / Fenomenal (Ressonância Ativa)</option>
                        <option value="conceitual">🧩 Conceitual (Distorção de Regras)</option>
                        <option value="utilitario">🛠️ Utilitário (Cópia / Suporte / Buff)</option>
                    </select>
                </div>
                {(poderVertente || '').toLowerCase().includes('elemental') && (
                    <div className="fade-in">
                        <label style={{ color: '#ff8800', fontSize: '0.85em', fontWeight: 'bold' }}>Elemento / Fenômeno (Ex: Fogo Infinito)</label>
                        <input className="input-neon" type="text" placeholder="Qual o elemento dominado?" value={poderElemento} onChange={e => setPoderElemento(e.target.value)} style={{ borderColor: '#ff8800', color: '#ff8800', margin: 0 }} />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                <input className="input-neon" type="text" placeholder="URL da Imagem (Ou anexe ao lado 👉)" value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} style={{ flex: 1, margin: 0 }} />
                <label className="btn-neon btn-blue" style={{ cursor: 'pointer', padding: '5px 15px', margin: 0, whiteSpace: 'nowrap', opacity: uploadingImg ? 0.5 : 1 }}>
                    {uploadingImg ? 'Enviando...' : '📁 Anexar'}
                    <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Dados de Dano (qtd)</label>
                    <input className="input-neon" type="number" min="0" value={dadosQtd} onChange={e => setDadosQtd(e.target.value)} placeholder="0" />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Faces (d)</label>
                    <input className="input-neon" type="number" min="1" value={dadosFaces} onChange={e => setDadosFaces(e.target.value)} placeholder="20" />
                </div>
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85em' }}>Custo (% Energia)</label>
                    <input className="input-neon" type="number" min="0" value={custoPercentual} onChange={e => setCustoPercentual(e.target.value)} placeholder="0" />
                </div>
            <div>
            <label style={{ color: '#00ffcc', fontSize: '0.85em', fontWeight: 'bold' }}>Alcance (Q)</label>
            <input className="input-neon" type="number" min="0" step="0.5" value={poderAlcance} onChange={e => setPoderAlcance(e.target.value)} style={{ borderColor: '#00ffcc', color: '#00ffcc' }} />
        </div>
        <div>
            <label style={{ color: '#ff00ff', fontSize: '0.85em', fontWeight: 'bold' }}>Área de Efeito (Q)</label>
            <input className="input-neon" type="number" min="0" step="0.5" value={poderArea} onChange={e => setPoderArea(e.target.value)} style={{ borderColor: '#ff00ff', color: '#ff00ff' }} />
        </div>
        <div>
            <label style={{ color: '#aaa', fontSize: '0.85em' }}>Vincular Arma</label>
            <select className="input-neon" value={armaVinculada} onChange={e => setArmaVinculada(e.target.value)}>
                <option value="">Nenhuma (Livre)</option>
                {(minhaFicha?.inventario || []).filter(i => i.tipo === 'arma').map(arma => (
                    <option key={arma.id} value={String(arma.id)}>{arma.nome}</option>
                ))}
                </select>
            </div>
            </div>

            <textarea 
                className="input-neon" 
                placeholder="Descrição / Efeito Narrativo (O que essa habilidade faz visualmente e narrativamente?)" 
                value={descricaoPoder} 
                onChange={e => setDescricaoPoder(e.target.value)} 
                style={{ width: '100%', minHeight: '60px', marginTop: 15, borderColor: '#555', color: '#ccc', fontStyle: 'italic' }} 
            />

            <h4 style={{ color: '#0ff', marginTop: 15, marginBottom: 8, fontSize: '0.95em' }}>Efeitos Matemáticos Ativos</h4>
            <input className="input-neon" type="text" placeholder="Nome do Efeito" value={nomeEfeito} onChange={e => setNomeEfeito(e.target.value)} style={{ marginTop: 5 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 5 }}>
                <select className="input-neon" value={novoAtr} onChange={e => setNovoAtr(e.target.value)}>
                    {ATRIBUTOS_AGRUPADOS.map(grupo => (
                        <optgroup key={grupo.label} label={grupo.label} style={{ background: '#051010', color: '#0ff' }}>
                            {grupo.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                        </optgroup>
                    ))}
                </select>
                <select className="input-neon" value={novoProp} onChange={e => setNovoProp(e.target.value)}>
                    {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
                <input className="input-neon" type="text" placeholder="Valor" value={novoVal} onChange={e => setNovoVal(e.target.value)} />
                <button className="btn-neon btn-blue" onClick={addEfeitoTemp} style={{ padding: '5px 10px' }}>+ Efeito</button>
            </div>

            <div style={{ marginTop: 10 }}>
                {efeitosTemp.map((e, i) => {
                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                    return (
                        <div key={i} style={{ color: '#0ff', fontSize: '0.9em', marginBottom: 5, background: 'rgba(0,255,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #0ff', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                            <button onClick={() => removerEfeitoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                        </div>
                    );
                })}
            </div>

            <h4 style={{ color: '#f0f', marginTop: 15, marginBottom: 8, fontSize: '0.95em' }}>Efeitos Passivos (sempre ativos)</h4>
            <input className="input-neon" type="text" placeholder="Nome do Efeito Passivo (Ex: +10 CA Fogo)" value={nomeEfeitoPassivo} onChange={e => setNomeEfeitoPassivo(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 5 }}>
                <select className="input-neon" value={novoAtrPassivo} onChange={e => setNovoAtrPassivo(e.target.value)}>
                    {ATRIBUTOS_AGRUPADOS.map(grupo => (
                        <optgroup key={grupo.label} label={grupo.label} style={{ background: '#051010', color: '#f0f' }}>
                            {grupo.options.map(a => <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>)}
                        </optgroup>
                    ))}
                </select>
                <select className="input-neon" value={novoPropPassivo} onChange={e => setNovoPropPassivo(e.target.value)}>
                    {PROPRIEDADE_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
                <input className="input-neon" type="text" placeholder="Valor" value={novoValPassivo} onChange={e => setNovoValPassivo(e.target.value)} />
                <button className="btn-neon" style={{ padding: '5px 10px', borderColor: '#f0f', color: '#f0f' }} onClick={addEfeitoPassivoTemp}>+ Passivo</button>
            </div>

            <div style={{ marginTop: 10 }}>
                {efeitosTempPassivos.map((e, i) => {
                    const isMult = ['mbase', 'mgeral', 'mformas', 'mabs', 'munico'].includes((e.propriedade || '').toLowerCase());
                    return (
                        <div key={i} style={{ color: '#f0f', fontSize: '0.9em', marginBottom: 5, background: 'rgba(255,0,255,0.1)', padding: '5px 10px', borderLeft: '2px solid #f0f', display: 'flex', justifyContent: 'space-between' }}>
                            <span>PASSIVO: <strong style={{ color: '#fff' }}>{e.nome || '(Sem nome)'}</strong> [{(e.atributo || '').replace('_', ' ').toUpperCase()}] - [{(e.propriedade || '').toUpperCase()}]: <strong style={{ color: '#ffcc00' }}>{isMult ? '(x)' : '(+)'} {e.valor}</strong></span>
                            <button onClick={() => removerEfeitoPassivoTemp(i)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>X</button>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn-neon btn-gold" onClick={salvarNovoPoder} style={{ flex: 1 }}>{poderEditandoId ? 'Salvar Edição' : `Salvar ${SINGULAR[abaAtual]}`}</button>
                {poderEditandoId && <button className="btn-neon btn-red" onClick={cancelarEdicaoPoder} style={{ flex: 1 }}>Cancelar</button>}
            </div>
        </div>
    );
}

export function PoderesLista() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { 
        abaAtual, itensFiltrados, poderPreparandoId, setPoderPreparandoId,
        setOverchargeAtivo, togglePoder, vincularAberto, setVincularAberto,
        vincularRef, minhaFicha, armasEquipadas, vincularArmaAoPoder,
        editarPoder, deletarPoder, overchargeAtivo, curMana, curAura, curChakra,
        energiaElemental, mPotencial, danoBruto, dispararAtaque,
        salvarFormaPoder, deletarFormaPoder, ativarFormaPoder
    } = ctx;

    return (
        <div id="lista-poderes-salvos">
            {itensFiltrados.length === 0 ? (
                <p style={{ color: '#888' }}>Nenhuma {SINGULAR[abaAtual].toLowerCase()} gravada.</p>
            ) : (
                itensFiltrados.map((p) => {
                    if (!p) return null;
                    const c = p.ativa ? '#0f0' : '#888';
                    const bg = p.ativa ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.4)';
                    const txtArr = (p.efeitos || []).map(e => {
                        if (!e) return '';
                        return `[${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: +${e.valor || 0}`;
                    }).filter(Boolean);
                    
                    const pVertenteLower = (p.vertente || '').toLowerCase();
                    
                    return (
                        <div key={p.id} className="def-box" style={{ borderLeft: `5px solid ${c}`, background: bg, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: c, textShadow: `0 0 10px ${c}` }}>
                                        {p.nome || 'Poder'} 
                                        <span style={{fontSize: '0.6em', color: '#fff'}}> (Alcance: {p.alcance || 1}Q)</span>
                                        {p.vertente && (
                                            <span style={{ marginLeft: '10px', fontSize: '0.55em', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#0ff', border: '1px solid #0ff' }}>
                                                {pVertenteLower.includes('elemental') ? `🌪️ ELEMENTAL: ${p.elemento}` : p.vertente.toUpperCase()}
                                            </span>
                                        )}
                                    </h3>
                                    
                                    {p.descricao && (
                                        <div style={{ color: '#ccc', fontSize: '0.85em', fontStyle: 'italic', margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: `2px solid ${c}` }}>
                                            "{p.descricao}"
                                        </div>
                                    )}

                                    <p style={{ color: '#aaa', fontSize: '0.85em', margin: '5px 0 0' }}>{txtArr.join(' | ') || 'Sem efeitos ativos.'}
                                    {(p.efeitosPassivos || []).length > 0 && (
                                        <span style={{ color: '#f0f', display: 'block', marginTop: '4px' }}>{(p.efeitosPassivos || []).map(e => {
                                            if (!e) return '';
                                            return `PASSIVO: [${(e.atributo || '').replace('_', ' ').toUpperCase()}] ${(e.propriedade || '').toUpperCase()}: +${e.valor || 0}`;
                                        }).filter(Boolean).join(' | ')}</span>
                                    )}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <button 
                                        className={`btn-neon ${poderPreparandoId === p.id ? 'btn-gold' : 'btn-blue'}`} 
                                        style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} 
                                        onClick={() => {
                                            if (poderPreparandoId === p.id) {
                                                setPoderPreparandoId(null);
                                            } else {
                                                setPoderPreparandoId(p.id);
                                                setOverchargeAtivo(false);
                                            }
                                        }}
                                    >
                                        ⚔️ PREPARAR
                                    </button>

                                    <button className="btn-neon" style={{ borderColor: c, color: c, padding: '5px 15px', fontSize: '1.1em', margin: 0 }} onClick={() => togglePoder(p.id)}>{p.ativa ? 'LIGADO' : 'DESLIGADO'}</button>
                                    <div style={{ position: 'relative' }} ref={vincularAberto === p.id ? vincularRef : null}>
                                            <button
                                                className={`btn-neon ${p.armaVinculada ? 'btn-gold' : ''}`}
                                                style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }}
                                                onClick={() => setVincularAberto(vincularAberto === p.id ? null : p.id)}
                                            >
                                                {p.armaVinculada ? `⚔️ ${((minhaFicha?.inventario || []).find(i => String(i.id) === String(p.armaVinculada))?.nome) || 'Arma'}` : '🔗 VINCULAR'}
                                            </button>
                                            {vincularAberto === p.id && (
                                                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10, background: '#0a0a1a', border: '1px solid #0ff', borderRadius: 6, padding: 5, minWidth: 180, marginTop: 4 }}>
                                                    <button
                                                        className="btn-neon"
                                                        style={{ width: '100%', padding: '5px 10px', fontSize: '0.85em', margin: '2px 0', borderColor: !p.armaVinculada ? '#0f0' : '#555', color: !p.armaVinculada ? '#0f0' : '#aaa' }}
                                                        onClick={() => vincularArmaAoPoder(p.id, '')}
                                                    >
                                                        Nenhuma (Livre)
                                                    </button>
                                                    {armasEquipadas.map(arma => (
                                                        <button
                                                            key={arma.id}
                                                            className="btn-neon"
                                                            style={{ width: '100%', padding: '5px 10px', fontSize: '0.85em', margin: '2px 0', borderColor: String(p.armaVinculada) === String(arma.id) ? '#ffcc00' : '#0ff', color: String(p.armaVinculada) === String(arma.id) ? '#ffcc00' : '#0ff' }}
                                                            onClick={() => vincularArmaAoPoder(p.id, String(arma.id))}
                                                        >
                                                            ⚔️ {arma.nome}
                                                        </button>
                                                    ))}
                                                    {armasEquipadas.length === 0 && (
                                                        <p style={{ color: '#888', fontSize: '0.8em', margin: '5px 0', textAlign: 'center' }}>Nenhuma arma equipada</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    <button className="btn-neon btn-blue" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => editarPoder(p.id)}>EDITAR</button>
                                    <button className="btn-neon btn-red" style={{ padding: '5px 15px', fontSize: '1em', margin: 0 }} onClick={() => deletarPoder(p.id)}>APAGAR</button>
                                </div>
                            </div>
                            
                            {poderPreparandoId === p.id && (
                                <div className="fade-in" style={{ width: '100%', marginTop: '15px', background: 'rgba(0, 0, 0, 0.7)', border: '1px solid #0ff', borderRadius: '8px', padding: '15px' }}>
                                    <h4 style={{ color: '#0ff', margin: '0 0 10px 0', textTransform: 'uppercase' }}>⚙️ Central de Disparo: {p.nome}</h4>

                                    {pVertenteLower.includes('elemental') ? (
                                        <div style={{ background: 'rgba(0, 255, 204, 0.1)', borderLeft: '3px solid #00ffcc', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
                                            <p style={{ color: '#00ffcc', margin: '0 0 5px 0', fontWeight: 'bold' }}>🌪️ RESSONÂNCIA ELEMENTAL DETETADA</p>
                                            <p style={{ color: '#aaa', fontSize: '0.85em', margin: 0 }}>
                                                A Força da Natureza funde as suas energias Atuais (<span style={{color:'#0cf'}}>Mana: {curMana}</span> + <span style={{color:'#0cf'}}>Aura: {curAura}</span> + <span style={{color:'#0cf'}}>Chakra: {curChakra}</span>).<br/>
                                                <strong>Poder Bruto Acumulado: +{energiaElemental} de Dano.</strong><br/>
                                                Custo Base: <strong style={{color:'#0f0'}}>ZERO (Gratuito)</strong>.
                                            </p>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer', background: overchargeAtivo ? 'rgba(255,0,60,0.2)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px', border: overchargeAtivo ? '1px solid #ff003c' : '1px solid #444', transition: 'all 0.3s' }}>
                                                <input type="checkbox" checked={overchargeAtivo} onChange={e => setOverchargeAtivo(e.target.checked)} style={{ transform: 'scale(1.3)' }} />
                                                <div>
                                                    <div style={{ color: overchargeAtivo ? '#ff003c' : '#fff', fontWeight: 'bold', textShadow: overchargeAtivo ? '0 0 5px #ff003c' : 'none' }}>🔥 MODO OVERCHARGE (Queimar Motor)</div>
                                                    <div style={{ color: '#aaa', fontSize: '0.8em' }}>
                                                        Dobra o custo da habilidade (pagará <strong>{p.custoPercentual * 2}%</strong> da sua Mana, Aura e Chakra atuais) para aplicar o seu <strong>Multiplicador Potencial (x{mPotencial})</strong> ao Dano Total Estimado!
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ) : pVertenteLower.includes('acumulativo') ? (
                                        <div style={{ background: 'rgba(255, 136, 0, 0.1)', borderLeft: '3px solid #ff8800', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
                                            <p style={{ color: '#ff8800', margin: '0 0 5px 0', fontWeight: 'bold' }}>📈 TÉCNICA ACUMULATIVA DETETADA</p>
                                            <p style={{ color: '#aaa', fontSize: '0.85em', margin: 0 }}>
                                                Use os Marcadores de Cena ou a Forja Pós-Combate (Aba Ficha) para processar os ganhos de atributos desta habilidade.<br/>
                                                Custo Padrão: <strong style={{color: '#f00'}}>{p.custoPercentual}% das Energias</strong>. <br/>
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderLeft: '3px solid #888', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
                                            <p style={{ color: '#fff', margin: '0 0 5px 0', fontWeight: 'bold' }}>🎯 Disparo Padrão</p>
                                            <p style={{ color: '#aaa', fontSize: '0.85em', margin: 0 }}>
                                                Custo: <strong style={{color: '#f00'}}>{p.custoPercentual}% das Energias</strong>. <br/>
                                                Dano Base dos Dados: {p.dadosQtd}d{p.dadosFaces} + Dano Bruto ({danoBruto})
                                            </p>
                                        </div>
                                    )}

                                    <button 
                                        className={`btn-neon ${overchargeAtivo ? 'btn-red' : 'btn-gold'}`} 
                                        style={{ width: '100%', margin: 0, padding: '12px', fontSize: '1.1em', letterSpacing: '1px' }} 
                                        onClick={() => dispararAtaque(p)}
                                    >
                                        {overchargeAtivo ? '💥 DISPARAR OVERCHARGE FATAL!' : '⚔️ EXECUTAR HABILIDADE'}
                                    </button>
                                </div>
                            )}

                            <FormasEditor
                                formas={p.formas || []}
                                formaAtivaId={p.formaAtivaId || null}
                                onSalvarForma={(forma) => salvarFormaPoder(p.id, forma)}
                                onDeletarForma={(formaId) => deletarFormaPoder(p.id, formaId)}
                                onAtivarForma={(formaId) => ativarFormaPoder(p.id, formaId)}
                            />
                        </div>
                    );
                })
            )}
        </div>
    );
}

export function PoderesAuditoria() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { relatorioAuditoria } = ctx;

    return (
        <div className="def-box">
            <h3 style={{ color: '#0ff', marginBottom: 10 }}>Auditoria de Combos Globais (Auto)</h3>
            <div style={{ fontSize: '0.9em' }}>
                {relatorioAuditoria || <span style={{ color: '#888', fontStyle: 'italic' }}>Nenhum efeito passivo ativo computado.</span>}
            </div>
        </div>
    );
}

export function PoderesAreaCentral() {
    const ctx = usePoderesForm();
    if (!ctx) return FALLBACK;
    const { abaAtual } = ctx;

    if (abaAtual === 'classificacao') {
        return <PoderesClassificacao />;
    }

    return (
        <>
            <PoderesFormEditor />
            <PoderesLista />
            <PoderesAuditoria />
        </>
    );
}