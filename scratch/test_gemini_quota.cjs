
const key = "AIzaSyD8Y9EPdz6YzIsfwNs7WTLRlgkK8_Ruj_U";

async function test(model) {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  console.log(`Testing model: ${model}`);
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    if (data.error) {
      console.log(`Error: ${data.error.message}`);
      return false;
    }
    console.log("Success!");
    return true;
  } catch (err) {
    console.error("Fetch Error:", err);
    return false;
  }
}

async function run() {
  const models = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash-latest"];
  for (const m of models) {
    if (await test(m)) {
      console.log(`>>> Use model: ${m}`);
      break;
    }
    console.log("-------------------");
  }
}

run();
