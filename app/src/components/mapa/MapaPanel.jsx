import React from 'react';
import { MapaFormProvider } from './MapaFormContext';
import {
    MapaDadoAnimado,
    MapaFerramentasMestre,
    MapaAreaCentral,
    MapaRolagemRapida,
    MapaIniciativaTracker,
    MapaHologramaAcao,
    MapaOlhoSextaFeira // 🔥 O NOVO WIDGET IMPORTADO AQUI
} from './MapaSubComponents';

export default function MapaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    
    return (
        <MapaFormProvider>
            <div className={['mapa-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
                
                {/* 🔥 O OLHO DA SEXTA-FEIRA FLUTUANDO NO MAPA 🔥 */}
                <MapaOlhoSextaFeira />

                {hasChildren ? children : (
                    <>
                        <MapaDadoAnimado />
                        
                        <div style={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <MapaFerramentasMestre />
                            
                            <MapaAreaCentral />
                            
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