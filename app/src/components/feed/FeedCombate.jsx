import React from 'react';
import useStore from '../../stores/useStore';

export default function FeedCombate() {
    const feedCombate = useStore(s => s.feedCombate);

    if (feedCombate.length === 0) {
        return (
            <div id="feed-combate">
                <p style={{ color: '#888', textAlign: 'center', fontStyle: 'italic' }}>
                    Aguardando acoes de combate...
                </p>
            </div>
        );
    }

    // Render newest first (prepend behavior)
    const reversed = [...feedCombate].reverse();

    return (
        <div id="feed-combate">
            {reversed.map((d, idx) => {
                if (d.tipo === 'acerto') {
                    return (
                        <div key={idx} className="damage-log" style={{ borderLeftColor: '#f90', background: 'rgba(255,153,0,0.1)' }}>
                            <p style={{ color: '#f90' }}>
                                <span dangerouslySetInnerHTML={{ __html: `&#x1F3AF; <strong>${d.nome}</strong> rolou Acerto usando <strong>${d.atributosUsados}</strong>${d.armaStr || ''}:` }} />
                            </p>
                            <h1 className="damage-number" style={{ color: '#f90', textShadow: '0 0 20px rgba(255,153,0,0.8)' }}>
                                {d.acertoTotal}
                            </h1>
                            <p className="lethality" style={{ color: '#fff' }}>{d.profBonusTexto}</p>
                            <div className="log-details" dangerouslySetInnerHTML={{ __html: `&#x1F3B2; Rolagem Base: ${d.rolagem}` }} />
                        </div>
                    );
                }

                if (d.tipo === 'evasiva') {
                    return (
                        <div key={idx} className="damage-log" style={{ borderLeftColor: '#0088ff', background: 'rgba(0,136,255,0.1)' }}>
                            <p style={{ color: '#0088ff' }}>
                                <span dangerouslySetInnerHTML={{ __html: `&#x1F4A8; <strong>${d.nome}</strong> declarou Esquiva${d.armaStr || ''}:` }} />
                            </p>
                            <h1 className="damage-number" style={{ color: '#0088ff', textShadow: '0 0 20px rgba(0,136,255,0.8)' }}>
                                {d.total}
                            </h1>
                            <div className="log-details" dangerouslySetInnerHTML={{ __html: d.baseCalc }} />
                        </div>
                    );
                }

                if (d.tipo === 'resistencia') {
                    return (
                        <div key={idx} className="damage-log" style={{ borderLeftColor: '#ccc', background: 'rgba(200,200,200,0.1)' }}>
                            <p style={{ color: '#ccc' }}>
                                <span dangerouslySetInnerHTML={{ __html: `&#x1F6E1;&#xFE0F; <strong>${d.nome}</strong> declarou Bloqueio${d.armaStr || ''}:` }} />
                            </p>
                            <h1 className="damage-number" style={{ color: '#ccc', textShadow: '0 0 20px rgba(200,200,200,0.8)' }}>
                                {d.total}
                            </h1>
                            <div className="log-details" dangerouslySetInnerHTML={{ __html: d.baseCalc }} />
                        </div>
                    );
                }

                if (d.tipo === 'escudo') {
                    const tg = d.vitalidade > 0 ? ` <span style="color:#ffcc00;">(Vit: +${d.vitalidade})</span>` : '';
                    return (
                        <div key={idx} className="damage-log" style={{ borderLeftColor: '#f0f', background: 'rgba(255,0,255,0.1)' }}>
                            <p style={{ color: '#f0f' }}>
                                <span dangerouslySetInnerHTML={{ __html: `&#x2728; <strong>${d.nome}</strong> ativou Escudo${d.armaStr || ''}:` }} />
                            </p>
                            <h1 className="damage-number" style={{ color: '#f0f', textShadow: '0 0 20px rgba(255,0,255,0.8)' }}>
                                <span dangerouslySetInnerHTML={{ __html: `${(d.escudoReduzido || 0).toLocaleString('pt-BR')}${tg}` }} />
                            </h1>
                            <div className="log-details" dangerouslySetInnerHTML={{ __html: d.detalhe }} />
                        </div>
                    );
                }

                // Default: dano
                return (
                    <div key={idx} className="damage-log">
                        <p dangerouslySetInnerHTML={{ __html: `&#x1F4A5; <strong>${d.nome}</strong> atacou usando <strong>${d.atributosUsados}</strong>${d.armaStr || ''}:` }} />
                        <h1 className="damage-number">
                            {(d.dano || 0).toLocaleString('pt-BR')}
                        </h1>
                        <p className="lethality">
                            LETALIDADE: {d.letalidade > 0 ? '+' + d.letalidade : '0'}
                        </p>
                        <div className="log-details" dangerouslySetInnerHTML={{
                            __html: `&#x1F3B2; Rolagem de Dados: ${d.rolagem || ''}${d.rolagemMagica || ''}${d.detalheEnergia || ''}${d.detalheConta || ''}`
                        }} />
                    </div>
                );
            })}
        </div>
    );
}
