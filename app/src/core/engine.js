// ==========================================
// ENGINE RPG — Cálculos de combate (dano, acerto, defesa)
// ==========================================
import { contarDigitos, tratarUnico, pegarDoisPrimeirosDigitos } from './utils.js';
import { getMaximo, getBuffs, getRawBase, getPoderesDefesa } from './attributes.js';

/**
 * Função inteligente de rolagem com Vantagem/Desvantagem
 * Retorna a soma dos dados mantidos e o texto formatado para o feed (com os dados descartados riscados).
 */
export function rolarDadosComVantagem(qD, fD, vantagens = 0, desvantagens = 0) {
    let netVantagem = (parseInt(vantagens) || 0) - (parseInt(desvantagens) || 0);
    let totalDice = qD + Math.abs(netVantagem);
    let rolls = [];
    
    for (let i = 0; i < totalDice; i++) {
        rolls.push(Math.floor(Math.random() * fD) + 1);
    }

    // Ordena do MAIOR para o MENOR para selecionar quais manter
    let sorted = [...rolls].sort((a, b) => b - a);
    let kept = [];

    if (netVantagem > 0) {
        kept = sorted.slice(0, qD); // Mantém os maiores
    } else if (netVantagem < 0) {
        kept = sorted.slice(totalDice - qD); // Mantém os menores (que estão no final)
    } else {
        kept = sorted; // Normal (Mantém todos)
    }

    let sD = 0;
    let finalTexts = [];
    let pool = [...kept]; // Pool temporária para não riscar números idênticos errados

    for (let i = 0; i < rolls.length; i++) {
        let r = rolls[i];
        let idx = pool.indexOf(r);
        if (idx !== -1) {
            pool.splice(idx, 1);
            sD += r;
            finalTexts.push(`<strong>${r}</strong>`);
        } else {
            // Os dados ignorados pela Vantagem/Desvantagem ficam riscados e vermelhos
            finalTexts.push(`<strike style="color:#ff003c; opacity:0.7">${r}</strike>`);
        }
    }

    let prefix = netVantagem > 0 ? `<span style="color:#0f0">[VANTAGEM]</span> ` : 
                 netVantagem < 0 ? `<span style="color:#f00">[DESVANTAGEM]</span> ` : ``;
                 
    let rolagemTexto = totalDice <= 30
        ? `${prefix}[${finalTexts.join(', ')}] = 🎲(${sD})`
        : `${prefix}[${finalTexts.slice(0, 30).join(', ')}... e mais ${(totalDice - 30).toLocaleString('pt-BR')} dados] = 🎲(${sD})`;

    return { sD, rolagemTexto };
}

/**
 * Rola dados simples (sem vantagem/desvantagem).
 */
function rolarDadosSimples(qtd, faces) {
    let soma = 0;
    let rolls = [];
    for (let i = 0; i < qtd; i++) {
        let r = Math.floor(Math.random() * faces) + 1;
        soma += r;
        rolls.push(r);
    }
    return { soma, rolls };
}

function formatarRolagem(qtd, faces, rolls, soma) {
    if (rolls.length <= 30) {
        return `${qtd}d${faces}: [${rolls.join(', ')}] = ${soma}`;
    }
    return `${qtd}d${faces}: [${rolls.slice(0, 30).join(', ')}... +${(rolls.length - 30).toLocaleString('pt-BR')} dados] = ${soma}`;
}

/**
 * Calcula o dano de um sub-componente (habilidade ou arma).
 * Formula: rolagemDados × (somaAtributos + somaEnergias + somaHabVinculadas)
 * - Cada atributo: getMaximo(ficha, attr) × mUnico
 * - Cada energia: combustao × mUnico × mPotencial
 */
function calcularSubDano({ qtdDados, facesDados, sels, combustaoPorEnergia, minhaFicha, mUnico, mPotencial }) {
    if (qtdDados <= 0) return { dano: 0, rolagem: '', rolagemValor: 0, somaTermos: 0, detalhesTermos: [] };

    let { soma, rolls } = rolarDadosSimples(qtdDados, facesDados);
    let somaTermos = 0;
    let detalhesTermos = [];

    for (let i = 0; i < sels.length; i++) {
        let val = getMaximo(minhaFicha, sels[i]);
        let termo = val * mUnico;
        somaTermos += termo;
        let nomeAttr = (minhaFicha[sels[i]] && minhaFicha[sels[i]].nome) || sels[i].toUpperCase();
        detalhesTermos.push(`<span style="color:#ff003c">${nomeAttr}(${val.toLocaleString('pt-BR')})</span>×Uni(${mUnico})`);
    }

    let energyKeys = Object.keys(combustaoPorEnergia);
    for (let i = 0; i < energyKeys.length; i++) {
        let key = energyKeys[i];
        let combustao = combustaoPorEnergia[key];
        if (combustao > 0) {
            let termo = combustao * mUnico * mPotencial;
            somaTermos += termo;
            detalhesTermos.push(`<span style="color:#0ff">${key.toUpperCase()}(${combustao.toLocaleString('pt-BR')})</span>×Uni(${mUnico})×Pot(${mPotencial})`);
        }
    }

    let dano = Math.floor(soma * somaTermos);
    let rolagem = formatarRolagem(qtdDados, facesDados, rolls, soma);

    return { dano, rolagem, rolagemValor: soma, somaTermos, detalhesTermos };
}

export function calcularDano({
    qDBase, qDExtra, qDMagia, fD,
    pE, pMagiaTotal, rE, mE, db, mdb,
    engs, sels, minhaFicha,
    m1, m2, m3, m4, m5, uArr,
    itensEquipados, magiasEquipadas
}) {
    let iMultDano = 1.0, iDanoBruto = 0, iLetalidade = 0;
    let elementosAtaque = [];
    let nomesArmas = [];

    itensEquipados.forEach(item => {
        let v = parseFloat(item.bonusValor) || 0;
        if (item.bonusTipo === 'mult_dano') iMultDano *= (v === 0 ? 1 : v);
        if (item.bonusTipo === 'dano_bruto') iDanoBruto += v;
        if (item.bonusTipo === 'letalidade') iLetalidade += Math.floor(v);

        if (item.tipo === 'arma' || item.tipo === 'artefato') {
            if (item.elemento && item.elemento !== 'Neutro') {
                elementosAtaque.push(formatElemSpan(item.elemento));
            }
            nomesArmas.push(item.nome);
        }
    });

    let nomesMagias = [];
    magiasEquipadas.forEach(atk => {
        let v = parseFloat(atk.bonusValor) || 0;
        if (atk.bonusTipo === 'mult_dano' && v > 0) iMultDano *= v;
        if (atk.bonusTipo === 'dano_bruto' && v > 0) iDanoBruto += v;
        if (atk.bonusTipo === 'letalidade' && v > 0) iLetalidade += Math.floor(v);
        if (atk.elemento && atk.elemento !== 'Neutro') {
            elementosAtaque.push(formatElemSpan(atk.elemento));
        }
        nomesMagias.push(atk.nome);
    });

    let gastoPercentualPorEnergia = engs.length > 0 ? pE / engs.length : 0;
    let gastoMagiaPorEnergia = engs.length > 0 ? pMagiaTotal / engs.length : 0;
    let chkCustos = [];
    let custoTxt = [];
    let combustaoPorEnergia = {};

    for (let i = 0; i < engs.length; i++) {
        let eKey = engs[i];
        let eng = minhaFicha[eKey];
        let mx = getMaximo(minhaFicha, eKey);

        let gtDrenoBase = Math.floor(mx * (gastoPercentualPorEnergia / 100));
        let gtDrenoMagia = Math.floor(mx * (gastoMagiaPorEnergia / 100));

        let redBase = (eng && eng.reducaoCusto) ? parseFloat(eng.reducaoCusto) : 0;
        let bEnergia = getBuffs(minhaFicha, eKey);
        let red = Math.min(100, redBase + bEnergia.reducaoCusto + rE);

        let crDreno = Math.floor(gtDrenoBase * (1 - (red / 100)));
        let crMagia = Math.floor(gtDrenoMagia * (1 - (red / 100)));
        let crTotal = crDreno + crMagia;

        if (crTotal > 0 && (eng.atual || 0) < crTotal) {
            return { erro: `Sem ${eKey.toUpperCase()} suficiente! Custo Final: ${crTotal.toLocaleString('pt-BR')}` };
        }

        combustaoPorEnergia[eKey] = gtDrenoBase + gtDrenoMagia;
        chkCustos.push({ k: eKey, cr: crTotal, p: (gtDrenoBase + gtDrenoMagia) });
        if (crTotal > 0) custoTxt.push(`${crTotal.toLocaleString('pt-BR')} ${eKey.toUpperCase()}`);
    }

    let drenos = [];
    let gtBase = 0;
    for (let i = 0; i < chkCustos.length; i++) {
        drenos.push({ key: chkCustos[i].k, valor: chkCustos[i].cr });
        gtBase += chkCustos[i].p;
    }

    let uni = 1.0;
    for (let i = 0; i < uArr.length; i++) uni *= uArr[i];
    let bFora = getBuffs(minhaFicha, 'dano');
    let uniTotal = uni;
    for (let i = 0; i < bFora.munico.length; i++) uniTotal *= bFora.munico[i];

    let atrNames = [];
    for (let i = 0; i < sels.length; i++) atrNames.push((minhaFicha[sels[i]] && minhaFicha[sels[i]].nome) || sels[i].toUpperCase());

    let armaEquipada = itensEquipados.find(i => i.tipo === 'arma');
    let poderesAtivos = (minhaFicha.poderes || []).filter(p => p && p.ativa && (p.dadosQtd || 0) > 0);

    let temNovoSistema = (armaEquipada && (armaEquipada.dadosQtd || 0) > 0) || poderesAtivos.length > 0;

    let totalGer = m1 * bFora.mgeral;
    let totalBas = m2 * bFora.mbase;
    let totalFor = m4 * bFora.mformas;
    let totalAbs = m5 * bFora.mabs;

    let multArr = [];
    if (totalBas !== 1) multArr.push(`x${totalBas.toFixed(2)}(Bas)`);
    if (totalFor !== 1) multArr.push(`x${totalFor.toFixed(2)}(For)`);
    if (totalGer !== 1) multArr.push(`x${totalGer.toFixed(2)}(Ger)`);
    if (totalAbs !== 1) multArr.push(`x${totalAbs.toFixed(2)}(Abs)`);
    if (uniTotal !== 1) multArr.push(`x${uniTotal.toFixed(2)}(Uni)`);
    if (iMultDano !== 1) multArr.push(`x${iMultDano.toFixed(2)}(Eqp)`);
    let multStr = multArr.length > 0 ? multArr.join(' * ') : 'Nenhum (x1)';

    if (temNovoSistema) {
        let habsVinculadas = armaEquipada
            ? poderesAtivos.filter(p => p.armaVinculada && String(p.armaVinculada) === String(armaEquipada.id))
            : [];
        let habsLivres = poderesAtivos.filter(p => {
            if (!p.armaVinculada) return true;
            if (!armaEquipada) return true;
            return String(p.armaVinculada) !== String(armaEquipada.id);
        });

        let resultadoArma = null;
        if (armaEquipada && (armaEquipada.dadosQtd || 0) > 0) {
            let habVincResults = [];
            let somaHabVinc = 0;
            for (let i = 0; i < habsVinculadas.length; i++) {
                let hab = habsVinculadas[i];
                let r = calcularSubDano({
                    qtdDados: hab.dadosQtd, facesDados: hab.dadosFaces || 20,
                    sels, combustaoPorEnergia, minhaFicha, mUnico: uniTotal, mPotencial: m3
                });
                r.nome = hab.nome;
                somaHabVinc += r.dano;
                habVincResults.push(r);
            }

            let { soma: rolagemArma, rolls: rollsArma } = rolarDadosSimples(armaEquipada.dadosQtd, armaEquipada.dadosFaces || 20);

            let somaTermosArma = 0;
            let detalhesArma = [];
            for (let i = 0; i < sels.length; i++) {
                let val = getMaximo(minhaFicha, sels[i]);
                somaTermosArma += val * uniTotal;
                detalhesArma.push(`<span style="color:#ff003c">${atrNames[i]}(${val.toLocaleString('pt-BR')})</span>×Uni(${uniTotal})`);
            }
            let engKeys = Object.keys(combustaoPorEnergia);
            for (let i = 0; i < engKeys.length; i++) {
                let comb = combustaoPorEnergia[engKeys[i]];
                if (comb > 0) {
                    somaTermosArma += comb * uniTotal * m3;
                    detalhesArma.push(`<span style="color:#0ff">${engKeys[i].toUpperCase()}(${comb.toLocaleString('pt-BR')})</span>×Uni(${uniTotal})×Pot(${m3})`);
                }
            }
            somaTermosArma += somaHabVinc;

            let danoArma = Math.floor(rolagemArma * somaTermosArma);

            resultadoArma = {
                dano: danoArma,
                rolagem: formatarRolagem(armaEquipada.dadosQtd, armaEquipada.dadosFaces || 20, rollsArma, rolagemArma),
                rolagemValor: rolagemArma,
                nome: armaEquipada.nome,
                habVincResults,
                detalhesArma,
                somaTermosArma,
                somaHabVinc
            };
        }

        let resultadosHabLivres = [];
        for (let i = 0; i < habsLivres.length; i++) {
            let hab = habsLivres[i];
            let r = calcularSubDano({
                qtdDados: hab.dadosQtd, facesDados: hab.dadosFaces || 20,
                sels, combustaoPorEnergia, minhaFicha, mUnico: uniTotal, mPotencial: m3
            });
            r.nome = hab.nome;
            resultadosHabLivres.push(r);
        }

        let somaDanos = (resultadoArma ? resultadoArma.dano : 0);
        for (let i = 0; i < resultadosHabLivres.length; i++) somaDanos += resultadosHabLivres[i].dano;
        somaDanos += iDanoBruto;

        let multTotal = totalBas * totalFor * totalGer * totalAbs * uniTotal * iMultDano;
        let total = Math.floor(somaDanos * multTotal);
        if (isNaN(total)) total = 0;

        let letal = Math.max(0, contarDigitos(total) - 8) + iLetalidade;
        let dRed = letal > 0 ? Math.floor(total / Math.pow(10, letal)) : total;

        let txtEng = '';
        if ((pE > 0 || pMagiaTotal > 0) && engs.length > 0) {
            txtEng = `<br>Custo de Combustao: <strong style="color:#f0f;">${custoTxt.join(' e ')}</strong>`;
        }

        let detalheLinhas = [`<span style="color:#ffcc00; font-weight:bold;">[MAQUINA DE CALCULO]</span>`];

        if (resultadoArma) {
            let habVincTxt = '';
            if (resultadoArma.habVincResults.length > 0) {
                let habParts = resultadoArma.habVincResults.map(h => `<span style="color:#f0f">${h.nome}(${h.dano.toLocaleString('pt-BR')})</span>`);
                habVincTxt = ` + Habs: ${habParts.join(' + ')}`;
            }
            detalheLinhas.push(`<strong style="color:#0f0">Dano de Arma [${resultadoArma.nome}]:</strong> <span style="color:#0f0">${resultadoArma.rolagem}</span> x (${resultadoArma.detalhesArma.join(' + ')}${habVincTxt}) = <strong style="color:#0f0">${resultadoArma.dano.toLocaleString('pt-BR')}</strong>`);
        }

        for (let i = 0; i < resultadosHabLivres.length; i++) {
            let h = resultadosHabLivres[i];
            detalheLinhas.push(`<strong style="color:#f0f">Dano de Habilidade [${h.nome}]:</strong> <span style="color:#f0f">${h.rolagem}</span> x (${h.detalhesTermos.join(' + ')}) = <strong style="color:#f0f">${h.dano.toLocaleString('pt-BR')}</strong>`);
        }

        detalheLinhas.push(`<strong>Soma:</strong> ${somaDanos.toLocaleString('pt-BR')}${iDanoBruto > 0 ? ` (inclui +${iDanoBruto.toLocaleString('pt-BR')} bruto)` : ''}`);
        detalheLinhas.push(`<strong>Multiplicadores:</strong> ${multStr} = <strong style="color:#fff;">x${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)}</strong>`);
        detalheLinhas.push(`<strong>Dano Total:</strong> ${somaDanos.toLocaleString('pt-BR')} x ${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)} = <strong style="color:#ff003c; font-size:1.1em;">${total.toLocaleString('pt-BR')}</strong>`);

        let detalheConta = `<div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; border-left: 3px solid #ffcc00; font-family: monospace; font-size: 0.95em; color: #ccc;">
        ${detalheLinhas.join('<br>')}
        </div>`;

        let rolagemTextoFinal = '';
        if (resultadoArma) rolagemTextoFinal += `Arma: ${resultadoArma.rolagem}`;
        for (let i = 0; i < resultadosHabLivres.length; i++) {
            if (rolagemTextoFinal) rolagemTextoFinal += ' | ';
            rolagemTextoFinal += `${resultadosHabLivres[i].nome}: ${resultadosHabLivres[i].rolagem}`;
        }

        let armaStr = "";
        let combinados = nomesArmas.concat(nomesMagias);
        if (combinados.length) { armaStr = ` usando <strong>${combinados.join(' e ')}</strong>`; }
        if (elementosAtaque.length) { armaStr += ` [${elementosAtaque.join(' / ')}]`; }

        return {
            dano: dRed,
            letalidade: letal,
            rolagem: rolagemTextoFinal,
            rolagemMagica: "",
            atributosUsados: atrNames.join(' + '),
            detalheEnergia: txtEng,
            armaStr: armaStr,
            detalheConta: detalheConta,
            drenos: drenos,
            energiaDrenada: true
        };
    }

    // === SISTEMA LEGADO (sem arma com dados e sem habilidades com dados) ===
    let sDadosBase = 0;
    let rDadosBase = [];
    let totalDice = qDBase + qDExtra + qDMagia;
    for (let i = 0; i < totalDice; i++) {
        let r = Math.floor(Math.random() * fD) + 1;
        sDadosBase += r;
        if (i < 40) rDadosBase.push(r);
    }
    let rolagemTexto = totalDice <= 40
        ? `[${rDadosBase.join(', ')}] (${sDadosBase})`
        : `[${rDadosBase.join(', ')}... e mais ${(totalDice - 40).toLocaleString('pt-BR')} dados] (${sDadosBase})`;

    let powerStatus = 0;
    for (let i = 0; i < sels.length; i++) { powerStatus += getMaximo(minhaFicha, sels[i]); }

    let eCal = Math.floor(gtBase * mE);
    let dbCal = Math.floor(db * mdb);
    let fixoTotal = dbCal + iDanoBruto;
    let dIni = (powerStatus * sDadosBase) + eCal + fixoTotal;

    if (m3 !== 1) multArr.push(`x${m3.toFixed(2)}(Pot)`);
    let multStrLeg = multArr.length > 0 ? multArr.join(' * ') : 'Nenhum (x1)';

    let multTotal = totalGer * totalBas * m3 * totalFor * totalAbs * uniTotal * iMultDano;
    let total = Math.floor(dIni * multTotal);
    if (isNaN(total)) total = 0;

    let letal = Math.max(0, contarDigitos(total) - 8) + iLetalidade;
    let dRed = letal > 0 ? Math.floor(total / Math.pow(10, letal)) : total;

    let txtEng = '';
    if ((pE > 0 || pMagiaTotal > 0) && engs.length > 0) {
        txtEng = `<br>Custo de Combustao: <strong style="color:#f0f;">${custoTxt.join(' e ')}</strong> | Dano Injetado: <strong style="color:#0f0;">+${eCal.toLocaleString('pt-BR')}</strong>`;
    }

    let dIniExplicado = `(Status Total: ${powerStatus.toLocaleString('pt-BR')} * Dados: ${sDadosBase})`;
    if (eCal > 0) dIniExplicado += ` + ${eCal.toLocaleString('pt-BR')} (Energia)`;
    if (fixoTotal > 0) dIniExplicado += ` + ${fixoTotal.toLocaleString('pt-BR')} (Fixo)`;

    let detalheConta = `<div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; border-left: 3px solid #ffcc00; font-family: monospace; font-size: 0.95em; color: #ccc;">
        <span style="color:#ffcc00; font-weight:bold;">[MAQUINA DE CALCULO]</span><br>
        <strong>1. Base:</strong> ${dIniExplicado} = <strong style="color:#fff;">${dIni.toLocaleString('pt-BR')}</strong><br>
        <strong>2. Multiplicadores:</strong> ${multStrLeg} = <strong style="color:#fff;">x${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)}</strong><br>
        <strong>3. Dano Total Bruto:</strong> ${dIni.toLocaleString('pt-BR')} * ${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)} = <strong style="color:#ff003c; font-size:1.1em;">${total.toLocaleString('pt-BR')}</strong>
        </div>`;

    let armaStr = "";
    let combinados = nomesArmas.concat(nomesMagias);
    if (combinados.length) { armaStr = ` usando <strong>${combinados.join(' e ')}</strong>`; }
    if (elementosAtaque.length) { armaStr += ` [${elementosAtaque.join(' / ')}]`; }

    return {
        dano: dRed,
        letalidade: letal,
        rolagem: rolagemTexto,
        rolagemMagica: "",
        atributosUsados: atrNames.join(' + '),
        detalheEnergia: txtEng,
        armaStr: armaStr,
        detalheConta: detalheConta,
        drenos: drenos,
        energiaDrenada: true
    };
}

// 🔥 ACERTO AGORA ACEITA VANTAGEM E DESVANTAGEM
export function calcularAcerto({ qD, fD, prof, bonus, sels, minhaFicha, itensEquipados, vantagens = 0, desvantagens = 0 }) {
    let iAcerto = 0;
    let nomesArmas = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_acerto') iAcerto += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'arma' || item.tipo === 'artefato') nomesArmas.push(item.nome);
    });

    // Chama o novo motor inteligente de Vantagem!
    let { sD, rolagemTexto } = rolarDadosComVantagem(qD, fD, vantagens, desvantagens);

    let vSt = 0;
    for (let i = 0; i < sels.length; i++) {
        let baseVal = getRawBase(minhaFicha, sels[i]);
        vSt += pegarDoisPrimeirosDigitos(baseVal);
    }

    let bp = getPoderesDefesa(minhaFicha, 'bonus_acerto');
    let atrNames = [];
    for (let i = 0; i < sels.length; i++) atrNames.push(minhaFicha[sels[i]].nome || sels[i].toUpperCase());

    let armaStr = nomesArmas.length ? ` equipado com <strong>${nomesArmas.join(' e ')}</strong>` : '';

    return {
        acertoTotal: Math.floor(vSt + prof + bonus + bp + sD + iAcerto),
        rolagem: rolagemTexto,
        atributosUsados: atrNames.join(' + '),
        profBonusTexto: 'Prof: +' + prof + ' | Bônus Fixo: +' + bonus + (bp > 0 ? ' | Forma (Acerto): +' + bp : '') + (iAcerto > 0 ? ' | Arma: +' + iAcerto : ''),
        armaStr: armaStr
    };
}

export function calcularEvasiva({ prof, bonus, minhaFicha, itensEquipados }) {
    let iEvasiva = 0;
    let nomesArmaduras = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_evasiva') iEvasiva += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'armadura') nomesArmaduras.push(item.nome);
    });

    let baseVal = getRawBase(minhaFicha, 'destreza');
    let baseD = pegarDoisPrimeirosDigitos(baseVal);
    let bp = getPoderesDefesa(minhaFicha, 'bonus_evasiva');

    let strArmadura = nomesArmaduras.length ? ` equipado com <strong>${nomesArmaduras.join(' e ')}</strong>` : '';

    return {
        total: baseD + prof + bonus + bp + iEvasiva,
        baseCalc: 'Base(Destreza): +' + baseD + ' | Prof: +' + prof + ' | Fixo: +' + bonus + (bp > 0 ? ' | Forma: +' + bp : '') + (iEvasiva > 0 ? ' | Armadura: +' + iEvasiva : ''),
        armaStr: strArmadura
    };
}

export function calcularResistencia({ prof, bonus, minhaFicha, itensEquipados }) {
    let iResistencia = 0;
    let nomesArmaduras = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_resistencia') iResistencia += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'armadura') nomesArmaduras.push(item.nome);
    });

    let baseVal = getRawBase(minhaFicha, 'forca');
    let baseD = pegarDoisPrimeirosDigitos(baseVal);
    let bp = getPoderesDefesa(minhaFicha, 'bonus_resistencia');

    let strArmadura = nomesArmaduras.length ? ` equipado com <strong>${nomesArmaduras.join(' e ')}</strong>` : '';

    return {
        total: baseD + prof + bonus + bp + iResistencia,
        baseCalc: 'Base(Força): +' + baseD + ' | Prof: +' + prof + ' | Fixo: +' + bonus + (bp > 0 ? ' | Forma: +' + bp : '') + (iResistencia > 0 ? ' | Armadura: +' + iResistencia : ''),
        armaStr: strArmadura
    };
}

export function calcularReducao({ energiaKey, perc, multBase, minhaFicha, itensEquipados, rE }) {
    let iMultEscudo = 0;
    let nomesArmaduras = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'mult_escudo') iMultEscudo += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'armadura') nomesArmaduras.push(item.nome);
    });

    let keys = energiaKey === 'poder' ? ['mana', 'aura', 'chakra'] : [energiaKey];
    let cReal = 0;
    let bBruto = 0;
    let chk = [];

    for (let i = 0; i < keys.length; i++) {
        let e = keys[i];
        let mMax = getMaximo(minhaFicha, e);
        let gt = Math.floor(mMax * (perc / 100));
        let redBase = (minhaFicha[e] && minhaFicha[e].reducaoCusto) ? parseFloat(minhaFicha[e].reducaoCusto) : 0;
        let bEnergia = getBuffs(minhaFicha, e);
        let red = Math.min(100, redBase + bEnergia.reducaoCusto);
        let cr = Math.floor(gt * (1 - (red / 100)));
        if ((minhaFicha[e].atual || 0) < cr) return { erro: 'Sem energia!' };
        chk.push({ e: e, cr: cr, bb: gt });
    }

    let drenos = [];
    for (let i = 0; i < chk.length; i++) {
        drenos.push({ key: chk[i].e, valor: chk[i].cr });
        cReal += chk[i].cr;
        bBruto += chk[i].bb;
    }

    let pM = getPoderesDefesa(minhaFicha, 'mult_escudo');
    let multFinal = multBase + pM + iMultEscudo;

    let total = Math.floor(bBruto * multFinal);
    let pVit = Math.max(0, contarDigitos(total) - 8);
    let escRed = pVit > 0 ? Math.floor(total / Math.pow(10, pVit)) : total;
    let nDef = energiaKey === 'poder' ? 'PODER TOTAL' : minhaFicha[energiaKey].nome;

    let strArmadura = nomesArmaduras.length ? ` equipado com <strong>${nomesArmaduras.join(' e ')}</strong>` : '';

    return {
        escudoReduzido: escRed,
        vitalidade: pVit,
        detalhe: 'Drenou ' + perc + '% de ' + nDef + ' (Gasto: ' + cReal.toLocaleString('pt-BR') + ')' + (pM > 0 ? ' | Buff Forma: +' + pM + 'x' : '') + (iMultEscudo > 0 ? ' | Armadura: +' + iMultEscudo + 'x' : ''),
        armaStr: strArmadura,
        drenos: drenos,
        energiaDrenada: true
    };
}

function formatElemSpan(elemento) {
    let cls = 'elem-' + elemento.toLowerCase()
        .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o')
        .replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
        .replace(/[\s\/]+/g, '-');
    return `<span class="${cls}">${elemento.toUpperCase()}</span>`;
}