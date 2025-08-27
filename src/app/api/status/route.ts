import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check if Shaped API is working and model is ready
    const modelResponse = await fetch(`https://api.shaped.ai/v1/models/${process.env.SHAPED_MODEL_ID}`, {
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
      },
    });

    const datasetResponse = await fetch(`https://api.shaped.ai/v1/datasets/${process.env.SHAPED_DATASET_ID}`, {
      headers: {
        'x-api-key': process.env.SHAPED_API_KEY!,
      },
    });

    let modelStatus = 'unknown';
    let datasetStatus = 'unknown';

    if (modelResponse.ok) {
      try {
        const modelData = await modelResponse.json();
        modelStatus = modelData.status || 'unknown';
      } catch (e) {
        modelStatus = 'error parsing response';
      }
    } else {
      modelStatus = `error: ${modelResponse.status}`;
    }

    if (datasetResponse.ok) {
      try {
        const datasetData = await datasetResponse.json();
        datasetStatus = datasetData.status || 'unknown';
      } catch (e) {
        datasetStatus = 'error parsing response';
      }
    } else {
      datasetStatus = `error: ${datasetResponse.status}`;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      shaped: {
        model: {
          status: modelStatus,
          url: modelResponse.url,
        },
        dataset: {
          status: datasetStatus,
          url: datasetResponse.url,
        },
      },
      environment: {
        hasApiKey: !!process.env.SHAPED_API_KEY,
        hasModelId: !!process.env.SHAPED_MODEL_ID,
        hasDatasetId: !!process.env.SHAPED_DATASET_ID,
        modelId: process.env.SHAPED_MODEL_ID,
        datasetId: process.env.SHAPED_DATASET_ID,
        apiKeyLength: process.env.SHAPED_API_KEY ? process.env.SHAPED_API_KEY.length : 0
      }
    });
  } catch (error) {
    console.error('Error checking Shaped status:', error);
    return NextResponse.json({ error: 'Failed to check Shaped status' }, { status: 500 });
  }
}
