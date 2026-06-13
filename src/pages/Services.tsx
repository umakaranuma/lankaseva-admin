import { useEffect, useState } from 'react';
import { Plus, Trash2, Building2, AlertCircle, X } from 'lucide-react';
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

interface Phone {
  number: string;
  label_en: string;
  label_si: string;
  label_ta: string;
  is_primary: boolean;
}

const initialServiceForm = {
  code: '', category: '', district: '', is_emergency: false,
  name_en: '', name_si: '', name_ta: '',
  department_en: '', department_si: '', department_ta: '',
  address_en: '', address_si: '', address_ta: '',
  lat: 0.0, lng: 0.0, website: '', whatsapp: '',
  phones: [{ number: '', label_en: 'General', label_si: 'සාමාන්‍ය', label_ta: 'பொது', is_primary: true }] as Phone[]
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialServiceForm);

  const fetchData = async () => {
    try {
      const catRes = await api.get('services/categories/');
      const catMap: Record<string, string> = {};
      const catData = catRes.data.results || catRes.data;
      catData.forEach((c: Category) => { catMap[c.code] = c.name_en; });
      setCategoriesList(catData);
      setCategoriesMap(catMap);

      const distRes = await api.get('services/districts/');
      const distData = distRes.data;
      setDistrictsList(distData);

      if (catData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          category: catData[0].code,
          district: distData.length > 0 ? distData[0] : ''
        }));
      }

      const res = await api.get('services/');
      setServices(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
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

  const handlePhoneChange = (index: number, field: keyof Phone, value: any) => {
    const updated = [...formData.phones];
    if (field === 'is_primary') {
      updated.forEach(p => p.is_primary = false);
    }
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, phones: updated });
  };

  const handleAddPhone = () => {
    setFormData({ ...formData, phones: [...formData.phones, { number: '', label_en: '', label_si: '', label_ta: '', is_primary: false }] });
  };

  const handleRemovePhone = (index: number) => {
    if (formData.phones.length === 1) return alert('At least one phone number is required.');
    const updated = formData.phones.filter((_, i) => i !== index);
    if (formData.phones[index].is_primary && updated.length > 0) updated[0].is_primary = true;
    setFormData({ ...formData, phones: updated });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const generatedCode = `${formData.name_en}_${formData.district}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      const payload = {
        ...formData,
        code: generatedCode,
        website: formData.website || null,
        whatsapp: formData.whatsapp || null,
      };
      const res = await api.post('services/', payload);
      setServices([res.data, ...services]);
      setShowAddModal(false);
      setFormData({ 
        ...initialServiceForm, 
        category: categoriesList[0]?.code || '',
        district: districtsList[0] || ''
      });
    } catch (err: any) {
      console.error('Add service failed', err);
      alert('Failed to add service. ' + (err.response?.data ? JSON.stringify(err.response.data) : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({ label, value, field, type = 'text', required = true }: any) => (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</label>
      {type === 'textarea' ? (
        <textarea required={required} value={value} onChange={e => setFormData({...formData, [field]: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '60px' }} />
      ) : (
        <input type={type} required={required} value={value} onChange={e => setFormData({...formData, [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
      )}
    </div>
  );

  return (
    <div className="services-page">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><Building2 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Services Directory</h2>
          <p className="text-secondary">Manage government services and locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
                  <td style={{ fontWeight: 500 }}>
                    {service.name_en}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{service.department_en}</div>
                  </td>
                  <td>{service.district}</td>
                  <td>{categoriesMap[service.category] || service.category}</td>
                  <td>
                    {service.is_emergency ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>EMERGENCY</span>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '0.8rem' }}>STANDARD</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(service.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Full-Screen Add Service Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', zIndex: 1000, overflowY: 'auto'
        }}>
          <div className="glass-panel" style={{ 
            width: '100%', maxWidth: '1000px', padding: '2rem', margin: '2rem 1rem', height: 'fit-content',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Add New Service</h2>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* CORE DETAILS */}
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Core Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Code</label>
                    <div style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }}>
                      Auto-generated
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      {categoriesList.map(c => <option key={c.code} value={c.code} style={{ background: '#0f172a' }}>{c.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>District</label>
                    <select required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      {districtsList.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                    <input type="checkbox" id="emergency" checked={formData.is_emergency} onChange={e => setFormData({...formData, is_emergency: e.target.checked})} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                    <label htmlFor="emergency" style={{ color: '#ef4444', fontWeight: 600 }}>Mark as Emergency Service</label>
                  </div>
                </div>
              </div>

              {/* MULTI-LANG NAMES */}
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Names & Departments</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField label="Name (English)" value={formData.name_en} field="name_en" />
                  <InputField label="Name (Sinhala)" value={formData.name_si} field="name_si" />
                  <InputField label="Name (Tamil)" value={formData.name_ta} field="name_ta" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <InputField label="Department (English)" value={formData.department_en} field="department_en" />
                  <InputField label="Department (Sinhala)" value={formData.department_si} field="department_si" />
                  <InputField label="Department (Tamil)" value={formData.department_ta} field="department_ta" />
                </div>
              </div>

              {/* LOCATION */}
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Location & Links</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField label="Address (English)" value={formData.address_en} field="address_en" type="textarea" />
                  <InputField label="Address (Sinhala)" value={formData.address_si} field="address_si" type="textarea" />
                  <InputField label="Address (Tamil)" value={formData.address_ta} field="address_ta" type="textarea" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <InputField label="Latitude" value={formData.lat} field="lat" type="number" />
                  <InputField label="Longitude" value={formData.lng} field="lng" type="number" />
                  <InputField label="Website (Optional)" value={formData.website} field="website" type="url" required={false} />
                  <InputField label="WhatsApp (Optional)" value={formData.whatsapp} field="whatsapp" required={false} />
                </div>
              </div>

              {/* PHONES */}
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: '#38bdf8' }}>Phone Numbers (Minimum 1)</h4>
                  <button type="button" className="btn btn-ghost" onClick={handleAddPhone} style={{ fontSize: '0.85rem' }}>+ Add Phone</button>
                </div>
                {formData.phones.map((phone, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'end', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</label>
                      <input required type="text" value={phone.number} onChange={e => handlePhoneChange(index, 'number', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Label (EN)</label>
                      <input required type="text" value={phone.label_en} onChange={e => handlePhoneChange(index, 'label_en', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Label (SI)</label>
                      <input required type="text" value={phone.label_si} onChange={e => handlePhoneChange(index, 'label_si', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Label (TA)</label>
                      <input required type="text" value={phone.label_ta} onChange={e => handlePhoneChange(index, 'label_ta', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', height: '36px', padding: '0 0.5rem' }}>
                      <input type="radio" name="primary_phone" checked={phone.is_primary} onChange={() => handlePhoneChange(index, 'is_primary', true)} style={{ marginRight: '4px' }} title="Set as Primary" />
                      <span style={{ fontSize: '0.8rem', color: phone.is_primary ? '#10b981' : 'var(--text-secondary)' }}>Primary</span>
                    </div>
                    <button type="button" onClick={() => handleRemovePhone(index)} style={{ height: '36px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove Phone">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                  {submitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
