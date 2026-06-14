import { useEffect, useState, useMemo } from 'react';
import { MessageSquare, Trash2, AlertCircle, Star, X, Search, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface Review {
  id: number;
  user_id: number;
  display_name: string;
  service: number;
  service_name: string;
  stars: number;
  text: string;
  helpful_count: number;
  created_at: string;
}

const StarDisplay = ({ stars }: { stars: number }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={13} fill={i < stars ? '#fbbf24' : 'none'} color={i < stars ? '#fbbf24' : '#475569'} />
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStars, setFilterStars] = useState<number | ''>('');

  const fetchReviews = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('reviews/');
      setReviews(res.data.results || res.data);
    } catch {
      toast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter(r => {
      if (filterStars !== '' && r.stars !== filterStars) return false;
      if (q && !r.service_name?.toLowerCase().includes(q) && !r.display_name?.toLowerCase().includes(q) && !r.text?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reviews, search, filterStars]);

  const doDelete = async (id: number) => {
    try {
      await api.delete(`reviews/${id}/`);
      setReviews(prev => prev.filter(r => r.id !== id));
      if (selectedReview?.id === id) setSelectedReview(null);
      toast('Review deleted', 'success');
    } catch {
      toast('Failed to delete review', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={22} /> Review Moderation
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Click a row to view details. Moderate user-submitted reviews.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => fetchReviews(true)} disabled={refreshing} style={{ fontSize: '0.875rem', gap: '0.4rem' }}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <Search size={16} />
          <input type="text" placeholder="Search by service, user, or review text..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="status-tabs">
          <button className={`status-tab ${filterStars === '' ? 'active' : ''}`} onClick={() => setFilterStars('')}>All</button>
          {[5, 4, 3, 2, 1].map(n => (
            <button key={n} className={`status-tab ${filterStars === n ? 'active' : ''}`} onClick={() => setFilterStars(n === filterStars ? '' : n)}>
              {n}★
            </button>
          ))}
        </div>
      </div>

      <div className="table-meta">
        <span className="table-meta-count">
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${reviews.length} reviews`}
        </span>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>{search || filterStars !== '' ? 'No reviews match your filters.' : 'No reviews submitted yet.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>User</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Helpful</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(review => (
                <tr key={review.id} onClick={() => setSelectedReview(review)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, maxWidth: '160px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.service_name || 'Unknown'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{review.display_name || 'Anonymous'}</td>
                  <td><StarDisplay stars={review.stars} /></td>
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {review.text || <em>No text</em>}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>{review.helpful_count}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.35rem 0.5rem' }}
                      onClick={e => { e.stopPropagation(); setDeleteTarget(review.id); }}>
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
      {selectedReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedReview(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '2rem', margin: '1rem', borderRadius: '20px', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Review Details</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedReview.created_at).toLocaleString()}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.35rem' }} onClick={() => setSelectedReview(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Service', value: `${selectedReview.service_name || 'Unknown'} (ID: ${selectedReview.service})` },
                { label: 'Author', value: selectedReview.display_name || 'Anonymous' },
                { label: 'Helpful', value: `${selectedReview.helpful_count} users found this helpful` },
              ].map(row => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{row.label}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rating</span>
                <StarDisplay stars={selectedReview.stars} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Review Text</p>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', lineHeight: 1.6, minHeight: '80px', fontSize: '0.9rem' }}>
                  {selectedReview.text || <em style={{ color: 'var(--text-secondary)' }}>No written text provided.</em>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedReview(null)}>Close</button>
              <button className="btn btn-ghost text-danger" style={{ border: '1px solid rgba(239,68,68,0.2)', gap: '0.4rem' }}
                onClick={() => setDeleteTarget(selectedReview.id)}>
                <Trash2 size={15} /> Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          message="Delete this review?"
          detail="The review will be permanently removed from the service listing."
          onConfirm={() => doDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Reviews;
