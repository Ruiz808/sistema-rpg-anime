import React, { useState, useEffect } from 'react';
import { registrarUsuario, entrarUsuario } from '../../services/firebase-sync';

export default function AuthScreen() {
    const [isRegister, setIsRegister] = useState(false);
    const [nick, setNick] = useState('');
    const [senha, setSenha] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(false);

    const [canInstall, setCanInstall] = useState(!!window.deferredPrompt);
    useEffect(() => {
        const handleReady = () => setCanInstall(true);
        window.addEventListener('pwa-ready', handleReady);
        return () => window.removeEventListener('pwa-ready', handleReady);
    }, []);

    const handleInstallClick = async () => {
        if (!window.deferredPrompt) return;
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            window.deferredPrompt = null;
            setCanInstall(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nick.trim() || !senha.trim()) return alert("Preencha o Nickname e a Senha!");
        if (senha.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

        setLoadingAuth(true);
        try {
            if (isRegister) {
                await registrarUsuario(nick, senha);
                alert('Conta criada com sucesso! Bem-vindo ao Multiverso.');
            } else {
                await entrarUsuario(nick, senha);
            }
        } catch(err) {
            if (err.code === 'auth/email-already-in-use') alert('Este nickname já está em uso! Tente fazer Login em vez de Registrar.');
            else if (err.code === 'auth/invalid-credential') alert('Nickname ou senha incorretos!');
            else alert('Erro: ' + err.message);
        }
        setLoadingAuth(false);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', backgroundImage: 'radial-gradient(circle, #1a0b2e 0%, #000 100%)', fontFamily: 'sans-serif' }}>
            <div className="def-box fade-in" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(10, 10, 15, 0.95)', border: '2px solid #00ffcc', boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)', borderRadius: '15px' }}>
                <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>Multiverso RPG</h1>
                <p style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '30px' }}>{isRegister ? 'Forje o seu destino no sistema.' : 'Identifique-se para acessar as mesas.'}</p>
                
                {canInstall && (
                    <button type="button" onClick={handleInstallClick} className="btn-neon btn-gold" style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '25px', boxShadow: '0 0 15px rgba(255, 204, 0, 0.5)', animation: 'pulse 2s infinite' }}>
                        📥 INSTALAR APLICATIVO (NAVEGADOR)
                    </button>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="input-neon" type="text" placeholder="Seu Nickname Único" value={nick} onChange={e => setNick(e.target.value)} style={{ padding: '15px', fontSize: '1.1em', textAlign: 'center', textTransform: 'uppercase' }} />
                    <input className="input-neon" type="password" placeholder="Sua Senha Mestra" value={senha} onChange={e => setSenha(e.target.value)} style={{ padding: '15px', fontSize: '1.1em', textAlign: 'center' }} />
                    <button type="submit" disabled={loadingAuth} className="btn-neon btn-green" style={{ width: '100%', padding: '15px', fontSize: '1.2em', fontWeight: 'bold', marginTop: '10px' }}>
                        {loadingAuth ? 'Aguarde...' : (isRegister ? '📝 REGISTRAR CONTA' : '🚪 ENTRAR')}
                    </button>
                </form>
                <div style={{ marginTop: '25px' }}>
                    <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#00aaff', cursor: 'pointer', textDecoration: 'underline' }}>
                        {isRegister ? 'Já tem uma conta? Faça Login.' : 'Não tem conta? Registre-se aqui.'}
                    </button>
                </div>
            </div>
        </div>
    );
}