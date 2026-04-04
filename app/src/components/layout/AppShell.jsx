import React from 'react'
import useStore from '../../stores/useStore'
import Sidebar from './Sidebar'
import TabPanel from './TabPanel'
import ModalConfirm from '../perfil/ModalConfirm'

import PerfilPanel from '../perfil/PerfilPanel'
import MestrePanel from '../mestre/MestrePanel'
import StatusPanel from '../status/StatusPanel'
import TestesPanel from '../combate/TestesPanel'
import AtaquePanel from '../combate/AtaquePanel'
import AcertoPanel from '../combate/AcertoPanel'
import DefesaPanel from '../combate/DefesaPanel'
import FichaPanel from '../ficha/FichaPanel'
import PoderesPanel from '../poderes/PoderesPanel'
import ArsenalPanel from '../arsenal/ArsenalPanel'
import ElementosPanel from '../arsenal/ElementosPanel'
import FeedCombate from '../feed/FeedCombate'
import MapaPanel from '../mapa/MapaPanel'
import Jukebox from '../jukebox/Jukebox'
import CompendioPanel from '../compendio/CompendioPanel'
import AIPanel from '../ia/AIPanel'
import GravadorPanel from '../ia/GravadorPanel'

export default function AppShell({
    className,
    painelPerfil,
    painelMestre,
    painelStatus,
    painelTestes,
    painelAtaque,
    painelAcerto,
    painelDefesa,
    painelFicha,
    painelPoderes,
    painelArsenal,
    painelElementos,
    painelLog,
    painelMapa,
    painelMusica,
    painelCompendio,
    painelOraculo,
    painelGravador
}) {
    const abaAtiva = useStore(s => s.abaAtiva)
    const isMapMode = abaAtiva === 'aba-mapa'

    return (
        <div className={['app-layout', className].filter(Boolean).join(' ')}>
            <Sidebar />
            <div className={`main-content${isMapMode ? ' modo-mapa' : ''}`}>
                {!isMapMode && <h1 className="title">RPG Anime System</h1>}
                <TabPanel id="aba-perfil">{painelPerfil || <PerfilPanel />}</TabPanel>
                <TabPanel id="aba-mestre">{painelMestre || <MestrePanel />}</TabPanel>
                <TabPanel id="aba-status">{painelStatus || <StatusPanel />}</TabPanel>
                <TabPanel id="aba-testes">{painelTestes || <TestesPanel />}</TabPanel>
                <TabPanel id="aba-ataque">{painelAtaque || <AtaquePanel />}</TabPanel>
                <TabPanel id="aba-acerto">{painelAcerto || <AcertoPanel />}</TabPanel>
                <TabPanel id="aba-defesa">{painelDefesa || <DefesaPanel />}</TabPanel>
                <TabPanel id="aba-ficha">{painelFicha || <FichaPanel />}</TabPanel>
                <TabPanel id="aba-poderes">{painelPoderes || <PoderesPanel />}</TabPanel>
                <TabPanel id="aba-arsenal">{painelArsenal || <ArsenalPanel />}</TabPanel>
                <TabPanel id="aba-elementos">{painelElementos || <ElementosPanel />}</TabPanel>
                <TabPanel id="aba-log">{painelLog || <FeedCombate />}</TabPanel>
                <TabPanel id="aba-mapa">{painelMapa || <MapaPanel />}</TabPanel>
                <TabPanel id="aba-musica">{painelMusica || <Jukebox />}</TabPanel>
                <TabPanel id="aba-compendio">{painelCompendio || <CompendioPanel />}</TabPanel>
                <TabPanel id="aba-oraculo">{painelOraculo || <AIPanel />}</TabPanel>
                <TabPanel id="aba-gravador">{painelGravador || <GravadorPanel />}</TabPanel>
            </div>
            <ModalConfirm />
        </div>
    )
}
