import React from 'react';
import { AtaqueFormProvider } from './AtaqueFormContext';
import {
    AtaqueFuriaDisplay,
    AtaqueCriticoConfig,
    AtaqueArmaEquipada,
    AtaqueArmaVazia,
    AtaqueHabilidadesAtivas,
    AtaqueMagiasPreparadas,
    AtaqueDanoCustomizado, // 🔥 IMPORTADO AQUI
    AtaqueBotoesAcao
} from './AtaqueSubComponents';

export default function AtaquePanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    return (
        <AtaqueFormProvider>
            <div className={['ataque-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <AtaqueFuriaDisplay />
                        <AtaqueCriticoConfig />
                        <AtaqueArmaEquipada />
                        <AtaqueArmaVazia />
                        <AtaqueHabilidadesAtivas />
                        <AtaqueMagiasPreparadas />
                        
                        {/* 🔥 MODO DEUS INJETADO ANTES DOS BOTÕES 🔥 */}
                        <AtaqueDanoCustomizado />
                        
                        <AtaqueBotoesAcao />
                    </>
                )}
            </div>
        </AtaqueFormProvider>
    );
}