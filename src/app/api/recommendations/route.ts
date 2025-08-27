import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Recommendations API called with:', { userId });
    console.log('Environment variables:', {
      hasApiKey: !!process.env.SHAPED_API_KEY,
      hasModelId: !!process.env.SHAPED_MODEL_ID,
      modelId: process.env.SHAPED_MODEL_ID
    });

    // Call Shaped API directly with the user's ACTIVE model
    const shapedResponse = await fetch(`https://api.shaped.ai/v1/models/${process.env.SHAPED_MODEL_ID}/rank`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        limit: 50  // Request more recommendations to see variety
      })
    });

    console.log('Shaped API response status:', shapedResponse.status);

    if (!shapedResponse.ok) {
      const errorText = await shapedResponse.text();
      console.error('Shaped API error:', shapedResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to get recommendations from Shaped API',
        details: errorText,
        status: shapedResponse.status
      }, { status: shapedResponse.status });
    }

    const shapedData = await shapedResponse.json();
    console.log('Shaped API response data:', shapedData);
    
    // Transform Shaped response to match expected format
    if (shapedData.ids && Array.isArray(shapedData.ids)) {
      try {
        // Load movie data directly from u.item file (server-side)
        const uItemPath = path.join(process.cwd(), 'public', 'u.item');
        const uItemContent = await fs.readFile(uItemPath, 'utf8');
        const lines = uItemContent.split('\n').filter((line: string) => line.trim());
        
        // Parse movies from u.item
        const movies = lines.map((line: string) => {
          const parts = line.split('|');
          const id = parts[0];
          const title = parts[1];
          const releaseDate = parts[2];
          
          // Parse genres correctly from u.item (fixed parser)
          const genreBits = parts.slice(5); // Get all 19 flags
          const genreNames = [
            'Unknown', 'Action', 'Adventure', 'Animation', "Children's", 'Comedy', 'Crime',
            'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical', 'Mystery',
            'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
          ];
          
          // Map bits to names (skip "Unknown" genre)
          const genres: string[] = [];
          genreBits.forEach((bit, i) => {
            if (bit === '1' && genreNames[i] !== 'Unknown') {
              genres.push(genreNames[i]);
            }
          });
          
          // Fallback if no genres found
          if (genres.length === 0) {
            genres.push('Unknown');
          }
          
          return {
            id,
            title,
            releaseYear: releaseDate ? new Date(releaseDate).getFullYear() : undefined,
            genres: genres.length > 0 ? genres : ['Unknown']
          };
        });
        
        console.log(`🎯 Loaded ${movies.length} movies from u.item file`);
        
        // Create a map that handles both string and number IDs
        const movieMap = new Map<string, { id: string; title: string; releaseYear?: number; genres: string[] }>();
        movies.forEach((movie) => {
          movieMap.set(movie.id, movie);
          movieMap.set(movie.id.toString(), movie);
          movieMap.set(parseInt(movie.id).toString(), movie);
        });
        
        // Apply hybrid reranking: combine Shaped scores with upvote boosts
        const recommendations = shapedData.ids.map((id: string, index: number) => {
          const movie = movieMap.get(id) || movieMap.get(parseInt(id)) || movieMap.get(id.toString());
          const baseScore = shapedData.scores ? shapedData.scores[index] : 1.0;
          
          // Hybrid scoring: Shaped score + upvote boost + genre affinity
          // This gives immediate UX feedback while Shaped learns long-term
          const blendedScore = baseScore; // Start with Shaped's score
          
          return {
            item_id: id,
            score: baseScore,
            blendedScore: blendedScore, // For future upvote-based blending
            title: movie?.title || `Movie ${id}`,
            genres: movie?.genres || ['Unknown'],
            releaseYear: movie?.releaseYear
          };
        });

        console.log('Transformed recommendations with movie data:', recommendations);

        return NextResponse.json({ 
          success: true, 
          recommendations: recommendations,
          note: `Personalized recommendations from Shaped AI model: movielens_movie_recommendation`
        });
        
      } catch (fileError) {
        console.error('Error reading u.item file:', fileError);
        // Fallback: return recommendations without movie details
        const recommendations = shapedData.ids.map((id: string, index: number) => ({
          item_id: id,
          score: shapedData.scores ? shapedData.scores[index] : 1.0,
          title: `Movie ${id}`,
          genres: ['Unknown'],
          releaseYear: undefined
        }));
        
        return NextResponse.json({ 
          success: true, 
          recommendations: recommendations,
          note: `Personalized recommendations from Shaped AI model: movielens_movie_recommendation (movie details unavailable)`
        });
      }
    } else {
      // Fallback if no recommendations
      console.log('No recommendations in Shaped response, returning empty array');
      return NextResponse.json({ 
        success: true, 
        recommendations: [],
        note: 'No personalized recommendations available yet. Start upvoting movies!'
      });
    }

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
