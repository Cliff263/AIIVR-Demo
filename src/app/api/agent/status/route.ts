import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/actions/auth';
import { AgentStatus, PauseReason, UserStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { status, pauseReason } = body as { status?: AgentStatus; pauseReason?: PauseReason };

    if (!status || !Object.values(AgentStatus).includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    const parsedPauseReason = status === AgentStatus.PAUSED ? pauseReason : null;
    if (status === AgentStatus.PAUSED && parsedPauseReason && !Object.values(PauseReason).includes(parsedPauseReason)) {
      return new NextResponse('Invalid pause reason', { status: 400 });
    }

    const userStatus: UserStatus =
      status === AgentStatus.ONLINE
        ? UserStatus.ONLINE
        : status === AgentStatus.PAUSED
          ? UserStatus.PAUSED
          : UserStatus.OFFLINE;

    const updatedAgent = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: userStatus,
        statusInfo: {
          upsert: {
            create: {
              status,
              pauseReason: parsedPauseReason,
            },
            update: {
              status,
              pauseReason: parsedPauseReason,
              lastActive: new Date(),
            },
          },
        },
        statusHistory: {
          create: {
            status,
            pauseReason: parsedPauseReason,
          },
        },
      },
      include: {
        statusInfo: true,
      },
    });

    return NextResponse.json({
      status: updatedAgent.statusInfo?.status,
      pauseReason: updatedAgent.statusInfo?.pauseReason,
      lastUpdated: updatedAgent.statusInfo?.updatedAt,
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 