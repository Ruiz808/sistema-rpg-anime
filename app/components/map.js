// ==========================================
// COMPONENTE: Mapa de Combate (Multiplayer em tempo real)
// ==========================================
import { minhaFicha, meuNome } from '../state/store.js';
import { salvarFichaSilencioso } from '../services/firebase-sync.js';

const MAP_SIZE = 30;
let mapInitialized = false;

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
