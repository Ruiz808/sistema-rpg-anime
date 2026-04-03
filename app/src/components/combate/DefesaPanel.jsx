import React from 'react';
import { DefesaFormProvider } from './DefesaFormContext';
import { DefesaEvasaoBox, DefesaResistenciaBox, DefesaEscudoBox } from './DefesaSubComponents';

export default function DefesaPanel() {
    return (
        <DefesaFormProvider>
            <div className="defesa-panel">
                <DefesaEvasaoBox />
                <DefesaResistenciaBox />
                <DefesaEscudoBox />
            </div>
        </DefesaFormProvider>
    );
}