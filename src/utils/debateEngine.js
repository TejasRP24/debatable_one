// ============================================================
//  debateEngine.js  —  Legal Decision Support Debate Orchestrator
//  Models:
//    - OpenAI  (GPT-4o mini)  → Argues FOR the legal claim
//    - Gemini  (1.5 Flash)    → Argues AGAINST the legal claim
//    - Groq    (LLaMA 4)      → Neutral Judge + Final Verdict
// ============================================================

import { getOpenAIResponse, getOpenAISynthesis } from "../api/openai.js";
import { getGeminiResponse, getGeminiSynthesis } from "../api/gemini.js";
import { getGroqResponse,   getGroqSynthesis   } from "../api/groq.js";
import { DEBATE_CONFIG } from "../config/debateConfig.js";

// ─────────────────────────────────────────────────────────────
//  MODEL REGISTRY
// ─────────────────────────────────────────────────────────────

export const MODELS = {
  OPENAI: "openai",
  GEMINI: "gemini",
  GROQ:   "groq",
};

const API_MAP = {
  [MODELS.OPENAI]: { debate: getOpenAIResponse, synthesize: getOpenAISynthesis },
  [MODELS.GEMINI]: { debate: getGeminiResponse, synthesize: getGeminiSynthesis },
  [MODELS.GROQ]:   { debate: getGroqResponse,   synthesize: getGroqSynthesis   },
};

// ─────────────────────────────────────────────────────────────
//  RETRY HELPER
//  Retries a function if it fails with a "high demand" error.
// ─────────────────────────────────────────────────────────────

async function withRetry(fn, args) {
  let attempts = 0;
  const maxAttempts = 5;
  const delay = 5000; // 5 seconds as requested

  while (attempts < maxAttempts) {
    try {
      return await fn(args);
    } catch (err) {
      attempts++;
      const isRateLimit = err.message.toLowerCase().includes("high demand") || 
                          err.message.toLowerCase().includes("rate limit") ||
                          err.message.toLowerCase().includes("429");

      if (isRateLimit && attempts < maxAttempts) {
        console.warn(`Model busy. Retrying in 5s... (Attempt ${attempts}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}


// ─────────────────────────────────────────────────────────────
//  COLLAPSE POINT DETECTOR
//  Finds which round the supporting (positive) side
//  struggled the most under pressure from the opposing side.
//  High reactive overlap = positive side just reacting,
//  not advancing new arguments = weakest round.
// ─────────────────────────────────────────────────────────────

function detectCollapsePoint(history) {
  const positiveTurns = history.filter((t) => t.role === "positive");
  const negativeTurns = history.filter((t) => t.role === "negative");

  let maxPressureRound = 1;
  let maxPressureScore = 0;
  const roundScores = [];

  negativeTurns.forEach((negTurn, i) => {
    // Check the positive response that came AFTER this attack
    const posTurn = positiveTurns[i + 1];
    if (!posTurn) return;

    const negWords = new Set(
      (negTurn.content.toLowerCase().match(/\b[a-z]+\b/g) || [])
    );
    const posWords =
      posTurn.content.toLowerCase().match(/\b[a-z]+\b/g) || [];

    // How many positive words are just reacting to negative words?
    const reactiveWords = posWords.filter((w) => negWords.has(w)).length;
    const reactiveScore = reactiveWords / Math.max(posWords.length, 1);

    roundScores.push({
      round: negTurn.round,
      reactiveScore: parseFloat((reactiveScore * 100).toFixed(1)),
    });

    if (reactiveScore > maxPressureScore) {
      maxPressureScore = reactiveScore;
      maxPressureRound = negTurn.round;
    }
  });

  return {
    round: maxPressureRound,
    score: parseFloat((maxPressureScore * 100).toFixed(1)),
    label: `Round ${maxPressureRound} — the supporting argument was weakest here`,
    roundScores,
  };
}


// ─────────────────────────────────────────────────────────────
//  CITATION EXTRACTOR
//  Pulls out any legal citations, IPC sections, or case names
//  from an argument so they can be flagged for verification.
// ─────────────────────────────────────────────────────────────

function extractCitations(text) {
  const citations = [];

  // IPC / legal section patterns  e.g. "Section 304A IPC", "Article 21"
  const sectionPattern =
    /(?:section|sec\.|article|art\.)\s*\d+[A-Z]?(?:\s*(?:of|,)\s*[A-Z][a-zA-Z\s]+)?/gi;

  // Case name patterns  e.g. "Sharma vs State of Maharashtra"
  const casePattern =
    /[A-Z][a-zA-Z]+\s+(?:vs?\.?|versus)\s+[A-Z][a-zA-Z\s]+(?:\d{4})?/g;

  // Act name patterns  e.g. "Industrial Disputes Act 1947"
  const actPattern = /[A-Z][a-zA-Z\s]+Act(?:\s+\d{4})?/g;

  const sectionMatches = text.match(sectionPattern) || [];
  const caseMatches    = text.match(casePattern)    || [];
  const actMatches     = text.match(actPattern)     || [];

  sectionMatches.forEach((m) => citations.push({ type: "section", text: m.trim() }));
  caseMatches.forEach((m)    => citations.push({ type: "case",    text: m.trim() }));
  actMatches.forEach((m)     => citations.push({ type: "act",     text: m.trim() }));

  return citations;
}


// ─────────────────────────────────────────────────────────────
//  ARGUMENT STRENGTH SCORER
//  Scores each argument on a 10-point scale.
//  Used to build the per-round strength chart in the UI.
// ─────────────────────────────────────────────────────────────

function scoreArgument(text, opponentText = "") {
  let score = 0;

  // 1. Length / depth  (0–3 pts)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 120) score += 3;
  else if (wordCount > 70) score += 2;
  else if (wordCount > 40) score += 1;

  // 2. Legal terminology used  (0–3 pts)
  const legalTerms = [
    "section", "act", "article", "ipc", "court", "liable", "jurisdiction",
    "plaintiff", "defendant", "remedy", "relief", "compensation", "statute",
    "precedent", "appeal", "tribunal", "clause", "contract", "rights",
  ];
  const legalHits = legalTerms.filter((t) => text.toLowerCase().includes(t)).length;
  score += Math.min(legalHits, 3);

  // 3. Rebuttal quality — engages with opponent  (0–2 pts)
  if (opponentText) {
    const oppWords = new Set(
      (opponentText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
    );
    const currWords = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const overlap   = currWords.filter((w) => oppWords.has(w)).length;
    const ratio     = overlap / Math.max(oppWords.size, 1);
    if (ratio > 0.25) score += 2;
    else if (ratio > 0.1) score += 1;
  }

  // 4. Reasoning connectors  (0–2 pts)
  const reasoningWords = [
    "because", "therefore", "however", "consequently", "furthermore",
    "whereas", "since", "given", "thus", "although", "despite",
  ];
  const reasoningHits = reasoningWords.filter((w) =>
    text.toLowerCase().includes(w)
  ).length;
  score += Math.min(reasoningHits, 2);

  return Math.min(score, 10);
}


// ─────────────────────────────────────────────────────────────
//  MAIN DEBATE RUNNER
// ─────────────────────────────────────────────────────────────

/**
 * Runs the full legal debate and returns structured results.
 *
 * @param {Object}   config
 * @param {string}   config.topic           - The user's legal query
 * @param {string}   config.positiveModel   - MODELS.OPENAI | MODELS.GEMINI
 * @param {string}   config.negativeModel   - MODELS.OPENAI | MODELS.GEMINI
 * @param {number}   config.rounds          - Number of debate rounds (default: 4)
 * @param {Function} config.onTurnComplete  - Callback after each turn for live UI updates
 *
 * @returns {Promise<{
 *   history: Array,
 *   synthesis: string,
 *   collapsePoint: Object,
 *   citationMap: Object,
 *   allCitations: Object,
 *   strengthScores: Array,
 * }>}
 */
export async function runDebate({
  topic,
  positiveModel = MODELS.OPENAI,
  negativeModel  = MODELS.GEMINI,
  judgeModel     = MODELS.GROQ,
  positiveModelId,
  negativeModelId,
  judgeModelId,
  rounds = 4,
  onTurnComplete = () => {},
}) {
  const history        = [];
  const citationMap    = {};
  const strengthScores = [];

  let lastMessage = `The legal query is: "${topic}". Please present your opening legal argument.`;

  // ── Core debate loop ───────────────────────────────────────
  for (let round = 1; round <= rounds; round++) {

    // ── Positive turn (argues FOR the claim) ──────────────
    const posResponse = await withRetry(
      API_MAP[positiveModel].debate,
      {
        topic,
        role: "positive",
        history,
        opponentMessage: lastMessage,
        model: positiveModelId,
      }
    );

    const posCitations = extractCitations(posResponse.content);
    const posScore     = scoreArgument(
      posResponse.content,
      history.length ? history[history.length - 1].content : ""
    );

    const posTurn = {
      ...posResponse,
      round,
      phase:     "debate",
      citations: posCitations,
      score:     posScore,
    };

    history.push(posTurn);
    citationMap[history.length - 1] = posCitations;
    lastMessage = posResponse.content;

    onTurnComplete({ round, turn: "positive", ...posTurn });

    // ── Negative turn (argues AGAINST the claim) ──────────
    const negResponse = await withRetry(
      API_MAP[negativeModel].debate,
      {
        topic,
        role: "negative",
        history,
        opponentMessage: lastMessage,
        model: negativeModelId,
      }
    );

    const negCitations = extractCitations(negResponse.content);
    const negScore     = scoreArgument(negResponse.content, posResponse.content);

    const negTurn = {
      ...negResponse,
      round,
      phase:     "debate",
      citations: negCitations,
      score:     negScore,
    };

    history.push(negTurn);
    citationMap[history.length - 1] = negCitations;
    lastMessage = negResponse.content;

    onTurnComplete({ round, turn: "negative", ...negTurn });

    // ── Per-round strength record ──────────────────────────
    strengthScores.push({
      round,
      positiveScore: posScore,
      negativeScore: negScore,
    });
  }

  // ── Judge generates the final verdict ─────────────────
  const synthesis = await withRetry(
    API_MAP[judgeModel].synthesize,
    {
      topic,
      fullDebateHistory: history,
      model: judgeModelId,
    }
  );

  // ── Collapse point detection ───────────────────────────────
  const collapsePoint = detectCollapsePoint(history);

  // ── Collect all citations across the full debate ───────────
  const allCitations = {
    positive: history
      .filter((t) => t.role === "positive")
      .flatMap((t) => t.citations || []),
    negative: history
      .filter((t) => t.role === "negative")
      .flatMap((t) => t.citations || []),
  };

  return {
    history,
    synthesis,
    collapsePoint,
    citationMap,
    allCitations,
    strengthScores,
  };
}