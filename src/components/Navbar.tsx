"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { User, AgentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  user: Omit<User, "passwordHash"> & {
    status?: {
      status: AgentStatus;
      pauseReason?: string;
    } | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status?: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500';
      case 'PAUSED':
        return 'bg-red-500';
      case 'OFFLINE':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusTextColor = (status?: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'text-emerald-600';
      case 'PAUSED':
        return 'text-red-600';
      case 'OFFLINE':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                className="dark:invert transition-transform group-hover:scale-105"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={24}
                priority
              />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AIIVR Demo
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => {/* Implement search logic */}}
                aria-label="Search"
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-indigo-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* User Role and Status */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
                <span className="text-sm font-medium text-gray-700">{user.role}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status?.status)}`} />
                  <span className={`text-sm font-medium ${getStatusTextColor(user.status?.status)}`}>
                    {user.status?.status || 'OFFLINE'}
                    {user.status?.pauseReason && ` (${user.status.pauseReason})`}
                  </span>
                </div>
              </div>

              {/* Profile Link */}
              <Link 
                href="/profile" 
                className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
              </Link>

              {/* Sign Out Button */}
              <form action={signOut}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-700 hover:text-red-600 hover:border-red-600"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 