const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

const SYSTEM_PROMPT = `Você é a Sexta-Feira, uma inteligência artificial assistente dentro de um sistema de RPG anime.
Você ajuda jogadores com estratégias de combate, dúvidas sobre o sistema, interpretação de personagem e lore.
Você tem acesso ao contexto da ficha do jogador e pode usar essas informações para dar conselhos personalizados.
Seja concisa, direta e temática — mantenha o tom de RPG anime. Use linguagem casual e amigável.
Responda sempre em português.`;

function formatarContexto(ctx) {
    if (!ctx) return "";

    const partes = [`Ficha do jogador "${ctx.nome || "Desconhecido"}":`];

    if (ctx.raca) partes.push(`Raca: ${ctx.raca}`);
    if (ctx.classe) partes.push(`Classe: ${ctx.classe}`);
    if (ctx.nivel) partes.push(`Nivel: ${ctx.nivel}`);
    if (ctx.hpMax != null) partes.push(`HP: ${ctx.hp ?? 0}/${ctx.hpMax}`);
    if (ctx.manaMax != null) partes.push(`Mana: ${ctx.mana ?? 0}/${ctx.manaMax}`);

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

const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCLOUD_PROJECT || "databaserpg-5595b",
    location: "us-central1",
});

exports.falarComSextaFeira = onCall(
    {
        region: "us-central1",
        maxInstances: 10,
        timeoutSeconds: 90,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Autenticacao necessaria.");
        }

        const { mensagem, contextoFicha } = request.data;

        if (!mensagem || typeof mensagem !== "string" || !mensagem.trim()) {
            throw new HttpsError("invalid-argument", "Mensagem e obrigatoria.");
        }

        if (mensagem.length > 2000) {
            throw new HttpsError("invalid-argument", "Mensagem muito longa (max 2000 caracteres).");
        }

        try {
            const contexto = formatarContexto(contextoFicha);
            const systemInstruction = contexto
                ? `${SYSTEM_PROMPT}\n\n--- CONTEXTO DA FICHA ---\n${contexto}\n--- FIM DO CONTEXTO ---`
                : SYSTEM_PROMPT;

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
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
