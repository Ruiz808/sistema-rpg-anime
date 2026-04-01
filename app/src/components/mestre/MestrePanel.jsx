import React from 'react';
import { MestreFormProvider } from './MestreFormContext';
import {
    MestreHeader,
    MestreVisorJogadores,
    MestreInjetorEntidades,
    MestreVozSistema
} from './MestreSubComponents';

export default function MestrePanel() {
    return (
        <MestreFormProvider>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <MestreHeader />
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <MestreVisorJogadores />
                    <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <MestreInjetorEntidades />
                        <MestreVozSistema />
                    </div>
                </div>
            </div>
        </MestreFormProvider>
    );
}