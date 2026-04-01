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

export default function FichaPanel() {
    return (
        <FichaFormProvider>
            <div className="ficha-panel">
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
            </div>
        </FichaFormProvider>
    );
}