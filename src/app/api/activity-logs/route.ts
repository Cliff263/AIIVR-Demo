import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitActivityLog } from "@/lib/websocket";

const ITEMS_PER_PAGE = 10;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "SUPERVISOR") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const role = searchParams.get("role") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where = {
      AND: [
        search ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { details: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        action ? { action } : {},
        role ? { user: { role } } : {},
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {},
      ],
    };

    const [logs, totalItems] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return NextResponse.json({
      logs,
      totalPages,
      currentPage: page,
      totalItems,
    });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { action, details, ipAddress, userAgent } = body;

    const log = await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action,
        details,
        ipAddress,
        userAgent,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Emit the new log to all connected clients
    emitActivityLog(log);

    return NextResponse.json(log);
  } catch (error) {
    console.error("Failed to create activity log:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 