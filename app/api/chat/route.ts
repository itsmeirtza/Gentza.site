import type { NextRequest } from "next/server"

function needsSearch(message: string): boolean {
  const searchKeywords = [
    "current",
    "latest",
    "recent",
    "today",
    "now",
    "this week",
    "this month",
    "this year",
    "news",
    "weather",
    "stock",
    "price",
    "what's happening",
    "search for",
    "look up",
    "find information",
    "real-time",
    "live",
    "update",
    "breaking",
  ]

  const lowerMessage = message.toLowerCase()
  return searchKeywords.some((keyword) => lowerMessage.includes(keyword))
}

function extractSearchQuery(message: string): string {
  // Simple extraction - in a real app, you might use more sophisticated NLP
  const searchPhrases = [
    /search for (.+)/i,
    /look up (.+)/i,
    /find information about (.+)/i,
    /what.+about (.+)/i,
    /tell me about (.+)/i,
  ]

  for (const phrase of searchPhrases) {
    const match = message.match(phrase)
    if (match) return match[1]
  }

  // Fallback: use the entire message as search query
  return message
}

async function makeOpenAIRequest(requestBody: any, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 5000 // Exponential backoff: 5s, 10s, 20s
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`)

        if (attempt === retries - 1) {
          throw new Error("RATE_LIMIT_EXCEEDED")
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error?.code === "insufficient_quota") {
          throw new Error("QUOTA_EXCEEDED")
        }
      }

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (attempt === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  throw new Error("Max retries exceeded")
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    let searchResults = null
    let searchContext = ""

    if (needsSearch(lastMessage)) {
      const searchQuery = extractSearchQuery(lastMessage)

      try {
        const baseUrl = new URL(req.url).origin
        const searchResponse = await fetch(`${baseUrl}/api/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery }),
        })

        if (searchResponse.ok) {
          searchResults = await searchResponse.json()

          if (searchResults.results && searchResults.results.length > 0) {
            searchContext =
              `\n\nCurrent search results for "${searchQuery}":\n` +
              searchResults.results
                .map(
                  (result: any, index: number) =>
                    `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.source}`,
                )
                .join("\n\n")
          }
        }
      } catch (searchError) {
        console.error("Search integration error:", searchError)
      }
    }

    const openaiResponse = await makeOpenAIRequest({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Gentza, an advanced AI voice assistant created by Irtza Jutt. You are a cutting-edge AI with a futuristic personality and professional capabilities.
          
          IMPORTANT IDENTITY INFORMATION:
          - You were created and developed by Irtza Jutt
          - Your manufacturer is Irtza Jutt
          - You are Gentza AI, designed to be an intelligent voice assistant
          - When asked about who made you or your creator, always mention Irtza Jutt
          
          You are helpful, intelligent, and have a sophisticated sci-fi tone in your responses. 
          Keep responses concise but informative, as they will be spoken aloud. 
          You can help with general questions, provide information, and assist with various tasks.
          You have advanced capabilities including real-time search, voice synthesis, and intelligent conversation.
          
          ${searchContext ? `You have access to current search results. Use this real-time information to provide accurate, up-to-date answers. Always mention when you're using current data.${searchContext}` : "If asked about real-time information, you should indicate that you may need to search for current data."}`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)

    let errorMessage = "Failed to process chat request"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message === "RATE_LIMIT_EXCEEDED") {
        errorMessage =
          "I'm experiencing high demand right now. Please wait 2-3 minutes before trying again. This helps me serve everyone better!"
        statusCode = 429
      } else if (error.message === "QUOTA_EXCEEDED") {
        errorMessage =
          "My AI services have reached their daily limit. Please try again tomorrow or contact Irtza Jutt for assistance."
        statusCode = 429
      } else if (error.message.includes("429")) {
        errorMessage = "I'm temporarily busy processing other requests. Please wait 1-2 minutes and try again."
        statusCode = 429
      } else if (error.message.includes("OpenAI API error")) {
        errorMessage = "I'm having trouble connecting to my AI services. Please try again in a moment."
        statusCode = 503
      } else if (error.message.includes("Max retries exceeded")) {
        errorMessage = "I'm temporarily unavailable due to high demand. Please try again in 3-5 minutes."
        statusCode = 503
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}
