// ==========================================
// ENGINE RPG — Cálculos de combate (dano, acerto, defesa)
// ==========================================
import { contarDigitos, tratarUnico, pegarDoisPrimeirosDigitos } from './utils.js';
import { getMaximo, getBuffs, getRawBase, getPoderesDefesa } from './attributes.js';

/**
 * Calcula o dano final. Recebe todos os parâmetros já lidos do DOM.
 * Retorna objeto puro com resultado (sem side effects).
 */
export function calcularDano({
    qDBase, qDExtra, qDMagia, fD,
    pE, pMagiaTotal, rE, mE, db, mdb,
    engs, sels, minhaFicha,
    m1, m2, m3, m4, m5, uArr,
    itensEquipados, magiasEquipadas
}) {
    // Bônus de equipamentos
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

    // Custo de energia (Combustão)
    let gastoPercentualPorEnergia = pE / engs.length;
    let gastoMagiaPorEnergia = pMagiaTotal / engs.length;
    let chkCustos = [];
    let custoTxt = [];

    for (let i = 0; i < engs.length; i++) {
        let eKey = engs[i];
        let eng = minhaFicha[eKey];
        let mx = getMaximo(eKey);

        let gtDrenoBase = Math.floor(mx * (gastoPercentualPorEnergia / 100));
        let gtDrenoMagia = Math.floor(mx * (gastoMagiaPorEnergia / 100));

        let redBase = (eng && eng.reducaoCusto) ? parseFloat(eng.reducaoCusto) : 0;
        let bEnergia = getBuffs(eKey);
        let red = Math.min(100, redBase + bEnergia.reducaoCusto + rE);

        let crDreno = Math.floor(gtDrenoBase * (1 - (red / 100)));
        let crMagia = Math.floor(gtDrenoMagia * (1 - (red / 100)));
        let crTotal = crDreno + crMagia;

        if (crTotal > 0 && (eng.atual || 0) < crTotal) {
            return { erro: `Sem ${eKey.toUpperCase()} suficiente! Custo Final: ${crTotal.toLocaleString('pt-BR')}` };
        }

        chkCustos.push({ k: eKey, cr: crTotal, p: (gtDrenoBase + gtDrenoMagia) });
        if (crTotal > 0) custoTxt.push(`${crTotal.toLocaleString('pt-BR')} ${eKey.toUpperCase()}`);
    }

    // Drenar energia
    let gtBase = 0;
    let cTotal = 0;
    for (let i = 0; i < chkCustos.length; i++) {
        minhaFicha[chkCustos[i].k].atual -= chkCustos[i].cr;
        cTotal += chkCustos[i].cr;
        gtBase += chkCustos[i].p;
    }

    // Rolagem de dados
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

    // Status total
    let powerStatus = 0;
    for (let i = 0; i < sels.length; i++) { powerStatus += getMaximo(sels[i]); }

    // Cálculo base
    let eCal = Math.floor(gtBase * mE);
    let dbCal = Math.floor(db * mdb);
    let fixoTotal = dbCal + iDanoBruto;
    let dIni = (powerStatus * sDadosBase) + eCal + fixoTotal;

    // Multiplicadores
    let uni = 1.0;
    for (let i = 0; i < uArr.length; i++) uni *= uArr[i];

    let bFora = getBuffs(sels[0]);

    let multArr = [];
    let totalGer = m1 * bFora.mgeral; if (totalGer !== 1) multArr.push(`x${totalGer.toFixed(2)}(Ger)`);
    let totalBas = m2 * bFora.mbase; if (totalBas !== 1) multArr.push(`x${totalBas.toFixed(2)}(Bas)`);
    let totalFor = m4 * bFora.mformas; if (totalFor !== 1) multArr.push(`x${totalFor.toFixed(2)}(For)`);
    let totalAbs = m5 * bFora.mabs; if (totalAbs !== 1) multArr.push(`x${totalAbs.toFixed(2)}(Abs)`);
    if (m3 !== 1) multArr.push(`x${m3.toFixed(2)}(Pot)`);

    let uniTotal = uni;
    for (let i = 0; i < bFora.munico.length; i++) uniTotal *= bFora.munico[i];
    if (uniTotal !== 1) multArr.push(`x${uniTotal.toFixed(2)}(Uni)`);

    if (iMultDano !== 1) multArr.push(`x${iMultDano.toFixed(2)}(Eqp)`);
    let multStr = multArr.length > 0 ? multArr.join(' * ') : 'Nenhum (x1)';

    let multTotal = totalGer * totalBas * m3 * totalFor * totalAbs * uniTotal * iMultDano;
    let total = Math.floor(dIni * multTotal);
    if (isNaN(total)) total = 0;

    let letal = Math.max(0, contarDigitos(total) - 8) + iLetalidade;
    let dRed = letal > 0 ? Math.floor(total / Math.pow(10, letal)) : total;

    // Textos do feed
    let txtEng = '';
    if ((pE > 0 || pMagiaTotal > 0) && engs.length > 0) {
        txtEng = `<br>📉 Custo de Combustão Pago: <strong style="color:#f0f;">${custoTxt.join(' e ')}</strong> | 💥 Dano Bruto Injetado: <strong style="color:#0f0;">+${eCal.toLocaleString('pt-BR')}</strong>`;
    }

    let dIniExplicado = `(Status Total: ${powerStatus.toLocaleString('pt-BR')} * Dados: ${sDadosBase})`;
    if (eCal > 0) dIniExplicado += ` + ${eCal.toLocaleString('pt-BR')} (Energia)`;
    if (fixoTotal > 0) dIniExplicado += ` + ${fixoTotal.toLocaleString('pt-BR')} (Fixo)`;

    let detalheConta = `<div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; border-left: 3px solid #ffcc00; font-family: monospace; font-size: 0.95em; color: #ccc;">
        <span style="color:#ffcc00; font-weight:bold;">[MÁQUINA DE CÁLCULO]</span><br>
        <strong>1. Base:</strong> ${dIniExplicado} = <strong style="color:#fff;">${dIni.toLocaleString('pt-BR')}</strong><br>
        <strong>2. Multiplicadores:</strong> ${multStr} = <strong style="color:#fff;">x${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)}</strong><br>
        <strong>3. Dano Total Bruto:</strong> ${dIni.toLocaleString('pt-BR')} * ${multTotal % 1 === 0 ? multTotal : multTotal.toFixed(2)} = <strong style="color:#ff003c; font-size:1.1em;">${total.toLocaleString('pt-BR')}</strong>
        </div>`;

    let atrNames = [];
    for (let i = 0; i < sels.length; i++) atrNames.push(minhaFicha[sels[i]].nome || sels[i].toUpperCase());

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
        energiaDrenada: true
    };
}

/**
 * Calcula acerto. Retorna resultado puro.
 */
export function calcularAcerto({ qD, fD, prof, bonus, sels, minhaFicha, itensEquipados }) {
    let iAcerto = 0;
    let nomesArmas = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_acerto') iAcerto += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'arma' || item.tipo === 'artefato') nomesArmas.push(item.nome);
    });

    let sD = 0;
    let rD = [];
    for (let i = 0; i < qD; i++) {
        let r = Math.floor(Math.random() * fD) + 1;
        sD += r;
        if (i < 30) rD.push(r);
    }
    let rolagemTexto = qD <= 30
        ? `[${rD.join(', ')}] (${sD})`
        : `[${rD.join(', ')}... e mais ${(qD - 30).toLocaleString('pt-BR')} dados] (${sD})`;

    let vSt = 0;
    for (let i = 0; i < sels.length; i++) {
        let baseVal = getRawBase(sels[i]);
        vSt += pegarDoisPrimeirosDigitos(baseVal);
    }

    let bp = getPoderesDefesa('bonus_acerto');
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

/**
 * Calcula evasiva. Retorna resultado puro.
 */
export function calcularEvasiva({ prof, bonus, minhaFicha, itensEquipados }) {
    let iEvasiva = 0;
    let nomesArmaduras = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_evasiva') iEvasiva += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'armadura') nomesArmaduras.push(item.nome);
    });

    let baseVal = getRawBase('destreza');
    let baseD = pegarDoisPrimeirosDigitos(baseVal);
    let bp = getPoderesDefesa('bonus_evasiva');

    let strArmadura = nomesArmaduras.length ? ` equipado com <strong>${nomesArmaduras.join(' e ')}</strong>` : '';

    return {
        total: baseD + prof + bonus + bp + iEvasiva,
        baseCalc: 'Base(Destreza): +' + baseD + ' | Prof: +' + prof + ' | Fixo: +' + bonus + (bp > 0 ? ' | Forma: +' + bp : '') + (iEvasiva > 0 ? ' | Armadura: +' + iEvasiva : ''),
        armaStr: strArmadura
    };
}

/**
 * Calcula resistência. Retorna resultado puro.
 */
export function calcularResistencia({ prof, bonus, minhaFicha, itensEquipados }) {
    let iResistencia = 0;
    let nomesArmaduras = [];
    itensEquipados.forEach(item => {
        if (item.bonusTipo === 'bonus_resistencia') iResistencia += (parseFloat(item.bonusValor) || 0);
        if (item.tipo === 'armadura') nomesArmaduras.push(item.nome);
    });

    let baseVal = getRawBase('forca');
    let baseD = pegarDoisPrimeirosDigitos(baseVal);
    let bp = getPoderesDefesa('bonus_resistencia');

    let strArmadura = nomesArmaduras.length ? ` equipado com <strong>${nomesArmaduras.join(' e ')}</strong>` : '';

    return {
        total: baseD + prof + bonus + bp + iResistencia,
        baseCalc: 'Base(Força): +' + baseD + ' | Prof: +' + prof + ' | Fixo: +' + bonus + (bp > 0 ? ' | Forma: +' + bp : '') + (iResistencia > 0 ? ' | Armadura: +' + iResistencia : ''),
        armaStr: strArmadura
    };
}

/**
 * Calcula escudo/redução. Retorna resultado puro ou erro.
 */
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
        let mMax = getMaximo(e);
        let gt = Math.floor(mMax * (perc / 100));
        let redBase = (minhaFicha[e] && minhaFicha[e].reducaoCusto) ? parseFloat(minhaFicha[e].reducaoCusto) : 0;
        let bEnergia = getBuffs(e);
        let red = Math.min(100, redBase + bEnergia.reducaoCusto);
        let cr = Math.floor(gt * (1 - (red / 100)));
        if ((minhaFicha[e].atual || 0) < cr) return { erro: 'Sem energia!' };
        chk.push({ e: e, cr: cr, bb: gt });
    }

    for (let i = 0; i < chk.length; i++) {
        minhaFicha[chk[i].e].atual -= chk[i].cr;
        cReal += chk[i].cr;
        bBruto += chk[i].bb;
    }

    let pM = getPoderesDefesa('mult_escudo');
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
        energiaDrenada: true
    };
}

// Helper para formatar span de elemento
function formatElemSpan(elemento) {
    let cls = 'elem-' + elemento.toLowerCase()
        .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o')
        .replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
        .replace(/[\s\/]+/g, '-');
    return `<span class="${cls}">${elemento.toUpperCase()}</span>`;
}
