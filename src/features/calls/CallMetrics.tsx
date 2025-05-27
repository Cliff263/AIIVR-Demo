"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

interface CallMetricsProps {
  metrics: {
    totalCalls: number;
    averageHandleTime: number;
    missedCalls: number;
  };
}

export default function CallMetrics({ metrics }: CallMetricsProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Icons.phoneCall className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-600">
                Total Calls
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{metrics.totalCalls}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Icons.waiting className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-600">
                Average Handle Time
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatDuration(metrics.averageHandleTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Icons.phoneOff className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-600">
                Missed Calls
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{metrics.missedCalls}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 