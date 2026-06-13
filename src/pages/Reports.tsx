import { useEffect, useState } from 'react';
import { Flag, AlertCircle, Trash2, X, RefreshCw } from 'lucide-react';
import api from '../lib/api';

interface Report {
  id: number;
  user_id: number | null;
  display_name: string | null;
  service: number | null;
  service_name: string | null;
  report_type: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
];

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`reports/${id}/`);
      setReports(reports.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete report.');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`reports/${selectedReport.id}/`, { status });
      const updatedReport = res.data;
      
      // Update local state
      setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
      setSelectedReport(updatedReport);
    } catch (err) {
      console.error('Update status failed', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
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
    } else if (status === 'investigating') {
      bg = 'rgba(59, 130, 246, 0.1)';
      color = '#3b82f6';
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
        <p className="text-secondary">View and manage problem reports submitted by users. Click a row to view details or update status.</p>
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
                <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{report.service_name || 'General / App Bug'}</td>
                  <td>{report.report_type.replace(/_/g, ' ').toUpperCase()}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={report.message}>
                    {report.message || '-'}
                  </td>
                  <td>{report.display_name || 'Anonymous'}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={(e) => handleDelete(e, report.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Single View Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedReport(null)}>
          <div className="glass-panel" style={{ 
            width: '100%', maxWidth: '600px', padding: '2rem', margin: '1rem',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px' 
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Report Details {getStatusBadge(selectedReport.status)}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Reported on {new Date(selectedReport.created_at).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Type</div>
                <div style={{ fontWeight: 600 }}>{selectedReport.report_type.replace(/_/g, ' ').toUpperCase()}</div>

                <div style={{ color: 'var(--text-secondary)' }}>Service</div>
                <div>{selectedReport.service_name || 'General App Issue'} {selectedReport.service && `(ID: ${selectedReport.service})`}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>Reporter</div>
                <div>{selectedReport.display_name || 'Anonymous'}</div>
                
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  Update Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select 
                    value={selectedReport.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={updatingStatus}
                    style={{
                      background: 'rgba(255,255,255,0.05)', color: 'white',
                      border: '1px solid var(--glass-border)', borderRadius: '6px',
                      padding: '0.5rem', width: '100%', maxWidth: '200px'
                    }}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {updatingStatus && <RefreshCw size={16} className="spin" style={{ color: 'var(--text-secondary)' }} />}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Report Message</div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', 
                  minHeight: '100px', lineHeight: 1.6 
                }}>
                  {selectedReport.message || <em style={{ color: 'var(--text-secondary)' }}>No message provided.</em>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Close</button>
              <button className="btn btn-ghost text-danger" onClick={(e) => handleDelete(e, selectedReport.id)}>
                <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete Report
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
