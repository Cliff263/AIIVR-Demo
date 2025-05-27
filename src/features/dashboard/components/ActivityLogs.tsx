"use client";

import { useEffect, useState } from "react";
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
  "CALL_STARTED",
  "CALL_ENDED",
  "PASSWORD_RESET",
  "PROFILE_UPDATE",
  "SETTINGS_CHANGE",
  "PERMISSION_CHANGE",
] as const;

// Add prop interface for ActivityLogs
interface ActivityLogsProps {
  userId: number;
  role: 'AGENT' | 'SUPERVISOR';
}

// Update function signature to accept props
export function ActivityLogs({ userId, role }: ActivityLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
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

  const fetchLogs = async () => {
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
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

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
  }, [page, search, selectedAction, selectedRole, startDate, endDate, autoRefresh]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (log: any) => {
      setLogs((prevLogs) => [log, ...prevLogs].slice(0, 10));
    };

    socket.on("activity-log", handleNewLog);

    return () => {
      socket.off("activity-log", handleNewLog);
    };
  }, [socket]);

  const getActionColor = (action: string) => {
    switch (action) {
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
    <Card className="border-rose-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-rose-600">Activity Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="flex items-center gap-2 border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs border-rose-200 focus:border-rose-300 focus:ring-rose-300"
            />
            <Select value={selectedAction === '' ? 'all' : selectedAction} onValueChange={v => setSelectedAction(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] border-rose-200 focus:border-rose-300 focus:ring-rose-300">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole === '' ? 'all' : selectedRole} onValueChange={v => setSelectedRole(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] border-rose-200 focus:border-rose-300 focus:ring-rose-300">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <RadixPopover.Root>
                <RadixPopover.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </RadixPopover.Trigger>
                <RadixPopover.Content className="w-auto p-0 bg-white rounded shadow-lg border border-rose-200">
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
                    className="w-[240px] justify-start text-left font-normal border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </RadixPopover.Trigger>
                <RadixPopover.Content className="w-auto p-0 bg-white rounded shadow-lg border border-rose-200">
                  <DayPicker
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </RadixPopover.Content>
              </RadixPopover.Root>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
            </Button>
          </div>

          <div className="rounded-md border border-rose-200">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b border-rose-200">
                  <tr className="border-b transition-colors hover:bg-rose-50/50 data-[state=selected]:bg-rose-50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-rose-900">Time</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-rose-900">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-rose-900">Action</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-rose-900">Details</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-rose-900">IP Address</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-rose-100 transition-colors hover:bg-rose-50/50 data-[state=selected]:bg-rose-50"
                    >
                      <td className="p-4 align-middle text-gray-900">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td className="p-4 align-middle">
                        <div>
                          <div className="font-medium text-gray-900">{log.user.name}</div>
                          <div className="text-sm text-rose-600">
                            {log.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-gray-900">{log.details}</td>
                      <td className="p-4 align-middle text-gray-900">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-rose-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
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