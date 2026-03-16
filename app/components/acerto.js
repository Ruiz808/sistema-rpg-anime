// ==========================================
// COMPONENTE: Acerto (Rolar Acerto)
// ==========================================
import { minhaFicha, meuNome } from '../state/store.js';
import { calcularAcerto } from '../core/engine.js';
import { enviarParaFeed } from '../services/firebase-sync.js';

export function initAcertoListeners() {
    var btnRolar = document.getElementById('btn-rolar-acerto');
    if (btnRolar) btnRolar.addEventListener('click', function() { rolarAcerto(); });
}

export function rolarAcerto() {
    let qD = parseInt(document.getElementById('act-dados').value) || 1;
    let fD = parseInt(document.getElementById('act-faces').value) || 20;
    let prof = parseInt(document.getElementById('act-prof').value) || 0;
    let bonus = parseInt(document.getElementById('act-bonus').value) || 0;
    let chks = document.querySelectorAll('.chk-stat-act:checked'); let sels = [];
    for (let i = 0; i < chks.length; i++) sels.push(chks[i].value);
    if (!sels.length) sels = ['destreza'];

    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularAcerto({ qD, fD, prof, bonus, sels, minhaFicha, itensEquipados });

    let feedData = { tipo: 'acerto', nome: meuNome, ...result };
    let feedRenderedLocal = enviarParaFeed(feedData);
    if (feedRenderedLocal) window.renderizarFeed(feedData);
    window.mudarAba('aba-log');
}
