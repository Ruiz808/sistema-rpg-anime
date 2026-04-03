import React from 'react';
import { StatusFormProvider } from './StatusFormContext';
import {
    StatusPaletaCores,
    StatusVitalsGrid,
    StatusEnergiasPrimordiais,
    StatusMultiplicadores,
    StatusEconomiaAcoes,
    StatusControleRapido,
    StatusAnalisePoder
} from './StatusSubComponents';

export default function StatusPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <StatusFormProvider>
            <div className={['status-panel-container', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <StatusPaletaCores />
                        <StatusVitalsGrid />
                        <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; ENERGIAS PRIMORDIAIS</h3>
                        <StatusEnergiasPrimordiais />
                        <StatusMultiplicadores />
                        <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; ECONOMIA DE AÇÕES (TURNO)</h3>
                        <StatusEconomiaAcoes />
                        <h3 className="section-title-mint-spaced" style={{ marginTop: 0, color: '#fff', fontSize: '1.2em' }}>&gt; CONTROLE RÁPIDO</h3>
                        <StatusControleRapido />
                        <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em' }}>&gt; ANÁLISE DE PODER E CULTIVAÇÃO</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '-10px', textAlign: 'center' }}>(Para editar a Ascensão e Divisores, utilize a aba <b>Ficha</b>)</p>
                        <StatusAnalisePoder />
                    </>
                )}
            </div>
        </StatusFormProvider>
    );
}