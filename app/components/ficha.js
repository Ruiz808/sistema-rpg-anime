// ==========================================
// COMPONENTE: Ficha (Editor de Atributos, Prestígio, Divisores)
// ==========================================
import { minhaFicha } from '../state/store.js';
import { contarDigitos } from '../core/utils.js';
import { getMaximo, getRawBase } from '../core/attributes.js';
import { getPrestigioReal } from '../core/prestige.js';
import { salvarFichaSilencioso, salvarFirebaseImediato } from '../services/firebase-sync.js';

export function carregarAtributoNaTela() {
    let s = document.getElementById('sel-atributo').value;
    let k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
    let st = minhaFicha[k]; if (!st) return;
    document.getElementById('fch-base').value = st.base || 0;
    document.getElementById('fch-mbase').value = st.mBase || 1;
    document.getElementById('fch-mgeral').value = st.mGeral || 1;
    document.getElementById('fch-mformas').value = st.mFormas || 1;
    document.getElementById('fch-munico').value = st.mUnico || "1.0";
    document.getElementById('fch-mabs').value = st.mAbsoluto || 1;
    document.getElementById('fch-redCusto').value = st.reducaoCusto || 0;
    document.getElementById('fch-regen').value = st.regeneracao || 0;
}

export function salvarAtributo() {
    let s = document.getElementById('sel-atributo').value; let chs = [];
    if (s === 'todos_status') chs = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
    else if (s === 'todas_energias') chs = ['mana', 'aura', 'chakra', 'corpo']; else chs = [s];
    let v = {
        b: parseInt(document.getElementById('fch-base').value) || 0, mb: parseFloat(document.getElementById('fch-mbase').value) || 1,
        mg: parseFloat(document.getElementById('fch-mgeral').value) || 1, mf: parseFloat(document.getElementById('fch-mformas').value) || 1,
        mu: document.getElementById('fch-munico').value || "1.0", ma: parseFloat(document.getElementById('fch-mabs').value) || 1,
        rc: parseFloat(document.getElementById('fch-redCusto').value) || 0, rg: parseFloat(document.getElementById('fch-regen').value) || 0
    };
    for (let i = 0; i < chs.length; i++) {
        let c = chs[i]; if (!minhaFicha[c]) continue;
        minhaFicha[c].base = v.b; minhaFicha[c].mBase = v.mb; minhaFicha[c].mGeral = v.mg; minhaFicha[c].mFormas = v.mf;
        minhaFicha[c].mUnico = v.mu; minhaFicha[c].mAbsoluto = v.ma; minhaFicha[c].reducaoCusto = v.rc; minhaFicha[c].regeneracao = v.rg;
        if (c === 'vida' || c === 'mana' || c === 'aura' || c === 'chakra' || c === 'corpo') {
            let mx = getMaximo(c); if (c === 'vida') { let p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
            minhaFicha[c].atual = mx;
        }
    }
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); alert("✅ Salvo!");
}

export function atualizarDivisores() {
    if (!minhaFicha.divisores) minhaFicha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    minhaFicha.divisores.vida = parseFloat(document.getElementById('div-vida').value) || 1;
    minhaFicha.divisores.status = parseFloat(document.getElementById('div-status').value) || 1;
    minhaFicha.divisores.mana = parseFloat(document.getElementById('div-mana').value) || 1;
    minhaFicha.divisores.aura = parseFloat(document.getElementById('div-aura').value) || 1;
    minhaFicha.divisores.chakra = parseFloat(document.getElementById('div-chakra').value) || 1;
    minhaFicha.divisores.corpo = parseFloat(document.getElementById('div-corpo').value) || 1;
    salvarFichaSilencioso();
    window.atualizarBarrasVisuais();
}

export function carregarTabelaPrestigio() {
    let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao']; let m = 0;
    for (let i = 0; i < sFisicos.length; i++) { m += getRawBase(sFisicos[i]); }
    let elAsc = document.getElementById('pres-asc'); if (elAsc) elAsc.value = minhaFicha.ascensaoBase || 1;
    let elVid = document.getElementById('pres-vida'); if (elVid) elVid.value = getPrestigioReal('vida', getRawBase('vida'));
    let elSt = document.getElementById('pres-status'); if (elSt) elSt.value = Math.floor((m / 8) / 1000);
    let elMa = document.getElementById('pres-mana'); if (elMa) elMa.value = getPrestigioReal('mana', getRawBase('mana'));
    let elAu = document.getElementById('pres-aura'); if (elAu) elAu.value = getPrestigioReal('aura', getRawBase('aura'));
    let elCh = document.getElementById('pres-chakra'); if (elCh) elCh.value = getPrestigioReal('chakra', getRawBase('chakra'));
    let elCo = document.getElementById('pres-corpo'); if (elCo) elCo.value = getPrestigioReal('corpo', getRawBase('corpo'));

    if (!minhaFicha.divisores) minhaFicha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    let dV = document.getElementById('div-vida'); if (dV) dV.value = minhaFicha.divisores.vida;
    let dS = document.getElementById('div-status'); if (dS) dS.value = minhaFicha.divisores.status;
    let dM = document.getElementById('div-mana'); if (dM) dM.value = minhaFicha.divisores.mana;
    let dA = document.getElementById('div-aura'); if (dA) dA.value = minhaFicha.divisores.aura;
    let dC = document.getElementById('div-chakra'); if (dC) dC.value = minhaFicha.divisores.chakra;
    let dCo = document.getElementById('div-corpo'); if (dCo) dCo.value = minhaFicha.divisores.corpo;
}

export function aplicarPrestigioNaFicha() {
    let elAsc = document.getElementById('pres-asc'); let ascB = elAsc ? Math.max(1, parseInt(elAsc.value) || 1) : 1;
    let elVid = document.getElementById('pres-vida'); let v1 = elVid ? Math.max(0, parseInt(elVid.value) || 0) : 0;
    let elSt = document.getElementById('pres-status'); let v2 = elSt ? Math.max(0, parseInt(elSt.value) || 0) : 0;
    let elMa = document.getElementById('pres-mana'); let v3 = elMa ? Math.max(0, parseInt(elMa.value) || 0) : 0;
    let elAu = document.getElementById('pres-aura'); let v4 = elAu ? Math.max(0, parseInt(elAu.value) || 0) : 0;
    let elCh = document.getElementById('pres-chakra'); let v5 = elCh ? Math.max(0, parseInt(elCh.value) || 0) : 0;
    let elCo = document.getElementById('pres-corpo'); let v6 = elCo ? Math.max(0, parseInt(elCo.value) || 0) : 0;

    minhaFicha.ascensaoBase = ascB;
    minhaFicha.vida.base = v1 * 1000000; minhaFicha.mana.base = v3 * 1000000;
    minhaFicha.aura.base = v4 * 1000000; minhaFicha.chakra.base = v5 * 1000000; minhaFicha.corpo.base = v6 * 1000000;

    let stBase = v2 * 1000; let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
    for (let i = 0; i < sFisicos.length; i++) minhaFicha[sFisicos[i]].base = stBase;
    window.atualizarBarrasVisuais();
}

export function salvarTabelaAoServidor() {
    aplicarPrestigioNaFicha();
    window.curarTudo();
    salvarFirebaseImediato().then(function () {
        alert("💾 Tabela de Prestígio salva na nuvem!");
    }).catch(function () {
        alert("⚠️ Erro ao salvar no Firebase. Dados salvos localmente.");
    });
}
