// ==========================================
// COMPONENTE: Poderes e Efeitos (CRUD + Render)
// ==========================================
import { minhaFicha, efeitosTemp, poderEditandoId, setPoderEditandoId } from '../state/store.js';
import { getMaximo } from '../core/attributes.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

export function addEfeitoTemp() {
    efeitosTemp.push({
        atributo: document.getElementById('novo-pod-atr').value,
        propriedade: document.getElementById('novo-pod-prop').value,
        valor: document.getElementById('novo-pod-val').value
    });
    renderizarEfeitosTemp();
}

export function removerEfeitoTemp(i) {
    efeitosTemp.splice(i, 1);
    renderizarEfeitosTemp();
}

export function renderizarEfeitosTemp() {
    let div = document.getElementById('efeitos-temp-list');
    if (efeitosTemp.length === 0) { div.innerHTML = '<p style="color:#888; font-size:0.9em; margin:0;">Nenhum efeito adicionado.</p>'; return; }
    let html = '';
    for (let i = 0; i < efeitosTemp.length; i++) {
        let e = efeitosTemp[i]; let prop = (e.propriedade || '').toLowerCase(); let m = (prop === 'mbase' || prop === 'mgeral' || prop === 'mformas' || prop === 'mabs' || prop === 'munico'); let prefixo = m ? '(x)' : '(+)';
        html += '<div style="color:#0ff; font-size:0.9em; margin-bottom:5px; background: rgba(0,255,255,0.1); padding: 5px 10px; border-left: 2px solid #0ff; display:flex; justify-content:space-between;"><span>► [' + (e.atributo || '').toUpperCase() + '] - [' + (e.propriedade || '').toUpperCase() + ']: <strong style="color:#ffcc00;">' + prefixo + ' ' + e.valor + '</strong></span><button onclick="window.removerEfeitoTemp(' + i + ')" style="background:transparent; color:#f00; border:none; cursor:pointer;">❌</button></div>';
    }
    div.innerHTML = html;
}

export function salvarNovoPoder() {
    try {
        let n = document.getElementById('novo-pod-nome').value.trim();
        let imgForma = document.getElementById('novo-pod-imagem') ? document.getElementById('novo-pod-imagem').value.trim() : "";
        if (!n || !efeitosTemp.length) { alert("Falta nome ou efeitos!"); return; }
        if (!minhaFicha.poderes) minhaFicha.poderes = [];

        if (poderEditandoId) {
            let ix = -1; for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === poderEditandoId) ix = i; }
            if (ix !== -1) { minhaFicha.poderes[ix].nome = n; minhaFicha.poderes[ix].efeitos = efeitosTemp.slice(); minhaFicha.poderes[ix].imagemUrl = imgForma; }
            cancelarEdicaoPoder();
        } else {
            minhaFicha.poderes.push({ id: Date.now(), nome: n, ativa: false, efeitos: efeitosTemp.slice(), imagemUrl: imgForma });
        }
        efeitosTemp.length = 0;
        document.getElementById('novo-pod-nome').value = '';
        if (document.getElementById('novo-pod-imagem')) document.getElementById('novo-pod-imagem').value = '';

        window.atualizarBarrasVisuais(); renderizarEfeitosTemp(); renderizarListaPoderes(); salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    } catch (e) { console.error("Erro ao salvar:", e); alert("Erro ao salvar o poder. A Ficha recuperou a estabilidade."); }
}

export function editarPoder(idStr) {
    let id = parseInt(idStr); let p = null;
    for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === id) p = minhaFicha.poderes[i]; }
    if (!p) return;
    if (p.ativa) { togglePoder(idStr); alert(`⚠️ A habilidade [${p.nome}] foi DESATIVADA temporariamente para edição.`); }
    setPoderEditandoId(p.id);
    document.getElementById('novo-pod-nome').value = p.nome;
    if (document.getElementById('novo-pod-imagem')) document.getElementById('novo-pod-imagem').value = p.imagemUrl || "";
    let copied = JSON.parse(JSON.stringify(p.efeitos || []));
    efeitosTemp.length = 0;
    for (let i = 0; i < copied.length; i++) efeitosTemp.push(copied[i]);
    document.getElementById('titulo-poder-form').innerText = "✏️ EDITANDO: " + p.nome;
    document.getElementById('btn-cancelar-edit').style.display = 'block';
    renderizarEfeitosTemp();
    document.getElementById('form-poder-box').scrollIntoView({ behavior: 'smooth' });
}

export function cancelarEdicaoPoder() {
    setPoderEditandoId(null);
    document.getElementById('novo-pod-nome').value = "";
    if (document.getElementById('novo-pod-imagem')) document.getElementById('novo-pod-imagem').value = "";
    efeitosTemp.length = 0;
    document.getElementById('titulo-poder-form').innerText = "➕ CRIAR NOVO PODER";
    document.getElementById('btn-cancelar-edit').style.display = 'none';
    renderizarEfeitosTemp();
}

export function togglePoder(idStr) {
    let id = parseInt(idStr); if (!minhaFicha.poderes) return;
    let p = null; for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === id) p = minhaFicha.poderes[i]; }
    if (!p) return;
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo']; let oldM = {};
    for (let i = 0; i < vitais.length; i++) { oldM[vitais[i]] = getMaximo(vitais[i]) || 1; }
    p.ativa = !p.ativa;
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let nMax = getMaximo(k) || 1; let atu = parseFloat(minhaFicha[k].atual);
        if (isNaN(atu)) atu = nMax; minhaFicha[k].atual = Math.floor(atu * (nMax / oldM[k]));
        if (isNaN(minhaFicha[k].atual) || minhaFicha[k].atual < 0 || minhaFicha[k].atual > nMax) minhaFicha[k].atual = nMax;
    }
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); renderizarListaPoderes(); window.atualizarInputsDeDano();
    if (window.renderPlayer) window.renderPlayer();
}

export function deletarPoder(idStr) {
    if (confirm("Tem certeza que deseja apagar este poder permanentemente?")) {
        let id = parseInt(idStr); let p = null;
        for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === id) p = minhaFicha.poderes[i]; }
        if (p && p.ativa) togglePoder(idStr);
        let novaLista = []; for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id !== id) novaLista.push(minhaFicha.poderes[i]); }
        minhaFicha.poderes = novaLista; window.atualizarBarrasVisuais(); salvarFichaSilencioso(); renderizarListaPoderes(); window.atualizarInputsDeDano();
    }
}

export function renderizarListaPoderes() {
    try {
        let d = document.getElementById('lista-poderes-salvos');
        if (!d) return; d.innerHTML = '';
        if (!minhaFicha.poderes || !minhaFicha.poderes.length) { d.innerHTML = '<p style="color:#888;">Nenhuma habilidade gravada.</p>'; return; }
        let html = '';
        for (let i = 0; i < minhaFicha.poderes.length; i++) {
            let p = minhaFicha.poderes[i];
            if (!p) continue;
            let c = p.ativa ? '#0f0' : '#888'; let bg = p.ativa ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.4)';
            let txtArr = [];

            let efeitosList = p.efeitos || [];
            for (let j = 0; j < efeitosList.length; j++) {
                let e = efeitosList[j];
                if (!e) continue;
                let prop = (e.propriedade || '').toLowerCase(); let isMult = (prop === 'mbase' || prop === 'mgeral' || prop === 'mformas' || prop === 'mabs' || prop === 'munico');
                let prefixo = isMult ? 'x' : '+'; txtArr.push('[' + (e.atributo || '').toUpperCase() + '] ' + (e.propriedade || '').toUpperCase() + ': ' + prefixo + (e.valor || 0));
            }
            html += '<div class="def-box" style="border-left: 5px solid ' + c + '; background: ' + bg + ';">' +
                '<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px;">' +
                '<div><h3 style="margin:0; color:' + c + '; text-shadow:0 0 10px ' + c + ';">' + (p.nome || 'Poder') + '</h3>' +
                '<p style="color:#aaa; font-size:0.85em; margin:5px 0 0;">' + (txtArr.join(' | ') || 'Sem efeitos.') + '</p></div>' +
                '<div style="display:flex; gap:10px;">' +
                '<button class="btn-neon" style="border-color:' + c + '; color:' + c + '; padding:5px 15px; font-size: 1.1em; margin:0;" onclick="window.togglePoder(\'' + p.id + '\')">' + (p.ativa ? '🟢 LIGADO' : '⚫ DESLIGADO') + '</button>' +
                '<button class="btn-neon btn-blue" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.editarPoder(\'' + p.id + '\')">✏️ EDITAR</button>' +
                '<button class="btn-neon btn-red" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.deletarPoder(\'' + p.id + '\')">🗑️</button>' +
                '</div></div></div>';
        }
        d.innerHTML = html;
    } catch (e) { console.error("Erro na lista de poderes", e); }
}
