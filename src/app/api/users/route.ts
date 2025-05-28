import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 