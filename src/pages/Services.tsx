import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Building2, AlertCircle, X, Search, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ConfirmDialog';

interface Category { code: string; name_en: string; }

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

const INITIAL_FORM = {
  code: '', category: '', district: '', is_emergency: false,
  name_en: '', name_si: '', name_ta: '',
  department_en: '', department_si: '', department_ta: '',
  address_en: '', address_si: '', address_ta: '',
  lat: 0.0, lng: 0.0, website: '', whatsapp: '',
  phones: [{ number: '', label_en: 'General', label_si: 'සාමාන්‍ය', label_ta: 'பொது', is_primary: true }] as Phone[]
};

const FIELD_STYLE = {
  width: '100%', padding: '0.6rem', borderRadius: '6px',
  border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'white'
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [catRes, distRes, svcRes] = await Promise.all([
        api.get('services/categories/'),
        api.get('services/districts/'),
        api.get('services/'),
      ]);
      const catData: Category[] = catRes.data.results || catRes.data;
      const catMap: Record<string, string> = {};
      catData.forEach(c => { catMap[c.code] = c.name_en; });
      setCategoriesList(catData);
      setCategoriesMap(catMap);

      const distData: string[] = distRes.data;
      setDistrictsList(distData);

      if (!formData.category && catData.length > 0) {
        setFormData(prev => ({ ...prev, category: catData[0].code, district: distData[0] || '' }));
      }
      setServices(svcRes.data.results || svcRes.data);
    } catch {
      toast('Failed to load services data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter(s => {
      if (q && !s.name_en.toLowerCase().includes(q) && !s.department_en.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false;
      if (filterDistrict && s.district !== filterDistrict) return false;
      if (filterCategory && s.category !== filterCategory) return false;
      return true;
    });
  }, [services, search, filterDistrict, filterCategory]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`services/${deleteTarget.id}/`);
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast(`"${deleteTarget.name_en}" deleted`, 'success');
    } catch {
      toast('Failed to delete service', 'error');
    }
  };

  const handlePhoneChange = (index: number, field: keyof Phone, value: any) => {
    const updated = [...formData.phones];
    if (field === 'is_primary') updated.forEach(p => p.is_primary = false);
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, phones: updated });
  };

  const handleAddPhone = () => {
    setFormData({ ...formData, phones: [...formData.phones, { number: '', label_en: '', label_si: '', label_ta: '', is_primary: false }] });
  };

  const handleRemovePhone = (index: number) => {
    if (formData.phones.length === 1) { toast('At least one phone number is required', 'warning'); return; }
    const updated = formData.phones.filter((_, i) => i !== index);
    if (formData.phones[index].is_primary && updated.length > 0) updated[0].is_primary = true;
    setFormData({ ...formData, phones: updated });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = `${formData.name_en}_${formData.district}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const res = await api.post('services/', { ...formData, code, website: formData.website || null, whatsapp: formData.whatsapp || null });
      setServices([res.data, ...services]);
      setShowAddModal(false);
      setFormData({ ...INITIAL_FORM, category: categoriesList[0]?.code || '', district: districtsList[0] || '' });
      toast('Service added successfully', 'success');
    } catch (err: any) {
      toast('Failed to add service: ' + (err.response?.data ? JSON.stringify(err.response.data).substring(0, 80) : 'Unknown error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({ label, value, field, type = 'text', required = true }: any) => (
    <div>
      <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>{label}</label>
      {type === 'textarea' ? (
        <textarea required={required} value={value} onChange={e => setFormData({ ...formData, [field]: e.target.value })} style={{ ...FIELD_STYLE, minHeight: '60px', resize: 'vertical' }} />
      ) : (
        <input type={type} required={required} value={value} onChange={e => setFormData({ ...formData, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} style={FIELD_STYLE} />
      )}
    </div>
  );

  const SECTION = { padding: '1.5rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px' };
  const SECTION_H = { margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} /> Services Directory
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Manage government services and locations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => fetchData(true)} disabled={refreshing} style={{ fontSize: '0.875rem', gap: '0.4rem' }}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ gap: '0.4rem' }}>
            <Plus size={18} /> Add Service
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <Search size={16} />
          <input type="text" placeholder="Search by name, department, code..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
          <option value="">All Districts</option>
          {districtsList.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
        </select>
        <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categoriesList.map(c => <option key={c.code} value={c.code} style={{ background: '#0f172a' }}>{c.name_en}</option>)}
        </select>
      </div>

      <div className="table-meta">
        <span className="table-meta-count">
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${services.length} services`}
        </span>
        {(filterDistrict || filterCategory || search) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterDistrict(''); setFilterCategory(''); }}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', color: 'var(--text-secondary)' }}>
            Clear filters ×
          </button>
        )}
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading services...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>{search || filterDistrict || filterCategory ? 'No services match your filters.' : 'No services found.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>District</th>
                <th>Category</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(service => (
                <tr key={service.id}>
                  <td>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{service.name_en}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{service.department_en}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{service.district}</td>
                  <td style={{ fontSize: '0.875rem' }}>{categoriesMap[service.category] || service.category}</td>
                  <td>
                    {service.is_emergency ? (
                      <span className="badge badge-danger">Emergency</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>Standard</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost text-danger" style={{ padding: '0.35rem 0.5rem' }} onClick={() => setDeleteTarget(service)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,11,20,0.92)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', padding: '2rem', height: 'fit-content', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Add New Service</h2>
              <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setShowAddModal(false)}><X size={22} /></button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={SECTION}>
                <h4 style={SECTION_H}>Core Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Category</label>
                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={FIELD_STYLE}>
                      {categoriesList.map(c => <option key={c.code} value={c.code} style={{ background: '#0f172a' }}>{c.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>District</label>
                    <select required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} style={FIELD_STYLE}>
                      {districtsList.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1.4rem' }}>
                    <input type="checkbox" id="emergency" checked={formData.is_emergency} onChange={e => setFormData({ ...formData, is_emergency: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#ef4444' }} />
                    <label htmlFor="emergency" style={{ color: '#f87171', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Mark as Emergency Service</label>
                  </div>
                </div>
              </div>

              <div style={SECTION}>
                <h4 style={SECTION_H}>Names & Departments</h4>
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

              <div style={SECTION}>
                <h4 style={SECTION_H}>Location & Links</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField label="Address (English)" value={formData.address_en} field="address_en" type="textarea" />
                  <InputField label="Address (Sinhala)" value={formData.address_si} field="address_si" type="textarea" />
                  <InputField label="Address (Tamil)" value={formData.address_ta} field="address_ta" type="textarea" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <InputField label="Latitude" value={formData.lat} field="lat" type="number" />
                  <InputField label="Longitude" value={formData.lng} field="lng" type="number" />
                  <InputField label="Website (optional)" value={formData.website} field="website" type="url" required={false} />
                  <InputField label="WhatsApp (optional)" value={formData.whatsapp} field="whatsapp" required={false} />
                </div>
              </div>

              <div style={SECTION}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={SECTION_H}>Phone Numbers</h4>
                  <button type="button" className="btn btn-ghost" onClick={handleAddPhone} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>+ Add Number</button>
                </div>
                {formData.phones.map((phone, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'end', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {[
                      { label: 'Phone Number', field: 'number', type: 'text' },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>{f.label}</label>
                        <input required type={f.type} value={(phone as any)[f.field]} onChange={e => handlePhoneChange(index, f.field as keyof Phone, e.target.value)} style={{ ...FIELD_STYLE, padding: '0.5rem' }} />
                      </div>
                    ))}
                    {(['label_en', 'label_si', 'label_ta'] as const).map(field => {
                      const opts = field === 'label_en'
                        ? ['General', 'Emergency', 'Reception', 'Inquiry', 'Hotline']
                        : field === 'label_si'
                        ? ['සාමාන්‍ය', 'හදිසි', 'පිළිගැනීමේ', 'විමසීම්', 'ක්ෂණික ඇමතුම්']
                        : ['பொது', 'அவசரம்', 'வரவேற்பு', 'விசாரணை', 'துரித எண்'];
                      const isCustom = !opts.includes(phone[field]);
                      return (
                        <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {field === 'label_en' ? 'Label (EN)' : field === 'label_si' ? 'Label (SI)' : 'Label (TA)'}
                          </label>
                          <select value={isCustom ? 'Other' : phone[field]} onChange={e => handlePhoneChange(index, field, e.target.value === 'Other' ? '' : e.target.value)} style={{ ...FIELD_STYLE, padding: '0.5rem' }}>
                            {opts.map(l => <option key={l} value={l} style={{ background: '#0f172a' }}>{l}</option>)}
                            <option value="Other" style={{ background: '#0f172a' }}>Other…</option>
                          </select>
                          {isCustom && (
                            <input required placeholder="Custom…" type="text" value={phone[field]} onChange={e => handlePhoneChange(index, field, e.target.value)} style={{ ...FIELD_STYLE, padding: '0.5rem' }} />
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', alignItems: 'center', height: '36px', gap: '6px' }}>
                      <input type="radio" name="primary_phone" checked={phone.is_primary} onChange={() => handlePhoneChange(index, 'is_primary', true)} style={{ accentColor: '#10b981' }} />
                      <span style={{ fontSize: '0.75rem', color: phone.is_primary ? '#10b981' : 'var(--text-secondary)', fontWeight: phone.is_primary ? 600 : 400 }}>Primary</span>
                    </div>
                    <button type="button" onClick={() => handleRemovePhone(index)} style={{ height: '36px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '140px' }}>
                  {submitting ? 'Saving…' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name_en}"?`}
          detail="This will permanently remove the service and all associated data from the app."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Services;
