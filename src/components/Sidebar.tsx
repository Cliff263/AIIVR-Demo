"use client";

import Link from 'next/link';
import { Home, BarChart2, Activity, Zap, Server, Users, Phone, Grid, Settings, PhoneCall, Layers, Headphones, HelpCircle } from 'lucide-react';
import { UserRole } from "@prisma/client";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isAgent = user?.role === 'AGENT';

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-blue-600 text-white shadow-lg min-h-screen">
      <div className="flex items-center h-16 px-6 font-bold text-2xl tracking-tight border-b border-blue-700">
        <span className="mr-2">AIIVR.</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <div>
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Home className="w-5 h-5" /> Home
          </Link>
        </div>
        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">REPORTING</div>
        <div className="space-y-1">
          <Link href="/supervisor/activity" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Activity className="w-5 h-5" /> Activity Logs
          </Link>
          {isSupervisor && (
            <Link href="/supervisor/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <BarChart2 className="w-5 h-5" /> Analytics
            </Link>
          )}
          {isSupervisor && (
            <Link href="/supervisor/live" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Zap className="w-5 h-5" /> Live Monitoring
            </Link>
          )}
           {isAgent && (
            <Link href="/dashboard/queries" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <HelpCircle className="w-5 h-5" /> Assigned Queries
            </Link>
          )}
           {isSupervisor && (
            <Link href="/supervisor/queries" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <HelpCircle className="w-5 h-5" /> Query Management
            </Link>
          )}
        </div>

        {isSupervisor && (
          <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">ADMINISTRATION</div>
        )}
        <div className="space-y-1">
          {isSupervisor && (
            <Link href="/dashboard/api" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Server className="w-5 h-5" /> API
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/integrations" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Settings className="w-5 h-5" /> Integrations
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Users className="w-5 h-5" /> Users
            </Link>
          )}
           {isSupervisor && (
            <Link href="/dashboard/numbers" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Phone className="w-5 h-5" /> Numbers
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/sip-trunks" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <PhoneCall className="w-5 h-5" /> SIP Trunks
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/ivr" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Grid className="w-5 h-5" /> IVR
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/teams" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Layers className="w-5 h-5" /> Teams
            </Link>
          )}
          {isSupervisor && (
            <Link href="/dashboard/call-groups" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Headphones className="w-5 h-5" /> Call Groups
            </Link>
          )}
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