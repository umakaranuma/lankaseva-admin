import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, FolderTree,
  MessageSquare, AlertTriangle, LogOut, ChevronRight, Shield
} from 'lucide-react';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/',           end: true,  icon: LayoutDashboard, label: 'Dashboard',         color: '#38bdf8' },
  { to: '/users',      end: false, icon: Users,           label: 'Users',             color: '#818cf8' },
  { to: '/services',   end: false, icon: MapPin,          label: 'Services',          color: '#34d399' },
  { to: '/categories', end: false, icon: FolderTree,      label: 'Categories',        color: '#fb923c' },
  { to: '/reviews',    end: false, icon: MessageSquare,   label: 'Reviews',           color: '#fbbf24' },
  { to: '/reports',    end: false, icon: AlertTriangle,   label: 'Reports',           color: '#f87171' },
];

const ROUTE_TITLES: Record<string, string> = {
  '/':           'Dashboard Overview',
  '/users':      'User Management',
  '/services':   'Services Directory',
  '/categories': 'Categories',
  '/reviews':    'Review Moderation',
  '/reports':    'User Reports',
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); }
    catch { return {}; }
  })();

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Admin Portal';
  const breadcrumb = location.pathname === '/' ? ['Dashboard'] : ['Admin', ROUTE_TITLES[location.pathname]].filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar glass-panel">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Shield size={18} />
          </div>
          <div>
            <h2>LankaSeva</h2>
            <span className="brand-sub">Admin Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Navigation</p>
          {NAV_ITEMS.map(({ to, end, icon: Icon, label, color }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { '--nav-accent': color } as React.CSSProperties : {}}
            >
              <span className="nav-item-icon" style={{ color }}>
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {(adminUser.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="admin-details">
              <span className="admin-name">{adminUser.display_name || adminUser.email || 'Administrator'}</span>
              <span className="admin-role">Super Admin</span>
            </div>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar glass-panel">
          <div className="topbar-left">
            <div className="breadcrumb">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="breadcrumb-item">
                  {i > 0 && <ChevronRight size={14} style={{ opacity: 0.4 }} />}
                  <span style={{ opacity: i === breadcrumb.length - 1 ? 1 : 0.5 }}>{crumb}</span>
                </span>
              ))}
            </div>
            <h3>{pageTitle}</h3>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge badge badge-success">Live</span>
          </div>
        </div>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
