export interface MovieLensMovie {
  id: string;
  title: string;
  releaseYear?: number;
  genres: string[];
}

export interface MovieRating {
  userId: string;
  movieId: string;
  rating: number;
  timestamp: string;
}

// MovieLens genre mapping based on u.item file format
const GENRE_NAMES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 
  'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical', 
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

export class MovieLensDataService {
  // Parse genres from u.item format (binary columns)
  static parseGenresFromItemFile(genreString: string): string[] {
    const genreBits = genreString.split('|').slice(5, 23); // Skip first 5 columns (id, title, date, empty, imdb_url)
    const genres: string[] = [];
    
    genreBits.forEach((bit, index) => {
      if (bit === '1' && index < GENRE_NAMES.length) {
        genres.push(GENRE_NAMES[index]);
      }
    });
    
    return genres.length > 0 ? genres : ['Unknown'];
  }

  // Load movies from u.item file with proper genre parsing
  static async loadMoviesFromItemFile(): Promise<MovieLensMovie[]> {
    try {
      const response = await fetch('/u.item');
      const text = await response.text();
      const lines = text.split('\n');
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split('|');
          const id = parts[0];
          const title = parts[1];
          const releaseDate = parts[2];
          const genres = this.parseGenresFromItemFile(line);
          
          return {
            id,
            title,
            releaseYear: releaseDate ? new Date(releaseDate).getFullYear() : undefined,
            genres
          };
        });
    } catch (error) {
      console.error('Error loading movies from u.item:', error);
      return [];
    }
  }

  // Get all available genres
  static getAllGenres(): string[] {
    return ['all', ...GENRE_NAMES];
  }

  // Get movies by genre
  static filterMoviesByGenre(movies: any[], genre: string): any[] {
    if (genre === 'all') return movies;
    return movies.filter(movie => 
      movie.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase())
    );
  }

  // Search movies by title
  static searchMovies(movies: any[], searchTerm: string): any[] {
    if (!searchTerm) return movies;
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
