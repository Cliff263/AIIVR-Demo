import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let queries;
    if (user.role === 'AGENT') {
      // Agents can only see their own queries
      queries = await prisma.query.findMany({
        where: {
          assignedToId: user.id
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Supervisors can see all queries
      queries = await prisma.query.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, assignedTo } = body;

    const query = await prisma.query.create({
      data: {
        title,
        description,
        status,
        priority,
        assignedToId: assignedTo,
        createdById: user.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(query);
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 