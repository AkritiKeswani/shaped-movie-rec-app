export interface Movie {
  id: number;
  title: string;
  releaseDate: string;
  imdbUrl: string;
  genres: string[];
  rating: number;
  upvotes: number;
  // Hybrid reranking properties
  score?: number;           // Base score from Shaped AI
  blendedScore?: number;    // Combined score with upvote/genre boosts
  upvoteBoost?: number;     // Boost from user upvotes
  genreBoost?: number;      // Boost from genre affinity
}
