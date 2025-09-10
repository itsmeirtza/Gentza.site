export async function POST(req: Request) {
  try {
    const { text, voice = "Rachel" } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        // Validate API key format
        const apiKey = process.env.ELEVENLABS_API_KEY.trim()
        if (!apiKey || apiKey.length < 10) {
          console.error("Invalid ElevenLabs API key format")
          throw new Error("Invalid API key")
        }

        // Use a more reliable voice ID (Rachel's actual ID)
        const voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel voice

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: text.substring(0, 2500), // Limit text length to avoid quota issues
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        })

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          return new Response(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
            },
          })
        } else {
          const errorText = await response.text()
          console.error(`ElevenLabs API error: ${response.status} - ${errorText}`)

          // Handle specific error cases
          if (response.status === 401) {
            console.error("ElevenLabs API key is invalid or expired")
          } else if (response.status === 429) {
            console.error("ElevenLabs rate limit exceeded")
          } else if (response.status === 422) {
            console.error("ElevenLabs request validation failed")
          }
        }
      } catch (error) {
        console.error("ElevenLabs request failed:", error)
      }
    } else {
      console.log("No ElevenLabs API key found, using fallback")
    }

    return new Response(
      JSON.stringify({
        text,
        fallback: true,
        message: process.env.ELEVENLABS_API_KEY
          ? "ElevenLabs unavailable, using browser speech synthesis"
          : "Using browser speech synthesis (no ElevenLabs API key)",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Speech API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process speech request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
