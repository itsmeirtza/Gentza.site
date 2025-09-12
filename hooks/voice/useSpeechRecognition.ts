import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionOptions {
  wakeWord?: string;
  language?: string;
  continuous?: boolean;
}

interface SpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  isWakeWordDetected: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}): SpeechRecognitionResult => {
  const {
    wakeWord = 'hello',
    language = 'en-US',
    continuous = true
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordDetected, setIsWakeWordDetected] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).toLowerCase().trim();
      setTranscript(fullTranscript);

      // Check for wake word
      if (fullTranscript.includes(wakeWord.toLowerCase()) && !isWakeWordDetected) {
        setIsWakeWordDetected(true);
        console.log('Wake word detected!');
        
        // Clear transcript after wake word detection
        setTimeout(() => {
          setTranscript('');
        }, 500);
      }

      // If wake word detected and there's more speech after wake word
      if (isWakeWordDetected && finalTranscript && !finalTranscript.toLowerCase().includes(wakeWord.toLowerCase())) {
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if we're waiting for wake word
      if (!isWakeWordDetected) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Recognition might already be running
            }
          }
        }, 1000);
      }
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [wakeWord, language, continuous, isWakeWordDetected]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setIsWakeWordDetected(false);
  }, []);

  return {
    transcript,
    isListening,
    isWakeWordDetected,
    startListening,
    stopListening,
    resetTranscript
  };
};