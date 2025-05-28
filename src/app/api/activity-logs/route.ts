import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitActivityLog } from "@/lib/websocket";
import { auth } from '@/lib/auth'

const ITEMS_PER_PAGE = 10;

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const role = searchParams.get('role')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build the where clause for the query
    const where: any = {}
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (action) {
      where.type = action
    }

    if (role) {
      where.user = { role }
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // Fetch logs from the database with pagination
    const [logs, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.userActivityLog.count({ where })
    ])

    // Transform the logs to match the expected format
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      type: log.type,
      description: log.description,
      user: {
        name: log.user.name,
        email: log.user.email,
        role: log.user.role,
      },
    }))

    return NextResponse.json({ 
      logs: formattedLogs,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE)
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { type, description } = body;

    const log = await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        type,
        description: description || ''
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