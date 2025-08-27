import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, movieId, rating, timestamp } = await request.json();

    if (!userId || !movieId || rating === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Accept 0 (remove upvote) or >=4 (upvote)
    if (!(rating === 0 || rating >= 4)) {
      return NextResponse.json({
        success: false,
        message: `Rating ${rating} invalid — must be 0 or ≥4`,
      }, { status: 400 });
    }

    // Build event for Shaped (JSONL line) - using your actual dataset schema
    const event = {
      user_id: String(userId),
      item_id: String(movieId),
      timestamp: String(timestamp ?? Date.now()),
      rating: String(rating >= 4 ? 5 : 0),
    };

    let shapedSuccess = false;
    try {
      const resp = await fetch(
        `https://api.shaped.ai/v1/datasets/${process.env.SHAPED_DATASET_ID}/insert`,
        {
          method: 'POST',
          headers: { 
            'x-api-key': process.env.SHAPED_API_KEY!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: [event] // Wrap in data array as required by Shaped
          }),
        }
      );
      shapedSuccess = resp.ok;
      if (!resp.ok) {
        console.warn('Shaped insert failed', resp.status, await resp.text());
      }
    } catch (e) {
      console.warn('Error hitting Shaped insert', e);
    }

    // Return success with event details
    const action = rating >= 4 ? 'upvote' : 'un-upvote';
    return NextResponse.json({
      success: true,
      shaped: shapedSuccess,
      event,
      note: shapedSuccess 
        ? `Your ${action} was sent to Shaped for real-time learning!`
        : `Your ${action} is tracked locally. Check Shaped API configuration.`
    });
  } catch (e) {
    console.error('Interactions error', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
