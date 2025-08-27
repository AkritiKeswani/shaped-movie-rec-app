export interface Movie {
  id: string;
  title: string;
  releaseYear?: number;
  genres: string[];
}

export interface MovieRating {
  userId: string;
  movieId: string;
  rating: number;
  timestamp: number;
}

export class MovieLensDataService {
  private static movies: Movie[] = [];
  private static ratings: MovieRating[] = [];

  static async loadMovies(): Promise<Movie[]> {
    if (this.movies.length > 0) {
      return this.movies;
    }

    try {
      const response = await fetch('/movies.csv');
      const csvText = await response.text();
      
      this.movies = this.parseMoviesCSV(csvText);
      return this.movies;
    } catch (error) {
      console.error('Error loading movies:', error);
      return [];
    }
  }

  static async loadRatings(): Promise<MovieRating[]> {
    if (this.ratings.length > 0) {
      return this.ratings;
    }

    try {
      const response = await fetch('/u.data');
      const dataText = await response.text();
      
      this.ratings = this.parseRatingsData(dataText);
      return this.ratings;
    } catch (error) {
      console.error('Error loading ratings:', error);
      return [];
    }
  }

  private static parseMoviesCSV(csvText: string): Movie[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    const movies: Movie[] = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i];
      const parts = line.split(',');
      
      if (parts.length >= 3) {
        const id = parts[0];
        const titleWithYear = parts[1];
        const genres = parts[2].split('|');

        // Extract year from title (format: "Movie Title (Year)")
        const yearMatch = titleWithYear.match(/\((\d{4})\)/);
        const releaseYear = yearMatch ? parseInt(yearMatch[1]) : undefined;
        const title = titleWithYear.replace(/\(\d{4}\)/, '').trim();

        movies.push({
          id,
          title,
          releaseYear,
          genres: genres.filter(g => g.trim() !== '(no genres listed)'),
        });
      }
    }

    return movies;
  }

  private static parseRatingsData(dataText: string): MovieRating[] {
    const lines = dataText.split('\n').filter(line => line.trim());
    const ratings: MovieRating[] = [];

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 4) {
        ratings.push({
          userId: parts[0],
          movieId: parts[1],
          rating: parseInt(parts[2]),
          timestamp: parseInt(parts[3]),
        });
      }
    }

    return ratings;
  }

  static async getMovieById(id: string): Promise<Movie | null> {
    const movies = await this.loadMovies();
    return movies.find(movie => movie.id === id) || null;
  }

  static async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const movies = await this.loadMovies();
    return movies.filter(movie => movie.genres.includes(genre));
  }

  static async getPopularMovies(limit: number = 20): Promise<Movie[]> {
    const ratings = await this.loadRatings();
    const movies = await this.loadMovies();
    
    // Count ratings per movie
    const movieRatingCounts = new Map<string, number>();
    ratings.forEach(rating => {
      const count = movieRatingCounts.get(rating.movieId) || 0;
      movieRatingCounts.set(rating.movieId, count + 1);
    });

    // Sort by rating count and return top movies
    const sortedMovies = movies
      .filter(movie => movieRatingCounts.has(movie.id))
      .sort((a, b) => {
        const countA = movieRatingCounts.get(a.id) || 0;
        const countB = movieRatingCounts.get(b.id) || 0;
        return countB - countA;
      });

    return sortedMovies.slice(0, limit);
  }

  static async searchMovies(query: string): Promise<Movie[]> {
    const movies = await this.loadMovies();
    const lowercaseQuery = query.toLowerCase();
    
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(lowercaseQuery) ||
      movie.genres.some(genre => genre.toLowerCase().includes(lowercaseQuery))
    );
  }
}
