import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

/**
 * POST /api/auth/logout
 * 
 * Xóa refreshToken cookie (HttpOnly) ở server-side
 * Cookie này không thể xóa từ client-side JavaScript
 * 
 * CRITICAL: Cookie options khi delete PHẢI khớp chính xác với khi set
 * để đảm bảo browser xóa cookie đúng cách
 * 
 * Flow:
 * 1. Gọi backend API để xóa session trong database
 * 2. Xóa refreshToken cookie ở Next.js server với options chính xác
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value
    
    // Step 1: Gọi backend API để xóa session trong database
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `refreshToken=${refreshToken}`, // Forward cookie to backend
          },
          body: JSON.stringify({ refreshToken }),
        })
        console.log('[API] Logout: Backend session deleted')
      } catch (backendError) {
        // Log error nhưng vẫn tiếp tục xóa cookie
        console.error('[API] Logout: Backend API error (continuing with cookie deletion):', backendError)
      }
    }
    
    // Step 2: Xóa refreshToken cookie ở Next.js server
    // CRITICAL: Options PHẢI khớp chính xác với backend khi set cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    )
    
    // Delete cookie với options chính xác khớp với backend
    // Backend sets: httpOnly, secure (production), sameSite: 'strict', path: '/'
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Method 1: Set cookie với empty value và maxAge = 0
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0, // Xóa cookie ngay lập tức
      path: '/',
      expires: new Date(0), // Set expiration date to past
    })
    
    // Method 2: Also delete from cookieStore
    cookieStore.delete('refreshToken')
    
    // Method 3: Set cookie với empty value và expires in the past (double ensure)
    // This ensures cookie is deleted even if browser has caching issues
    response.headers.set(
      'Set-Cookie',
      `refreshToken=; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? 'Secure;' : ''} Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    )
    
    console.log('[API] Logout: refreshToken cookie deleted with all methods')
    
    return response
  } catch (error) {
    console.error('[API] Logout error:', error)
    
    // Vẫn trả về success và xóa cookie ngay cả khi có lỗi
    // Để đảm bảo client có thể clear state
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout completed',
      },
      { status: 200 }
    )
    
    // Vẫn cố gắng xóa cookie với tất cả methods
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    })
    
    response.headers.set(
      'Set-Cookie',
      `refreshToken=; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? 'Secure;' : ''} Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    )
    
    return response
  }
}

