import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import useStore from '../../stores/useStore';
import { calcularAcerto } from '../../core/engine';
import { getPoderesDefesa, getEfeitosDeClasse } from '../../core/attributes';
import { enviarParaFeed, salvarFichaSilencioso, salvarCenarioCompleto } from '../../services/firebase-sync';

// Importa para as Zonas de Efeito poderem ter a cor correspondente
import { cores } from '../arsenal/ElementosFormContext';
import { calcularCA } from '../../core/engine';

const AcertoFormContext = createContext(null);

export const STATS_LIST = [
    { value: 'forca', label: 'Forca' }, { value: 'destreza', label: 'Destreza' }, { value: 'inteligencia', label: 'Inteligencia' },
    { value: 'sabedoria', label: 'Sabedoria' }, { value: 'energiaEsp', label: 'Energia Esp.' }, { value: 'carisma', label: 'Carisma' },
    { value: 'stamina', label: 'Stamina' }, { value: 'constituicao', label: 'Constituicao' },
];

export function useAcertoForm() {
    const ctx = useContext(AcertoFormContext);
    if (!ctx) return null;
    return ctx;
}

export function AcertoFormProvider({ children }) {
    const minhaFicha = useStore(s => s.minhaFicha);
    const meuNome = useStore(s => s.meuNome);
    const personagens = useStore(s => s.personagens);
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

    // 🔥 NOVOS ESTADOS TÁTICOS (ÁREAS E ALVOS) 🔥
    const [origemArea, setOrigemArea] = useState('alvo'); // 'alvo', 'self', 'livre'
    const [coordLivreX, setCoordLivreX] = useState(0);
    const [coordLivreY, setCoordLivreY] = useState(0);
    const [alvoFiltro, setAlvoFiltro] = useState('todos'); // 'todos', 'inimigos', 'aliados'

    const vantagens = minhaFicha?.ataqueConfig?.vantagens || 0;
    const desvantagens = minhaFicha?.ataqueConfig?.desvantagens || 0;
    const profGlobal = parseInt(minhaFicha?.proficienciaBase) || 0;

    const bonusAcertoClasse = minhaFicha ? getPoderesDefesa(minhaFicha, 'bonus_acerto') : 0;

    const itensEquipados = useMemo(() => minhaFicha?.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [], [minhaFicha?.inventario]);
    const armasEquipadas = useMemo(() => itensEquipados.filter(i => i.tipo === 'arma' || i.tipo === 'artefato'), [itensEquipados]);
    const tiposArmasEquipadas = useMemo(() => armasEquipadas.map(i => String(i.armaTipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")), [armasEquipadas]);
    const efeitosClasse = useMemo(() => minhaFicha ? getEfeitosDeClasse(minhaFicha) : [], [minhaFicha]);

    const { bonusMaestriaArma, nomesMaestriaArma } = useMemo(() => {
        let bonus = 0; let nomes = [];
        efeitosClasse.forEach(ef => {
            let propNormalizada = (ef.propriedade || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (propNormalizada === 'proficiencia_arma') {
                const armaAlvo = (ef.atributo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (tiposArmasEquipadas.includes(armaAlvo)) { bonus += (parseFloat(ef.valor) || 0); nomes.push(ef.atributo.trim().toUpperCase()); }
            }
        });
        return { bonusMaestriaArma: bonus, nomesMaestriaArma: nomes };
    }, [efeitosClasse, tiposArmasEquipadas]);

    const alvoDummie = alvoSelecionado && dummies?.[alvoSelecionado] ? dummies[alvoSelecionado] : null;

    // 🔥 Sincroniza o Filtro de Alvos com a Magia Equipada (Se existir)
    useEffect(() => {
        const magiasEquipadas = (minhaFicha?.ataquesElementais || []).filter(m => m.equipado);
        if (magiasEquipadas.length > 0 && magiasEquipadas[0].alvosAfetados) {
            setAlvoFiltro(magiasEquipadas[0].alvosAfetados);
        } else {
            setAlvoFiltro('todos');
        }
    }, [minhaFicha?.ataquesElementais]);

    // 🔥 RADAR TÁTICO AVANÇADO (Centro da Explosão e Coordenada Livre) 🔥
    const { distQuadrados, distReal, maxAlcance, maxArea, isForaDeAlcance, unidadeEscala, centroExplosao, duracaoZonaEfeito, elementoZona } = useMemo(() => {
        let dQ = 0; let dR = 0; let mA = 1; let mArea = 0; let fora = false; let unidade = 'm';
        let centro = null; let duracao = 0; let elemZ = 'Neutro';

        const cenaAtivaId = cenario?.ativa || 'default';
        const cenaAtual = cenario?.lista?.[cenaAtivaId] || { escala: 1.5, unidade: 'm' };
        const escala = cenaAtual.escala || 1.5;
        unidade = cenaAtual.unidade || 'm';

        // 1. Determina as Estatísticas Máximas das Técnicas
        const maxAlcanceArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.alcance || 1)) : 1;
        const maxAreaArmas = armasEquipadas.length > 0 ? Math.max(...armasEquipadas.map(a => a.areaQuad || a.area || 0)) : 0;

        const poderesAtivos = (minhaFicha?.poderes || []).filter(p => p.ativa);
        const maxAlcancePoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.alcance || 1)) : 1;
        const maxAreaPoderes = poderesAtivos.length > 0 ? Math.max(...poderesAtivos.map(p => p.areaQuad || p.area || 0)) : 0;

        const magiasEquipadas = (minhaFicha?.ataquesElementais || []).filter(m => m.equipado);
        const maxAlcanceMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.alcanceQuad || 1)) : 1;
        const maxAreaMagias = magiasEquipadas.length > 0 ? Math.max(...magiasEquipadas.map(m => m.areaQuad || 0)) : 0;

        mA = Math.max(maxAlcanceArmas, maxAlcancePoderes, maxAlcanceMagias);
        mArea = Math.max(maxAreaArmas, maxAreaPoderes, maxAreaMagias);
        
        if (magiasEquipadas.length > 0) {
            duracao = magiasEquipadas[0].duracaoZona || 0;
            elemZ = magiasEquipadas[0].elemento || 'Neutro';
        }

        // 2. Define o Centro Geométrico da Explosão
        if (origemArea === 'self') centro = minhaFicha?.posicao;
        else if (origemArea === 'alvo') centro = alvoDummie?.posicao;
        else if (origemArea === 'livre') centro = { x: parseInt(coordLivreX) || 0, y: parseInt(coordLivreY) || 0, z: 0, cenaId: cenaAtivaId };

        // 3. Calcula se o Atacante Alcança o CENTRO DA EXPLOSÃO
        if (centro && minhaFicha?.posicao) {
            const dx = Math.abs((minhaFicha.posicao.x || 0) - (centro.x || 0));
            const dy = Math.abs((minhaFicha.posicao.y || 0) - (centro.y || 0));
            const dz = Math.floor(Math.abs((minhaFicha.posicao.z || 0) - (centro.z || 0)) / escala);

            dQ = Math.max(dx, dy, dz);
            dR = dQ * escala;
            fora = dQ > mA;
        } else {
            // Sem alvo válido, considera fora para prevenir bugs
            fora = true;
        }

        return { distQuadrados: dQ, distReal: dR, maxAlcance: mA, maxArea: mArea, isForaDeAlcance: fora, unidadeEscala: unidade, centroExplosao: centro, duracaoZonaEfeito: duracao, elementoZona: elemZ };
    }, [alvoDummie, minhaFicha?.posicao, minhaFicha?.poderes, minhaFicha?.ataquesElementais, cenario, armasEquipadas, origemArea, coordLivreX, coordLivreY]);

    const changeVantagem = useCallback((e) => {
        updateFicha(f => { if (!f.ataqueConfig) f.ataqueConfig = {}; f.ataqueConfig.vantagens = parseInt(e.target.value) || 0; });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const changeDesvantagem = useCallback((e) => {
        updateFicha(f => { if (!f.ataqueConfig) f.ataqueConfig = {}; f.ataqueConfig.desvantagens = parseInt(e.target.value) || 0; });
        salvarFichaSilencioso();
    }, [updateFicha]);

    const toggleStat = useCallback((value) => {
        setStatsSelecionados(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value);
            return [...prev, value];
        });
    }, []);

    // 🔥 MOTOR GEOMÉTRICO (Fogo Amigo e Geração de Zonas) 🔥
    const rolarAcerto = useCallback(() => {
        if (isForaDeAlcance && origemArea !== 'self') {
            alert('Aviso: O alvo ou o Ponto de Explosão está fora do seu alcance!');
            return;
        }

        const qD = parseInt(dados) || 1; const fD = parseInt(faces) || 20; const bon = parseInt(bonus) || 0; const prof = usarProficiencia ? profGlobal : 0;
        const v = parseInt(vantagens) || 0; const d = parseInt(desvantagens) || 0;
        const sels = statsSelecionados.length > 0 ? statsSelecionados : ['destreza'];

        const result = calcularAcerto({ qD, fD, prof, bonus: bon, sels, minhaFicha, itensEquipados, vantagens: v, desvantagens: d });

        let alvosAtingidos = [];
        const cenaAtivaId = cenario?.ativa || 'default';
        const escala = cenario?.lista?.[cenaAtivaId]?.escala || 1.5;

        // 1. O SCANN DE ÁREA
        if (maxArea > 0 && centroExplosao) {
            
            const verificarHit = (posicao, valorDefesa, nomeAlvo) => {
                const isSameScene = (posicao.cenaId || 'default') === (centroExplosao.cenaId || 'default');
                if (isSameScene) {
                    const dX = Math.abs(posicao.x - centroExplosao.x);
                    const dY = Math.abs(posicao.y - centroExplosao.y);
                    const dZ = Math.floor(Math.abs((posicao.z || 0) - (centroExplosao.z || 0)) / escala);
                    if (Math.max(dX, dY, dZ) <= maxArea) {
                        alvosAtingidos.push({ nome: nomeAlvo, defesa: valorDefesa, acertou: result.acertoTotal >= valorDefesa });
                    }
                }
            };

            // Inimigos
            if (alvoFiltro === 'todos' || alvoFiltro === 'inimigos') {
                Object.entries(dummies).forEach(([id, dummieObj]) => {
                    if (dummieObj.posicao) verificarHit(dummieObj.posicao, dummieObj.valorDefesa, dummieObj.nome);
                });
            }
            // Aliados
            if (alvoFiltro === 'todos' || alvoFiltro === 'aliados') {
                if (minhaFicha.posicao && origemArea !== 'self') verificarHit(minhaFicha.posicao, calcularCA(minhaFicha, 'evasiva'), meuNome);
                Object.entries(personagens || {}).forEach(([n, f]) => {
                    if (f.posicao) verificarHit(f.posicao, calcularCA(f, 'evasiva'), n);
                });
            }

        } else if (alvoDummie) {
            // Sem Área: Alvo Único Direto
            alvosAtingidos.push({ nome: alvoDummie.nome, defesa: alvoDummie.valorDefesa, acertou: result.acertoTotal >= alvoDummie.valorDefesa });
        }

        // 2. CRIAÇÃO DA ZONA NO MAPA PARA TODOS VEREM
        if (maxArea > 0 && duracaoZonaEfeito > 0 && centroExplosao) {
            const hex = cores[elementoZona] || '#ff003c';
            // Converte HEX para RGB para fazer a bolha transparente no grid
            let rgb = '255,0,60';
            if (hex.length === 7) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                rgb = `${r},${g},${b}`;
            }

            const novoCenario = JSON.parse(JSON.stringify(cenario || {}));
            if (!novoCenario.zonas) novoCenario.zonas = [];
            novoCenario.zonas.push({
                id: Date.now(),
                nome: `Zona de ${meuNome} (${elementoZona})`,
                x: centroExplosao.x,
                y: centroExplosao.y,
                cenaId: centroExplosao.cenaId || 'default',
                raio: maxArea,
                rgb: rgb,
                duracao: duracaoZonaEfeito
            });
            salvarCenarioCompleto(novoCenario);
        }

        const feedData = { tipo: 'acerto', nome: meuNome, ...result, alvosArea: alvosAtingidos, areaEf: maxArea };
        enviarParaFeed(feedData);
        setAbaAtiva('aba-log');

    }, [isForaDeAlcance, origemArea, dados, faces, bonus, usarProficiencia, profGlobal, vantagens, desvantagens, statsSelecionados, minhaFicha, itensEquipados, maxArea, centroExplosao, alvoFiltro, dummies, personagens, meuNome, alvoDummie, duracaoZonaEfeito, elementoZona, cenario, setAbaAtiva]);

    const value = useMemo(() => ({
        dados, setDados, faces, setFaces, usarProficiencia, setUsarProficiencia, bonus, setBonus,
        statsSelecionados, vantagens, desvantagens, profGlobal, bonusAcertoClasse,
        itensEquipados, armasEquipadas, tiposArmasEquipadas, efeitosClasse, bonusMaestriaArma, nomesMaestriaArma,
        alvoDummie, alvoSelecionado, distQuadrados, distReal, maxAlcance, maxArea, isForaDeAlcance, unidadeEscala,
        origemArea, setOrigemArea, coordLivreX, setCoordLivreX, coordLivreY, setCoordLivreY, alvoFiltro, setAlvoFiltro,
        changeVantagem, changeDesvantagem, toggleStat, rolarAcerto,
    }), [
        dados, faces, usarProficiencia, bonus, statsSelecionados, vantagens, desvantagens, profGlobal, bonusAcertoClasse,
        itensEquipados, armasEquipadas, tiposArmasEquipadas, efeitosClasse, bonusMaestriaArma, nomesMaestriaArma,
        alvoDummie, alvoSelecionado, distQuadrados, distReal, maxAlcance, maxArea, isForaDeAlcance, unidadeEscala,
        origemArea, coordLivreX, coordLivreY, alvoFiltro, changeVantagem, changeDesvantagem, toggleStat, rolarAcerto,
    ]);

    return <AcertoFormContext.Provider value={value}>{children}</AcertoFormContext.Provider>;
}