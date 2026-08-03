import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // ─── 0. LEXI SHIELD: STATIC WAF (Edge-compatible) ─────────────
  // Lọc các request cực độc hại trực tiếp tại Edge
  const decodedQuery = decodeURIComponent(request.nextUrl.searchParams.toString());
  const FORBIDDEN_PATHS = ['/.env', '/.git', '/wp-admin', '/wp-login.php', '/wp-config.php', '/phpmyadmin', '/xmlrpc.php', '/.htaccess'];
  const SQLI_PATTERNS = [/union\s+select/i, /select\s+.*\s+from/i, /waitfor\s+delay/i, /or\s+1\s*=\s*1/i, /drop\s+table/i];
  const XSS_PATTERNS = [/<script\b[^>]*>[\s\S]*?<\/script>/i, /javascript:/i, /onerror\s*=/i, /\.\.\//, /%2e%2e\//i];
  
  if (FORBIDDEN_PATHS.some(p => path.toLowerCase().startsWith(p))) {
    return NextResponse.json({ success: false, error: 'Forbidden by Lexi Shield (Path)' }, { status: 403 });
  }
  if (SQLI_PATTERNS.some(r => r.test(decodedQuery))) {
    return NextResponse.json({ success: false, error: 'Forbidden by Lexi Shield (SQLi)' }, { status: 403 });
  }
  if (XSS_PATTERNS.some(r => r.test(decodedQuery))) {
    return NextResponse.json({ success: false, error: 'Forbidden by Lexi Shield (XSS)' }, { status: 403 });
  }
  // ───────────────────────────────────────────────────────────────

  const sessionToken = request.cookies.get('lexi_session_token')?.value;

  // Legacy paths list
  const legacyPaths = [
    '/dashboard',
    '/posts',
    '/pages',
    '/media',
    '/comments',
    '/users',
    '/settings',
    '/tools',
    '/extensions',
    '/templates'
  ];

  // 1. Redirect legacy admin paths and the imported duplicate homepage.
  if (path === '/trang-chu' || path === '/trang-chu/') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl, 308);
  }

  const matchingLegacy = legacyPaths.find(p => path === p || path.startsWith(p + '/'));
  if (matchingLegacy) {
    const relativePath = path.substring(matchingLegacy.length);
    const newPath = `/admin${matchingLegacy}${relativePath}`;
    const redirectUrl = new URL(newPath, request.url);
    redirectUrl.search = request.nextUrl.search; // preserve query params
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Check if target path belongs to protected admin modules (starts with /admin)
  const isProtectedPath = path === '/admin' || path.startsWith('/admin/');

  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Redirect logged-in users away from auth pages
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/activate'];
  if (authPages.includes(path) && sessionToken) {
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 4. CSRF Protection cho các mutation API (Ngăn chặn lỗ hổng giả mạo request)
  if (path.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Miễn trừ các API công khai không cần CSRF token
    const publicMutationApis = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/activate',
      '/api/forms/submit'
    ];
    
    if (!publicMutationApis.includes(path)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      const referer = request.headers.get('referer');
      
      let isValidHost = false;
      
      if (origin && host) {
        try {
          const originUrl = new URL(origin);
          isValidHost = originUrl.host === host;
        } catch { /* ignore invalid url */ }
      } else if (referer && host) {
        try {
          const refererUrl = new URL(referer);
          isValidHost = refererUrl.host === host;
        } catch { /* ignore invalid url */ }
      } else if (!origin && !referer && !host) {
        // Cho phép nếu không thể kiểm tra (có thể là test / curl locally) nhưng thường host luôn có
        isValidHost = true; 
      }
      
      if (!isValidHost && host) {
        return NextResponse.json({ success: false, error: 'Phát hiện vấn đề bảo mật (CSRF). Yêu cầu bị từ chối.' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/posts/:path*',
    '/pages/:path*',
    '/media/:path*',
    '/comments/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/tools/:path*',
    '/extensions/:path*',
    '/templates/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/activate',
    '/trang-chu',
    '/trang-chu/',
    '/api/:path*'
  ]
};
