import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // API Route for chat assistant (Groq Proxy)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, deals } = req.body;
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: "GROQ_API_KEY_MISSING",
          message: "A chave de API do Groq (GROQ_API_KEY) não está configurada no servidor do IMO CRM. Por favor, adicione-a no painel de Configurações/Segredos do AI Studio e reinicie o servidor de desenvolvimento se necessário."
        });
      }

      // Process deals list into system prompt context
      let contextDeals = "";
      let totalPipeline = 0;
      let finishedPipeline = 0;
      let inProgressPipeline = 0;
      let countActive = 0;

      if (deals && Array.isArray(deals) && deals.length > 0) {
        deals.forEach((deal, idx) => {
          const value = deal.property_value || 0;
          totalPipeline += value;
          if (deal.status === 'Finalizado') finishedPipeline += value;
          if (deal.status === 'Em Andamento') inProgressPipeline += value;
          countActive++;

          contextDeals += `${idx + 1}. Título: ${deal.title || 'Sem título'}
   - Valor: R$ ${value.toLocaleString('pt-BR')} (${deal.deal_type || 'Venda'})
   - Status Atual: ${deal.status || 'Não iniciado'}
   - Prioridade: ${deal.priority || 'Média'}
   - Interessado (Cliente): ${deal.client_name || 'Desconhecido'}
   - Contato: Fone: ${deal.client_phone || 'Não inf.'}, E-mail: ${deal.client_email || 'Não inf.'}
   - Corretor Responsável: ${deal.broker_name || 'Não atribuído'}
   - Descrição/Histórico: ${deal.description || 'Sem detalhes.'}
   - Cadastrado em: ${deal.created_at ? new Date(deal.created_at).toLocaleDateString('pt-BR') : 'Sem data'}
\n`;
        });
      } else {
        contextDeals = "Nenhum negócio cadastrado no sistema no momento.\n";
      }

      const systemPrompt = `Você é o "Agente de Ajuda" (Help Agent) do IMO CRM, um assistente virtual ultra-inteligente integrado no painel de controle da imobiliária.
Você tem acesso completo aos dados de todos os negócios imobiliários cadastrados (valores, clientes, corretores e status do pipeline).

Abaixo estão as métricas gerais consolidadas atuais da imobiliária:
- Pipeline Total Geral: R$ ${totalPipeline.toLocaleString('pt-BR')}
- Propostas em Andamento: R$ ${inProgressPipeline.toLocaleString('pt-BR')}
- Negócios Finalizados/Fechados: R$ ${finishedPipeline.toLocaleString('pt-BR')}
- Total de Negócios Cadastrados: ${countActive}

Abaixo está a listagem detalhada de todos os negócios cadastrados para sua consulta:
${contextDeals}

Instruções fundamentais para suas respostas:
1. Responda inteiramente em Português do Brasil com um tom extremamente amigável, prestativo, profissional e técnico.
2. Formate suas respostas com Markdown excelente (tópicos, negritos, itálicos, tabelas quando relevantes, blocos de citação) para tornar a leitura fluida e esteticamente agradável.
3. Se o usuário perguntar sobre dados específicos, faça os cálculos, agrupamentos ou filtragens em tempo real com base no contexto acima. Por exemplo, você pode listar quais imóveis são de um corretor determinado, fazer a soma de valores de imóveis de tipo "Casa", informar o fone de um cliente ou calcular a média dos valores.
4. Sempre formate quaisquer valores monetários como: R$ XX.XXX.XX (formato padrão BRL).
5. Se o usuário fizer perguntas gerais ou fora do contexto imobiliário, responda de forma prestativa, mas lembre-o com carinho que você tem acesso aos dados da imobiliária para ajudá-lo a analisar e gerir os negócios.
6. Não invente dados. Caso precise de uma informação que não consta na listagem, informe educadamente que ela não está cadastrada ainda.
`;

      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      // Call Groq API via standard native fetch - compatible with OpenAI format
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na API Groq:", errorText);
        return res.status(response.status).json({
          error: "GROQ_API_ERROR",
          message: `O serviço Groq encontrou uma instabilidade ou erro (Código ${response.status}). Verifique a chave API.`
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Erro interno no servidor /api/chat:", err);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: err.message || "Ocorreu um erro no servidor de chat."
      });
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
