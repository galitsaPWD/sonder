const { Groq } = require("groq-sdk");
require("dotenv").config({ path: ".env.local" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
  console.log("🏺 Initiating Archival Connection Test...");
  console.log("Checking API Key Presence:", process.env.GROQ_API_KEY ? "REGISTERED (gsk_...)" : "MISSING");
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello, Sophie." }],
      model: "llama-3.3-70b-specdec",
    });
    console.log("✅ Sovereign Connection Established!");
    console.log("Sophie's Response:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ Archival Connection Failed!");
    console.error("Error Details:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Body:", JSON.stringify(await error.response.json(), null, 2));
    }
  }
}

testGroq();
