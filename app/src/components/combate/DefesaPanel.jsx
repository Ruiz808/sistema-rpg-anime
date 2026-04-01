import React from 'react';
import { DefesaFormProvider, calcularCA } from './DefesaFormContext';
import { DefesaEvasaoBox, DefesaResistenciaBox, DefesaEscudoBox } from './DefesaSubComponents';

export { calcularCA };

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