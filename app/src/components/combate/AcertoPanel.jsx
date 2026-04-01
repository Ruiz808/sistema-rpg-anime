import React from 'react';
import { AcertoFormProvider } from './AcertoFormContext';
import {
    AcertoHeader,
    AcertoAtributosSelecionados,
    AcertoConfiguracaoDados,
    AcertoVantagensDesvantagens,
    AcertoScannerArsenal,
    AcertoHUDDistancia,
    AcertoBotoesAcao
} from './AcertoSubComponents';

export default function AcertoPanel() {
    return (
        <AcertoFormProvider>
            <div className="acerto-panel">
                <div className="def-box">
                    <AcertoHeader />
                    <AcertoAtributosSelecionados />
                    <AcertoConfiguracaoDados />
                    <AcertoVantagensDesvantagens />
                    <AcertoScannerArsenal />
                    <AcertoHUDDistancia />
                    <AcertoBotoesAcao />
                </div>
            </div>
        </AcertoFormProvider>
    );
}