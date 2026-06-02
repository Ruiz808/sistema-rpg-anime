import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';

const tabs = [
    { id: 'aba-perfil',     emoji: '\u{1F464}', label: 'Sessão' },
    { id: 'aba-mestre',     emoji: '\u{1F451}', label: 'Painel do Mestre', mestreOnly: true },
    { id: 'aba-status',     emoji: '\u2764\uFE0F', label: 'Monitor Vital' },
    { id: 'aba-testes',     emoji: '🎲', label: 'Testes e Saves' }, 
    { id: 'aba-ataque',     emoji: '\u2694\uFE0F', label: 'Rolar Dano' },
    { id: 'aba-acerto',     emoji: '\u{1F3AF}', label: 'Rolar Acerto' },
    { id: 'aba-defesa',     emoji: '\u{1F6E1}\uFE0F', label: 'Ações Defensivas' },
    { id: 'aba-ficha',      emoji: '\u{1F4CB}', label: 'Ficha do Personagem' },
    { id: 'aba-poderes',    emoji: '\u{1F300}', label: 'Habilidades/Poderes' },
    { id: 'aba-arsenal',    emoji: '\u{1F5E1}\uFE0F', label: 'Arsenal' },
    { id: 'aba-elementos',  emoji: '\u{1F525}', label: 'Grimório Elemental' },
    { id: 'aba-log',        emoji: '\u{1F4DC}', label: 'Feed de Combate' },
    { id: 'aba-mapa',       emoji: '\u{1F5FA}\uFE0F', label: 'Mapa de Combate' },
    { id: 'aba-musica',     emoji: '🎵', label: 'Mesa de Som' },
    { id: 'aba-oraculo',    emoji: '🤖', label: 'Sexta-Feira (IA)' }
];

export default function Sidebar({ className }) {
    const abaAtiva = useStore((s) => s.abaAtiva);
    const setAbaAtiva = useStore((s) => s.setAbaAtiva);
    const isMestre = useStore((s) => s.isMestre);

    // Motor de Multitemas
    const [tema, setTema] = useState(localStorage.getItem('rpg_tema') || 'theme-cyber');

    const trocarTema = () => {
        const temas = ['theme-cyber', 'theme-blood', 'theme-glass'];
        const indiceAtual = temas.indexOf(tema);
        const proximoTema = temas[(indiceAtual + 1) % temas.length];
        setTema(proximoTema);
        localStorage.setItem('rpg_tema', proximoTema);
    };

    useEffect(() => {
        document.body.className = tema;
    }, [tema]);

    return (
        <nav className={['sidebar', 'sidebar-multitema', className].filter(Boolean).join(' ')}>
            {tabs.map((tab) => {
                if (tab.mestreOnly && !isMestre) return null;

                return (
                    <button
                        key={tab.id}
                        className={`btn-sidebar ${abaAtiva === tab.id ? 'ativo' : ''}`}
                        title={tab.label}
                        onClick={() => setAbaAtiva(tab.id)}
                    >
                        {tab.emoji}
                    </button>
                );
            })}
            <button className="btn-mudar-tema" onClick={trocarTema} title="Alternar Estilo Visual">⚙️</button>
        </nav>
    );
}