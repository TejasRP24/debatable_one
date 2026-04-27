
const fs = require('fs');

// Simple .env parser
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

if (!API_KEY) {
  console.error("No Gemini API key found in .env");
  process.exit(1);
}

const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

console.log("Testing API Key:", API_KEY);

async function test() {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
