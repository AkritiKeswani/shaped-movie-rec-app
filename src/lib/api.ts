export class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'APIError';
  }
}

class API {
  async upvote(movieId: number, action: 'upvote' | 'unupvote'): Promise<void> {
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movieId.toString(),
          action,
          userId: 'demo-user' // This will be replaced with real user ID
        })
      });

      if (!response.ok) {
        throw new APIError(`Failed to ${action} movie`, response.status);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error', 0);
    }
  }

  async getRecommendations(limit: number = 20): Promise<any> {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          movieIds: Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
          limit
        })
      });

      if (!response.ok) {
        throw new APIError('Failed to get recommendations', response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error', 0);
    }
  }

  async getStatus(): Promise<'not-setup' | 'training' | 'ready' | 'error'> {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
      return 'error';
    } catch (error) {
      return 'error';
    }
  }
}

export const api = new API();
