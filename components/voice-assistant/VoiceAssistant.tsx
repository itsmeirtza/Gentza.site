'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, MessageSquare } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/voice/useSpeechRecognition';
import { OpenAIService } from '@/lib/voice/openai';
import { SearchService } from '@/lib/voice/search';
import { TextToSpeechService } from '@/lib/voice/elevenlabs';

interface VoiceAssistantProps {
  className?: string;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceAssistant({ className = '' }: VoiceAssistantProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    transcript,
    isListening,
    isWakeWordDetected,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    wakeWord: 'hello gentza',
    language: 'en-US',
    continuous: true
  });

  // Process user query after wake word detection
  const processQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState('processing');
    setError('');

    try {
      console.log('Processing query:', query);

      // Check if we should search for this query
      const shouldSearch = await OpenAIService.shouldSearch(query);
      let searchResults = '';

      if (shouldSearch) {
        console.log('Searching for:', query);
        const results = await SearchService.search(query);
        searchResults = SearchService.formatSearchResults(results);
      }

      // Generate response using ChatGPT
      const response = await OpenAIService.generateResponse(query, searchResults);
      console.log('Generated response:', response.content);

      setLastResponse(response.content);

      // Convert response to speech
      setState('speaking');
      await TextToSpeechService.speakText(response.content);
      
      setState('idle');
      resetTranscript();
      
      // Restart listening for next wake word
      if (isEnabled) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing query:', error);
      setError('Sorry, I encountered an error processing your request.');
      setState('idle');
      resetTranscript();
    }
  }, [isEnabled, startListening, resetTranscript]);

  // Handle wake word detection and query processing
  useEffect(() => {
    if (isWakeWordDetected && transcript && !transcript.toLowerCase().includes('hello gentza')) {
      processQuery(transcript);
    }
  }, [isWakeWordDetected, transcript, processQuery]);

  // Update state based on speech recognition
  useEffect(() => {
    if (isListening && !isWakeWordDetected) {
      setState('listening');
    } else if (!isListening && state === 'listening') {
      setState('idle');
    }
  }, [isListening, isWakeWordDetected, state]);

  const toggleAssistant = () => {
    if (isEnabled) {
      setIsEnabled(false);
      stopListening();
      setState('idle');
      resetTranscript();
    } else {
      setIsEnabled(true);
      startListening();
      setError('');
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return isWakeWordDetected ? 'Listening to your question...' : 'Say \"Hello Gentza\" to activate';
      case 'processing':
        return 'Processing your request...';
      case 'speaking':
        return 'Gentza is responding...';
      default:
        return isEnabled ? 'Voice assistant is active' : 'Click to activate voice assistant';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className={`w-6 h-6 ${isWakeWordDetected ? 'text-green-500' : 'text-blue-500'}`} />;
      case 'processing':
        return <Loader2 className={"w-6 h-6 text-yellow-500 animate-spin"} />;
      case 'speaking':
        return <Volume2 className={"w-6 h-6 text-purple-500"} />;
      default:
        return isEnabled ? <Mic className={"w-6 h-6 text-green-500"} /> : <MicOff className={"w-6 h-6 text-gray-500"} />;
    }
  };

  return (
    <div className={`voice-assistant ${className}`}>
      {/* Main Control Button */}
      <button
        onClick={toggleAssistant}
        className={`
          relative p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105
          ${isEnabled 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }
          ${state === 'listening' ? 'ring-4 ring-blue-300 animate-pulse' : ''}
          ${state === 'processing' ? 'ring-4 ring-yellow-300' : ''}
          ${state === 'speaking' ? 'ring-4 ring-purple-300' : ''}
        `}
        disabled={state === 'processing' || state === 'speaking'}
      >
        {getIcon()}
        
        {/* Listening indicator */}
        {state === 'listening' && (
          <div className={"absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"} />
        )}
      </button>

      {/* Status Text */}
      <div className={"mt-3 text-center"}>
        <p className={`text-sm font-medium ${
          state === 'listening' && isWakeWordDetected 
            ? 'text-green-600' 
            : state === 'processing' 
            ? 'text-yellow-600'
            : state === 'speaking'
            ? 'text-purple-600'
            : 'text-gray-600'
        }`}>
          {getStateText()}
        </p>

        {/* Current transcript display */}
        {transcript && (
          <p className={"text-xs text-blue-600 mt-1 max-w-xs truncate"}>
            "{transcript}"
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className={"text-xs text-red-500 mt-1 max-w-xs"}>
            {error}
          </p>
        )}
      </div>

      {/* Last Response */}
      {lastResponse && (
        <div className={"mt-4 p-3 bg-gray-50 rounded-lg max-w-sm"}>
          <div className={"flex items-start gap-2"}>
            <MessageSquare className={"w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0"} />
            <p className={"text-xs text-gray-700"}>{lastResponse}</p>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      {!isEnabled && (
        <div className={"mt-4 text-center"}>
          <p className={"text-xs text-gray-500 max-w-xs"}>
            Click to activate, then say "Hello Gentza" followed by your question
          </p>
        </div>
      )}
    </div>
  );
}