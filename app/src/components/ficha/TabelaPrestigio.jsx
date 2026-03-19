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

// --- CAÇA-FORMAS GLOBAL (Busca Implacável) ---
function getGlobalMFormas(ficha) {
    let maxM = 1;
    if (!ficha) return maxM;

    // 1. Busca Direta nos Atributos (Caso altere via Editor de Atributos)
    const allKeys = [...STATS, 'vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let k of allKeys) {
        if (ficha[k]?.mFormas) {
            const val = parseFloat(ficha[k].mFormas);
            if (!Number.isNaN(val) && val > maxM) maxM = val;
        }
    }

    // 2. Busca Profunda (Rastreia TODOS os Buffs, Modos e Transformações Ativos)
    const searchDeep = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        // Se a gaveta estiver ligada/ativa, escaneia o texto completo dela
        if (obj.ligado === true || obj.ativo === true || obj.equipado === true) {
            const str = JSON.stringify(obj).toUpperCase();
            // Procura o padrão "MFORMAS: x60" ou "MFORMAS: 60"
            const matches = str.matchAll(/MFORMAS[^0-9]*(\d+(\.\d+)?)/g);
            for (const match of matches) {
                const val = parseFloat(match[1]);
                if (!Number.isNaN(val) && val > maxM) maxM = val;
            }
        }
        
        // Continua a mergulhar nas pastas da ficha
        Object.values(obj).forEach(val => {
            if (val && typeof val === 'object') searchDeep(val);
        });
    };
    
    searchDeep(ficha);
    return maxM;
}

// --- REGRA DE OURO: Atual = Base * (Forma / 10) ---
function calcularPrestAtual(ficha, baseP) {
    const mFormas = getGlobalMFormas(ficha);
    // Se a forma for 50 -> 50/10 = 5. Se a forma for menor que 10, mantem x1.
    const multForma = Math.max(1, mFormas / 10);
    return Math.floor(baseP * multForma);
}

// LÓGICA DO BASE PURO
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
                            type="number" className="prestige-input-base" 
                            value={ficha.ascensaoBase || 1} 
                            onChange={(e) => { updateFicha(f => { f.ascensaoBase = Number(e.target.value) }); }} 
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
                                        <span>Divisor: <input type="number" className="divisor-mini-input" value={divisor} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 1;
                                                updateFicha(f => { 
                                                    if (!f.divisores) f.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
                                                    f.divisores[attrKey] = val;
                                                });
                                            }}
                                        /></span>
                                    </div>
                                    <input type="number" className="prestige-input-base" value={calcBaseP} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            updateFicha(f => {
                                                if (attrKey === 'status') {
                                                    const stBase = val * 1000;
                                                    STATS.forEach(s => { if(f[s]) f[s].base = stBase; });
                                                } else {
                                                    if(f[attrKey]) f[attrKey].base = val * MULTIPLICADORES[attrKey];
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
                            const pAtualValor = calcularPrestAtual(ficha, calcBaseP);
                            const rankInfo = safeGetRank(pAtualValor, ficha.ascensaoBase || 1);

                            return (
                                <div key={attrKey}>
                                    <div className="label-divisor" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{VITALS_LABELS[i]}</span>
                                        <span style={{ color: rankInfo.c || '#fff', fontWeight: 'bold' }}>Rank {rankInfo.l || 'F'} [A{rankInfo.a || 1}]</span>
                                    </div>
                                    <div className="prestige-display-atual">
                                        {Math.floor(pAtualValor || 0).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button className={`btn-neon ${statusBotao === 'saved' ? 'btn-green' : 'btn-gold'}`} onClick={handleSalvarPrestigio} disabled={statusBotao === 'saving'} style={{ width: '100%', marginBottom: '30px', height: '50px', transition: 'all 0.3s ease' }}>
                {statusBotao === 'idle' && '💾 SALVAR PRESTÍGIO NO SERVIDOR'}
                {statusBotao === 'saving' && '⏳ ENVIANDO PARA A FORJA (FIREBASE)...'}
                {statusBotao === 'saved' && '✅ PRESTÍGIOS SALVOS COM SUCESSO!'}
            </button>
        </div>
    );
}