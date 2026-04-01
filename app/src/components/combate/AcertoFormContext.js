import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { calcularAcerto } from '../../core/engine';
import { getPoderesDefesa, getEfeitosDeClasse } from '../../core/attributes';
import { enviarParaFeed, salvarFichaSilencioso } from '../../services/firebase-sync';

const AcertoFormContext = createContext(null);

export const STATS_LIST = [
    { value: 'forca', label: 'Forca' },
    { value: 'destreza', label: 'Destreza' },
    { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' },
    { value: 'energiaEsp', label: 'Energia Esp.' },
    { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' },
    { value: 'constituicao', label: 'Constituicao' },
];

export function useAcertoForm() {
    const ctx = useContext(AcertoFormContext);
    if (!ctx) return null;
    return ctx;
}

export function AcertoFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const updateFicha = useStore(s => s.updateFicha);
    const alvoSelecionado = useStore(s => s.alvoSelecionado);
    const dummies = useStore(s => s.dummies);
    const cenario = useStore(s => s.cenario);

    const [dados, setDados] = useState(1);
    const [faces, setFaces] = useState(20);
    const [usarProficiencia, setUsarProficiencia] = useState(false);
    const [bonus, setBonus] = useState(0);
    const [statsSelecionados, setStatsSelecionados] = useState(['destreza']);

    const vantagens = minhaFicha?.ataqueConfig?.vantagens || 0;
    const desvantagens = minhaFicha?.ataqueConfig?.desvantagens || 0;
    const profGlobal = parseInt(minhaFicha?.proficienciaBase) || 0;

    const bonusAcertoClasse = minhaFicha ? getPoderesDefesa(minhaFicha, 'bonus_acerto') : 0;

    const itensEquipados = useMemo(() => {
        return minhaFicha?.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    }, [minhaFicha?.inventario]);

    const armasEquipadas = useMemo(() => {
        return itensEquipados.filter(i => i.tipo === 'arma' || i.tipo === 'artefato');
    }, [itensEquipados]);

    const tiposArmasEquipadas = useMemo(() => {
        return armasEquipadas.map(i =>
            String(i.armaTipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        );
    }, [armasEquipadas]);

    const efeitosClasse = useMemo(() => {
        return minhaFicha ? getEfeitosDeClasse(minhaFicha) : [];
    }, [minhaFicha]);

    const { bonusMaestriaArma, nomesMaestriaArma } = useMemo(() => {
        let bonus = 0;
        let nomes = [];
        efeitosClasse.forEach(ef => {
            let propNormalizada = (ef.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (propNormalizada === 'proficiencia_arma') {
                const armaAlvo = (ef.atributo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (tiposArmasEquipadas.includes(armaAlvo)) {
                    bonus += (parseFloat(ef.valor) || 0);
                    nomes.push(ef.atributo.trim().toUpperCase());
                }
            }
        });
        return { bonusMaestriaArma: bonus, nomesMaestriaArma: nomes };
    }, [efeitosClasse, tiposArmasEquipadas]);

    const alvoDummie = alvoSelecionado && dummies?.[alvoSelecionado] ? dummies[alvoSelecionado] : null;

    const { distQuadrados, distReal, maxAlcance, isForaDeAlcance, unidadeEscala } = useMemo(() => {
        let dQ = 0;
        let dR = 0;
        let mA = 1;
        let fora = false;
        let unidade = 'm';

        if (alvoDummie && minhaFicha?.posicao && alvoDummie.posicao) {
            const cenaAtivaId = cenario?.ativa || 'default';
            const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5, unidade: 'm' };
            const escala = cenaAtual.escala || 1.5;
            unidade = cenaAtual.unidade || 'm';

            const dx = Math.abs((minhaFicha.posicao.x || 0) - (alvoDummie.posicao.x || 0));
            const dy = Math.abs((minhaFicha.posicao.y || 0) - (alvoDummie.posicao.y || 0));
            const dz = Math.abs((minhaFicha.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala;

            dQ = Math.max(dx, dy, Math.floor(dz));
            dR = dQ * escala;

            const maxAlcanceArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.alcance || 1)) : 1;
            const poderesAtivos = (minhaFicha.poderes || []).filter(p => p.ativa);
            const maxAlcancePoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.alcance || 1)) : 1;

            mA = Math.max(maxAlcanceArmas, maxAlcancePoderes);
            fora = dQ > mA;
        }

        return { distQuadrados: dQ, distReal: dR, maxAlcance: mA, isForaDeAlcance: fora, unidadeEscala: unidade };
    }, [alvoDummie, minhaFicha?.posicao, minhaFicha?.poderes, cenario, armasEquipadas]);

    const changeVantagem = useCallback((e) => {
        updateFicha(f => {
            if (!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.vantagens = parseInt(e.target.value) || 0;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const changeDesvantagem = useCallback((e) => {
        updateFicha(f => {
            if (!f.ataqueConfig) f.ataqueConfig = {};
            f.ataqueConfig.desvantagens = parseInt(e.target.value) || 0;
        });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const toggleStat = useCallback((value) => {
        setStatsSelecionados(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value);
            return [...prev, value];
        });
    }, []);

    const rolarAcerto = useCallback(() => {
        if (isForaDeAlcance) {
            alert('Aviso: O alvo está fora do seu alcance efetivo!');
            return;
        }

        const qD = parseInt(dados) || 1;
        const fD = parseInt(faces) || 20;
        const bon = parseInt(bonus) || 0;
        const prof = usarProficiencia ? profGlobal : 0;

        const v = parseInt(vantagens) || 0;
        const d = parseInt(desvantagens) || 0;

        const sels = statsSelecionados.length > 0 ? statsSelecionados : ['destreza'];

        const result = calcularAcerto({
            qD, fD, prof, bonus: bon, sels, minhaFicha, itensEquipados,
            vantagens: v, desvantagens: d
        });

        let extraData = {};
        if (alvoDummie) {
            const acertou = result.acertoTotal >= alvoDummie.valorDefesa;
            extraData = { alvoNome: alvoDummie.nome, alvoDefesa: alvoDummie.valorDefesa, acertouAlvo: acertou };
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, ...extraData };
        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }, [isForaDeAlcance, dados, faces, bonus, usarProficiencia, profGlobal, vantagens, desvantagens, statsSelecionados, minhaFicha, itensEquipados, alvoDummie, meuNome, setAbaAtiva]);

    const value = useMemo(() => ({
        dados, setDados,
        faces, setFaces,
        usarProficiencia, setUsarProficiencia,
        bonus, setBonus,
        statsSelecionados,
        vantagens, desvantagens,
        profGlobal,
        bonusAcertoClasse,
        itensEquipados,
        armasEquipadas,
        tiposArmasEquipadas,
        efeitosClasse,
        bonusMaestriaArma,
        nomesMaestriaArma,
        alvoDummie,
        alvoSelecionado,
        distQuadrados,
        distReal,
        maxAlcance,
        isForaDeAlcance,
        unidadeEscala,
        changeVantagem,
        changeDesvantagem,
        toggleStat,
        rolarAcerto,
    }), [
        dados, faces, usarProficiencia, bonus, statsSelecionados,
        vantagens, desvantagens, profGlobal, bonusAcertoClasse,
        itensEquipados, armasEquipadas, tiposArmasEquipadas,
        efeitosClasse, bonusMaestriaArma, nomesMaestriaArma,
        alvoDummie, alvoSelecionado, distQuadrados, distReal,
        maxAlcance, isForaDeAlcance, unidadeEscala,
        changeVantagem, changeDesvantagem, toggleStat, rolarAcerto,
    ]);

    return (
        <AcertoFormContext.Provider value={value}>
            {children}
        </AcertoFormContext.Provider>
    );
}
