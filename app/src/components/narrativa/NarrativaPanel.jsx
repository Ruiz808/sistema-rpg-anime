import React from 'react';
import { NarrativaFormProvider } from './NarrativaFormContext';
import {
    NarrativaBioForm,
    NarrativaPassivasEditor,
    NarrativaPassivasLista,
    NarrativaAuditoria
} from './NarrativaSubComponents';
import Jukebox from '../jukebox/Jukebox';

export default function NarrativaPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
    <NarrativaFormProvider>
        <div className={['narrativa-panel', className].filter(Boolean).join(' ')}>
            {hasChildren ? children : (
                <>
                    <NarrativaBioForm />
                    <NarrativaPassivasEditor />
                    <NarrativaPassivasLista />
                    <NarrativaAuditoria />
                    <Jukebox />
                </>
            )}
        </div>
    </NarrativaFormProvider>
    );
}