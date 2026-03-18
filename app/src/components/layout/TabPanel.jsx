import React from 'react';
import useStore from '../../stores/useStore';

export default function TabPanel({ id, children }) {
    const abaAtiva = useStore((s) => s.abaAtiva);
    const isActive = abaAtiva === id;

    return (
        <div
            className={`glass-panel${isActive ? ' ativo' : ''}`}
            id={id}
            style={{ display: isActive ? 'block' : 'none' }}
        >
            {children}
        </div>
    );
}
