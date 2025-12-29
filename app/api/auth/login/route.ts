import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * 
 * Proxy login request to backend to handle cookies properly
 * This route runs on the same origin as the frontend, so cookies
 * set by backend will be properly forwarded to the browser
 */
export async function POST(request: NextRequest) {
  try {
    // Get API base URL from environment variable (server-side)
    // LƯU Ý: Khi sử dụng Cloudflare Tunnel, NEXT_PUBLIC_API_BASE_URL phải là URL public (https://api.acdm.site)
    // KHÔNG dùng localhost vì Next.js API route chạy server-side và cần gọi backend qua public URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.acdm.site';
    
    console.log('[Login API Route] ========================================');
    console.log('[Login API Route] 📥 Received login request');
    console.log('[Login API Route] API_BASE_URL:', API_BASE_URL);
    console.log('[Login API Route] NODE_ENV:', process.env.NODE_ENV);
    
    const body = await request.json();
    const { username, password } = body;
    
    console.log('[Login API Route] Username:', username);
    console.log('[Login API Route] Password length:', password?.length || 0);
    console.log('[Login API Route] Forwarding to backend:', `${API_BASE_URL}/api/auth/login`);

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Login API Route] Backend response status:', response.status);
    console.log('[Login API Route] Backend response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    
    console.log('[Login API Route] Backend response data:', {
      success: data.success,
      hasToken: !!data.data?.token,
      hasUser: !!data.data?.user,
    });

    // Create Next.js response
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward cookies from backend response to client
    // Backend sets refreshToken cookie, we need to forward it with correct options
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('[Login API Route] Set-Cookie header from backend:', setCookieHeader);
    
    if (setCookieHeader) {
      // Parse the cookie to extract value and options
      const cookieMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
      if (cookieMatch) {
        const refreshTokenValue = cookieMatch[1];
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Cookie settings phù hợp với cross-subdomain (api.acdm.site và ssps.acdm.site)
        // sameSite: 'none' cho phép cookie được gửi cross-origin (cần khi FE và BE ở khác subdomain)
        // secure: true bắt buộc khi sameSite: 'none'
        // domain: '.acdm.site' để share cookie giữa các subdomain
        const cookieOptions: any = {
          httpOnly: true,
          secure: isProduction, // Bắt buộc true khi sameSite: 'none'
          sameSite: isProduction ? 'none' : 'lax', // 'none' cho cross-subdomain
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        };
        
        // Set domain để share cookie giữa các subdomain trong production
        if (isProduction) {
          cookieOptions.domain = '.acdm.site'; // Share cookie giữa api.acdm.site và ssps.acdm.site
        }
        
        console.log('[Login API Route] Setting cookie with options:', cookieOptions);
        
        // Set cookie với options phù hợp cho cross-subdomain
        nextResponse.cookies.set('refreshToken', refreshTokenValue, cookieOptions);
        
        console.log('[Login API Route] ✅ Cookie set successfully');
      } else {
        // Fallback: forward the header as-is
        console.log('[Login API Route] ⚠️ Could not parse cookie, forwarding header as-is');
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }
    } else {
      console.log('[Login API Route] ⚠️ No Set-Cookie header from backend');
    }

    console.log('[Login API Route] ✅ Returning response to client');
    console.log('[Login API Route] ========================================');
    return nextResponse;
  } catch (error: any) {
    console.error('[Login API Route] ❌ Error:', error);
    console.error('[Login API Route] Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

