import React from 'react'
import useStore from '../../stores/useStore'

export default function TabPanel({ className, id, children }) {
    const abaAtiva = useStore(s => s.abaAtiva)
    
    // O segredo: se não for a aba ativa, escondemos com display: none, 
    // mas MANTEMOS o HTML lá para o app.js antigo não quebrar!
    const estilo = {
        display: abaAtiva === id ? 'block' : 'none',
        height: '100%',
        width: '100%'
    }

    return (
        <div id={id} className={['glass-panel', className].filter(Boolean).join(' ')} style={estilo}>
            {children}
        </div>
    )
}