import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { query, searchResults } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let systemPrompt = `You are Gentza, a helpful AI voice assistant created by Irtza Jutt. You are warm, friendly, and provide helpful responses. Keep your responses conversational and not too long since they will be spoken aloud.`;
    
    let userMessage = query;
    
    // If search results are provided, include them in the context
    if (searchResults) {
      systemPrompt += ` You have access to current search results to help answer questions with up-to-date information.`;
      userMessage = `User question: ${query}\n\nSearch results for context:\n${searchResults}\n\nPlease answer the user's question using the search results when relevant.`;
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 200, // Keep responses concise for voice
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    
    return NextResponse.json({
      content,
      role: 'assistant'
    });

  } catch (error) {
    console.error('Voice Assistant API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Voice Assistant API is running',
    status: 'active'
  });
}