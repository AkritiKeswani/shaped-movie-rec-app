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
// CORRECTED order based on actual MovieLens dataset analysis
// Looking at the data: Toy Story should be Animation + Children + Comedy
// The first few columns might be different than expected
const GENRE_NAMES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 
  'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Sci-Fi', 'Musical', 
  'Mystery', 'Romance', 'Horror', 'Thriller', 'War', 'Western'
];

export class MovieLensDataService {
  // Parse genres from u.item format (binary columns)
  static parseGenresFromItemFile(genreString: string): string[] {
    try {
      const parts = genreString.split('|');
      if (parts.length < 23) {
        console.warn('Invalid u.item format:', genreString);
        return ['Unknown'];
      }
      
      const genreBits = parts.slice(5, 23); // Skip first 5 columns (id, title, date, empty, imdb_url)
      const genres: string[] = [];
      
      // Debug: Check the first few movies to understand the structure
      if (parts[0] === '1' || parts[0] === '2' || parts[0] === '3') {
        console.log('🔍 MOVIE DEBUG:', {
          id: parts[0],
          title: parts[1],
          partsLength: parts.length,
          firstFewColumns: parts.slice(0, 10),
          genreBits: genreBits,
          genreNames: GENRE_NAMES
        });
      }
      
      genreBits.forEach((bit, index) => {
        if (bit === '1' && index < GENRE_NAMES.length) {
          genres.push(GENRE_NAMES[index]);
        }
      });
      
      return genres.length > 0 ? genres : ['Unknown'];
    } catch (error) {
      console.error('Error parsing genres:', error);
      return ['Unknown'];
    }
  }

  // Load movies from movies.csv file with clean genre parsing
  static async loadMoviesFromCSV(): Promise<MovieLensMovie[]> {
    try {
      console.log('🔄 Loading movies from movies.csv file...');
      
      const response = await fetch('/movies.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch movies.csv: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      // Skip header row and filter empty lines
      const movies = lines
        .slice(1) // Skip header
        .filter(line => line.trim())
        .map((line, index) => {
          const parts = line.split(',');
          const id = parts[0];
          const title = parts[1];
          const genres = parts[2] ? parts[2].split('|') : ['Unknown'];
          
          if (index < 5) { // Only log first 5 movies for debugging
            console.log(`✅ Movie ${index + 1}: ${title} -> Genres: ${genres.join(', ')}`);
          }
          
          return {
            id,
            title,
            releaseYear: undefined, // movies.csv doesn't have release year
            genres
          };
        });
      
      console.log(`🎯 Successfully loaded ${movies.length} movies from CSV with clean genres`);
      return movies;
    } catch (error) {
      console.error('❌ Error loading movies from CSV:', error);
      // Fallback to u.item if CSV fails
      console.log('🔄 Falling back to u.item file...');
      return this.loadMoviesFromItemFile();
    }
  }

  // Load movies from u.item file with proper genre parsing
  static async loadMoviesFromItemFile(): Promise<MovieLensMovie[]> {
    try {
      console.log('🔄 Loading movies from u.item file...');
      
      // Check if we're in browser or server
      const isServer = typeof window === 'undefined';
      console.log('🌐 Environment:', isServer ? 'Server' : 'Browser');
      
      // Try to fetch u.item
      const response = await fetch('/u.item');
      console.log('📡 Fetch response status:', response.status);
      console.log('📡 Fetch response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch u.item: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log(`📊 u.item content length: ${text.length} characters`);
      console.log(`📊 First 200 characters: ${text.substring(0, 200)}`);
      
      const lines = text.split('\n');
      console.log(`📊 Found ${lines.length} lines in u.item file`);
      
      // Check if we have any content
      if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
        throw new Error('u.item file is empty or has no content');
      }
      
      const movies = lines
        .filter(line => line.trim())
        .map((line, index) => {
          if (index < 5) { // Only log first 5 movies for debugging
            console.log(`🎬 Processing line ${index + 1}: ${line.substring(0, 100)}...`);
          }
          
          const parts = line.split('|');
          const id = parts[0];
          const title = parts[1];
          const releaseDate = parts[2];
          const genres = this.parseGenresFromItemFile(line);
          
          if (index < 5) { // Only log first 5 movies for debugging
            console.log(`✅ Movie ${index + 1}: ${title} -> Genres: ${genres.join(', ')}`);
          }
          
          return {
            id,
            title,
            releaseYear: releaseDate ? new Date(releaseDate).getFullYear() : undefined,
            genres
          };
        });
      
      console.log(`🎯 Successfully loaded ${movies.length} movies with genres`);
      return movies;
    } catch (error) {
      console.error('❌ Error loading movies from u.item:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error'
      });
      return [];
    }
  }

  // Get all available genres
  static getAllGenres(): string[] {
    return ['all', ...GENRE_NAMES];
  }

  // Get movies by genre
  static filterMoviesByGenre(movies: MovieLensMovie[], genre: string): MovieLensMovie[] {
    if (genre === 'all') return movies;
    
    console.log('🎭 filterMoviesByGenre called with:', { genre, totalMovies: movies.length });
    console.log('🎭 Sample movie genres:', movies.slice(0, 3).map(m => ({ title: m.title, genres: m.genres })));
    
    const filtered = movies.filter(movie => {
      const hasGenre = movie.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase());
      if (movies.length <= 10) { // Only log for small datasets
        console.log(`🎭 ${movie.title}: genres [${movie.genres.join(', ')}] - matches ${genre}? ${hasGenre}`);
      }
      return hasGenre;
    });
    
    console.log('🎭 filterMoviesByGenre result:', { genre, filteredCount: filtered.length });
    return filtered;
  }

  // Search movies by title
  static searchMovies(movies: MovieLensMovie[], searchTerm: string): MovieLensMovie[] {
    if (!searchTerm) return movies;
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
