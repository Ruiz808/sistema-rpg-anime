// ==========================================
// COMPONENTE: Grimório Elemental (CRUD + Render)
// ==========================================
import { minhaFicha, elemEditandoId, setElemEditandoId } from '../state/store.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

export function setElemento(nome, el, cor) {
    document.getElementById('novo-elem-tipo').value = nome;
    let badges = document.querySelectorAll('.badge-elem');
    badges.forEach(b => {
        b.classList.remove('ativo');
        b.style.borderColor = '#444';
        b.style.color = '#aaa';
        b.style.boxShadow = 'none';
    });
    if (el) {
        el.classList.add('ativo');
        el.style.borderColor = cor;
        el.style.color = cor;
        el.style.boxShadow = `inset 0 0 10px ${cor}`;
    }
    renderizarElementos();
}

export function salvarNovoElem() {
    try {
        let n = document.getElementById('novo-elem-nome').value.trim();
        let elem = document.getElementById('novo-elem-tipo').value;
        let bTipo = document.getElementById('novo-elem-bonus').value;
        let bVal = document.getElementById('novo-elem-val').value;
        let cVal = parseFloat(document.getElementById('novo-elem-custo-val').value) || 0;
        let dQtd = parseInt(document.getElementById('novo-elem-dados-qtd').value) || 0;
        let dFaces = parseInt(document.getElementById('novo-elem-dados-faces').value) || 20;

        if (!n) return alert("Falta o nome da Magia/Ataque!");
        if (!minhaFicha.ataquesElementais) minhaFicha.ataquesElementais = [];

        if (elemEditandoId) {
            let ix = minhaFicha.ataquesElementais.findIndex(i => i.id === elemEditandoId);
            if (ix !== -1) {
                minhaFicha.ataquesElementais[ix].nome = n;
                minhaFicha.ataquesElementais[ix].elemento = elem;
                minhaFicha.ataquesElementais[ix].bonusTipo = bTipo;
                minhaFicha.ataquesElementais[ix].bonusValor = bVal;
                minhaFicha.ataquesElementais[ix].custoValor = cVal;
                minhaFicha.ataquesElementais[ix].dadosExtraQtd = dQtd;
                minhaFicha.ataquesElementais[ix].dadosExtraFaces = dFaces;
            }
            cancelarEdicaoElem();
        } else {
            minhaFicha.ataquesElementais.push({ id: Date.now(), nome: n, elemento: elem, bonusTipo: bTipo, bonusValor: bVal, custoValor: cVal, dadosExtraQtd: dQtd, dadosExtraFaces: dFaces, equipado: false });
        }
        document.getElementById('novo-elem-nome').value = '';
        renderizarElementos();
        salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    } catch (e) { console.error(e); }
}

export function editarElem(idStr) {
    let id = parseInt(idStr); let p = null;
    if (!minhaFicha.ataquesElementais) return;
    for (let i = 0; i < minhaFicha.ataquesElementais.length; i++) { if (minhaFicha.ataquesElementais[i].id === id) p = minhaFicha.ataquesElementais[i]; }
    if (!p) return;
    if (p.equipado) { toggleEquiparElem(idStr); alert(`⚠️ O ataque [${p.nome}] foi DESATIVADO para edição.`); }

    setElemEditandoId(p.id);
    document.getElementById('novo-elem-nome').value = p.nome;
    document.getElementById('novo-elem-tipo').value = p.elemento;
    document.getElementById('novo-elem-bonus').value = p.bonusTipo || 'nenhum';
    document.getElementById('novo-elem-val').value = p.bonusValor || 0;
    document.getElementById('novo-elem-custo-val').value = p.custoValor || 0;
    document.getElementById('novo-elem-dados-qtd').value = p.dadosExtraQtd || 0;
    document.getElementById('novo-elem-dados-faces').value = p.dadosExtraFaces || 20;

    let badge = document.querySelector(`.badge-elem[data-elem="${p.elemento}"]`);
    if (badge) badge.click();
    else {
        let bn = document.querySelector(`.badge-elem[data-elem="Neutro"]`);
        if (bn) bn.click();
    }

    document.getElementById('titulo-elem-form').innerText = "✏️ EDITANDO: " + p.nome;
    document.getElementById('btn-cancelar-edit-elem').style.display = 'block';
    document.getElementById('form-elem-box').scrollIntoView({ behavior: 'smooth' });
}

export function cancelarEdicaoElem() {
    setElemEditandoId(null);
    document.getElementById('novo-elem-nome').value = "";
    document.getElementById('titulo-elem-form').innerText = "🔥 CRIAR ATAQUE ELEMENTAL";
    document.getElementById('btn-cancelar-edit-elem').style.display = 'none';
    let bn = document.querySelector(`.badge-elem[data-elem="Neutro"]`);
    if (bn) bn.click();
}

export function toggleEquiparElem(idStr) {
    let id = parseInt(idStr); if (!minhaFicha.ataquesElementais) return;
    let itemIndex = minhaFicha.ataquesElementais.findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    minhaFicha.ataquesElementais[itemIndex].equipado = !minhaFicha.ataquesElementais[itemIndex].equipado;
    renderizarElementos();
    salvarFichaSilencioso();
    window.atualizarInputsDeDano();
}

export function deletarElem(idStr) {
    if (confirm("Deseja apagar este ataque elemental do grimório?")) {
        let id = parseInt(idStr);
        minhaFicha.ataquesElementais = minhaFicha.ataquesElementais.filter(i => i.id !== id);
        renderizarElementos();
        salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    }
}

// Tabelas de emojis e cores dos elementos
const emogis = {
    'Fogo': '🔥', 'Água': '💧', 'Raio': '⚡', 'Terra': '🪨', 'Vento': '🌪️',
    'Fogo Verdadeiro': '🔥', 'Água Verdadeira': '💧', 'Raio Verdadeiro': '⚡', 'Terra Verdadeira': '🪨', 'Vento Verdadeiro': '🌪️',
    'Solar': '☀️', 'Solar Verdadeiro': '☀️', 'Gelo': '❄️', 'Gelo Verdadeiro': '❄️', 'Natureza': '🌿', 'Natureza Verdadeira': '🌿', 'Energia': '💫', 'Energia Verdadeira': '💫', 'Vácuo': '🕳️', 'Vácuo Verdadeiro': '🕳️',
    'Luz': '✨', 'Trevas': '🌑', 'Ether': '🌌', 'Celestial': '🌟', 'Infernal': '🌋', 'Caos': '🌀', 'Criação': '🎇', 'Destruição': '💥', 'Cosmos': '♾️',
    'Vida': '🌺', 'Morte': '💀', 'Vazio': '⬛', 'Neutro': '⚪',
    'Magia de Osso': '🦴', 'Magia de Sangue': '🩸', 'Magia de Borracha': '🎈', 'Magia de Sal': '🧂', 'Magia da Alma': '👻', 'Magia de Tremor': '🫨', 'Magia de Gravidade': '🌌', 'Magia de Equipamento': '⚙️', 'Magia de Tempo': '⏳', 'Magia Draconica': '🐉', 'Magia de Espelho': '🪞', 'Magia de Explosão': '💥', 'Magia Espacial': '🌀', 'Magia de Metamorfose': '🎭',
    'Magia Arcana/Negra': '🔮', 'Magia de Ciclo': '🔄',
    'Elemento Madeira': '🪵', 'Elemento Mineral': '💎', 'Elemento Cinzas': '🌫️', 'Elemento Ígneo': '☄️', 'Elemento Lava': '🌋', 'Elemento Vapor': '♨️', 'Elemento Névoa': '🌫️', 'Elemento Tempestade': '🌩️', 'Elemento Areia': '🏜️', 'Elemento Tufão': '🌪️',
    'Elemento Velocidade': '💨', 'Elemento Poeira': '🔲', 'Elemento Calor': '🌡️', 'Elemento Cal': '⬜', 'Elemento Carbono': '⬛', 'Elemento Veneno': '☣️', 'Elemento Magnetismo': '🧲'
};

const cores = {
    'Fogo': '#ff4d4d', 'Água': '#4dffff', 'Raio': '#ffff4d', 'Terra': '#d2a679', 'Vento': '#4dff88',
    'Fogo Verdadeiro': '#ff0000', 'Água Verdadeira': '#00e6e6', 'Raio Verdadeiro': '#ffff00', 'Terra Verdadeira': '#d48846', 'Vento Verdadeiro': '#00ff40',
    'Solar': '#ffb366', 'Solar Verdadeiro': '#ff6600', 'Gelo': '#99ffff', 'Gelo Verdadeiro': '#00ffff', 'Natureza': '#66ff66', 'Natureza Verdadeira': '#00ff00', 'Energia': '#ff66ff', 'Energia Verdadeira': '#ff00ff', 'Vácuo': '#999999', 'Vácuo Verdadeiro': '#ffffff',
    'Luz': '#ffffff', 'Trevas': '#800080', 'Ether': '#b366ff', 'Celestial': '#ffffcc', 'Infernal': '#cc0000', 'Caos': '#ff3399', 'Criação': '#00ffcc', 'Destruição': '#8b0000', 'Cosmos': '#4d0099',
    'Vida': '#33ff77', 'Morte': '#4d4d4d', 'Vazio': '#1a1a1a', 'Neutro': '#cccccc',
    'Magia de Osso': '#e6e6e6', 'Magia de Sangue': '#ff0000', 'Magia de Borracha': '#ff99cc', 'Magia de Sal': '#fdfdfd', 'Magia da Alma': '#33cccc', 'Magia de Tremor': '#cc9966', 'Magia de Gravidade': '#6600cc', 'Magia de Equipamento': '#b3b3b3', 'Magia de Tempo': '#ffd700', 'Magia Draconica': '#ff5500', 'Magia de Espelho': '#ccffff', 'Magia de Explosão': '#ff3300', 'Magia Espacial': '#000066', 'Magia de Metamorfose': '#ff66b3',
    'Magia Arcana/Negra': '#9900cc', 'Magia de Ciclo': '#00cc99',
    'Elemento Madeira': '#8b5a2b', 'Elemento Mineral': '#e6e6fa', 'Elemento Cinzas': '#808080', 'Elemento Ígneo': '#ff4500', 'Elemento Lava': '#ff0000', 'Elemento Vapor': '#ffb6c1', 'Elemento Névoa': '#b0e0e6', 'Elemento Tempestade': '#ccccff', 'Elemento Areia': '#f4a460', 'Elemento Tufão': '#98fb98',
    'Elemento Velocidade': '#e6ffff', 'Elemento Poeira': '#d9d9d9', 'Elemento Calor': '#ff6600', 'Elemento Cal': '#e6ccb3', 'Elemento Carbono': '#595959', 'Elemento Veneno': '#9933ff', 'Elemento Magnetismo': '#4169e1'
};

function renderMagia(p) {
    let isEquipped = p.equipado;
    let corPura = cores[p.elemento] || '#cccccc';
    let c = isEquipped ? corPura : '#888';
    let hex = corPura.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 6) { r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16); }
    let bg = isEquipped ? `rgba(${r},${g},${b},0.15)` : 'rgba(0,0,0,0.4)';

    let elemText = p.elemento ? p.elemento : 'Neutro';
    let elemClass = 'elem-' + elemText.toLowerCase().replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/[\s\/]+/g, '-');

    let bTipo = p.bonusTipo || 'nenhum';
    let isMult = bTipo.includes('mult_');
    let prefixo = isMult ? 'x' : '+';
    let propText = bTipo === 'nenhum' ? 'Apenas Elemento' : bTipo.replace('_', ' ').toUpperCase();
    let bValorStr = bTipo === 'nenhum' ? '' : `: <strong style="color:#ffcc00;">${prefixo}${p.bonusValor || 0}</strong>`;

    let dadosStr = p.dadosExtraQtd > 0 ? ` | Dados: <strong style="color:#f90;">+${p.dadosExtraQtd}d${p.dadosExtraFaces || 20}</strong>` : '';
    let custoStr = p.custoValor > 0 ? ` | Custo: <strong style="color:#f0f;">${p.custoValor}%</strong>` : '';

    return `<div class="def-box" style="border-left: 5px solid ${c}; background: ${bg}; margin-top: 15px; padding: 15px; transition: all 0.3s;">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px;">
            <div><h3 style="margin:0; color:${c}; text-shadow:0 0 10px ${c};">${emogis[elemText] || '✨'} ${p.nome || 'Ataque'}</h3>
            <p style="color:#0ff; font-size:0.9em; margin:5px 0 0;">Afinidade: <span class="${elemClass}">${elemText.toUpperCase()}</span> | Bônus: ${propText}${bValorStr}${dadosStr}${custoStr}</p></div>
            <div style="display:flex; gap:10px;">
            <button class="btn-neon" style="border-color:${c}; color:${c}; padding:5px 15px; font-size: 1.1em; margin:0;" onclick="window.toggleEquiparElem('${p.id}')">${isEquipped ? '🔴 CONJURADO' : '⚪ GUARDADO'}</button>
            <button class="btn-neon btn-blue" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.editarElem('${p.id}')">✏️ EDITAR</button>
            <button class="btn-neon btn-red" style="padding:5px 15px; font-size: 1em; margin:0;" onclick="window.deletarElem('${p.id}')">🗑️</button>
            </div></div></div>`;
}

export function initElementosListeners() {
    var badges = document.querySelectorAll('.badge-elem[data-elem][data-color]');
    for (var i = 0; i < badges.length; i++) {
        badges[i].addEventListener('click', function() {
            setElemento(this.getAttribute('data-elem'), this, this.getAttribute('data-color'));
        });
    }

    var btnCancelar = document.getElementById('btn-cancelar-edit-elem');
    if (btnCancelar) btnCancelar.addEventListener('click', function() { cancelarEdicaoElem(); });

    var btnSalvar = document.getElementById('btn-salvar-elem');
    if (btnSalvar) btnSalvar.addEventListener('click', function() { salvarNovoElem(); });
}

export function renderizarElementos() {
    try {
        let d = document.getElementById('lista-elementos-salvos');
        if (!d) return; d.innerHTML = '';
        if (!minhaFicha.ataquesElementais || !minhaFicha.ataquesElementais.length) {
            d.innerHTML = '<p style="color:#888;">Nenhum ataque elemental no grimório.</p>';
            return;
        }

        let elemFiltroEl = document.getElementById('novo-elem-tipo');
        let elemFiltro = elemFiltroEl ? elemFiltroEl.value : 'Neutro';

        let magiasDoGrupo = minhaFicha.ataquesElementais.filter(e => (e.elemento || 'Neutro') === elemFiltro);
        let magiasConjuradasOutros = minhaFicha.ataquesElementais.filter(e => e.equipado && (e.elemento || 'Neutro') !== elemFiltro);

        let html = '';

        if (magiasDoGrupo.length > 0) {
            let corCss = cores[elemFiltro] || '#ccc';
            html += `<h3 style="color: ${corCss}; margin-top: 10px; border-bottom: 1px solid ${corCss}; padding-bottom: 5px; text-transform: uppercase;">${emogis[elemFiltro] || '✨'} Magias de ${elemFiltro}</h3>`;
            magiasDoGrupo.forEach(p => { html += renderMagia(p); });
        } else {
            html += `<p style="color:#888; font-style:italic; margin-top: 20px;">Nenhuma magia de <strong>${elemFiltro}</strong> forjada. Crie a sua primeira acima!</p>`;
        }

        if (magiasConjuradasOutros.length > 0) {
            html += `<h3 style="color: #ffcc00; margin-top: 40px; border-bottom: 1px solid #ffcc00; padding-bottom: 5px; text-transform: uppercase; text-shadow: 0 0 10px #ffcc00;">⚡ Outras Magias Ativas (Conjuradas)</h3>`;
            magiasConjuradasOutros.forEach(p => { html += renderMagia(p); });
        }

        d.innerHTML = html;
    } catch (e) { console.error("Erro nos elementos", e); }
}
