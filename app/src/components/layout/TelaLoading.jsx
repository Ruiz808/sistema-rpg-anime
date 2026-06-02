import React from 'react';

export default function TelaLoading({ texto }) {
    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', zIndex: 9999 }}>
            <img src="/loading.gif" alt="Invocando..." style={{ width: '150px', height: '150px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px #00ffcc)', animation: 'pulse 2s infinite' }} onError={(e) => e.target.style.display = 'none'} />
            <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', fontFamily: 'monospace', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', padding: '0 20px' }}>
                {texto}
            </h2>
            <div style={{ width: '250px', height: '4px', background: 'rgba(0,255,204,0.1)', marginTop: '20px', borderRadius: '2px', overflow: 'hidden', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '100%', height: '100%', background: '#00ffcc', boxShadow: '0 0 10px #00ffcc', animation: 'loadingBar 1.5s infinite ease-in-out', transformOrigin: 'left' }} />
            </div>
            <style>{`
                @keyframes loadingBar { 0% { transform: scaleX(0); } 50% { transform: scaleX(1); } 100% { transform: scaleX(0); transform-origin: right; } }
                @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } }
            `}</style>
        </div>
    );
}