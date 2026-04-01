import React from 'react';
import { TestesFormProvider } from './TestesFormContext';
import { TestesModificadoresGlobais, TestesSavingThrows, TestesHabilidades } from './TestesSubComponents';

export default function TestesPanel() {
    return (
        <TestesFormProvider>
            <div className="testes-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <TestesModificadoresGlobais />
                <TestesSavingThrows />
                <TestesHabilidades />
            </div>
        </TestesFormProvider>
    );
}