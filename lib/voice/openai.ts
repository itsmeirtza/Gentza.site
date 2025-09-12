import axios from 'axios';

export interface ChatResponse {
  content: string;
  role: 'assistant';
}

export class OpenAIService {
  static async generateResponse(userQuery: string, searchResults?: string): Promise<ChatResponse> {
    try {
      const response = await axios.post('/api/voice-assistant', {
        query: userQuery,
        searchResults
      });

      return response.data;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        role: 'assistant'
      };
    }
  }

  static async shouldSearch(userQuery: string): Promise<boolean> {
    // Simple keyword detection to determine if we should search
    const searchKeywords = [
      'what is', 'who is', 'when did', 'where is', 'how to',
      'latest', 'recent', 'current', 'news', 'weather',
      'price', 'stock', 'today', 'now', 'happening'
    ];

    const query = userQuery.toLowerCase();
    return searchKeywords.some(keyword => query.includes(keyword));
  }
}