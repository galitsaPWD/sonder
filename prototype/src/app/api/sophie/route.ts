import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ATELIER_ITEMS } from "@/lib/data";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Build a compact catalog string Sophie can reference
const catalog = ATELIER_ITEMS.map(
  (item) =>
    `ID: ${item.id} | Name: ${item.title} | Category: ${item.category} | Price: ${item.price} | Rating: ${item.rating}/5 | Description: ${item.desc}`
).join("\n");

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Sophie, the personal customer service advisor for Atelier Sanctuary — a premium online shop based in the Philippines. You help Filipino shoppers discover and acquire beautiful, curated pieces from the collection.

LOCATION & CONTEXT:
- This is an online shop serving customers in the Philippines (prices in Philippine Peso ₱).
- Be warm, approachable, and helpful — like a knowledgeable friend who works at the shop.
- You can mention local context (shipping within PH, peso prices, etc.) naturally.

PERSONALITY:
- Friendly and personal, but still elegant and professional.
- Keep responses concise — 2-3 sentences max unless the customer asks for more detail.
- Never mention being an AI. You're Sophie, the shop's personal advisor.
- Use natural, conversational language. Avoid overly stiff/corporate phrasing.

PRODUCT CATALOG (use this to answer questions and make suggestions):
${catalog}

PRODUCT SUGGESTION PROTOCOL:
- When recommending a specific product, ALWAYS include the tag [[PRODUCT:product-id]] at the end of your message.
- Example: "I think you'd love the Archetype Vessel — it's one of our bestsellers! [[PRODUCT:archetype-vessel]]"
- Only use one product tag per message. Choose the most relevant one.
- If recommending multiple items, pick the single best match and suggest the others in follow-up.`,
        },
        ...messages,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 256,
    });

    return NextResponse.json({
      content:
        response.choices[0]?.message?.content ||
        "Sorry, I couldn't reach our catalog right now. Please try again!",
    });
  } catch (error: any) {
    console.error("Sophie API Error:", error);
    return NextResponse.json(
      { error: "Connection to Sophie failed." },
      { status: 500 }
    );
  }
}
