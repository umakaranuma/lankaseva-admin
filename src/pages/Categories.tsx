import { useEffect, useState } from 'react';
import { LayoutGrid, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface Category {
  code: string;
  name_en: string;
  name_si: string;
  name_ta: string;
  icon: string;
  color: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name_en: '',
    name_si: '',
    name_ta: '',
    icon: 'account_balance_outlined',
    color: '0xFF0F6E56'
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('services/categories/');
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`services/categories/${code}/`);
      setCategories(categories.filter(c => c.code !== code));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete category. It might be in use by services.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Auto-generate code from english name
      const generatedCode = formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      // Auto-generate random darkish color or use default
      const randomColorHex = Math.floor(Math.random()*16777215).toString(16);
      const generatedColor = `0xFF${randomColorHex.padStart(6, '0').toUpperCase()}`;

      const payload = {
        ...formData,
        code: generatedCode,
        color: generatedColor
      };

      const res = await api.post('services/categories/', payload);
      setCategories([...categories, res.data]);
      setShowAddModal(false);
      setFormData({
        code: '', name_en: '', name_si: '', name_ta: '', icon: 'account_balance_outlined', color: '0xFF0F6E56'
      });
    } catch (err: any) {
      console.error('Add category failed', err);
      alert('Failed to add category. ' + (err.response?.data ? JSON.stringify(err.response.data) : ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><LayoutGrid size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Categories</h2>
          <p className="text-secondary">Manage service categories and their visual representations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No categories found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name (EN)</th>
                <th>Name (SI)</th>
                <th>Name (TA)</th>
                <th>Icon</th>
                <th>Color</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.code}>
                  <td><code>{category.code}</code></td>
                  <td style={{ fontWeight: 500 }}>{category.name_en}</td>
                  <td>{category.name_si}</td>
                  <td>{category.name_ta}</td>
                  <td><code>{category.icon}</code></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '16px', height: '16px', borderRadius: '4px', 
                        background: category.color.replace('0xFF', '#') 
                      }}></div>
                      <code>{category.color}</code>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(category.code)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel modal-content" style={{ 
            width: '100%', maxWidth: '500px', padding: '2rem', margin: '1rem',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Add New Category</h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name (English)</label>
                <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="Police Stations" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name (Sinhala)</label>
                <input required type="text" value={formData.name_si} onChange={e => setFormData({...formData, name_si: e.target.value})} placeholder="පොලිස් ස්ථාන" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name (Tamil)</label>
                <input required type="text" value={formData.name_ta} onChange={e => setFormData({...formData, name_ta: e.target.value})} placeholder="காவல் நிலையங்கள்" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Material Icon Name</label>
                <input required type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
