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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where = {
      ...(status && status !== 'all' ? { status } : {}),
      ...(priority && priority !== 'all' ? { priority } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const queries = await prisma.query.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    
    if (!user || user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, assignedToId } = body;

    const query = await prisma.query.create({
      data: {
        title,
        description,
        priority,
        status: 'OPEN',
        assignedToId,
        notes: {
          create: {
            content: 'Query created',
            createdById: user.id,
          },
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        notes: true,
      },
    });

    return NextResponse.json(query);
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json(
      { error: "Failed to create query" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    const query = await prisma.query.update({
      where: { id },
      data: {
        status,
        notes: {
          push: notes
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json(query);
  } catch (error) {
    console.error('Error updating query:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 