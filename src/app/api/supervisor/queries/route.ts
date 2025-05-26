import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user || user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');

    if (!supervisorId || parseInt(supervisorId) !== user.id) {
      return NextResponse.json({ error: 'Invalid supervisor ID' }, { status: 400 });
    }

    // Get all queries from supervised agents
    const queries = await prisma.query.findMany({
      where: {
        assignee: {
          supervisorId: user.id,
        },
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'PENDING'],
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        relatedCalls: {
          select: {
            id: true,
            timestamp: true,
            duration: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching supervisor queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 