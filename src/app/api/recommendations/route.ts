import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, limit = 20 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Recommendations API called with:', { userId, limit });
    console.log('Environment variables:', {
      hasApiKey: !!process.env.SHAPED_API_KEY,
      hasModelId: !!process.env.SHAPED_MODEL_ID,
      modelId: process.env.SHAPED_MODEL_ID
    });

    // Call Shaped API directly with the user's ACTIVE model
    const shapedResponse = await fetch('https://api.shaped.ai/v1/models/movielens_movie_recommendation/rank', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        limit: limit
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
      const recommendations = shapedData.ids.map((id: string, index: number) => ({
        item_id: id,
        score: shapedData.scores ? shapedData.scores[index] : 1.0
      }));

      console.log('Transformed recommendations:', recommendations);

      return NextResponse.json({ 
        success: true, 
        recommendations: recommendations,
        note: `Personalized recommendations from Shaped AI model: movielens_movie_recommendation`
      });
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
      { error: 'Failed to get recommendations', details: error.message },
      { status: 500 }
    );
  }
}
