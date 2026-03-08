"use client"

import { useEffect } from "react"

/**
 * Logout Page
 * 
 * This page handles logout and redirects to /login with query param
 * This ensures the query param is always present when redirecting to /login
 * 
 * Flow:
 * 1. Page loads
 * 2. Call logout API to delete cookie (in background)
 * 3. IMMEDIATELY redirect to /login?logout=success
 * 4. Middleware will see logout=success and force delete cookie
 */
export default function LogoutPage() {
  useEffect(() => {
    console.log('[LogoutPage] ========================================');
    console.log('[LogoutPage] Logout page loaded');
    
    // CRITICAL: Build redirect URL with query param FIRST
    const timestamp = Date.now();
    const loginUrl = `/login?logout=success&t=${timestamp}`;
    
    console.log('[LogoutPage] 🔄 Redirecting to:', loginUrl);
    console.log('[LogoutPage] ⚠️ URL MUST include ?logout=success query param');
    console.log('[LogoutPage] ========================================');
    
    // Call logout API in background (don't await - redirect immediately)
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).catch(error => {
      console.error('[LogoutPage] Logout API error (continuing with redirect):', error);
    });
    
    // CRITICAL: Redirect IMMEDIATELY with query param
    // This ensures middleware sees logout=success and force deletes cookie
    window.location.replace(loginUrl);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg">Đang đăng xuất...</div>
        <div className="text-sm text-gray-500">Vui lòng đợi...</div>
      </div>
    </div>
  );
}

