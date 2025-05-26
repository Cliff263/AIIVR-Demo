"use server"
import prisma from "@/lib/prisma";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { User, Session, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { compare, hash } from "bcryptjs";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function generateSessionToken(): Promise<string> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: string): Promise<Session> {
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
		
		// Update both user status and agent status to ONLINE
		await prisma.$transaction([
			// Update user status
			prisma.user.update({
				where: { id: user.id },
				data: { status: 'ONLINE' }
			}),
			// Update agent status info
			prisma.agentStatusInfo.upsert({
				where: {
					userId: user.id,
				},
				update: {
					status: 'ONLINE',
					lastActive: new Date(),
				},
				create: {
					userId: user.id,
					status: 'ONLINE',
				},
			}),
			// Create status history entry
			prisma.agentStatusHistory.create({
				data: {
					userId: user.id,
					status: 'ONLINE',
				},
			})
		]);
		
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

export async function invalidateAllSessions(userId: string): Promise<void> {
	await prisma.session.deleteMany({
		where: {
			userId: userId
		}
	});
}

{/* User register, signin, signout */}
export const hashPassword = async (password: string) => {
	return hash(password, 10); // 10 is the salt rounds
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
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("session")?.value;
		
		if (token) {
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			const session = await prisma.session.findUnique({
				where: { id: sessionId },
				include: { user: true }
			});

			if (session?.user) {
				// Update user status to OFFLINE
				await prisma.agentStatusInfo.upsert({
					where: {
						userId: session.user.id,
					},
					update: {
						status: 'OFFLINE',
						lastActive: new Date(),
					},
					create: {
						userId: session.user.id,
						status: 'OFFLINE',
					},
				});

				// Create status history entry
				await prisma.agentStatusHistory.create({
					data: {
						userId: session.user.id,
						status: 'OFFLINE',
					},
				});
			}

			await invalidateSession(sessionId);
		}

		// Clear the session cookie with proper expiration
		const cookie: ResponseCookie = {
			name: "session",
			value: "",
			path: "/",
			expires: new Date(0), // Set to past date to expire immediately
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		};
		cookieStore.set(cookie);
		
		return { success: true };
	} catch (error) {
		console.error('Sign out error:', error);
		return { success: false, error: "Failed to sign out" };
	}
};

