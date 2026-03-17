// ==========================================
// COMPONENTE: Status (Barras Visuais, Radar, HP, Cura, Regeneração)
// ==========================================
import { minhaFicha } from '../state/store.js';
import { contarDigitos } from '../core/utils.js';
import { getMaximo, getBuffs, getRawBase } from '../core/attributes.js';
import { getPrestigioReal, calcPAtual, getRank } from '../core/prestige.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

export function initStatusListeners() {
    var btnDano = document.getElementById('btn-receber-dano');
    if (btnDano) btnDano.addEventListener('click', function() { alterarHP('dano'); });

    var btnCura = document.getElementById('btn-curar-hp');
    if (btnCura) btnCura.addEventListener('click', function() { alterarHP('cura'); });

    var btnRegen = document.getElementById('btn-regeneracao');
    if (btnRegen) btnRegen.addEventListener('click', function() { aplicarRegeneracaoTurno(); });

    var btnCurarTudo = document.getElementById('btn-curar-tudo');
    if (btnCurarTudo) btnCurarTudo.addEventListener('click', function() { curarTudo(); });
}

export function inicializarAtuais() {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let maxBruto = getMaximo(k); let maxFinal = maxBruto;
        if (k === 'vida') { let ptsMax = Math.max(0, contarDigitos(maxBruto) - 8); if (ptsMax > 0) maxFinal = Math.floor(maxBruto / Math.pow(10, ptsMax)); }
        else { let ptsMax = Math.max(0, contarDigitos(maxBruto) - 9); if (ptsMax > 0) maxFinal = Math.floor(maxBruto / Math.pow(10, ptsMax)); }
        if (!minhaFicha[k]) minhaFicha[k] = { atual: maxFinal }; let valAtual = parseFloat(minhaFicha[k].atual);
        if (isNaN(valAtual) || valAtual === null) { minhaFicha[k].atual = maxFinal; }
    }
}

export function desenharRadar() {
    let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
    let ascBase = minhaFicha.ascensaoBase || 1;

    let sb = 0; for (let i = 0; i < sFisicos.length; i++) sb += getPrestigioReal(sFisicos[i], getRawBase(sFisicos[i]));
    let valStatusPres = Math.floor(sb / 8);

    let vBase = [getPrestigioReal('vida', getRawBase('vida')), getPrestigioReal('mana', getRawBase('mana')), getPrestigioReal('aura', getRawBase('aura')), getPrestigioReal('chakra', getRawBase('chakra')), getPrestigioReal('corpo', getRawBase('corpo')), valStatusPres];

    let tgts = ['vida', 'mana', 'aura', 'chakra', 'corpo', 'status'];
    for (let i = 0; i < vBase.length; i++) {
        let r = getRank(vBase[i], ascBase); let e = document.getElementById('lbl-base-' + tgts[i]);
        if (e) e.innerHTML = (tgts[i] === 'corpo' || tgts[i] === 'status') ? '<tspan fill="' + r.c + '">[' + r.l + '] A' + r.a + '</tspan> ' + tgts[i].toUpperCase() : tgts[i].toUpperCase() + ' <tspan fill="' + r.c + '">[' + r.l + '] A' + r.a + '</tspan>';
    }
    let t1 = 0; for (let i = 0; i < vBase.length; i++) t1 += vBase[i];
    let rG1 = getRank(Math.floor(t1 / 6), ascBase); let eG1 = document.getElementById('rank-base-letra');
    if (eG1) eG1.innerHTML = '<span style="color:' + rG1.c + '; text-shadow:0 0 20px ' + rG1.c + ';">[' + rG1.l + ']</span><br><span style="font-size:0.45em; color:#fff; text-shadow:none; letter-spacing:2px;">ASCENSÃO ' + rG1.a + '</span>';

    let an = [-1.5707963267948966, -0.5235987755982988, 0.5235987755982988, 1.5707963267948966, 2.6179938779914944, 3.665191429188092];
    let pts1 = [];
    for (let i = 0; i < vBase.length; i++) {
        let r = getRank(vBase[i], ascBase); let radius = 120 * Math.min(100, Math.max(0, r.r)) / 100;
        pts1.push((250 + radius * Math.cos(an[i])) + ',' + (180 + radius * Math.sin(an[i])));
    }
    let pol1 = document.getElementById('radar-data-base'); if (pol1) pol1.setAttribute('points', pts1.join(" "));

    let pAtualStatus = calcPAtual('status', valStatusPres);
    let vAtual = [
        calcPAtual('vida', vBase[0]), calcPAtual('mana', vBase[1]),
        calcPAtual('aura', vBase[2]), calcPAtual('chakra', vBase[3]),
        calcPAtual('corpo', vBase[4]), pAtualStatus
    ];

    for (let i = 0; i < vAtual.length; i++) {
        let r = getRank(vAtual[i], ascBase); let e = document.getElementById('lbl-atual-' + tgts[i]);
        if (e) e.innerHTML = (tgts[i] === 'corpo' || tgts[i] === 'status') ? '<tspan fill="' + r.c + '">[' + r.l + '] A' + r.a + '</tspan> ' + tgts[i].toUpperCase() : tgts[i].toUpperCase() + ' <tspan fill="' + r.c + '">[' + r.l + '] A' + r.a + '</tspan>';
    }

    let t2 = 0; for (let i = 0; i < vAtual.length; i++) t2 += vAtual[i];
    let rG2 = getRank(Math.floor(t2 / 6), ascBase); let eG2 = document.getElementById('rank-atual-letra');
    if (eG2) eG2.innerHTML = '<span style="color:' + rG2.c + '; text-shadow:0 0 20px ' + rG2.c + ';">[' + rG2.l + ']</span><br><span style="font-size:0.45em; color:#fff; text-shadow:none; letter-spacing:2px;">ASCENSÃO ' + rG2.a + '</span>';

    let pts2 = [];
    for (let i = 0; i < vAtual.length; i++) {
        let r = getRank(vAtual[i], ascBase); let radius = 120 * Math.min(100, Math.max(0, r.r)) / 100;
        pts2.push((250 + radius * Math.cos(an[i])) + ',' + (180 + radius * Math.sin(an[i])));
    }
    let pol2 = document.getElementById('radar-data-atual'); if (pol2) pol2.setAttribute('points', pts2.join(" "));

    let rr = [getRank(vAtual[0], ascBase), getRank(vAtual[1], ascBase), getRank(vAtual[2], ascBase), getRank(vAtual[3], ascBase), getRank(vAtual[4], ascBase), getRank(vAtual[5], ascBase)];
    let displayStyle = ' <span style="font-size:0.75em;color:';
    let elVida = document.getElementById('txt-atual-vida'); if (elVida) elVida.innerHTML = Math.floor(vAtual[0]) + displayStyle + rr[0].c + '">[' + rr[0].l + '] A' + rr[0].a + '</span>';
    let elMana = document.getElementById('txt-atual-mana'); if (elMana) elMana.innerHTML = Math.floor(vAtual[1]) + displayStyle + rr[1].c + '">[' + rr[1].l + '] A' + rr[1].a + '</span>';
    let elAura = document.getElementById('txt-atual-aura'); if (elAura) elAura.innerHTML = Math.floor(vAtual[2]) + displayStyle + rr[2].c + '">[' + rr[2].l + '] A' + rr[2].a + '</span>';
    let elChakra = document.getElementById('txt-atual-chakra'); if (elChakra) elChakra.innerHTML = Math.floor(vAtual[3]) + displayStyle + rr[3].c + '">[' + rr[3].l + '] A' + rr[3].a + '</span>';
    let elCorpo = document.getElementById('txt-atual-corpo'); if (elCorpo) elCorpo.innerHTML = Math.floor(vAtual[4]) + displayStyle + rr[4].c + '">[' + rr[4].l + '] A' + rr[4].a + '</span>';
    let elStatus = document.getElementById('txt-atual-status'); if (elStatus) elStatus.innerHTML = Math.floor(vAtual[5]) + displayStyle + rr[5].c + '">[' + rr[5].l + '] A' + rr[5].a + '</span>';
    let elAscEl = document.getElementById('txt-atual-asc'); if (elAscEl) elAscEl.innerText = rG2.a;
}

export function atualizarBarrasVisuais() {
    let confs = [{ k: 'vida', c: '#ff003c' }, { k: 'mana', c: '#0088ff' }, { k: 'aura', c: '#ffff00' }, { k: 'chakra', c: '#00ffff' }, { k: 'corpo', c: '#ff00ff' }];
    for (let i = 0; i < confs.length; i++) {
        let conf = confs[i]; let st = minhaFicha[conf.k]; let mx = getMaximo(conf.k); let p = 0;
        if (conf.k === 'vida') { p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
        else { p = Math.max(0, contarDigitos(mx) - 9); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
        if (st) { st.atual = parseFloat(st.atual); if (isNaN(st.atual) || st.atual > mx) st.atual = mx; if (st.atual < 0) st.atual = 0; }
        let pct = mx > 0 ? ((st ? st.atual : 0) / mx) * 100 : 0;
        let b = document.getElementById('bar-' + conf.k); let t = document.getElementById('txt-' + conf.k);
        if (b && t) {
            b.style.width = pct + '%'; b.style.backgroundColor = conf.c;
            let at = Math.floor(st ? st.atual : 0).toLocaleString('pt-BR'); let smx = mx.toLocaleString('pt-BR');
            if (conf.k === 'vida') t.innerHTML = at + ' / ' + smx + (p > 0 ? ' <span style="color:#ffcc00; text-shadow:0 0 5px #000;">(🌟 Vit: +' + p + ')</span>' : '');
            else t.innerHTML = at + ' / ' + smx;
        }
    }
    window.carregarTabelaPrestigio(); desenharRadar(); window.atualizarInputsDeDano();
}

export function alterarHP(tipo) {
    let el = document.getElementById('val-dano-cura'); let v = parseInt(el.value);
    if (isNaN(v) || v <= 0) return alert("⚠️ Digite um número maior que zero!");
    let letalidade = parseInt(document.getElementById('val-letalidade').value) || 0;
    let mx = getMaximo('vida'); let p = Math.max(0, contarDigitos(mx) - 8);
    let prestigio = getPrestigioReal('vida', getRawBase('vida'));
    let totalExp = prestigio + p;
    let dif = letalidade - totalExp;
    let ef;
    if (dif >= 0) ef = v * Math.pow(10, dif);
    else ef = v / Math.pow(10, -dif);
    if (tipo === 'dano') minhaFicha.vida.atual -= ef; else minhaFicha.vida.atual += ef;
    minhaFicha.vida.atual = Math.floor(minhaFicha.vida.atual);
    atualizarBarrasVisuais(); salvarFichaSilencioso(); el.value = ''; document.getElementById('val-letalidade').value = '0';
}

export function curarTudo() {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let mx = getMaximo(k);
        if (k === 'vida') { let p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
        else { let p = Math.max(0, contarDigitos(mx) - 9); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
        minhaFicha[k].atual = mx;
    }
    atualizarBarrasVisuais(); salvarFichaSilencioso();
}

export function aplicarRegeneracaoTurno() {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let r = parseFloat(minhaFicha[k] ? minhaFicha[k].regeneracao : 0) || 0;
        let b = getBuffs(k);
        minhaFicha[k].atual += r + b.regeneracao;
    }
    atualizarBarrasVisuais(); salvarFichaSilencioso(); alert("✨ Regeneração aplicada!");
}
