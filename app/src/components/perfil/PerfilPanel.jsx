import React from 'react';
import { PerfilFormProvider } from './PerfilFormContext';
import { PerfilJogadorEditor, PerfilPersonagensSalvos, PerfilMestreToggle } from './PerfilSubComponents';

export default function PerfilPanel() {
    return (
        <PerfilFormProvider>
            <div className="perfil-panel">
                <PerfilJogadorEditor />
                <PerfilPersonagensSalvos />
                <PerfilMestreToggle />
            </div>
        </PerfilFormProvider>
    );
}