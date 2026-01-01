import type { NextRequest } from "next/server"
import OpenAI from 'openai'

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

    // OpenRouter API Key - can be set via environment variable or use the provided key
    const apiKey = process.env.OPENROUTER_API_KEY || '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'
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
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

    try {
      // OpenRouter uses OpenAI-compatible API with custom base URL
      const openai = new OpenAI({ 
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://gentza.site',
          'X-Title': 'Gentza AI Assistant'
        }
      });
      
      const messages = [
        {
          role: "system" as const,
          content: `You are Gentza, a futuristic AI assistant created by Irtza Jutt. Keep answers short, helpful, and friendly. Address the user${name ? `, whose name is ${name}` : ""}. Reply in the user's language. Be conversational and helpful.`
        },
        ...history.slice(-6).map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content
        })),
        {
          role: "user" as const,
          content: message
        }
      ];

      // Using a good default model from OpenRouter - you can change this to any model you prefer
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4-turbo",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });
      
      let reply = completion.choices[0]?.message?.content || ""

      if (!reply) {
        reply = "I'm online and operational, but I couldn't generate a response. Please try again."
      }
      
      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" },
      })
      
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);

      // Fallback responses when OpenAI API fails
      const lowerMessage = message.toLowerCase()
      let response = ""
      
      if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("salam") || lowerMessage.includes("hwlo")) {
        response = `Hey${name ? ` ${name}` : ""}! I'm Gentza, your AI assistant by Irtza Jutt. How can I help you today? 💫`
      } else if (lowerMessage.includes("html") || lowerMessage.includes("website")) {
        response = `${name ? `${name}, ` : ""}I can help you with HTML! Here's a simple website:

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
    <p>Welcome to my website by ${name || "Anonymous"}</p>
</body>
</html>
\`\`\`

Save as .html and enjoy! 🌐`
      } else if (lowerMessage.includes("code") || lowerMessage.includes("programming")) {
        response = `${name ? `${name}, ` : ""}I'm great with coding! I can help with HTML, CSS, JavaScript, Python, and more. What programming help do you need? 💻`
      } else {
        response = `${name ? `${name}, ` : ""}I'm Gentza, your AI assistant created by Irtza Jutt. I can help with coding, questions, and more! What would you like to know? 🚀`
      }
      
      return new Response(
        JSON.stringify({ reply: response }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
