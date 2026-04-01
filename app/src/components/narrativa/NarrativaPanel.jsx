import React from 'react';
import { NarrativaFormProvider } from './NarrativaFormContext';
import {
    NarrativaBioForm,
    NarrativaPassivasEditor,
    NarrativaPassivasLista,
    NarrativaAuditoria
} from './NarrativaSubComponents';
import Jukebox from '../jukebox/Jukebox';

export default function NarrativaPanel() {
    return (
    <NarrativaFormProvider>
        <div className="narrativa-panel">
            <NarrativaBioForm />
            <NarrativaPassivasEditor />
            <NarrativaPassivasLista />
            <NarrativaAuditoria />
            <Jukebox />
        </div>
    </NarrativaFormProvider>
    );
}