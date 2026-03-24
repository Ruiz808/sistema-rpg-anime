import React, { useEffect, useState } from 'react'
import useStore, { sanitizarNome } from './stores/useStore'
import useFirebase from './hooks/useFirebase'
import Sidebar from './components/layout/Sidebar'
import TabPanel from './components/layout/TabPanel'
import StatusPanel from './components/status/StatusPanel'
import PerfilPanel from './components/perfil/PerfilPanel'
import ModalConfirm from './components/perfil/ModalConfirm'
import FichaPanel from './components/ficha/FichaPanel'
import AtaquePanel from './components/combate/AtaquePanel'
import AcertoPanel from './components/combate/AcertoPanel'
import DefesaPanel from './components/combate/DefesaPanel'
import PoderesPanel from './components/poderes/PoderesPanel'
import ArsenalPanel from './components/arsenal/ArsenalPanel'
import ElementosPanel from './components/arsenal/ElementosPanel'
import FeedCombate from './components/feed/FeedCombate'
import MapaPanel from './components/mapa/MapaPanel'
import Jukebox from './components/jukebox/Jukebox'
import CompendioPanel from './components/compendio/CompendioPanel'

// 🔥 NOVO: Listener de Dummies importado
import { carregarFichaDoFirebase, iniciarListenerDummies } from './services/firebase-sync'

function MestrePanel() {
    const personagens = useStore(s => s.personagens)
    const meuNome = useStore(s => s.meuNome)
    const setPersonagemParaDeletar = useStore(s => s.setPersonagemParaDeletar)
    const nomes = Object.keys(personagens || {})

    return (
        <div>
            <h2 style={{ color: '#ffcc00' }}>Painel do Mestre</h2>
            <div className="char-list">
                {nomes.length === 0 ? (
                    <p style={{ color: '#888' }}>Nenhum personagem salvo.</p>
                ) : nomes.map(nome => (
                    <div className="char-card" key={nome}>
                        <div className="char-name">
                            {nome}
                            {nome === meuNome && <span style={{ color: '#0f0', fontSize: '0.6em' }}> (ATUAL)</span>}
                        </div>
                        <div className="char-actions">
                            <button className="btn-neon btn-red btn-small" onClick={() => setPersonagemParaDeletar(nome)}>
                                Apagar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function App() {
    const meuNome = useStore(s => s.meuNome)
    const setMeuNome = useStore(s => s.setMeuNome)
    const carregarDadosFicha = useStore(s => s.carregarDadosFicha)
    const abaAtiva = useStore(s => s.abaAtiva)
    const setDummies = useStore(s => s.setDummies) // 🔥 NOVO: Estado dos Dummies
    const [pronto, setPronto] = useState(false)

    useEffect(() => {
        let nomeLocal = localStorage.getItem('rpgNome')
        if (!nomeLocal) nomeLocal = localStorage.getItem('rpg_nome')
        if (nomeLocal) {
            const nomeSanitizado = sanitizarNome(nomeLocal)
            setMeuNome(nomeSanitizado)
            try {
                const backup = localStorage.getItem('rpgFicha_' + nomeSanitizado)
                if (backup) carregarDadosFicha(JSON.parse(backup))
            } catch (e) { console.warn('Falha:', e) }
            setPronto(true)
        }
    }, [setMeuNome, carregarDadosFicha])

    // 🔥 NOVO: Escuta o Firebase para os Dummies
    useEffect(() => {
        const unsubDummies = iniciarListenerDummies((dados) => {
            setDummies(dados || {})
        })
        return () => {
            if (unsubDummies) unsubDummies()
        }
    }, [setDummies])

    const { loading } = useFirebase()

    const handleNameSubmit = async (e) => {
        e.preventDefault()
        const input = e.target.elements.nomeInput.value.trim()
        if (!input) return
        const nomeSanitizado = sanitizarNome(input)
        if (!nomeSanitizado) return
        localStorage.setItem('rpgNome', nomeSanitizado)
        setMeuNome(nomeSanitizado)
        setPronto(true)
        try {
            const dados = await carregarFichaDoFirebase(nomeSanitizado)
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados)
        } catch (e) { console.warn('Falha:', e) }
    }

    if (!pronto && !meuNome) {
        return (
            <div className="modal-overlay" style={{ display: 'flex' }}>
                <form className="modal-box" onSubmit={handleNameSubmit}>
                    <h2 style={{ color: '#0ff', marginTop: 0 }}>Bem-vindo ao RPG</h2>
                    <p style={{ color: '#fff' }}>Digite o nome do seu personagem:</p>
                    <input name="nomeInput" type="text" autoFocus placeholder="Nome do personagem" maxLength={50} />
                    <button type="submit" className="btn-neon" style={{ marginTop: 15 }}>Entrar</button>
                </form>
            </div>
        )
    }

    const isMapMode = abaAtiva === 'aba-mapa'

    return (
        <div className="app-layout">
            <Sidebar />
            <div className={`main-content${isMapMode ? ' modo-mapa' : ''}`}>
                {!isMapMode && <h1 className="title">RPG Anime System</h1>}
                <TabPanel id="aba-perfil"><PerfilPanel /></TabPanel>
                <TabPanel id="aba-mestre"><MestrePanel /></TabPanel>
                <TabPanel id="aba-status"><StatusPanel /></TabPanel>
                <TabPanel id="aba-ataque"><AtaquePanel /></TabPanel>
                <TabPanel id="aba-acerto"><AcertoPanel /></TabPanel>
                <TabPanel id="aba-defesa"><DefesaPanel /></TabPanel>
                <TabPanel id="aba-ficha"><FichaPanel /></TabPanel>
                <TabPanel id="aba-poderes"><PoderesPanel /></TabPanel>
                <TabPanel id="aba-arsenal"><ArsenalPanel /></TabPanel>
                <TabPanel id="aba-elementos"><ElementosPanel /></TabPanel>
                <TabPanel id="aba-log"><FeedCombate /></TabPanel>
                <TabPanel id="aba-mapa"><MapaPanel /></TabPanel>
                <TabPanel id="aba-musica"><Jukebox /></TabPanel>
                <TabPanel id="aba-compendio"><CompendioPanel /></TabPanel>
            </div>
            <ModalConfirm />
        </div>
    )
}