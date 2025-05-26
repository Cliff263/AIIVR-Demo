import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import { AgentStatus, PauseReason } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, pauseReason } = body;

    if (!status || !Object.values(AgentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'PAUSED' && (!pauseReason || !Object.values(PauseReason).includes(pauseReason))) {
      return NextResponse.json({ error: 'Pause reason required for PAUSED status' }, { status: 400 });
    }

    // Update agent status
    const updatedStatus = await prisma.agentStatusInfo.upsert({
      where: {
        userId: user.id,
      },
      update: {
        status,
        pauseReason: status === 'PAUSED' ? pauseReason : null,
        lastActive: new Date(),
      },
      create: {
        userId: user.id,
        status,
        pauseReason: status === 'PAUSED' ? pauseReason : null,
      },
    });

    // Create status history entry
    await prisma.agentStatusHistory.create({
      data: {
        userId: user.id,
        status,
        pauseReason: status === 'PAUSED' ? pauseReason : null,
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 