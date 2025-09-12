import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  try {
    const url = "https://ialiwaris.com/irtza.html"
    const res = await fetch(url, { cache: "no-store" })
    const html = await res.text()
    // very basic sanitize: strip script/style tags
    const sanitized = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    return new NextResponse(sanitized, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 })
  }
}