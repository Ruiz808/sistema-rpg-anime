// ==========================================
// COMPONENTE: Ataque (Config, Inputs de Dano, Rolar Dano)
// ==========================================
import { minhaFicha, meuNome } from '../state/store.js';
import { tratarUnico } from '../core/utils.js';
import { getBuffs } from '../core/attributes.js';
import { calcularDano } from '../core/engine.js';
import { salvarFichaSilencioso, enviarParaFeed } from '../services/firebase-sync.js';

export function desativarSync() {
    salvarConfigAtaque(true);
    atualizarInputsDeDano();
}

export function salvarConfigAtaque(silent) {
    if (!minhaFicha.ataqueConfig) minhaFicha.ataqueConfig = {};
    let ac = minhaFicha.ataqueConfig;

    ac.dadosBase = parseInt(document.getElementById('atk-dados').value) || 1;
    ac.faces = parseInt(document.getElementById('atk-faces').value) || 20;
    ac.dExtra = parseInt(document.getElementById('atk-dados-extra').value) || 0;
    ac.bruto = parseInt(document.getElementById('atk-bruto').value) || 0;
    ac.mBruto = parseFloat(document.getElementById('atk-mBruto').value) || 1.0;
    ac.mBase = parseFloat(document.getElementById('atk-dBase').value) || 1.0;
    ac.mGeral = parseFloat(document.getElementById('atk-dGeral').value) || 1.0;
    ac.mFormas = parseFloat(document.getElementById('atk-dFormas').value) || 1.0;
    ac.mAbsoluto = parseFloat(document.getElementById('atk-dAbsoluto').value) || 1.0;
    ac.mPotencial = parseFloat(document.getElementById('atk-dPotencial').value) || 1.0;
    ac.mUnico = document.getElementById('atk-dUnico').value || "1.0";
    ac.percEnergia = parseFloat(document.getElementById('atk-perc-energia').value) || 0;
    ac.redCusto = parseFloat(document.getElementById('atk-red-custo').value) || 0;
    ac.mEnergia = parseFloat(document.getElementById('atk-mEnergia').value) || 1.0;

    let chkStats = document.querySelectorAll('.chk-stat:checked');
    ac.statusSelecionados = [];
    for (let i = 0; i < chkStats.length; i++) ac.statusSelecionados.push(chkStats[i].value);

    let chkEngs = document.querySelectorAll('.chk-energia:checked');
    ac.energiasSelecionadas = [];
    for (let i = 0; i < chkEngs.length; i++) ac.energiasSelecionadas.push(chkEngs[i].value);

    salvarFichaSilencioso();

    if (silent !== true) {
        let btn = document.getElementById('btn-save-atk');
        if (btn) {
            btn.innerText = "✅ SALVO!";
            btn.style.borderColor = "#0f0";
            btn.style.color = "#0f0";
            setTimeout(() => { btn.innerText = "💾 FORÇAR SALVAMENTO (OPCIONAL)"; btn.style.borderColor = "#ffcc00"; btn.style.color = "#ffcc00"; }, 2000);
        }
    }
}

export function carregarConfigAtaqueInicial() {
    if (!minhaFicha.ataqueConfig) return;
    let ac = minhaFicha.ataqueConfig;

    let dB = document.getElementById('atk-dados'); if (dB && ac.dadosBase !== undefined) dB.value = ac.dadosBase;
    let fD = document.getElementById('atk-faces'); if (fD && ac.faces !== undefined) fD.value = ac.faces;
    let edE = document.getElementById('atk-dados-extra'); if (edE && ac.dExtra !== undefined) edE.value = ac.dExtra;
    let eB = document.getElementById('atk-bruto'); if (eB && ac.bruto !== undefined) eB.value = ac.bruto;
    let emB = document.getElementById('atk-mBruto'); if (emB && ac.mBruto !== undefined) emB.value = ac.mBruto;
    let emP = document.getElementById('atk-dPotencial'); if (emP && ac.mPotencial !== undefined) emP.value = ac.mPotencial;
    let ePE = document.getElementById('atk-perc-energia'); if (ePE && ac.percEnergia !== undefined) ePE.value = ac.percEnergia;
    let eRC = document.getElementById('atk-red-custo'); if (eRC && ac.redCusto !== undefined) eRC.value = ac.redCusto;
    let eME = document.getElementById('atk-mEnergia'); if (eME && ac.mEnergia !== undefined) eME.value = ac.mEnergia;
    let elB = document.getElementById('atk-dBase'); if (elB && ac.mBase !== undefined) elB.value = ac.mBase;
    let elG = document.getElementById('atk-dGeral'); if (elG && ac.mGeral !== undefined) elG.value = ac.mGeral;
    let elF = document.getElementById('atk-dFormas'); if (elF && ac.mFormas !== undefined) elF.value = ac.mFormas;
    let elA = document.getElementById('atk-dAbsoluto'); if (elA && ac.mAbsoluto !== undefined) elA.value = ac.mAbsoluto;
    let elU = document.getElementById('atk-dUnico'); if (elU && ac.mUnico !== undefined) elU.value = ac.mUnico;

    if (ac.statusSelecionados && ac.statusSelecionados.length > 0) {
        document.querySelectorAll('.chk-stat').forEach(chk => {
            chk.checked = ac.statusSelecionados.includes(chk.value);
        });
    }
    if (ac.energiasSelecionadas && ac.energiasSelecionadas.length > 0) {
        document.querySelectorAll('.chk-energia').forEach(chk => {
            chk.checked = ac.energiasSelecionadas.includes(chk.value);
        });
    }
}

export function atualizarInputsDeDano() {
    try {
        let chks = document.querySelectorAll('.chk-stat:checked'); let sels = [];
        for (let i = 0; i < chks.length; i++) sels.push(chks[i].value);
        if (!sels.length) sels = ['forca'];

        let main = sels[0];
        if (!minhaFicha || !minhaFicha[main]) return;

        let b = getBuffs(minhaFicha, main);

        let elB = document.getElementById('lbl-buff-base'); if (elB) elB.innerText = b.mbase > 1 ? `(Forma: x${b.mbase.toFixed(2)})` : "";
        let elG = document.getElementById('lbl-buff-geral'); if (elG) elG.innerText = b.mgeral > 1 ? `(Forma: x${b.mgeral.toFixed(2)})` : "";
        let elF = document.getElementById('lbl-buff-formas'); if (elF) elF.innerText = b.mformas > 1 ? `(Forma: x${b.mformas.toFixed(2)})` : "";
        let elA = document.getElementById('lbl-buff-abs'); if (elA) elA.innerText = b.mabs > 1 ? `(Forma: x${b.mabs.toFixed(2)})` : "";
        let elU = document.getElementById('lbl-buff-uni'); if (elU) elU.innerText = b.munico.length > 0 ? `(Forma: x${b.munico.join(', ')})` : "";

        let magiasEquipadas = minhaFicha.ataquesElementais ? minhaFicha.ataquesElementais.filter(e => e.equipado) : [];
        let custoMagiaTotal = 0;
        let dadosMagiaTotal = 0;
        let facesMagia = null;
        magiasEquipadas.forEach(atk => {
            custoMagiaTotal += parseFloat(atk.custoValor) || 0;
            if (parseInt(atk.dadosExtraQtd) > 0) {
                dadosMagiaTotal += parseInt(atk.dadosExtraQtd);
                facesMagia = parseInt(atk.dadosExtraFaces);
            }
        });

        let elCustoMagia = document.getElementById('atk-perc-magia'); if (elCustoMagia) elCustoMagia.value = custoMagiaTotal;
        let elDadosMagia = document.getElementById('atk-dados-magia'); if (elDadosMagia) elDadosMagia.value = dadosMagiaTotal;

        if (dadosMagiaTotal > 0 && facesMagia) {
            let elFaces = document.getElementById('atk-faces'); if (elFaces) elFaces.value = facesMagia;
        }
    } catch (e) { }
}

export function initAtaqueListeners() {
    // Checkboxes de status
    var chkStats = document.querySelectorAll('.chk-stat');
    for (var i = 0; i < chkStats.length; i++) {
        chkStats[i].addEventListener('change', function() { salvarConfigAtaque(true); });
    }

    // Checkboxes de energia
    var chkEnergias = document.querySelectorAll('.chk-energia');
    for (var i = 0; i < chkEnergias.length; i++) {
        chkEnergias[i].addEventListener('change', function() { salvarConfigAtaque(true); });
    }

    // Inputs que salvam config ao mudar
    var configInputs = ['atk-dados', 'atk-dados-extra', 'atk-faces', 'atk-perc-energia', 'atk-red-custo', 'atk-mEnergia', 'atk-bruto', 'atk-mBruto', 'atk-dPotencial'];
    for (var i = 0; i < configInputs.length; i++) {
        var el = document.getElementById(configInputs[i]);
        if (el) el.addEventListener('change', function() { salvarConfigAtaque(true); });
    }

    // Inputs que desativam sync
    var syncInputs = ['atk-dBase', 'atk-dGeral', 'atk-dFormas', 'atk-dAbsoluto', 'atk-dUnico'];
    for (var i = 0; i < syncInputs.length; i++) {
        var el = document.getElementById(syncInputs[i]);
        if (el) el.addEventListener('change', function() { desativarSync(); });
    }

    // Botao forcar salvamento
    var btnSave = document.getElementById('btn-save-atk');
    if (btnSave) btnSave.addEventListener('click', function() { salvarConfigAtaque(); });

    // Botao rolar dano
    var btnRolar = document.getElementById('btn-rolar-dano');
    if (btnRolar) btnRolar.addEventListener('click', function() { rolarDano(); });
}

export function rolarDano() {
    salvarConfigAtaque(true);

    let qDBase = parseInt(document.getElementById('atk-dados').value) || 1;
    let qDExtra = parseInt(document.getElementById('atk-dados-extra').value) || 0;
    let qDMagia = parseInt(document.getElementById('atk-dados-magia').value) || 0;
    let fD = parseInt(document.getElementById('atk-faces').value) || 20;
    let pE = parseFloat(document.getElementById('atk-perc-energia').value) || 0;
    let pMagiaTotal = parseFloat(document.getElementById('atk-perc-magia').value) || 0;
    let rE = parseFloat(document.getElementById('atk-red-custo').value) || 0;
    let mE = parseFloat(document.getElementById('atk-mEnergia').value) || 1;
    let dbVal = parseInt(document.getElementById('atk-bruto').value) || 0;
    let mdb = parseFloat(document.getElementById('atk-mBruto').value) || 1;

    let chksEng = document.querySelectorAll('.chk-energia:checked'); let engs = [];
    for (let i = 0; i < chksEng.length; i++) engs.push(chksEng[i].value);
    if (engs.length === 0) engs = ['mana'];

    let chks = document.querySelectorAll('.chk-stat:checked'); let sels = [];
    for (let i = 0; i < chks.length; i++) sels.push(chks[i].value);
    if (!sels.length) sels = ['forca'];

    let m1 = parseFloat(document.getElementById('atk-dGeral').value) || 1;
    let m2 = parseFloat(document.getElementById('atk-dBase').value) || 1;
    let m3 = parseFloat(document.getElementById('atk-dPotencial').value) || 1;
    let m4 = parseFloat(document.getElementById('atk-dFormas').value) || 1.0;
    let m5 = parseFloat(document.getElementById('atk-dAbsoluto').value) || 1;
    let uArr = tratarUnico(document.getElementById('atk-dUnico').value);

    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let magiasEquipadas = minhaFicha.ataquesElementais ? minhaFicha.ataquesElementais.filter(e => e.equipado) : [];

    let result = calcularDano({
        qDBase, qDExtra, qDMagia, fD, pE, pMagiaTotal, rE, mE,
        db: dbVal, mdb, engs, sels, minhaFicha,
        m1, m2, m3, m4, m5, uArr, itensEquipados, magiasEquipadas
    });

    if (result.erro) return alert('⚠️ ' + result.erro);

    // Aplicar drenos de energia retornados pelo engine
    if (result.drenos) {
        for (let i = 0; i < result.drenos.length; i++) {
            minhaFicha[result.drenos[i].key].atual -= result.drenos[i].valor;
        }
    }

    window.atualizarBarrasVisuais(); salvarFichaSilencioso();

    let feedData = { tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade, rolagem: result.rolagem, rolagemMagica: result.rolagemMagica, atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia, armaStr: result.armaStr, detalheConta: result.detalheConta };
    let feedRenderedLocal = enviarParaFeed(feedData);
    if (feedRenderedLocal) window.renderizarFeed(feedData);
    window.mudarAba('aba-log');
}
