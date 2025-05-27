"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/ui/icons";
import { AgentStatus } from "@prisma/client";

interface AgentStatusToggleProps {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
  socket: any;
}

export default function AgentStatusToggle({ status, setStatus, socket }: AgentStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: AgentStatus) => {
    if (!socket) return;

    setIsLoading(true);
    try {
      // Update status in database
      const response = await fetch("/api/agent/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          pauseReason: notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Emit status change to server
      socket.emit("agent:updateStatus", {
        status: newStatus,
        notes,
      });

      setStatus(newStatus);
      setIsOpen(false);
      setNotes("");
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full font-semibold border-2 border-rose-600 text-rose-700 hover:bg-rose-50 focus:ring-rose-600">
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
              variant={status === "ONLINE" ? "default" : "outline"}
              onClick={() => handleStatusChange("ONLINE")}
              disabled={isLoading}
              className={status === "ONLINE" ? "bg-rose-600 hover:bg-rose-700" : ""}
            >
              <Icons.online className="mr-2 h-4 w-4" />
              Online
            </Button>
            <Button
              variant={status === "PAUSED" ? "default" : "outline"}
              onClick={() => handleStatusChange("PAUSED")}
              disabled={isLoading}
              className={status === "PAUSED" ? "bg-rose-600 hover:bg-rose-700" : ""}
            >
              <Icons.paused className="mr-2 h-4 w-4" />
              Paused
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about your status..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 