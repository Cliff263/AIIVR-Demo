"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Call, CallStatus, CallOutcome } from "@prisma/client";

interface CallListProps {
  calls: Call[];
}

export default function CallList({ calls }: CallListProps) {
  const router = useRouter();
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "MISSED":
        return "bg-red-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow
              key={call.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                setSelectedCall(call.id);
                router.push(`/calls/${call.id}`);
              }}
            >
              <TableCell>{call.customerName}</TableCell>
              <TableCell>
                <Badge
                  className={`${getStatusColor(call.status)} text-white`}
                >
                  {call.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDuration(call.duration)}</TableCell>
              <TableCell>{call.outcome || "N/A"}</TableCell>
              <TableCell>{formatDate(call.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 