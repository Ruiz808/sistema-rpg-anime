/**
 * Sistema de Temas Completo para RPG Anime
 * Define temas predefinidos com variáveis CSS
 */

export const TEMAS_PADRAO = {
  'neon-ciano': {
    id: 'neon-ciano',
    nome: 'Neon Ciano',
    emoji: '🔵',
    descricao: 'Tema padrão com neon ciano cyberpunk',
    vars: {
      '--cor-primaria': '#0ff',
      '--cor-primaria-rgb': '0, 255, 255',
      '--cor-secundaria': '#ff003c',
      '--cor-secundaria-rgb': '255, 0, 60',
      '--cor-destaque': '#ffcc00',
      '--cor-destaque-rgb': '255, 204, 0',
      '--cor-sucesso': '#0f0',
      '--cor-info': '#0088ff',
      '--bg-body-1': '#1a1a2e',
      '--bg-body-2': '#0f0f1a',
      '--bg-panel': 'rgba(25, 25, 40, 0.6)',
      '--bg-panel-hover': 'rgba(0, 255, 255, 0.1)',
      '--border-primary': 'rgba(0, 255, 255, 0.2)',
      '--grid-color': 'rgba(0, 255, 255, 0.03)',
      '--shadow-primary': 'rgba(0, 255, 255, 0.5)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  },

  'sangue-crimsono': {
    id: 'sangue-crimsono',
    nome: 'Sangue Crimsono',
    emoji: '🩸',
    descricao: 'Tema sombrio com tons vermelhos intensos',
    vars: {
      '--cor-primaria': '#ff003c',
      '--cor-primaria-rgb': '255, 0, 60',
      '--cor-secundaria': '#8b0000',
      '--cor-secundaria-rgb': '139, 0, 0',
      '--cor-destaque': '#ff6b6b',
      '--cor-destaque-rgb': '255, 107, 107',
      '--cor-sucesso': '#ff4444',
      '--cor-info': '#ff8888',
      '--bg-body-1': '#2e1616',
      '--bg-body-2': '#1a0a0a',
      '--bg-panel': 'rgba(46, 22, 22, 0.6)',
      '--bg-panel-hover': 'rgba(255, 0, 60, 0.1)',
      '--border-primary': 'rgba(255, 0, 60, 0.2)',
      '--grid-color': 'rgba(255, 0, 60, 0.03)',
      '--shadow-primary': 'rgba(255, 0, 60, 0.5)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  },

  'ouro-imperial': {
    id: 'ouro-imperial',
    nome: 'Ouro Imperial',
    emoji: '👑',
    descricao: 'Tema luxuoso com tons dourados e pretos',
    vars: {
      '--cor-primaria': '#ffcc00',
      '--cor-primaria-rgb': '255, 204, 0',
      '--cor-secundaria': '#daa520',
      '--cor-secundaria-rgb': '218, 165, 32',
      '--cor-destaque': '#ffd700',
      '--cor-destaque-rgb': '255, 215, 0',
      '--cor-sucesso': '#ff9900',
      '--cor-info': '#ffbb33',
      '--bg-body-1': '#1a1410',
      '--bg-body-2': '#0f0a05',
      '--bg-panel': 'rgba(26, 20, 16, 0.8)',
      '--bg-panel-hover': 'rgba(255, 204, 0, 0.08)',
      '--border-primary': 'rgba(255, 204, 0, 0.25)',
      '--grid-color': 'rgba(255, 204, 0, 0.05)',
      '--shadow-primary': 'rgba(255, 204, 0, 0.4)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  },

  'nexo-violeta': {
    id: 'nexo-violeta',
    nome: 'Nexo Violeta',
    emoji: '✨',
    descricao: 'Tema místico com tons roxos e magentas',
    vars: {
      '--cor-primaria': '#d946ef',
      '--cor-primaria-rgb': '217, 70, 239',
      '--cor-secundaria': '#7c3aed',
      '--cor-secundaria-rgb': '124, 58, 237',
      '--cor-destaque': '#f0abfc',
      '--cor-destaque-rgb': '240, 171, 252',
      '--cor-sucesso': '#a855f7',
      '--cor-info': '#9333ea',
      '--bg-body-1': '#2d1b4e',
      '--bg-body-2': '#1a0d2e',
      '--bg-panel': 'rgba(45, 27, 78, 0.6)',
      '--bg-panel-hover': 'rgba(217, 70, 239, 0.1)',
      '--border-primary': 'rgba(217, 70, 239, 0.2)',
      '--grid-color': 'rgba(217, 70, 239, 0.03)',
      '--shadow-primary': 'rgba(217, 70, 239, 0.5)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  },

  'verde-mata': {
    id: 'verde-mata',
    nome: 'Verde Mata',
    emoji: '🌿',
    descricao: 'Tema natural com tons verdes vibrantes',
    vars: {
      '--cor-primaria': '#00ff00',
      '--cor-primaria-rgb': '0, 255, 0',
      '--cor-secundaria': '#00aa00',
      '--cor-secundaria-rgb': '0, 170, 0',
      '--cor-destaque': '#00ff88',
      '--cor-destaque-rgb': '0, 255, 136',
      '--cor-sucesso': '#33ff33',
      '--cor-info': '#66ff66',
      '--bg-body-1': '#162e1a',
      '--bg-body-2': '#0a1a0d',
      '--bg-panel': 'rgba(22, 46, 26, 0.6)',
      '--bg-panel-hover': 'rgba(0, 255, 0, 0.1)',
      '--border-primary': 'rgba(0, 255, 0, 0.2)',
      '--grid-color': 'rgba(0, 255, 0, 0.03)',
      '--shadow-primary': 'rgba(0, 255, 0, 0.5)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  },

  'abismo-branco': {
    id: 'abismo-branco',
    nome: 'Abismo Branco',
    emoji: '❄️',
    descricao: 'Tema frio e brilhante com tons brancos e azuis',
    vars: {
      '--cor-primaria': '#e0f2ff',
      '--cor-primaria-rgb': '224, 242, 255',
      '--cor-secundaria': '#0288d1',
      '--cor-secundaria-rgb': '2, 136, 209',
      '--cor-destaque': '#80deea',
      '--cor-destaque-rgb': '128, 222, 234',
      '--cor-sucesso': '#4dd0e1',
      '--cor-info': '#0097a7',
      '--bg-body-1': '#001f3f',
      '--bg-body-2': '#000a15',
      '--bg-panel': 'rgba(0, 31, 63, 0.8)',
      '--bg-panel-hover': 'rgba(224, 242, 255, 0.08)',
      '--border-primary': 'rgba(224, 242, 255, 0.2)',
      '--grid-color': 'rgba(224, 242, 255, 0.03)',
      '--shadow-primary': 'rgba(224, 242, 255, 0.4)',
      '--font-family': "'Rajdhani', sans-serif"
    }
  }
}

/**
 * Obtém um tema pelo ID
 * @param {string} id - ID do tema
 * @returns {Object|null} - Objeto do tema ou null se não encontrado
 */
export function obterTema(id) {
  return TEMAS_PADRAO[id] || null
}

/**
 * Lista todos os IDs de temas padrão
 * @returns {string[]} - Array de IDs
 */
export function listarTemasIds() {
  return Object.keys(TEMAS_PADRAO)
}

/**
 * Valida se um ID de tema existe nos padrões
 * @param {string} id - ID do tema
 * @returns {boolean}
 */
export function validarTemaId(id) {
  return id in TEMAS_PADRAO
}
