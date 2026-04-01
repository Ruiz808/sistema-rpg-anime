import React from 'react';
import { AcertoFormProvider } from './AcertoFormContext';
import {
    AcertoClasseBuffs,
    AcertoStatsSelector,
    AcertoDadosConfig,
    AcertoVantagensGrid,
    AcertoArsenalScanner,
    AcertoDistanciaHUD,
    AcertoRolarButton
} from './AcertoSubComponents';

export default function AcertoPanel() {
    return (
        <AcertoFormProvider>
            <div className="acerto-panel">
                <div className="def-box">
                    <AcertoClasseBuffs />
                    <AcertoStatsSelector />
                    <AcertoDadosConfig />
                    <AcertoVantagensGrid />
                    <AcertoArsenalScanner />
                    <AcertoDistanciaHUD />
                    <AcertoRolarButton />
                </div>
            </div>
        </AcertoFormProvider>
    );
}