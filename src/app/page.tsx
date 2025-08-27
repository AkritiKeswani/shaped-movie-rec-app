'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MovieLensDataService, Movie } from '@/lib/movielens-data';
import { ShapedAPI, MovieRecommendation } from '@/lib/shaped-api';

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMovies();
      loadRecommendations();
    }
  }, [user]);

  const loadMovies = async () => {
    try {
      const popularMovies = await MovieLensDataService.getPopularMovies(20);
      setMovies(popularMovies);
    } catch (error) {
      console.error('Error loading movies:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const recs = await ShapedAPI.getRecommendations(user.uid, 20);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to popular movies
      await loadMovies();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadMovies();
      return;
    }

    try {
      const searchResults = await MovieLensDataService.searchMovies(searchQuery);
      setMovies(searchResults);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
  };

  const handleUpvote = async (movieId: string) => {
    // TODO: Implement upvoting system
    console.log('Upvoted movie:', movieId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-8 font-['Manrope']">
            MovieLens Recommendations
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Get personalized movie recommendations powered by AI
          </p>
          <button
            onClick={signIn}
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold font-['Manrope']">
            MovieLens Recommendations
          </h1>
          <p className="text-gray-300 mt-2">
            Welcome back! Here are your personalized recommendations.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search movies or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* For You Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6 font-['Manrope']">
            For You
          </h2>
          {isLoading ? (
            <div className="text-gray-600">Loading recommendations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.slice(0, 8).map((rec) => (
                <MovieCard
                  key={rec.id}
                  movieId={rec.id}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}
        </section>

        {/* Discover Section */}
        <section>
          <h2 className="text-2xl font-bold text-black mb-6 font-['Manrope']">
            Discover Movies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface MovieCardProps {
  movie?: Movie;
  movieId?: string;
  onUpvote: (movieId: string) => void;
}

function MovieCard({ movie, movieId, onUpvote }: MovieCardProps) {
  const [movieData, setMovieData] = useState<Movie | null>(movie || null);
  const [isLoading, setIsLoading] = useState(!movie);

  useEffect(() => {
    if (movieId && !movie) {
      loadMovieData();
    }
  }, [movieId, movie]);

  const loadMovieData = async () => {
    if (!movieId) return;
    
    try {
      const data = await MovieLensDataService.getMovieById(movieId);
      setMovieData(data);
    } catch (error) {
      console.error('Error loading movie data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 h-48 animate-pulse">
        <div className="bg-gray-300 h-4 rounded mb-2"></div>
        <div className="bg-gray-300 h-3 rounded w-3/4"></div>
      </div>
    );
  }

  if (!movieData) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-black mb-2 line-clamp-2">
        {movieData.title}
      </h3>
      {movieData.releaseYear && (
        <p className="text-gray-600 text-sm mb-2">{movieData.releaseYear}</p>
      )}
      <div className="flex flex-wrap gap-1 mb-4">
        {movieData.genres.slice(0, 3).map((genre) => (
          <span
            key={genre}
            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            {genre}
          </span>
        ))}
      </div>
      <button
        onClick={() => onUpvote(movieData.id)}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors text-sm"
      >
        👍 Upvote
      </button>
    </div>
  );
}
