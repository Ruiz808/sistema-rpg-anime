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

// Core (wrappers que injetam minhaFicha automaticamente)
window.contarDigitos = contarDigitos;
window.tratarUnico = tratarUnico;
window.pegarDoisPrimeirosDigitos = pegarDoisPrimeirosDigitos;
window.isFisico = isFisico;
window.isEnergia = isEnergia;
window.getBuffs = (statKey) => getBuffs(minhaFicha, statKey);
window.getRawBase = (statKey) => getRawBase(minhaFicha, statKey);
window.getEfetivoBase = (statKey) => getEfetivoBase(minhaFicha, statKey);
window.getMultiplicadorTotal = (k) => getMultiplicadorTotal(minhaFicha, k);
window.getMaximo = (k) => getMaximo(minhaFicha, k);
window.isStatBuffed = (statKey) => isStatBuffed(minhaFicha, statKey);
window.getPoderesDefesa = (tipo) => getPoderesDefesa(minhaFicha, tipo);
window.getPoderTotalDaAbaPoderes = (statKey) => getPoderTotalDaAbaPoderes(minhaFicha, statKey);
window.getDivisorPara = (statKey) => getDivisorPara(minhaFicha, statKey);
window.getPrestigioReal = getPrestigioReal;
window.calcPAtual = (k, valBasePres) => calcPAtual(minhaFicha, k, valBasePres).valor;
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
        if (typeof window.renderizarBioEPassivas === "function") {
            window.renderizarBioEPassivas();
        }
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

        // Renderiza Bio e Passivas
        if (typeof window.renderizarBioEPassivas === "function") {
            window.renderizarBioEPassivas();
        }

        // Preenche o campo da imagem com o que está salvo no banco
        let inputImg = document.getElementById('perfil-imagem');
        if (inputImg && minhaFicha.avatar) {
            inputImg.value = minhaFicha.avatar.base || "";
        }

    }, 300);
});

// ==========================================
// SISTEMA DA FICHA NARRATIVA E PASSIVAS MECÂNICAS
// ==========================================

// --- O MOTOR DE EFEITOS DAS PASSIVAS ---
window.efeitosTempPassiva = [];

window.addEfeitoPassiva = function() {
    let atr = document.getElementById('nova-passiva-atr').value;
    let prop = document.getElementById('nova-passiva-prop').value;
    let val = parseFloat(document.getElementById('nova-passiva-val').value) || 0;

    window.efeitosTempPassiva.push({ atributo: atr, propriedade: prop, valor: val });
    window.renderizarEfeitosTempPassiva();
};

window.renderizarEfeitosTempPassiva = function() {
    let div = document.getElementById('efeitos-passiva-list');
    if (!div) return;
    let html = '';
    for (let i = 0; i < window.efeitosTempPassiva.length; i++) {
        let ef = window.efeitosTempPassiva[i];
        html += `<span style="display:inline-block; background:#000; border:1px solid #33ff77; padding:3px 10px; border-radius:15px; font-size:0.8em; color:#33ff77; margin-right:5px; margin-bottom:5px; box-shadow: 0 0 5px rgba(51,255,119,0.3);">
            ${ef.atributo.toUpperCase()} -> ${ef.propriedade}: ${ef.valor} 
            <span style="color:#ff4d4d; cursor:pointer; margin-left:8px; font-weight:bold;" onclick="window.removerEfeitoTempPassiva(${i})">X</span>
        </span>`;
    }
    div.innerHTML = html;
};

window.removerEfeitoTempPassiva = function(i) {
    window.efeitosTempPassiva.splice(i, 1);
    window.renderizarEfeitosTempPassiva();
};

// Salvando a Passiva Definitiva com as Habilidades
window.adicionarPassiva = function() {
    if (!minhaFicha) return;
    
    let nome = document.getElementById('nova-passiva-nome').value.trim();
    let tipo = document.getElementById('nova-passiva-tipo').value;
    
    if (nome === "") return alert("Digite o nome da habilidade!");
    if (!minhaFicha.passivas) minhaFicha.passivas = [];
    
    // Clona os efeitos e guarda dentro da passiva
    let efeitos = JSON.parse(JSON.stringify(window.efeitosTempPassiva));
    
    minhaFicha.passivas.push({ nome: nome, tipo: tipo, efeitos: efeitos });
    
    document.getElementById('nova-passiva-nome').value = "";
    window.efeitosTempPassiva = []; // Limpa o construtor
    window.renderizarEfeitosTempPassiva();
    
    window.salvarFichaSilencioso();
    window.renderizarBioEPassivas();
};

window.removerPassiva = function(index) {
    if (!minhaFicha || !minhaFicha.passivas) return;
    minhaFicha.passivas.splice(index, 1);
    window.salvarFichaSilencioso();
    window.renderizarBioEPassivas();
};

// Desenhando a lista com os efeitos embutidos
window.renderizarBioEPassivas = function() {
    if (!minhaFicha) return;

    if (minhaFicha.bio) {
        document.getElementById('bio-raca').value = minhaFicha.bio.raca || "";
        document.getElementById('bio-classe').value = minhaFicha.bio.classe || "";
        document.getElementById('bio-idade').value = minhaFicha.bio.idade || "";
        document.getElementById('bio-fisico').value = minhaFicha.bio.fisico || "";
        document.getElementById('bio-sangue').value = minhaFicha.bio.sangue || "";
        document.getElementById('bio-alinhamento').value = minhaFicha.bio.alinhamento || "";
        document.getElementById('bio-afiliacao').value = minhaFicha.bio.afiliacao || "";
        document.getElementById('bio-dinheiro').value = minhaFicha.bio.dinheiro || "";
    }
    if (minhaFicha.notas) {
        document.getElementById('nota-base').value = minhaFicha.notas.base || "";
        document.getElementById('nota-geral').value = minhaFicha.notas.geral || "";
        document.getElementById('nota-abs').value = minhaFicha.notas.abs || "";
    }

    let container = document.getElementById('lista-passivas');
    if (!container) return;

    if (!minhaFicha.passivas || minhaFicha.passivas.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; font-style: italic;">Nenhuma habilidade listada.</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < minhaFicha.passivas.length; i++) {
        let p = minhaFicha.passivas[i];
        let corTag = p.tipo === "Vantagem" ? "#ffcc00" : "#33ff77";
        
        // Renderiza os efeitos da passiva como tags pequenas
        let badgesEfeitos = '';
        if (p.efeitos && p.efeitos.length > 0) {
            for(let ef of p.efeitos) {
                badgesEfeitos += `<span style="display:inline-block; font-size:0.7em; background:rgba(0,0,0,0.8); border:1px solid #555; padding:2px 5px; border-radius:4px; margin-right:4px; margin-top:4px; color:#aaa;">${ef.atributo}: +${ef.valor}</span>`;
            }
        }
        
        html += `
            <div style="background: rgba(0,0,0,0.6); padding: 10px 12px; border-left: 3px solid ${corTag}; border-radius: 4px; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div>
                        <span style="color: ${corTag}; font-size: 0.7em; text-transform: uppercase; font-weight: bold; margin-right: 5px;">[${p.tipo}]</span>
                        <span style="color: white; font-weight: bold; font-size: 1.1em;">${p.nome}</span>
                    </div>
                    <div>${badgesEfeitos}</div>
                </div>
                <button onclick="window.removerPassiva(${i})" style="background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2em;" title="Remover">🗑️</button>
            </div>
        `;
    }
    container.innerHTML = html;
};
// Função de Salvar com Feedback Visual Elegante
// ==========================================
// SISTEMA DE SALVAMENTO DA FICHA NARRATIVA E FEEDBACK
// ==========================================

// ==========================================
// SISTEMA DA FICHA NARRATIVA E PASSIVAS (ATUALIZADO COM 5 MULTIPLICADORES)
// ==========================================

window.salvarBio = function() {
    let fichaAtual = typeof minhaFicha !== "undefined" ? minhaFicha : window.minhaFicha;
    if (!fichaAtual) {
        console.error("ERRO: Nenhuma ficha carregada para salvar a Bio!");
        return;
    }
    
    if (!fichaAtual.bio) fichaAtual.bio = {};
    if (!fichaAtual.notas) fichaAtual.notas = {};
    
    fichaAtual.bio.raca = document.getElementById('bio-raca') ? document.getElementById('bio-raca').value : "";
    fichaAtual.bio.classe = document.getElementById('bio-classe') ? document.getElementById('bio-classe').value : "";
    fichaAtual.bio.idade = document.getElementById('bio-idade') ? document.getElementById('bio-idade').value : "";
    fichaAtual.bio.fisico = document.getElementById('bio-fisico') ? document.getElementById('bio-fisico').value : "";
    fichaAtual.bio.sangue = document.getElementById('bio-sangue') ? document.getElementById('bio-sangue').value : "";
    fichaAtual.bio.alinhamento = document.getElementById('bio-alinhamento') ? document.getElementById('bio-alinhamento').value : "";
    fichaAtual.bio.afiliacao = document.getElementById('bio-afiliacao') ? document.getElementById('bio-afiliacao').value : "";
    fichaAtual.bio.dinheiro = document.getElementById('bio-dinheiro') ? document.getElementById('bio-dinheiro').value : "";
    
    // Capturando todos os 5 multiplicadores das Anotações
    fichaAtual.notas.base = document.getElementById('nota-base') ? document.getElementById('nota-base').value : "";
    fichaAtual.notas.geral = document.getElementById('nota-geral') ? document.getElementById('nota-geral').value : "";
    fichaAtual.notas.formas = document.getElementById('nota-formas') ? document.getElementById('nota-formas').value : "";
    fichaAtual.notas.abs = document.getElementById('nota-abs') ? document.getElementById('nota-abs').value : "";
    fichaAtual.notas.unico = document.getElementById('nota-unico') ? document.getElementById('nota-unico').value : "";
    
    if (typeof window.salvarFichaSilencioso === "function") {
        window.salvarFichaSilencioso();
    } else if (typeof window.salvarFichaBase === "function") {
        window.salvarFichaBase();
    }
};

// A Função que o Botão HTML chama para dar o Feedback Visual (Piscar Verde)
window.salvarBioComFeedback = function(botaoElemento) {
    window.salvarBio();
    
    let textoOriginal = botaoElemento.innerText;
    let corOriginal = botaoElemento.style.backgroundColor;
    
    botaoElemento.innerText = "✅ SALVO COM SUCESSO!";
    botaoElemento.style.backgroundColor = "rgba(0, 255, 100, 0.2)"; 
    botaoElemento.style.borderColor = "#00ffcc";
    botaoElemento.style.color = "#fff";
    
    setTimeout(() => {
        botaoElemento.innerText = textoOriginal;
        botaoElemento.style.backgroundColor = corOriginal;
        botaoElemento.style.borderColor = ""; 
        botaoElemento.style.color = "";
    }, 2000);
};

// O Cérebro que Desenha a Tela e Cria o Relatório de Combos
window.renderizarBioEPassivas = function() {
    if (!minhaFicha) return;

    // 1. Preenche as Caixas Manuais
    if (minhaFicha.bio) {
        document.getElementById('bio-raca').value = minhaFicha.bio.raca || "";
        document.getElementById('bio-classe').value = minhaFicha.bio.classe || "";
        document.getElementById('bio-idade').value = minhaFicha.bio.idade || "";
        document.getElementById('bio-fisico').value = minhaFicha.bio.fisico || "";
        document.getElementById('bio-sangue').value = minhaFicha.bio.sangue || "";
        document.getElementById('bio-alinhamento').value = minhaFicha.bio.alinhamento || "";
        document.getElementById('bio-afiliacao').value = minhaFicha.bio.afiliacao || "";
        document.getElementById('bio-dinheiro').value = minhaFicha.bio.dinheiro || "";
    }
    if (minhaFicha.notas) {
        if(document.getElementById('nota-base')) document.getElementById('nota-base').value = minhaFicha.notas.base || "";
        if(document.getElementById('nota-geral')) document.getElementById('nota-geral').value = minhaFicha.notas.geral || "";
        if(document.getElementById('nota-formas')) document.getElementById('nota-formas').value = minhaFicha.notas.formas || "";
        if(document.getElementById('nota-abs')) document.getElementById('nota-abs').value = minhaFicha.notas.abs || "";
        if(document.getElementById('nota-unico')) document.getElementById('nota-unico').value = minhaFicha.notas.unico || "";
    }

    // 2. Preenche a Lista de Passivas Visual
    let container = document.getElementById('lista-passivas');
    if (container) {
        if (!minhaFicha.passivas || minhaFicha.passivas.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; font-style: italic;">Nenhuma habilidade listada.</p>';
        } else {
            let html = '';
            for (let i = 0; i < minhaFicha.passivas.length; i++) {
                let p = minhaFicha.passivas[i];
                let corTag = p.tipo === "Vantagem" ? "#ffcc00" : "#33ff77";
                let badgesEfeitos = '';
                if (p.efeitos && p.efeitos.length > 0) {
                    for(let ef of p.efeitos) {
                        badgesEfeitos += `<span style="display:inline-block; font-size:0.7em; background:rgba(0,0,0,0.8); border:1px solid #555; padding:2px 5px; border-radius:4px; margin-right:4px; margin-top:4px; color:#aaa;">${ef.propriedade.toUpperCase()} (${ef.atributo.toUpperCase()}): ${ef.valor}</span>`;
                    }
                }
                html += `
                    <div style="background: rgba(0,0,0,0.6); padding: 10px 12px; border-left: 3px solid ${corTag}; border-radius: 4px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <div><span style="color: ${corTag}; font-size: 0.7em; text-transform: uppercase; font-weight: bold; margin-right: 5px;">[${p.tipo}]</span><span style="color: white; font-weight: bold; font-size: 1.1em;">${p.nome}</span></div>
                            <div>${badgesEfeitos}</div>
                        </div>
                        <button onclick="window.removerPassiva(${i})" style="background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2em;" title="Remover">🗑️</button>
                    </div>`;
            }
            container.innerHTML = html;
        }
    }

    // 3. GERA O RELATÓRIO AUTOMÁTICO DE COMBOS (A MÁGICA)
    let autoPainel = document.getElementById('painel-auditoria-auto');
    if (autoPainel) {
        if (!minhaFicha.passivas || minhaFicha.passivas.length === 0) {
            autoPainel.innerHTML = '<span style="color: #888; font-style: italic;">Nenhum efeito de passiva ativo.</span>';
        } else {
            let mapaEfeitos = { mbase: [], mgeral: [], mformas: [], mabs: [], munico: [], base: [], especial: [] };
            let nomesProps = { mbase: "MULT BASE (x)", mgeral: "MULT GERAL (x)", mformas: "MULT FORMA (x)", mabs: "MULT ABSOLUTO (x)", munico: "MULT ÚNICO (x)", base: "VALOR BRUTO (+)" };

            // Lê todas as passivas e agrupa
            minhaFicha.passivas.forEach(p => {
                if (p.efeitos) {
                    p.efeitos.forEach(ef => {
                        let txt = `<span style="color:#fff;">${p.nome}</span> <span style="color:#555;">(${ef.atributo.toUpperCase()}: ${ef.valor})</span>`;
                        // Filtra e agrupa pela propriedade mecânica
                        if (mapaEfeitos[ef.propriedade]) mapaEfeitos[ef.propriedade].push(txt);
                        else mapaEfeitos.especial.push(txt);
                    });
                }
            });

            // Monta o texto visual do painel
            let relatorio = '';
            for (let prop in nomesProps) {
                if (mapaEfeitos[prop].length > 0) {
                    relatorio += `<div style="margin-bottom: 6px;"><strong style="color: #f0f;">${nomesProps[prop]}:</strong> ${mapaEfeitos[prop].join(' <strong style="color:#f0f;">+</strong> ')}</div>`;
                }
            }
            if (mapaEfeitos.especial.length > 0) {
                relatorio += `<div style="margin-bottom: 6px;"><strong style="color: #0ff;">OUTROS EFEITOS:</strong> ${mapaEfeitos.especial.join(' <strong style="color:#0ff;">+</strong> ')}</div>`;
            }

            if (relatorio === '') relatorio = '<span style="color: #888; font-style: italic;">As passivas não possuem modificadores mecânicos configurados.</span>';
            autoPainel.innerHTML = relatorio;
        }
    }
};