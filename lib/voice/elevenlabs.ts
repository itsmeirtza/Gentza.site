import axios from 'axios';

export class TextToSpeechService {
  static async synthesizeSpeech(text: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB'): Promise<ArrayBuffer | null> {
    try {
      // Use API route instead of direct client
      const response = await axios.post('/api/elevenlabs-tts', {
        text,
        voiceId
      }, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('ElevenLabs TTS Error:', error);
      return null;
    }
  }

  static async playAudio(audioArrayBuffer: ArrayBuffer): Promise<void> {
    try {
      const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      throw error;
    }
  }

  static async speakText(text: string): Promise<void> {
    try {
      const audioBuffer = await this.synthesizeSpeech(text);
      if (audioBuffer) {
        await this.playAudio(audioBuffer);
      } else {
        // Fallback to browser's built-in speech synthesis
        this.fallbackSpeak(text);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Fallback to browser's built-in speech synthesis
      this.fallbackSpeak(text);
    }
  }

  // Fallback using browser's built-in Speech Synthesis API
  static fallbackSpeak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported');
    }
  }

  // Get available ElevenLabs voices
  static async getVoices(): Promise<any[]> {
    try {
      const response = await axios.get('/api/elevenlabs-voices');
      return response.data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}