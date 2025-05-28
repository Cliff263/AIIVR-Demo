"use client";

import Link from 'next/link';
import { Home, Activity, HelpCircle, Phone, Headphones, BarChart2, Clock, UserCheck } from 'lucide-react';
import { UserRole } from "@prisma/client";

interface AgentSidebarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
}

export default function AgentSidebar({ user }: AgentSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-blue-600 text-white shadow-lg min-h-screen">
      <div className="flex items-center h-16 px-6 font-bold text-2xl tracking-tight border-b border-blue-700">
        <span className="mr-2">AIIVR.</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <div>
          <Link href="/agent" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Home className="w-5 h-5" /> Dashboard
          </Link>
        </div>
        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">CALL MANAGEMENT</div>
        <div className="space-y-1">
          <Link href="/agent/calls" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Phone className="w-5 h-5" /> My Calls
          </Link>
          <Link href="/agent/activity" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Activity className="w-5 h-5" /> Activity Logs
          </Link>
          <Link href="/agent/queries" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <HelpCircle className="w-5 h-5" /> Assigned Queries
          </Link>
          <Link href="/agent/call-groups" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Headphones className="w-5 h-5" /> Call Groups
          </Link>
        </div>

        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">PERFORMANCE</div>
        <div className="space-y-1">
          <Link href="/agent/metrics" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <BarChart2 className="w-5 h-5" /> My Metrics
          </Link>
          <Link href="/agent/schedule" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Clock className="w-5 h-5" /> Schedule
          </Link>
          <Link href="/agent/status" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <UserCheck className="w-5 h-5" /> Status Management
          </Link>
        </div>

        <div className="mt-auto pt-8">
          <Link href="/support" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <HelpCircle className="w-5 h-5" /> Support
          </Link>
        </div>
      </nav>
    </aside>
  );
} 