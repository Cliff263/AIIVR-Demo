import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import prisma from '@/lib/prisma';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';

// Helper to get the socket.io instance from the global object
function getSocketServer() {
  // @ts-ignore
  if (global.io) return global.io;
  return null;
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const calls = await prisma.call.findMany({
      where: {
        agentId: user.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        agent: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, phoneNumber, duration, recordingUrl, status, notes } = body;

    const call = await prisma.call.create({
      data: {
        type,
        phoneNumber,
        duration,
        recordingUrl,
        status,
        notes,
        agentId: user.id,
        timestamp: new Date()
      }
    });

    // Emit socket event for real-time updates
    const io = getSocketServer();
    if (io) {
      io.emit('call-created', call);
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error creating call:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 