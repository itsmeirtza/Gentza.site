import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json({
      voices: response.data.voices || []
    });

  } catch (error: any) {
    console.error('ElevenLabs Voices API Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch voices', voices: [] }, 
      { status: 500 }
    );
  }
}