import React from 'react';
import { ElementosFormProvider } from './ElementosFormContext';
import { ElementosSidebar, ElementosGrimorio, ElementosFormMagia, ElementosMagiaLista, ElementosImportadorIA } from './ElementosSubComponents';

export default function ElementosPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <ElementosFormProvider>
            <div className={['elementos-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {hasChildren ? children : (
                    <>
                        <ElementosSidebar />
                        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <ElementosImportadorIA /> {/* 🔥 NOSSO NOVO MOTOR DE IA PARA MAGIAS 🔥 */}
                            <ElementosGrimorio />
                            <ElementosFormMagia />
                            <ElementosMagiaLista />
                        </div>
                    </>
                )}
            </div>
        </ElementosFormProvider>
    );
}