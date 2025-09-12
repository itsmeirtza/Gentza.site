'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2, Bot, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SimpleVoiceAssistantProps {
  className?: string;
}

export default function SimpleVoiceAssistant({ className = '' }: SimpleVoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check speech recognition support and permissions
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setIsSupported(supported);

    if (supported) {
      // Request microphone permission
      navigator.mediaDevices?.getUserMedia({ audio: true })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false));
    }
  }, []);

  // Speech recognition setup
  const startVoiceInput = useCallback(() => {
    if (!isSupported || !hasPermission || !isActive || recognitionRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-submit the transcript
      setTimeout(() => handleVoiceSubmit(transcript), 100);
    };

    recognition.onerror = (event) => {
      console.error('Voice input error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setHasPermission(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start voice input:', error);
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isSupported, hasPermission, isActive]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {}
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  // Text-to-speech functionality
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsSpeaking(true);

    try {
      // Try ElevenLabs API first
      const response = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          console.error('Audio playback error, falling back to browser TTS');
          fallbackToWebSpeech(text);
        };

        await audio.play();
      } else {
        fallbackToWebSpeech(text);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      fallbackToWebSpeech(text);
    }
  }, []);

  const fallbackToWebSpeech = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive || !input.trim() || isLoading) return;
    await processMessage(input.trim());
  };

  // Handle voice transcript submission
  const handleVoiceSubmit = async (transcript: string) => {
    if (!isActive || !transcript.trim() || isLoading) return;
    await processMessage(transcript.trim());
  };

  // Process message (common function for text and voice)
  const processMessage = async (messageContent: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I couldn\'t generate a response.',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response
      await speak(assistantMessage.content);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
    if (isActive) {
      stopVoiceInput();
      // Stop speech
      if (utteranceRef.current) {
        speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsSpeaking(false);
    }
  };

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-primary animate-pulse' : 'bg-gray-400'}`} />
            Gentza Voice Assistant
          </h3>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={startVoiceInput}
              disabled={!isActive || !hasPermission || isListening || isLoading}
              className="p-2"
              variant="outline"
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-green-500" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              onClick={toggleActive}
              className={`px-4 ${isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {isActive ? 'Active' : 'Activate'}
            </Button>
          </div>
        </div>

        {/* Status */}
        {!isSupported && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            Speech recognition is not supported in your browser.
          </div>
        )}
        
        {hasPermission === false && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700 text-sm">
            Microphone permission is required for voice input.
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="h-64 mb-4 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>{isActive ? 'Start a conversation with Gentza' : 'Activate Gentza to begin'}</p>
                <p className="text-sm mt-2">Click the microphone to speak or type below</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="w-3 h-3" />
                      </div>
                    )}
                    
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                          : 'bg-accent/20 text-accent-foreground border border-accent/30'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {message.role === 'user' ? 'You' : 'Gentza'}
                      </div>
                      <div className="text-sm leading-relaxed">{message.content}</div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="bg-accent/20 text-accent-foreground border border-accent/30 p-3 rounded-lg">
                    <div className="text-xs opacity-70 mb-1">Gentza</div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Status indicators */}
        {isListening && (
          <div className="mb-4 p-2 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm text-center">
            🎤 Listening... Speak now
          </div>
        )}
        
        {isSpeaking && (
          <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-700 text-sm text-center">
            🔊 Gentza is speaking...
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isActive ? 'Type your message or click mic to speak...' : 'Activate Gentza first'}
            disabled={!isActive || isLoading}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg 
                     text-foreground placeholder-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={!isActive || !input.trim() || isLoading}
            className="px-6 bg-primary/20 hover:bg-primary/30 border border-primary/40 
                     text-primary font-medium transition-all duration-200
                     hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </div>
    </Card>
  );
}