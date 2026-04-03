import React from 'react';
import { PoderesFormProvider } from './PoderesFormContext';
import { PoderesSidebar, PoderesAreaCentral } from './PoderesSubComponents';

export default function PoderesPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <PoderesFormProvider>
            <div className={['poderes-panel', className].filter(Boolean).join(' ')} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {hasChildren ? children : (
                    <>
                        <PoderesSidebar />
                        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <PoderesAreaCentral />
                        </div>
                    </>
                )}
            </div>
        </PoderesFormProvider>
    );
}