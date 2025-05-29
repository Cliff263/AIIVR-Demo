"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { UserRole } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsProps {
  userRole: UserRole;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Analytics({ userRole }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data - Replace with actual API calls
  const callVolumeData = [
    { time: '00:00', calls: 4 },
    { time: '04:00', calls: 3 },
    { time: '08:00', calls: 8 },
    { time: '12:00', calls: 12 },
    { time: '16:00', calls: 10 },
    { time: '20:00', calls: 6 },
  ];

  const handleTimeData = [
    { name: '0-2 min', value: 30 },
    { name: '2-5 min', value: 45 },
    { name: '5-10 min', value: 20 },
    { name: '10+ min', value: 5 },
  ];

  const satisfactionData = [
    { month: 'Jan', score: 4.2 },
    { month: 'Feb', score: 4.3 },
    { month: 'Mar', score: 4.1 },
    { month: 'Apr', score: 4.4 },
    { month: 'May', score: 4.5 },
    { month: 'Jun', score: 4.6 },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // TODO: Implement actual API calls here
        // const response = await fetch('/api/analytics');
        // const data = await response.json();
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-blue-900">Analytics Dashboard</h2>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="today" className="font-bold text-blue-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Today</TabsTrigger>
            <TabsTrigger value="week" className="font-bold text-blue-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white">This Week</TabsTrigger>
            <TabsTrigger value="month" className="font-bold text-blue-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-100 to-green-300 border-green-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-900">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-900">1,234</div>
            <p className="text-sm text-green-800">
              +12% from last period
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-100 to-purple-300 border-purple-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-900">Average Handle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-900">4m 32s</div>
            <p className="text-sm text-purple-800">
              -5% from last period
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-yellow-900">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-yellow-900">4.5/5</div>
            <p className="text-sm text-yellow-800">
              +0.2 from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-900">Call Volume by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolumeData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <YAxis tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <Tooltip contentStyle={{ fontWeight: 'bold', fontSize: 16 }} />
                  <Bar dataKey="calls" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-900">Handle Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={handleTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {handleTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontWeight: 'bold', fontSize: 16 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-900">Customer Satisfaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={satisfactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <YAxis domain={[3.5, 5]} tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <Tooltip contentStyle={{ fontWeight: 'bold', fontSize: 16 }} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-900">First Call Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { category: 'Resolved', value: 85 },
                  { category: 'Escalated', value: 15 },
                ]} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <YAxis tick={{ fontWeight: 'bold', fontSize: 14, fill: '#1e3a8a' }} />
                  <Tooltip contentStyle={{ fontWeight: 'bold', fontSize: 16 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 