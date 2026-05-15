import React from 'react';
import { DefesaFormProvider } from './DefesaFormContext';
import { DefesaSofrerDanoBox, DefesaEvasaoBox, DefesaResistenciaBox, DefesaEscudoBox } from './DefesaSubComponents'; // 🔥 Atualizado

export default function DefesaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    return (
        <DefesaFormProvider>
            <div className={['defesa-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        {/* 🔥 NOVO: PAINEL DE RECEBER O DANO FINAL 🔥 */}
                        <DefesaSofrerDanoBox /> 
                        
                        <DefesaEvasaoBox />
                        <DefesaResistenciaBox />
                        <DefesaEscudoBox />
                    </>
                )}
            </div>
        </DefesaFormProvider>
    );
}