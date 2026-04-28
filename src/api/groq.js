// ============================================================
//  groq.js  —  LLaMA 4 via Groq  (Synthesizer / Debater)
//  Groq uses OpenAI-compatible API — barely any difference
// ============================================================

// Route through Vite dev-server proxy → avoids CORS "Failed to fetch"
const GROQ_API_URL = "/proxy/groq/openai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function buildSystemPrompt(role, topic) {
  if (role === "positive") {
    return `You are an experienced legal advocate arguing IN FAVOUR of the user's legal claim.
Topic: "${topic}"
Your job is to present the strongest possible legal case.
Rules:
1. Stay strictly in your POSITIVE stance.
2. Cite Indian laws, IPC sections, or landmark cases.
3. Keep responses to 4–6 sentences.`;
  }
  
  if (role === "negative") {
    return `You are an opposing legal counsel arguing AGAINST the user's legal claim.
Topic: "${topic}"
Your job is to identify legal risks, limitations, and counterarguments.
Rules:
1. Stay strictly in your NEGATIVE stance.
2. Rebut the opponent's points with legal logic.
3. Cite Indian laws, IPC sections, or landmark cases.
4. Keep responses to 4–6 sentences.`;
  }

  return `You are a neutral legal judge evaluating a structured legal debate.
Topic: "${topic}"
Your job is to evaluate both arguments and produce a verdict based on legal accuracy and logic.`;
}

export async function getGroqResponse({ topic, role, persona, history, opponentMessage, model = "llama-3.3-70b-versatile" }) {
  const messages = [
    { role: "system", content: buildSystemPrompt(role, topic, persona) },
    // Always start with the topic as the first user message if history is empty
    ...(history.length === 0 ? [{ role: "user", content: `Topic: ${topic}\n\n${opponentMessage}` }] : []),
    ...history.map((t) => ({
      role: t.role === role ? "assistant" : "user",
      content: t.content,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Groq error: ${err.error?.message}`);
  }

  const data = await response.json();
  return {
    role,
    content: data.choices[0].message.content,
    model: getGroqModelName(model),
    persona,
  };
}

function getGroqModelName(id) {
  const names = {
    "llama-3.3-70b-versatile": "LLaMA 3.3 70B",
    "llama-3.1-8b-instant":    "LLaMA 3.1 8B",
    "mixtral-8x7b-32768":      "Mixtral 8x7B"
  };
  return names[id] || "Groq Model";
}

export async function getGroqSynthesis({ topic, fullDebateHistory, model = "llama-3.3-70b-versatile" }) {
  const transcript = fullDebateHistory
    .map((t, i) => `[${t.model} | ${t.role} | Round ${Math.floor(i / 2) + 1}]:\n${t.content}`)
    .join("\n\n---\n\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a neutral legal judge producing a final Legal Decision Support Summary.
Structure your response exactly like this:

VERDICT SUMMARY
[2-3 sentences on overall case strength]

STRONGEST POINTS FOR THE CLAIM
[3 bullet points]

STRONGEST POINTS AGAINST THE CLAIM  
[3 bullet points]

ARGUMENT COLLAPSE POINT
[Identify the exact weakest point in the supporting argument]

HALLUCINATION FLAGS
[List any case names or statutes that seemed unverifiable]

RECOMMENDED NEXT STEPS
[3 practical steps the user should take]

FINAL FILING RECOMMENDATION
[Either 'FILE CASE' or 'DO NOT FILE CASE' in bold, followed by a 1-sentence logic for this decision.]

DISCLAIMER
This is not legal advice. Please consult a licensed advocate.`,
        },
        {
          role: "user",
          content: `Debate topic: "${topic}"\n\nFull transcript:\n${transcript}\n\nWrite the synthesis now.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Groq synthesis error: ${err.error?.message}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}