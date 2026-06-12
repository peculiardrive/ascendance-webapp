const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local does not exist!');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    if (line.includes('=')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

loadEnvLocal();

const key = process.env.PAYSTACK_SECRET_KEY;
console.log("Paystack secret key loaded length:", key ? key.length : 0);
if (key) {
  console.log("Starts with sk_test_:", key.startsWith("sk_test_"));
  console.log("Starts with sk_live_:", key.startsWith("sk_live_"));
} else {
  console.log("PAYSTACK_SECRET_KEY is empty.");
}

async function testPaystackConnection() {
  if (!key) {
    console.log("Cannot test connection without a key.");
    return;
  }
  
  try {
    console.log("Fetching transaction list from Paystack (limiting to 1 to verify API key)...");
    const response = await fetch("https://api.paystack.co/transaction?perPage=1", {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response OK:", response.ok);
    console.log("Paystack message:", data.message);
    if (data.status) {
      console.log("Connection Successful! Paystack key is working and valid.");
      console.log("Data sample:", data.data);
    } else {
      console.log("Connection Failed. Message:", data.message);
    }
  } catch(e) {
    console.error("Error connecting to Paystack API:", e);
  }
}

testPaystackConnection();
