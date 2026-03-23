import React from 'react';
import useStore from '../../stores/useStore';
import { salvarDummie, deletarDummie } from '../../services/firebase-sync';

export default function DummieToken({ id, dummie }) {
    const { isMestre, alvoSelecionado, setAlvoSelecionado } = useStore();

    const isTarget = alvoSelecionado === id;
    const isDead = dummie.hpAtual <= 0;
    
    // 🔥 Lógica de Visibilidade: Visível se for para todos OU se quem está a olhar é o Mestre
    const hpVisivel = dummie.visibilidadeHp === 'todos' || isMestre;

    const handleSelecionar = (e) => {
        e.stopPropagation();
        setAlvoSelecionado(isTarget ? null : id);
    };

    const resetarVida = (e) => {
        e.stopPropagation();
        salvarDummie(id, { ...dummie, hpAtual: dummie.hpMax });
    };

    const removerDummie = (e) => {
        e.stopPropagation();
        if (window.confirm('Remover esta Entidade do mapa?')) {
            if (alvoSelecionado === id) setAlvoSelecionado(null);
            deletarDummie(id);
        }
    };

    const pct = Math.max(0, Math.min(100, (dummie.hpAtual / dummie.hpMax) * 100));
    const colorAC = dummie.tipoDefesa === 'evasiva' ? '#0088ff' : '#ccc';

    return (
        <div 
            onClick={handleSelecionar}
            title={isTarget ? 'Desmarcar Alvo' : 'Selecionar como Alvo'}
            style={{
                position: 'absolute', top: 2, left: 2, right: 2, bottom: 2,
                backgroundColor: isDead ? 'rgba(50, 0, 0, 0.95)' : 'rgba(20, 20, 20, 0.95)',
                border: isTarget ? '3px solid #ff003c' : '2px solid #ffcc00',
                borderRadius: '8px', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'space-between',
                padding: '2px', cursor: 'crosshair', zIndex: isTarget ? 20 : 5,
                boxShadow: isTarget ? '0 0 15px rgba(255, 0, 60, 0.8)' : '0 0 5px #000',
                transition: 'all 0.2s',
                opacity: isDead ? 0.7 : 1
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.6em', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textDecoration: isDead ? 'line-through' : 'none' }}>
                    {dummie.nome}
                </span>
                <span style={{ fontSize: '0.7em', color: colorAC, fontWeight: 'bold', background: 'rgba(0,0,0,0.6)', padding: '0 4px', borderRadius: 4, marginTop: 1 }}>
                    🛡️ {dummie.valorDefesa}
                </span>
            </div>

            {/* 🔥 Barra de HP com Ocultação */}
            {hpVisivel ? (
                <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden', marginTop: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 50 ? '#0f0' : pct > 20 ? '#ffcc00' : '#f00', transition: 'width 0.3s' }} />
                </div>
            ) : (
                <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden', marginTop: 2, border: '1px solid #555' }} title="HP Oculto (Apenas o Mestre vê)">
                    <div style={{ height: '100%', width: '100%', background: 'repeating-linear-gradient(45deg, #444, #444 5px, #222 5px, #222 10px)' }} />
                </div>
            )}
            
            {/* 🔥 Controles Dinâmicos */}
            {(isMestre && isTarget) ? (
                <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: '-25px', background: '#000', padding: 2, borderRadius: 4, border: '1px solid #ffcc00' }}>
                    <button onClick={resetarVida} style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: 2, fontSize: '10px', cursor: 'pointer', padding: '2px 5px', fontWeight: 'bold' }}>🔄 HP</button>
                    <button onClick={removerDummie} style={{ background: '#ff003c', color: '#fff', border: 'none', borderRadius: 2, fontSize: '10px', cursor: 'pointer', padding: '2px 5px' }}>🗑️</button>
                </div>
            ) : (isDead && isTarget) ? (
                <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: '-25px', background: '#000', padding: 2, borderRadius: 4, border: '1px solid #00ffcc' }}>
                    <button onClick={resetarVida} style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: 2, fontSize: '10px', cursor: 'pointer', padding: '2px 5px', fontWeight: 'bold' }}>🔄 RESSUSCITAR</button>
                </div>
            ) : null}
        </div>
    );
}