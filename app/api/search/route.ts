export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(JSON.stringify({ error: "Search query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!process.env.SEARCHAPI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "SearchAPI not configured",
          results: [],
          message: "Real-time search is not available. Using general knowledge instead.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    try {
      const searchResponse = await fetch("https://www.searchapi.io/api/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SEARCHAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          engine: "google",
          q: query,
          num: 5, // Limit to 5 results for concise responses
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`SearchAPI error: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()

      // Extract relevant information from search results
      const results =
        searchData.organic_results?.slice(0, 5).map((result: any) => ({
          title: result.title,
          snippet: result.snippet,
          link: result.link,
          source: result.displayed_link || result.link,
        })) || []

      return new Response(
        JSON.stringify({
          query,
          results,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (searchError) {
      console.error("SearchAPI request failed:", searchError)

      return new Response(
        JSON.stringify({
          error: "Search request failed",
          results: [],
          message: "Unable to fetch real-time data. Using general knowledge instead.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Search API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process search request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
