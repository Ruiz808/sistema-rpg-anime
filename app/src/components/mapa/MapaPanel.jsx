import React from 'react';
import { MapaFormProvider } from './MapaFormContext';
import { MapaDadoAnimado, MapaRolagemRapida, MapaIniciativaTracker, MapaHologramaAcao } from './MapaCombate';
import { MapaFerramentasMestre } from './MapaFerramentasMestre';
import { MapaAreaCentral } from './MapaGrelha';

export default function MapaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    
    return (
        <MapaFormProvider>
            <div className={['mapa-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
                
                {hasChildren ? children : (
                    <>
                        {/* MÓDULO DE COMBATE E ROLAGEM */}
                        <MapaDadoAnimado />
                        
                        <div style={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* MÓDULO DO MESTRE (ZONAS, CENAS, DUMMIES) */}
                            <MapaFerramentasMestre />
                            
                            {/* MÓDULO VISUAL E COMUNICAÇÃO (GRELHA, 3D, VOZ E IA) */}
                            <MapaAreaCentral />
                            
                            {/* MÓDULO DE COMBATE RÁPIDO */}
                            <MapaRolagemRapida />
                            <MapaIniciativaTracker />
                        </div>

                        <div style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: 10, height: '85vh' }}>
                            <MapaHologramaAcao />
                        </div>
                    </>
                )}
            </div>
        </MapaFormProvider>
    );
}