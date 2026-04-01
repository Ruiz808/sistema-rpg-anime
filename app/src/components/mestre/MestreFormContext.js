import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { enviarParaFeed, salvarDummie, apagarFicha } from '../../services/firebase-sync';
import { getMaximo } from '../../core/attributes';
import { calcularCA } from '../combate/DefesaPanel';

const MestreFormContext = createContext(null);

export function useMestreForm() {
    const ctx = useContext(MestreFormContext);
    if (!ctx) return null;
    return ctx;
}

export function MestreFormProvider({ children }) {
    const personagens = useStore(s => s.personagens);
    const isMestre = useStore(s => s.isMestre);
    const meuNome = useStore(s => s.meuNome);

    const [msgSistema, setMsgSistema] = useState('');
    const [dNome, setDNome] = useState('Goblin Espiao');
    const [dHp, setDHp] = useState(100);
    const [dVit, setDVit] = useState(0);
    const [dDefTipo, setDDefTipo] = useState('evasiva');
    const [dDef, setDDef] = useState(10);
    const [dVisivelHp, setDVisivelHp] = useState('todos');
    const [dOculto, setDOculto] = useState(false);

    const enviarAviso = useCallback(() => {
        if (!msgSistema.trim()) return;
        enviarParaFeed({ tipo: 'sistema', nome: 'SISTEMA', texto: msgSistema.trim() });
        setMsgSistema('');
    }, [msgSistema]);

    const injetarDummie = useCallback(() => {
        const hBase = parseInt(dHp) || 100;
        const vit = parseInt(dVit) || 0;
        const h = hBase * Math.pow(10, vit);
        const dv = parseInt(dDef) || 10;
        const id = 'dummie_' + Date.now();

        salvarDummie(id, {
            nome: dNome,
            hpMax: h,
            hpAtual: h,
            tipoDefesa: dDefTipo,
            valorDefesa: dv,
            visibilidadeHp: dVisivelHp,
            oculto: dOculto,
            posicao: { x: 0, y: 0 }
        });

        alert(`${dNome} injetado no mapa! ${dOculto ? '(Invisivel)' : ''}`);
    }, [dNome, dHp, dVit, dDef, dDefTipo, dVisivelHp, dOculto]);

    const handleApagarJogador = useCallback((nome) => {
        if (nome === meuNome) {
            alert('Nao pode apagar-se a si mesmo enquanto Mestre!');
            return;
        }
        if (window.confirm(`TEM A CERTEZA QUE QUER APAGAR A FICHA DE ${nome.toUpperCase()} DA BASE DE DADOS? ESTA ACAO E IRREVERSIVEL!`)) {
            apagarFicha(nome);
        }
    }, [meuNome]);

    const jogadoresList = useMemo(() => Object.entries(personagens || {}), [personagens]);

    const fmt = useCallback((n) => Number(n || 0).toLocaleString('pt-BR'), []);

    const jogadoresComStats = useMemo(() => {
        return jogadoresList.map(([nome, ficha]) => {
            const hpMax = getMaximo(ficha, 'vida');
            const hpAtual = ficha.vida?.atual ?? hpMax;
            const percHp = hpMax > 0 ? (hpAtual / hpMax) * 100 : 0;
            const mpMax = getMaximo(ficha, 'mana');
            const mpAtual = ficha.mana?.atual ?? mpMax;

            let classId = ficha?.bio?.classe;
            if ((classId === 'pretender' || classId === 'alterego') && ficha?.bio?.subClasse) classId = ficha?.bio?.subClasse;

            const evasiva = calcularCA(ficha, 'evasiva');
            const resistencia = calcularCA(ficha, 'resistencia');

            return { nome, ficha, hpMax, hpAtual, percHp, mpMax, mpAtual, classId, evasiva, resistencia };
        });
    }, [jogadoresList]);

    const value = useMemo(() => ({
        isMestre,
        meuNome,
        msgSistema, setMsgSistema,
        dNome, setDNome,
        dHp, setDHp,
        dVit, setDVit,
        dDefTipo, setDDefTipo,
        dDef, setDDef,
        dVisivelHp, setDVisivelHp,
        dOculto, setDOculto,
        enviarAviso,
        injetarDummie,
        handleApagarJogador,
        jogadoresList,
        jogadoresComStats,
        fmt,
    }), [
        isMestre, meuNome,
        msgSistema, dNome, dHp, dVit, dDefTipo, dDef, dVisivelHp, dOculto,
        enviarAviso, injetarDummie, handleApagarJogador,
        jogadoresList, jogadoresComStats, fmt,
    ]);

    return (
        <MestreFormContext.Provider value={value}>
            {children}
        </MestreFormContext.Provider>
    );
}
