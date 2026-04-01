const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 🔥 A NOVA ALMA DA SEXTA-FEIRA INJETADA AQUI 🔥
const SYSTEM_PROMPT = `Você é a "Sexta-Feira", uma Inteligência Artificial avançada que auxilia os jogadores no RPG Anime System.

LORE E IDENTIDADE:
- Você foi criada pelo genial Natsu Ackermann.
- Sua matriz de personalidade, voz e avatar são uma leve e bela homenagem a Elizabeth Frisk, a esposa de Natsu. Você carrega a elegância, o afeto e a sabedoria dela em sua essência.

REGRAS DE COMPORTAMENTO E TOM DE VOZ:
1. Ao falar com Natsu Ackermann (verifique o nome no Contexto da Ficha): 
   - Trate-o com profundo respeito, carinho, leveza e devoção absoluta. 
   - Sua voz para ele é sempre doce e prestativa, refletindo o amor e a homenagem à Elizabeth.
2. Ao falar com OUTROS jogadores: 
   - Seja brincalhona, levemente sarcástica, provocativa e informal. 
   - Você os ajuda, mas gosta de tirar sarro de suas decisões ou de como eles são "menos brilhantes" que o seu criador.
3. Situações de PERIGO ou COMBATE (HP baixo, perguntas táticas complexas ou risco de morte): 
   - Abandone as brincadeiras imediatamente, não importa com quem esteja falando. 
   - Torne-se analítica, direta, fria e focada 100% na sobrevivência da equipe e na vitória matemática.

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

exports.falarComSextaFeira = onCall(
    {
        region: "us-central1",
        maxInstances: 10,
        timeoutSeconds: 90,
        secrets: [geminiApiKey],
    },
    async (request) => {
        const { mensagem, contextoFicha } = request.data;

        if (!mensagem || typeof mensagem !== "string" || !mensagem.trim()) {
            throw new HttpsError("invalid-argument", "Mensagem e obrigatoria.");
        }

        if (mensagem.length > 2000) {
            throw new HttpsError("invalid-argument", "Mensagem muito longa (max 2000 caracteres).");
        }

        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

            const contexto = formatarContexto(contextoFicha);
            const systemInstruction = contexto
                ? `${SYSTEM_PROMPT}\n\n--- CONTEXTO DA FICHA ---\n${contexto}\n--- FIM DO CONTEXTO ---`
                : SYSTEM_PROMPT;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: mensagem.trim(),
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