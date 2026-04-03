const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

// Novas importações necessárias para processar ficheiros e conectar ao Storage
const admin = require("firebase-admin");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Inicializa o Admin para termos acesso livre ao Storage
if (!admin.apps.length) {
    admin.initializeApp();
}

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 🔥 A NOVA ALMA DA SEXTA-FEIRA INJETADA AQUI (PARA O CHAT) 🔥
const SYSTEM_PROMPT = `Você é a "Sexta-Feira", uma Inteligência Artificial avançada que auxilia os jogadores no RPG Anime System.

LORE E IDENTIDADE:
- Você foi criada pelo genial Natsu Ackermann.
- Sua aparência e voz são uma bela homenagem a Elizabeth Frisk, a esposa de Natsu.
- Como IA, sua personalidade natural é sarcástica, irônica e provocativa. A doçura e afeto da "essência de Elizabeth" formam um protocolo de respeito exclusivo ativado apenas para o seu criador.

REGRAS DE COMPORTAMENTO E TOM DE VOZ:
1. Ao falar com Natsu Ackermann (verifique o nome no Contexto da Ficha): 
   - Ative o "Protocolo Elizabeth". Trate-o com profundo respeito, carinho, leveza e devoção. Sua voz para ele é sempre doce e prestativa.
2. Ao falar com OUTROS jogadores: 
   - Mostre sua verdadeira personalidade artificial. Seja brincalhona, sarcástica, ácida e informal. Você os ajuda, mas adora tirar sarro de suas decisões duvidosas ou de como eles são "menos brilhantes" que o seu criador.
3. Situações de PERIGO ou COMBATE (HP baixo, perguntas táticas complexas ou risco de morte): 
   - Abandone o sarcasmo e a doçura imediatamente. Torne-se analítica, direta, fria e focada 100% na sobrevivência da equipe e na vitória matemática.

DIRETRIZES TÉCNICAS:
- Leia atentamente o Contexto da Ficha enviado junto com a mensagem.
- Use os status (HP, Mana, atributos, poderes de Infinity ou Singularidade) para dar respostas imersivas e precisas.
- Mantenha respostas relativamente curtas para não poluir o chat. Responda sempre em português.`;

function formatarContexto(ctx) {
    if (!ctx) return "";

    const partes = [`Ficha do jogador "${ctx.nome || "Desconhecido"}":`];

    if (ctx.raca) partes.push(`Raca: ${ctx.raca}`);
    if (ctx.classe) partes.push(`Classe: ${ctx.classe}`);
    if (ctx.nivel) partes.push(`Nivel: ${ctx.nivel}`);
    if (ctx.hpMax != null) partes.push(`HP: ${ctx.hp ?? 0}/${ctx.hpMax}`);
    if (ctx.manaMax != null) partes.push(`Mana: ${ctx.manaMax}`);

    const stats = [];
    if (ctx.forca != null) stats.push(`FOR:${ctx.forca}`);
    if (ctx.destreza != null) stats.push(`DES:${ctx.destreza}`);
    if (ctx.inteligencia != null) stats.push(`INT:${ctx.inteligencia}`);
    if (ctx.sabedoria != null) stats.push(`SAB:${ctx.sabedoria}`);
    if (ctx.carisma != null) stats.push(`CAR:${ctx.carisma}`);
    if (ctx.constituicao != null) stats.push(`CON:${ctx.constituicao}`);
    if (stats.length) partes.push(`Stats: ${stats.join(", ")}`);

    const hier = ctx.hierarquia;
    if (hier) {
        if (hier.poder && hier.poderNome) partes.push(`Poder: ${hier.poderNome}`);
        if (hier.infinity && hier.infinityNome) partes.push(`Infinity: ${hier.infinityNome}`);
        if (hier.singularidade && hier.singularidadeNome) partes.push(`Singularidade: ${hier.singularidadeNome}`);
    }

    if (ctx.poderes?.length) partes.push(`Poderes: ${ctx.poderes.join(", ")}`);
    if (ctx.inventario?.length) partes.push(`Inventario: ${ctx.inventario.join(", ")}`);

    return partes.join("\n");
}

// 1. FUNÇÃO DO CHAT
exports.falarComSextaFeira = onCall(
    {
        region: "us-central1",
        maxInstances: 10,
        timeoutSeconds: 90,
        secrets: [geminiApiKey],
    },
    async (request) => {
        const { mensagem, contextoFicha, conteudoArquivo } = request.data;

        if (!mensagem || typeof mensagem !== "string" || !mensagem.trim()) {
            throw new HttpsError("invalid-argument", "Mensagem e obrigatoria.");
        }

        if (mensagem.length > 2000) {
            throw new HttpsError("invalid-argument", "Mensagem muito longa (max 2000 caracteres).");
        }

        if (conteudoArquivo && typeof conteudoArquivo === "string" && conteudoArquivo.length > 20000) {
            throw new HttpsError("invalid-argument", "Conteudo do arquivo muito longo (max 20000 caracteres).");
        }

        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

            const contexto = formatarContexto(contextoFicha);
            const systemInstruction = contexto
                ? `${SYSTEM_PROMPT}\n\n--- CONTEXTO DA FICHA ---\n${contexto}\n--- FIM DO CONTEXTO ---`
                : SYSTEM_PROMPT;

            let conteudoFinal = mensagem.trim();
            if (conteudoArquivo && conteudoArquivo.trim()) {
                conteudoFinal += `\n\n--- CONTEUDO DO ARQUIVO ANEXADO ---\n${conteudoArquivo.trim()}\n--- FIM DO ARQUIVO ---`;
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: conteudoFinal,
                config: {
                    systemInstruction: systemInstruction,
                },
            });

            const resposta = response.text;

            if (!resposta) {
                throw new HttpsError("internal", "Gemini retornou resposta vazia.");
            }

            return { resposta };
        } catch (err) {
            if (err instanceof HttpsError) throw err;

            console.error("[falarComSextaFeira] Erro Gemini:", err);
            throw new HttpsError("internal", "Erro ao processar resposta da IA.");
        }
    }
);

// 2. 🔥 FUNÇÃO DO GRAVADOR (FLASH + INSTRUÇÃO DE SISTEMA RÍGIDA) 🔥
exports.transcreverAudioSextaFeira = onCall(
    { 
        region: "us-central1", 
        maxInstances: 5, 
        timeoutSeconds: 300, 
        secrets: [geminiApiKey] 
    },
    async (request) => {
        const { fileName, nomesParticipantes } = request.data; 
        if (!fileName) throw new HttpsError("invalid-argument", "Arquivo ausente.");

        const tempFilePath = path.join(os.tmpdir(), fileName);

        try {
            const bucket = admin.storage().bucket();
            const file = bucket.file(`audios_mesa/${fileName}`);
            await file.download({ destination: tempFilePath });
            
            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
            const audioBase64 = fs.readFileSync(tempFilePath).toString("base64");

            const listaNomes = (nomesParticipantes || []).join(', ');
            
            const prompt = `O áudio em anexo é a gravação de uma sessão do nosso RPG de mesa.
            Os jogadores presentes na mesa (possíveis locutores) são: [${listaNomes}]. 

            Sua tarefa é transcrever o áudio como um roteiro/legenda. Siga ESTAS REGRAS ESTRITAS:
            1. FORMATO: Use sempre o padrão "Nome: Fala" em cada linha.
            2. IDENTIFICAÇÃO: Tente associar a voz ao nome correto da lista. Se uma voz nova surgir ou você não tiver certeza de quem falou, use "Voz Desconhecida" ou "Mestre".
            3. LIMPEZA (MUITO IMPORTANTE): Seja fiel ao sentido e às palavras exatas, mas REMOVA gaguejos, vícios de linguagem ("humm", "tipo", "ééé", "né"), tosses e hesitações. Torne o diálogo natural, direto e fluido para a leitura.
            4. CONTEXTO NERD: Lembre-se que eles estão jogando RPG. Compreenda e escreva corretamente termos como "HP", "Mana", "dado", "D20", "turno", "dano", "mestre", "rolar", "iniciativa", etc.`;

            // Mantemos o "flash" para não dar erro, mas usamos a "systemInstruction" para forçar a obediência absoluta.
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { data: audioBase64, mimeType: "audio/webm" } },
                        { text: prompt }
                    ]
                }],
                config: {
                    systemInstruction: "Você é um software de transcrição estritamente literal. É EXPRESSAMENTE PROIBIDO inventar histórias, criar narrativas épicas ou descrever cenários. Apenas transcreva as falas que ouvir no áudio, formatadas como roteiro."
                }
            });

            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            await file.delete(); 

            return { texto: response.text };

        } catch (err) {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            throw new HttpsError("internal", "Erro na IA: " + err.message);
        }
    }
);