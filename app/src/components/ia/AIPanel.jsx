import React from 'react';
import { AIFormProvider } from './AIFormContext';
import { AIHeader, AIAreaCentral } from './AISubComponents';

export default function AIPanel() {
    return (
        <AIFormProvider>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
                <AIHeader />
                <AIAreaCentral />
            </div>
        </AIFormProvider>
    );
}