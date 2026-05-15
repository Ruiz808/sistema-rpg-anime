import React from 'react';
import { AtaqueFormProvider } from './AtaqueFormContext';
import {
    AtaqueFuriaDisplay,
    AtaqueCriticoConfig,
    AtaqueElementoSelector, // 🔥 IMPORTADO AQUI
    AtaqueArmaEquipada,
    AtaqueArmaVazia,
    AtaqueHabilidadesAtivas,
    AtaqueMagiasPreparadas,
    AtaqueDanoCustomizado,
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
                        
                        {/* 🔥 SELETOR DE ELEMENTO NO TOPO 🔥 */}
                        <AtaqueElementoSelector /> 

                        <AtaqueCriticoConfig />
                        <AtaqueArmaEquipada />
                        <AtaqueArmaVazia />
                        <AtaqueHabilidadesAtivas />
                        <AtaqueMagiasPreparadas />
                        <AtaqueDanoCustomizado />
                        <AtaqueBotoesAcao />
                    </>
                )}
            </div>
        </AtaqueFormProvider>
    );
}