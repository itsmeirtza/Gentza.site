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

    const apiKey = process.env.OPENROUTER_API_KEY || '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'
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured. Please set OPENROUTER_API_KEY environment variable." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

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
        content: `You are Gentza, a futuristic AI assistant created by Irtza Jutt. Keep answers helpful, friendly, and conversational. Address the user${name ? `, whose name is ${name}` : ""}. Reply in the user's language. Be natural and engaging.`
      },
      ...history.slice(-10).map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content
      })),
      {
        role: "user" as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const reply = completion.choices[0]?.message?.content || ""

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
