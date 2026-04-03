import React from 'react';
import { FichaFormProvider } from './FichaFormContext';
import { 
    FichaBioGroup, 
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

export default function FichaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <FichaFormProvider>
            <div className={['ficha-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <FichaBioGroup />
                        <FichaEditorAtributos />
                        <FichaReatorElemental />
                        <FichaDistorcaoConceitual />
                        <FichaMatrizUtilitaria />
                        <FichaFuriaBerserker />
                        <FichaMarcadoresCena />
                        <FichaForjaCalamidade />
                        <FichaMultiplicadoresDano />
                        <TabelaPrestigio />
                    </>
                )}
            </div>
        </FichaFormProvider>
    );
}