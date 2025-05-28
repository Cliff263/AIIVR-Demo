import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only supervisors can access live monitoring
    if (session.user.role !== 'SUPERVISOR') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const activeCalls = await prisma.call.findMany({
      where: {
        status: 'IN_PROGRESS',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        agent: {
          select: {
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(activeCalls);
  } catch (error) {
    console.error('Error fetching active calls:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only supervisors can perform monitoring actions
    if (session.user.role !== 'SUPERVISOR') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { callId, action } = body;

    // Here you would implement the actual monitoring logic
    // This could involve WebSocket connections, SIP integration, etc.
    const monitoringAction = {
      callId,
      action,
      supervisorId: session.user.id,
      timestamp: new Date()
    };

    // Store the monitoring action
    await prisma.monitoringAction.create({
      data: monitoringAction
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing monitoring action:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 