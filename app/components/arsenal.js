// ==========================================
// COMPONENTE: Arsenal e Inventário (CRUD + Render)
// ==========================================
import { minhaFicha, itemEditandoId, setItemEditandoId } from '../state/store.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

export function salvarNovoItem() {
    let n = document.getElementById('novo-item-nome').value.trim();
    let tipo = document.getElementById('novo-item-tipo').value;
    let bTipo = document.getElementById('novo-item-bonus').value;
    let bVal = document.getElementById('novo-item-val').value;

    if (!n) return alert("Falta o nome do Equipamento!");
    if (!minhaFicha.inventario) minhaFicha.inventario = [];

    if (itemEditandoId) {
        let ix = minhaFicha.inventario.findIndex(i => i.id === itemEditandoId);
        if (ix !== -1) {
            minhaFicha.inventario[ix].nome = n;
            minhaFicha.inventario[ix].tipo = tipo;
            minhaFicha.inventario[ix].elemento = 'Neutro';
            minhaFicha.inventario[ix].bonusTipo = bTipo;
            minhaFicha.inventario[ix].bonusValor = bVal;
        }
        cancelarEdicaoItem();
    } else {
        minhaFicha.inventario.push({ id: Date.now(), nome: n, tipo: tipo, elemento: 'Neutro', bonusTipo: bTipo, bonusValor: bVal, equipado: false });
    }
    document.getElementById('novo-item-nome').value = '';
    renderizarInventario();
    salvarFichaSilencioso();
}

export function editarItem(idStr) {
    let id = parseInt(idStr); let p = null;
    if (!minhaFicha.inventario) return;
    for (let i = 0; i < minhaFicha.inventario.length; i++) { if (minhaFicha.inventario[i].id === id) p = minhaFicha.inventario[i]; }
    if (!p) return;
    if (p.equipado) { toggleEquiparItem(idStr); alert(`⚠️ O item [${p.nome}] foi DESEQUIPADO para edição.`); }

    setItemEditandoId(p.id);
    document.getElementById('novo-item-nome').value = p.nome;
    document.getElementById('novo-item-tipo').value = p.tipo;
    document.getElementById('novo-item-bonus').value = p.bonusTipo;
    document.getElementById('novo-item-val').value = p.bonusValor;

    document.getElementById('titulo-item-form').innerText = "✏️ EDITANDO: " + p.nome;
    document.getElementById('btn-cancelar-edit-item').style.display = 'block';
    document.getElementById('form-item-box').scrollIntoView({ behavior: 'smooth' });
}

export function cancelarEdicaoItem() {
    setItemEditandoId(null);
    document.getElementById('novo-item-nome').value = "";
    document.getElementById('titulo-item-form').innerText = "🔨 FORJAR NOVO EQUIPAMENTO";
    document.getElementById('btn-cancelar-edit-item').style.display = 'none';
}

export function toggleEquiparItem(idStr) {
    let id = parseInt(idStr); if (!minhaFicha.inventario) return;
    let itemIndex = minhaFicha.inventario.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    let itemToEquip = minhaFicha.inventario[itemIndex];
    if (!itemToEquip.equipado && (itemToEquip.tipo === 'arma' || itemToEquip.tipo === 'armadura')) {
        minhaFicha.inventario.forEach(i => {
            if (i.tipo === itemToEquip.tipo && i.equipado) i.equipado = false;
        });
    }
    minhaFicha.inventario[itemIndex].equipado = !minhaFicha.inventario[itemIndex].equipado;
    renderizarInventario();
    salvarFichaSilencioso();
}

export function deletarItem(idStr) {
    if (confirm("Deseja destruir este equipamento permanentemente?")) {
        let id = parseInt(idStr);
        minhaFicha.inventario = minhaFicha.inventario.filter(i => i.id !== id);
        renderizarInventario();
        salvarFichaSilencioso();
    }
}

export function initArsenalListeners() {
    var btnCancelar = document.getElementById('btn-cancelar-edit-item');
    if (btnCancelar) btnCancelar.addEventListener('click', function() { cancelarEdicaoItem(); });

    var btnSalvar = document.getElementById('btn-salvar-item');
    if (btnSalvar) btnSalvar.addEventListener('click', function() { salvarNovoItem(); });
}

export function renderizarInventario() {
    try {
        let d = document.getElementById('lista-inventario-salvos');
        if (!d) return; d.innerHTML = '';
        if (!minhaFicha.inventario || !minhaFicha.inventario.length) { d.innerHTML = '<p style="color:#888;">Nenhum equipamento na sua forja.</p>'; return; }
        let html = '';
        for (let i = 0; i < minhaFicha.inventario.length; i++) {
            let p = minhaFicha.inventario[i];
            if (!p) continue;
            let isEquipped = p.equipado;
            let c = isEquipped ? '#ffcc00' : '#888';
            let bg = isEquipped ? 'rgba(255,204,0,0.1)' : 'rgba(0,0,0,0.4)';

            let icon = p.tipo === 'arma' ? '🗡️' : p.tipo === 'armadura' ? '🛡️' : '🔮';

            let bTipo = p.bonusTipo || '';
            let isMult = bTipo.includes('mult_');
            let prefixo = isMult ? 'x' : '+';
            let propText = bTipo.replace('_', ' ').toUpperCase();

            html += '<div class="def-box" style="border-left: 5px solid ' + c + '; background: ' + bg + ';">' +
                '<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px;">' +
                '<div><h3 style="margin:0; color:' + c + '; text-shadow:0 0 10px ' + c + ';">' + icon + ' ' + (p.nome || 'Item') + '</h3>' +
                '<p style="color:#aaa; font-size:0.85em; margin:5px 0 0;">Classe: ' + (p.tipo || '').toUpperCase() + '</p>' +
                '<p style="color:#0ff; font-size:0.9em; margin:5px 0 0;">► ' + propText + ': <strong style="color:#ffcc00;">' + prefixo + (p.bonusValor || 0) + '</strong></p></div>' +
                '<div style="display:flex; gap:10px;">' +
                '<button class="btn-neon" style="border-color:' + c + '; color:' + c + '; padding:5px 15px; font-size: 1.1em; margin:0;" onclick="window.toggleEquiparItem(\'' + p.id + '\')">' + (isEquipped ? '🔴 EQUIPADO' : '⚪ GUARDADO') + '</button>' +
                '<button class="btn-neon btn-blue" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.editarItem(\'' + p.id + '\')">✏️ EDITAR</button>' +
                '<button class="btn-neon btn-red" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.deletarItem(\'' + p.id + '\')">🗑️</button>' +
                '</div></div></div>';
        }
        d.innerHTML = html;
    } catch (e) { console.error("Erro na forja", e); }
}
