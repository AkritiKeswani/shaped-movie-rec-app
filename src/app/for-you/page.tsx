'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hybrid reranker: blend Shaped scores with upvote boosts for instant UX
  const reRankMoviesByUpvotes = useCallback((movies: Movie[], upvotedIds: Set<number>): Movie[] => {
    if (upvotedIds.size === 0) {
      return movies; // No upvotes, return original order
    }

    // Get upvoted movies and their genres for affinity scoring
    const upvotedMovies = movies.filter(m => upvotedIds.has(m.id));
    const upvotedGenres = new Set<string>();
    upvotedMovies.forEach(movie => {
      movie.genres.forEach(genre => upvotedGenres.add(genre));
    });
    
    // Debug: Log what genres we're boosting
    console.log('🎯 Upvote-based genre boosting:', {
      upvotedMovies: upvotedMovies.map(m => ({ id: m.id, title: m.title, genres: m.genres })),
      upvotedGenres: Array.from(upvotedGenres),
      totalMovies: movies.length
    });

    // Apply hybrid scoring: combine base scores with upvote boosts
    const personalizedMovies = movies.map(movie => {
      // Start with the movie's base score (from Shaped or default)
      const baseScore = movie.score || movie.blendedScore || 1.0;
      
      // Boost upvoted movies significantly (immediate feedback)
      const upvoteBoost = upvotedIds.has(movie.id) ? 0.25 : 0;
      
      // Boost movies with similar genres (soft affinity)
      let genreBoost = 0;
      if (movie.genres) {
        const genreOverlap = movie.genres.filter(genre => upvotedGenres.has(genre)).length;
        genreBoost = Math.min(genreOverlap * 0.05, 0.15); // Cap genre boost
      }
      
      // Blend scores: Shaped's AI + user preferences
      const blendedScore = baseScore + upvoteBoost + genreBoost;
      
      // Debug logging for genre boosting
      if (genreBoost > 0) {
        console.log(`🎭 Genre boost for "${movie.title}":`, {
          movieGenres: movie.genres,
          upvotedGenres: Array.from(upvotedGenres),
          genreOverlap: movie.genres.filter(genre => upvotedGenres.has(genre)).length,
          genreBoost,
          baseScore,
          blendedScore
        });
      }
      
      return { 
        ...movie, 
        blendedScore,
        upvoteBoost,
        genreBoost
      };
    });
    
    // Sort by blended score (upvoted movies float to top)
    return personalizedMovies.sort((a, b) => (b.blendedScore || 0) - (a.blendedScore || 0));
  }, []);

  // Load movies and get personalized recommendations
  useEffect(() => {
    const loadMovies = async () => {
      try {
        // Load movies from u.item file with proper genre parsing
        const moviesFromItemFile = await MovieLensDataService.loadMoviesFromItemFile();
        
        // Debug: Check Blade Runner specifically
        const bladeRunner = moviesFromItemFile.find(m => m.title.includes('Blade Runner'));
        if (bladeRunner) {
          console.log('🔍 BLADE RUNNER IN FRONTEND:', {
            id: bladeRunner.id,
            title: bladeRunner.title,
            genres: bladeRunner.genres
          });
        }
        
        console.log('🎬 Frontend: Loaded movies from u.item:', moviesFromItemFile.slice(0, 3).map(m => ({
          id: m.id,
          title: m.title,
          genres: m.genres
        })));
        
        // Debug: Check if genres are actually arrays
        console.log('🎭 Genre debugging:', {
          sampleMovie: moviesFromItemFile[0],
          genresType: typeof moviesFromItemFile[0]?.genres,
          genresIsArray: Array.isArray(moviesFromItemFile[0]?.genres),
          genresLength: moviesFromItemFile[0]?.genres?.length,
          sampleGenres: moviesFromItemFile[0]?.genres
        });
        
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
        
        console.log('🔄 Frontend: Transformed movies:', transformedMovies.slice(0, 3).map(m => ({
          id: m.id,
          title: m.title,
          genres: m.genres
        })));

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
                userId: user.uid
                // Removed hardcoded limit - let Shaped return natural number of recommendations
              })
            });

            if (recResponse.ok) {
              const recData = await recResponse.json();
              console.log('Shaped recommendations:', recData);
              
              if (recData.success && recData.recommendations && recData.recommendations.length > 0) {
                // Reorder movies based on Shaped recommendations
                const recommendedIds = new Set(recData.recommendations.map((r: { item_id: string }) => parseInt(r.item_id)));
                console.log('Shaped recommended IDs:', Array.from(recommendedIds));
                console.log('Shaped recommendations count:', recData.recommendations.length);
                console.log('Shaped recommendations data:', recData.recommendations);
                
                // Store the personalized movie IDs for display
                setPersonalizedMovieIds(new Set(Array.from(recommendedIds).map(id => Number(id))));
                
                // Find movies that match the recommended IDs
                const recommendedMovies = transformedMovies.filter(m => recommendedIds.has(m.id));
                const otherMovies = transformedMovies.filter(m => !recommendedIds.has(m.id));
                
                console.log(`Found ${recommendedMovies.length} recommended movies:`, recommendedMovies.map(m => ({ id: m.id, title: m.title })));
                console.log(`Other movies: ${otherMovies.length}`);
                
                // NEW: Apply upvote-based re-ranking to recommended movies
                const personalizedRecommendedMovies = reRankMoviesByUpvotes(recommendedMovies, upvotedMovies);
                const personalizedOtherMovies = reRankMoviesByUpvotes(otherMovies, upvotedMovies);
                
                // Show personalized recommended movies first, then personalized other movies
                setDisplayMovies([...personalizedRecommendedMovies, ...personalizedOtherMovies]);
                console.log(`🎯 Personalized: ${personalizedRecommendedMovies.length} recommended, ${personalizedOtherMovies.length} other movies (re-ranked by upvotes)`);
              } else {
                console.log('No personalized recommendations, showing all movies re-ranked by upvotes');
                setPersonalizedMovieIds(new Set());
                const personalizedAllMovies = reRankMoviesByUpvotes(transformedMovies, upvotedMovies);
                setDisplayMovies(personalizedAllMovies);
              }
            } else {
              console.log('Recommendations API error, showing all movies re-ranked by upvotes');
              const personalizedAllMovies = reRankMoviesByUpvotes(transformedMovies, upvotedMovies);
              setDisplayMovies(personalizedAllMovies);
            }
          } catch (error) {
            console.error('Error getting recommendations:', error);
            const personalizedAllMovies = reRankMoviesByUpvotes(transformedMovies, upvotedMovies);
            setDisplayMovies(personalizedAllMovies);
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
        const upvotedIds = new Set<number>(JSON.parse(savedUpvotes).map((id: unknown) => Number(id)));
        setUpvotedMovies(upvotedIds);
      }
    }
  }, [user]);

  // Re-rank movies whenever upvotes or allMovies change
  useEffect(() => {
    if (allMovies.length > 0 && upvotedMovies.size > 0) {
      const personalizedMovies = reRankMoviesByUpvotes(allMovies, upvotedMovies);
      setDisplayMovies(personalizedMovies);
    }
  }, [allMovies, upvotedMovies, reRankMoviesByUpvotes]);

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
      console.log('🎭 Filtering by genre:', selectedGenre);
      console.log('🎭 Sample movie genres before filter:', filtered.slice(0, 3).map(m => ({ title: m.title, genres: m.genres })));
      
      filtered = MovieLensDataService.filterMoviesByGenre(filtered, selectedGenre);
      
      console.log('🎭 After genre filter:', {
        selectedGenre,
        filteredCount: filtered.length,
        sampleFiltered: filtered.slice(0, 3).map(m => ({ title: m.title, genres: m.genres }))
      });
    }
    
    console.log('Filtered results:', {
      filteredCount: filtered.length,
      selectedGenre,
      sampleFiltered: filtered.slice(0, 3).map(m => ({ title: m.title, genres: m.genres }))
    });
    
    // Apply upvote-based re-ranking to filtered results
    if (upvotedMovies.size > 0) {
      const personalizedFiltered = reRankMoviesByUpvotes(filtered, upvotedMovies);
      setDisplayMovies(personalizedFiltered);
    } else {
      setDisplayMovies(filtered);
    }
  }, [allMovies, searchTerm, selectedGenre, upvotedMovies]);

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

      // NEW: Re-rank movies immediately after upvote change
      const personalizedMovies = reRankMoviesByUpvotes(allMovies, newUpvotes);
      setDisplayMovies(personalizedMovies);

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

  // Refresh recommendations function
  const refreshRecommendations = async () => {
    if (!user || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing recommendations from Shaped...');
      
      // Get fresh recommendations from Shaped API
      const recResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        })
      });

      if (recResponse.ok) {
        const recData = await recResponse.json();
                  if (recData.success && recData.recommendations && recData.recommendations.length > 0) {
            // Update recommendations
            const recommendedIds = new Set(recData.recommendations.map((r: { item_id: string }) => parseInt(r.item_id)));
            setPersonalizedMovieIds(new Set(Array.from(recommendedIds).map(id => Number(id))));
            
            // Apply upvote-based re-ranking to new recommendations
            const recommendedMovies = allMovies.filter(m => recommendedIds.has(m.id));
            const otherMovies = allMovies.filter(m => !recommendedIds.has(m.id));
            
            const personalizedRecommendedMovies = reRankMoviesByUpvotes(recommendedMovies, upvotedMovies);
            const personalizedOtherMovies = reRankMoviesByUpvotes(otherMovies, upvotedMovies);
            
            setDisplayMovies([...personalizedRecommendedMovies, ...personalizedOtherMovies]);
          }
      } else {
        console.error('❌ Failed to refresh recommendations');
      }
    } catch (error) {
      console.error('❌ Error refreshing recommendations:', error);
    } finally {
      setIsRefreshing(false);
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
              🎯 Personalized for You
            </div>
          )}
          
          {/* Personalized Recommendations Summary */}
          {user && personalizedMovieIds.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 text-sm">
                    ✨ AI Recommendations
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    Movies ranked by Shaped AI based on your preferences
                  </p>
                </div>

              </div>
            </div>
          )}
          
          {/* NEW: Upvote-based personalization explanation */}
          {user && upvotedMovies.size > 0 && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-center">
                <p className="text-purple-800 text-sm">
                  🎯 <strong>Personalization Active!</strong> You've upvoted {upvotedMovies.size} movies
                </p>
                <p className="text-purple-700 text-xs mt-1">
                  Movies are re-ranked based on your preferences
                </p>
              </div>
            </div>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            💡 Movies are ranked based on your preferences and upvotes
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
          {displayMovies.map((movie, index) => {
            // Check if this movie is in the personalized recommendations
            const isPersonalized = personalizedMovieIds.has(movie.id);
            // NEW: Check if this movie is upvoted
            const isUpvoted = upvotedMovies.has(movie.id);
            
            return (
              <MovieCard
                key={movie.id}
                movie={movie}
                isUpvoted={isUpvoted}
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
