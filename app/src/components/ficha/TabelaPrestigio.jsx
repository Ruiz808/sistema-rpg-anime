import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo } from '../../core/attributes.js';
import { getPrestigioReal, calcPAtual, getRank, getDivisorPara } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

// --- SAFE MATH HELPERS ---
const safeFn = (fn, fallback) => (...args) => {
    if (typeof fn !== 'function') return fallback;
    try { 
        const res = fn(...args);
        return (res !== undefined && res !== null && !Number.isNaN(res)) ? res : fallback;
    } catch (e) { return fallback; }
};

const safeGetMaximo = safeFn(getMaximo, 1);
const safeGetPrestigioReal = safeFn(getPrestigioReal, 0);
const safeCalcPAtual = safeFn(calcPAtual, { valor: 0 });
const safeGetRank = safeFn(getRank, { l: 'F', c: '#ffffff', a: 1 });
const safeGetDivisorPara = safeFn(getDivisorPara, 'Padrão');

// Eixos que afetam diretamente o Radar no Status
const VITALS_KEYS = ['vida', 'mana', 'aura', 'chakra', 'corpo', 'alma'];
const VITALS_LABELS = ['VIDA', 'MANA', 'AURA', 'CHAKRA', 'CORPO', 'STATUS'];

export default function TabelaPrestigio() {
    const ficha = useStore((s) => s.minhaFicha);
    const updateFicha = useStore((s) => s.updateFicha);
    const [statusBotao, setStatusBotao] = useState('idle');

    const handleSalvarPrestigio = async () => {
        setStatusBotao('saving');
        try {
            await salvarFichaSilencioso();
            setStatusBotao('saved');
            setTimeout(() => setStatusBotao('idle'), 2500);
        } catch (error) {
            console.error("Falha ao salvar:", error);
            setStatusBotao('idle');
        }
    };

    if (!ficha) return null;

    return (
        <div className="tabela-prestigio-module" style={{ marginTop: '20px' }}>
            <h3 className="section-title-mint-spaced" style={{ color: '#fff', fontSize: '1.2em', marginTop: 0 }}>
                &gt; SISTEMA DE PRESTÍGIO E ASCENSÃO (CULTIVAÇÃO)
            </h3>
            
            <div className="grid-2col" style={{ marginBottom: '15px' }}>
                {/* PRESTÍGIO BASE */}
                <div className="tabela-prestigio">
                    <h4 className="prestige-title-base">PRESTÍGIO BASE</h4>
                    <div className="prestige-ascension-box">
                        <label className="text-white-md" style={{ display: 'block', marginBottom: '5px' }}>Ascensão Base (Nível):</label>
                        <input 
                            type="number" 
                            className="prestige-input-base" 
                            value={ficha.ascensaoBase || 0} 
                            onChange={(e) => {
                                updateFicha(f => { f.ascensaoBase = Number(e.target.value) });
                            }} 
                        />
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_KEYS.map((attrKey, i) => {
                            const rawMax = safeGetMaximo(ficha, attrKey);
                            const calcBaseP = safeGetPrestigioReal(attrKey, rawMax); 
                            const baseP = ficha[attrKey]?.prestigioBase !== undefined && ficha[attrKey]?.prestigioBase !== null 
                                ? ficha[attrKey].prestigioBase 
                                : calcBaseP;
                            
                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span>Divisor: <input 
                                            type="number" 
                                            className="divisor-mini-input" 
                                            value={ficha[attrKey]?.divisorCustom || ''} 
                                            placeholder={String(safeGetDivisorPara(attrKey) || 'Padrão')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateFicha(f => { 
                                                    if(!f[attrKey]) f[attrKey] = {};
                                                    f[attrKey].divisorCustom = val ? Number(val) : null;
                                                });
                                            }}
                                        /></span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="prestige-input-base" 
                                        value={baseP === undefined ? '' : baseP} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            updateFicha(f => {
                                                if(!f[attrKey]) f[attrKey] = {};
                                                f[attrKey].prestigioBase = val === '' ? null : Number(val);
                                            });
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PRESTÍGIO ATUAL */}
                <div className="tabela-prestigio atual">
                    <h4 className="prestige-title-atual">PRESTÍGIO ATUAL</h4>
                    <div className="prestige-ascension-box">
                        <label className="text-white-md" style={{ display: 'block', marginBottom: '5px' }}>Ascensão Efetiva:</label>
                        <div className="prestige-display-atual">{ficha.ascensaoBase || 0}</div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_KEYS.map((attrKey, i) => {
                            const rawMax = safeGetMaximo(ficha, attrKey);
                            const calcBaseP = safeGetPrestigioReal(attrKey, rawMax);
                            const baseP = ficha[attrKey]?.prestigioBase !== undefined && ficha[attrKey]?.prestigioBase !== null 
                                ? ficha[attrKey].prestigioBase 
                                : calcBaseP;
                            const pAtualObj = safeCalcPAtual(ficha, attrKey, baseP);
                            const rankInfo = safeGetRank(pAtualObj.valor, ficha.ascensaoBase || 0);

                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span style={{ color: rankInfo.c || '#fff', fontWeight: 'bold' }}>Rank {rankInfo.l || 'F'}</span>
                                    </div>
                                    <div className="prestige-display-atual">
                                        {Math.floor(pAtualObj.valor || 0).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button 
                className={`btn-neon ${statusBotao === 'saved' ? 'btn-green' : 'btn-blue'}`} 
                onClick={handleSalvarPrestigio} 
                disabled={statusBotao === 'saving'}
                style={{ width: '100%', marginBottom: '30px', height: '50px', transition: 'all 0.3s ease' }}
            >
                {statusBotao === 'idle' && '💾 SALVAR ALTERAÇÕES DE PRESTÍGIO'}
                {statusBotao === 'saving' && '⏳ ENVIANDO PARA A FORJA (FIREBASE)...'}
                {statusBotao === 'saved' && '✅ PRESTÍGIOS SALVOS COM SUCESSO!'}
            </button>
        </div>
    );
}