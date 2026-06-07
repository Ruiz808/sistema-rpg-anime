import React, { useState } from 'react';
import { MarcadosFormProvider, useMarcadosForm } from './MarcadosFormContext';
import { AbaDominios } from './MarcadosSubComponents';
// Importe aqui as outras abas: import ClassificacaoPanel from './ClassificacaoPanel', etc.

function MarcadosLayout({ children }) {
    const ctx = useMarcadosForm();
    const [paginaAtual, setPaginaAtual] = useState(3); // Inicia na aba 3 de Domínios para testar

    // Renderiza a UI baseada no estado interno
    return (
        <div style={{ width: '100%', minHeight: '85vh', backgroundColor: '#bba9d8', padding: '40px', borderRadius: '12px' }}>
            <div className="swoop-container" style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
                
                {/* O seu Router de Páginas limpo */}
                {paginaAtual === 1 && <div>Conteúdo da Ficha Principal...</div>}
                {paginaAtual === 2 && <div>Análise de Poder...</div>}
                {paginaAtual === 3 && <AbaDominios />}
                
                {/* Caso existam subcomponentes injetados (como no seu exemplo) */}
                {children}

            </div>
            
            {/* Navegação */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button onClick={() => setPaginaAtual(paginaAtual - 1)}>⮜ Anterior</button>
                <span>Página {paginaAtual} de 5</span>
                <button onClick={() => setPaginaAtual(paginaAtual + 1)}>Próxima ⮞</button>
            </div>
        </div>
    );
}

// O Export Principal (Invólucro)
export default function MarcadosPanel({ className, children }) {
    const hasChildren = React.Children.count(children) > 0;
    return (
        <MarcadosFormProvider>
            <div className={['marcados-panel', className].filter(Boolean).join(' ')}>
                {hasChildren ? children : <MarcadosLayout />}
            </div>
        </MarcadosFormProvider>
    );
}