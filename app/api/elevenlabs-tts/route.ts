import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
      // Fallback to browser speech synthesis
      return NextResponse.json(
        { error: 'ElevenLabs API not configured, using fallback' }, 
        { status: 503 }
      );
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('ElevenLabs TTS API Error:', error.response?.data || error.message);
    
    // If ElevenLabs fails, return an error that can trigger fallback
    return NextResponse.json(
      { error: 'Text-to-speech service unavailable' }, 
      { status: 503 }
    );
  }
}