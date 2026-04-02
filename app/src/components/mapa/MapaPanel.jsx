import React from 'react';
import { MapaFormProvider, calcularCA } from './MapaFormContext';
import {
    MapaDadoAnimado,
    MapaMestreRPToggle,
    MapaMestreCenaVisualizada,
    MapaMestreGerenciadorCenas,
    MapaMestreGavetaTokens, // 🔥 ADICIONAMOS A GAVETA AQUI 🔥
    MapaMestreGeradorDummies,
    MapaAreaCentral,
    MapaIniciativaTracker,
    MapaHologramaAcao
} from './MapaSubComponents';

export { calcularCA };

export default function MapaPanel() {
    return (
        <MapaFormProvider>
            <div className="mapa-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <MapaDadoAnimado />
                <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                    <MapaMestreRPToggle />
                    <MapaMestreCenaVisualizada />
                    <MapaMestreGerenciadorCenas />
                    
                    {/* 🔥 A GAVETA APARECE AQUI, LOGO ACIMA DO INJETOR MANUAL 🔥 */}
                    <MapaMestreGavetaTokens />
                    
                    <MapaMestreGeradorDummies />
                    <MapaAreaCentral />
                    <MapaIniciativaTracker />
                </div>
                <div style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: 10, height: '85vh' }}>
                    <MapaHologramaAcao />
                </div>
            </div>
        </MapaFormProvider>
    );
}