import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Building2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface Category {
  code: string;
  name_en: string;
}

interface Service {
  id: number;
  code: string;
  name_en: string;
  department_en: string;
  district: string;
  category: string;
  is_emergency: boolean;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch categories for mapping category codes to names
      const catRes = await api.get('services/categories/');
      const catMap: Record<string, string> = {};
      const catData = catRes.data.results || catRes.data;
      catData.forEach((c: Category) => { catMap[c.code] = c.name_en; });
      setCategories(catMap);

      // Fetch services
      const res = await api.get('services/');
      setServices(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`services/${id}/`);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete service.');
    }
  };

  return (
    <div className="services-page">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><Building2 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Services Directory</h2>
          <p className="text-secondary">Manage government services and locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Add feature coming soon')}>
          <Plus size={20} /> Add Service
        </button>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading services...</div>
        ) : services.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No services found in the directory.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name (EN)</th>
                <th>Department (EN)</th>
                <th>District</th>
                <th>Category</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td><code>{service.code}</code></td>
                  <td style={{ fontWeight: 500 }}>{service.name_en}</td>
                  <td>{service.department_en}</td>
                  <td>{service.district}</td>
                  <td>{categories[service.category] || service.category}</td>
                  <td>
                    {service.is_emergency ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>EMERGENCY</span>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '0.8rem' }}>STANDARD</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => alert('Edit feature coming soon')}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(service.id)}>
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

export default Services;
