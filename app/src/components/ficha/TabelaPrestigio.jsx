import React, { useState } from 'react';
import useStore from '../../stores/useStore';
import { getRawBase } from '../../core/attributes.js';
import { getPrestigioReal, getRank } from '../../core/prestige.js';
import { salvarFichaSilencioso } from '../../services/firebase-sync.js';

// --- SAFE MATH HELPERS ---
const safeFn = (fn, fallback) => (...args) => {
    if (typeof fn !== 'function') return fallback;
    try { 
        const res = fn(...args);
        return (res !== undefined && res !== null && !Number.isNaN(res)) ? res : fallback;
    } catch (e) { return fallback; }
};

const safeGetRawBase = safeFn(getRawBase, 0);
const safeGetPrestigioReal = safeFn(getPrestigioReal, 0);
const safeGetRank = safeFn(getRank, { l: 'F', c: '#ffffff', a: 1 });

const VITALS_KEYS = ['vida', 'mana', 'aura', 'chakra', 'corpo', 'status'];
const VITALS_LABELS = ['VIDA', 'MANA', 'AURA', 'CHAKRA', 'CORPO', 'STATUS'];
const STATS = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];

const MULTIPLICADORES = {
    vida: 1000000, mana: 10000000, aura: 10000000,
    chakra: 10000000, corpo: 10000000, status: 1000
};

// --- A REGRA DE OURO DAS FORMAS (Sua Matemática Exata) ---
function calcularPrestAtual(ficha, attrKey, baseP) {
    // Status e Vida leem a forma a partir do atributo principal de combate
    const anchor = attrKey === 'status' ? 'forca' : attrKey;
    const mFormas = parseFloat(ficha[anchor]?.mFormas) || 1;
    
    // Multiplica pela Forma / 10 (mínimo de 1x para não diminuir se estiver sem forma)
    const multForma = Math.max(1, mFormas / 10);
    return Math.floor(baseP * multForma);
}

// LÓGICA DO BASE
const getBasePFor = (ficha, k) => {
    if (k === 'status') {
        let m = 0;
        STATS.forEach(s => m += safeGetRawBase(ficha, s));
        return Math.floor((m / 8) / 1000);
    }
    return safeGetPrestigioReal(k, safeGetRawBase(ficha, k));
};

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
                            value={ficha.ascensaoBase || 1} 
                            onChange={(e) => {
                                updateFicha(f => { f.ascensaoBase = Number(e.target.value) });
                            }} 
                        />
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_KEYS.map((attrKey, i) => {
                            const calcBaseP = getBasePFor(ficha, attrKey);
                            const divisor = ficha.divisores?.[attrKey] ?? 1;
                            
                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span>Divisor: <input 
                                            type="number" 
                                            className="divisor-mini-input" 
                                            value={divisor} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 1;
                                                updateFicha(f => { 
                                                    if (!f.divisores) f.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
                                                    f.divisores[attrKey] = val;
                                                });
                                            }}
                                        /></span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="prestige-input-base" 
                                        value={calcBaseP} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            updateFicha(f => {
                                                if (attrKey === 'status') {
                                                    const stBase = val * 1000;
                                                    STATS.forEach(s => { if(f[s]) f[s].base = stBase; });
                                                } else {
                                                    const mults = { vida: 1000000, mana: 10000000, aura: 10000000, chakra: 10000000, corpo: 10000000 };
                                                    if(f[attrKey]) f[attrKey].base = val * mults[attrKey];
                                                }
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
                        <div className="prestige-display-atual">{ficha.ascensaoBase || 1}</div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {VITALS_KEYS.map((attrKey, i) => {
                            const calcBaseP = getBasePFor(ficha, attrKey);
                            
                            // Calcula o PAtual matematicamente perfeito
                            const pAtualValor = calcularPrestAtual(ficha, attrKey, calcBaseP);
                            
                            // O motor do getRank calcula a ascensão sozinho em cima do valor gigante
                            const rankInfo = safeGetRank(pAtualValor, ficha.ascensaoBase || 1);

                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span style={{ color: rankInfo.c || '#fff', fontWeight: 'bold' }}>Rank {rankInfo.l || 'F'} [A{rankInfo.a || 1}]</span>
                                    </div>
                                    <div className="prestige-display-atual">
                                        {pAtualValor.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button 
                className={`btn-neon ${statusBotao === 'saved' ? 'btn-green' : 'btn-gold'}`} 
                onClick={handleSalvarPrestigio} 
                disabled={statusBotao === 'saving'}
                style={{ width: '100%', marginBottom: '30px', height: '50px', transition: 'all 0.3s ease' }}
            >
                {statusBotao === 'idle' && '💾 SALVAR PRESTÍGIO NO SERVIDOR'}
                {statusBotao === 'saving' && '⏳ ENVIANDO PARA A FORJA (FIREBASE)...'}
                {statusBotao === 'saved' && '✅ PRESTÍGIOS SALVOS COM SUCESSO!'}
            </button>
        </div>
    );
}