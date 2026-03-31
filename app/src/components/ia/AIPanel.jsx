import React, { useState, useRef, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase-config';
import useStore from '../../stores/useStore';

export default function AIPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);

    const [mensagem, setMensagem] = useState('');
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [historico]);

    const montarContextoFicha = useCallback(() => {
        const bio = minhaFicha?.bio || {};
        const hierarquia = minhaFicha?.hierarquia || {};

        return {
            nome: meuNome,
            raca: bio.raca || 'Desconhecida',
            classe: bio.classe || 'Desconhecida',
            nivel: minhaFicha?.ascensaoBase || 1,
            hp: minhaFicha?.vida?.atual ?? 0,
            hpMax: minhaFicha?.vida?.base ?? 0,
            mana: minhaFicha?.mana?.atual ?? 0,
            manaMax: minhaFicha?.mana?.base ?? 0,
            forca: minhaFicha?.forca?.base ?? 0,
            destreza: minhaFicha?.destreza?.base ?? 0,
            inteligencia: minhaFicha?.inteligencia?.base ?? 0,
            sabedoria: minhaFicha?.sabedoria?.base ?? 0,
            carisma: minhaFicha?.carisma?.base ?? 0,
            constituicao: minhaFicha?.constituicao?.base ?? 0,
            hierarquia: {
                poder: hierarquia.poder || false,
                poderNome: hierarquia.poderNome || '',
                infinity: hierarquia.infinity || false,
                infinityNome: hierarquia.infinityNome || '',
                singularidade: hierarquia.singularidade || '',
                singularidadeNome: hierarquia.singularidadeNome || ''
            },
            poderes: (minhaFicha?.poderes || []).map(p => p.nome).slice(0, 10),
            inventario: (minhaFicha?.inventario || []).map(i => i.nome).slice(0, 10)
        };
    }, [minhaFicha, meuNome]);

    const enviarMensagem = useCallback(async () => {
        if (!mensagem.trim() || carregando) return;
        if (!functions) {
            setErro('Firebase Functions nao esta disponivel.');
            return;
        }

        const msgUsuario = mensagem.trim();
        setMensagem('');
        setErro('');
        setHistorico(prev => [...prev, { role: 'user', texto: msgUsuario }]);
        setCarregando(true);

        try {
            const chamarIA = httpsCallable(functions, 'falarComSextaFeira');
            const resultado = await chamarIA({
                mensagem: msgUsuario,
                contextoFicha: montarContextoFicha()
            });

            const resposta = resultado.data?.resposta || 'Sem resposta da IA.';
            setHistorico(prev => [...prev, { role: 'ai', texto: resposta }]);
        } catch (err) {
            console.error('[AIPanel] Erro ao chamar IA:', err);
            const msgErro = err.code === 'functions/unavailable'
                ? 'Servico indisponivel. Tente novamente em instantes.'
                : err.code === 'functions/not-found'
                ? 'Cloud Function nao encontrada. Verifique o deploy das functions.'
                : err.message || 'Erro desconhecido ao contactar a IA.';
            setHistorico(prev => [...prev, { role: 'erro', texto: msgErro }]);
        } finally {
            setCarregando(false);
        }
    }, [mensagem, carregando, montarContextoFicha]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    }, [enviarMensagem]);

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
            <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', borderBottom: '2px solid #00ffcc', paddingBottom: 10, margin: 0 }}>
                Sexta-Feira (IA)
            </h2>

            <div
                ref={chatRef}
                className="def-box"
                style={{
                    flex: 1,
                    minHeight: '300px',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '15px'
                }}
            >
                {historico.length === 0 && (
                    <div style={{ color: '#555', textAlign: 'center', fontStyle: 'italic', marginTop: '40px' }}>
                        Envie uma mensagem para a Sexta-Feira. Ela conhece a sua ficha e pode ajudar com estrategias, lore e duvidas do sistema.
                    </div>
                )}

                {historico.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: msg.role === 'user'
                                ? 'rgba(0, 255, 204, 0.15)'
                                : msg.role === 'erro'
                                ? 'rgba(255, 0, 60, 0.15)'
                                : 'rgba(0, 136, 255, 0.15)',
                            border: `1px solid ${
                                msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff'
                            }`,
                            color: '#ddd',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.95em',
                            lineHeight: '1.5'
                        }}
                    >
                        <div style={{
                            fontSize: '0.7em',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            color: msg.role === 'user' ? '#00ffcc' : msg.role === 'erro' ? '#ff003c' : '#0088ff'
                        }}>
                            {msg.role === 'user' ? meuNome?.toUpperCase() || 'VOCE' : msg.role === 'erro' ? 'ERRO' : 'SEXTA-FEIRA'}
                        </div>
                        {msg.texto}
                    </div>
                ))}

                {carregando && (
                    <div style={{
                        alignSelf: 'flex-start',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 136, 255, 0.1)',
                        border: '1px solid #0088ff',
                        color: '#0088ff',
                        fontStyle: 'italic',
                        fontSize: '0.9em'
                    }}>
                        Sexta-Feira esta pensando...
                    </div>
                )}
            </div>

            {erro && (
                <div style={{ color: '#ff003c', fontSize: '0.85em', padding: '5px 10px', background: 'rgba(255,0,60,0.1)', borderRadius: '4px' }}>
                    {erro}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
                <textarea
                    className="input-neon"
                    placeholder="Fale com a Sexta-Feira..."
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={carregando}
                    style={{
                        flex: 1,
                        minHeight: '50px',
                        maxHeight: '120px',
                        resize: 'vertical',
                        borderColor: '#00ffcc',
                        color: '#fff'
                    }}
                />
                <button
                    className="btn-neon"
                    onClick={enviarMensagem}
                    disabled={carregando || !mensagem.trim()}
                    style={{
                        padding: '10px 20px',
                        borderColor: '#00ffcc',
                        color: '#00ffcc',
                        alignSelf: 'flex-end',
                        opacity: (carregando || !mensagem.trim()) ? 0.4 : 1
                    }}
                >
                    {carregando ? '...' : 'ENVIAR'}
                </button>
            </div>
        </div>
    );
}
