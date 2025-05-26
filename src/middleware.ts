import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const session = request.cookies.get("session");
	const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
	const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

	// Allow API routes to handle their own authentication
	if (isApiRoute) {
		return NextResponse.next();
	}

	// Redirect to sign-in if no session and not on auth page
	if (!session && !isAuthPage) {
		return NextResponse.redirect(new URL('/auth/sign-in', request.url));
	}

	// Redirect to home if session exists and on auth page
	if (session && isAuthPage) {
		return NextResponse.redirect(new URL('/', request.url));
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
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 