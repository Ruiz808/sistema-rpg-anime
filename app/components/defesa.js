// ==========================================
// COMPONENTE: Defesa (Evasiva, Resistência, Redução)
// ==========================================
import { minhaFicha, meuNome } from '../state/store.js';
import { calcularEvasiva, calcularResistencia, calcularReducao } from '../core/engine.js';
import { salvarFichaSilencioso, enviarParaFeed } from '../services/firebase-sync.js';

export function declararEvasiva() {
    let prof = parseInt(document.getElementById('def-eva-prof').value) || 0;
    let bonus = parseInt(document.getElementById('def-eva-bonus').value) || 0;
    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularEvasiva({ prof, bonus, minhaFicha, itensEquipados });
    let feedRenderedLocal = enviarParaFeed({ tipo: 'evasiva', nome: meuNome, ...result });
    if (feedRenderedLocal) window.renderizarFeed({ tipo: 'evasiva', nome: meuNome, ...result });
    window.mudarAba('aba-log');
}

export function declararResistencia() {
    let prof = parseInt(document.getElementById('def-res-prof').value) || 0;
    let bonus = parseInt(document.getElementById('def-res-bonus').value) || 0;
    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularResistencia({ prof, bonus, minhaFicha, itensEquipados });
    let feedRenderedLocal = enviarParaFeed({ tipo: 'resistencia', nome: meuNome, ...result });
    if (feedRenderedLocal) window.renderizarFeed({ tipo: 'resistencia', nome: meuNome, ...result });
    window.mudarAba('aba-log');
}

export function declararReducao() {
    let k = document.getElementById('def-red-energia').value;
    let perc = parseFloat(document.getElementById('def-red-perc').value) || 0;
    let mb = parseFloat(document.getElementById('def-red-mult').value) || 1;
    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularReducao({ energiaKey: k, perc, multBase: mb, minhaFicha, itensEquipados, rE: 0 });
    if (result.erro) return alert('⚠️ ' + result.erro);
    window.atualizarBarrasVisuais(); salvarFichaSilencioso();
    let feedRenderedLocal = enviarParaFeed({ tipo: 'escudo', nome: meuNome, ...result });
    if (feedRenderedLocal) window.renderizarFeed({ tipo: 'escudo', nome: meuNome, ...result });
    window.mudarAba('aba-log');
}
