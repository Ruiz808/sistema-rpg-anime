import React from 'react';
import { StatusFormProvider } from './StatusFormContext';
import {
    StatusHeader,
    StatusPaletaCores,
    StatusBarrasPrincipais,
    StatusEnergiasPrimordiais,
    StatusMultiplicadores,
    StatusEconomiaAcoes,
    StatusControleRapido,
    StatusAcoesExtras,
    StatusAnalisePoder
} from './StatusSubComponents';

export default function StatusPanel() {
    return (
        <StatusFormProvider>
            <div className="status-panel-container">
                <StatusHeader />
                <StatusPaletaCores />
                <StatusBarrasPrincipais />
                <StatusEnergiasPrimordiais />
                <StatusMultiplicadores />
                <StatusEconomiaAcoes />
                <StatusControleRapido />
                <StatusAcoesExtras />
                <StatusAnalisePoder />
            </div>
        </StatusFormProvider>
    );
}