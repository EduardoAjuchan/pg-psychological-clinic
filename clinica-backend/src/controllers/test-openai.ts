import { getOpenAI } from "../lib/openai";

(async () => {
  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: "Hola, probando conexión." }]
  });
  console.log(resp.choices[0].message);
})();