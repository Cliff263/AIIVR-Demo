import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/actions/auth';

export async function GET() {
  try {
    // Get the current user and their role
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    // Fetch notifications visible to this role
    const notifications = await prisma.notification.findMany({
      where: {
        visibleTo: user.role
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        timestamp: notification.createdAt,
        read: notification.read
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 