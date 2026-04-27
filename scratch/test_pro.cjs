
const key = "AIzaSyD8Y9EPdz6YzIsfwNs7WTLRlgkK8_Ruj_U";

async function test(model) {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  console.log(`Testing model: ${model}`);
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Write a short legal paragraph about IPC 323." }] }]
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (data.error) {
      console.log(`Error: ${data.error.message}`);
      return false;
    }
    console.log("Response text length:", data.candidates[0].content.parts[0].text.length);
    return true;
  } catch (err) {
    console.error("Fetch Error:", err);
    return false;
  }
}

async function run() {
  await test("gemini-pro-latest");
}

run();
