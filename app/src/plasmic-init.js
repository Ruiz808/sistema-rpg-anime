import { initPlasmicLoader } from '@plasmicapp/loader-react'

// --- Componentes puros (sem dependência de store) ---
import VitalBar from './components/status/VitalBar'
import TabPanel from './components/layout/TabPanel'
import DummieToken from './components/combat/DummieToken'
import FormasEditor from './components/shared/FormasEditor'

// --- Wrappers para componentes com store ---
import {
  PlasmicStatusPanel,
  PlasmicFichaPanel,
  PlasmicAtaquePanel,
  PlasmicAcertoPanel,
  PlasmicDefesaPanel,
  PlasmicTestesPanel,
  PlasmicPoderesPanel,
  PlasmicArsenalPanel,
  PlasmicElementosPanel,
  PlasmicFeedCombate,
  PlasmicMapaPanel,
  PlasmicPerfilPanel,
  PlasmicModalConfirm,
  PlasmicCompendioPanel,
  PlasmicNarrativaPanel,
  PlasmicJukebox,
  PlasmicSidebar,
  PlasmicMestrePanel,
  PlasmicTabelaPrestigio,
  PlasmicRadarChart,
  PlasmicAtributosLista,
  PlasmicStatusPanelCore
} from './plasmic-wrappers.jsx'

if (!import.meta.env.VITE_PLASMIC_PROJECT_ID) {
  console.warn('[Plasmic] VITE_PLASMIC_PROJECT_ID não definido. Configure no arquivo .env')
}

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: import.meta.env.VITE_PLASMIC_PROJECT_ID || '',
      token: import.meta.env.VITE_PLASMIC_PUBLIC_TOKEN || ''
    }
  ],
  preview: import.meta.env.DEV
})

// ========================================
// COMPONENTES PUROS (sem store)
// ========================================

PLASMIC.registerComponent(VitalBar, {
  name: 'VitalBar',
  props: {
    label: 'string',
    atual: 'number',
    max: 'number',
    color: 'string',
    extraInfo: 'string'
  }
})

PLASMIC.registerComponent(TabPanel, {
  name: 'TabPanel',
  props: {
    id: 'string',
    children: 'slot'
  }
})

PLASMIC.registerComponent(DummieToken, {
  name: 'DummieToken',
  props: {
    id: 'string',
    dummie: 'object'
  }
})

PLASMIC.registerComponent(FormasEditor, {
  name: 'FormasEditor',
  props: {
    itemRaridade: 'string',
    formas: 'object',
    formaAtivaId: 'string',
    configAtivaId: 'string',
    onSalvarForma: { type: 'eventHandler', argTypes: [] },
    onDeletarForma: { type: 'eventHandler', argTypes: [] },
    onAtivarForma: { type: 'eventHandler', argTypes: [] }
  }
})

// ========================================
// SUB-COMPONENTES GRANULARES (status)
// ========================================

PLASMIC.registerComponent(PlasmicRadarChart, {
  name: 'RadarChart',
  props: {
    ficha: 'object',
    isAtual: 'boolean'
  }
})

PLASMIC.registerComponent(PlasmicAtributosLista, {
  name: 'AtributosLista',
  props: {
    ficha: 'object',
    isAtual: 'boolean'
  }
})

PLASMIC.registerComponent(PlasmicStatusPanelCore, {
  name: 'StatusPanelCore',
  props: {}
})

// ========================================
// PAINÉIS COMPLETOS (com store via wrapper)
// ========================================

PLASMIC.registerComponent(PlasmicStatusPanel, {
  name: 'StatusPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicFichaPanel, {
  name: 'FichaPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicTabelaPrestigio, {
  name: 'TabelaPrestigio',
  props: {}
})

PLASMIC.registerComponent(PlasmicAtaquePanel, {
  name: 'AtaquePanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicAcertoPanel, {
  name: 'AcertoPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicDefesaPanel, {
  name: 'DefesaPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicTestesPanel, {
  name: 'TestesPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicPoderesPanel, {
  name: 'PoderesPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicArsenalPanel, {
  name: 'ArsenalPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicElementosPanel, {
  name: 'ElementosPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicFeedCombate, {
  name: 'FeedCombate',
  props: {}
})

PLASMIC.registerComponent(PlasmicMapaPanel, {
  name: 'MapaPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicPerfilPanel, {
  name: 'PerfilPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicModalConfirm, {
  name: 'ModalConfirm',
  props: {}
})

PLASMIC.registerComponent(PlasmicCompendioPanel, {
  name: 'CompendioPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicNarrativaPanel, {
  name: 'NarrativaPanel',
  props: {}
})

PLASMIC.registerComponent(PlasmicJukebox, {
  name: 'Jukebox',
  props: {}
})

PLASMIC.registerComponent(PlasmicSidebar, {
  name: 'Sidebar',
  props: {}
})

PLASMIC.registerComponent(PlasmicMestrePanel, {
  name: 'MestrePanel',
  props: {}
})
