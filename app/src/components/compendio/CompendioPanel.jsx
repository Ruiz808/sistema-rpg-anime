import React from 'react';
import { CompendioFormProvider, useCompendioForm } from './CompendioFormContext';
import { CompendioSidebar, CompendioClassesGrid, CompendioGrandsSecao } from './CompendioSubComponents';

function CompendioAreaCentral() {
    const ctx = useCompendioForm();
    if (!ctx) return null;
    if (ctx.secaoAtiva === 'grands') return <CompendioGrandsSecao />;
    if (ctx.secaoAtiva === 'classes') return <CompendioClassesGrid />;
    return null;
}

export default function CompendioPanel() {
    return (
        <CompendioFormProvider>
            <div style={{ display: 'flex', gap: '20px', minHeight: '70vh', alignItems: 'flex-start' }}>
                <CompendioSidebar />
                <div style={{ flex: '1', background: 'rgba(20, 20, 30, 0.8)', padding: '30px', borderRadius: '8px', border: '1px solid #444', height: '70vh', overflowY: 'auto' }}>
                    <CompendioAreaCentral />
                </div>
            </div>
        </CompendioFormProvider>
    );
}