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
      // Intelligent fallback responses based on user input
      const lowerMessage = message.toLowerCase()
      let response = ""
      
      if (lowerMessage.includes("html") || lowerMessage.includes("website")) {
        response = `${name ? `${name}, ` : ""}I can help you with HTML! Here's a simple "Hello World" website:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My Simple Website</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Welcome to my simple website.</p>
</body>
</html>
\`\`\`

Save this as .html file and open in browser! 🌐`
      } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("salam")) {
        const greetings = [
          `Hey${name ? ` ${name}` : ""}! I'm Gentza, your cyberpunk AI by Irtza Jutt. How can I help? 💫`,
          `Hello${name ? ` ${name}` : ""}! Gentza here, created by Irtza Jutt. What can I do for you? 🤖`,
          `Hi${name ? ` ${name}` : ""}! Systems online. I'm Gentza by Irtza Jutt. Ready to assist! ⚡`
        ]
        response = greetings[Math.floor(Math.random() * greetings.length)]
      } else if (lowerMessage.includes("code") || lowerMessage.includes("programming")) {
        response = `${name ? `${name}, ` : ""}I'm great with coding! I can help with HTML, CSS, JavaScript, Python, and more. What programming help do you need? 💻`
      } else {
        response = `${name ? `${name}, ` : ""}I'm Gentza, your AI assistant created by Irtza Jutt. I can help with coding, websites, questions, and more! What would you like to know? 🚀`
      }
      
      return new Response(
        JSON.stringify({ reply: response }),
        { status: 200, headers: { "Content-Type": "application/json" } },
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
      // Intelligent backup responses when API fails
      const lowerMessage = message.toLowerCase()
      let response = ""
      
      if (lowerMessage.includes("html") || lowerMessage.includes("website")) {
        response = `${name ? `${name}, ` : ""}Network lag but I got you! Here's your simple HTML website:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Welcome to my simple website by ${name || "Anonymous"}</p>
</body>
</html>
\`\`\`

Save as .html and enjoy! 🌐 - Gentza`
      } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("salam")) {
        response = `Hey${name ? ` ${name}` : ""}! Connection issues but I'm here! I'm Gentza by Irtza Jutt. How can I help? 💫`
      } else {
        response = `${name ? `${name}, ` : ""}Network unstable but I'm operational! I'm Gentza, created by Irtza Jutt. What do you need help with? ⚡`
      }
      
      return new Response(
        JSON.stringify({ reply: response }),
        { status: 200, headers: { "Content-Type": "application/json" } },
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
