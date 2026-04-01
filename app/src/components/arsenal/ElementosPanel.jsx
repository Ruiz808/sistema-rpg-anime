import React from 'react';
import { ElementosFormProvider } from './ElementosFormContext';
import { ElementosGrimorio, ElementosFormMagia, ElementosMagiaLista } from './ElementosSubComponents';

export default function ElementosPanel() {
    return (
        <ElementosFormProvider>
            <div className="elementos-panel" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <ElementosGrimorio />
                    <ElementosFormMagia />
                    <ElementosMagiaLista />
                </div>
            </div>
        </ElementosFormProvider>
    );
}