// Constantes compartilhadas entre PoderesPanel e ArsenalPanel
export const ATRIBUTOS_AGRUPADOS = [
    {
        label: 'STATUS BASE',
        options: ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaEsp', 'carisma', 'stamina', 'constituicao']
    },
    {
        label: 'VITAIS & ENERGIAS',
        options: ['vida', 'mana', 'aura', 'chakra', 'corpo']
    },
    {
        label: 'COMBATE',
        options: ['dano']
    },
    {
        label: 'DEFESA (CA)',
        options: ['evasiva', 'resistencia']
    },
    {
        label: 'ESPECIAIS (GLOBAIS)',
        options: ['todos_status', 'todas_energias', 'geral']
    }
];

export const PROPRIEDADE_OPTIONS = [
    'base', 'mbase', 'mgeral', 'mformas', 'mabs', 'munico', 'reducaocusto', 'regeneracao'
];
