"use server"
import prisma from "@/lib/prisma";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { User, Session, PauseReason } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { compare, hash } from "bcryptjs";
//import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function generateSessionToken(): Promise<string> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: string): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await prisma.session.create({
		data: session
	});
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
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
	}
	return { session, user: safeUser };
}

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

export type SessionValidationResult =
	| { session: Session; user: Omit<User, "passwordHash"> }
	| { session: null; user: null };

export async function setSessionTokenCookie(token: string, expiresAt: Date): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set("session", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/"
	});
}

export async function deleteSessionTokenCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set("session", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/"
	});
}

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = await validateSessionToken(token);
	return result;
});

export const hashPassword = async (password: string) => {
	return hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
	return compare(password, hash);
};

export const registerUser = async (name: string, email: string, password: string, supervisorKey?: string) => {
	try {
		// Validate supervisor key if provided
		if (supervisorKey) {
			const validKey = await prisma.supervisorKey.findFirst({
				where: {
					key: supervisorKey,
					used: false
				}
			});

			if (!validKey) {
				return {
					user: null,
					error: "Invalid or already used supervisor key"
				};
			}
		}

		const passwordHash = await hashPassword(password);
		const user = await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
				role: supervisorKey ? "SUPERVISOR" : "AGENT"
			}
		});

		// If supervisor key was used, mark it as used and link it to the user
		if (supervisorKey) {
			await prisma.supervisorKey.update({
				where: { key: supervisorKey },
				data: {
					used: true,
					usedById: user.id
				}
			});
		}

		await prisma.userActivityLog.create({
			data: {
				userId: user.id,
				type: "REGISTER",
				description: `User registered with role: ${user.role}`
			}
		});

		const safeUser = { ...user, passwordHash: undefined };
		return { user: safeUser, error: null };
	} catch (error: any) {
		console.error("Registration error:", error);
		if (error.code === 'P2002') {
			return {
				user: null,
				error: "Email already exists"
			};
		}
		return {
			user: null,
			error: "Failed to create user"
		};
	}
};

export const logActivity = async (
	userId: string,
	type: string,
	description?: string
) => {
	try {
		await prisma.userActivityLog.create({
			data: {
				userId,
				type,
				description: description || ''
			},
		});
	} catch (error) {
		console.error("Failed to log activity:", error);
	}
};

export const updateAgentStatus = async (
	userId: string,
	status: "ONLINE" | "OFFLINE" | "PAUSED",
	pauseReason?: string
) => {
	try {
		if (status === "PAUSED" && !pauseReason) {
			throw new Error("Pause reason is required when status is PAUSED");
		}

		const [user, statusInfo] = await prisma.$transaction([
			prisma.user.update({
				where: { id: userId },
				data: { status },
			}),
			prisma.agentStatusInfo.upsert({
				where: { userId },
				update: {
					status,
					pauseReason: status === "PAUSED" ? (pauseReason as PauseReason) : null,
					lastActive: new Date(),
				},
				create: {
					userId,
					status,
					pauseReason: status === "PAUSED" ? (pauseReason as PauseReason) : null,
				},
			}),
			prisma.agentStatusHistory.create({
				data: {
					userId,
					status,
					pauseReason: status === "PAUSED" ? (pauseReason as PauseReason) : null,
				},
			}),
		]);

		await logActivity(
			userId,
			"STATUS_CHANGE",
			`Status changed to ${status}${pauseReason ? ` (${pauseReason})` : ""}`
		);

		return { user, statusInfo };
	} catch (error) {
		console.error("Failed to update agent status:", error);
		throw error;
	}
};

export const logCallActivity = async (
	userId: string,
	callId: number,
	action: "CALL_STARTED" | "CALL_ENDED",
	details?: string
) => {
	try {
		await logActivity(
			userId,
			action,
			`Call ID: ${callId}${details ? ` - ${details}` : ""}`
		);
	} catch (error) {
		console.error("Failed to log call activity:", error);
	}
};

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
			await logActivity(
				user.id,
				"LOGIN_FAILED",
				"Invalid password"
			);

			return {
				user: null,
				error: "Invalid password"
			};
		}

		const token = await generateSessionToken();
		const session = await createSession(token, user.id);
		await setSessionTokenCookie(token, session.expiresAt);

		await logActivity(
			user.id,
			"LOGIN",
			"User logged in successfully"
		);

		await updateAgentStatus(user.id, "ONLINE");

		const safeUser = {
			...user,
			passwordHash: undefined
		};

		return {
			user: safeUser,
			error: null
		};
	} catch (error) {
		console.error("Sign in error:", error);
		return {
			user: null,
			error: "An error occurred during sign in"
		};
	}
};

export const signOut = async () => {
	try {
		const session = await getCurrentSession();
		if (session.session && session.user) {
			await logActivity(
				session.user.id,
				"LOGOUT",
				"User logged out"
			);

			await updateAgentStatus(session.user.id, "OFFLINE");
			await invalidateSession(session.session.id);
		}
		await deleteSessionTokenCookie();
	} catch (error) {
		console.error("Sign out error:", error);
	}
};