import React, { useEffect } from 'react'
import useStore from './stores/useStore'
import { setModoPlasmic } from './services/firebase-sync'

// --- Providers (eager imports, leves — só context) ---
import { FichaFormProvider } from './components/ficha/FichaFormContext'
import { AtaqueFormProvider } from './components/combate/AtaqueFormContext'
import { AcertoFormProvider } from './components/combate/AcertoFormContext'
import { DefesaFormProvider } from './components/combate/DefesaFormContext'
import { TestesFormProvider } from './components/combate/TestesFormContext'
import { StatusFormProvider } from './components/status/StatusFormContext'
import { ArsenalFormProvider } from './components/arsenal/ArsenalFormContext'
import { ElementosFormProvider } from './components/arsenal/ElementosFormContext'
import { PoderesFormProvider } from './components/poderes/PoderesFormContext'
import { NarrativaFormProvider } from './components/narrativa/NarrativaFormContext'
import { MapaFormProvider } from './components/mapa/MapaFormContext'
import { PerfilFormProvider } from './components/perfil/PerfilFormContext'
import { MestreFormProvider } from './components/mestre/MestreFormContext'
import { CompendioFormProvider } from './components/compendio/CompendioFormContext'

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
  return function PlasmicWrapper({ className, style, ...props }) {
    return (
      <StoreInitializer>
        <React.Suspense fallback={<div className="glass-panel ativo" style={{ padding: '1rem' }}>Carregando...</div>}>
          <LazyComp className={className} style={style} {...props} />
        </React.Suspense>
      </StoreInitializer>
    )
  }
}

// --- Layout completo (AppShell) ---
export const PlasmicAppShell = criarWrapper(() => import('./components/layout/AppShell'))

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

// --- Sub-componentes granulares (status) ---
// RadarChart e AtributosLista precisam de ficha como prop — injetamos do store
const LazyRadarChart = React.lazy(() =>
  import('./components/status/StatusSubComponents').then(m => ({ default: m.StatusRadarChart }))
)
const LazyAtributosLista = React.lazy(() =>
  import('./components/status/StatusSubComponents').then(m => ({ default: m.StatusAtributosLista }))
)

export function PlasmicRadarChart({ isAtual = false, className, style, ...props }) {
  const ficha = useStore(s => s.minhaFicha)
  return (
    <StoreInitializer>
      <div className={className} style={style}>
        <React.Suspense fallback={<div>Carregando...</div>}>
          <LazyRadarChart ficha={ficha} isAtual={isAtual} {...props} />
        </React.Suspense>
      </div>
    </StoreInitializer>
  )
}

export function PlasmicAtributosLista({ isAtual = false, className, style, ...props }) {
  const ficha = useStore(s => s.minhaFicha)
  return (
    <StoreInitializer>
      <div className={className} style={style}>
        <React.Suspense fallback={<div>Carregando...</div>}>
          <LazyAtributosLista ficha={ficha} isAtual={isAtual} {...props} />
        </React.Suspense>
      </div>
    </StoreInitializer>
  )
}

// ========================================
// SUB-COMPONENTES INDIVIDUAIS (Fase 3)
// Cada sub-componente embute seu FormProvider para funcionar standalone no Plasmic
// ========================================

// --- Factory genérica para sub-componentes com provider ---
function criarSubWrapper(importFn, Provider) {
  const LazyComp = React.lazy(importFn)
  return function PlasmicSubWrapper({ className, style, ...props }) {
    return (
      <StoreInitializer>
        <div className={className} style={style}>
          <Provider>
            <React.Suspense fallback={<div className="glass-panel ativo" style={{ padding: '0.5rem' }}>Carregando...</div>}>
              <LazyComp {...props} />
            </React.Suspense>
          </Provider>
        </div>
      </StoreInitializer>
    )
  }
}

// --- Ficha sub-componentes ---
const fichaSubImport = (name) => () =>
  import('./components/ficha/FichaSubComponents').then(m => ({ default: m[name] }))

export const PlasmicFichaBioGroup = criarSubWrapper(fichaSubImport('FichaBioGroup'), FichaFormProvider)
export const PlasmicFichaEditorAtributos = criarSubWrapper(fichaSubImport('FichaEditorAtributos'), FichaFormProvider)
export const PlasmicFichaReatorElemental = criarSubWrapper(fichaSubImport('FichaReatorElemental'), FichaFormProvider)
export const PlasmicFichaDistorcaoConceitual = criarSubWrapper(fichaSubImport('FichaDistorcaoConceitual'), FichaFormProvider)
export const PlasmicFichaMatrizUtilitaria = criarSubWrapper(fichaSubImport('FichaMatrizUtilitaria'), FichaFormProvider)
export const PlasmicFichaFuriaBerserker = criarSubWrapper(fichaSubImport('FichaFuriaBerserker'), FichaFormProvider)
export const PlasmicFichaMarcadoresCena = criarSubWrapper(fichaSubImport('FichaMarcadoresCena'), FichaFormProvider)
export const PlasmicFichaForjaCalamidade = criarSubWrapper(fichaSubImport('FichaForjaCalamidade'), FichaFormProvider)
export const PlasmicFichaMultiplicadoresDano = criarSubWrapper(fichaSubImport('FichaMultiplicadoresDano'), FichaFormProvider)

// --- Ataque sub-componentes ---
const ataqueSubImport = (name) => () =>
  import('./components/combate/AtaqueSubComponents').then(m => ({ default: m[name] }))

export const PlasmicAtaqueFuriaDisplay = criarSubWrapper(ataqueSubImport('AtaqueFuriaDisplay'), AtaqueFormProvider)
export const PlasmicAtaqueCriticoConfig = criarSubWrapper(ataqueSubImport('AtaqueCriticoConfig'), AtaqueFormProvider)
export const PlasmicAtaqueArmaEquipada = criarSubWrapper(ataqueSubImport('AtaqueArmaEquipada'), AtaqueFormProvider)
export const PlasmicAtaqueHabilidadesAtivas = criarSubWrapper(ataqueSubImport('AtaqueHabilidadesAtivas'), AtaqueFormProvider)
export const PlasmicAtaqueMagiasPreparadas = criarSubWrapper(ataqueSubImport('AtaqueMagiasPreparadas'), AtaqueFormProvider)
export const PlasmicAtaqueBotoesAcao = criarSubWrapper(ataqueSubImport('AtaqueBotoesAcao'), AtaqueFormProvider)

// --- Defesa sub-componentes ---
const defesaSubImport = (name) => () =>
  import('./components/combate/DefesaSubComponents').then(m => ({ default: m[name] }))

export const PlasmicDefesaEvasaoBox = criarSubWrapper(defesaSubImport('DefesaEvasaoBox'), DefesaFormProvider)
export const PlasmicDefesaResistenciaBox = criarSubWrapper(defesaSubImport('DefesaResistenciaBox'), DefesaFormProvider)
export const PlasmicDefesaEscudoBox = criarSubWrapper(defesaSubImport('DefesaEscudoBox'), DefesaFormProvider)

// --- Status sub-componentes ---
const statusSubImport = (name) => () =>
  import('./components/status/StatusSubComponents').then(m => ({ default: m[name] }))

export const PlasmicStatusVitalsGrid = criarSubWrapper(statusSubImport('StatusVitalsGrid'), StatusFormProvider)
export const PlasmicStatusEnergiasPrimordiais = criarSubWrapper(statusSubImport('StatusEnergiasPrimordiais'), StatusFormProvider)
export const PlasmicStatusMultiplicadores = criarSubWrapper(statusSubImport('StatusMultiplicadores'), StatusFormProvider)
export const PlasmicStatusEconomiaAcoes = criarSubWrapper(statusSubImport('StatusEconomiaAcoes'), StatusFormProvider)
export const PlasmicStatusControleRapido = criarSubWrapper(statusSubImport('StatusControleRapido'), StatusFormProvider)
export const PlasmicStatusAnalisePoder = criarSubWrapper(statusSubImport('StatusAnalisePoder'), StatusFormProvider)
export const PlasmicStatusPaletaCores = criarSubWrapper(statusSubImport('StatusPaletaCores'), StatusFormProvider)
