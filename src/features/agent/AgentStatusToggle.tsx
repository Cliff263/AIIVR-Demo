"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { AgentStatus, PauseReason } from "@prisma/client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Socket } from "socket.io-client";

interface AgentStatusToggleProps {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
  socket?: Socket | null;
}

export default function AgentStatusToggle({ status, setStatus, socket }: AgentStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AgentStatus | null>(null);

  const pauseOptions = useMemo(
    () => [
      { value: PauseReason.LUNCH, label: "Lunch" },
      { value: PauseReason.BATHROOM, label: "Bathroom" },
      { value: PauseReason.SMOKE, label: "Smoke" },
      { value: PauseReason.ON_LEAVE, label: "On Leave" },
      { value: PauseReason.CASE_WORK, label: "Case Work" },
      { value: PauseReason.TRAINING, label: "Training" },
      { value: PauseReason.MEETING, label: "Meeting" },
      { value: PauseReason.SYSTEM_ISSUE, label: "System Issue" },
    ],
    []
  );

  useEffect(() => {
    if (isOpen) {
      setPendingStatus(status);
      setPauseReason("");
    }
  }, [isOpen, status]);

  const handleStatusChange = async () => {
    if (!pendingStatus) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/agent/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: pendingStatus,
          pauseReason: pendingStatus === "PAUSED" ? pauseReason : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      const { status: updatedStatus } = await response.json();

      if (socket) {
        socket.emit("status-change", {
          status: pendingStatus,
          pauseReason: pendingStatus === "PAUSED" ? pauseReason : undefined,
        });
      }

      setStatus(updatedStatus || pendingStatus);
      setIsOpen(false);
      setPauseReason("");
      setPendingStatus(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-end w-full">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="font-semibold border-2 border-rose-600 text-rose-700 hover:bg-rose-50 focus:ring-rose-600 w-auto min-w-[120px]"
          >
            <Icons.refresh className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Agent Status</DialogTitle>
            <DialogDescription>
              Change your current status and add any relevant notes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={pendingStatus === "ONLINE" ? "default" : "outline"}
                onClick={() => { setPendingStatus("ONLINE"); setPauseReason(""); }}
                disabled={isLoading}
                className={
                  (pendingStatus === "ONLINE" ? "bg-green-600 hover:bg-green-700 text-white" : "") +
                  " flex-1"
                }
              >
                <Icons.online className="mr-2 h-4 w-4" />
                Online
              </Button>
              <Button
                variant={pendingStatus === "PAUSED" ? "default" : "outline"}
                onClick={() => setPendingStatus("PAUSED")}
                disabled={isLoading}
                className={
                  (pendingStatus === "PAUSED" ? "bg-red-600 hover:bg-red-700 text-white" : "") +
                  " flex-1"
                }
              >
                <Icons.paused className="mr-2 h-4 w-4" />
                Paused
              </Button>
            </div>
            {pendingStatus === "PAUSED" && (
              <div className="grid gap-2">
                <Label htmlFor="pause-reason">Pause Reason</Label>
                <Select value={pauseReason || undefined} onValueChange={(value) => setPauseReason(value as PauseReason)}>
                  <SelectTrigger id="pause-reason" className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {pauseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={handleStatusChange}
              disabled={isLoading || (pendingStatus === "PAUSED" && !pauseReason) || !pendingStatus}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoading ? "Updating..." : "Confirm"}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 