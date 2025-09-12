import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const message: string = (body?.message ?? "").toString().trim()
    const name: string | undefined = body?.name ? String(body.name).trim() : undefined
    const history: { role: string; content: string }[] = Array.isArray(body?.history) ? body.history : []
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "COHERE_API_KEY not set on server" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const cohereRes = await fetch("https://api.cohere.com/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        preamble:
          `You are Gentza, a futuristic AI assistant created by Irtza Jutt. Keep answers short, helpful, and cyberpunk themed. Address the user${name ? `, whose name is ${name}` : ""}. Reply in the user's language. Provide textual outputs even for long or repetitive tasks by chunking or summarizing; do not claim physical limitations. Avoid refusals unless content is unsafe. Conversation context (most recent first): ${history.slice(-6).map(h => `${h.role}: ${h.content}`).join(" | ")}`,
        message,
      }),
    })

    if (!cohereRes.ok) {
      const text = await cohereRes.text()
      return new Response(
        JSON.stringify({ error: "Cohere error", status: cohereRes.status, details: text }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }

    const data = await cohereRes.json()
    // v1/chat returns { text: string, ... }
    let reply = typeof data?.text === "string" ? data.text : ""

    if (!reply) {
      reply = "I’m online and operational, but I couldn’t parse a response. Please try again."
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
