import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Verify the requesting user is the agent or their supervisor
    const agent = await prisma.user.findUnique({
      where: { id: parseInt(agentId) },
      include: { supervisedBy: true },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (user.id !== parseInt(agentId) && user.id !== agent.supervisedBy?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queries = await prisma.query.findMany({
      where: {
        assignedTo: parseInt(agentId),
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'PENDING'],
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching agent queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 