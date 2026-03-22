import React, { useState } from 'react';

export default function CompendioPanel() {
    const [secaoAtiva, setSecaoAtiva] = useState('classes');

    return (
        <div style={{ display: 'flex', gap: '20px', minHeight: '70vh', alignItems: 'flex-start' }}>
            
            {/* 📚 MENU LATERAL DO COMPÊNDIO */}
            <div style={{ flex: '0 0 220px', background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '8px', border: '1px solid #00ffcc', boxShadow: '0 0 15px rgba(0, 255, 204, 0.1)' }}>
                <h3 style={{ color: '#00ffcc', marginTop: 0, textAlign: 'center', borderBottom: '1px solid #00ffcc', paddingBottom: '15px', letterSpacing: '2px' }}>
                    📖 GRIMÓRIO
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <button 
                        className={`btn-neon ${secaoAtiva === 'classes' ? 'btn-gold' : ''}`} 
                        onClick={() => setSecaoAtiva('classes')}
                        style={{ textAlign: 'left', paddingLeft: '15px' }}
                    >
                        🛡️ Classes
                    </button>
                    <button 
                        className={`btn-neon ${secaoAtiva === 'condicoes' ? 'btn-gold' : ''}`} 
                        onClick={() => setSecaoAtiva('condicoes')}
                        style={{ textAlign: 'left', paddingLeft: '15px' }}
                    >
                        🩸 Condições
                    </button>
                    <button 
                        className={`btn-neon ${secaoAtiva === 'danos' ? 'btn-gold' : ''}`} 
                        onClick={() => setSecaoAtiva('danos')}
                        style={{ textAlign: 'left', paddingLeft: '15px' }}
                    >
                        ⚔️ Tipos de Dano
                    </button>
                    <button 
                        className={`btn-neon ${secaoAtiva === 'regras' ? 'btn-gold' : ''}`} 
                        onClick={() => setSecaoAtiva('regras')}
                        style={{ textAlign: 'left', paddingLeft: '15px' }}
                    >
                        📜 Regras da Casa
                    </button>
                </div>
            </div>

            {/* 📖 CONTEÚDO DINÂMICO DA SEÇÃO SELECIONADA */}
            <div style={{ flex: '1', background: 'rgba(20, 20, 30, 0.8)', padding: '30px', borderRadius: '8px', border: '1px solid #444', minHeight: '100%' }}>
                
                {secaoAtiva === 'classes' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#ffcc00', marginTop: 0, borderBottom: '1px solid #ffcc00', paddingBottom: '10px' }}>🛡️ Caminhos & Vocações</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            A Forja aguarda os seus comandos, Mestre. Aqui detalharemos as Árvores de Habilidades, bônus passivos e evoluções únicas de cada Classe do seu universo.
                        </p>
                        {/* AQUI ENTRARÃO AS CLASSES */}
                    </div>
                )}
                
                {secaoAtiva === 'condicoes' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#ff003c', marginTop: 0, borderBottom: '1px solid #ff003c', paddingBottom: '10px' }}>🩸 Condições de Status</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Consequências mágicas e físicas que afligem os corpos e mentes no campo de batalha.
                        </p>
                    </div>
                )}

                {secaoAtiva === 'danos' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#0088ff', marginTop: 0, borderBottom: '1px solid #0088ff', paddingBottom: '10px' }}>⚔️ Elementos e Tipos de Dano</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Definições de vantagens e fraquezas elementais (ex: Dano Verdadeiro, Fogo, Vazio, Perfurante).
                        </p>
                    </div>
                )}

                {secaoAtiva === 'regras' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#00ff88', marginTop: 0, borderBottom: '1px solid #00ff88', paddingBottom: '10px' }}>📜 Leis da Guilda (Regras da Casa)</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Mecânicas específicas criadas pelo Mestre para esta campanha.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}