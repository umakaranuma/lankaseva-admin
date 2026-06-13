import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  FolderTree, 
  MessageSquare, 
  AlertTriangle,
  LogOut 
} from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2>LankaSeva</h2>
          <span className="badge badge-success">Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/users" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Users
          </NavLink>
          <NavLink to="/services" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <MapPin size={20} /> Services
          </NavLink>
          <NavLink to="/categories" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderTree size={20} /> Categories
          </NavLink>
          <NavLink to="/reviews" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} /> Reviews
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={20} /> Reports
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar glass-panel">
          <h3>Admin Portal</h3>
        </div>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
