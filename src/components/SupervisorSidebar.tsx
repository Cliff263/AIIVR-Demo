"use client";

import Link from 'next/link';
import { Home, BarChart2, Activity, Zap, Server, Users, Phone, Grid, Settings, PhoneCall, Layers, Headphones, HelpCircle, UserCheck, Clock, LineChart } from 'lucide-react';
import { UserRole } from "@prisma/client";

interface SupervisorSidebarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
}

export default function SupervisorSidebar({ user }: SupervisorSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-blue-600 text-white shadow-lg min-h-screen">
      <div className="flex items-center h-16 px-6 font-bold text-2xl tracking-tight border-b border-blue-700">
        <span className="mr-2">AIIVR.</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        <div>
          <Link href="/supervisor" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Home className="w-5 h-5" /> Dashboard
          </Link>
        </div>
        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">MONITORING</div>
        <div className="space-y-1">
          <Link href="/supervisor/live" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Zap className="w-5 h-5" /> Live Monitoring
          </Link>
          <Link href="/supervisor/activity" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Activity className="w-5 h-5" /> Activity Logs
          </Link>
          <Link href="/supervisor/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <BarChart2 className="w-5 h-5" /> Analytics
          </Link>
          <Link href="/supervisor/queries" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <HelpCircle className="w-5 h-5" /> Query Management
          </Link>
        </div>

        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">TEAM MANAGEMENT</div>
        <div className="space-y-1">
          <Link href="/supervisor/agents" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Users className="w-5 h-5" /> Agents
          </Link>
          <Link href="/supervisor/teams" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Layers className="w-5 h-5" /> Teams
          </Link>
          <Link href="/supervisor/schedules" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Clock className="w-5 h-5" /> Schedules
          </Link>
          <Link href="/supervisor/performance" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <LineChart className="w-5 h-5" /> Performance
          </Link>
        </div>

        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">SYSTEM</div>
        <div className="space-y-1">
          <Link href="/supervisor/call-groups" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Headphones className="w-5 h-5" /> Call Groups
          </Link>
          <Link href="/supervisor/ivr" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Grid className="w-5 h-5" /> IVR
          </Link>
          <Link href="/supervisor/numbers" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Phone className="w-5 h-5" /> Numbers
          </Link>
          <Link href="/supervisor/sip-trunks" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <PhoneCall className="w-5 h-5" /> SIP Trunks
          </Link>
        </div>

        <div className="text-xs font-semibold text-blue-200 px-4 mt-6 mb-2">SETTINGS</div>
        <div className="space-y-1">
          <Link href="/supervisor/api" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Server className="w-5 h-5" /> API
          </Link>
          <Link href="/supervisor/integrations" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="w-5 h-5" /> Integrations
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