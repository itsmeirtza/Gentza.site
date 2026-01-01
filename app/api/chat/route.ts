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

    const apiKey = process.env.OPENROUTER_API_KEY || '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'
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured. Please set OPENROUTER_API_KEY environment variable." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const messages = [
      {
        role: "system",
        content: `You are Gentza, a futuristic AI assistant created by Irtza Jutt. Keep answers helpful, friendly, and conversational. Address the user${name ? `, whose name is ${name}` : ""}. Reply in the user's language. Be natural and engaging.`
      },
      ...history.slice(-10).map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://gentza.site',
        'X-Title': 'Gentza AI Assistant'
      },
      body: JSON.stringify({
        model: "openai/gpt-4-turbo",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorText = await response.text().catch(() => '')
      console.error('OpenRouter API Error:', response.status, errorData, errorText)
      
      return new Response(
        JSON.stringify({ error: errorData?.error?.message || errorText || `API request failed with status ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } },
      )
    }

    const data = await response.json()
    const reply = data?.choices?.[0]?.message?.content || ""

    if (!reply) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI model. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }
    
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    })
      
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    const errorMessage = error?.message || error?.error?.message || "Failed to process chat request. Please try again."
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
