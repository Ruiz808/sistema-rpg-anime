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

export default function AcertoPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <AcertoFormProvider>
            <div className={['acerto-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <div className="def-box">
                        <AcertoClasseBuffs />
                        <AcertoStatsSelector />
                        <AcertoDadosConfig />
                        <AcertoVantagensGrid />
                        <AcertoArsenalScanner />
                        <AcertoDistanciaHUD />
                        <AcertoRolarButton />
                    </div>
                )}
            </div>
        </AcertoFormProvider>
    );
}