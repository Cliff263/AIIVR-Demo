import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total number of agents
    const totalAgents = await prisma.user.count({
      where: {
        role: 'AGENT'
      }
    });

    // Get number of active agents (ONLINE status)
    const activeAgents = await prisma.user.count({
      where: {
        role: 'AGENT',
        status: 'ONLINE'
      }
    });

    return NextResponse.json({
      totalAgents,
      activeAgents
    });
  } catch (error) {
    console.error('Error fetching agent counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent counts' },
      { status: 500 }
    );
  }
} 