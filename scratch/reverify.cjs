
const key = "AIzaSyD8Y9EPdz6YzIsfwNs7WTLRlgkK8_Ruj_U";

async function test() {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const response = await fetch(URL);
    const data = await response.json();
    console.log("Status:", response.status);
    if (data.models) {
      console.log("SUCCESS! Key is valid.");
    } else {
      console.log("Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
