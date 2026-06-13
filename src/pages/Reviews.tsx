import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, AlertCircle, Star, X } from 'lucide-react';
import api from '../lib/api';

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

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await api.get('reviews/');
      setReviews(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // prevent opening the modal when clicking delete
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`reviews/${id}/`);
      setReviews(reviews.filter(r => r.id !== id));
      if (selectedReview?.id === id) setSelectedReview(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete review.');
    }
  };

  const renderStars = (stars: number) => {
    return (
      <div style={{ display: 'flex', color: '#fbbf24', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < stars ? 'currentColor' : 'none'} color={i < stars ? 'currentColor' : '#cbd5e1'} />
        ))}
      </div>
    );
  };

  return (
    <div className="reviews-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2><MessageSquare size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Review Moderation</h2>
        <p className="text-secondary">Monitor and moderate user reviews submitted for government services. Click a row to view details.</p>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No reviews have been submitted yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>User</th>
                <th>Rating</th>
                <th>Review Text</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id} onClick={() => setSelectedReview(review)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{review.service_name || 'Unknown Service'}</td>
                  <td>{review.display_name || 'Anonymous'}</td>
                  <td>{renderStars(review.stars)}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={review.text}>
                    {review.text || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No text provided</span>}
                  </td>
                  <td>{new Date(review.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={(e) => handleDelete(e, review.id)}>
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
      {selectedReview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedReview(null)}>
          <div className="glass-panel" style={{ 
            width: '100%', maxWidth: '600px', padding: '2rem', margin: '1rem',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px' 
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Review Details</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Posted on {new Date(selectedReview.created_at).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setSelectedReview(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Service</div>
                <div style={{ fontWeight: 600 }}>{selectedReview.service_name || 'Unknown'} (ID: {selectedReview.service})</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>Author</div>
                <div>{selectedReview.display_name || 'Anonymous'}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>Rating</div>
                <div>{renderStars(selectedReview.stars)}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>Helpful Votes</div>
                <div>{selectedReview.helpful_count} users found this helpful</div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Review Text</div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', 
                  minHeight: '100px', lineHeight: 1.6 
                }}>
                  {selectedReview.text || <em style={{ color: 'var(--text-secondary)' }}>No written text provided.</em>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedReview(null)}>Close</button>
              <button className="btn btn-ghost text-danger" onClick={(e) => handleDelete(e, selectedReview.id)}>
                <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete Review
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
