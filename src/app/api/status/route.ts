import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check if Shaped API is working and model is ready
    const modelResponse = await fetch('https://api.shaped.ai/v1/models/movielens_movie_recommendation', {
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
      },
    });

    const datasetResponse = await fetch('https://api.shaped.ai/v1/datasets/movielens_ratings', {
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
      },
    });

    let modelInfo = null;
    let datasetInfo = null;

    if (modelResponse.ok) {
      modelInfo = await modelResponse.json();
    }

    if (datasetResponse.ok) {
      datasetInfo = await datasetResponse.json();
    }

    const status = {
      model: modelInfo ? {
        name: modelInfo.model_name,
        status: modelInfo.status,
        uri: modelInfo.model_uri
      } : null,
      dataset: datasetInfo ? {
        name: datasetInfo.dataset_name,
        status: datasetInfo.status,
        schema: datasetInfo.dataset_schema
      } : null,
      environment: {
        hasApiKey: !!process.env.SHAPED_API_KEY,
        hasModelId: !!process.env.SHAPED_MODEL_ID,
        hasDatasetId: !!process.env.SHAPED_DATASET_ID
      }
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      status: 'error', 
      details: 'API check failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
