import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { uploadImagem, salvarFichaSilencioso, salvarFirebaseImediato } from '../../services/firebase-sync';
import { getMaximo, getRawBase, getBuffs } from '../../core/attributes';
import { getRank } from '../../core/prestige';

import PoderesPanel from '../poderes/PoderesPanel';

// ==========================================
// 🛡️ FUNÇÕES SEGURAS DA ENGINE E MATEMÁTICA PURA
// ==========================================
const safeGetRawBase = (f, k) => typeof getRawBase === 'function' ? getRawBase(f, k) : parseFloat(f[k]?.base) || 0;
const safeGetRank = (prest, asc) => typeof getRank === 'function' ? getRank(prest, asc) : { l: 'F', c: '#ffffff', a: asc };
const safeGetBuffs = (f, k, t) => typeof getBuffs === 'function' ? getBuffs(f, k, t) : {};

const getBasePFor = (ficha, k) => {
    const mults = { vida: 1000000, mana: 10000000, aura: 10000000, chakra: 10000000, corpo: 10000000, status: 1000 };
    const div = parseFloat(ficha?.divisores?.[k]) || 1;
    if (k === 'status') {
        let m = 0;
        ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'].forEach(s => {
            m += safeGetRawBase(ficha, s);
        });
        return Math.floor(((m / 8) / mults.status) * div) || 0;
    }
    return Math.floor((safeGetRawBase(ficha, k) / (mults[k] || 1)) * div) || 0;
};

const getEfetivoMFormas = (ficha, k) => {
    const anchor = k === 'status' ? 'forca' : k;
    let s = ficha[anchor] || {};
    let b = safeGetBuffs(ficha, anchor, true);
    let v = parseFloat(s.mFormas) || 1.0;
    if (!b._hasBuff || !b._hasBuff.mformas) return v;
    return (v === 1.0 ? 0 : v) + b.mformas;
};

const calcularPrestAtual = (ficha, attrKey, baseP) => {
    const mFormas = getEfetivoMFormas(ficha, attrKey);
    const multForma = mFormas >= 10 ? (mFormas / 10) : (mFormas > 1 ? mFormas : 1);
    return Math.floor((baseP || 0) * multForma) || 0;
};

// ==========================================
// 🖋️ INPUTS E BARRAS MÁGICAS (COM AUTO-SAVE)
// ==========================================
let globalTimer = null;
const callSave = () => {
    if (globalTimer) clearTimeout(globalTimer);
    globalTimer = setTimeout(() => {
        if (typeof salvarFirebaseImediato === 'function') salvarFirebaseImediato();
        else salvarFichaSilencioso();
    }, 400);
};

const CampoMagico = ({ valor, onChange, placeholder, styleExtra = {}, type = "text", isNumber = false }) => {
    const handleChange = (e) => {
        let val = e.target.value;
        if (isNumber && val !== '') { val = Number(val); if (isNaN(val)) val = 0; }
        onChange(val);
    };
    return (
        <input 
            type={type} value={valor !== undefined && valor !== null ? valor : ''} onChange={handleChange}
            onBlur={callSave} placeholder={placeholder}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', outline: 'none', padding: '0 5px', width: '100px', ...styleExtra }} 
        />
    );
};

const LabelMagico = ({ valor, onChange, fallback }) => (
    <input 
        type="text" value={valor !== undefined ? valor : fallback} onChange={(e) => onChange(e.target.value)} 
        onBlur={(e) => { e.target.style.borderBottom = '1px solid transparent'; callSave(); }}
        size={Math.max(String(valor !== undefined ? valor : fallback).length, 3)}
        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid transparent', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'bold', fontStyle: 'italic', outline: 'none', padding: '0', cursor: 'text', transition: '0.2s' }}
        onFocus={(e) => e.target.style.borderBottom = '1px dashed rgba(0,0,0,0.5)'} 
    />
);

const calcularEscala = (rawMax, key) => {
    if (!rawMax || isNaN(rawMax) || rawMax <= 0) return { mxDisplay: 0, pVit: 0 };
    const limit = (key === 'vida' || key === 'pv' || key === 'pm') ? 8 : 9;
    const strVal = String(Math.floor(rawMax));
    const pVit = Math.max(0, strVal.length - limit); 
    const mxDisplay = pVit > 0 ? Math.floor(rawMax / Math.pow(10, pVit)) : Math.floor(rawMax);
    return { mxDisplay: isNaN(mxDisplay) ? 0 : mxDisplay, pVit: isNaN(pVit) ? 0 : pVit };
};

const BarraVital = ({ atual, maximo, pVit, cor, corTexto = "#fff", onChangeAtual }) => {
    const pct = maximo > 0 ? Math.min(100, Math.max(0, (atual / maximo) * 100)) : 0;
    const isDark = corTexto === '#fff';
    return (
        <div style={{ position: 'relative', width: '100%', height: '35px', border: '2px solid rgba(0,0,0,0.8)', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: '5px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)', display: 'flex' }}>
            {pVit > 0 && (
                <div style={{ width: '35px', height: '100%', background: 'rgba(0,0,0,0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2em', borderRight: '2px solid rgba(0,0,0,0.8)', zIndex: 5, boxShadow: `inset 0 0 10px ${cor}` }}>{pVit}</div>
            )}
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: cor, transition: 'width 0.3s ease' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2em', color: corTexto, textShadow: isDark ? '1px 1px 3px #000, -1px -1px 3px #000' : 'none' }}>
                    <CampoMagico valor={atual} onChange={onChangeAtual} isNumber={true} styleExtra={{ width: '120px', textAlign: 'right', color: corTexto, textShadow: 'inherit', borderBottom: `1px dashed ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}` }} />
                    <span style={{ margin: '0 8px' }}>/</span><span>{Number(maximo).toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </div>
    );
};

const RadarDesenhado = ({ ficha, isAtual, corTinta = "#000000" }) => {
    const eixos = [
        { label: 'VIDA', key: 'vida' }, { label: 'MANA', key: 'mana' }, { label: 'AURA', key: 'aura' },
        { label: 'CHAKRA', key: 'chakra' }, { label: 'CORPO', key: 'corpo' }, { label: 'STATUS', key: 'status' }
    ];
    const angulos = Array.from({length: 6}).map((_, i) => Math.PI * 2 * i / 6 - Math.PI / 2);
    const ascensao = parseInt(ficha?.ascensaoBase) || 1;
    const rankInfos = [];

    const dataPoints = eixos.map((e, i) => {
        const baseP = getBasePFor(ficha, e.key);
        const pAtual = isAtual ? calcularPrestAtual(ficha, e.key, baseP) : baseP;
        const rank = safeGetRank(pAtual, ascensao);
        rankInfos.push(rank);

        let valNorm = pAtual || 0;
        if (valNorm >= 100) { valNorm = valNorm % 100; if (valNorm === 0 && pAtual > 0) valNorm = 100; }
        const frac = Math.min(Math.max(valNorm / 100, 0.05), 1);
        return `${100 + 75 * frac * Math.cos(angulos[i])},${100 + 75 * frac * Math.sin(angulos[i])}`;
    }).join(' ');

    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: '340px', height: 'auto', overflow: 'visible', dropShadow: '2px 2px 2px rgba(0,0,0,0.2)' }}>
            <g transform="translate(20, 20)">
                {[0.33, 0.66, 1.0].map((scale, i) => <polygon key={i} fill="none" stroke={hexToRgba(corTinta, 0.2)} strokeWidth="1" strokeDasharray="3" points={angulos.map(a => `${100 + 75 * scale * Math.cos(a)},${100 + 75 * scale * Math.sin(a)}`).join(' ')} />)}
                {angulos.map((a, i) => <line key={i} x1="100" y1="100" x2={100 + 75 * Math.cos(a)} y2={100 + 75 * Math.sin(a)} stroke={hexToRgba(corTinta, 0.2)} strokeWidth="1" strokeDasharray="3" />)}
                <polygon points={dataPoints} fill={hexToRgba(corTinta, isAtual ? 0.3 : 0.1)} stroke={corTinta} strokeWidth="2" strokeLinejoin="round" style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                {eixos.map((e, i) => {
                    const rk = rankInfos[i];
                    return (
                        <text key={i} x={100 + 105 * Math.cos(angulos[i])} y={100 + 105 * Math.sin(angulos[i])} textAnchor="middle" dominantBaseline="central" fill={rk.c} fontSize="11" fontWeight="bold" style={{ textShadow: `0 0 5px ${rk.c}`, fontStyle: 'italic', transition: 'fill 0.3s' }}>
                            [{rk.l}] A{rk.a} {e.label}
                        </text>
                    );
                })}
            </g>
        </svg>
    );
};

// ==========================================
// 📖 PAINEL PRINCIPAL (O GRIMÓRIO)
// ==========================================
export default function MarcadosPanel() {
    const minhaFicha = useStore(s => s.minhaFicha);
    const updateFicha = useStore(s => s.updateFicha);
    const meuNome = useStore(s => s.meuNome);
    const importarDaAbaStatus = useStore(s => s.importarDaAbaStatus);

    const [uploadingImg, setUploadingImg] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [textoImport, setTextoImport] = useState('');
    const [modalEstilo, setModalEstilo] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [salvando, setSalvando] = useState(false);

    // 🔥 MOTOR DA ANIMAÇÃO DE PÁGINAS FLUIDA 🔥
    const [animDirection, setAnimDirection] = useState('next');

    const [localCorFundo, setLocalCorFundo] = useState('#bba9d8');
    const [localCorTinta, setLocalCorTinta] = useState('#000000');

    useEffect(() => {
        if (minhaFicha) {
            setLocalCorFundo(minhaFicha.estetica?.diarioCor || '#bba9d8');
            setLocalCorTinta(minhaFicha.estetica?.corTintaRadar || '#000000');
        }
    }, [minhaFicha?.estetica?.diarioCor, minhaFicha?.estetica?.corTintaRadar]);

    if (!minhaFicha) return <div style={{ color: '#000', padding: 20, fontFamily: 'cursive' }}>Abrindo o Diário...</div>;

    const mudarPagina = (nova) => {
        setAnimDirection(nova > paginaAtual ? 'next' : 'prev');
        setPaginaAtual(nova);
    };

    const salvar = (caminho, valor) => {
        const valFinal = (valor === undefined || (isNaN(valor) && typeof valor === 'number')) ? null : valor;
        updateFicha(f => {
            const chaves = caminho.split('.');
            let atual = f;
            for (let i = 0; i < chaves.length - 1; i++) {
                if (typeof atual[chaves[i]] !== 'object' || atual[chaves[i]] === null) atual[chaves[i]] = {};
                atual = atual[chaves[i]];
            }
            atual[chaves[chaves.length - 1]] = valFinal;
        });
        callSave();
    };

    const handleColorChange = (key, val) => {
        if (key === 'diarioCor') setLocalCorFundo(val);
        else setLocalCorTinta(val);

        if (window.timerSaveCor) clearTimeout(window.timerSaveCor);
        window.timerSaveCor = setTimeout(() => {
            updateFicha(f => {
                if (!f.estetica) f.estetica = {};
                f.estetica[key] = val;
            });
            if (typeof salvarFirebaseImediato === 'function') salvarFirebaseImediato();
            else salvarFichaSilencioso();
        }, 800);
    };

    const handleTabelaChange = (k, tipo, valor) => {
        let numVal = Number(valor);
        if (isNaN(numVal)) numVal = 0;

        const divAtual = parseFloat(minhaFicha.divisores?.[k]) || 1;
        const prestAtual = getBasePFor(minhaFicha, k);

        let novoP = tipo === 'prestigio' ? numVal : prestAtual;
        let novoDiv = tipo === 'divisor' ? (numVal > 0 ? numVal : 1) : divAtual;

        const mults = { vida: 1000000, mana: 10000000, aura: 10000000, chakra: 10000000, corpo: 10000000, status: 1000 };
        const mult = mults[k] || 1;
        const novaBase = Math.floor((novoP / novoDiv) * mult);

        updateFicha(f => {
            if (f.overridePrestigio) f.overridePrestigio = null;

            if (tipo === 'divisor') {
                if (!f.divisores) f.divisores = {};
                f.divisores[k] = novoDiv;
            }
            if (tipo === 'prestigio') {
                if (k === 'status') {
                    ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'].forEach(s => {
                        if (!f[s]) f[s] = {};
                        f[s].base = novaBase;
                    });
                } else {
                    if (!f[k]) f[k] = {};
                    f[k].base = novaBase;
                }
            }
        });
        if (typeof salvarFirebaseImediato === 'function') salvarFirebaseImediato();
        else salvarFichaSilencioso();
    };

    const handleSalvarTudo = async () => {
        setSalvando(true);
        salvarFichaSilencioso();
        if (typeof salvarFirebaseImediato === 'function') await salvarFirebaseImediato();
        setTimeout(() => setSalvando(false), 1500);
    };

    const getLabel = (key, fallback) => minhaFicha.labels?.[key] !== undefined ? minhaFicha.labels[key] : fallback;
    const setLabel = (key, val) => salvar(`labels.${key}`, val);
    const fonteDiario = minhaFicha.estetica?.diarioFonte || '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive';

    const getSupremas = () => {
        const pVida = getBasePFor(minhaFicha, 'vida');
        const pChakra = getBasePFor(minhaFicha, 'chakra');
        const pCorpo = getBasePFor(minhaFicha, 'corpo');
        const pMana = getBasePFor(minhaFicha, 'mana');
        const pAura = getBasePFor(minhaFicha, 'aura');
        const pStatus = getBasePFor(minhaFicha, 'status');
        
        const mPV = parseFloat(minhaFicha.multiplicadorVida) || 1;
        const mPM = parseFloat(minhaFicha.multiplicadorMorte) || 1;
        
        const ascensao = parseInt(minhaFicha.ascensaoBase) || 1;
        const bonusAscensao = (ascensao - 1) * 100;
        
        const pvCalculado = Math.floor(((pVida + pChakra + pCorpo) / 3) * mPV) + bonusAscensao;
        const pmCalculado = Math.floor(((pMana + pAura + pStatus) / 3) * mPM) + bonusAscensao;

        return { pvMax: isNaN(pvCalculado) ? 1 : pvCalculado, pmMax: isNaN(pmCalculado) ? 1 : pmCalculado };
    };
    const { pvMax, pmMax } = getSupremas();

    const handleRegenerarTudo = () => {
        if (!window.confirm('Recuperar toda a Vida, Energias, Pontos e Ações de Turno?')) return;
        updateFicha(f => {
            ['vida', 'mana', 'aura', 'chakra', 'corpo'].forEach(k => {
                let mx = 0;
                try { mx = getMaximo(minhaFicha, k); } catch(e) { mx = minhaFicha[k]?.base || 0; }
                const { mxDisplay } = calcularEscala(mx, k);
                if (!f[k]) f[k] = {};
                f[k].atual = isNaN(mxDisplay) ? 0 : mxDisplay;
            });
            if (!f.pv) f.pv = {}; f.pv.atual = isNaN(pvMax) ? 0 : pvMax;
            if (!f.pm) f.pm = {}; f.pm.atual = isNaN(pmMax) ? 0 : pmMax;
            
            ['padrao', 'bonus', 'reacao'].forEach(tipo => {
                if (!f.acoes) f.acoes = {};
                if (!f.acoes[tipo]) f.acoes[tipo] = { max: 1, atual: 1 };
                f.acoes[tipo].atual = f.acoes[tipo].max;
            });
        });
        if (typeof salvarFirebaseImediato === 'function') salvarFirebaseImediato();
        else salvarFichaSilencioso();
    };

    const LinhaVital = ({ labelKey, fallbackLabel, vitalKey, subItens, corBarra, corTextoBarra = '#fff' }) => {
        const [aberto, setAberta] = useState(false);
        let rawMaximo = 0;
        try { rawMaximo = getMaximo(minhaFicha, vitalKey); } catch(e) { rawMaximo = minhaFicha[vitalKey]?.base || 0; }
        if (isNaN(rawMaximo)) rawMaximo = 0;
        
        const { mxDisplay, pVit } = calcularEscala(rawMaximo, vitalKey);
        
        let atual = minhaFicha[vitalKey]?.atual;
        if (atual === undefined || atual === null || atual === '') atual = mxDisplay; else atual = Number(atual);
        if (isNaN(atual)) atual = mxDisplay;
        if (atual > mxDisplay) atual = mxDisplay;

        return (
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2em' }}>
                    {subItens && <span onClick={() => setAberta(!aberto)} style={{ cursor: 'pointer', width: '20px', display: 'inline-block', userSelect: 'none', fontWeight: 'bold' }}>{aberto ? 'v ' : '> '}</span>}
                    <LabelMagico valor={getLabel(labelKey, fallbackLabel)} onChange={(v) => setLabel(labelKey, v)} />
                </div>
                <BarraVital atual={atual} maximo={mxDisplay} pVit={pVit} cor={corBarra} corTexto={corTextoBarra} onChangeAtual={(v) => salvar(`${vitalKey}.atual`, v)} />
                {aberto && subItens && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '35px', marginTop: '12px' }}>
                        {subItens.map(sub => (
                            <div key={sub.labelKey} style={{ fontSize: '1.05em', display: 'flex', alignItems: 'center' }}>
                                <LabelMagico valor={getLabel(sub.labelKey, sub.fallbackLabel)} onChange={(v) => setLabel(sub.labelKey, v)} />
                                <span style={{ fontWeight: 'bold', fontStyle: 'italic', margin: '0 5px' }}>: (</span>
                                <CampoMagico valor={minhaFicha[sub.key]?.base || ''} onChange={(v) => salvar(`${sub.key}.base`, v)} styleExtra={{ width: '90px' }} isNumber={true} type="number" />
                                <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>)</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const LinhaAtributoCru = ({ labelKey, fallbackLabel, attrKey, isAtual }) => {
        const baseVal = minhaFicha[attrKey]?.base || '';
        let maxVal = 0;
        try { maxVal = getMaximo(minhaFicha, attrKey); } catch(e) { maxVal = baseVal; }
        if (isNaN(maxVal)) maxVal = 0;

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted rgba(0,0,0,0.2)', padding: '6px 0', fontSize: '1.1em' }}>
                <LabelMagico valor={getLabel(labelKey, fallbackLabel)} onChange={(v) => setLabel(labelKey, v)} />
                {isAtual ? <span style={{ fontWeight: 'bold' }}>{Number(maxVal).toLocaleString('pt-BR')}</span> : <CampoMagico valor={baseVal} onChange={(v) => salvar(`${attrKey}.base`, v)} styleExtra={{ width: '100px', textAlign: 'right', fontWeight: 'bold' }} type="number" isNumber={true} />}
            </div>
        );
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadingImg(true);
        try {
            const url = await uploadImagem(file, `avatars/${meuNome || 'desconhecido'}`);
            updateFicha(f => { if (!f.avatar) f.avatar = { base: "" }; f.avatar.base = url; });
            if (typeof salvarFirebaseImediato === 'function') await salvarFirebaseImediato();
        } catch (err) { alert('Erro ao pintar o avatar!'); } 
        finally { setUploadingImg(false); }
    };

    const executarImportacao = () => {
        if (!textoImport.trim()) return alert("Cole o texto do Google Docs primeiro!");
        importarDaAbaStatus(textoImport);
        setModalImport(false);
        setTextoImport('');
        alert("O seu diário foi sincronizado!");
    };

    return (
        <div style={{ 
            width: '100%', minHeight: '85vh', background: localCorFundo, color: '#000', fontFamily: fonteDiario, 
            padding: '40px 40px 80px 40px', borderRadius: '12px', position: 'relative', transition: 'background 0.3s ease',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
            overflowX: 'hidden'
        }}>
            
            {/* 🌟 MAGIAS CSS DA ANIMAÇÃO FLUIDA E DO GRIMÓRIO 🌟 */}
            <style>{`
                .swoop-container {
                    transform-style: preserve-3d;
                }
                
                /* Animação suave deslizando e curvando como a página de um livro real */
                @keyframes pageSwoopNext {
                    0% { transform: perspective(1500px) rotateY(-15deg) translateX(30px) scale(0.98); opacity: 0; }
                    100% { transform: perspective(1500px) rotateY(0deg) translateX(0) scale(1); opacity: 1; }
                }
                @keyframes pageSwoopPrev {
                    0% { transform: perspective(1500px) rotateY(15deg) translateX(-30px) scale(0.98); opacity: 0; }
                    100% { transform: perspective(1500px) rotateY(0deg) translateX(0) scale(1); opacity: 1; }
                }
                
                .page-swoop-next { animation: pageSwoopNext 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .page-swoop-prev { animation: pageSwoopPrev 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

                /* 🌟 A ILUSÃO DO GRIMÓRIO PARA A PÁGINA DOS PODERES 🌟 */
                .grimorio-estilo-papel {
                    --tinta: ${localCorTinta};
                    --fundo: ${localCorFundo};
                    color: var(--tinta) !important;
                }
                .grimorio-estilo-papel * {
                    font-family: ${fonteDiario}, 'Courier New', serif !important;
                    text-shadow: none !important;
                    box-shadow: none !important;
                }
                
                /* Transformar as Caixas Neon em Caixas de Papel Desenhadas à Mão */
                .grimorio-estilo-papel .def-box,
                .grimorio-estilo-papel [style*="background: rgba"] {
                    background: transparent !important;
                    border: 2px solid var(--tinta) !important;
                    border-radius: 2px 255px 3px 25px / 255px 5px 225px 3px !important; 
                    position: relative;
                }
                
                /* Sobreposição translúcida para não ficar invisível, mas sem perder o ar de papel */
                .grimorio-estilo-papel .def-box::before,
                .grimorio-estilo-papel [style*="background: rgba"]::before {
                    content: ''; position: absolute; top:0; left:0; right:0; bottom:0;
                    background: var(--tinta); opacity: 0.03; pointer-events: none;
                    border-radius: inherit;
                }

                .grimorio-estilo-papel h2, .grimorio-estilo-papel h3, .grimorio-estilo-papel h4 {
                    color: var(--tinta) !important;
                    display: inline-block;
                }

                /* Botões no estilo Grimório */
                .grimorio-estilo-papel button {
                    background: transparent !important;
                    border: 2px dashed var(--tinta) !important;
                    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px !important;
                    color: var(--tinta) !important;
                    font-weight: bold !important;
                    text-transform: uppercase !important;
                    transition: all 0.2s ease !important;
                }
                .grimorio-estilo-papel button:hover {
                    background: var(--tinta) !important;
                    color: var(--fundo) !important;
                    border-style: solid !important;
                    transform: scale(1.02) rotate(-1deg) !important;
                }

                /* Inputs em linha de tinta */
                .grimorio-estilo-papel input, .grimorio-estilo-papel textarea, .grimorio-estilo-papel select {
                    background: rgba(0,0,0,0.03) !important;
                    border: none !important;
                    border-bottom: 2px dotted var(--tinta) !important;
                    color: var(--tinta) !important;
                    border-radius: 0 !important;
                }
                .grimorio-estilo-papel input:focus, .grimorio-estilo-papel textarea:focus {
                    background: rgba(0,0,0,0.06) !important;
                    border-bottom: 2px solid var(--tinta) !important;
                }
                .grimorio-estilo-papel input::placeholder, .grimorio-estilo-papel textarea::placeholder {
                    color: var(--tinta) !important;
                    opacity: 0.5 !important;
                    font-style: italic !important;
                }

                /* Aniquilar as cores Neon específicas do código original */
                .grimorio-estilo-papel span[style*="color: #0ff"],
                .grimorio-estilo-papel span[style*="color: #0f0"],
                .grimorio-estilo-papel span[style*="color: #ff003c"],
                .grimorio-estilo-papel span[style*="color: #ffcc00"],
                .grimorio-estilo-papel span[style*="color: #ff8800"],
                .grimorio-estilo-papel span[style*="color: #00ccff"],
                .grimorio-estilo-papel div[style*="color: #ff00ff"] {
                    color: var(--tinta) !important;
                }
                
                /* Tira a barra lateral e transforma num índice de livro */
                .grimorio-estilo-papel .poderes-sidebar .def-box {
                    border: none !important;
                    border-right: 2px dashed var(--tinta) !important;
                    border-radius: 0 !important;
                }
            `}</style>

            {/* 📌 CONTROLES SUPERIORES */}
            <div style={{ position: 'absolute', top: '-15px', right: '30px', zIndex: 10, display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                    <button onClick={handleSalvarTudo} style={{ background: salvando ? '#a5d6a7' : '#4caf50', color: '#fff', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(1deg)' }}>
                        {salvando ? '✅ Guardado!' : '💾 Guardar Diário'}
                    </button>
                </div>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setModalEstilo(!modalEstilo); setModalImport(false); }} style={{ background: '#ff94c2', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(-2deg)' }}>🎨 Estilo</button>
                    {modalEstilo && (
                        <div className="fade-in" style={{ position: 'absolute', top: '50px', right: '0', background: '#ffe4f0', padding: '15px', border: '1px solid #ccc', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', width: '250px', zIndex: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px' }}>Cor do Papel:</label>
                            <input 
                                type="color" value={localCorFundo} 
                                onChange={(e) => handleColorChange('diarioCor', e.target.value)} 
                                style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer', marginBottom: '15px', background: 'transparent' }} 
                            />
                            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px' }}>Cor da Tinta (Radar):</label>
                            <input 
                                type="color" value={localCorTinta} 
                                onChange={(e) => handleColorChange('corTintaRadar', e.target.value)} 
                                style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer', marginBottom: '15px', background: 'transparent' }} 
                            />
                            <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px' }}>Fonte da Letra:</label>
                            <select value={fonteDiario} onChange={(e) => { salvar('estetica.diarioFonte', e.target.value); callSave(); }} style={{ width: '100%', padding: '8px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', fontFamily: 'inherit' }}>
                                <option value='"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive'>✏️ Escrito à Mão</option>
                                <option value="'Courier New', Courier, monospace">🖨️ Máquina de Escrever</option>
                                <option value="'Times New Roman', Times, serif">📖 Grimório Clássico</option>
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setModalImport(!modalImport); setModalEstilo(false); }} style={{ background: '#ffeb3b', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)', transform: 'rotate(2deg)' }}>📌 Importar</button>
                    {modalImport && (
                        <div className="fade-in" style={{ position: 'absolute', top: '50px', right: '0', background: '#fff9c4', padding: '15px', border: '1px solid #ccc', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', width: '300px', zIndex: 20 }}>
                            <textarea value={textoImport} onChange={e => setTextoImport(e.target.value)} placeholder="Cole do Docs..." style={{ width: '100%', height: '100px', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
                            <button onClick={executarImportacao} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '8px', marginTop: '10px', fontFamily: 'inherit', cursor: 'pointer' }}>Sincronizar ✍️</button>
                        </div>
                    )}
                </div>
            </div>

            {/* 📖 CONTEÚDO ANIMADO DO LIVRO (NOVO SWOOP) */}
            <div key={paginaAtual} className={`swoop-container ${animDirection === 'next' ? 'page-swoop-next' : 'page-swoop-prev'}`} style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '40px', paddingBottom: '30px' }}>
                
                {/* ======================= PÁGINA 1 ======================= */}
                {paginaAtual === 1 && (
                    <>
                        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '2px solid rgba(0,0,0,0.8)', paddingBottom: '5px', marginBottom: '10px', width: 'fit-content' }}>
                                <span style={{ fontSize: '3.5em', fontStyle: 'italic', fontWeight: 'bold', margin: 0 }}>/</span>
                                <CampoMagico valor={minhaFicha.bio?.apelido !== undefined ? minhaFicha.bio.apelido : meuNome} onChange={(v) => salvar('bio.apelido', v)} placeholder="Nome" styleExtra={{ fontSize: '3.5em', fontStyle: 'italic', fontWeight: 'bold', minWidth: '300px', width: 'auto', borderBottom: 'none' }} />
                                <span style={{ fontSize: '3.5em', fontStyle: 'italic', fontWeight: 'bold', margin: 0 }}>©</span>
                            </div>
                            <h2 style={{ fontSize: '2.2em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
                                <LabelMagico valor={getLabel('tituloLv', '- Limite quebrado - LV')} onChange={(v) => setLabel('tituloLv', v)} />
                                <CampoMagico valor={minhaFicha.bio?.nivel} onChange={(v) => salvar('bio.nivel', v)} styleExtra={{ width: '60px', borderBottom: 'none', marginLeft: '10px' }} isNumber={true} type="number" />
                            </h2>

                            {/* 🔥 LAYOUT CLÁSSICO E ALINHADO DA BIO RESTAURADO NA PERFEIÇÃO! */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '1.2em' }}>
                                {[
                                    { k: 'idade', lbl: 'Idade' },
                                    { k: 'aniversario', lbl: 'Aniversário' },
                                    { k: 'alturaPeso', lbl: 'Altura / Peso' },
                                    { k: 'raca', lbl: 'Raça' },
                                    { k: 'alinhamento', lbl: 'Alinhamento' },
                                    { k: 'afiliacao', lbl: 'Afiliação' },
                                    { k: 'classe', lbl: 'Classe' }
                                ].map(item => (
                                    <div key={item.k} style={{ display: 'flex' }}>
                                        <div style={{ width: '140px', fontWeight: 'bold' }}>
                                            <LabelMagico valor={getLabel(`bio_${item.k}`, item.lbl)} onChange={(v) => setLabel(`bio_${item.k}`, v)} />
                                        </div>
                                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>:</span>
                                        <CampoMagico valor={minhaFicha.bio?.[item.k]} onChange={(v) => salvar(`bio.${item.k}`, v)} styleExtra={{ flex: 1, borderBottom: '1px dotted rgba(0,0,0,0.3)' }} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '20px', width: 'fit-content', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <label style={{ cursor: 'pointer', display: 'block' }}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                                    {uploadingImg ? <div style={{ width: '320px', height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #000' }}>✍️...</div> : minhaFicha.avatar?.base ? <img src={minhaFicha.avatar.base} alt="Avatar" style={{ width: '320px', height: 'auto', objectFit: 'cover', border: '2px solid rgba(0,0,0,0.8)', boxShadow: '8px 8px 0px rgba(0,0,0,0.2)' }} /> : <div style={{ width: '320px', height: '480px', border: '2px dashed #000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', background: 'rgba(255,255,255,0.1)' }}>Colar Fotografia Aqui 📸</div>}
                                </label>
                                {minhaFicha.avatar?.base && <button onClick={() => {if(window.confirm('Apagar?')) { updateFicha(f => {f.avatar.base = ""}); callSave(); } }} style={{ background: 'transparent', border: '1px dashed #ff003c', color: '#ff003c', marginTop: '10px', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', width: 'fit-content' }}>🗑️ Remover Foto</button>}
                            </div>
                        </div>

                        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 5px' }}>
                                <h2 style={{ fontSize: '2em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, display: 'flex' }}>
                                    <LabelMagico valor={getLabel('tituloBase', '> STATUS PRINCIPAIS')} onChange={(v) => setLabel('tituloBase', v)} />
                                </h2>
                                <button onClick={handleRegenerarTudo} style={{ background: 'rgba(255,255,255,0.4)', border: '2px solid rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }} title="Recuperar toda a Vida, Energias e Ações">
                                    <span>💖</span> Descansar
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <LinhaVital labelKey="lblVida" fallbackLabel="Vida (HP)" vitalKey="vida" corBarra="#ff0000" />
                                <LinhaVital labelKey="lblMana" fallbackLabel="Mana" vitalKey="mana" corBarra="#0000ff" subItens={[ { labelKey: 'lblInt', fallbackLabel: 'Inteligência', key: 'inteligencia' }, { labelKey: 'lblSab', fallbackLabel: 'Sabedoria', key: 'sabedoria' } ]} />
                                <LinhaVital labelKey="lblAura" fallbackLabel="Aura" vitalKey="aura" corBarra="#aa00ff" subItens={[ { labelKey: 'lblEsp', fallbackLabel: 'Energia Espiritual', key: 'energiaEsp' }, { labelKey: 'lblCar', fallbackLabel: 'Carisma', key: 'carisma' } ]} />
                                <LinhaVital labelKey="lblChakra" fallbackLabel="Chakra" vitalKey="chakra" corBarra="#00cc00" subItens={[ { labelKey: 'lblSta', fallbackLabel: 'Stamina', key: 'stamina' }, { labelKey: 'lblCon', fallbackLabel: 'Constituição', key: 'constituicao' } ]} />
                                <LinhaVital labelKey="lblCorpo" fallbackLabel="Corpo" vitalKey="corpo" corBarra="#000000" corTextoBarra="#fff" subItens={[ { labelKey: 'lblDes', fallbackLabel: 'Destreza', key: 'destreza' }, { labelKey: 'lblFor', fallbackLabel: 'Força', key: 'forca' } ]} />
                            </div>

                            <h2 style={{ fontSize: '1.6em', fontStyle: 'italic', fontWeight: 'bold', margin: '20px 0 10px 5px', display: 'flex' }}>
                                <LabelMagico valor={getLabel('tituloPrimordial', '> ENERGIAS PRIMORDIAIS')} onChange={(v) => setLabel('tituloPrimordial', v)} />
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ marginBottom: '5px' }}>
                                    <LabelMagico valor={getLabel('lblPV', 'Pontos Vitais (PV)')} onChange={(v) => setLabel('lblPV', v)} />
                                    <BarraVital atual={minhaFicha.pv?.atual !== undefined && minhaFicha.pv?.atual !== '' ? Number(minhaFicha.pv.atual) : pvMax} maximo={pvMax} pVit={0} cor="#ffffff" corTexto="#000" onChangeAtual={(v) => salvar('pv.atual', v)} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <LabelMagico valor={getLabel('lblPM', 'Pontos Mortais (PM)')} onChange={(v) => setLabel('lblPM', v)} />
                                    <BarraVital atual={minhaFicha.pm?.atual !== undefined && minhaFicha.pm?.atual !== '' ? Number(minhaFicha.pm.atual) : pmMax} maximo={pmMax} pVit={0} cor="#000000" corTexto="#fff" onChangeAtual={(v) => salvar('pm.atual', v)} />
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                    <div style={{ flex: 1, border: '2px solid rgba(0,0,0,0.8)', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}>
                                        <div style={{ fontSize: '0.8em', fontWeight: 'bold', textTransform: 'uppercase' }}><LabelMagico valor={getLabel('lblMultV', 'Mult. de Vida (PV)')} onChange={(v) => setLabel('lblMultV', v)} /></div>
                                        <CampoMagico valor={minhaFicha.multiplicadorVida || 1} onChange={(v) => salvar('multiplicadorVida', v)} type="number" isNumber={true} styleExtra={{ width: '100%', borderBottom: '1px solid rgba(0,0,0,0.5)', marginTop: '5px' }} />
                                    </div>
                                    <div style={{ flex: 1, border: '2px solid rgba(0,0,0,0.8)', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}>
                                        <div style={{ fontSize: '0.8em', fontWeight: 'bold', textTransform: 'uppercase' }}><LabelMagico valor={getLabel('lblMultM', 'Mult. de Morte (PM)')} onChange={(v) => setLabel('lblMultM', v)} /></div>
                                        <CampoMagico valor={minhaFicha.multiplicadorMorte || 1} onChange={(v) => salvar('multiplicadorMorte', v)} type="number" isNumber={true} styleExtra={{ width: '100%', borderBottom: '1px solid rgba(0,0,0,0.5)', marginTop: '5px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', border: '2px dashed rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', position: 'relative' }}>
                                <span style={{ position: 'absolute', top: '-15px', left: '20px', background: localCorFundo, padding: '0 10px', fontSize: '1.2em', transition: 'background 0.2s ease' }}>
                                    <LabelMagico valor={getLabel('tituloTurno', 'Ações de Turno')} onChange={(v) => setLabel('tituloTurno', v)} />
                                </span>
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px' }}>
                                    {['padrao', 'bonus', 'reacao'].map(tipo => {
                                        const acao = minhaFicha.acoes?.[tipo] || { max: 1, atual: 1 };
                                        return (
                                            <div key={tipo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.1em' }}><LabelMagico valor={getLabel(`acao_${tipo}`, tipo.toUpperCase())} onChange={(v) => setLabel(`acao_${tipo}`, v)} /></span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {Array.from({ length: acao.max }).map((_, i) => (
                                                        <div key={i} onClick={() => { salvar(`acoes.${tipo}.atual`, i >= acao.atual ? acao.atual + 1 : acao.atual - 1); callSave(); }}
                                                            style={{ width: '25px', height: '25px', border: '2px solid #000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2em', color: '#ff003c', background: 'rgba(255,255,255,0.2)' }}>
                                                            {i >= acao.atual ? 'X' : ''}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ======================= PÁGINA 2 ======================= */}
                {paginaAtual === 2 && (
                    <>
                        <div style={{ width: '100%', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.8)', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, letterSpacing: '-1px' }}>
                                <LabelMagico valor={getLabel('tituloAnalise', 'Análise de Poder')} onChange={(v) => setLabel('tituloAnalise', v)} />
                            </h1>
                        </div>

                        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: '15px', border: '1px dashed rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '2em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0' }}><LabelMagico valor={getLabel('tituloAnaliseBase', 'Status (Rank Base)')} onChange={(v) => setLabel('tituloAnaliseBase', v)} /></h2>
                            <RadarDesenhado ficha={minhaFicha} isAtual={false} corTinta={localCorTinta} />
                            
                            <div style={{ width: '100%', maxWidth: '300px', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <LinhaAtributoCru labelKey="lblFor" fallbackLabel="Força" attrKey="forca" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblDes" fallbackLabel="Destreza" attrKey="destreza" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblInt" fallbackLabel="Inteligência" attrKey="inteligencia" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblSab" fallbackLabel="Sabedoria" attrKey="sabedoria" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblEsp" fallbackLabel="Energia Espiritual" attrKey="energiaEsp" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblCar" fallbackLabel="Carisma" attrKey="carisma" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblSta" fallbackLabel="Stamina" attrKey="stamina" isAtual={false} />
                                <LinhaAtributoCru labelKey="lblCon" fallbackLabel="Constituição" attrKey="constituicao" isAtual={false} />
                            </div>
                        </div>

                        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '20px', borderRadius: '15px', border: '2px solid rgba(0,0,0,0.8)' }}>
                            <h2 style={{ fontSize: '2em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0' }}><LabelMagico valor={getLabel('tituloAnaliseAtual', 'Poder Atual (c/ Formas)')} onChange={(v) => setLabel('tituloAnaliseAtual', v)} /></h2>
                            <RadarDesenhado ficha={minhaFicha} isAtual={true} corTinta={localCorTinta} />
                            
                            <div style={{ width: '100%', maxWidth: '300px', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <LinhaAtributoCru labelKey="lblFor" fallbackLabel="Força" attrKey="forca" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblDes" fallbackLabel="Destreza" attrKey="destreza" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblInt" fallbackLabel="Inteligência" attrKey="inteligencia" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblSab" fallbackLabel="Sabedoria" attrKey="sabedoria" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblEsp" fallbackLabel="Energia Espiritual" attrKey="energiaEsp" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblCar" fallbackLabel="Carisma" attrKey="carisma" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblSta" fallbackLabel="Stamina" attrKey="stamina" isAtual={true} />
                                <LinhaAtributoCru labelKey="lblCon" fallbackLabel="Constituição" attrKey="constituicao" isAtual={true} />
                            </div>
                        </div>

                        {/* 🔥 TABELA SUPREMA DE ASCENSÃO E DIVISORES */}
                        <div style={{ width: '100%', marginTop: '30px', background: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: '15px', border: '1px dashed rgba(0,0,0,0.2)' }}>
                            <h2 style={{ fontSize: '1.8em', fontStyle: 'italic', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'center' }}>Mecânicas de Ascensão e Divisores</h2>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Ascensão Base (Nível):</span>
                                    <CampoMagico valor={minhaFicha.ascensaoBase || 1} onChange={(v) => salvar('ascensaoBase', v)} type="number" isNumber={true} styleExtra={{ width: '60px', textAlign: 'center', color: '#fff', borderBottom: '1px dashed #fff', fontSize: '1.2em' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                {['vida', 'mana', 'aura', 'chakra', 'corpo', 'status'].map(k => {
                                    const displayP = getBasePFor(minhaFicha, k);
                                    const divisor = minhaFicha.divisores?.[k] || 1;

                                    return (
                                        <div key={k} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold', color: '#000', fontSize: '1.1em' }}>{k.toUpperCase()}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' }}>
                                                    <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Divisor:</span>
                                                    <CampoMagico valor={divisor} onChange={v => handleTabelaChange(k, 'divisor', v)} type="number" isNumber={true} styleExtra={{ width: '50px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.3)', borderRadius: '4px', background: 'rgba(255,255,255,0.5)' }} />
                                                </div>
                                            </div>
                                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.85)', borderRadius: '6px', padding: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                                <CampoMagico 
                                                    valor={displayP} 
                                                    onChange={v => handleTabelaChange(k, 'prestigio', v)} 
                                                    type="number" 
                                                    isNumber={true} 
                                                    styleExtra={{ width: '100%', textAlign: 'center', color: '#fff', borderBottom: 'none', fontSize: '1.4em', fontWeight: 'bold' }} 
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ======================= PÁGINA 3 ======================= */}
                {paginaAtual === 3 && (
                    <div className="grimorio-estilo-papel" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '3em', fontStyle: 'italic', fontWeight: 'bold', margin: 0, paddingBottom: '10px', borderBottom: `2px dashed ${localCorTinta}` }}>
                                <LabelMagico valor={getLabel('tituloPg3', 'O Grimório Místico')} onChange={(v) => setLabel('tituloPg3', v)} />
                            </h1>
                        </div>
                        
                        {/* 🌟 O SISTEMA DE PODERES COM A NOVA MÁSCARA CSS! 🌟 */}
                        <PoderesPanel />
                    </div>
                )}

            </div>

            {/* BOTÕES DE NAVEGAÇÃO DA PÁGINA */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', fontFamily: 'inherit' }}>
                <button onClick={() => mudarPagina(Math.max(1, paginaAtual - 1))} disabled={paginaAtual === 1} style={{ background: 'transparent', border: 'none', fontSize: '1.2em', fontWeight: 'bold', cursor: paginaAtual === 1 ? 'default' : 'pointer', opacity: paginaAtual === 1 ? 0.3 : 1, fontFamily: 'inherit' }}>⮜ Anterior</button>
                <span style={{ fontSize: '1.1em', fontWeight: 'bold', borderBottom: '2px solid rgba(0,0,0,0.5)', padding: '0 10px' }}>Página {paginaAtual} de 3</span>
                <button onClick={() => mudarPagina(Math.min(3, paginaAtual + 1))} disabled={paginaAtual === 3} style={{ background: 'transparent', border: 'none', fontSize: '1.2em', fontWeight: 'bold', cursor: paginaAtual === 3 ? 'default' : 'pointer', opacity: paginaAtual === 3 ? 0.3 : 1, fontFamily: 'inherit' }}>Próxima ⮞</button>
            </div>

        </div>
    );
}