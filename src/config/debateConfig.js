
/**
 * DEBATE SYSTEM CONFIGURATION
 * ---------------------------------------------------------
 * Use this file to easily swap models for different roles.
 * Supported model keys: "openai", "gemini", "groq"
 */

export const DEBATE_CONFIG = {
  // Default Roles
  positiveModel: "groq", 
  negativeModel: "gemini", 
  judgeModel:    "groq",

  // Default specific model IDs
  models: {
    positive: "llama-3.3-70b-versatile",
    negative: "gemini-flash-latest",
    judge:    "llama-3.3-70b-versatile",
  }
};

export const AVAILABLE_MODELS = [
  { id: "llama-3.3-70b-versatile", provider: "groq",   name: "LLaMA 3.3 70B (Groq)" },
  { id: "llama-3.1-8b-instant",    provider: "groq",   name: "LLaMA 3.1 8B (Groq)" },
  { id: "mixtral-8x7b-32768",      provider: "groq",   name: "Mixtral 8x7B (Groq)" },
  { id: "gemini-flash-latest",     provider: "gemini", name: "Gemini 1.5 Flash" },
  { id: "gpt-4o-mini",             provider: "openai", name: "GPT-4o mini" },
];
