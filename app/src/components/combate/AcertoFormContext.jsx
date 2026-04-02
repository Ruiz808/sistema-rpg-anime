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

    // 🔥 RADAR TÁTICO ATUALIZADO (Lê Magias e Área de Efeito) 🔥
    const { distQuadrados, distReal, maxAlcance, maxArea, isForaDeAlcance, unidadeEscala } = useMemo(() => {
        let dQ = 0;
        let dR = 0;
        let mA = 1;
        let mArea = 0;
        let fora = false;
        let unidade = 'm';

        if (alvoDummie && minhaFicha?.posicao && alvoDummie.posicao) {
            const cenaAtivaId = cenario?.ativa || 'default';
            const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5, unidade: 'm' };
            const escala = cenaAtual.escala || 1.5;
            unidade = cenaAtual.unidade || 'm';

            const dx = Math.abs((minhaFicha.posicao.x || 0) - (alvoDummie.posicao.x || 0));
            const dy = Math.abs((minhaFicha.posicao.y || 0) - (alvoDummie.posicao.y || 0));
            const dz = Math.floor(Math.abs((minhaFicha.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);

            dQ = Math.max(dx, dy, dz);
            dR = dQ * escala;

            const maxAlcanceArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.alcance || 1)) : 1;
            const maxAreaArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.areaQuad || a.area || 0)) : 0;

            const poderesAtivos = (minhaFicha.poderes || []).filter(p => p.ativa);
            const maxAlcancePoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.alcance || 1)) : 1;
            const maxAreaPoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.areaQuad || p.area || 0)) : 0;

            const magiasEquipadas = (minhaFicha.ataquesElementais || []).filter(m => m.equipado);
            const maxAlcanceMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.alcanceQuad || 1)) : 1;
            const maxAreaMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.areaQuad || 0)) : 0;

            mA = Math.max(maxAlcanceArmas, maxAlcancePoderes, maxAlcanceMagias);
            mArea = Math.max(maxAreaArmas, maxAreaPoderes, maxAreaMagias);
            fora = dQ > mA;
        }

        return { distQuadrados: dQ, distReal: dR, maxAlcance: mA, maxArea: mArea, isForaDeAlcance: fora, unidadeEscala: unidade };
    }, [alvoDummie, minhaFicha?.posicao, minhaFicha?.poderes, minhaFicha?.ataquesElementais, cenario, armasEquipadas]);

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

    // 🔥 MOTOR DE ROLAGEM COM ÁREA DE EFEITO (AoE) 🔥
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

        let alvosAtingidos = [];

        if (alvoDummie) {
            if (maxArea > 0) {
                const cenaAtivaId = cenario?.ativa || 'default';
                const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5 };
                const escala = cenaAtual.escala || 1.5;

                Object.entries(dummies).forEach(([id, dummieObj]) => {
                    const isSameScene = (dummieObj.cenaId || 'default') === (alvoDummie.cenaId || 'default');
                    if (isSameScene && dummieObj.posicao && alvoDummie.posicao) {
                        const dX = Math.abs(dummieObj.posicao.x - alvoDummie.posicao.x);
                        const dY = Math.abs(dummieObj.posicao.y - alvoDummie.posicao.y);
                        const dZ = Math.floor(Math.abs((dummieObj.posicao.z || 0) - (alvoDummie.posicao.z || 0)) / escala);
                        
                        if (Math.max(dX, dY, dZ) <= maxArea) {
                            alvosAtingidos.push({
                                nome: dummieObj.nome,
                                defesa: dummieObj.valorDefesa,
                                acertou: result.acertoTotal >= dummieObj.valorDefesa
                            });
                        }
                    }
                });
            } else {
                alvosAtingidos.push({
                    nome: alvoDummie.nome,
                    defesa: alvoDummie.valorDefesa,
                    acertou: result.acertoTotal >= alvoDummie.valorDefesa
                });
            }
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, alvosArea: alvosAtingidos, areaEf: maxArea };
        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }, [isForaDeAlcance, dados, faces, bonus, usarProficiencia, profGlobal, vantagens, desvantagens, statsSelecionados, minhaFicha, itensEquipados, alvoDummie, dummies, cenario, maxArea, meuNome, setAbaAtiva]);

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
        maxArea, // Adicionado ao Context
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
        maxAlcance, maxArea, isForaDeAlcance, unidadeEscala,
        changeVantagem, changeDesvantagem, toggleStat, rolarAcerto,
    ]);

    return (
        <AcertoFormContext.Provider value={value}>
            {children}
        </AcertoFormContext.Provider>
    );
}