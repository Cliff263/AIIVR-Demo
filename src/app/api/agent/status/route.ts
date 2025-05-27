import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/actions/auth';

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { status, pauseReason } = body;

    if (!status || !['ONLINE', 'PAUSED', 'OFFLINE'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    // Update agent status in database
    const updatedAgent = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: {
          upsert: {
            create: {
              status,
              pauseReason,
            },
            update: {
              status,
              pauseReason,
            },
          },
        },
      },
      include: {
        status: true,
      },
    });

    return NextResponse.json({
      status: updatedAgent.status?.status,
      pauseReason: updatedAgent.status?.pauseReason,
      lastUpdated: updatedAgent.status?.updatedAt,
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 