import React from 'react';
import useStore from '../../stores/useStore';

const tabs = [
    { id: 'aba-perfil',     emoji: '\u{1F464}', label: 'Sess\u00E3o' },
    { id: 'aba-mestre',     emoji: '\u{1F451}', label: 'Painel do Mestre', mestreOnly: true },
    { id: 'aba-status',     emoji: '\u2764\uFE0F', label: 'Monitor Vital' },
    { id: 'aba-testes',     emoji: '🎲', label: 'Testes e Saves' }, 
    { id: 'aba-ataque',     emoji: '\u2694\uFE0F', label: 'Rolar Dano' },
    { id: 'aba-acerto',     emoji: '\u{1F3AF}', label: 'Rolar Acerto' },
    { id: 'aba-defesa',     emoji: '\u{1F6E1}\uFE0F', label: 'A\u00E7\u00F5es Defensivas' },
    { id: 'aba-ficha',      emoji: '\u{1F4CB}', label: 'Ficha do Personagem' },
    { id: 'aba-poderes',    emoji: '\u{1F300}', label: 'Habilidades/Poderes' },
    { id: 'aba-arsenal',    emoji: '\u{1F5E1}\uFE0F', label: 'Arsenal' },
    { id: 'aba-elementos',  emoji: '\u{1F525}', label: 'Grim\u00F3rio Elemental' },
    { id: 'aba-log',        emoji: '\u{1F4DC}', label: 'Feed de Combate' },
    { id: 'aba-mapa',       emoji: '\u{1F5FA}\uFE0F', label: 'Mapa de Combate' },
    { id: 'aba-compendio',  emoji: '📖', label: 'Compêndio e Regras' },
    { id: 'aba-musica',     emoji: '🎵', label: 'Mesa de Som' },
    // 🔥 A IA PESSOAL DO CHEFE FOI INJETADA AQUI 🔥
    { id: 'aba-oraculo',    emoji: '🤖', label: 'Sexta-Feira (IA)' }
];

export default function Sidebar() {
    const abaAtiva = useStore((s) => s.abaAtiva);
    const setAbaAtiva = useStore((s) => s.setAbaAtiva);
    const isMestre = useStore((s) => s.isMestre);

    return (
        <nav className="sidebar">
            {tabs.map((tab) => {
                if (tab.mestreOnly && !isMestre) {
                    return (
                        <button
                            key={tab.id}
                            className="nav-btn btn-coroa hidden"
                            title={tab.label}
                            onClick={() => setAbaAtiva(tab.id)}
                        >
                            {tab.emoji}
                        </button>
                    );
                }

                return (
                    <button
                        key={tab.id}
                        className={`nav-btn${tab.mestreOnly ? ' btn-coroa' : ''}${abaAtiva === tab.id ? ' ativo' : ''}`}
                        title={tab.label}
                        onClick={() => setAbaAtiva(tab.id)}
                    >
                        {tab.emoji}
                    </button>
                );
            })}
        </nav>
    );
}