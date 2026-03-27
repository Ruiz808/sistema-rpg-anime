import React, { useEffect } from 'react'
import useStore from './stores/useStore'
import { setModoPlasmic } from './services/firebase-sync'

function StoreInitializer({ children }) {
  useEffect(() => {
    setModoPlasmic(true)
    const { setMeuNome, updateFicha, meuNome } = useStore.getState()
    if (!meuNome) {
      setMeuNome('Heroi_Preview')
      updateFicha((ficha) => {
        ficha.bio = { ...ficha.bio, raca: 'Humano', classe: 'Saber', idade: '20', fisico: 'Atlético', alinhamento: 'Neutro', afiliacao: 'Nenhuma', dinheiro: '1000' }
        ficha.vida = { ...ficha.vida, atual: 80 }
        ficha.mana = { ...ficha.mana, atual: 50 }
        ficha.aura = { ...ficha.aura, atual: 30 }
        ficha.chakra = { ...ficha.chakra, atual: 40 }
        ficha.corpo = { ...ficha.corpo, atual: 60 }
      })
    }
    return () => setModoPlasmic(false)
  }, [])
  return <>{children}</>
}

function criarWrapper(importFn) {
  const LazyComp = React.lazy(importFn)
  return function PlasmicWrapper(props) {
    return (
      <StoreInitializer>
        <React.Suspense fallback={<div className="glass-panel ativo" style={{ padding: '1rem' }}>Carregando...</div>}>
          <LazyComp {...props} />
        </React.Suspense>
      </StoreInitializer>
    )
  }
}

// --- Painéis completos ---
export const PlasmicStatusPanel = criarWrapper(() => import('./components/status/StatusPanel'))
export const PlasmicFichaPanel = criarWrapper(() => import('./components/ficha/FichaPanel'))
export const PlasmicAtaquePanel = criarWrapper(() => import('./components/combate/AtaquePanel'))
export const PlasmicAcertoPanel = criarWrapper(() => import('./components/combate/AcertoPanel'))
export const PlasmicDefesaPanel = criarWrapper(() => import('./components/combate/DefesaPanel'))
export const PlasmicTestesPanel = criarWrapper(() => import('./components/combate/TestesPanel'))
export const PlasmicPoderesPanel = criarWrapper(() => import('./components/poderes/PoderesPanel'))
export const PlasmicArsenalPanel = criarWrapper(() => import('./components/arsenal/ArsenalPanel'))
export const PlasmicElementosPanel = criarWrapper(() => import('./components/arsenal/ElementosPanel'))
export const PlasmicFeedCombate = criarWrapper(() => import('./components/feed/FeedCombate'))
export const PlasmicMapaPanel = criarWrapper(() => import('./components/mapa/MapaPanel'))
export const PlasmicPerfilPanel = criarWrapper(() => import('./components/perfil/PerfilPanel'))
export const PlasmicModalConfirm = criarWrapper(() => import('./components/perfil/ModalConfirm'))
export const PlasmicCompendioPanel = criarWrapper(() => import('./components/compendio/CompendioPanel'))
export const PlasmicNarrativaPanel = criarWrapper(() => import('./components/narrativa/NarrativaPanel'))
export const PlasmicJukebox = criarWrapper(() => import('./components/jukebox/Jukebox'))
export const PlasmicSidebar = criarWrapper(() => import('./components/layout/Sidebar'))
export const PlasmicMestrePanel = criarWrapper(() => import('./components/mestre/MestrePanel'))
export const PlasmicTabelaPrestigio = criarWrapper(() => import('./components/ficha/TabelaPrestigio'))

// --- Sub-componentes granulares (exportados de StatusPanel) ---
// RadarChart e AtributosLista precisam de ficha como prop — injetamos do store
export function PlasmicRadarChart({ isAtual = false, ...props }) {
  const LazyRadarChart = React.lazy(() =>
    import('./components/status/StatusPanel').then(m => ({ default: m.RadarChart }))
  )
  const ficha = useStore(s => s.minhaFicha)
  return (
    <StoreInitializer>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <LazyRadarChart ficha={ficha} isAtual={isAtual} {...props} />
      </React.Suspense>
    </StoreInitializer>
  )
}

export function PlasmicAtributosLista({ isAtual = false, ...props }) {
  const LazyAtributosLista = React.lazy(() =>
    import('./components/status/StatusPanel').then(m => ({ default: m.AtributosLista }))
  )
  const ficha = useStore(s => s.minhaFicha)
  return (
    <StoreInitializer>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <LazyAtributosLista ficha={ficha} isAtual={isAtual} {...props} />
      </React.Suspense>
    </StoreInitializer>
  )
}

export const PlasmicStatusPanelCore = criarWrapper(() =>
  import('./components/status/StatusPanel').then(m => ({ default: m.StatusPanelCore }))
)
