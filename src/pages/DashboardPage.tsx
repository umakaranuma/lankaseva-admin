import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Activity, ShieldCheck, MapPin,
  MessageSquare, AlertTriangle, ArrowRight, Clock
} from 'lucide-react';
import api from '../lib/api';
import './Dashboard.css';

interface Stats {
  total_users: number;
  active_users: number;
  admin_users: number;
}

interface CardData {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  colorClass: string;
  link: string;
}

const DashboardPage = () => {
  const [userStats, setUserStats] = useState<Stats | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number | null>(null);
  const [pendingReports, setPendingReports] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        api.get('auth/admin/users/stats/'),
        api.get('services/?limit=1'),
        api.get('reviews/?limit=1'),
        api.get('reports/?status=pending&limit=1'),
      ]);

      if (results[0].status === 'fulfilled') setUserStats(results[0].value.data);
      if (results[1].status === 'fulfilled') {
        const d = results[1].value.data;
        setServicesCount(d.count ?? (Array.isArray(d) ? d.length : null));
      }
      if (results[2].status === 'fulfilled') {
        const d = results[2].value.data;
        setReviewsCount(d.count ?? (Array.isArray(d) ? d.length : null));
      }
      if (results[3].status === 'fulfilled') {
        const d = results[3].value.data;
        setPendingReports(d.count ?? (Array.isArray(d) ? d.length : null));
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const val = (n: number | null) => loading ? null : n;

  const cards: CardData[] = [
    { label: 'Total Users',      value: val(userStats?.total_users ?? null),  icon: <Users size={22} />,         colorClass: 'blue',    link: '/users' },
    { label: 'Active Users',     value: val(userStats?.active_users ?? null), icon: <Activity size={22} />,      colorClass: 'green',   link: '/users' },
    { label: 'Administrators',   value: val(userStats?.admin_users ?? null),  icon: <ShieldCheck size={22} />,   colorClass: 'purple',  link: '/users' },
    { label: 'Services Listed',  value: val(servicesCount),                   icon: <MapPin size={22} />,        colorClass: 'teal',    link: '/services' },
    { label: 'Total Reviews',    value: val(reviewsCount),                    icon: <MessageSquare size={22} />, colorClass: 'amber',   link: '/reviews' },
    { label: 'Pending Reports',  value: val(pendingReports),                  icon: <AlertTriangle size={22} />, colorClass: 'red',     link: '/reports' },
  ];

  const quickActions = [
    { label: 'Manage Users',     icon: <Users size={20} />,         color: '#818cf8', bg: 'rgba(129,140,248,0.12)', to: '/users' },
    { label: 'Add Service',      icon: <MapPin size={20} />,        color: '#34d399', bg: 'rgba(52,211,153,0.12)',  to: '/services' },
    { label: 'Moderate Reviews', icon: <MessageSquare size={20} />, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  to: '/reviews' },
    { label: 'Review Reports',   icon: <AlertTriangle size={20} />, color: '#f87171', bg: 'rgba(248,113,113,0.12)', to: '/reports' },
  ];

  return (
    <div className="dashboard">
      {/* Stat Cards */}
      <div className="stats-grid">
        {cards.map(card => (
          <Link to={card.link} key={card.label} className="stat-card glass-panel" style={{ textDecoration: 'none' }}>
            <div className={`stat-icon-wrapper ${card.colorClass}`}>
              {card.icon}
            </div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <h3 className="stat-value">
                {card.value === null ? (
                  <span className="stat-skeleton" />
                ) : (
                  card.value.toLocaleString()
                )}
              </h3>
            </div>
            {card.colorClass === 'red' && (card.value ?? 0) > 0 && (
              <div className="stat-alert-dot" />
            )}
          </Link>
        ))}
      </div>

      {/* Pending Reports Alert */}
      {(pendingReports ?? 0) > 0 && !loading && (
        <Link to="/reports" className="alert-banner glass-panel" style={{ textDecoration: 'none' }}>
          <div className="alert-banner-icon">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="alert-banner-title">{pendingReports} pending report{pendingReports! > 1 ? 's' : ''} need attention</p>
            <p className="alert-banner-sub">Review and update status to keep the board clean.</p>
          </div>
          <ArrowRight size={18} className="alert-banner-arrow" />
        </Link>
      )}

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h4 className="section-heading">Quick Actions</h4>
        <div className="quick-actions-grid">
          {quickActions.map(action => (
            <Link key={action.label} to={action.to} className="quick-action-card glass-panel" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="quick-action-icon" style={{ background: action.bg, color: action.color }}>
                {action.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{action.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Go to section</p>
              </div>
              <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="welcome-banner glass-panel">
        <div className="welcome-banner-icon">
          <Clock size={22} style={{ color: '#38bdf8' }} />
        </div>
        <div>
          <h3>LankaSeva Admin Console</h3>
          <p className="text-secondary">
            Use the sidebar to navigate. You can suspend users, moderate reviews, manage the
            services directory, manage categories, and triage user reports. All changes take
            effect immediately on the mobile app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
