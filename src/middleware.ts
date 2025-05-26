import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
	const session = request.cookies.get("session");
	const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
	const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
	const isPublicRoute = request.nextUrl.pathname === '/';

	// Allow API routes to handle their own authentication
	if (isApiRoute) {
		return NextResponse.next();
	}

	// If trying to access auth pages while logged in, redirect to home
	if (isAuthPage && session) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// If trying to access protected pages while logged out, redirect to sign in
	if (!isAuthPage && !isPublicRoute && !session) {
		return NextResponse.redirect(new URL('/auth/sign-up', request.url));
	}

	// CSRF Protection for non-GET requests
	if (request.method !== "GET") {
		const originHeader = request.headers.get("Origin");
		const hostHeader = request.headers.get("Host");
		
		if (!originHeader || !hostHeader) {
			return new NextResponse(null, { status: 403 });
		}

		try {
			const origin = new URL(originHeader);
			if (origin.host !== hostHeader) {
				return new NextResponse(null, { status: 403 });
			}
		} catch {
			return new NextResponse(null, { status: 403 });
		}
	}

	return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
} 