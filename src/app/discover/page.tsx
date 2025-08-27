'use client';

import { useState, useEffect } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIError } from '@/lib/api';
import { Movie } from '@/types/movie';
import { MovieLensDataService } from '@/lib/movielens-data';

export default function Discover() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [upvotedMovies, setUpvotedMovies] = useState<Set<number>>(new Set());
  const [upvoting, setUpvoting] = useState<Set<number>>(new Set());

  // Load movies from MovieLens data
  useEffect(() => {
    const loadMovies = async () => {
      try {
        // Load movies from u.item file with proper genre parsing
        const moviesFromItemFile = await MovieLensDataService.loadMoviesFromItemFile();
        
        // Transform to match our Movie interface
        const transformedMovies: Movie[] = moviesFromItemFile.map(movie => ({
          id: parseInt(movie.id) || 0,
          title: movie.title,
          releaseDate: movie.releaseYear ? `${movie.releaseYear}` : 'Unknown Date',
          imdbUrl: '',
          genres: movie.genres,
          rating: 0,
          upvotes: 0
        }));

        setMovies(transformedMovies);
        setFilteredMovies(transformedMovies);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading movies:', error);
        setIsLoading(false);
      }
    };
    loadMovies();
  }, []);

  // Load user upvotes from localStorage (fallback)
  useEffect(() => {
    if (user) {
      const savedUpvotes = localStorage.getItem(`movielens_upvotes_${user.uid}`);
      if (savedUpvotes) {
        setUpvotedMovies(new Set(JSON.parse(savedUpvotes)));
      }
    }
  }, [user]);

  // Filter movies based on search and genre
  useEffect(() => {
    let filtered = movies;
    
    if (searchTerm) {
      filtered = MovieLensDataService.searchMovies(filtered, searchTerm);
    }
    
    if (selectedGenre !== 'all') {
      filtered = MovieLensDataService.filterMoviesByGenre(filtered, selectedGenre);
    }
    
    setFilteredMovies(filtered);
  }, [movies, searchTerm, selectedGenre]);

  const handleUpvote = async (movieId: number) => {
    if (!user) {
      return;
    }

    const isCurrentlyUpvoted = upvotedMovies.has(movieId);
    const action = isCurrentlyUpvoted ? 'unupvote' : 'upvote';

    // Optimistic update
    setUpvoting(prev => new Set(prev).add(movieId));

    try {
      // Send interaction to Shaped API for personalization
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          movieId: movieId,
          rating: isCurrentlyUpvoted ? 0 : 5, // 5 = upvote, 0 = remove upvote
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Interaction sent to Shaped:', result);
      }

      // Update local state
      const newUpvotes = new Set(upvotedMovies);
      if (isCurrentlyUpvoted) {
        newUpvotes.delete(movieId);
      } else {
        newUpvotes.add(movieId);
      }
      setUpvotedMovies(newUpvotes);

      // Update movie upvotes count
      setMovies(prev => prev.map(movie => 
        movie.id === movieId 
          ? { ...movie, upvotes: isCurrentlyUpvoted ? Math.max(0, movie.upvotes - 1) : movie.upvotes + 1 }
          : movie
      ));

      // Update localStorage as fallback
      localStorage.setItem(`movielens_upvotes_${user.uid}`, JSON.stringify(Array.from(newUpvotes)));

      // Show success feedback
      if (!isCurrentlyUpvoted) {
        // You could add a toast notification here
        console.log(`Successfully upvoted "${movies.find(m => m.id === movieId)?.title}"`);
      }

    } catch (error) {
      console.error('Upvote error:', error);
      // Revert optimistic update on error
      if (error instanceof APIError && error.status === 401) {
        console.log('User needs to re-authenticate');
      }
    } finally {
      setUpvoting(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  };

  const genres = MovieLensDataService.getAllGenres();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-slate-600 dark:text-slate-300">Loading movies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Discover Amazing Movies
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
            {user ? `Welcome back, ${user.displayName || user.email}!` : 'Sign in to get personalized recommendations'}
          </p>
          {user && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              💡 Upvote movies you like to get personalized recommendations on the &quot;For You&quot; page!
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isUpvoted={upvotedMovies.has(movie.id)}
              onUpvote={() => handleUpvote(movie.id)}
              currentUser={user}
              isLoading={upvoting.has(movie.id)}
              isPersonalized={false}
            />
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No movies found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
