import ActivityLogs from "./components/ActivityLogs";

export default function SupervisorDashboard() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentStatus />
        <CallMetrics />
      </div>

      <div className="mt-8">
        <ActivityLogs />
      </div>
    </div>
  );
} 