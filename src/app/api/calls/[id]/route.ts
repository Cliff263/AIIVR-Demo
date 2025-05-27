import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import { CallStatus, CallOutcome } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callId = parseInt(params.id);
    if (isNaN(callId)) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, outcome, duration, notes } = body;

    // Validate status and outcome if provided
    if (status && !Object.values(CallStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid call status' }, { status: 400 });
    }

    if (outcome && !Object.values(CallOutcome).includes(outcome)) {
      return NextResponse.json({ error: 'Invalid call outcome' }, { status: 400 });
    }

    // Get the call to verify ownership
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { agent: true },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Verify the user is the agent who handled the call or their supervisor
    if (user.id !== call.agentId && user.id !== call.agent.supervisorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the call
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: status || undefined,
        outcome: outcome || undefined,
        duration: duration || undefined,
        notes: notes || undefined,
        updatedAt: new Date(),
      },
      include: {
        recording: true,
      },
    });

    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('Error updating call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callId = parseInt(params.id);
    if (isNaN(callId)) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            supervisorId: true,
          },
        },
        recording: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Verify the user is the agent who handled the call or their supervisor
    if (user.id !== call.agentId && user.id !== call.agent.supervisorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 