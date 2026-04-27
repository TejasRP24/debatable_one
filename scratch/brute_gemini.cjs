
const combinations = [
  "AIzaSyD8Y9EPdz6YzIsfwNs7WTLR1gkK8_Ruj_U", // Is / R1
  "AIzaSyD8Y9EPdz6YzlsfwNs7WTLRlgkK8_Ruj_U", // ls / Rl
  "AIzaSyD8Y9EPdz6YzIsfwNs7WTLRlgkK8_Ruj_U", // Is / Rl
  "AIzaSyD8Y9EPdz6YzlsfwNs7WTLR1gkK8_Ruj_U"  // ls / R1
];

async function test(key) {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const data = await response.json();
    return { status: response.status, valid: !data.error, data };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

async function run() {
  for (const key of combinations) {
    console.log(`Testing key: ${key}`);
    const result = await test(key);
    console.log(`Status: ${result.status}, Valid: ${result.valid}`);
    if (result.valid) {
      console.log("SUCCESS! Found valid key.");
    } else {
      console.log(`Error: ${result.data.error.message}`);
    }
    console.log("-------------------");
  }
}

run();
