import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If user is an agent, they can only view their own metrics
    if (user.role === 'AGENT' && user.id !== agentId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const where = {
      ...(agentId ? { agentId } : {}),
      timestamp: {
        ...(startDate && endDate ? {
          gte: new Date(startDate),
          lte: new Date(endDate)
        } : {})
      }
    };

    const calls = await prisma.call.findMany({
      where,
      include: {
        agent: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate metrics
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((acc, call) => acc + (call.duration || 0), 0);
    const averageHandleTime = totalCalls > 0 ? totalDuration / totalCalls : 0;

    // Calculate daily calls
    const dailyCalls = calls.reduce((acc: any, call) => {
      const date = new Date(call.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Calculate handle time by type
    const handleTimeByType = calls.reduce((acc: any, call) => {
      acc[call.type] = (acc[call.type] || 0) + (call.duration || 0);
      return acc;
    }, {});

    const metrics = {
      callsHandled: totalCalls,
      averageHandleTime,
      firstCallResolution: 85, // This would need to be calculated based on your business logic
      customerSatisfaction: 92, // This would need to be calculated based on your business logic
      dailyCalls: Object.entries(dailyCalls).map(([day, calls]) => ({
        day,
        calls
      })),
      handleTimeByType: Object.entries(handleTimeByType).map(([type, time]) => ({
        type,
        time: time as number
      }))
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 