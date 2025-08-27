import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.SHAPED_API_KEY,
    hasModelId: !!process.env.SHAPED_MODEL_ID,
    hasDatasetId: !!process.env.SHAPED_DATASET_ID,
    modelId: process.env.SHAPED_MODEL_ID,
    datasetId: process.env.SHAPED_DATASET_ID,
    apiKeyLength: process.env.SHAPED_API_KEY ? process.env.SHAPED_API_KEY.length : 0
  });
}
