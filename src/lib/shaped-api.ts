const SHAPED_API_KEY = process.env.SHAPED_API_KEY;
const SHAPED_BASE_URL = process.env.SHAPED_BASE_URL;
const SHAPED_MODEL_ID = process.env.SHAPED_MODEL_ID;

export interface MovieRecommendation {
  id: string;
  score: number;
  metadata?: {
    title?: string;
    genre?: string;
  };
}

export interface ShapedRankRequest {
  query: string;
  top_k?: number;
  user_id?: string;
}

export class ShapedAPI {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${SHAPED_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHAPED_API_KEY!,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shaped API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getRecommendations(userId: string, topK: number = 20): Promise<MovieRecommendation[]> {
    try {
      const response = await this.makeRequest(`/models/${SHAPED_MODEL_ID}/rank`, {
        method: 'POST',
        body: JSON.stringify({
          query: userId,
          top_k: topK,
          user_id: userId,
        }),
      });

      return response.results || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  static async getPopularMovies(topK: number = 20): Promise<MovieRecommendation[]> {
    try {
      const response = await this.makeRequest(`/models/${SHAPED_MODEL_ID}/rank`, {
        method: 'POST',
        body: JSON.stringify({
          query: 'popular',
          top_k: topK,
        }),
      });

      return response.results || [];
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  }
}
