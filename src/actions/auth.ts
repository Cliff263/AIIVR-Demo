"use server"
import prisma from "@/lib/prisma";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { User, Session, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { compare } from "bcryptjs";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function generateSessionToken(): Promise<string> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
	return prisma.session.create({
		data: {
			id: sessionId,
			userId,
			expiresAt,
		},
	});
}

export async function setSessionTokenCookie(token: string, expiresAt: Date) {
	const cookieStore = await cookies();
	const cookie: ResponseCookie = {
		name: "session",
		value: token,
		path: "/",
		expires: expiresAt,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	};
	cookieStore.set(cookie);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return compare(password, hash);
}

export type SessionValidationResult =
	| { session: Session; user: Omit<User, "passwordHash"> }
	| { session: null; user: null };

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}

	try {
		const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
		const result = await prisma.session.findUnique({
			where: {
				id: sessionId
			},
			include: {
				user: true
			}
		});

		if (result === null) {
			return { session: null, user: null };
		}

		const { user, ...session } = result;
		if (Date.now() >= session.expiresAt.getTime()) {
			await prisma.session.delete({ where: { id: sessionId } });
			return { session: null, user: null };
		}

		if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
			session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
			await prisma.session.update({
				where: {
					id: session.id
				},
				data: {
					expiresAt: session.expiresAt
				}
			});
		}

		const safeUser = {
			...user,
			passwordHash: undefined,
		};

		return { session, user: safeUser };
	} catch (error) {
		console.error('Session validation error:', error);
		return { session: null, user: null };
	}
});

export const signIn = async (email: string, password: string) => {
	try {
		const user = await prisma.user.findUnique({
			where: {
				email: email
			}
		});
		
		if (!user) {
			return {
				user: null,
				error: "No user found"
			};
		}

		const isPasswordValid = await verifyPassword(password, user.passwordHash);
		if (!isPasswordValid) {
			return {
				user: null,
				error: "Invalid password"
			};
		}

		const token = await generateSessionToken();
		const session = await createSession(token, user.id);
		await setSessionTokenCookie(token, session.expiresAt);
		
		const safeUser = { 
			...user, 
			passwordHash: undefined 
		};
		
		return {
			user: safeUser,
			error: null
		};
	} catch (error) {
		console.error('Sign in error:', error);
		return {
			user: null,
			error: "An error occurred during sign in"
		};
	}
};

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.session.delete({ where: { id: sessionId } });
}

export async function invalidateAllSessions(userId: number): Promise<void> {
	await prisma.session.deleteMany({
		where: {
			userId: userId
		}
	});
}

{/* User register, signin, signout */}
export const hashPassword = async (password: string) => {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(password)));
};

export const registerUser = async (email: string, password: string, name: string, role: UserRole = "AGENT") => {
	const passwordHash = await hashPassword(password);
	try {
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				name,
				role,
			}
		});
		const safeUser = { ...user, passwordHash: undefined };
		return { user: safeUser, error: null };
	} catch (error) {
		console.error('Registration error:', error);
		return {
			user: null,
			error: "Failed to create user"
		};
	}
};

export const signOut = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	if (token) {
		const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
		await invalidateSession(sessionId);
	}
	const cookie: ResponseCookie = {
		name: "session",
		value: "",
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
	};
	cookieStore.set(cookie);
};

