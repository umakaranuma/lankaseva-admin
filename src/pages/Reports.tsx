import { useEffect, useState } from 'react';
import { Flag, AlertCircle, Trash2 } from 'lucide-react';
import api from '../lib/api';

interface User {
  id: number;
  display_name: string;
}

interface Service {
  id: number;
  name_en: string;
}

interface Report {
  id: number;
  user: User | null;
  service: Service | null;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('reports/');
      setReports(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`reports/${id}/`);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete report.');
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = 'rgba(100, 116, 139, 0.1)';
    let color = '#64748b';
    
    if (status === 'resolved') {
      bg = 'rgba(16, 185, 129, 0.1)';
      color = '#10b981';
    } else if (status === 'pending') {
      bg = 'rgba(245, 158, 11, 0.1)';
      color = '#f59e0b';
    }

    return (
      <span style={{ 
        color, 
        background: bg, 
        padding: '0.2rem 0.5rem', 
        borderRadius: '4px', 
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="reports-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2><Flag size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> User Reports</h2>
        <p className="text-secondary">View and manage problem reports submitted by users.</p>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No reports found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Description</th>
                <th>User</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td style={{ fontWeight: 500 }}>{report.service?.name_en || 'General'}</td>
                  <td>{report.report_type.replace(/_/g, ' ').toUpperCase()}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={report.description}>
                    {report.description || '-'}
                  </td>
                  <td>{report.user?.display_name || 'Anonymous'}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(report.id)}>
                      <Trash2 size={16} />
                    </button>
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

export default Reports;
