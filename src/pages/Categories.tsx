import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, FolderTree } from 'lucide-react';
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
    if (!window.confirm('Are you sure you want to delete this category? Services using this category might break.')) return;
    try {
      await api.delete(`services/categories/${code}/`);
      setCategories(categories.filter(c => c.code !== code));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Cannot delete category. It might be in use.');
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><FolderTree size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Category Management</h2>
          <p className="text-secondary">Manage service categories and their visual configurations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Add feature coming soon')}>
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading categories...</div>
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
              {categories.map(cat => (
                <tr key={cat.code}>
                  <td><code>{cat.code}</code></td>
                  <td style={{ fontWeight: 500 }}>{cat.name_en}</td>
                  <td>{cat.name_si}</td>
                  <td>{cat.name_ta}</td>
                  <td>{cat.icon}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: cat.color.replace('0xFF', '#') }} />
                      {cat.color}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => alert('Edit feature coming soon')}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(cat.code)}>
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
    </div>
  );
};

export default Categories;
