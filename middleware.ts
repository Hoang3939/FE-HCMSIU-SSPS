import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Decode JWT payload without verification (for Edge Runtime)
 * JWT format: header.payload.signature
 * We only decode the payload to extract role information
 * 
 * Note: This does NOT verify the signature, only decodes the payload
 * For production, consider using jose library for proper verification
 */
function decodeJWT(token: string): { role?: string; [key: string]: any } | null {
  try {
    // Split JWT into parts
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode payload (second part) - base64url decoding
    const payload = parts[1]
    
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    
    // Decode base64 to string (Edge Runtime compatible - using atob)
    // atob is available in Edge Runtime
    const decodedString = atob(paddedBase64)
    
    // Parse JSON
    const decodedPayload = JSON.parse(decodedString)

    return decodedPayload
  } catch (error) {
    console.error('[Middleware] JWT decode error:', error)
    return null
  }
}

/**
 * Middleware để bảo vệ protected routes với Authentication & RBAC
 * 
 * Protected Routes:
 * - /dashboard/* - Requires authentication (any role)
 * - /admin/* - Requires authentication AND ADMIN role
 * 
 * Strategy:
 * 1. Check authentication (có refreshToken cookie hay không)
 * 2. Decode JWT payload để lấy role
 * 3. Check authorization:
 *    - IF path starts with /admin AND role is NOT ADMIN:
 *      - Redirect to /dashboard?error=forbidden
 *    - IF path starts with /dashboard AND no token:
 *      - Redirect to /login
 *    - IF authenticated user tries to access /login:
 *      - Redirect to /dashboard (prevent login page access when already logged in)
 *    - IF authenticated AND has correct role:
 *      - Allow access
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get('refreshToken')?.value

  // ============================================
  // Case 1: Protected Routes (require authentication)
  // ============================================
  // Note: /logout is NOT a protected route - it's a public route for logout handling
  const isProtectedRoute = (pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/admin') ||
                          pathname.startsWith('/upload') ||
                          pathname.startsWith('/print') ||
                          pathname.startsWith('/history') ||
                          pathname.startsWith('/buy-pages') ||
                          pathname.startsWith('/printers')) &&
                          !pathname.startsWith('/logout') // Allow /logout route

  if (isProtectedRoute) {
    // Check if user has valid token
    if (!refreshToken || refreshToken.trim() === '') {
      // User is NOT authenticated - redirect to login
      console.log('[Middleware] ❌ Unauthenticated access to protected route:', pathname)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Decode JWT to verify token and get role
    const decodedPayload = decodeJWT(refreshToken)
    
    if (!decodedPayload) {
      // Invalid token format - redirect to login
      console.log('[Middleware] ❌ Invalid token format, redirecting to /login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = decodedPayload.role
    console.log('[Middleware] User authenticated, role:', userRole, 'path:', pathname)

    // ============================================
    // Case 1.1: Admin Routes (require ADMIN role)
    // ============================================
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'ADMIN') {
        console.log('[Middleware] ⚠️ Unauthorized access attempt:', {
          role: userRole,
          path: pathname,
        })
        
        // Redirect to /dashboard?error=forbidden (NOT /login)
        const dashboardUrl = new URL('/dashboard', request.url)
        dashboardUrl.searchParams.set('error', 'forbidden')
        return NextResponse.redirect(dashboardUrl)
      }

      // User IS authenticated AND has ADMIN role - allow access
      console.log('[Middleware] ✅ Admin user authenticated, allowing access')
      return NextResponse.next()
    }

    // ============================================
    // Case 1.2: Other Protected Routes (any authenticated user)
    // ============================================
    // User is authenticated - allow access to /dashboard, /upload, etc.
    console.log('[Middleware] ✅ Authenticated user, allowing access to:', pathname)
    return NextResponse.next()
  }

  // ============================================
  // Case 2: Login Page (redirect if already authenticated)
  // ============================================
  if (pathname === '/login' || pathname.startsWith('/login')) {
    // CRITICAL: Check for logout redirect FIRST, before checking token
    // This must be the first check to prevent redirect loop
    
    // Get ALL query params for debugging
    const allParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const logoutParam = request.nextUrl.searchParams.get('logout')
    const isLogoutRedirect = logoutParam === 'success'
    
    console.log('[Middleware] ========================================');
    console.log('[Middleware] Login page check:');
    console.log('[Middleware] - pathname:', pathname);
    console.log('[Middleware] - ALL query params:', allParams);
    console.log('[Middleware] - logoutParam:', logoutParam);
    console.log('[Middleware] - isLogoutRedirect:', isLogoutRedirect);
    console.log('[Middleware] - hasToken:', !!refreshToken);
    console.log('[Middleware] - full URL:', request.url);
    console.log('[Middleware] - request.nextUrl.toString():', request.nextUrl.toString());
    console.log('[Middleware] ========================================');
    
    // CRITICAL: If logout redirect detected OR if user has token but wants to access /login
    // (could be manual logout or wanting to login with different account)
    // Force delete cookie to allow access to login page
    if (isLogoutRedirect || (refreshToken && refreshToken.trim() !== '')) {
      if (isLogoutRedirect) {
        console.log('[Middleware] 🔄 Logout redirect detected - Force deleting cookie as fail-safe')
      } else {
        console.log('[Middleware] ⚠️ User has token but accessing /login - Force deleting cookie (manual logout?)')
      }
      
      // Create response to allow access to login page
      const response = NextResponse.next()
      
      // CRITICAL: Forcefully delete the refreshToken cookie on the response
      // This acts as a fail-safe in case the API route didn't delete it fast enough
      // Cookie options MUST match exactly with how it was set
      const isProduction = process.env.NODE_ENV === 'production'
      
      // Method 1: Delete using cookies.delete()
      response.cookies.delete('refreshToken')
      
      // Method 2: Set cookie with empty value and expires in the past
      response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
        expires: new Date(0), // Expires in the past
      })
      
      // Method 3: Set cookie header directly to ensure deletion
      response.headers.set(
        'Set-Cookie',
        `refreshToken=; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? 'Secure;' : ''} Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      )
      
      console.log('[Middleware] ✅ Cookie forcefully deleted, allowing access to /login')
      return response // CRITICAL: Return immediately, do NOT check token or redirect
    }
    
    // User is not authenticated and no token - allow access to login page
    console.log('[Middleware] ✅ No token found, allowing access to /login')
    return NextResponse.next()
  }

  // ============================================
  // Case 3: Public Routes (allow access)
  // ============================================
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

