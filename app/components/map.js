// components/map.js
import { minhaFicha } from '../state/store.js';

// Estado local do mapa
let playerPos = { x: 15, y: 15 }; // Posição inicial no centro do mapa
const MAP_SIZE = 30; // 30x30

export function initMap() {
    const grid = document.getElementById('combat-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Limpa o mapa se já existir

    // Gera o grid de Y (linhas) e X (colunas)
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            let cell = document.createElement('div');
            cell.className = 'map-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Evento de clique para mover o jogador
            cell.addEventListener('click', () => {
                moverJogadorPara(x, y);
            });

            grid.appendChild(cell);
        }
    }

    // Desenha o jogador na posição inicial assim que o mapa é criado
    renderPlayer();
}

function moverJogadorPara(x, y) {
    playerPos.x = x;
    playerPos.y = y;
    
    // Opcional: Salvar a posição do jogador no store global (minhaFicha)
    // se quiser que ele nasça no mesmo lugar ao recarregar a página
    if(!minhaFicha.posicao) minhaFicha.posicao = {};
    minhaFicha.posicao.x = x;
    minhaFicha.posicao.y = y;

    renderPlayer();
}

export function renderPlayer() {
    // Recuperar o nome para colocar a inicial no token
    let nome = localStorage.getItem("rpgNome") || "P";
    let inicial = nome.charAt(0).toUpperCase();

    // 1. Encontrar o token atual e removê-lo (se existir)
    let tokenExistente = document.getElementById('my-token');
    if (tokenExistente) {
        tokenExistente.remove();
    }

    // 2. Tenta recuperar a posição salva na ficha (se existir)
    if (minhaFicha.posicao && minhaFicha.posicao.x !== undefined) {
        playerPos.x = minhaFicha.posicao.x;
        playerPos.y = minhaFicha.posicao.y;
    }

    // 3. Encontrar a célula de destino
    let targetCell = document.querySelector(`.map-cell[data-x="${playerPos.x}"][data-y="${playerPos.y}"]`);
    
    // 4. Criar o token e adicioná-lo à célula
    if (targetCell) {
        let token = document.createElement('div');
        token.id = 'my-token';
        token.className = 'player-token';
        token.innerText = inicial;
        targetCell.appendChild(token);
    }
}
