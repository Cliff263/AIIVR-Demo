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
    const format = searchParams.get("format") || "csv";

    const where = {
      AND: [
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {},
        action ? { action } : {},
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

    if (format === "json") {
      content = JSON.stringify(logs, null, 2);
      headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.set("Content-Disposition", `attachment; filename="activity-logs-${format(new Date(), "yyyy-MM-dd")}.json"`);
    } else {
      // CSV format
      const csvHeaders = ["Timestamp", "User", "Email", "Role", "Action", "Details", "IP Address"];
      const rows = logs.map(log => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.user.name,
        log.user.email,
        log.user.role,
        log.action,
        log.details || "",
        log.ipAddress || "",
      ]);

      content = [
        csvHeaders.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      headers = new Headers();
      headers.set("Content-Type", "text/csv");
      headers.set("Content-Disposition", `attachment; filename="activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv"`);
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