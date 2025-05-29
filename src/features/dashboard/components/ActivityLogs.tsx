"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import * as RadixPopover from '@radix-ui/react-popover';
import { CalendarIcon, FileJson, FileText } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "REGISTER",
  "STATUS_CHANGE",
  "STATUS_CHANGE_BY_SUPERVISOR",
  "STATUS_CHANGE_TO_ONLINE",
  "STATUS_CHANGE_TO_OFFLINE",
  "STATUS_CHANGE_TO_PAUSED",
  "CALL_STARTED",
  "CALL_ENDED",
  "PASSWORD_RESET",
  "PROFILE_UPDATE",
  "SETTINGS_CHANGE",
  "PERMISSION_CHANGE",
  "METRIC_UPDATE",
  "PERFORMANCE_UPDATE",
  "QUERY_ASSIGNED",
  "QUERY_UPDATED",
  "QUERY_RESOLVED",
  "SUPERVISOR_INTERVENTION",
] as const;

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

interface ActivityLogsProps {
  userId: number;
  role: 'AGENT' | 'SUPERVISOR';
}

export function ActivityLogs({ userId, role }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { socket } = useSocket(userId, role);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(selectedAction && { action: selectedAction }),
        ...(selectedRole && { role: selectedRole }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`/api/activity-logs?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedAction, selectedRole, startDate, endDate]);

  const handleExport = async (fileFormat: "csv" | "json") => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(selectedAction && { action: selectedAction }),
        ...(selectedRole && { role: selectedRole }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
        format: fileFormat,
      });

      const response = await fetch(`/api/activity-logs/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.${fileFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported logs as ${fileFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to export logs:", error);
      toast.error("Failed to export logs");
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 30000);
    }
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

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
      case "REGISTER":
        return "bg-blue-500";
      case "STATUS_CHANGE":
        return "bg-yellow-500";
      case "CALL_STARTED":
        return "bg-purple-500";
      case "CALL_ENDED":
        return "bg-pink-500";
      case "PASSWORD_RESET":
        return "bg-red-500";
      case "PROFILE_UPDATE":
        return "bg-indigo-500";
      case "SETTINGS_CHANGE":
        return "bg-orange-500";
      case "PERMISSION_CHANGE":
        return "bg-cyan-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-600">Activity Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 text-black border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <FileText className=" h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="flex items-center text-black gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <FileJson className=" h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] border-blue-200 focus:border-blue-300 focus:ring-blue-300 text-gray-900 placeholder-gray-500"
            />

            {/* Filter Options */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedAction === '' ? 'all' : selectedAction} onValueChange={v => setSelectedAction(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px] border-blue-200 focus:border-blue-300 focus:ring-blue-300 text-gray-900">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole === '' ? 'all' : selectedRole} onValueChange={v => setSelectedRole(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px] border-blue-200 focus:border-blue-300 focus:ring-blue-300 text-gray-900">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>

              <RadixPopover.Root>
                <RadixPopover.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-gray-900"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </RadixPopover.Trigger>
                <RadixPopover.Content className="w-auto p-0 bg-white rounded shadow-lg border border-blue-200">
                  <DayPicker
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </RadixPopover.Content>
              </RadixPopover.Root>

              <RadixPopover.Root>
                <RadixPopover.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-gray-900"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </RadixPopover.Trigger>
                <RadixPopover.Content className="w-auto p-0 bg-white rounded shadow-lg border border-blue-200">
                  <DayPicker
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </RadixPopover.Content>
              </RadixPopover.Root>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-gray-900"
              >
                {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-blue-200">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b border-blue-200">
                  <tr className="border-b transition-colors hover:bg-blue-50/50 data-[state=selected]:bg-blue-50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Time</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Description</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-blue-100 transition-colors hover:bg-blue-50/50 data-[state=selected]:bg-blue-50"
                      >
                        <td className="p-4 align-middle text-gray-900">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium text-gray-900">{log.user.name}</div>
                            <div className="text-sm text-blue-600">
                              {log.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge className={getActionColor(log.type)}>
                            {log.type}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-gray-900">{log.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 text-gray-900"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="border-blue-200 hover:bg-blue-50 hover:hover:text-blue-600 disabled:opacity-50 text-gray-900"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 