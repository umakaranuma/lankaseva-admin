import { useEffect, useState } from 'react';
import { Users, Activity, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import './Dashboard.css';

interface Stats {
  total_users: number;
  active_users: number;
  admin_users: number;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('auth/admin/users/stats/');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p className="text-secondary">High-level statistics of LankaSeva Platform.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">{loading ? '...' : stats?.total_users}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper green">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Users</p>
            <h3 className="stat-value">{loading ? '...' : stats?.active_users}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper purple">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Administrators</p>
            <h3 className="stat-value">{loading ? '...' : stats?.admin_users}</h3>
          </div>
        </div>
      </div>

      <div className="welcome-banner glass-panel">
        <div className="banner-content">
          <h3>Welcome to the Admin Portal</h3>
          <p className="text-secondary">
            Use the sidebar to navigate through the management interfaces. 
            You can suspend users, moderate reviews, manage the services directory, and view user reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
