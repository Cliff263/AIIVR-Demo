import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
	const session = request.cookies.get("session");
	const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
	const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
	const isRootPath = request.nextUrl.pathname === '/';

	// Allow API routes to handle their own authentication
	if (isApiRoute) {
		return NextResponse.next();
	}

	// If trying to access auth pages while logged in, redirect to home
	if (isAuthPage && session) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// If trying to access any page while logged out, redirect to sign in
	if (!isAuthPage && !session) {
		return NextResponse.redirect(new URL('/auth/sign-in', request.url));
	}

	// If accessing root path with session, let the page handle the role-based redirect
	if (isRootPath && session) {
		return NextResponse.next();
	}

	return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!_next/static|_next/image|favicon.ico|public/).*)',
	],
} 
