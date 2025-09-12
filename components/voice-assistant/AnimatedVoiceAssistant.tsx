'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2, MessageSquare, Send, Bot, User, Search } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/voice/useSpeechRecognition';
import { OpenAIService } from '@/lib/voice/openai';
import { SearchService } from '@/lib/voice/search';
import { TextToSpeechService } from '@/lib/voice/elevenlabs';

interface VoiceAssistantProps {
  className?: string;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'searching';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isVoice?: boolean;
}

export default function AnimatedVoiceAssistant({ className = '' }: VoiceAssistantProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    isWakeWordDetected,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    wakeWord: 'hello',
    language: 'en-US',
    continuous: true
  });

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Add message to conversation
  const addMessage = useCallback((text: string, type: 'user' | 'assistant', isVoice = false) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
      isVoice
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Process user query with enhanced conversation
  const processQuery = useCallback(async (query: string, isVoice = true) => {
    if (!query.trim()) return;

    // Add user message
    addMessage(query, 'user', isVoice);
    
    setState('processing');
    setError('');
    setIsTyping(true);

    try {
      console.log('Processing query:', query);

      // Check if we should search for this query
      const shouldSearch = await OpenAIService.shouldSearch(query);
      let searchResults = '';

      if (shouldSearch) {
        setState('searching');
        console.log('Searching for:', query);
        const results = await SearchService.search(query);
        searchResults = SearchService.formatSearchResults(results);
      }

      setState('processing');
      
      // Generate response using ChatGPT with conversation context
      const conversationContext = messages.slice(-4).map(msg => 
        `${msg.type}: ${msg.text}`
      ).join('\n');
      
      const contextualQuery = conversationContext 
        ? `Previous conversation:\n${conversationContext}\n\nCurrent question: ${query}`
        : query;

      const response = await OpenAIService.generateResponse(contextualQuery, searchResults);
      console.log('Generated response:', response.content);

      setIsTyping(false);
      addMessage(response.content, 'assistant', false);

      // Convert response to speech if it's a voice interaction
      if (isVoice) {
        setState('speaking');
        await TextToSpeechService.speakText(response.content);
      }
      
      setState('idle');
      resetTranscript();
      
      // Generate follow-up question occasionally
      if (Math.random() > 0.7 && isVoice) {
        setTimeout(async () => {
          const followUpQuestions = [
            "Is there anything else you'd like to know about this topic?",
            "Would you like me to search for more information?",
            "Do you have any other questions?",
            "Is this helpful? What else can I help you with?"
          ];
          
          const followUp = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
          addMessage(followUp, 'assistant', false);
          await TextToSpeechService.speakText(followUp);
          
          // Restart listening for next interaction
          if (isEnabled) {
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        }, 2000);
      } else if (isEnabled && isVoice) {
        // Restart listening for next wake word
        setTimeout(() => {
          startListening();
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing query:', error);
      setError('Sorry, I encountered an error processing your request.');
      setIsTyping(false);
      setState('idle');
      resetTranscript();
    }
  }, [messages, isEnabled, startListening, resetTranscript, addMessage]);

  // Handle wake word detection
  useEffect(() => {
    if (isWakeWordDetected && transcript && !transcript.toLowerCase().includes('hello')) {
      if (!isExpanded) setIsExpanded(true);
      processQuery(transcript, true);
    }
  }, [isWakeWordDetected, transcript, processQuery, isExpanded]);

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
      // Show welcome message
      if (messages.length === 0) {
        addMessage("Hi! I'm Gentza, your AI voice assistant. Say 'Hello' followed by your question, or click to expand and type.", 'assistant');
      }
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return isWakeWordDetected ? 'Listening to your question...' : 'Say "Hello" to activate';
      case 'processing':
        return 'Thinking...';
      case 'searching':
        return 'Searching the web...';
      case 'speaking':
        return 'Speaking...';
      default:
        return isEnabled ? 'Voice assistant active' : 'Click to activate';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className={`w-5 h-5 ${isWakeWordDetected ? 'text-green-400' : 'text-blue-400'}`} />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'searching':
        return <Search className="w-5 h-5 text-purple-400 animate-pulse" />;
      case 'speaking':
        return <Volume2 className="w-5 h-5 text-green-400" />;
      default:
        return isEnabled ? <Bot className="w-5 h-5 text-primary" /> : <MicOff className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`voice-assistant-container ${className}`}>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl
          transition-all duration-300 hover:scale-110 z-50
          ${isEnabled 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/30' 
            : 'bg-gray-800/90 backdrop-blur-sm text-gray-300 hover:bg-gray-700/90'
          }
          ${state === 'listening' ? 'ring-4 ring-blue-400/50 animate-pulse' : ''}
          ${state === 'processing' || state === 'searching' ? 'ring-4 ring-yellow-400/50' : ''}
          ${state === 'speaking' ? 'ring-4 ring-green-400/50' : ''}
        `}
      >
        {getStateIcon()}
        
        {/* Status indicator dots */}
        {state === 'listening' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />
        )}
        {state === 'processing' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Expanded Chat Interface */}
      {isExpanded && (
        <div className={`
          fixed bottom-24 right-6 w-[500px] h-[600px] bg-black/95 backdrop-blur-xl
          rounded-2xl shadow-2xl border border-gray-700/50
          transition-all duration-300 z-40 overflow-hidden
          ${isExpanded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                <h3 className="text-white font-medium">Gentza AI Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAssistant}
                  className={`p-2 rounded-lg transition-colors ${
                    isEnabled ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                  }`}
                  title={isEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {isEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg bg-gray-600/20 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Status bar */}
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
              {getStateIcon()}
              <span>{getStateText()}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[440px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  ${message.type === 'assistant' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'bg-gray-600 text-gray-200'
                  }
                `}>
                  {message.type === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                
                <div className={`
                  max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed
                  ${message.type === 'assistant'
                    ? 'bg-gray-800/80 text-gray-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-sm'
                  }
                  ${message.isVoice ? 'border border-green-500/30' : ''}
                `}>
                  {message.text}
                  {message.isVoice && (
                    <div className="mt-1 text-xs opacity-60 flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      Voice
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800/80 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Current transcript display */}
          {transcript && isWakeWordDetected && (
            <div className="px-4 py-2 bg-blue-900/20 border-t border-gray-700/50">
              <div className="text-xs text-blue-400 flex items-center gap-2">
                <Mic className="w-3 h-3" />
                <span>Listening: "{transcript}"</span>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="px-4 py-2 bg-red-900/20 border-t border-red-700/50">
              <div className="text-xs text-red-400">{error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}