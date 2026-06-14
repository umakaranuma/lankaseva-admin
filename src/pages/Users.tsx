import { useEffect, useState, useMemo } from 'react';
import { UserX, UserCheck, Shield, Search, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface User {
  id: number;
  phone_hash: string;
  display_name: string;
  created_at: string;
  is_active: boolean;
  is_admin: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<{ user: User } | null>(null);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('auth/admin/users/');
      setUsers(res.data.results || res.data);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.display_name?.toLowerCase().includes(q) ||
      u.phone_hash?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const doToggle = async (user: User) => {
    try {
      await api.patch(`auth/admin/users/${user.id}/`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast(
        `${user.display_name} has been ${user.is_active ? 'suspended' : 'activated'}`,
        user.is_active ? 'warning' : 'success'
      );
    } catch {
      toast('Failed to update user status', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            User Management
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>View and manage all registered users.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or phone hash..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-meta">
        <span className="table-meta-count">
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${users.length} users`}
        </span>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem' }}>{search ? `No users matching "${search}"` : 'No users found.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Display Name</th>
                <th>Phone Hash</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user.id}</td>
                  <td style={{ fontWeight: 600 }}>{user.display_name || '—'}</td>
                  <td>
                    <code style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      {user.phone_hash?.substring(0, 10)}...
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge badge-info">
                        <Shield size={11} style={{ marginRight: '4px' }} /> Admin
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>User</span>
                    )}
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Suspended</span>
                    )}
                  </td>
                  <td>
                    {!user.is_admin && (
                      <button
                        onClick={() => setConfirm({ user })}
                        className={`btn btn-ghost ${user.is_active ? 'text-danger' : 'text-success'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                      >
                        {user.is_active ? <><UserX size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.user.is_active ? `Suspend ${confirm.user.display_name}?` : `Activate ${confirm.user.display_name}?`}
          detail={confirm.user.is_active ? 'This user will lose access to the app immediately.' : 'This user will regain full access to the app.'}
          confirmLabel={confirm.user.is_active ? 'Suspend' : 'Activate'}
          onConfirm={() => doToggle(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default Users;
