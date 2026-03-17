// ==========================================
// COMPONENTE: Mapa de Combate (Multiplayer em tempo real)
// ==========================================
import { minhaFicha, meuNome } from '../state/store.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

const MAP_SIZE = 30;
let mapInitialized = false;
let tamanhoCelulaAtual = 35; // Começa em 35px

// Cores fixas por jogador (para diferenciar tokens)
let coresJogadores = {};
const PALETA = ['#ff003c', '#0088ff', '#00ff88', '#ffcc00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];
let corIndex = 0;

function corDoJogador(nome) {
    if (!coresJogadores[nome]) {
        coresJogadores[nome] = PALETA[corIndex % PALETA.length];
        corIndex++;
    }
    return coresJogadores[nome];
}

export function initMap() {
    let grid = document.getElementById('combat-grid');
    if (!grid) return;

    if (mapInitialized) {
        renderTodosJogadores(window._ultimoDadosMapa || {});
        return;
    }

    grid.innerHTML = '';
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            let cell = document.createElement('div');
            cell.className = 'map-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', function () {
                moverJogadorPara(x, y);
            });
            grid.appendChild(cell);
        }
    }
    mapInitialized = true;

    // Renderiza posição salva do jogador local
    if (minhaFicha.posicao && minhaFicha.posicao.x !== undefined) {
        renderTodosJogadores(window._ultimoDadosMapa || {});
    }
}

function moverJogadorPara(x, y) {
    if (!minhaFicha.posicao) minhaFicha.posicao = {};
    minhaFicha.posicao.x = x;
    minhaFicha.posicao.y = y;
    salvarFichaSilencioso();
    renderTodosJogadores(window._ultimoDadosMapa || {});
}

export function atualizarMapa(dadosTodosPersonagens) {
    window._ultimoDadosMapa = dadosTodosPersonagens;
    if (!mapInitialized) return;
    renderTodosJogadores(dadosTodosPersonagens);
    renderizarOrdemTurnos(dadosTodosPersonagens);
}

function renderTodosJogadores(dados) {
    // Limpa todos os tokens existentes
    let tokens = document.querySelectorAll('.player-token');
    for (let i = 0; i < tokens.length; i++) tokens[i].remove();

    // Inclui o jogador local (sempre atualizado)
    let jogadores = {};
    if (meuNome && minhaFicha.posicao && minhaFicha.posicao.x !== undefined) {
        jogadores[meuNome] = minhaFicha;
    }

    // Adiciona os outros jogadores do Firebase
    let nomes = Object.keys(dados);
    for (let i = 0; i < nomes.length; i++) {
        let nome = nomes[i];
        if (nome === meuNome) continue; // já adicionado acima com dados locais
        let ficha = dados[nome];
        if (ficha && ficha.posicao && ficha.posicao.x !== undefined) {
            jogadores[nome] = ficha;
        }
    }

    // Renderiza cada token
    let nomesJogadores = Object.keys(jogadores);
    for (let i = 0; i < nomesJogadores.length; i++) {
        let nome = nomesJogadores[i];
        let pos = jogadores[nome].posicao;
        let cell = document.querySelector('.map-cell[data-x="' + pos.x + '"][data-y="' + pos.y + '"]');
        if (cell) {
            let token = document.createElement('div');
            token.className = 'player-token';
            if (nome === meuNome) token.classList.add('my-token');
            token.innerText = nome.charAt(0).toUpperCase();
            token.title = nome;
            token.style.backgroundColor = corDoJogador(nome);
            // --- LÓGICA DO AVATAR DINÂMICO (MULTIPLAYER) ---
            let fichaDoJogador = jogadores[nome];
            let imgAtual = fichaDoJogador.avatar ? fichaDoJogador.avatar.base : "";
            
            // O sistema vasculha os poderes do jogador atual do loop
            if (fichaDoJogador.poderes) {
                for (let j = 0; j < fichaDoJogador.poderes.length; j++) {
                    let p = fichaDoJogador.poderes[j];
                    if (p.ativa && p.imagemUrl && p.imagemUrl.trim() !== "") {
                        imgAtual = p.imagemUrl; // A Transformação toma o controle!
                    }
                }
            }

            // Aplica a imagem se existir
            if (imgAtual && imgAtual !== "") {
                token.style.backgroundImage = `url('${imgAtual}')`;
                token.style.backgroundSize = "cover";
                token.style.backgroundPosition = "center";
                token.innerText = ""; // Limpa a letra já que tem imagem
            }
            // ------------------------------------------------
            cell.appendChild(token);
        }
    }
}

export function alterarZoom(direcao) {
    if (direcao > 0) {
        tamanhoCelulaAtual += 5; // Aproxima
    } else {
        tamanhoCelulaAtual -= 5; // Afasta
    }

    // Limites para não quebrar o mapa (Mínimo de 15px, Máximo de 80px)
    if (tamanhoCelulaAtual < 15) tamanhoCelulaAtual = 15;
    if (tamanhoCelulaAtual > 80) tamanhoCelulaAtual = 80;

    // Aplica a variável no CSS global
    document.documentElement.style.setProperty('--map-zoom', tamanhoCelulaAtual + 'px');
}

// --- SISTEMA DE INICIATIVA E TURNOS ---
let ordemIniciativa = [];
let turnoAtualIndex = 0;

// Função Mágica: Descobre a imagem atual do personagem (Base ou Transformação)
export function getAvatarInfo(ficha) {
    if (!ficha) return { img: "", forma: null };
    let result = { img: ficha.avatar ? ficha.avatar.base : "", forma: null };
    
    if (ficha.poderes) {
        for (let j = 0; j < ficha.poderes.length; j++) {
            let p = ficha.poderes[j];
            if (p.ativa && p.imagemUrl && p.imagemUrl.trim() !== "") {
                result.img = p.imagemUrl;
                result.forma = p.nome; // Captura o nome do poder/forma!
            }
        }
    }
    return result;
}

export function setMinhaIniciativa() {
    let val = parseInt(document.getElementById('minha-iniciativa').value) || 0;
    minhaFicha.iniciativa = val;
    window.salvarFichaSilencioso(); // Salva no banco e avisa os outros!
}

export function avancarTurno() {
    if (ordemIniciativa.length === 0) return;
    turnoAtualIndex++;
    if (turnoAtualIndex >= ordemIniciativa.length) turnoAtualIndex = 0;
    desenharTurnoAtivo();
}

function renderizarOrdemTurnos(dadosJogadores) {
    let jogadores = [];
    let nomes = Object.keys(dadosJogadores);
    
    for (let i = 0; i < nomes.length; i++) {
        let n = nomes[i];
        let f = dadosJogadores[n];
        if (f && f.iniciativa !== undefined && f.iniciativa > 0) {
            jogadores.push({ nome: n, ficha: f, iniciativa: f.iniciativa });
        }
    }

    jogadores.sort((a, b) => b.iniciativa - a.iniciativa);
    ordemIniciativa = jogadores;

    let container = document.getElementById('lista-turnos');
    if (!container) return;

    if (jogadores.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 0.8em; margin: 0;">Nenhum jogador rolou iniciativa ainda.</p>';
        document.getElementById('turno-destaque').style.display = 'none';
        return;
    }

    let html = '';
    for (let i = 0; i < jogadores.length; i++) {
        let j = jogadores[i];
        let info = getAvatarInfo(j.ficha); // Lê a nova função
        let isActive = (i === turnoAtualIndex);
        let border = isActive ? 'border: 3px solid #00ffcc;' : 'border: 2px solid #444; opacity: 0.5;';
        
        // A bolinha pequena continua redonda na linha do tempo
        html += `<div style="min-width: 50px; height: 50px; border-radius: 50%; ${border} background-image: url('${info.img}'); background-size: cover; background-position: top center; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.7em; color: white; text-shadow: 1px 1px 2px black;" title="${j.nome} (${j.iniciativa})">${info.img ? '' : j.nome.charAt(0)}</div>`;
    }
    container.innerHTML = html;
    desenharTurnoAtivo();
}

function desenharTurnoAtivo() {
    let destaque = document.getElementById('turno-destaque');
    let nomeDestaque = document.getElementById('turno-nome');
    let formaDestaque = document.getElementById('turno-forma');
    let statusCombate = document.getElementById('status-combate'); // O nosso novo painel de barras!

    if (!destaque || !nomeDestaque || !formaDestaque || !statusCombate) return;

    if (ordemIniciativa.length > 0 && ordemIniciativa[turnoAtualIndex]) {
        let jogadorDaVez = ordemIniciativa[turnoAtualIndex];
        let info = getAvatarInfo(jogadorDaVez.ficha);
        let f = jogadorDaVez.ficha; // Puxamos a ficha completa do jogador!
        
        if (info.img) {
            destaque.style.backgroundImage = `url('${info.img}')`;
            destaque.style.display = 'block'; 
            nomeDestaque.innerText = jogadorDaVez.nome;
            
            if (info.forma) {
                formaDestaque.innerText = "⚡ " + info.forma;
                formaDestaque.style.display = 'block';
            } else {
                formaDestaque.style.display = 'none';
            }

            // --- MAGIA DO HUD DE STATUS ---
            // Função rápida para colocar pontos nos números (Ex: 24000 vira 24.000)
            const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

            // Criamos o display de vidro com as energias em cores Neon
            let htmlStatus = `
                <div style="display: flex; flex-direction: column; gap: 6px; width: 190px; margin-left: auto; background: rgba(0,0,0,0.7); padding: 12px; border-radius: 8px; border: 1px solid rgba(0,255,204,0.3); box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
                    
                    <div style="display: flex; justify-content: space-between; color: #ff4d4d; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        <span style="font-size: 0.8em; align-self: center;">❤️ HP</span>
                        <span style="font-size: 1.1em;">${fmt(f.vida?.atual)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; color: #4dffff; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        <span style="font-size: 0.8em; align-self: center;">💧 MP</span>
                        <span style="font-size: 1.1em;">${fmt(f.mana?.atual)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; color: #ffff4d; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        <span style="font-size: 0.8em; align-self: center;">✨ AU</span>
                        <span style="font-size: 1.1em;">${fmt(f.aura?.atual)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; color: #00ffcc; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        <span style="font-size: 0.8em; align-self: center;">🌀 CK</span>
                        <span style="font-size: 1.1em;">${fmt(f.chakra?.atual)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; color: #ff66ff; font-weight: bold; text-shadow: 1px 1px 2px black;">
                        <span style="font-size: 0.8em; align-self: center;">💪 CP</span>
                        <span style="font-size: 1.1em;">${fmt(f.corpo?.atual)}</span>
                    </div>
                    
                </div>
            `;
            
            statusCombate.innerHTML = htmlStatus; // Injeta no ecrã!

        } else {
            destaque.style.display = 'none'; 
        }
    } else {
        destaque.style.display = 'none';
    }
}