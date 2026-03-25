// src/core/classIcons.js

// 🔥 DEFINIÇÃO DOS SÍMBOLOS MÍSTICOS DAS CLASSES REGULARES 🔥
export const CLASSES_REGULARES_ICONS = {
    saber: '⚔️',
    archer: '🏹',
    lancer: '🗡️',
    rider: '🏇',
    caster: '🧙‍♂️',
    assassin: '🔪',
    berserker: '狂'
};

// 🔥 DEFINIÇÃO DOS SÍMBOLOS MÍSTICOS DAS CLASSES EXTRA 🔥
export const CLASSES_EXTRA_ICONS = {
    shielder: '🛡️',
    ruler: '⚖️',
    avenger: '⛓️',
    alterego: '🎭',
    foreigner: '🐙',
    mooncancer: '🌕',
    pretender: '🤥',
    beast: '👹',
    savior: '☀️'
};

// 🔥 FUNÇÃO AUXILIAR PARA PEGAR O ÍCONE DA CLASSE 🔥
export function getClassIconById(classId) {
    if (!classId) return '';
    const idClean = String(classId).toLowerCase().trim();
    
    // Tenta nas regulares
    if (CLASSES_REGULARES_ICONS[idClean]) return CLASSES_REGULARES_ICONS[idClean];
    
    // Tenta nas extra
    if (CLASSES_EXTRA_ICONS[idClean]) return CLASSES_EXTRA_ICONS[idClean];
    
    return ''; // Mundano / Nenhuma
}