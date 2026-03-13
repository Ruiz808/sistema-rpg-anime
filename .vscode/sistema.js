const readline = require('readline');
const fs = require('fs'); 
const path = require('path'); 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const fazerPergunta = (pergunta) => {
    return new Promise((resolve) => rl.question(pergunta, resolve));
};

// ==========================================
// SISTEMA DE SAVE E BANCO DE DADOS
// ==========================================

const isPkg = typeof process.pkg !== 'undefined';
const pastaBase = isPkg ? path.dirname(process.execPath) : process.cwd();
const arquivoSave = path.join(pastaBase, 'ficha_save.json');

// 1. Ficha Padrão
let ficha = {
    inteligencia: { nome: "Inteligência", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    sabedoria:    { nome: "Sabedoria", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    energiaEsp:   { nome: "Energia Espiritual", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    carisma:      { nome: "Carisma", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    stamina:      { nome: "Stamina", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    constituicao: { nome: "Constituição", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    forca:        { nome: "Força", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 },
    destreza:     { nome: "Destreza", base: 10, mBase: 1.0, mGeral: 1.0, mUnico: "1.0", mAbsoluto: 1.0 }
};

function carregarJogo() {
    if (fs.existsSync(arquivoSave)) {
        try {
            const dadosSalvos = fs.readFileSync(arquivoSave, 'utf8');
            const fichaSalva = JSON.parse(dadosSalvos);
            for (let chave in fichaSalva) {
                if (ficha[chave]) ficha[chave] = fichaSalva[chave];
            }
            console.log("💾 [Sistema] Arquivo de save carregado com sucesso!");
        } catch (erro) {
            console.log("⚠️ [Sistema] Erro ao ler o save antigo. Usando ficha padrão.");
        }
    }
}

function salvarJogo() {
    try {
        fs.writeFileSync(arquivoSave, JSON.stringify(ficha, null, 4), 'utf8');
    } catch (erro) {
        console.log("⚠️ [Sistema] Erro ao tentar salvar o jogo.");
    }
}

// 2. Memória do Ataque (Dano)
let memAtaque = {
    qtdDados: 1, faces: 20, 
    energiaGasta: 0, mEnergia: 1.0,
    danoBruto: 0, mDanoBruto: 1.0,
    dGeral: 1.0, dBase: 1.0, dPotencial: 1.0, dFormas: 1.0, dUnico: "1.0", dAbsoluto: 1.0
};

// 3. Memória do Acerto (NOVA)
let memAcerto = {
    qtdDados: 1, faces: 20,
    proficiencia: 0, bonus: 0
};

// ==========================================
// FUNÇÕES AUXILIARES E DE MATEMÁTICA
// ==========================================

function tratarUnico(textoInput) {
    let lista = String(textoInput).split(',').map(num => parseFloat(num.trim())).filter(num => !isNaN(num));
    return lista.length === 0 ? [1.0] : lista;
}

// Conta dígitos corretamente mesmo para números > 10^21 (evita bug de notação científica)
function contarDigitos(v) {
    return (isFinite(v) && v > 0) ? Math.floor(Math.log10(v)) + 1 : 1;
}

async function perguntarValor(texto, valorAtual, tipo = "float") {
    let resposta = await fazerPergunta(`${texto} (${valorAtual}): `);
    if (resposta.trim() === "") return valorAtual;
    
    if (tipo === "int") return parseInt(resposta) || 0; 
    else if (tipo === "float") return parseFloat(resposta) || 1.0;
    else return resposta; 
}

// Extrai os 2 primeiros dígitos de qualquer número (ex: 61000 vira 61)
function pegarDoisPrimeirosDigitos(valor) {
    let strVal = String(Math.abs(valor)); // Evita problemas com negativos temporariamente
    if (strVal.length <= 2) return parseInt(strVal);
    return parseInt(strVal.substring(0, 2));
}

// ==========================================
// FUNÇÕES DE COMBATE (ACERTO E DANO)
// ==========================================

// NOVA: Função de Rolagem de Acerto
function rolarAcerto(quantidadeDados, faces, statsSelecionados, acertoInfo) {
    let resultadosDados = [];
    let somaDados = 0;
    for (let i = 0; i < quantidadeDados; i++) {
        let rolagem = Math.floor(Math.random() * faces) + 1;
        resultadosDados.push(rolagem);
        somaDados += rolagem;
    }

    let valorStatusTotal = 0;
    let relatorioStatus = [];

    // Calcula os 2 primeiros dígitos de cada status escolhido
    for (let stat of statsSelecionados) {
        let valorConvertido = pegarDoisPrimeirosDigitos(stat.base);
        valorStatusTotal += valorConvertido;
        relatorioStatus.push(`[${stat.nome}] Base ${stat.base} -> Convertido: ${valorConvertido}`);
    }

    let totalAcerto = valorStatusTotal + acertoInfo.proficiencia + acertoInfo.bonus + somaDados;

    console.log("\n" + "=".repeat(45));
    console.log("             🎯 RESULTADO DO ACERTO");
    console.log("=".repeat(45));
    
    console.log(`[DADOS] ${quantidadeDados}d${faces} -> Sorteados: [${resultadosDados.join(', ')}] -> Soma: ${somaDados}`);
    relatorioStatus.forEach(linha => console.log(`[STATUS] ${linha}`));
    
    if (acertoInfo.proficiencia !== 0) console.log(`[PROFICIÊNCIA] +${acertoInfo.proficiencia}`);
    if (acertoInfo.bonus !== 0) console.log(`[BÔNUS EXTRA] +${acertoInfo.bonus}`);

    console.log("-".repeat(45));
    console.log(`🎯 TOTAL DE ACERTO: ${totalAcerto}`);
    console.log("=============================================\n");
}

// Função de Rolagem de Dano (Mantida Intacta)
function rolarAtaqueEpico(quantidadeDados, faces, statsSelecionados, ataqueInfo) {
    let resultadosDados = [];
    let somaDados = 0;
    for (let i = 0; i < quantidadeDados; i++) {
        let rolagem = Math.floor(Math.random() * faces) + 1;
        resultadosDados.push(rolagem);
        somaDados += rolagem;
    }

    let bonusFixoFinal = 0;
    let relatorioStatus = [];

    for (let stat of statsSelecionados) {
        let unicosStatus = tratarUnico(stat.mUnico);
        let multStatusUnicoTotal = unicosStatus.reduce((acum, val) => acum * val, 1.0);
        let calculoStatus = stat.base * stat.mBase * stat.mGeral * multStatusUnicoTotal * stat.mAbsoluto;
        let bonusParcial = Math.floor(calculoStatus); 
        
        bonusFixoFinal += bonusParcial;

        relatorioStatus.push(`[${stat.nome}] Base: ${stat.base} -> Contribuição: ${bonusParcial.toLocaleString('pt-BR')}`);
        if (unicosStatus.length > 1 || unicosStatus[0] !== 1.0) {
            relatorioStatus.push(`         Múltiplos 'Único' em ${stat.nome}: x${multStatusUnicoTotal}`);
        }
    }

    let baseRolagem = somaDados * bonusFixoFinal;
    let energiaCalculada = Math.floor(ataqueInfo.energiaGasta * ataqueInfo.mEnergia);
    let danoBrutoCalculado = Math.floor(ataqueInfo.danoBruto * ataqueInfo.mDanoBruto);
    let danoInicial = baseRolagem + energiaCalculada + danoBrutoCalculado;

    let unicosDano = tratarUnico(ataqueInfo.dUnico);
    let multDanoUnicoTotal = unicosDano.reduce((acum, val) => acum * val, 1.0);
    let calculoTotal = danoInicial * ataqueInfo.dGeral * ataqueInfo.dBase * ataqueInfo.dPotencial * ataqueInfo.dFormas * multDanoUnicoTotal * ataqueInfo.dAbsoluto;
    let danoTotal = Math.floor(calculoTotal);

    let digitosDano = contarDigitos(danoTotal);
    let digitosLimite = 8; // 10.000.000
    let pontosLetalidade = digitosDano - digitosLimite;
    let danoReduzido = danoTotal;

    if (pontosLetalidade > 0) {
        danoReduzido = Math.floor(danoTotal / Math.pow(10, pontosLetalidade));
    }

    console.log("\n" + "=".repeat(50));
    console.log("               RELATÓRIO DE DANO");
    console.log("=".repeat(50));
    
    console.log(`[DADOS] Sorteados: [${resultadosDados.join(', ')}] -> Soma: ${somaDados}`);
    console.log(`[STATUS UTILIZADOS] Bônus Fixo Total: ${bonusFixoFinal.toLocaleString('pt-BR')}`);
    relatorioStatus.forEach(linha => console.log(`   - ${linha}`));

    console.log("-".repeat(50));
    console.log(`[BASE DA ROLAGEM] Dados (${somaDados}) x Bônus Total (${bonusFixoFinal.toLocaleString('pt-BR')}) = ${baseRolagem.toLocaleString('pt-BR')}`);
    
    let textoEnergia = ataqueInfo.mEnergia !== 1.0 ? `Energia: ${ataqueInfo.energiaGasta} (x${ataqueInfo.mEnergia}) = ${energiaCalculada}` : `Energia: ${energiaCalculada}`;
    let textoBruto = ataqueInfo.mDanoBruto !== 1.0 ? `Bruto: ${ataqueInfo.danoBruto} (x${ataqueInfo.mDanoBruto}) = ${danoBrutoCalculado}` : `Bruto: ${danoBrutoCalculado}`;
    
    console.log(`[ADIÇÕES] ${textoEnergia} | ${textoBruto}`);
    console.log(`[DANO INICIAL] = ${danoInicial.toLocaleString('pt-BR')}`);
    console.log("-".repeat(50));
    
    if (unicosDano.length > 1 || unicosDano[0] !== 1.0) {
        console.log(`[MULT. DANO] Múltiplos 'Único' ativados: x${multDanoUnicoTotal}`);
    }

    console.log(`💥 DANO TOTAL (Bruto)  : ${danoTotal.toLocaleString('pt-BR')}`);
    if (pontosLetalidade > 0) {
        console.log(`⚔️ DANO REDUZIDO (Aplic): ${danoReduzido.toLocaleString('pt-BR')}`);
    }
    
    let sinalLetalidade = pontosLetalidade > 0 ? "+" : "";
    console.log(`💀 PONTOS LETALIDADE   : ${sinalLetalidade}${pontosLetalidade}`);
    console.log("==================================================\n");
}

// ==========================================
// MENUS INTERATIVOS
// ==========================================

async function menuAcerto() {
    console.log("\n" + "=".repeat(30));
    console.log("       🎯 ROLAGEM DE ACERTO");
    console.log("=".repeat(30));

    let chaves = Object.keys(ficha);
    console.log("Quais atributos governarão o acerto?");
    chaves.forEach((chave, index) => {
        console.log(`${index + 1}. ${ficha[chave].nome}`);
    });
    
    // Destreza (índice 8 na lista, que é 7 no array) é um bom padrão para acerto
    let opAttr = await fazerPergunta("\nEscolha os Atributos separando por vírgula (ex: 7,8) [Padrão 8-Destreza]: ");
    let indices = opAttr.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < chaves.length);
    
    if (indices.length === 0) indices = [7]; // Destreza padrão
    
    let statsEscolhidos = indices.map(idx => ficha[chaves[idx]]);

    console.log(`\n> Atributos selecionados: ${statsEscolhidos.map(s => s.nome).join(' + ')}`);

    console.log("\n--- CONFIGURAÇÃO DO ACERTO ---");
    memAcerto.qtdDados = await perguntarValor("Quantidade de dados", memAcerto.qtdDados, "int");
    memAcerto.faces = await perguntarValor("Faces do dado (ex: 20)", memAcerto.faces, "int");
    memAcerto.proficiencia = await perguntarValor("Proficiência", memAcerto.proficiencia, "int");
    memAcerto.bonus = await perguntarValor("Bônus Fixo Extra", memAcerto.bonus, "int");

    rolarAcerto(memAcerto.qtdDados, memAcerto.faces, statsEscolhidos, memAcerto);
    
    let tentarDeNovo = await fazerPergunta("\nPressione ENTER para voltar ao Menu Principal ou 'S' para rolar com os mesmos valores: ");
    if (tentarDeNovo.trim().toUpperCase() === 'S') {
        rolarAcerto(memAcerto.qtdDados, memAcerto.faces, statsEscolhidos, memAcerto);
        await fazerPergunta("\nPressione ENTER para voltar ao Menu Principal...");
    }
}

async function menuAtaque() {
    console.log("\n" + "=".repeat(30));
    console.log("       ⚔️ ROLAGEM DE DANO");
    console.log("=".repeat(30));

    let chavesOfensivas = ['inteligencia', 'energiaEsp', 'stamina', 'forca', 'destreza'];
    
    console.log("Quais atributos governarão o dano?");
    chavesOfensivas.forEach((chave, index) => {
        console.log(`${index + 1}. ${ficha[chave].nome}`);
    });
    
    let opAttr = await fazerPergunta("\nEscolha os Atributos separando por vírgula (ex: 1,3,4) [Padrão 4-Força]: ");
    let indices = opAttr.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < chavesOfensivas.length);
    
    if (indices.length === 0) indices = [3]; 
    
    let statsEscolhidos = indices.map(idx => ficha[chavesOfensivas[idx]]);

    console.log(`\n> Atributos selecionados: ${statsEscolhidos.map(s => s.nome).join(' + ')}`);

    console.log("\n--- 1. CONFIGURAÇÃO DOS DADOS ---");
    memAtaque.qtdDados = await perguntarValor("Quantidade de dados", memAtaque.qtdDados, "int");
    memAtaque.faces = await perguntarValor("Faces do dado", memAtaque.faces, "int");

    console.log("\n--- 2. ADIÇÕES AO DANO ---");
    memAtaque.energiaGasta = await perguntarValor("Energia Gasta", memAtaque.energiaGasta, "int");
    memAtaque.mEnergia = await perguntarValor("Multiplicador de Energia", memAtaque.mEnergia, "float");
    memAtaque.danoBruto = await perguntarValor("Dano Bruto Extra", memAtaque.danoBruto, "int");
    memAtaque.mDanoBruto = await perguntarValor("Multiplicador de Dano Bruto", memAtaque.mDanoBruto, "float");

    console.log("\n--- 3. MULTIPLICADORES DE DANO FINAL ---");
    memAtaque.dGeral = await perguntarValor("Dano Geral", memAtaque.dGeral, "float");
    memAtaque.dBase = await perguntarValor("Dano Base", memAtaque.dBase, "float");
    memAtaque.dPotencial = await perguntarValor("Potencial", memAtaque.dPotencial, "float");
    memAtaque.dFormas = await perguntarValor("Formas", memAtaque.dFormas, "float");
    memAtaque.dUnico = await perguntarValor("Único [separe por vírgula]", memAtaque.dUnico, "texto");
    memAtaque.dAbsoluto = await perguntarValor("Absoluto", memAtaque.dAbsoluto, "float");

    rolarAtaqueEpico(memAtaque.qtdDados, memAtaque.faces, statsEscolhidos, memAtaque);
    
    let tentarDeNovo = await fazerPergunta("\nPressione ENTER para voltar ao Menu Principal ou 'S' para rolar novamente: ");
    if (tentarDeNovo.trim().toUpperCase() === 'S') {
        rolarAtaqueEpico(memAtaque.qtdDados, memAtaque.faces, statsEscolhidos, memAtaque);
        await fazerPergunta("\nPressione ENTER para voltar ao Menu Principal...");
    }
}

async function menuFicha() {
    let chaves = Object.keys(ficha);
    while(true) {
        console.log("\n" + "=".repeat(30));
        console.log("     📝 FICHA DE PERSONAGEM");
        console.log("=".repeat(30));
        
        chaves.forEach((chave, index) => {
            let s = ficha[chave];
            let multUnico = tratarUnico(s.mUnico).reduce((a, b) => a * b, 1.0);
            let valFinal = Math.floor(s.base * s.mBase * s.mGeral * multUnico * s.mAbsoluto);
            console.log(`${index + 1}. ${s.nome} (Base: ${s.base} | Final: ${valFinal.toLocaleString('pt-BR')})`);
        });
        
        let opcaoVoltar = chaves.length + 1;
        console.log(`${opcaoVoltar}. ↩️ Voltar ao Menu Principal`);

        let opcao = await fazerPergunta(`\nEscolha um atributo para editar (1-${chaves.length}) ou ${opcaoVoltar} para voltar: `);
        let idx = parseInt(opcao) - 1;

        if (opcao === String(opcaoVoltar)) break;

        if (idx >= 0 && idx < chaves.length) {
            let chaveEscolhida = chaves[idx];
            let s = ficha[chaveEscolhida];
            console.log(`\n--- Editando: ${s.nome} ---`);
            s.base = await perguntarValor("Valor Base", s.base, "int");
            s.mBase = await perguntarValor("Multiplicador Base", s.mBase, "float");
            s.mGeral = await perguntarValor("Multiplicador Geral", s.mGeral, "float");
            s.mUnico = await perguntarValor("Multiplicador Único [separe por vírgula]", s.mUnico, "texto");
            s.mAbsoluto = await perguntarValor("Multiplicador Absoluto", s.mAbsoluto, "float");
            
            salvarJogo(); 
            console.log(`\n✅ ${s.nome} atualizado e salvo com sucesso!`);
        } else {
            console.log("Opção inválida.");
        }
    }
}

async function iniciarSistema() {
    console.log("\n=== 🎲 BEM-VINDO AO ROLADOR DE RPG 🎲 ===");
    carregarJogo(); 

    while (true) {
        console.log("\n" + "=".repeat(30));
        console.log("       MENU PRINCIPAL");
        console.log("=".repeat(30));
        console.log("1. ⚔️  Rolar Dano (Ataque)");
        console.log("2. 🎯  Rolar Acerto");
        console.log("3. 📝  Ficha de Personagem");
        console.log("4. ❌  Sair do Sistema");
        
        let opcao = await fazerPergunta("\nEscolha uma opção (1-4): ");
        
        if (opcao === '1') {
            await menuAtaque();
        } else if (opcao === '2') {
            await menuAcerto(); // Novo Menu!
        } else if (opcao === '3') {
            await menuFicha();
        } else if (opcao === '4') {
            console.log("\nEncerrando o sistema... Boas sessões de RPG!\n");
            break;
        } else {
            console.log("Opção inválida! Digite 1, 2, 3 ou 4.");
        }
    }
    rl.close();
}

// Inicia o programa
iniciarSistema();