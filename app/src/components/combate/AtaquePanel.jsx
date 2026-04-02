import React from 'react';
import { AtaqueFormProvider } from './AtaqueFormContext';
import {
    AtaqueFuriaDisplay,
    AtaqueCriticoConfig,
    AtaqueArmaEquipada,
    AtaqueArmaVazia,
    AtaqueHabilidadesAtivas,
    AtaqueMagiasPreparadas, // 🔥 NOVO IMPORT!
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
                <AtaqueMagiasPreparadas /> {/* 🔥 RENDER DO GRIMÓRIO AQUI */}
                <AtaqueBotoesAcao />
            </div>
        </AtaqueFormProvider>
    );
}