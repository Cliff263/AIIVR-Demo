import { NextResponse } from "next/server";
import { getCurrentSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, note } = body;

    const query = await prisma.query.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(note ? {
          notes: {
            create: {
              content: note,
              createdById: user.id,
            },
          },
        } : {}),
      },
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
    });

    return NextResponse.json(query);
  } catch (error) {
    console.error('Error updating query:', error);
    return NextResponse.json(
      { error: "Failed to update query" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    
    if (!user || user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.query.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting query:', error);
    return NextResponse.json(
      { error: "Failed to delete query" },
      { status: 500 }
    );
  }
} 