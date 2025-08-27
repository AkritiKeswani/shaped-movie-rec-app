'use client';

import { useState, useEffect } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { Movie } from '@/types/movie';
import { MovieLensDataService } from '@/lib/movielens-data';

export default function ForYou() {
  const { user } = useAuth();
  const [allMovies, setAllMovies] = useState<Movie[]>([]); // Original full dataset
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]); // Movies to show (personalized + filtered)
  const [personalizedMovieIds, setPersonalizedMovieIds] = useState<Set<number>>(new Set()); // Track personalized movie IDs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [upvotedMovies, setUpvotedMovies] = useState<Set<number>>(new Set());
  const [upvoting, setUpvoting] = useState<Set<number>>(new Set());

  // Load movies and get personalized recommendations
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

        // Always keep the original full dataset
        setAllMovies(transformedMovies);

        if (user) {
          // Get personalized recommendations from Shaped API
          try {
            const recResponse = await fetch('/api/recommendations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.uid,
                limit: 50
              })
            });

            if (recResponse.ok) {
              const recData = await recResponse.json();
              console.log('Shaped recommendations:', recData);
              
              if (recData.success && recData.recommendations && recData.recommendations.length > 0) {
                // Reorder movies based on Shaped recommendations
                const recommendedIds = new Set(recData.recommendations.map((r: any) => parseInt(r.item_id)));
                console.log('Shaped recommended IDs:', Array.from(recommendedIds));
                
                // Store the personalized movie IDs for display
                setPersonalizedMovieIds(new Set(Array.from(recommendedIds).map(id => Number(id))));
                
                // Find movies that match the recommended IDs
                const recommendedMovies = transformedMovies.filter(m => recommendedIds.has(m.id));
                const otherMovies = transformedMovies.filter(m => !recommendedIds.has(m.id));
                
                console.log(`Found ${recommendedMovies.length} recommended movies:`, recommendedMovies.map(m => ({ id: m.id, title: m.title })));
                console.log(`Other movies: ${otherMovies.length}`);
                
                // Show recommended movies first, then others
                setDisplayMovies([...recommendedMovies, ...otherMovies]);
                console.log(`Personalized: ${recommendedMovies.length} recommended, ${otherMovies.length} other movies`);
              } else {
                console.log('No personalized recommendations, showing all movies');
                setPersonalizedMovieIds(new Set());
                setDisplayMovies(transformedMovies);
              }
            } else {
              console.log('Recommendations API error, showing all movies');
              setDisplayMovies(transformedMovies);
            }
          } catch (error) {
            console.error('Error getting recommendations:', error);
            setDisplayMovies(transformedMovies);
          }
        } else {
          setDisplayMovies(transformedMovies);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading movies:', error);
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [user]);

  // Load user upvotes from localStorage
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
    let filtered = allMovies; // Always filter from the original full dataset
    
    // Debug logging
    console.log('Filtering movies:', {
      totalMovies: allMovies.length,
      searchTerm,
      selectedGenre,
      sampleGenres: allMovies.slice(0, 3).map(m => m.genres)
    });
    
    if (searchTerm) {
      filtered = MovieLensDataService.searchMovies(filtered, searchTerm);
    }
    
    if (selectedGenre !== 'all') {
      filtered = MovieLensDataService.filterMoviesByGenre(filtered, selectedGenre);
    }
    
    console.log('Filtered results:', {
      filteredCount: filtered.length,
      selectedGenre,
      sampleFiltered: filtered.slice(0, 3).map(m => ({ title: m.title, genres: m.genres }))
    });
    
    setDisplayMovies(filtered);
  }, [allMovies, searchTerm, selectedGenre]);

  const handleUpvote = async (movieId: number) => {
    if (!user) {
      return;
    }

    const isCurrentlyUpvoted = upvotedMovies.has(movieId);

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

      // Update movie upvotes count in both lists
      setAllMovies(prev => prev.map(movie => 
        movie.id === movieId 
          ? { ...movie, upvotes: isCurrentlyUpvoted ? Math.max(0, movie.upvotes - 1) : movie.upvotes + 1 }
          : movie
      ));

      // Update localStorage
      localStorage.setItem(`movielens_upvotes_${user.uid}`, JSON.stringify(Array.from(newUpvotes)));

    } catch (error) {
      console.error('Upvote error:', error);
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
            For You
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
            {user ? `Personalized recommendations for ${user.displayName || user.email}` : 'Sign in to see your recommendations'}
          </p>
          
          {/* Personalization Status */}
          {user && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 bg-green-100 text-green-800">
              🎯 AI-Powered Personalization Active
            </div>
          )}
          
          {/* Personalized Recommendations Summary */}
          {user && personalizedMovieIds.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                ✨ Found <strong>{personalizedMovieIds.size}</strong> personalized recommendations based on your upvotes!
              </p>
            </div>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            💡 Movies are ranked based on your upvotes and preferences from the Discovery page!
          </p>
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
          {displayMovies.slice(0, 50).map((movie, index) => {
            // Check if this movie is in the personalized recommendations
            const isPersonalized = personalizedMovieIds.has(movie.id);
            
            return (
              <MovieCard
                key={movie.id}
                movie={movie}
                isUpvoted={upvotedMovies.has(movie.id)}
                onUpvote={() => handleUpvote(movie.id)}
                currentUser={user}
                isLoading={upvoting.has(movie.id)}
                isPersonalized={isPersonalized}
              />
            );
          })}
        </div>

        {displayMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No movies found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
