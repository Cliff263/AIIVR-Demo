import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all notifications from the last 24 hours
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
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