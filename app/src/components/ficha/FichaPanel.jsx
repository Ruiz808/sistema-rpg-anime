import React from 'react';
import { FichaFormProvider } from './FichaFormContext';
import { 
    FichaBioGroup, 
    FichaCondicoesEElementais, // 🔥 IMPORTAÇÃO DO NOVO PAINEL 🔥
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
import AbaDominios from './AbaDominios';

export default function FichaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <FichaFormProvider>
            <div className={['ficha-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <FichaBioGroup />
                        
                        {/* 🔥 O PAINEL DE SANGRAMENTOS E RESISTÊNCIAS FICA AQUI, BEM VISÍVEL 🔥 */}
                        <FichaCondicoesEElementais /> 
                        
                        <FichaSeresSelados />
                        <FichaEditorAtributos />
                        <FichaReatorElemental />
                        <FichaDistorcaoConceitual />
                        <FichaMatrizUtilitaria />
                        <FichaFuriaBerserker />
                        <FichaMarcadoresCena />
                        <FichaForjaCalamidade />
                        <FichaMultiplicadoresDano />
                        
                        <AbaDominios /> 

                        <TabelaPrestigio />
                    </>
                )}
            </div>
        </FichaFormProvider>
    );
}