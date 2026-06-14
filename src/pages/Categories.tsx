import { useEffect, useState, useMemo } from 'react';
import { LayoutGrid, Plus, Trash2, X, AlertCircle, Search, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface Category {
  code: string;
  name_en: string;
  name_si: string;
  name_ta: string;
  icon: string;
  color: string;
}

const hexFromFlutter = (c: string) => c.replace('0xFF', '#').replace('0xff', '#');

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_si: '', name_ta: '',
    icon: 'account_balance_outlined',
    color: '#0F6E56',
  });

  const fetchCategories = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('services/categories/');
      setCategories(res.data.results || res.data);
    } catch {
      toast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return categories;
    return categories.filter(c =>
      c.name_en.toLowerCase().includes(q) ||
      c.name_si.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`services/categories/${deleteTarget.code}/`);
      setCategories(prev => prev.filter(c => c.code !== deleteTarget.code));
      toast(`Category "${deleteTarget.name_en}" deleted`, 'success');
    } catch {
      toast('Failed to delete category. It may be in use by services.', 'error');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const flutterColor = '0xFF' + formData.color.replace('#', '').toUpperCase();
      const res = await api.post('services/categories/', { ...formData, code, color: flutterColor });
      setCategories(prev => [...prev, res.data]);
      setShowAddModal(false);
      setFormData({ name_en: '', name_si: '', name_ta: '', icon: 'account_balance_outlined', color: '#0F6E56' });
      toast('Category added successfully', 'success');
    } catch (err: any) {
      toast('Failed to add category: ' + (err.response?.data ? JSON.stringify(err.response.data).substring(0, 80) : 'Unknown error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const LABEL_STYLE = { display: 'block' as const, marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 500 };
  const INPUT_STYLE = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'white' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutGrid size={22} /> Categories
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Manage service categories and their visual representations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => fetchCategories(true)} disabled={refreshing} style={{ fontSize: '0.875rem', gap: '0.4rem' }}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ gap: '0.4rem' }}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-meta">
        <span className="table-meta-count">
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${categories.length} categories`}
        </span>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>{search ? `No categories matching "${search}"` : 'No categories found.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Color</th>
                <th>Code</th>
                <th>English</th>
                <th>Sinhala</th>
                <th>Tamil</th>
                <th>Icon</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.code}>
                  <td>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '7px',
                      background: hexFromFlutter(cat.color),
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: `0 2px 8px ${hexFromFlutter(cat.color)}60`
                    }} />
                  </td>
                  <td><code style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{cat.code}</code></td>
                  <td style={{ fontWeight: 600 }}>{cat.name_en}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{cat.name_si}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{cat.name_ta}</td>
                  <td><code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.icon}</code></td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => setDeleteTarget(cat)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', margin: '1rem', borderRadius: '20px', animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Category</h3>
              <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Name (English) *</label>
                <input required type="text" value={formData.name_en} placeholder="e.g. Police Stations" onChange={e => setFormData({ ...formData, name_en: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Name (Sinhala) *</label>
                <input required type="text" value={formData.name_si} placeholder="e.g. පොලිස් ස්ථාන" onChange={e => setFormData({ ...formData, name_si: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Name (Tamil) *</label>
                <input required type="text" value={formData.name_ta} placeholder="e.g. காவல் நிலையங்கள்" onChange={e => setFormData({ ...formData, name_ta: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Material Icon Name *</label>
                <input required type="text" value={formData.icon} placeholder="e.g. account_balance_outlined" onChange={e => setFormData({ ...formData, icon: e.target.value })} style={INPUT_STYLE} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Use a Material Icons name (e.g. local_hospital, gavel, school)</p>
              </div>
              <div>
                <label style={LABEL_STYLE}>Category Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                    style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', cursor: 'pointer', padding: '2px' }} />
                  <div>
                    <div style={{ width: '80px', height: '36px', borderRadius: '8px', background: formData.color, border: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }} />
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formData.color}</code>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '130px' }}>
                  {submitting ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete category "${deleteTarget.name_en}"?`}
          detail="This will fail if the category is currently assigned to any services. Remove those services first."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Categories;
