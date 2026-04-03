import React from 'react';
import { TestesFormProvider } from './TestesFormContext';
import { TestesModificadoresGlobais, TestesSavingThrows, TestesHabilidades } from './TestesSubComponents';

export default function TestesPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <TestesFormProvider>
            <div className={['testes-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {hasChildren ? children : (
                    <>
                        <TestesModificadoresGlobais />
                        <TestesSavingThrows />
                        <TestesHabilidades />
                    </>
                )}
            </div>
        </TestesFormProvider>
    );
}