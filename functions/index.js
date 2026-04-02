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

// 🔥 A NOVA ALMA DA SEXTA-FEIRA INJETADA AQUI 🔥
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

// 1. FUNÇÃO ORIGINAL DO CHAT (Mantida intacta)
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

// 2. 🔥 NOVA FUNÇÃO: O OUVINTE DE ÁUDIO DA SEXTA-FEIRA 🔥
exports.transcreverAudioSextaFeira = onCall(
    { 
        region: "us-central1", 
        maxInstances: 5, 
        timeoutSeconds: 300, 
        secrets: [geminiApiKey] 
    },
    async (request) => {
        const { fileName } = request.data;
        if (!fileName) throw new HttpsError("invalid-argument", "Nome do arquivo de áudio ausente.");

        const tempFilePath = path.join(os.tmpdir(), fileName);

        try {
            console.log(`[Sexta-Feira] 1. Recebi a missão. Procurando áudio: ${fileName}`);

            // Passo A: Baixar o áudio do nosso Storage
            // IMPORTANTE: Se o Firebase reclamar de 'bucket', seu amigo precisa trocar a linha abaixo para:
            // const bucket = admin.storage().bucket("NOME-DO-PROJETO.appspot.com");
            const bucket = admin.storage().bucket();
            const file = bucket.file(`audios_mesa/${fileName}`);
            
            const [exists] = await file.exists();
            if (!exists) throw new HttpsError("not-found", "Áudio não encontrado na nuvem.");

            console.log(`[Sexta-Feira] 2. Áudio encontrado! Baixando para a memória do robô...`);
            await file.download({ destination: tempFilePath });
            
            console.log(`[Sexta-Feira] 3. Áudio baixado. Enviando inline para o Gemini...`);
            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
            const audioBuffer = fs.readFileSync(tempFilePath);
            const audioBase64 = audioBuffer.toString("base64");

            console.log(`[Sexta-Feira] 4. Áudio convertido (${Math.round(audioBuffer.length / 1024)}KB). Pedindo o resumo...`);
            const prompt = `Você é a Sexta-Feira, IA assistente do nosso RPG. O áudio em anexo é a gravação de uma sessão da nossa mesa. Por favor, escute e crie um "Registro Akáshico" (um resumo narrativo e detalhado) do que aconteceu de importante nessa parte da história. Escreva de forma épica, em português. Se só houver ruído, avise.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { data: audioBase64, mimeType: "audio/webm" } },
                        { text: prompt }
                    ]
                }]
            });

            console.log(`[Sexta-Feira] 5. Resumo pronto! Devolvendo para o site e apagando rastros.`);
            
            // Limpeza
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            await file.delete(); 

            return { texto: response.text };

        } catch (err) {
            console.error("[ERRO FATAL NA SEXTA-FEIRA]:", err);
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            throw new HttpsError("internal", "A IA travou: " + err.message);
        }
    }
);