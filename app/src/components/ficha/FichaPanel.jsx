import React from 'react';
import { FichaFormProvider } from './FichaFormContext';
import { 
    FichaBioGroup, 
    FichaSeresSelados, 
    FichaEditorAtributos, 
    FichaReatorElemental, 
    FichaDistorcaoConceitual, 
    FichaMatrizUtilitaria, 
    FichaFuriaBerserker, 
    FichaMarcadoresCena, 
    FichaForjaCalamidade, 
    FichaMultiplicadoresDano 
} from './FichaSubComponents';
import TabelaPrestigio from './TabelaPrestigio';
import AbaDominios from './AbaDominios'; // 🔥 IMPORTAÇÃO DA NOSSA NOVA ABA AQUI 🔥

export default function FichaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <FichaFormProvider>
            <div className={['ficha-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <FichaBioGroup />
                        <FichaSeresSelados />
                        <FichaEditorAtributos />
                        <FichaReatorElemental />
                        <FichaDistorcaoConceitual />
                        <FichaMatrizUtilitaria />
                        <FichaFuriaBerserker />
                        <FichaMarcadoresCena />
                        <FichaForjaCalamidade />
                        <FichaMultiplicadoresDano />
                        
                        {/* 🔥 A NOSSA NOVA ABA RENDERIZADA AQUI 🔥 */}
                        <AbaDominios /> 

                        <TabelaPrestigio />
                    </>
                )}
            </div>
        </FichaFormProvider>
    );
}