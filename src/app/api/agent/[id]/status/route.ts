import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/actions/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const agentId = parseInt(params.id);
    if (isNaN(agentId)) {
      return new NextResponse('Invalid agent ID', { status: 400 });
    }

    // Check if user has permission to view this agent's status
    if (user.role === 'AGENT' && user.id !== agentId.toString()) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const agent = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        statusInfo: true,
      },
    });

    if (!agent) {
      return new NextResponse('Agent not found', { status: 404 });
    }

    return NextResponse.json({
      status: agent.statusInfo?.status || 'OFFLINE',
      pauseReason: agent.statusInfo?.pauseReason,
      lastUpdated: agent.statusInfo?.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 