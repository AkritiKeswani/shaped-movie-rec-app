'use client';

import { Movie } from '@/types/movie';
import { User } from 'firebase/auth';

interface MovieCardProps {
  movie: Movie;
  isUpvoted: boolean;
  onUpvote: () => void;
  currentUser: User | null;
  isLoading?: boolean;
  isPersonalized?: boolean; // New prop to show if this is a personalized recommendation
}

export function MovieCard({ movie, isUpvoted, onUpvote, currentUser, isLoading = false, isPersonalized = false }: MovieCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow ${isPersonalized ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} ${isUpvoted ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}>
      {/* Personalization indicators */}
      <div className="flex items-center justify-center mb-2 space-x-2">
        {isPersonalized && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🎯 Shaped AI Ranked
          </span>
        )}
        {isUpvoted && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            ❤️ You Upvoted
          </span>
        )}
      </div>

      <h3 className="font-semibold text-black mb-2 line-clamp-2 text-sm">
        {movie.title}
      </h3>

      <div className="text-xs text-gray-600 mb-3">
        {movie.releaseDate}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {movie.genres.slice(0, 2).map((genre, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            {genre}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onUpvote}
          disabled={!currentUser || isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isUpvoted
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-sm'
          } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
          ) : (
            <svg
              className={`w-5 h-5 ${isUpvoted ? 'text-white' : 'text-gray-500'}`}
              fill={isUpvoted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          )}
          <span className="font-medium">
            {isUpvoted ? 'Upvoted' : 'Upvote'}
          </span>
          <span className="text-xs opacity-75">({movie.upvotes})</span>
        </button>

        {movie.imdbUrl && (
          <a
            href={movie.imdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            IMDB
          </a>
        )}
      </div>
    </div>
  );
}
