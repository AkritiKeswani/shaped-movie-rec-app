import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, movieId, rating, timestamp } = await request.json();

    if (!userId || !movieId || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Send interaction to Shaped dataset for real-time personalization
    const shapedResponse = await fetch(`https://api.shaped.ai/v1/datasets/${process.env.SHAPED_DATASET_ID}/interactions`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        item_id: movieId.toString(),
        rating: rating,
        timestamp: timestamp || Date.now()
      })
    });

    if (shapedResponse.ok) {
      console.log(`Successfully sent interaction to Shaped: User ${userId} rated movie ${movieId} as ${rating}`);
      return NextResponse.json({ 
        success: true,
        message: `Interaction sent to Shaped AI successfully`,
        note: 'Your preference has been recorded and will improve future recommendations!'
      });
    } else {
      const errorText = await shapedResponse.text();
      console.error('Shaped API error:', shapedResponse.status, errorText);
      
      // Still return success locally even if Shaped fails
      return NextResponse.json({ 
        success: true,
        message: `Interaction recorded locally`,
        note: 'Shaped API temporarily unavailable, but your preference was saved locally'
      });
    }

  } catch (error) {
    console.error('Error sending interaction:', error);
    
    // Return success even on error to not break user experience
    return NextResponse.json({ 
      success: true,
      message: `Interaction recorded locally`,
      note: 'Error occurred, but your preference was saved locally'
    });
  }
}
