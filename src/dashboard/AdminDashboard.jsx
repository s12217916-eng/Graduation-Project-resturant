import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/authService';

const API_BASE = 'http://localhost:8000/api/admin';

// Toast notification component (reused from Owner Dashboard for consistency)
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => removeToast(t.id)} style={{
          background: t.type === 'success' ? '#22c55e' : t.type === 'error' ? '#ef4444' : '#f59e0b',
          color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', cursor: 'pointer',
          animation: 'slideIn 0.25s ease', fontSize: 15, direction: 'rtl'
        }}>
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : '⚠️ '}{t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const add = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

// Loading spinner
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        border: '4px solid #f3f4f6', borderTop: '4px solid #f59e0b',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('licenses');
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, add: toast, remove: removeToast } = useToast();
  const navigate = useNavigate();

  const authHeader = () => {
    const t = localStorage.getItem('access') || localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/licenses`, { headers: authHeader() });
      setLicenses(res.data);
    } catch (err) {
      toast('فشل جلب قائمة الرخص', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_BASE}/licenses/${id}/approve`, {}, { headers: authHeader() });
      toast('تم قبول الرخصة بنجاح');
      fetchLicenses();
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      toast('فشل قبول الرخصة', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`${API_BASE}/licenses/${id}/reject`, {}, { headers: authHeader() });
      toast('تم رفض الرخصة');
      fetchLicenses();
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      toast('فشل رفض الرخصة', 'error');
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/licenses/${id}`, { headers: authHeader() });
      setSelectedLicense(res.data);
      setIsModalOpen(true);
    } catch (err) {
      toast('فشل جلب تفاصيل الرخصة', 'error');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const sidebarItems = [
    { key: 'licenses', label: 'الرخص', icon: '📄' },
    { key: 'logout', label: 'تسجيل خروج', icon: '🚪' },
  ];

  const renderContent = () => {
    if (loading) return <Spinner />;

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>إدارة الرخص</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                <th style={styles.th}>رقم الرخصة</th>
                <th style={styles.th}>تاريخ الانتهاء</th>
                <th style={styles.th}>الحالة</th>
                <th style={styles.th}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map(lic => (
                <tr key={lic.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={styles.td}>{lic.license_number}</td>
                  <td style={styles.td}>{new Date(lic.license_expiry).toLocaleDateString('ar-EG')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: lic.status === 'APPROVED' ? '#dcfce7' : lic.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color: lic.status === 'APPROVED' ? '#166534' : lic.status === 'REJECTED' ? '#991b1b' : '#92400e'
                    }}>
                      {lic.status === 'APPROVED' ? 'مقبول' : lic.status === 'REJECTED' ? 'مرفوض' : 'قيد الانتظار'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button style={styles.btnOutline} onClick={() => openDetails(lic.id)}>عرض التفاصيل</button>
                      {lic.status === 'PENDING' && (
                        <>
                          <button style={styles.btnSuccess} onClick={() => handleApprove(lic.id)}>قبول</button>
                          <button style={styles.btnDanger} onClick={() => handleReject(lic.id)}>رفض</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', background: '#f5f6fa' }}>
        {/* Sidebar */}
        <div style={{
          width: 260, background: '#111827', color: '#fff', padding: '28px 16px',
          display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', letterSpacing: 1 }}>DINE ADVISOR</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Admin Control Panel</div>
          </div>

          {sidebarItems.map(item => (
            <button key={item.key} onClick={() => item.key === 'logout' ? handleLogout() : setActiveSection(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
              borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              textAlign: 'right', direction: 'rtl', width: '100%', transition: 'all .15s',
              background: activeSection === item.key ? '#f59e0b' : 'transparent',
              color: activeSection === item.key ? '#fff' : '#9ca3af',
            }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '40px 36px', overflowY: 'auto' }}>
          <h2 style={styles.pageTitle}>لوحة تحكم المسؤول</h2>
          {renderContent()}
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedLicense && (
        <div style={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div style={{ ...styles.modal, width: 600 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>تفاصيل الرخصة: {selectedLicense.license_number}</h3>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={styles.label}>صورة الرخصة</label>
                  <img src={selectedLicense.license_image_url} alt="License" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </div>
                <div>
                  <label style={styles.label}>صورة الهوية</label>
                  <img src={selectedLicense.id_image_url} alt="ID" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <p><strong>تاريخ الانتهاء:</strong> {new Date(selectedLicense.license_expiry).toLocaleDateString('ar-EG')}</p>
                <p><strong>الحالة:</strong> {selectedLicense.status}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {selectedLicense.status === 'PENDING' && (
                  <>
                    <button style={{ ...styles.btnSuccess, padding: '10px 24px' }} onClick={() => handleApprove(selectedLicense.id)}>قبول</button>
                    <button style={{ ...styles.btnDanger, padding: '10px 24px' }} onClick={() => handleReject(selectedLicense.id)}>رفض</button>
                  </>
                )}
                <button style={{ ...styles.btnOutline, padding: '10px 24px' }} onClick={() => setIsModalOpen(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  pageTitle: { fontSize: 26, fontWeight: 800, marginBottom: 24, color: '#111827' },
  card: { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', alignItems: 'center', marginBottom: 24, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { padding: '12px 14px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#374151' },
  td: { padding: '12px 14px', textAlign: 'center', color: '#374151' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnPrimary: {
    background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10,
    padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer'
  },
  btnOutline: {
    background: 'transparent', color: '#f59e0b', border: '1.5px solid #f59e0b',
    borderRadius: 10, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer'
  },
  btnSuccess: {
    background: '#10b981', color: '#fff', border: 'none', borderRadius: 8,
    padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer'
  },
  btnDanger: {
    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8,
    padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer'
  },
  modalBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: { background: '#fff', borderRadius: 16, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f3f4f6' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
};
