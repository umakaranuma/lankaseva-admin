import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, AlertCircle, Star } from 'lucide-react';
import api from '../lib/api';

interface User {
  id: number;
  phone_hash: string;
  display_name: string;
}

interface Service {
  id: number;
  name_en: string;
  district: string;
}

interface Review {
  id: number;
  user: User;
  service: Service;
  stars: number;
  text: string;
  helpful_count: number;
  created_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`reviews/${id}/`);
      setReviews(reviews.filter(r => r.id !== id));
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
        <p className="text-secondary">Monitor and moderate user reviews submitted for government services.</p>
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
                <th>Helpful</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{review.service?.name_en || 'Unknown Service'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{review.service?.district}</div>
                  </td>
                  <td>{review.user?.display_name || 'Anonymous'}</td>
                  <td>{renderStars(review.stars)}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={review.text}>
                    {review.text || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No text</span>}
                  </td>
                  <td>{review.helpful_count}</td>
                  <td>{new Date(review.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(review.id)}>
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

export default Reviews;
