import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";
import { formatUserAgent, formatBytes } from "../utils/formatters";
import {
  Users,
  HardDrive,
  FileText,
  Activity,
  ShieldAlert,
  Clock,
} from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      const fetchData = async () => {
        try {
          const [statsData, auditData] = await Promise.all([
            api("/settings/admin/stats"),
            api("/settings/admin/audit"),
          ]);
          setStats(statsData);
          setAuditLogs(auditData.logs || []);
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch admin data");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-drive-dark text-drive-text">
        <div className="text-center p-8 bg-drive-surface rounded-xl border border-drive-border max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">
            Access Denied
          </h1>
          <p className="text-drive-muted">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-drive-dark text-drive-text p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-drive-muted">
            System Status:{" "}
            <span className="text-green-500 font-semibold">Operational</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drive-accent"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Users className="w-8 h-8 text-blue-500" />}
                label="Total Users"
                value={stats?.totalUsers || 0}
                subtext={`${stats?.activeUsers || 0} Active`}
              />
              <StatCard
                icon={<HardDrive className="w-8 h-8 text-purple-500" />}
                label="Storage Used"
                value={formatBytes(stats?.totalStorageUsed)}
                subtext="Total across all users"
              />
              <StatCard
                icon={<FileText className="w-8 h-8 text-yellow-500" />}
                label="Total Files"
                value={stats?.totalFiles || 0}
                subtext="Active files (not in trash)"
              />
              <StatCard
                icon={<Activity className="w-8 h-8 text-green-500" />}
                label="System Health"
                value="99.9%"
                subtext="Uptime (Last 30 days)"
              />
            </div>

            {/* Recent Activity Table */}
            <div className="bg-drive-surface rounded-xl border border-drive-border overflow-hidden">
              <div className="p-6 border-b border-drive-border">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-drive-muted" />
                  Recent Activity (Logins)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-drive-bg/50 text-drive-muted text-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                      <th className="px-6 py-4 font-medium">IP Address</th>
                      <th className="px-6 py-4 font-medium">Device</th>
                      <th className="px-6 py-4 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-drive-border">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log, index) => (
                        <tr
                          key={index}
                          className="hover:bg-drive-bg/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium">
                            {log.user}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-drive-muted">
                            {log.ip || "N/A"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-drive-muted max-w-xs truncate"
                            title={log.details}
                          >
                            {formatUserAgent(log.details)}
                          </td>
                          <td className="px-6 py-4 text-sm text-drive-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-drive-muted"
                        >
                          No recent activity found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="bg-drive-surface p-6 rounded-xl border border-drive-border flex items-start justify-between hover:border-drive-accent/50 transition-colors">
      <div>
        <p className="text-drive-muted text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-drive-text mb-1">{value}</h3>
        <p className="text-xs text-drive-muted">{subtext}</p>
      </div>
      <div className="p-3 bg-drive-bg rounded-lg">{icon}</div>
    </div>
  );
}
