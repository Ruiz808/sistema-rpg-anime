import React from 'react';
import { AtaqueFormProvider } from './AtaqueFormContext';
import {
    AtaqueFuriaDisplay,
    AtaqueCriticoConfig,
    AtaqueArmaEquipada,
    AtaqueArmaVazia,
    AtaqueHabilidadesAtivas,
    AtaqueBotoesAcao
} from './AtaqueSubComponents';

export default function AtaquePanel() {
    return (
        <AtaqueFormProvider>
            <div className="ataque-panel">
                <AtaqueFuriaDisplay />
                <AtaqueCriticoConfig />
                <AtaqueArmaEquipada />
                <AtaqueArmaVazia />
                <AtaqueHabilidadesAtivas />
                <AtaqueBotoesAcao />
            </div>
        </AtaqueFormProvider>
    );
}