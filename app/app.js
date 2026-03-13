// ==========================================
// APP.JS — Bootstrap: conecta módulos ao DOM
// ==========================================

// === CORE (matemática pura) ===
import { contarDigitos, tratarUnico, pegarDoisPrimeirosDigitos, isFisico, isEnergia } from './core/utils.js';
import { getBuffs, getRawBase, getEfetivoBase, getMultiplicadorTotal, getMaximo, isStatBuffed, getPoderesDefesa, getPoderTotalDaAbaPoderes } from './core/attributes.js';
import { getDivisorPara, getPrestigioReal, calcPAtual, getRank } from './core/prestige.js';
import { calcularDano, calcularAcerto, calcularEvasiva, calcularResistencia, calcularReducao } from './core/engine.js';

// === STATE ===
import {
    fichaPadrao, minhaFicha, meuNome, efeitosTemp,
    poderEditandoId, itemEditandoId, elemEditandoId, personagemParaDeletar,
    setMinhaFicha, setMeuNome, setEfeitosTemp, setPoderEditandoId,
    setItemEditandoId, setElemEditandoId, setPersonagemParaDeletar,
    carregarDadosFicha, resetFicha
} from './state/store.js';

// === SERVICES ===
import { db } from './services/firebase-config.js';
import {
    salvarFichaSilencioso, carregarFichaDoFirebase,
    iniciarListenerPersonagens, iniciarListenerFeed,
    enviarParaFeed, deletarPersonagem
} from './services/firebase-sync.js';

// ==========================================
// EXPOR NO WINDOW — Os onclick do HTML usam window.*
// ==========================================

// Helpers re-exportados para o window (usados por componentes/UI)
window.contarDigitos = contarDigitos;
window.tratarUnico = tratarUnico;
window.pegarDoisPrimeirosDigitos = pegarDoisPrimeirosDigitos;
window.isFisico = isFisico;
window.isEnergia = isEnergia;
window.getBuffs = getBuffs;
window.getRawBase = getRawBase;
window.getEfetivoBase = getEfetivoBase;
window.getMultiplicadorTotal = getMultiplicadorTotal;
window.getMaximo = getMaximo;
window.isStatBuffed = isStatBuffed;
window.getPoderesDefesa = getPoderesDefesa;
window.getPoderTotalDaAbaPoderes = getPoderTotalDaAbaPoderes;
window.getDivisorPara = getDivisorPara;
window.getPrestigioReal = getPrestigioReal;
window.calcPAtual = calcPAtual;
window.getRank = getRank;

window.salvarFichaSilencioso = salvarFichaSilencioso;

// ==========================================
// INICIALIZAÇÃO DO NOME E FICHA
// ==========================================
let _meuNome = "";
try { _meuNome = localStorage.getItem("rpgNome"); } catch (e) { }
if (!_meuNome) { _meuNome = prompt("Seu nome:") || "Caçador"; try { localStorage.setItem("rpgNome", _meuNome); } catch (e) { } }
setMeuNome(_meuNome);

let elPerfil = document.getElementById('perfil-nome');
if (elPerfil) elPerfil.value = meuNome;

// Carregar backup local
try {
    let backupLocal = localStorage.getItem("rpgFicha_" + meuNome);
    if (backupLocal) carregarDadosFicha(JSON.parse(backupLocal));
} catch (e) { }

// ==========================================
// FUNÇÃO: setElemento (Botão Interativo Elemental)
// ==========================================
window.setElemento = function (nome, el, cor) {
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
    window.renderizarElementos();
};

// ==========================================
// FIREBASE: carregar e listeners
// ==========================================
function inicializarFirebase() {
    if (!db) return;
    carregarFichaDoFirebase(meuNome).then(function (dados) {
        if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
        window.carregarConfigAtaqueInicial();
        window.inicializarAtuais();
        window.carregarTabelaPrestigio();
        window.atualizarBarrasVisuais();
        window.renderizarListaPoderes();
        window.renderizarInventario();
        window.renderizarElementos();
        window.atualizarInputsDeDano();
    });

    iniciarListenerPersonagens(function (dados) {
        let lista = Object.keys(dados);
        let div = document.getElementById('lista-personagens-mestre');
        if (!div) return;
        div.innerHTML = '';
        if (lista.length === 0) { div.innerHTML = '<p style="color:#888;">Nenhum personagem salvo.</p>'; return; }
        for (let i = 0; i < lista.length; i++) {
            let nome = lista[i];
            let mark = (nome === meuNome) ? ' <span style="color:#0f0;font-size:0.6em;">(ATUAL)</span>' : '';
            div.innerHTML += '<div class="char-card"><div class="char-name">' + nome + mark + '</div><div class="char-actions"><button class="btn-neon btn-gold btn-small" onclick="window.carregarPersonagemExistente(\'' + nome + '\')">▶ CARREGAR</button><button class="btn-neon btn-red btn-small" onclick="window.abrirModalDelete(\'' + nome + '\')">🗑️ APAGAR</button></div></div>';
        }
    });

    iniciarListenerFeed(function (d) {
        window.renderizarFeed(d);
    });
}

inicializarFirebase();

// ==========================================
// UI: Renderização de listas de personagens
// ==========================================
window.renderizarListaPersonagensLocal = function () {
    let html = '';
    for (let i = 0; i < localStorage.length; i++) {
        let k = localStorage.key(i);
        if (k.startsWith("rpgFicha_")) {
            let n = k.replace("rpgFicha_", "");
            let mark = (n === meuNome) ? ' <span style="color:#0f0;font-size:0.6em;">(ATUAL)</span>' : '';
            html += '<div class="char-card"><div class="char-name">' + n + mark + '</div><div class="char-actions"><button class="btn-neon btn-gold btn-small" onclick="window.carregarPersonagemExistente(\'' + n + '\')">▶ CARREGAR</button></div></div>';
        }
    }
    if (!html) html = '<p style="color:#888;">Nenhum personagem encontrado no seu navegador.</p>';
    let elJogador = document.getElementById('lista-personagens-jogador');
    if (elJogador) elJogador.innerHTML = html;

    let elMestre = document.getElementById('lista-personagens-mestre');
    if (elMestre && !db) {
        let htmlMestre = '';
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k.startsWith("rpgFicha_")) {
                let n = k.replace("rpgFicha_", "");
                let mark = (n === meuNome) ? ' <span style="color:#0f0;font-size:0.6em;">(ATUAL)</span>' : '';
                htmlMestre += '<div class="char-card"><div class="char-name">' + n + mark + '</div><div class="char-actions"><button class="btn-neon btn-gold btn-small" onclick="window.carregarPersonagemExistente(\'' + n + '\')">▶ CARREGAR</button><button class="btn-neon btn-red btn-small" onclick="window.abrirModalDelete(\'' + n + '\')">🗑️ APAGAR</button></div></div>';
            }
        }
        elMestre.innerHTML = htmlMestre;
    }
};

// ==========================================
// SESSÃO: Troca de personagem e Mestre
// ==========================================
window.toggleMestre = function () {
    let isM = document.getElementById('chk-mestre').checked;
    localStorage.setItem("rpgIsMestre", isM ? "sim" : "nao");
    document.getElementById('btn-mestre').style.display = isM ? 'block' : 'none';
    if (!isM && document.getElementById('aba-mestre').classList.contains('ativo')) {
        window.mudarAba('aba-status', document.querySelectorAll('.nav-btn')[2]);
    }
};

window.trocarPersonagem = function () {
    let n = document.getElementById('perfil-nome').value.trim();
    if (n === "") return;
    setMeuNome(n);
    localStorage.setItem("rpgNome", n);
    // Reset ficha e carregar do backup local
    Object.assign(minhaFicha, JSON.parse(JSON.stringify(fichaPadrao)));
    let bl = localStorage.getItem("rpgFicha_" + n);
    if (bl) { try { carregarDadosFicha(JSON.parse(bl)); } catch (e) { } }
    if (db) {
        carregarFichaDoFirebase(n).then(function (dados) {
            if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
            window.carregarConfigAtaqueInicial();
            window.inicializarAtuais();
            window.carregarTabelaPrestigio();
            window.atualizarBarrasVisuais();
            window.renderizarListaPoderes();
            window.renderizarInventario();
            window.renderizarElementos();
            window.atualizarInputsDeDano();
            window.renderizarListaPersonagensLocal();
        });
    }
    window.carregarConfigAtaqueInicial();
    window.inicializarAtuais();
    window.carregarTabelaPrestigio();
    window.atualizarBarrasVisuais();
    window.renderizarListaPoderes();
    window.renderizarInventario();
    window.renderizarElementos();
    window.atualizarInputsDeDano();
    window.renderizarListaPersonagensLocal();
    window.mudarAba('aba-status');
};

window.carregarPersonagemExistente = function (n) { document.getElementById('perfil-nome').value = n; window.trocarPersonagem(); };
window.abrirModalDelete = function (n) { setPersonagemParaDeletar(n); document.getElementById('delete-char-name').innerText = n; document.getElementById('modal-delete').style.display = 'flex'; };
window.fecharModalDelete = function () { document.getElementById('modal-delete').style.display = 'none'; setPersonagemParaDeletar(""); };
window.confirmarDelecao = function () {
    deletarPersonagem(personagemParaDeletar);
    if (meuNome === personagemParaDeletar) {
        setMeuNome("Sem Nome");
        localStorage.setItem("rpgNome", meuNome);
        document.getElementById('perfil-nome').value = meuNome;
        window.trocarPersonagem();
    }
    window.fecharModalDelete();
    window.renderizarListaPersonagensLocal();
};

// ==========================================
// NAVEGAÇÃO DE ABAS
// ==========================================
window.mudarAba = function (idAba, el) {
    try {
        let panels = document.querySelectorAll('.glass-panel'); for (let i = 0; i < panels.length; i++) panels[i].classList.remove('ativo');
        let btns = document.querySelectorAll('.nav-btn'); for (let i = 0; i < btns.length; i++) btns[i].classList.remove('ativo');
        let aba = document.getElementById(idAba); if (aba) aba.classList.add('ativo'); if (el) el.classList.add('ativo');
        if (idAba === 'aba-ficha') window.carregarAtributoNaTela();
        if (idAba === 'aba-status') window.atualizarBarrasVisuais();
        if (idAba === 'aba-poderes') window.renderizarListaPoderes();
        if (idAba === 'aba-arsenal') window.renderizarInventario();
        if (idAba === 'aba-elementos') window.renderizarElementos();
        if (idAba === 'aba-ataque') {
            window.carregarConfigAtaqueInicial();
            window.atualizarInputsDeDano();
        }
        if (idAba === 'aba-perfil' || idAba === 'aba-mestre') window.renderizarListaPersonagensLocal();
    } catch (e) { }
};

// ==========================================
// MOTOR DE SALVAMENTO DE ATAQUE
// ==========================================
window.desativarSync = function () {
    window.salvarConfigAtaque(true);
    window.atualizarInputsDeDano();
};

window.salvarConfigAtaque = function (silent) {
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
            let old = btn.innerText;
            btn.innerText = "✅ SALVO!";
            btn.style.borderColor = "#0f0";
            btn.style.color = "#0f0";
            setTimeout(() => { btn.innerText = "💾 FORÇAR SALVAMENTO (OPCIONAL)"; btn.style.borderColor = "#ffcc00"; btn.style.color = "#ffcc00"; }, 2000);
        }
    }
};

window.carregarConfigAtaqueInicial = function () {
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
};

// ==========================================
// INPUTS DE DANO (Holograma de Buffs)
// ==========================================
window.atualizarInputsDeDano = function () {
    try {
        let chks = document.querySelectorAll('.chk-stat:checked'); let sels = [];
        for (let i = 0; i < chks.length; i++) sels.push(chks[i].value);
        if (!sels.length) sels = ['forca'];

        let main = sels[0];
        if (!minhaFicha || !minhaFicha[main]) return;

        let b = getBuffs(main);

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
};

// ==========================================
// PRESTÍGIO UI
// ==========================================
window.atualizarDivisores = function () {
    if (!minhaFicha.divisores) minhaFicha.divisores = { vida: 1, status: 1, mana: 1, aura: 1, chakra: 1, corpo: 1 };
    minhaFicha.divisores.vida = parseFloat(document.getElementById('div-vida').value) || 1;
    minhaFicha.divisores.status = parseFloat(document.getElementById('div-status').value) || 1;
    minhaFicha.divisores.mana = parseFloat(document.getElementById('div-mana').value) || 1;
    minhaFicha.divisores.aura = parseFloat(document.getElementById('div-aura').value) || 1;
    minhaFicha.divisores.chakra = parseFloat(document.getElementById('div-chakra').value) || 1;
    minhaFicha.divisores.corpo = parseFloat(document.getElementById('div-corpo').value) || 1;
    salvarFichaSilencioso();
    window.atualizarBarrasVisuais();
};

// ==========================================
// GRIMÓRIO ELEMENTAL
// ==========================================
window.salvarNovoElem = function () {
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
            window.cancelarEdicaoElem();
        } else {
            minhaFicha.ataquesElementais.push({ id: Date.now(), nome: n, elemento: elem, bonusTipo: bTipo, bonusValor: bVal, custoValor: cVal, dadosExtraQtd: dQtd, dadosExtraFaces: dFaces, equipado: false });
        }
        document.getElementById('novo-elem-nome').value = '';
        window.renderizarElementos();
        salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    } catch (e) { console.error(e); }
};

window.editarElem = function (idStr) {
    let id = parseInt(idStr); let p = null;
    if (!minhaFicha.ataquesElementais) return;
    for (let i = 0; i < minhaFicha.ataquesElementais.length; i++) { if (minhaFicha.ataquesElementais[i].id === id) p = minhaFicha.ataquesElementais[i]; }
    if (!p) return;
    if (p.equipado) { window.toggleEquiparElem(idStr); alert(`⚠️ O ataque [${p.nome}] foi DESATIVADO para edição.`); }

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
};

window.cancelarEdicaoElem = function () {
    setElemEditandoId(null);
    document.getElementById('novo-elem-nome').value = "";
    document.getElementById('titulo-elem-form').innerText = "🔥 CRIAR ATAQUE ELEMENTAL";
    document.getElementById('btn-cancelar-edit-elem').style.display = 'none';
    let bn = document.querySelector(`.badge-elem[data-elem="Neutro"]`);
    if (bn) bn.click();
};

window.toggleEquiparElem = function (idStr) {
    let id = parseInt(idStr); if (!minhaFicha.ataquesElementais) return;
    let itemIndex = minhaFicha.ataquesElementais.findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    minhaFicha.ataquesElementais[itemIndex].equipado = !minhaFicha.ataquesElementais[itemIndex].equipado;
    window.renderizarElementos();
    salvarFichaSilencioso();
    window.atualizarInputsDeDano();
};

window.deletarElem = function (idStr) {
    if (confirm("Deseja apagar este ataque elemental do grimório?")) {
        let id = parseInt(idStr);
        minhaFicha.ataquesElementais = minhaFicha.ataquesElementais.filter(i => i.id !== id);
        window.renderizarElementos();
        salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    }
};

window.renderizarElementos = function () {
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

        let emogis = {
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
        let cores = {
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

        let renderMagia = (p) => {
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
        };

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
};

// ==========================================
// ARSENAL E INVENTÁRIO
// ==========================================
window.salvarNovoItem = function () {
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
        window.cancelarEdicaoItem();
    } else {
        minhaFicha.inventario.push({ id: Date.now(), nome: n, tipo: tipo, elemento: 'Neutro', bonusTipo: bTipo, bonusValor: bVal, equipado: false });
    }
    document.getElementById('novo-item-nome').value = '';
    window.renderizarInventario();
    salvarFichaSilencioso();
};

window.editarItem = function (idStr) {
    let id = parseInt(idStr); let p = null;
    if (!minhaFicha.inventario) return;
    for (let i = 0; i < minhaFicha.inventario.length; i++) { if (minhaFicha.inventario[i].id === id) p = minhaFicha.inventario[i]; }
    if (!p) return;
    if (p.equipado) { window.toggleEquiparItem(idStr); alert(`⚠️ O item [${p.nome}] foi DESEQUIPADO para edição.`); }

    setItemEditandoId(p.id);
    document.getElementById('novo-item-nome').value = p.nome;
    document.getElementById('novo-item-tipo').value = p.tipo;
    document.getElementById('novo-item-bonus').value = p.bonusTipo;
    document.getElementById('novo-item-val').value = p.bonusValor;

    document.getElementById('titulo-item-form').innerText = "✏️ EDITANDO: " + p.nome;
    document.getElementById('btn-cancelar-edit-item').style.display = 'block';
    document.getElementById('form-item-box').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoItem = function () {
    setItemEditandoId(null);
    document.getElementById('novo-item-nome').value = "";
    document.getElementById('titulo-item-form').innerText = "🔨 FORJAR NOVO EQUIPAMENTO";
    document.getElementById('btn-cancelar-edit-item').style.display = 'none';
};

window.toggleEquiparItem = function (idStr) {
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
    window.renderizarInventario();
    salvarFichaSilencioso();
};

window.deletarItem = function (idStr) {
    if (confirm("Deseja destruir este equipamento permanentemente?")) {
        let id = parseInt(idStr);
        minhaFicha.inventario = minhaFicha.inventario.filter(i => i.id !== id);
        window.renderizarInventario();
        salvarFichaSilencioso();
    }
};

window.renderizarInventario = function () {
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
            let elemText = p.elemento && p.elemento !== 'Neutro' ? p.elemento : '';
            let elemHTML = elemText ? ` | Magia: <strong class="elem-${elemText.toLowerCase().replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/[\s\/]+/g, '-')}">${elemText.toUpperCase()}</strong>` : '';

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
};

// ==========================================
// PODERES E EFEITOS
// ==========================================
window.addEfeitoTemp = function () {
    efeitosTemp.push({ atributo: document.getElementById('novo-pod-atr').value, propriedade: document.getElementById('novo-pod-prop').value, valor: document.getElementById('novo-pod-val').value });
    window.renderizarEfeitosTemp();
};

window.removerEfeitoTemp = function (i) { efeitosTemp.splice(i, 1); window.renderizarEfeitosTemp(); };

window.renderizarEfeitosTemp = function () {
    let div = document.getElementById('efeitos-temp-list');
    if (efeitosTemp.length === 0) { div.innerHTML = '<p style="color:#888; font-size:0.9em; margin:0;">Nenhum efeito adicionado.</p>'; return; }
    let html = '';
    for (let i = 0; i < efeitosTemp.length; i++) {
        let e = efeitosTemp[i]; let prop = (e.propriedade || '').toLowerCase(); let m = (prop === 'mbase' || prop === 'mgeral' || prop === 'mformas' || prop === 'mabs' || prop === 'munico'); let prefixo = m ? '(x)' : '(+)';
        html += '<div style="color:#0ff; font-size:0.9em; margin-bottom:5px; background: rgba(0,255,255,0.1); padding: 5px 10px; border-left: 2px solid #0ff; display:flex; justify-content:space-between;"><span>► [' + (e.atributo || '').toUpperCase() + '] - [' + (e.propriedade || '').toUpperCase() + ']: <strong style="color:#ffcc00;">' + prefixo + ' ' + e.valor + '</strong></span><button onclick="window.removerEfeitoTemp(' + i + ')" style="background:transparent; color:#f00; border:none; cursor:pointer;">❌</button></div>';
    }
    div.innerHTML = html;
};

window.salvarNovoPoder = function () {
    try {
        let n = document.getElementById('novo-pod-nome').value.trim(); if (!n || !efeitosTemp.length) { alert("Falta nome ou efeitos!"); return; }
        if (!minhaFicha.poderes) minhaFicha.poderes = [];

        if (poderEditandoId) {
            let ix = -1; for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === poderEditandoId) ix = i; }
            if (ix !== -1) { minhaFicha.poderes[ix].nome = n; minhaFicha.poderes[ix].efeitos = efeitosTemp.slice(); }
            window.cancelarEdicaoPoder();
        } else { minhaFicha.poderes.push({ id: Date.now(), nome: n, ativa: false, efeitos: efeitosTemp.slice() }); }
        setEfeitosTemp([]);
        // Also clear the actual array
        efeitosTemp.length = 0;
        document.getElementById('novo-pod-nome').value = '';

        window.atualizarBarrasVisuais(); window.renderizarEfeitosTemp(); window.renderizarListaPoderes(); salvarFichaSilencioso();
        window.atualizarInputsDeDano();
    } catch (e) { console.error("Erro ao salvar:", e); alert("Erro ao salvar o poder. A Ficha recuperou a estabilidade."); }
};

window.editarPoder = function (idStr) {
    let id = parseInt(idStr); let p = null;
    for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === id) p = minhaFicha.poderes[i]; }
    if (!p) return;
    if (p.ativa) { window.togglePoder(idStr); alert(`⚠️ A habilidade [${p.nome}] foi DESATIVADA temporariamente para edição.`); }
    setPoderEditandoId(p.id);
    document.getElementById('novo-pod-nome').value = p.nome;
    // Copy efeitos to efeitosTemp
    let copied = JSON.parse(JSON.stringify(p.efeitos || []));
    efeitosTemp.length = 0;
    for (let i = 0; i < copied.length; i++) efeitosTemp.push(copied[i]);
    document.getElementById('titulo-poder-form').innerText = "✏️ EDITANDO: " + p.nome; document.getElementById('btn-cancelar-edit').style.display = 'block';
    window.renderizarEfeitosTemp(); document.getElementById('form-poder-box').scrollIntoView({ behavior: 'smooth' });
};

window.cancelarEdicaoPoder = function () {
    setPoderEditandoId(null);
    document.getElementById('novo-pod-nome').value = "";
    efeitosTemp.length = 0;
    document.getElementById('titulo-poder-form').innerText = "➕ CRIAR NOVO PODER"; document.getElementById('btn-cancelar-edit').style.display = 'none';
    window.renderizarEfeitosTemp();
};

window.togglePoder = function (idStr) {
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
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); window.renderizarListaPoderes(); window.atualizarInputsDeDano();
};

window.deletarPoder = function (idStr) {
    if (confirm("Tem certeza que deseja apagar este poder permanentemente?")) {
        let id = parseInt(idStr); let p = null;
        for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id === id) p = minhaFicha.poderes[i]; }
        if (p && p.ativa) window.togglePoder(idStr);
        let novaLista = []; for (let i = 0; i < minhaFicha.poderes.length; i++) { if (minhaFicha.poderes[i].id !== id) novaLista.push(minhaFicha.poderes[i]); }
        minhaFicha.poderes = novaLista; window.atualizarBarrasVisuais(); salvarFichaSilencioso(); window.renderizarListaPoderes(); window.atualizarInputsDeDano();
    }
};

window.renderizarListaPoderes = function () {
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
};

// ==========================================
// BARRAS VISUAIS, RADAR E AUTO-HEAL
// ==========================================
window.inicializarAtuais = function () {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let maxBruto = getMaximo(k); let maxFinal = maxBruto;
        if (k === 'vida') { let ptsMax = Math.max(0, contarDigitos(maxBruto) - 8); if (ptsMax > 0) maxFinal = Math.floor(maxBruto / Math.pow(10, ptsMax)); }
        if (!minhaFicha[k]) minhaFicha[k] = { atual: maxFinal }; let valAtual = parseFloat(minhaFicha[k].atual);
        if (isNaN(valAtual) || valAtual === null) { minhaFicha[k].atual = maxFinal; }
    }
};

window.carregarTabelaPrestigio = function () {
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
};

window.aplicarPrestigioNaFicha = function () {
    let elAsc = document.getElementById('pres-asc'); let ascB = elAsc ? Math.max(1, parseInt(elAsc.value) || 1) : 1;
    let elVid = document.getElementById('pres-vida'); let v1 = elVid ? Math.max(0, parseInt(elVid.value) || 0) : 0;
    let elSt = document.getElementById('pres-status'); let v2 = elSt ? Math.max(0, parseInt(elSt.value) || 0) : 0;
    let elMa = document.getElementById('pres-mana'); let v3 = elMa ? Math.max(0, parseInt(elMa.value) || 0) : 0;
    let elAu = document.getElementById('pres-aura'); let v4 = elAu ? Math.max(0, parseInt(elAu.value) || 0) : 0;
    let elCh = document.getElementById('pres-chakra'); let v5 = elCh ? Math.max(0, parseInt(elCh.value) || 0) : 0;
    let elCo = document.getElementById('pres-corpo'); let v6 = elCo ? Math.max(0, parseInt(elCo.value) || 0) : 0;

    minhaFicha.ascensaoBase = ascB;
    minhaFicha.vida.base = v1 * 1000000; minhaFicha.mana.base = v3 * 100000000;
    minhaFicha.aura.base = v4 * 100000000; minhaFicha.chakra.base = v5 * 100000000; minhaFicha.corpo.base = v6 * 100000000;

    let stBase = v2 * 1000; let sFisicos = ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao'];
    for (let i = 0; i < sFisicos.length; i++) minhaFicha[sFisicos[i]].base = stBase;
    window.atualizarBarrasVisuais();
};

window.salvarTabelaAoServidor = function () { window.aplicarPrestigioNaFicha(); window.curarTudo(); salvarFichaSilencioso(); alert("💾 Tabela de Prestígio salva na nuvem!"); };

window.desenharRadar = function () {
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
};

window.atualizarBarrasVisuais = function () {
    let confs = [{ k: 'vida', c: '#ff003c' }, { k: 'mana', c: '#0088ff' }, { k: 'aura', c: '#ffff00' }, { k: 'chakra', c: '#00ffff' }, { k: 'corpo', c: '#ff00ff' }];
    for (let i = 0; i < confs.length; i++) {
        let conf = confs[i]; let st = minhaFicha[conf.k]; let mx = getMaximo(conf.k); let p = 0;
        if (conf.k === 'vida') { p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
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
    window.carregarTabelaPrestigio(); window.desenharRadar(); window.atualizarInputsDeDano();
};

// ==========================================
// HP, CURA, REGENERAÇÃO
// ==========================================
window.alterarHP = function (tipo) {
    let el = document.getElementById('val-dano-cura'); let v = parseInt(el.value);
    if (isNaN(v) || v <= 0) return alert("⚠️ Digite um número maior que zero!");
    let letalidade = parseInt(document.getElementById('val-letalidade').value) || 0;
    let mx = getMaximo('vida'); let p = Math.max(0, contarDigitos(mx) - 8); let dif = letalidade - p;
    let ef = v; if (dif > 0) ef = v * Math.pow(10, dif); else if (dif < 0) ef = Math.floor(v / Math.pow(10, Math.abs(dif)));
    if (tipo === 'dano') minhaFicha.vida.atual -= ef; else minhaFicha.vida.atual += ef;
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); el.value = ''; document.getElementById('val-letalidade').value = '0';
};

window.curarTudo = function () {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let mx = getMaximo(k);
        if (k === 'vida') { let p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
        minhaFicha[k].atual = mx;
    }
    window.atualizarBarrasVisuais(); salvarFichaSilencioso();
};

window.aplicarRegeneracaoTurno = function () {
    let vitais = ['vida', 'mana', 'aura', 'chakra', 'corpo'];
    for (let i = 0; i < vitais.length; i++) {
        let k = vitais[i]; let r = parseFloat(minhaFicha[k] ? minhaFicha[k].regeneracao : 0) || 0;
        let b = getBuffs(k);
        minhaFicha[k].atual += r + b.regeneracao;
    }
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); alert("✨ Regeneração aplicada!");
};

// ==========================================
// FICHA: Editor de atributos
// ==========================================
window.carregarAtributoNaTela = function () {
    let s = document.getElementById('sel-atributo').value; let k = (s === 'todos_status') ? 'forca' : (s === 'todas_energias') ? 'mana' : s;
    let st = minhaFicha[k]; if (!st) return;
    document.getElementById('fch-base').value = st.base || 0; document.getElementById('fch-mbase').value = st.mBase || 1;
    document.getElementById('fch-mgeral').value = st.mGeral || 1; document.getElementById('fch-mformas').value = st.mFormas || 1;
    document.getElementById('fch-munico').value = st.mUnico || "1.0"; document.getElementById('fch-mabs').value = st.mAbsoluto || 1;
    document.getElementById('fch-redCusto').value = st.reducaoCusto || 0; document.getElementById('fch-regen').value = st.regeneracao || 0;
};

window.salvarAtributo = function () {
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
        minhaFicha[c].base = v.b; minhaFicha[c].mBase = v.mb; minhaFicha[c].mGeral = v.mg; minhaFicha[c].mFormas = v.mf; minhaFicha[c].mUnico = v.mu; minhaFicha[c].mAbsoluto = v.ma; minhaFicha[c].reducaoCusto = v.rc; minhaFicha[c].regeneracao = v.rg;
        if (c === 'vida' || c === 'mana' || c === 'aura' || c === 'chakra' || c === 'corpo') {
            let mx = getMaximo(c); if (c === 'vida') { let p = Math.max(0, contarDigitos(mx) - 8); if (p > 0) mx = Math.floor(mx / Math.pow(10, p)); }
            minhaFicha[c].atual = mx;
        }
    }
    window.atualizarBarrasVisuais(); salvarFichaSilencioso(); alert("✅ Salvo!");
};

// ==========================================
// COMBATE: Feed e Rolagens
// ==========================================
window.renderizarFeed = function (d) {
    let feed = document.getElementById('feed-combate'); if (feed.innerHTML.includes("Aguardando")) feed.innerHTML = ''; let div = document.createElement('div'); div.className = 'damage-log';
    if (d.tipo === 'acerto') { div.style.borderLeftColor = '#f90'; div.style.background = 'rgba(255,153,0,0.1)'; div.innerHTML = '<p style="color:#f90;">🎯 <strong>' + d.nome + '</strong> rolou Acerto usando <strong>' + d.atributosUsados + '</strong>' + d.armaStr + ':</p><h1 class="damage-number" style="color:#f90; text-shadow:0 0 20px rgba(255,153,0,0.8);">' + d.acertoTotal + '</h1><p class="lethality" style="color:#fff;">' + d.profBonusTexto + '</p><div class="log-details">🎲 Rolagem Base: ' + d.rolagem + '</div>'; }
    else if (d.tipo === 'evasiva') { div.style.borderLeftColor = '#0088ff'; div.style.background = 'rgba(0,136,255,0.1)'; div.innerHTML = '<p style="color:#0088ff;">💨 <strong>' + d.nome + '</strong> declarou Esquiva' + d.armaStr + ':</p><h1 class="damage-number" style="color:#0088ff; text-shadow:0 0 20px rgba(0,136,255,0.8);">' + d.total + '</h1><div class="log-details">' + d.baseCalc + '</div>'; }
    else if (d.tipo === 'resistencia') { div.style.borderLeftColor = '#ccc'; div.style.background = 'rgba(200,200,200,0.1)'; div.innerHTML = '<p style="color:#ccc;">🛡️ <strong>' + d.nome + '</strong> declarou Bloqueio' + d.armaStr + ':</p><h1 class="damage-number" style="color:#ccc; text-shadow:0 0 20px rgba(200,200,200,0.8);">' + d.total + '</h1><div class="log-details">' + d.baseCalc + '</div>'; }
    else if (d.tipo === 'escudo') { let tg = d.vitalidade > 0 ? ' <span style="color:#ffcc00;">(🌟 Vit: +' + d.vitalidade + ')</span>' : ''; div.style.borderLeftColor = '#f0f'; div.style.background = 'rgba(255,0,255,0.1)'; div.innerHTML = '<p style="color:#f0f;">✨ <strong>' + d.nome + '</strong> ativou Escudo' + d.armaStr + ':</p><h1 class="damage-number" style="color:#f0f; text-shadow:0 0 20px rgba(255,0,255,0.8);">' + d.escudoReduzido.toLocaleString('pt-BR') + tg + '</h1><div class="log-details">' + d.detalhe + '</div>'; }
    else { div.innerHTML = '<p>💥 <strong>' + d.nome + '</strong> atacou usando <strong>' + d.atributosUsados + '</strong>' + d.armaStr + ':</p><h1 class="damage-number">' + d.dano.toLocaleString('pt-BR') + '</h1><p class="lethality">💀 LETALIDADE: ' + (d.letalidade > 0 ? '+' + d.letalidade : '0') + '</p><div class="log-details">🎲 Rolagem de Dados: ' + d.rolagem + d.rolagemMagica + (d.detalheEnergia || '') + (d.detalheConta || '') + '</div>'; }
    feed.prepend(div);
};

window.declararEvasiva = function () {
    let prof = parseInt(document.getElementById('def-eva-prof').value) || 0;
    let bonus = parseInt(document.getElementById('def-eva-bonus').value) || 0;
    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularEvasiva({ prof, bonus, minhaFicha, itensEquipados });
    let feedRenderedLocal = enviarParaFeed({ tipo: 'evasiva', nome: meuNome, ...result });
    if (feedRenderedLocal) window.renderizarFeed({ tipo: 'evasiva', nome: meuNome, ...result });
    window.mudarAba('aba-log');
};

window.declararResistencia = function () {
    let prof = parseInt(document.getElementById('def-res-prof').value) || 0;
    let bonus = parseInt(document.getElementById('def-res-bonus').value) || 0;
    let itensEquipados = minhaFicha.inventario ? minhaFicha.inventario.filter(i => i.equipado) : [];
    let result = calcularResistencia({ prof, bonus, minhaFicha, itensEquipados });
    let feedRenderedLocal = enviarParaFeed({ tipo: 'resistencia', nome: meuNome, ...result });
    if (feedRenderedLocal) window.renderizarFeed({ tipo: 'resistencia', nome: meuNome, ...result });
    window.mudarAba('aba-log');
};

window.declararReducao = function () {
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
};

window.rolarDano = function () {
    window.salvarConfigAtaque(true);

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

    window.atualizarBarrasVisuais(); salvarFichaSilencioso();

    let feedData = { tipo: 'dano', nome: meuNome, dano: result.dano, letalidade: result.letalidade, rolagem: result.rolagem, rolagemMagica: result.rolagemMagica, atributosUsados: result.atributosUsados, detalheEnergia: result.detalheEnergia, armaStr: result.armaStr, detalheConta: result.detalheConta };
    let feedRenderedLocal = enviarParaFeed(feedData);
    if (feedRenderedLocal) window.renderizarFeed(feedData);
    window.mudarAba('aba-log');
};

window.rolarAcerto = function () {
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
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        let isM = localStorage.getItem("rpgIsMestre") === "sim";
        let elChk = document.getElementById('chk-mestre');
        if (elChk) { elChk.checked = isM; window.toggleMestre(); }

        window.carregarConfigAtaqueInicial();
        window.inicializarAtuais();
        window.carregarAtributoNaTela();
        window.atualizarBarrasVisuais();
        window.renderizarListaPoderes();
        window.renderizarInventario();
        window.renderizarElementos();
        window.atualizarInputsDeDano();
        window.renderizarListaPersonagensLocal();
    }, 300);
});
