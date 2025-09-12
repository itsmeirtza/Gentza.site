import axios from 'axios';

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

export class SearchService {
  private static readonly BASE_URL = 'https://www.googleapis.com/customsearch/v1';

  static async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey) {
        console.error('Google Search API key not found');
        return [];
      }

      // If no custom search engine ID, we'll use a general web search approach
      const searchUrl = searchEngineId 
        ? `${this.BASE_URL}?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${maxResults}`
        : `${this.BASE_URL}?key=${apiKey}&q=${encodeURIComponent(query)}&num=${maxResults}`;

      const response = await axios.get(searchUrl);

      if (response.data && response.data.items) {
        return response.data.items.map((item: any) => ({
          title: item.title,
          snippet: item.snippet || 'No description available',
          link: item.link
        }));
      }

      return [];
    } catch (error) {
      console.error('Search API Error:', error);
      return [];
    }
  }

  static formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    return results
      .slice(0, 3) // Use top 3 results for context
      .map(result => `${result.title}: ${result.snippet}`)
      .join('\n\n');
  }

  // Alternative search using DuckDuckGo (no API key needed)
  static async searchDuckDuckGo(query: string): Promise<string> {
    try {
      // This is a simplified version - in production you'd want to use a proper API
      const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      
      if (response.data && response.data.Abstract) {
        return response.data.Abstract;
      }

      if (response.data && response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
        const topics = response.data.RelatedTopics.slice(0, 2);
        return topics.map((topic: any) => topic.Text).join(' ');
      }

      return 'No search results found.';
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return 'Search unavailable at the moment.';
    }
  }
}