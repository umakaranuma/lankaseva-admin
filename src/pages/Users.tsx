import { useEffect, useState } from 'react';
import { UserX, UserCheck, Shield } from 'lucide-react';
import api from '../lib/api';

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

  const fetchUsers = async () => {
    try {
      const res = await api.get('auth/admin/users/');
      setUsers(res.data.results || res.data); // Handle both paginated and non-paginated
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (user: User) => {
    try {
      await api.patch(`auth/admin/users/${user.id}/`, {
        is_active: !user.is_active
      });
      // Update local state
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user status.');
    }
  };

  return (
    <div className="users-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2>User Management</h2>
        <p className="text-secondary">View and manage all registered users.</p>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Display Name</th>
                <th>Phone Hash (Prefix)</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td style={{ fontWeight: 500 }}>{user.display_name}</td>
                  <td><code style={{ fontSize: '12px' }}>{user.phone_hash.substring(0, 8)}...</code></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge badge-success"><Shield size={12} style={{ display: 'inline', marginRight: '4px' }}/> Admin</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>User</span>
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
                        onClick={() => toggleUserStatus(user)}
                        className={`btn ${user.is_active ? 'btn-ghost text-danger' : 'btn-ghost text-success'}`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        {user.is_active ? <><UserX size={16} /> Suspend</> : <><UserCheck size={16} /> Activate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;
