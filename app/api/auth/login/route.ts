import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api-config';

/**
 * POST /api/auth/login
 * 
 * Proxy login request to backend to handle cookies properly
 * This route runs on the same origin as the frontend, so cookies
 * set by backend will be properly forwarded to the browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Create Next.js response
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward cookies from backend response to client
    // Backend sets refreshToken cookie, we need to forward it with correct options
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse the cookie to extract value and options
      const cookieMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
      if (cookieMatch) {
        const refreshTokenValue = cookieMatch[1];
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Set cookie with same options as backend
        nextResponse.cookies.set('refreshToken', refreshTokenValue, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });
        
        console.log('[Login API Route] Cookie set successfully');
      } else {
        // Fallback: forward the header as-is
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }
    }

    return nextResponse;
  } catch (error: any) {
    console.error('[Login API Route] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

