import { useEffect, useState, useMemo } from 'react';
import { Flag, AlertCircle, Trash2, X, RefreshCw, Search } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ConfirmDialog';

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

const STATUS_OPTS = [
  { value: 'pending',       label: 'Pending',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  { value: 'investigating', label: 'Investigating',  color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)' },
  { value: 'resolved',      label: 'Resolved',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
  { value: 'dismissed',     label: 'Dismissed',      color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
];

const getStatusStyle = (status: string) =>
  STATUS_OPTS.find(o => o.value === status) ?? STATUS_OPTS[0];

const StatusBadge = ({ status }: { status: string }) => {
  const s = getStatusStyle(status);
  return (
    <span style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {status}
    </span>
  );
};

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('reports/');
      setReports(res.data.results || res.data);
    } catch {
      toast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (q && !r.service_name?.toLowerCase().includes(q) && !r.display_name?.toLowerCase().includes(q) && !r.message?.toLowerCase().includes(q) && !r.report_type.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, search, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [reports]);

  const doDelete = async (id: number) => {
    try {
      await api.delete(`reports/${id}/`);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast('Report deleted', 'success');
    } catch {
      toast('Failed to delete report', 'error');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`reports/${selectedReport.id}/`, { status });
      const updated = res.data;
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(updated);
      toast(`Status updated to "${status}"`, 'success');
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flag size={22} /> User Reports
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Triage problem reports submitted by users. Click a row to update status.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => fetchReports(true)} disabled={refreshing} style={{ fontSize: '0.875rem', gap: '0.4rem' }}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="search-filter-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div className="status-tabs">
          <button className={`status-tab ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>
            All ({reports.length})
          </button>
          {STATUS_OPTS.map(opt => (
            <button
              key={opt.value}
              className={`status-tab ${filterStatus === opt.value ? 'active' : ''}`}
              onClick={() => setFilterStatus(filterStatus === opt.value ? '' : opt.value)}
              style={filterStatus !== opt.value && (statusCounts[opt.value] ?? 0) > 0 ? { borderColor: opt.border, color: opt.color } : {}}
            >
              {opt.label} {statusCounts[opt.value] ? `(${statusCounts[opt.value]})` : '(0)'}
            </button>
          ))}
        </div>
        <div className="search-input-wrap" style={{ width: '100%', maxWidth: '400px' }}>
          <Search size={16} />
          <input type="text" placeholder="Search by service, user, type, or message..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-meta">
        <span className="table-meta-count">
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${reports.length} reports`}
        </span>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>{search || filterStatus ? 'No reports match your filters.' : 'No reports found.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Message</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(report => (
                <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, maxWidth: '140px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.service_name || 'General / App Bug'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
                    {report.report_type.replace(/_/g, ' ').toUpperCase()}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {report.message || '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{report.display_name || 'Anonymous'}</td>
                  <td><StatusBadge status={report.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.35rem 0.5rem' }}
                      onClick={e => { e.stopPropagation(); setDeleteTarget(report.id); }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedReport(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', margin: '1rem', borderRadius: '20px', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Report Details</h3>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Reported {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.35rem' }} onClick={() => setSelectedReport(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Type', value: selectedReport.report_type.replace(/_/g, ' ').toUpperCase() },
                { label: 'Service', value: `${selectedReport.service_name || 'General App Issue'}${selectedReport.service ? ` (ID: ${selectedReport.service})` : ''}` },
                { label: 'Reporter', value: selectedReport.display_name || 'Anonymous' },
              ].map(row => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{row.label}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{row.value}</span>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Update Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={selectedReport.status}
                    onChange={e => handleUpdateStatus(e.target.value)}
                    disabled={updatingStatus}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    {STATUS_OPTS.map(o => (
                      <option key={o.value} value={o.value} style={{ background: '#1e293b' }}>{o.label}</option>
                    ))}
                  </select>
                  {updatingStatus && <RefreshCw size={15} className="spin" style={{ color: 'var(--text-secondary)' }} />}
                </div>
              </div>

              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Report Message</p>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', lineHeight: 1.6, minHeight: '80px', fontSize: '0.9rem' }}>
                  {selectedReport.message || <em style={{ color: 'var(--text-secondary)' }}>No message provided.</em>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Close</button>
              <button className="btn btn-ghost text-danger" style={{ border: '1px solid rgba(239,68,68,0.2)', gap: '0.4rem' }}
                onClick={() => setDeleteTarget(selectedReport.id)}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          message="Delete this report?"
          detail="The report will be permanently removed."
          onConfirm={() => doDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Reports;
