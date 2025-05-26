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

    // Get all calls from supervised agents
    const calls = await prisma.call.findMany({
      where: {
        agent: {
          supervisorId: user.id,
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        recording: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching supervisor calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 