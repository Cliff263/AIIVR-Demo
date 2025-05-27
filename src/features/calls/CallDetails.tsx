"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Call, CallStatus, CallOutcome } from "@prisma/client";

interface CallDetailsProps {
  call: Call;
  isSupervisor?: boolean;
}

export default function CallDetails({ call, isSupervisor = false }: CallDetailsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CallStatus>(call.status);
  const [outcome, setOutcome] = useState<CallOutcome | null>(call.outcome);
  const [notes, setNotes] = useState(call.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          outcome,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update call");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating call:", error);
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customer
                </p>
                <p className="text-lg">{call.contact || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-lg">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date
                </p>
                <p className="text-lg">{formatDate(call.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as CallStatus)}
                  disabled={isLoading || !isSupervisor}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Outcome
                </p>
                <Select
                  value={outcome || ""}
                  onValueChange={(value) =>
                    setOutcome(value as CallOutcome | null)
                  }
                  disabled={isLoading || !isSupervisor}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the call..."
                disabled={isLoading || !isSupervisor}
              />
            </div>

            {isSupervisor && (
              <Button
                onClick={handleUpdate}
                disabled={isLoading}
                className="w-full"
              >
                Update Call
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 