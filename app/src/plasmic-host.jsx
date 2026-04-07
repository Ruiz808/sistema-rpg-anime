import React from 'react'
import { PlasmicCanvasHost } from '@plasmicapp/host'
import TemaProvider from './components/shared/TemaProvider'
import './plasmic-init'

export default function PlasmicHostPage() {
  return (
    <TemaProvider>
      <PlasmicCanvasHost />
    </TemaProvider>
  )
}
