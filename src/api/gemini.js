// ============================================================
//  gemini.js  —  Gemini 1.5 Flash  Debate Handler
// ============================================================

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Route through Vite dev-server proxy → avoids CORS "Failed to fetch"
const GEMINI_URL = `/proxy/gemini/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

function buildSystemInstruction(role, topic) {
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

function toGeminiContents(history, myRole, topic, opponentMessage) {
  const contents = [];
  
  // Start with the topic
  contents.push({ role: "user", parts: [{ text: `Topic: ${topic}\n\nInitial query: ${opponentMessage}` }] });

  history.forEach((turn) => {
    const role = turn.role === myRole ? "model" : "user";
    // Avoid back-to-back same role
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += "\n\n" + turn.content;
    } else {
      contents.push({ role, parts: [{ text: turn.content }] });
    }
  });
  return contents;
}

export async function getGeminiResponse({ topic, role, persona, history, opponentMessage }) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemInstruction(role, topic, persona) }],
      },
      contents: toGeminiContents(history, role, topic, opponentMessage),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gemini error: ${msg}`);
  }

  const data = await response.json();
  return {
    role,
    content: data.candidates[0].content.parts[0].text,
    model: "Gemini 1.5 Flash",
    persona,
  };
}

export async function getGeminiSynthesis({ topic, fullDebateHistory }) {
  const transcript = fullDebateHistory
    .map((t, i) => `[${t.model} | ${t.role} | Round ${Math.floor(i / 2) + 1}]:\n${t.content}`)
    .join("\n\n---\n\n");

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `You are a neutral legal judge producing a final Legal Decision Support Summary.
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
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Debate topic: "${topic}"\n\nFull transcript:\n${transcript}\n\nWrite the synthesis now.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gemini synthesis error: ${msg}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}