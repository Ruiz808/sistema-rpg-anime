import React from 'react';
import { ArsenalFormProvider } from './ArsenalFormContext';
import {
    ArsenalFormTitle,
    ArsenalNomeInput,
    ArsenalTipoSelect,
    ArsenalArmaSelect,
    ArsenalRaridadeSelect,
    ArsenalBonusSelect,
    ArsenalDadosDano,
    ArsenalEfeitosAtivos,
    ArsenalEfeitosPassivos,
    ArsenalForjarButton,
    ArsenalInventarioList
} from './ArsenalSubComponents';

export default function ArsenalPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0
    return (
        <ArsenalFormProvider>
            <div className={['arsenal-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : (
                    <>
                        <div className="def-box" id="form-item-box">
                            <ArsenalFormTitle />
                            <ArsenalNomeInput />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
                                <ArsenalTipoSelect />
                                <ArsenalArmaSelect />
                                <ArsenalRaridadeSelect />
                                <ArsenalBonusSelect />
                            </div>
                            <ArsenalDadosDano />
                            <ArsenalEfeitosAtivos />
                            <ArsenalEfeitosPassivos />
                            <ArsenalForjarButton />
                        </div>
                        <ArsenalInventarioList />
                    </>
                )}
            </div>
        </ArsenalFormProvider>
    );
}