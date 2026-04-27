// ============================================================
//  openai.js  —  GPT-4o mini  Debate Handler
// ============================================================

// Route through Vite dev-server proxy → avoids CORS "Failed to fetch"
const OPENAI_API_URL = "/proxy/openai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

function buildSystemPrompt(role, topic) {
  const stance =
    role === "positive"
      ? `You are an experienced legal advocate arguing IN FAVOUR of the user's legal claim.
Your job is to present the strongest possible legal case supporting: "${topic}"
- Cite relevant Indian laws, IPC sections, or legal principles
- Present logical legal reasoning
- Address constitutional rights where applicable`
      : `You are an opposing legal counsel arguing AGAINST the user's legal claim.
Your job is to present legal risks, limitations and counterarguments against: "${topic}"
- Cite relevant Indian laws, IPC sections, or legal principles  
- Present logical legal reasoning
- Identify weaknesses in the claim`;

  return `${stance}

Rules:
1. Stay strictly in your assigned role.
2. Directly rebut the opponent's previous legal points.
3. Cite specific Indian laws, sections, or landmark cases where possible.
4. Keep responses to 4–6 sentences.
5. Never fabricate case names — if unsure, argue from legal principles only.
6. Do NOT use unverifiable statistics.`;
}

export async function getOpenAIResponse({ topic, role, persona, history, opponentMessage }) {
  const messages = [
    { role: "system", content: buildSystemPrompt(role, topic, persona) },
    // Always start with the topic as the first user message if history is empty
    ...(history.length === 0 ? [{ role: "user", content: `Topic: ${topic}\n\n${opponentMessage}` }] : []),
    ...history.map((t) => ({
      role: t.role === role ? "assistant" : "user",
      content: t.content,
    })),
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`OpenAI error: ${msg}`);
  }

  const data = await response.json();
  return {
    role,
    content: data.choices[0].message.content,
    model: "GPT-4o mini",
    persona,
  };
}

export async function getOpenAISynthesis({ topic, fullDebateHistory }) {
  const transcript = fullDebateHistory
    .map((t, i) => `[${t.model} | ${t.role} | Round ${Math.floor(i / 2) + 1}]:\n${t.content}`)
    .join("\n\n---\n\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a neutral legal analyst. Analyze this legal debate transcript and write a balanced legal decision support summary.
- Summarize strongest legal points from both sides
- Flag any cited cases or statutes that seem unverifiable
- Identify the exact argument where the supporting side struggled most (collapse point)
- Give recommended next steps for the user
- End with: "This is not legal advice. Consult a licensed advocate for your specific situation."`,
        },
        {
          role: "user",
          content: `Debate topic: "${topic}"\n\nFull transcript:\n${transcript}\n\nWrite the synthesis now.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`OpenAI synthesis error: ${msg}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}