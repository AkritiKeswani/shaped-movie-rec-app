import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This route handles Firebase auth callbacks
  // Firebase will redirect here after OAuth
  const url = new URL(request.url);
  
  // Extract the Firebase auth parameters
  const apiKey = url.searchParams.get('apiKey');
  const authDomain = url.searchParams.get('authDomain');
  
  // Redirect back to the main app with success
  // Firebase will handle the auth state automatically
  return NextResponse.redirect(new URL('/', request.url));
}

export async function POST(request: NextRequest) {
  // Handle POST requests if needed
  return NextResponse.json({ success: true });
}
