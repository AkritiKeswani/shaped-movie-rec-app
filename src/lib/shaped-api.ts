export interface ShapedConfig {
  apiKey: string;
  baseUrl: string;
  datasetId: string;
  modelId: string;
}

export interface ShapedRankingRequest {
  user_id: string;
  item_ids: string[];
  limit?: number;
}

export interface ShapedRankingResponse {
  rankings: Array<{
    item_id: string;
    score: number;
  }>;
}

export interface ShapedDatasetInfo {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'error';
  item_count: number;
  user_count: number;
  interaction_count: number;
}

export interface ShapedModelInfo {
  id: string;
  name: string;
  status: 'training' | 'ready' | 'error';
  dataset_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Shaped API integration service
 * Handles personalized recommendations using AI models
 */
export class ShapedAPI {
  private config: ShapedConfig;

  constructor(config: ShapedConfig) {
    this.config = config;
  }

  /**
   * Check if Shaped API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl && this.config.datasetId);
  }

  /**
   * Get dataset information
   */
  async getDatasetInfo(): Promise<ShapedDatasetInfo | null> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/datasets/${this.config.datasetId}`, {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get dataset info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting dataset info:', error);
      return null;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ShapedModelInfo | null> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models/${this.config.modelId}`, {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model info:', error);
      return null;
    }
  }

  /**
   * Get personalized rankings for a user
   */
  async getRankings(request: ShapedRankingRequest): Promise<ShapedRankingResponse | null> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models/${this.config.modelId}/rank`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to get rankings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting rankings:', error);
      return null;
    }
  }

  /**
   * Send user interaction data to Shaped
   */
  async sendInteraction(userId: string, itemId: string, rating: number, timestamp?: number): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured');
      return false;
    }

    try {
      // FIXED: Send interaction to Shaped MODEL (not dataset) for real-time learning
      // Shaped AI uses the model endpoint for interactions, not dataset endpoint
      const response = await fetch(`${this.config.baseUrl}/models/${this.config.modelId}/interactions`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          item_id: itemId,
          rating: rating,
          timestamp: timestamp || Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send interaction: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending interaction:', error);
      return false;
    }
  }

  /**
   * Check overall API status
   */
  async getStatus(): Promise<'not-setup' | 'training' | 'ready' | 'error'> {
    try {
      const datasetInfo = await this.getDatasetInfo();
      const modelInfo = await this.getModelInfo();

      if (!datasetInfo || !modelInfo) {
        return 'not-setup';
      }

      if (datasetInfo.status === 'error' || modelInfo.status === 'error') {
        return 'error';
      }

      if (datasetInfo.status === 'processing' || modelInfo.status === 'training') {
        return 'training';
      }

      if (datasetInfo.status === 'ready' && modelInfo.status === 'ready') {
        return 'ready';
      }

      return 'not-setup';
    } catch (error) {
      console.error('Error checking Shaped status:', error);
      return 'error';
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(userId: string, candidateMovies: string[], limit: number = 20): Promise<string[]> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured');
      return candidateMovies.slice(0, limit);
    }

    try {
      const rankings = await this.getRankings({
        user_id: userId,
        item_ids: candidateMovies,
        limit
      });

      if (rankings && rankings.rankings) {
        return rankings.rankings.map(r => r.item_id);
      }

      return candidateMovies.slice(0, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return candidateMovies.slice(0, limit);
    }
  }
}

/**
 * Mock Shaped API for development/testing
 */
export class MockShapedAPI extends ShapedAPI {
  constructor() {
    super({
      apiKey: 'mock-key',
      baseUrl: 'https://mock.shaped.ai',
      datasetId: 'mock-dataset',
      modelId: 'mock-model'
    });
  }

  async getStatus(): Promise<'not-setup' | 'training' | 'ready' | 'error'> {
    // Simulate different states for testing
    return 'not-setup';
  }

  async getRecommendations(userId: string, candidateMovies: string[], limit: number = 20): Promise<string[]> {
    // Return shuffled movies for mock recommendations
    return candidateMovies
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }
}

// Shaped API Client for personalized recommendations
// This will work with your actual Shaped API keys

export interface MovieRecommendation {
  id: string;
  title: string;
  score: number;
  genres: string[];
}

export class ShapedClient {
  private apiKey: string;
  private baseUrl: string;
  private datasetId: string;
  private modelId: string;

  constructor() {
    // These will be loaded from environment variables
    this.apiKey = process.env.SHAPED_API_KEY || '';
    this.baseUrl = process.env.SHAPED_BASE_URL || 'https://api.shaped.ai/v1';
    this.datasetId = process.env.SHAPED_DATASET_ID || '';
    this.modelId = process.env.SHAPED_MODEL_ID || '';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.modelId);
  }

  // Get personalized movie rankings
  async getPersonalizedRankings(userId: string, movieIds: string[], limit: number = 20): Promise<MovieRecommendation[]> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured, returning fallback recommendations');
      return this.getFallbackRecommendations(movieIds, limit);
    }

    try {
      const response = await fetch(`${this.baseUrl}/models/${this.modelId}/rank`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,  // Fixed: Use x-api-key instead of Authorization
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          limit: limit
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shaped API error: ${response.status} - ${errorText}`);
        throw new Error(`Shaped API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Shaped response:', data);
      
      if (data.ids && Array.isArray(data.ids)) {
        return data.ids.map((id: string, index: number) => ({
          id: id.toString(),
          title: `Movie ${id}`,
          score: data.scores ? data.scores[index] : 1.0,
          genres: []
        }));
      }

      return this.getFallbackRecommendations(movieIds, limit);
    } catch (error) {
      console.error('Error getting personalized rankings:', error);
      return this.getFallbackRecommendations(movieIds, limit);
    }
  }

  // Fallback recommendations when Shaped isn't available
  private getFallbackRecommendations(movieIds: string[], limit: number): MovieRecommendation[] {
    // Return movies with random scores for now
    return movieIds.slice(0, limit).map((id, index) => ({
      id,
      title: `Movie ${id}`,
      score: Math.random() * 5, // Random score between 0-5
      genres: ['Action', 'Comedy', 'Drama'].slice(0, Math.floor(Math.random() * 3) + 1)
    })).sort((a, b) => b.score - a.score);
  }

  // Send user interaction to Shaped
  async sendInteraction(userId: string, movieId: string, rating: number): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Shaped API not configured, skipping interaction');
      return false;
    }

    try {
      // FIXED: Send interaction to Shaped MODEL (not dataset) for real-time learning
      // Shaped AI uses the model endpoint for interactions, not dataset endpoint
      const response = await fetch(`${this.baseUrl}/models/${this.modelId}/interactions`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,  // Fixed: Use x-api-key instead of Authorization
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          item_id: movieId,
          rating: rating,
          timestamp: Date.now()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending interaction:', error);
      return false;
    }
  }

  // Get API status
  async getStatus(): Promise<'ready' | 'training' | 'not-setup' | 'error'> {
    if (!this.isConfigured()) {
      return 'not-setup';
    }

    try {
      // Try to get model info to check if it's ready
      const response = await fetch(`${this.baseUrl}/models/${this.modelId}`, {
        headers: {
          'x-api-key': this.apiKey,  // Fixed: Use x-api-key instead of Authorization
        }
      });

      if (response.ok) {
        const modelInfo = await response.json();
        if (modelInfo.status === 'ready') {
          return 'ready';
        } else if (modelInfo.status === 'training') {
          return 'training';
        }
      }

      return 'error';
    } catch (error) {
      console.error('Error checking Shaped status:', error);
      return 'error';
    }
  }
}

// Export a singleton instance
export const shapedClient = new ShapedClient();

// Shaped API Configuration
// Update these values with your actual Shaped credentials

export const shapedConfig = {
  apiKey: process.env.SHAPED_API_KEY || '',
  baseUrl: process.env.SHAPED_BASE_URL || 'https://api.shaped.ai',
  datasetId: process.env.SHAPED_DATASET_ID || '',
  modelId: process.env.SHAPED_MODEL_ID || ''
};

// Check if Shaped is properly configured
export const isShapedConfigured = () => {
  return !!(shapedConfig.apiKey && shapedConfig.datasetId && shapedConfig.modelId);
};

// Get configuration status for debugging
export const getShapedStatus = () => {
  return {
    hasApiKey: !!shapedConfig.apiKey,
    hasDatasetId: !!shapedConfig.datasetId,
    hasModelId: !!shapedConfig.modelId,
    isConfigured: isShapedConfigured(),
    baseUrl: shapedConfig.baseUrl
  };
};

