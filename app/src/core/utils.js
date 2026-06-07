// ==========================================
// UTILITÁRIOS PUROS — Zero dependências
// ==========================================

/**
 * Conta dígitos corretamente mesmo para números > 10^21.
 * Traduz a notação científica (1e+21) para o número real de dígitos (22).
 */
export function contarDigitos(v) {
    if (!v || isNaN(v) || v <= 0) return 0;
    
    // Forma matemática exata e limpa:
    return Math.floor(Math.log10(v)) + 1;
}

export function tratarUnico(t) {
    if (!t) return [1.0];
    let arr = String(t).split(',');
    let nums = [];
    for (let i = 0; i < arr.length; i++) {
        let n = parseFloat(arr[i].trim());
        if (!isNaN(n)) nums.push(n);
    }
    return nums.length ? nums : [1.0];
}

export function pegarDoisPrimeirosDigitos(v) {
    let n = Math.floor(Math.abs(v || 0));
    if (n === 0) return 0;
    let str = String(n);
    // Para resolver o antigo erro da Vida e Energias base a rebentar a escala de Vitalidade
    if (str.includes('e')) {
        const firstNums = str.split('e')[0].replace('.', '');
        return parseInt(firstNums.substring(0, 2).padEnd(2, '0'));
    }
    
    if (str === "100" || str.startsWith("100")) return 100;
    return str.length <= 2 ? n : parseInt(str.substring(0, 2));
}

export function isFisico(s) {
    return ['forca', 'destreza', 'inteligencia', 'sabedoria', 'energiaesp', 'carisma', 'stamina', 'constituicao'].includes(s.toLowerCase());
}

export function isEnergia(s) {
    return ['mana', 'aura', 'chakra', 'corpo'].includes(s.toLowerCase());
}