
const key = "AIzaSyD8Y9EPdz6YzIsfwNs7WTLRlgkK8_Ruj_U";

async function test() {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const response = await fetch(URL);
    const data = await response.json();
    if (data.models) {
      const names = data.models.map(m => m.name);
      console.log("Model names found:", JSON.stringify(names, null, 2));
    } else {
      console.log("Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
