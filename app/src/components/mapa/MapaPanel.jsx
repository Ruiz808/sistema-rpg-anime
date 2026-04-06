import React from 'react';
import { MapaFormProvider } from './MapaFormContext';
import {
    MapaDadoAnimado,
    MapaFerramentasMestre,
    MapaAreaCentral,
    MapaRolagemRapida,
    MapaIniciativaTracker,
    MapaHologramaAcao
} from './MapaSubComponents';

export default function MapaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    
    return (
        <MapaFormProvider>
            <div className={['mapa-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {hasChildren ? children : (
                    <>
                        <MapaDadoAnimado />
                        
                        <div style={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* 🔥 A CAIXA DE FERRAMENTAS DO MESTRE EM ACORDEÃO 🔥 */}
                            <MapaFerramentasMestre />
                            
                            <MapaAreaCentral />
                            
                            {/* 🔥 BARRA COMPACTA E LISTA GERAL DE ENTIDADES 🔥 */}
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