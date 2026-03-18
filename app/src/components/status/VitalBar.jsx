import React from 'react';

export default function VitalBar({ label, atual, max, color, extraInfo }) {
    const safeMax = max > 0 ? max : 1;
    const safeAtual = Math.max(0, Math.min(atual, safeMax));
    const pct = Math.min(100, Math.max(0, (safeAtual / safeMax) * 100));

    const formatNum = (n) => {
        if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return String(Math.floor(n));
    };

    const text = `${formatNum(safeAtual)} / ${formatNum(safeMax)}${extraInfo ? ' ' + extraInfo : ''}`;

    return (
        <div className="vital-container">
            <div className="vital-label"><span>{label}</span></div>
            <div className="bar-bg">
                <div
                    className="bar-fill"
                    style={{ width: pct + '%', backgroundColor: color }}
                />
                <div className="bar-text">{text}</div>
            </div>
        </div>
    );
}
