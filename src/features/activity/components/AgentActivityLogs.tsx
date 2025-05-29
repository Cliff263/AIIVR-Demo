import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  createdAt: string;
  type: string;
  description: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface AgentActivityLogsProps {
  userId: string;
}

export function AgentActivityLogs({ userId }: AgentActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket(userId, 'AGENT');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ userId });
      const response = await fetch(`/api/activity-logs?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (log: ActivityLog) => {
      setLogs((prevLogs) => [log, ...prevLogs].slice(0, 10));
    };
    socket.on("activity-log", handleNewLog);
    return () => {
      socket.off("activity-log", handleNewLog);
    };
  }, [socket]);

  const getActionColor = (type: string) => {
    switch (type) {
      case "LOGIN":
        return "bg-green-500";
      case "LOGOUT":
        return "bg-gray-500";
      case "STATUS_CHANGE":
        return "bg-yellow-500";
      case "CALL_STARTED":
        return "bg-purple-500";
      case "CALL_ENDED":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="text-blue-600">My Activity Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activity logs found.</div>
        ) : (
          <ul className="divide-y divide-blue-50">
            {logs.map((log) => (
              <li key={log.id} className="py-3 flex items-center gap-4">
                <Badge className={`text-white ${getActionColor(log.type)}`}>{log.type.replace(/_/g, ' ')}</Badge>
                <div className="flex-1">
                  <div className="text-sm text-blue-900 font-semibold">{log.description}</div>
                  <div className="text-xs text-blue-400">{format(new Date(log.createdAt), "PPpp")}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 