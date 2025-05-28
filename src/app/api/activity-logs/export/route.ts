import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "SUPERVISOR") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const action = searchParams.get("action") || "";
    const role = searchParams.get("role") || "";
    const fileFormat = searchParams.get("format") || "csv";

    const where = {
      AND: [
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {},
        action ? { type: action } : {},
        role ? { user: { role } } : {},
      ],
    };

    const logs = await prisma.userActivityLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let content: string;
    let headers: Headers;

    if (fileFormat === "csv") {
      content = logs.map(log => {
        return [
          format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
          log.user.name,
          log.user.email,
          log.user.role,
          log.type,
          log.description
        ].join(",");
      }).join("\n");

      headers = new Headers({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv"`
      });
    } else {
      content = JSON.stringify(logs.map(log => ({
        timestamp: format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        userName: log.user.name,
        userEmail: log.user.email,
        userRole: log.user.role,
        type: log.type,
        description: log.description
      })), null, 2);

      headers = new Headers({
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="activity-logs-${format(new Date(), "yyyy-MM-dd")}.json"`
      });
    }

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to export activity logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 