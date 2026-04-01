import React from 'react';
import { AtaqueFormProvider } from './AtaqueFormContext';
import {
    AtaqueFuriaBerserker,
    AtaqueConfiguracaoCritico,
    AtaqueArmaEquipada,
    AtaqueHabilidadesAtivas,
    AtaqueMagiasPreparadas,
    AtaqueControlesFinais
} from './AtaqueSubComponents';

export default function AtaquePanel() {
    return (
        <AtaqueFormProvider>
            <div className="ataque-panel">
                <AtaqueFuriaBerserker />
                <AtaqueConfiguracaoCritico />
                <AtaqueArmaEquipada />
                <AtaqueHabilidadesAtivas />
                <AtaqueMagiasPreparadas />
                <AtaqueControlesFinais />
            </div>
        </AtaqueFormProvider>
    );
}