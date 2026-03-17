// ==========================================
// APP.JS — Bootstrap: importa módulos e expõe no window
// ==========================================

// === CORE ===
import { contarDigitos, tratarUnico, pegarDoisPrimeirosDigitos, isFisico, isEnergia } from './core/utils.js';
import { getBuffs, getRawBase, getEfetivoBase, getMultiplicadorTotal, getMaximo, isStatBuffed, getPoderesDefesa, getPoderTotalDaAbaPoderes } from './core/attributes.js';
import { getDivisorPara, getPrestigioReal, calcPAtual, getRank } from './core/prestige.js';

// === STATE ===
import { fichaPadrao, minhaFicha, meuNome, setMeuNome, sanitizarNome, carregarDadosFicha } from './state/store.js';

// === SERVICES ===
import { db } from './services/firebase-config.js';
import { salvarFichaSilencioso, salvarFirebaseImediato, carregarFichaDoFirebase, iniciarListenerPersonagens, iniciarListenerFeed, enviarParaFeed } from './services/firebase-sync.js';

// === COMPONENTS ===
import { mudarAba, initTabsListeners } from './components/tabs.js';
import { renderizarFeed } from './components/feed.js';
import { renderizarListaPersonagensLocal, toggleMestre, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, fecharModalDelete, confirmarDelecao, initPerfilListeners } from './components/perfil.js';
import { setElemento, salvarNovoElem, editarElem, cancelarEdicaoElem, toggleEquiparElem, deletarElem, renderizarElementos, initElementosListeners } from './components/elementos.js';
import { salvarNovoItem, editarItem, cancelarEdicaoItem, toggleEquiparItem, deletarItem, renderizarInventario, initArsenalListeners } from './components/arsenal.js';
import { addEfeitoTemp, removerEfeitoTemp, renderizarEfeitosTemp, salvarNovoPoder, editarPoder, cancelarEdicaoPoder, togglePoder, deletarPoder, renderizarListaPoderes, initPoderesListeners } from './components/poderes.js';
import { desativarSync, salvarConfigAtaque, carregarConfigAtaqueInicial, atualizarInputsDeDano, rolarDano, initAtaqueListeners } from './components/ataque.js';
import { declararEvasiva, declararResistencia, declararReducao, initDefesaListeners } from './components/defesa.js';
import { rolarAcerto, initAcertoListeners } from './components/acerto.js';
import { inicializarAtuais, desenharRadar, atualizarBarrasVisuais, alterarHP, curarTudo, aplicarRegeneracaoTurno, initStatusListeners } from './components/status.js';
import { carregarAtributoNaTela, salvarAtributo, atualizarDivisores, carregarTabelaPrestigio, aplicarPrestigioNaFicha, salvarTabelaAoServidor, initFichaListeners } from './components/ficha.js';
// import { initMap, atualizarMapa } from './components/map.js';
import { initMap, atualizarMapa, alterarZoom, setMinhaIniciativa, avancarTurno } from './components/map.js';
// Onde você importa o mapa no topo do app.js:
//import { initMap, atualizarMapa, alterarZoom } from './components/map.js';

// Mais para baixo, onde você expõe para o window:
window.alterarZoom = alterarZoom;
// ==========================================
// EXPOR NO WINDOW (usados por outros módulos JS via window.*)
// ==========================================

// Core (used by other JS modules)
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

// Services (used by other JS modules)
window.salvarFichaSilencioso = salvarFichaSilencioso;

// Tabs (used by perfil.js, ataque.js, defesa.js, acerto.js)
window.mudarAba = mudarAba;

// Feed (used by ataque.js, defesa.js, acerto.js)
window.renderizarFeed = renderizarFeed;

// Perfil (used by tabs.js, perfil.js dynamic HTML, app.js listener)
window.renderizarListaPersonagensLocal = renderizarListaPersonagensLocal;
window.carregarPersonagemExistente = carregarPersonagemExistente;
window.abrirModalDelete = abrirModalDelete;

// Elementos (used by elementos.js dynamic HTML)
window.toggleEquiparElem = toggleEquiparElem;
window.editarElem = editarElem;
window.deletarElem = deletarElem;
window.renderizarElementos = renderizarElementos;

// Arsenal (used by arsenal.js dynamic HTML)
window.toggleEquiparItem = toggleEquiparItem;
window.editarItem = editarItem;
window.deletarItem = deletarItem;
window.renderizarInventario = renderizarInventario;

// Poderes (used by poderes.js dynamic HTML)
window.removerEfeitoTemp = removerEfeitoTemp;
window.togglePoder = togglePoder;
window.editarPoder = editarPoder;
window.deletarPoder = deletarPoder;
window.renderizarListaPoderes = renderizarListaPoderes;

// Ataque (used by tabs.js, perfil.js, poderes.js, elementos.js, status.js)
window.carregarConfigAtaqueInicial = carregarConfigAtaqueInicial;
window.atualizarInputsDeDano = atualizarInputsDeDano;

// Status (used by tabs.js, perfil.js, ficha.js, ataque.js, defesa.js, poderes.js)
window.inicializarAtuais = inicializarAtuais;
window.atualizarBarrasVisuais = atualizarBarrasVisuais;
window.curarTudo = curarTudo;

// Ficha (used by tabs.js, status.js)
window.carregarAtributoNaTela = carregarAtributoNaTela;
window.carregarTabelaPrestigio = carregarTabelaPrestigio;

// Mapa (used by tabs.js)
window.initMap = initMap;
window.atualizarMapa = atualizarMapa;
window.setMinhaIniciativa = setMinhaIniciativa;
window.avancarTurno = avancarTurno;

// --- FUNÇÃO PARA SALVAR A INICIATIVA ---
window.atualizarMinhaIniciativa = function() {
    let valor = parseInt(document.getElementById('minha-iniciativa').value) || 0;
    
    // Atualiza a ficha atual
    if (minhaFicha) {
        minhaFicha.iniciativa = valor;
        
        // Usa a função de salvar que já existe no seu sistema para subir pro Firebase!
        if (typeof window.salvarFichaSilencioso === "function") {
            window.salvarFichaSilencioso();
        } else if (typeof window.salvarFichaBase === "function") {
            window.salvarFichaBase();
        }
        
        console.log("Iniciativa salva com sucesso: " + valor);
    }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================

// Nome do jogador
let _meuNome = "";
try { _meuNome = localStorage.getItem("rpgNome"); } catch (e) { }
if (!_meuNome) { _meuNome = prompt("Seu nome:") || "Caçador"; }
_meuNome = sanitizarNome(_meuNome);
try { localStorage.setItem("rpgNome", _meuNome); } catch (e) { }
setMeuNome(_meuNome);

let elPerfil = document.getElementById('perfil-nome');
if (elPerfil) elPerfil.value = meuNome;

// Carregar backup local
try {
    let backupLocal = localStorage.getItem("rpgFicha_" + meuNome);
    if (backupLocal) carregarDadosFicha(JSON.parse(backupLocal));
} catch (e) { }

// Firebase
if (db) {
    carregarFichaDoFirebase(meuNome).then(function (dados) {
        if (dados && Object.keys(dados).length > 2) carregarDadosFicha(dados);
        carregarConfigAtaqueInicial();
        inicializarAtuais();
        carregarTabelaPrestigio();
        atualizarBarrasVisuais();
        renderizarListaPoderes();
        renderizarInventario();
        renderizarElementos();
        atualizarInputsDeDano();
    });

    iniciarListenerPersonagens(function (dados) {
        atualizarMapa(dados);
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
        renderizarFeed(d);
    });
}

// ==========================================
// FUNÇÕES GLOBAIS DE INTERFACE
// ==========================================

window.salvarImagemBase = function() {
    let inputImg = document.getElementById('perfil-imagem');
    if (!inputImg) return;

    let url = inputImg.value.trim();
    if (!minhaFicha.avatar) minhaFicha.avatar = { base: "" };
    minhaFicha.avatar.base = url;

    salvarFichaSilencioso(); // Salva no banco de dados

    alert("✅ Imagem Base do personagem salva!");

    // Recarrega o mapa para a imagem aparecer na hora
    initMap();
};

// ==========================================
// DOMContentLoaded (Início do Sistema)
// ==========================================
window.addEventListener('DOMContentLoaded', function () {
    // Inicializar todos os listeners de componentes
    initTabsListeners();
    initPerfilListeners();
    initStatusListeners();
    initFichaListeners();
    initElementosListeners();
    initArsenalListeners();
    initPoderesListeners();
    initAtaqueListeners();
    initAcertoListeners();
    initDefesaListeners();

    setTimeout(function () {
        let isM = localStorage.getItem("rpgIsMestre") === "sim";
        let elChk = document.getElementById('chk-mestre');
        if (elChk) { elChk.checked = isM; toggleMestre(); }

        carregarConfigAtaqueInicial();
        inicializarAtuais();
        carregarAtributoNaTela();
        atualizarBarrasVisuais();
        renderizarListaPoderes();
        renderizarInventario();
        renderizarElementos();
        atualizarInputsDeDano();
        renderizarListaPersonagensLocal();

        // Preenche o campo da imagem com o que está salvo no banco
        let inputImg = document.getElementById('perfil-imagem');
        if (inputImg && minhaFicha.avatar) {
            inputImg.value = minhaFicha.avatar.base || "";
        }

    }, 300);
});
