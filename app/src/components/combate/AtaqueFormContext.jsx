import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../stores/useStore';
import { getMaximo, getBuffs, getEfeitosDeClasse } from '../../core/attributes';
import { calcularDano } from '../../core/engine';
import { salvarFichaSilencioso, enviarParaFeed, salvarDummie, salvarCenarioCompleto } from '../../services/firebase-sync';

const AtaqueFormContext = createContext(null);

export const STATS_LIST = [
    { value: 'forca', label: 'Forca' }, { value: 'destreza', label: 'Destreza' }, { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' }, { value: 'energiaEsp', label: 'Energia Esp.' }, { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' }, { value: 'constituicao', label: 'Constituicao' },
];

export const ENERGIA_LIST = [
    { value: 'mana', label: 'Mana' }, { value: 'aura', label: 'Aura' }, { value: 'chakra', label: 'Chakra' }, { value: 'corpo', label: 'Corpo' },
];

export function useAtaqueForm() {
    const ctx = useContext(AtaqueFormContext);
    if (!ctx) return null;
    return ctx;
}

export function AtaqueFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const updateFicha = useStore(s => s.updateFicha);
    const setAbaAtiva = useStore(s => s.setAbaAtiva);
    const feedCombate = useStore(s => s.feedCombate);
    const alvoSelecionado = useStore(s => s.alvoSelecionado);
    const dummies = useStore(s => s.dummies);

    const ac = minhaFicha.ataqueConfig || {};

    const [armaStatusUsados, setArmaStatusUsados] = useState(ac.armaStatusUsados || ['forca']);
    const [armaEnergiaCombustao, setArmaEnergiaCombustao] = useState(ac.armaEnergiaCombustao || 'mana');
    const [armaPercEnergia, setArmaPercEnergia] = useState(ac.armaPercEnergia || 0);

    const [critNormalMin, setCritNormalMin] = useState(ac.criticoNormalMin || 16);
    const [critNormalMax, setCritNormalMax] = useState(ac.criticoNormalMax || 18);
    const [critFatalMin, setCritFatalMin] = useState(ac.criticoFatalMin || 19);
    const [critFatalMax, setCritFatalMax] = useState(ac.criticoFatalMax || 20);

    const [autoCritNormal, setAutoCritNormal] = useState(false);
    const [autoCritFatal, setAutoCritFatal] = useState(false);
    const [forcarCritNormal, setForcarCritNormal] = useState(false);
    const [forcarCritFatal, setForcarCritFatal] = useState(false);
    
    const [ignorarTravaAcerto, setIgnorarTravaAcerto] = useState(false);
    const [skillConfigs, setSkillConfigs] = useState({});
    const [podeRolarDano, setPodeRolarDano] = useState(true);
    const [furiaAcalmadaMsg, setFuriaAcalmadaMsg] = useState(false);

    const multiplicadorFuriaClasse = useMemo(() => {
        let maxFuria = 0;
        const scanFuria = (efs) => {
            if (!efs) return;
            efs.forEach(e => {
                if (!e) return;
                let p = (e.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (p === 'furia_berserker') {
                    let v = parseFloat(e.valor) || 0;
                    if (v > maxFuria) maxFuria = v;
                }
            });
        };

        if (minhaFicha) {
            (minhaFicha.poderes || []).forEach(p => { if (p && p.ativa) scanFuria(p.efeitos); scanFuria(p.efeitosPassivos); });
            (minhaFicha.inventario || []).forEach(i => { if (i && i.equipado) { scanFuria(i.efeitos); scanFuria(i.efeitosPassivos); } });
            (minhaFicha.passivas || []).forEach(p => scanFuria(p.efeitos));
            scanFuria(getEfeitosDeClasse(minhaFicha));
        }

        return maxFuria;
    }, [minhaFicha]);

    const rawMaxVida = minhaFicha ? getMaximo(minhaFicha, 'vida', true) : 1;
    const strVal = String(Math.floor(rawMaxVida));
    const pVit = Math.max(0, strVal.length - 8);
    const maxVida = pVit > 0 ? Math.floor(rawMaxVida / Math.pow(10, pVit)) : rawMaxVida;

    const atualVida = minhaFicha?.vida?.atual ?? maxVida;
    const percAtualLostFloor = Math.floor(maxVida > 0 ? Math.max(0, ((maxVida - atualVida) / maxVida) * 100) : 0);
    const furiaMax = minhaFicha?.combate?.furiaMax || 0;
    const percEfetivoParaDisplay = Math.max(percAtualLostFloor, furiaMax);

    const multiplicadorFuriaVisor = useMemo(() => {
        if (percEfetivoParaDisplay === 1) return multiplicadorFuriaClasse;
        else if (percEfetivoParaDisplay >= 2) return percEfetivoParaDisplay;
        return 0;
    }, [percEfetivoParaDisplay, multiplicadorFuriaClasse]);

    const dummieAlvo = alvoSelecionado && dummies[alvoSelecionado] ? dummies[alvoSelecionado] : null;

    const armaEquipada = useMemo(() => (minhaFicha.inventario || []).find(i => i.equipado && i.tipo === 'arma'), [minhaFicha.inventario]);
    const poderesAtivos = useMemo(() => (minhaFicha.poderes || []).filter(p => p && p.ativa), [minhaFicha.poderes]);
    const magiasOfensivas = useMemo(() => (minhaFicha.ataquesElementais || []).filter(m => m && m.equipado && m.tipoMecanica !== 'suporte'), [minhaFicha.ataquesElementais]);

    useEffect(() => {
        if (multiplicadorFuriaClasse > 0 && percAtualLostFloor > furiaMax) {
            updateFicha(f => { if (!f.combate) f.combate = {}; f.combate.furiaMax = percAtualLostFloor; });
            salvarFichaSilencioso();
        }
    }, [percAtualLostFloor, furiaMax, multiplicadorFuriaClasse, updateFicha]);

    useEffect(() => {
        if (!dummieAlvo) {
            setPodeRolarDano(true);
            return;
        }
        const meuUltimoAcerto = [...feedCombate].reverse().find(f => f.nome === meuNome && f.tipo === 'acerto');

        if (meuUltimoAcerto) {
            let acertou = false;
            if (meuUltimoAcerto.alvosArea && meuUltimoAcerto.alvosArea.length > 0) {
                acertou = meuUltimoAcerto.alvosArea.some(a => a.acertou);
            } else if (dummieAlvo && meuUltimoAcerto.alvoNome === dummieAlvo.nome) {
                acertou = meuUltimoAcerto.acertouAlvo;
            } else if (!dummieAlvo && !meuUltimoAcerto.alvoNome) {
                acertou = true;
            }
            setPodeRolarDano(acertou);
        } else {
            setPodeRolarDano(false);
        }
    }, [feedCombate, meuNome, dummieAlvo]);

    useEffect(() => {
        const ac2 = minhaFicha.ataqueConfig || {};
        setArmaStatusUsados(ac2.armaStatusUsados || ['forca']); setArmaEnergiaCombustao(ac2.armaEnergiaCombustao || 'mana');
        setArmaPercEnergia(ac2.armaPercEnergia || 0); setCritNormalMin(ac2.criticoNormalMin || 16);
        setCritNormalMax(ac2.criticoNormalMax || 18); setCritFatalMin(ac2.criticoFatalMin || 19);
        setCritFatalMax(ac2.criticoFatalMax || 20);
    }, [minhaFicha.ataqueConfig]);

    useEffect(() => {
        const lastAcerto = [...feedCombate].reverse().find(f => f.nome === meuNome && f.tipo === 'acerto');
        if (lastAcerto && lastAcerto.rolagem) {
            let maxDado = 0;
            let regexStrong = /<strong>(\d+)<\/strong>/g;
            let match;
            while ((match = regexStrong.exec(lastAcerto.rolagem)) !== null) {
                let v = parseInt(match[1]);
                if (v > maxDado) maxDado = v;
            }
            if (maxDado === 0) {
                let regexArr = /\[(.*?)\]/;
                let mArr = regexArr.exec(lastAcerto.rolagem);
                if (mArr) {
                    let clean = mArr[1].replace(/<[^>]*>?/gm, '');
                    let nums = clean.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    if (nums.length > 0) maxDado = Math.max(...nums);
                }
            }
            setAutoCritFatal(maxDado >= critFatalMin && maxDado <= critFatalMax);
            setAutoCritNormal(maxDado >= critNormalMin && maxDado <= critNormalMax);
        } else {
            setAutoCritFatal(false); setAutoCritNormal(false);
        }
    }, [feedCombate, meuNome, critNormalMin, critNormalMax, critFatalMin, critFatalMax]);

    useEffect(() => {
        const configs = {};
        poderesAtivos.forEach(p => { configs[p.id] = { statusUsados: p.statusUsados || ['forca'], energiaCombustao: p.energiaCombustao || 'mana' }; });
        magiasOfensivas.forEach(m => { configs[m.id] = { statusUsados: m.statusUsados || ['inteligencia'], energiaCombustao: m.energiaCombustao || 'mana' }; });
        setSkillConfigs(configs);
    }, [minhaFicha.poderes, minhaFicha.ataquesElementais]);

    const acalmarFuria = useCallback((e) => {
        e.preventDefault(); updateFicha(f => { if (!f.combate) f.combate = {}; f.combate.furiaMax = percAtualLostFloor; });
        salvarFichaSilencioso(); setFuriaAcalmadaMsg(true); setTimeout(() => setFuriaAcalmadaMsg(false), 2000);
    }, [updateFicha, percAtualLostFloor]);

    const updateSkillConfig = useCallback((id, field, value) => { setSkillConfigs(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } })); }, []);
    const toggleSkillStat = useCallback((id, statValue) => {
        setSkillConfigs(prev => {
            const current = prev[id]?.statusUsados || ['forca'];
            const updated = current.includes(statValue) ? current.filter(v => v !== statValue) : [...current, statValue];
            return { ...prev, [id]: { ...prev[id], statusUsados: updated.length > 0 ? updated : ['forca'] } };
        });
    }, []);

    const toggleArmaStat = useCallback((statValue) => {
        setArmaStatusUsados(prev => {
            if (prev.includes(statValue)) return prev.filter(v => v !== statValue);
            return [...prev, statValue];
        });
    }, []);

    const salvarConfigAtaque = useCallback(() => {
        updateFicha((ficha) => {
            if (!ficha.ataqueConfig) ficha.ataqueConfig = {};
            ficha.ataqueConfig.armaStatusUsados = armaStatusUsados; ficha.ataqueConfig.armaEnergiaCombustao = armaEnergiaCombustao;
            ficha.ataqueConfig.armaPercEnergia = parseFloat(armaPercEnergia) || 0; ficha.ataqueConfig.criticoNormalMin = parseInt(critNormalMin) || 16;
            ficha.ataqueConfig.criticoNormalMax = parseInt(critNormalMax) || 18; ficha.ataqueConfig.criticoFatalMin = parseInt(critFatalMin) || 19;
            ficha.ataqueConfig.criticoFatalMax = parseInt(critFatalMax) || 20;

            if (ficha.poderes) ficha.poderes.forEach(p => { if (p && skillConfigs[p.id]) { p.statusUsados = skillConfigs[p.id].statusUsados; p.energiaCombustao = skillConfigs[p.id].energiaCombustao; } });
            if (ficha.ataquesElementais) ficha.ataquesElementais.forEach(m => { if (m && skillConfigs[m.id]) { m.statusUsados = skillConfigs[m.id].statusUsados; m.energiaCombustao = skillConfigs[m.id].energiaCombustao; } });
        });
        salvarFichaSilencioso();
    }, [updateFicha, armaStatusUsados, armaEnergiaCombustao, armaPercEnergia, critNormalMin, critNormalMax, critFatalMin, critFatalMax, skillConfigs]);

    // 🔥 MOTOR DE DANO: INJETA O DANO BASE E BUFFS ATUAIS NA ZONA 🔥
    const rolarDano = useCallback(() => {
        salvarConfigAtaque();

        const configHabilidades = poderesAtivos.map(p => ({
            id: p.id, nome: p.nome, dadosQtd: p.dadosQtd || 0, dadosFaces: p.dadosFaces || 20, custoPercentual: p.custoPercentual || 0,
            armaVinculada: p.armaVinculada || '', statusUsados: skillConfigs[p.id]?.statusUsados || p.statusUsados || ['forca'],
            energiaCombustao: skillConfigs[p.id]?.energiaCombustao || p.energiaCombustao || 'mana', efeitos: p.efeitos || []
        }));

        const configMagias = magiasOfensivas.map(m => {
            const efs = [];
            if (m.bonusTipo && m.bonusTipo !== 'nenhum') efs.push({ atributo: 'todos_status', propriedade: m.bonusTipo, valor: m.bonusValor });
            return {
                id: m.id, nome: m.nome, dadosQtd: m.dadosExtraQtd || 0, dadosFaces: m.dadosExtraFaces || 20, custoPercentual: m.custoValor || 0,
                armaVinculada: '', statusUsados: skillConfigs[m.id]?.statusUsados || m.statusUsados || ['inteligencia'],
                energiaCombustao: skillConfigs[m.id]?.energiaCombustao || m.energiaCombustao || 'mana', efeitos: efs
            };
        });

        const todasHabilidades = configHabilidades.concat(configMagias);
        const configArma = { statusUsados: armaStatusUsados, energiaCombustao: armaEnergiaCombustao, percEnergia: parseFloat(armaPercEnergia) || 0 };
        const isCriticoNormal = forcarCritNormal || autoCritNormal; const isCriticoFatal = forcarCritFatal || autoCritFatal;

        const result = calcularDano({ minhaFicha, configArma, configHabilidades: todasHabilidades, itensEquipados: (minhaFicha.inventario || []).filter(i => i.equipado), isCriticoNormal, isCriticoFatal });

        if (result.erro) { alert(result.erro); return; }

        if (result.drenos) {
            updateFicha((ficha) => { for (let i = 0; i < result.drenos.length; i++) { if (ficha[result.drenos[i].key]) { ficha[result.drenos[i].key].atual -= result.drenos[i].valor; } } });
            salvarFichaSilencioso();
        }

        setForcarCritNormal(false); setForcarCritFatal(false); setIgnorarTravaAcerto(false);

        const meuUltimoAcerto = [...feedCombate].reverse().find(f => f.nome === meuNome && f.tipo === 'acerto');
        let extraFeed = {};
        let textoAlvos = "";

        if (meuUltimoAcerto && meuUltimoAcerto.alvosArea && meuUltimoAcerto.alvosArea.length > 0) {
            let atingidos = 0;
            meuUltimoAcerto.alvosArea.forEach(alvoHit => {
                if (alvoHit.acertou) {
                    atingidos++;
                    const dummieEntry = Object.entries(dummies).find(([id, d]) => d.nome === alvoHit.nome);
                    if (dummieEntry) {
                        const [idD, dData] = dummieEntry;
                        salvarDummie(idD, { ...dData, hpAtual: Math.max(0, dData.hpAtual - result.dano) });
                    }
                }
            });
            textoAlvos = `<br/><span style="color:#0f0; font-weight:bold;">💥 Dano em Área aplicado a ${atingidos} alvo(s) que falharam na defesa!</span>`;
        } else if (dummieAlvo) {
            const hpAnterior = dummieAlvo.hpAtual;
            const novoHp = Math.max(0, hpAnterior - result.dano);
            salvarDummie(alvoSelecionado, { ...dummieAlvo, hpAtual: novoHp });
            extraFeed = { alvoNome: dummieAlvo.nome, alvoSobreviveu: novoHp > 0, overkill: result.dano > hpAnterior ? result.dano - hpAnterior : 0 };
        }

        // 🔥 GRAVA AS METRICAS DE DANO NA ZONA PERSISTENTE 🔥
        if (meuUltimoAcerto && meuUltimoAcerto.zonaIdGerada) {
            const cenarioAtual = useStore.getState().cenario;
            if (cenarioAtual?.zonas) {
                const novoCenario = JSON.parse(JSON.stringify(cenarioAtual));
                const zRef = novoCenario.zonas.find(z => z.id === meuUltimoAcerto.zonaIdGerada);
                if (zRef) {
                    const buffsAtuais = getBuffs(minhaFicha);
                    const multOrig = (buffsAtuais?.mbase || 1) * (buffsAtuais?.mgeral || 1) * (multiplicadorFuriaVisor > 0 ? multiplicadorFuriaVisor : 1);
                    
                    zRef.danoOriginal = result.dano;
                    zRef.multiplicadorOriginal = multOrig === 0 ? 1 : multOrig;
                    zRef.danoAplicado = result.dano; // Compatibilidade com zonas antigas
                    
                    salvarCenarioCompleto(novoCenario);
                    textoAlvos += `<br/><span style="color:#ff00ff; font-weight:bold;">🌪️ A Zona de Efeito absorveu o poder e castigará quem permanecer lá!</span>`;
                }
            }
        }

        const feedData = {
            tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade,
            rolagem: result.rolagem, rolagemMagica: result.rolagemMagica,
            atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia,
            armaStr: result.armaStr, detalheConta: result.detalheConta + textoAlvos,
            ...extraFeed
        };

        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');
    }, [
        updateFicha, armaStatusUsados, armaEnergiaCombustao, armaPercEnergia,
        critNormalMin, critNormalMax, critFatalMin, critFatalMax, skillConfigs,
        minhaFicha, forcarCritNormal, autoCritNormal, forcarCritFatal, autoCritFatal,
        dummieAlvo, alvoSelecionado, meuNome, setAbaAtiva, poderesAtivos, magiasOfensivas, feedCombate, dummies, multiplicadorFuriaVisor
    ]);

    const value = useMemo(() => ({
        armaStatusUsados, setArmStatusUsados: setArmaStatusUsados, armaEnergiaCombustao, setArmaEnergiaCombustao,
        armaPercEnergia, setArmaPercEnergia, critNormalMin, setCritNormalMin, critNormalMax, setCritNormalMax,
        critFatalMin, setCritFatalMin, critFatalMax, setCritFatalMax, autoCritNormal, autoCritFatal,
        forcarCritNormal, setForcarCritNormal, forcarCritFatal, setForcarCritFatal,
        ignorarTravaAcerto, setIgnorarTravaAcerto, skillConfigs, podeRolarDano, furiaAcalmadaMsg,
        multiplicadorFuriaClasse, multiplicadorFuriaVisor, percAtualLostFloor, percEfetivoParaDisplay,
        dummieAlvo, armaEquipada, poderesAtivos, magiasOfensivas, minhaFicha,
        acalmarFuria, updateSkillConfig, toggleSkillStat, toggleArmaStat, salvarConfigAtaque, rolarDano,
    }), [
        armaStatusUsados, armaEnergiaCombustao, armaPercEnergia, critNormalMin, critNormalMax, critFatalMin, critFatalMax,
        autoCritNormal, autoCritFatal, forcarCritNormal, forcarCritFatal, ignorarTravaAcerto, skillConfigs, podeRolarDano, furiaAcalmadaMsg,
        multiplicadorFuriaClasse, multiplicadorFuriaVisor, percAtualLostFloor, percEfetivoParaDisplay,
        dummieAlvo, armaEquipada, poderesAtivos, magiasOfensivas, minhaFicha,
        acalmarFuria, updateSkillConfig, toggleSkillStat, toggleArmaStat, salvarConfigAtaque, rolarDano,
    ]);

    return <AtaqueFormContext.Provider value={value}>{children}</AtaqueFormContext.Provider>;
}