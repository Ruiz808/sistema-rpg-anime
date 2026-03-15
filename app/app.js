// ==========================================
// APP.JS — Bootstrap: importa módulos e expõe no window
// ==========================================

// === CORE ===
import { contarDigitos, tratarUnico, pegarDoisPrimeirosDigitos, isFisico, isEnergia } from './core/utils.js';
import { getBuffs, getRawBase, getEfetivoBase, getMultiplicadorTotal, getMaximo, isStatBuffed, getPoderesDefesa, getPoderTotalDaAbaPoderes } from './core/attributes.js';
import { getDivisorPara, getPrestigioReal, calcPAtual, getRank } from './core/prestige.js';

// === STATE ===
import { fichaPadrao, minhaFicha, meuNome, setMeuNome, carregarDadosFicha } from './state/store.js';

// === SERVICES ===
import { db } from './services/firebase-config.js';
import { salvarFichaSilencioso, salvarFirebaseImediato, carregarFichaDoFirebase, iniciarListenerPersonagens, iniciarListenerFeed, enviarParaFeed } from './services/firebase-sync.js';

// === COMPONENTS ===
import { mudarAba } from './components/tabs.js';
import { renderizarFeed } from './components/feed.js';
import { renderizarListaPersonagensLocal, toggleMestre, trocarPersonagem, carregarPersonagemExistente, abrirModalDelete, fecharModalDelete, confirmarDelecao } from './components/perfil.js';
import { setElemento, salvarNovoElem, editarElem, cancelarEdicaoElem, toggleEquiparElem, deletarElem, renderizarElementos } from './components/elementos.js';
import { salvarNovoItem, editarItem, cancelarEdicaoItem, toggleEquiparItem, deletarItem, renderizarInventario } from './components/arsenal.js';
import { addEfeitoTemp, removerEfeitoTemp, renderizarEfeitosTemp, salvarNovoPoder, editarPoder, cancelarEdicaoPoder, togglePoder, deletarPoder, renderizarListaPoderes } from './components/poderes.js';
import { desativarSync, salvarConfigAtaque, carregarConfigAtaqueInicial, atualizarInputsDeDano, rolarDano } from './components/ataque.js';
import { declararEvasiva, declararResistencia, declararReducao } from './components/defesa.js';
import { rolarAcerto } from './components/acerto.js';
import { inicializarAtuais, desenharRadar, atualizarBarrasVisuais, alterarHP, curarTudo, aplicarRegeneracaoTurno } from './components/status.js';
import { carregarAtributoNaTela, salvarAtributo, atualizarDivisores, carregarTabelaPrestigio, aplicarPrestigioNaFicha, salvarTabelaAoServidor } from './components/ficha.js';

// ==========================================
// EXPOR NO WINDOW (onclick do HTML)
// ==========================================

// Core
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

// Services
window.salvarFichaSilencioso = salvarFichaSilencioso;

// Tabs
window.mudarAba = mudarAba;

// Feed
window.renderizarFeed = renderizarFeed;

// Perfil
window.renderizarListaPersonagensLocal = renderizarListaPersonagensLocal;
window.toggleMestre = toggleMestre;
window.trocarPersonagem = trocarPersonagem;
window.carregarPersonagemExistente = carregarPersonagemExistente;
window.abrirModalDelete = abrirModalDelete;
window.fecharModalDelete = fecharModalDelete;
window.confirmarDelecao = confirmarDelecao;

// Elementos
window.setElemento = setElemento;
window.salvarNovoElem = salvarNovoElem;
window.editarElem = editarElem;
window.cancelarEdicaoElem = cancelarEdicaoElem;
window.toggleEquiparElem = toggleEquiparElem;
window.deletarElem = deletarElem;
window.renderizarElementos = renderizarElementos;

// Arsenal
window.salvarNovoItem = salvarNovoItem;
window.editarItem = editarItem;
window.cancelarEdicaoItem = cancelarEdicaoItem;
window.toggleEquiparItem = toggleEquiparItem;
window.deletarItem = deletarItem;
window.renderizarInventario = renderizarInventario;

// Poderes
window.addEfeitoTemp = addEfeitoTemp;
window.removerEfeitoTemp = removerEfeitoTemp;
window.renderizarEfeitosTemp = renderizarEfeitosTemp;
window.salvarNovoPoder = salvarNovoPoder;
window.editarPoder = editarPoder;
window.cancelarEdicaoPoder = cancelarEdicaoPoder;
window.togglePoder = togglePoder;
window.deletarPoder = deletarPoder;
window.renderizarListaPoderes = renderizarListaPoderes;

// Ataque
window.desativarSync = desativarSync;
window.salvarConfigAtaque = salvarConfigAtaque;
window.carregarConfigAtaqueInicial = carregarConfigAtaqueInicial;
window.atualizarInputsDeDano = atualizarInputsDeDano;
window.rolarDano = rolarDano;

// Defesa
window.declararEvasiva = declararEvasiva;
window.declararResistencia = declararResistencia;
window.declararReducao = declararReducao;

// Acerto
window.rolarAcerto = rolarAcerto;

// Status
window.inicializarAtuais = inicializarAtuais;
window.desenharRadar = desenharRadar;
window.atualizarBarrasVisuais = atualizarBarrasVisuais;
window.alterarHP = alterarHP;
window.curarTudo = curarTudo;
window.aplicarRegeneracaoTurno = aplicarRegeneracaoTurno;

// Ficha
window.carregarAtributoNaTela = carregarAtributoNaTela;
window.salvarAtributo = salvarAtributo;
window.atualizarDivisores = atualizarDivisores;
window.carregarTabelaPrestigio = carregarTabelaPrestigio;
window.aplicarPrestigioNaFicha = aplicarPrestigioNaFicha;
window.salvarTabelaAoServidor = salvarTabelaAoServidor;

// ==========================================
// INICIALIZAÇÃO
// ==========================================

// Nome do jogador
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

// Firebase
if (db) {
    carregarFichaDoFirebase(meuNome).then(function (dados) {
        console.log('[FIREBASE LOAD] keys:', dados ? Object.keys(dados).length : 'null', 'vida.base:', dados && dados.vida ? dados.vida.base : 'N/A');
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

// DOMContentLoaded
window.addEventListener('DOMContentLoaded', function () {
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
    }, 300);
});
