import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Shaped API is working and model is ready
    const response = await fetch('https://api.shaped.ai/v1/models/movielens_movie_recommendation', {
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
      },
    });

    if (response.ok) {
      const modelInfo = await response.json();
      console.log('Model info:', modelInfo);
      
      if (modelInfo.status === 'ACTIVE') {
        return NextResponse.json({ status: 'ready' });
      } else if (modelInfo.status === 'TRAINING') {
        return NextResponse.json({ status: 'training' });
      } else {
        return NextResponse.json({ status: 'error', details: `Model status: ${modelInfo.status}` });
      }
    }
    
    return NextResponse.json({ status: 'error', details: 'Failed to get model info' });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ status: 'error', details: 'API check failed' });
  }
}
