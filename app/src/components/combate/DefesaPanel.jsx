import React from 'react';
import { DefesaFormProvider } from './DefesaFormContext';
import { DefesaEvasaoBox, DefesaResistenciaBox, DefesaEscudoBox } from './DefesaSubComponents';

export default function DefesaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <DefesaFormProvider>
            <div className={['defesa-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <DefesaEvasaoBox />
                        <DefesaResistenciaBox />
                        <DefesaEscudoBox />
                    </>
                )}
            </div>
        </DefesaFormProvider>
    );
}