// Dashboard.jsx
import axios from 'axios';
import React, { useState, useCallback, useRef } from 'react';

const API = 'https://revvo-server.onrender.com/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('access');
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

// Toast notification component
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

// Unsaved-changes badge
function DirtyBadge({ dirty }) {
  if (!dirty) return null;
  return (
    <span style={{
      background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700,
      borderRadius: 20, padding: '2px 10px', marginRight: 8, verticalAlign: 'middle'
    }}>● غير محفوظ</span>
  );
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

// ─── Day names Arabic ────────────────────────────────────────────────────────
const DAY_AR = {
  MONDAY: 'الاثنين', TUESDAY: 'الثلاثاء', WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس', FRIDAY: 'الجمعة', SATURDAY: 'السبت', SUNDAY: 'الأحد'
};

const DEFAULT_HOURS = [
  { day: "MONDAY",    is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "TUESDAY",   is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "WEDNESDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "THURSDAY",  is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "FRIDAY",    is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "23:00" },
  { day: "SATURDAY",  is_closed: true,  is_open_24h: false, open_time: null,    close_time: null    },
  { day: "SUNDAY",    is_closed: true,  is_open_24h: false, open_time: null,    close_time: null    },
];

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const { toasts, add: toast, remove: removeToast } = useToast();

  // ── per-section data & dirty flags ──
  const [restaurantData, setRestaurantData] = useState({
    name: '', about: '', category: '', address: '',
    lat: '', lon: '', phone_number: '', website: '', image: null
  });
  const [restaurantDirty, setRestaurantDirty]   = useState(false);
  const [restaurantLoaded, setRestaurantLoaded] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const [licenseData, setLicenseData] = useState({
    license_number: '', license_expiry: '', license_image: null, id_image: null
  });
  const [licenseDirty, setLicenseDirty]   = useState(false);
  const [licenseExists, setLicenseExists] = useState(false);
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);
  const [hoursDirty, setHoursDirty]     = useState(false);
  const [hoursExist, setHoursExist]     = useState(false);
  const [hoursLoaded, setHoursLoaded]   = useState(false);
  const [hoursLoading, setHoursLoading] = useState(false);

  const [capacityData, setCapacityData] = useState({
    max_capacity: 60, slot_duration: 90, max_party_size: 10, auto_confirm: true
  });
  const [capacityDirty, setCapacityDirty]   = useState(false);
  const [capacityLoaded, setCapacityLoaded] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(false);

  const [menuItems, setMenuItems]   = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', price: '', category: 'Main', description: '', ingredients: '', is_available: true, image: null
  });

  const [restaurantImages, setRestaurantImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [reservations, setReservations] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedResId, setSelectedResId] = useState(null);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // ── section navigation: lazy-load on first visit ──
  const handleNav = async (key) => {
    setActiveSection(key);
    if (key === 'restaurant'   && !restaurantLoaded)   fetchRestaurant();
    if (key === 'license'      && !licenseLoaded)      fetchLicense();
    if (key === 'hours'        && !hoursLoaded)        fetchHours();
    if (key === 'capacity'     && !capacityLoaded)     fetchCapacity();
    if (key === 'menu'         && !menuLoaded)         fetchMenu();
    if (key === 'images'       && !imagesLoaded)       fetchImages();
    if (key === 'reservations' && !reservationsLoaded) fetchReservations();
  };

  // ═══════════════════════════════════════════════════════════
  // RESTAURANT
  // ═══════════════════════════════════════════════════════════
  const fetchRestaurant = async () => {
    setRestaurantLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant`, { headers: authHeader() });
      const d = res.data;
      setRestaurantData({
        name: d.name || '', about: d.about || '', category: d.category || '',
        address: d.address || '', lat: d.lat || '', lon: d.lon || '',
        phone_number: d.phone_number || '', website: d.website || '', image: null
      });
      setRestaurantLoaded(true);
      setRestaurantDirty(false);
    } catch { toast('فشل جلب بيانات المطعم', 'error'); }
    finally { setRestaurantLoading(false); }
  };

  const handleRestaurantChange = (e) => {
    const { name, value, files, type } = e.target;
    setRestaurantData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
    setRestaurantDirty(true);
  };

  const updateRestaurant = async () => {
    try {
      const formData = new FormData();
      Object.entries(restaurantData).forEach(([k, v]) => { if (v !== null) formData.append(k, v); });
      await axios.put(`${API}/owner/restaurant/`, formData, { headers: authHeader() });
      toast('تم تحديث بيانات المطعم بنجاح');
      setRestaurantDirty(false);
    } catch { toast('فشل تحديث بيانات المطعم', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // LICENSE
  // ═══════════════════════════════════════════════════════════
  const fetchLicense = async () => {
    setLicenseLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/license`, { headers: authHeader() });
      const d = res.data;
      setLicenseData({
        license_number: d.license_number || '',
        license_expiry: d.license_expiry ? d.license_expiry.split('T')[0] : '',
        license_image: null, id_image: null
      });
      setLicenseExists(true);
      setLicenseDirty(false);
    } catch (err) {
      if (err.response?.status === 404) setLicenseExists(false);
      else toast('فشل جلب بيانات الرخصة', 'error');
    }
    setLicenseLoaded(true);
    setLicenseLoading(false);
  };

  const handleLicenseChange = (e) => {
    const { name, value, files, type } = e.target;
    setLicenseData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
    setLicenseDirty(true);
  };

  const submitLicense = async () => {
    try {
      const formData = new FormData();
      formData.append('license_number', licenseData.license_number);
      formData.append('license_expiry', new Date(licenseData.license_expiry).toISOString());
      if (licenseData.license_image) formData.append('license_image', licenseData.license_image);
      if (licenseData.id_image)      formData.append('id_image', licenseData.id_image);

      if (licenseExists) {
        await axios.put(`${API}/owner/restaurant/license/`, formData, { headers: authHeader() });
      } else {
        await axios.post(`${API}/owner/restaurant/license/`, formData, { headers: authHeader() });
      }
      toast('تم حفظ الرخصة بنجاح');
      setLicenseExists(true);
      setLicenseDirty(false);
    } catch { toast('فشل حفظ الرخصة', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // HOURS
  // ═══════════════════════════════════════════════════════════
  const fetchHours = async () => {
    setHoursLoading(true);
    try {
      const res = await axios.get(`${API}/restaurant/hours/`, { headers: authHeader() });
      const data = Array.isArray(res.data) ? res.data : res.data.days;
      if (data && data.length > 0) {
        setWorkingHours(data.map(d => ({
          day: d.day,
          is_closed: d.is_closed,
          is_open_24h: d.is_open_24h,
          open_time:  d.open_time  ? d.open_time.slice(0, 5)  : null,
          close_time: d.close_time ? d.close_time.slice(0, 5) : null,
        })));
        setHoursExist(true);
      }
      setHoursLoaded(true);
      setHoursDirty(false);
    } catch (err) {
      if (err.response?.status === 404) setHoursExist(false);
      else toast('فشل جلب ساعات العمل', 'error');
      setHoursLoaded(true);
    }
    setHoursLoading(false);
  };

  const handleHourChange = (index, field, value) => {
    setWorkingHours(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // clear times if closed or 24h
      if ((field === 'is_closed' || field === 'is_open_24h') && value) {
        updated[index].open_time  = null;
        updated[index].close_time = null;
        if (field === 'is_closed')   updated[index].is_open_24h = false;
        if (field === 'is_open_24h') updated[index].is_closed   = false;
      }
      return updated;
    });
    setHoursDirty(true);
  };

  const saveHours = async () => {
    try {
      const cleanedHours = workingHours.map(item => ({
        ...item,
        open_time:  (item.is_closed || item.is_open_24h) ? null : item.open_time,
        close_time: (item.is_closed || item.is_open_24h) ? null : item.close_time,
      }));
      const payload = { days: cleanedHours };
      if (hoursExist) {
        await axios.put(`${API}/owner/restaurant/hours/`, payload, { headers: authHeader() });
      } else {
        await axios.post(`${API}/owner/restaurant/hours/`, payload, { headers: authHeader() });
        setHoursExist(true);
      }
      toast('تم حفظ ساعات العمل بنجاح');
      setHoursDirty(false);
    } catch (err) {
      toast('فشل حفظ ساعات العمل: ' + (err.response?.data?.detail || 'خطأ في البيانات'), 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CAPACITY
  // ═══════════════════════════════════════════════════════════
  const fetchCapacity = async () => {
    setCapacityLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/capacity`, { headers: authHeader() });
      if (res.data) { setCapacityData(res.data); setCapacityDirty(false); }
      setCapacityLoaded(true);
    } catch { toast('فشل جلب إعدادات السعة', 'error'); }
    setCapacityLoading(false);
  };

  const saveCapacity = async () => {
    try {
      await axios.post(`${API}/owner/restaurant/capacity/`, capacityData, { headers: authHeader() });
      toast('تم حفظ إعدادات السعة بنجاح');
      setCapacityDirty(false);
    } catch { toast('فشل حفظ إعدادات السعة', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // MENU
  // ═══════════════════════════════════════════════════════════
  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const res = await axios.get(`${API}/restaurant/menu/`);
      setMenuItems(res.data);
      setMenuLoaded(true);
    } catch { toast('فشل جلب المينيو', 'error'); }
    setMenuLoading(false);
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) { toast('الاسم والسعر إلزاميان', 'warning'); return; }
    try {
      const formData = new FormData();
      Object.entries(newItem).forEach(([k, v]) => { if (v !== null) formData.append(k, v); });
      await axios.post(`${API}/owner/restaurant/menu/`, formData, { headers: authHeader() });
      toast('تمت إضافة الوجبة');
      setNewItem({ name: '', price: '', category: 'Main', description: '', ingredients: '', is_available: true, image: null });
      fetchMenu();
    } catch { toast('فشل إضافة الوجبة', 'error'); }
  };

  const toggleAvailability = async (item) => {
    try {
      const action = item.is_available ? 'unavailable' : 'available';
      await axios.post(`${API}/owner/restaurant/menu/${item.id}/${action}/`, {}, { headers: authHeader() });
      fetchMenu();
    } catch { toast('فشل تغيير حالة الوجبة', 'error'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;
    try {
      await axios.delete(`${API}/owner/restaurant/menu/${id}`, { headers: authHeader() });
      toast('تم حذف الوجبة');
      fetchMenu();
    } catch { toast('فشل الحذف', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // IMAGES
  // ═══════════════════════════════════════════════════════════
  const fetchImages = async () => {
    setImagesLoading(true);
    try {
      const res = await axios.get(`${API}/restaurant/images/`, { headers: authHeader() });
      setRestaurantImages(res.data);
      setImagesLoaded(true);
    } catch { toast('فشل جلب الصور', 'error'); }
    setImagesLoading(false);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) { toast('الرجاء اختيار صور أولاً', 'warning'); return; }
    try {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('images', f));
      await axios.post(`${API}/owner/restaurant/images/bulk`, formData, { headers: authHeader() });
      toast('تم رفع الصور بنجاح');
      setSelectedFiles([]);
      fetchImages();
    } catch (err) {
      const msg = err.response?.data?.images ? 'خطأ في صيغة الصور' : 'فشل رفع الصور';
      toast(msg, 'error');
    }
  };

  const deleteImage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await axios.delete(`${API}/owner/restaurant/images/${id}/`, { headers: authHeader() });
      toast('تم حذف الصورة');
      fetchImages();
    } catch { toast('فشل الحذف', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // RESERVATIONS
  // ═══════════════════════════════════════════════════════════
  const fetchReservations = async () => {
    setReservationsLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/reservations`, { headers: authHeader() });
      setReservations(res.data);
      setReservationsLoaded(true);
    } catch { toast('فشل جلب الحجوزات', 'error'); }
    setReservationsLoading(false);
  };

  const confirmReservation = async (id) => {
    try {
      await axios.post(`${API}/owner/restaurant/reservations/${id}/confirm/`, {}, { headers: authHeader() });
      toast('تم تأكيد الحجز بنجاح');
      fetchReservations();
    } catch { toast('فشل تأكيد الحجز', 'error'); }
  };

  const rejectReservation = async () => {
    if (!rejectReason.trim()) { toast('يرجى ذكر سبب الرفض', 'warning'); return; }
    try {
      await axios.post(
        `${API}/restaurant/reservations/${selectedResId}/reject/`,
        { reason: rejectReason },
        { headers: authHeader() }
      );
      toast('تم رفض الحجز');
      setRejectReason(''); setSelectedResId(null);
      fetchReservations();
    } catch { toast('فشل عملية الرفض', 'error'); }
  };

  // ═══════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════
  const sidebarItems = [
    { key: 'overview',      label: 'نظرة عامة',      icon: '🏠' },
    { key: 'restaurant',    label: 'معلومات المطعم', icon: '🍽️', dirty: restaurantDirty },
    { key: 'reservations',  label: 'الحجوزات',       icon: '📅' },
    { key: 'hours',         label: 'ساعات العمل',    icon: '🕐', dirty: hoursDirty },
    { key: 'capacity',      label: 'السعة والحجز',   icon: '👥', dirty: capacityDirty },
    { key: 'license',       label: 'الرخصة',         icon: '📄', dirty: licenseDirty },
    { key: 'images',        label: 'صور المطعم',     icon: '🖼️' },
    { key: 'menu',          label: 'المينيو',         icon: '📋' },
    { key: 'analytics',     label: 'التحليلات',      icon: '📊' },
    { key: 'ai',            label: 'AI Summary',     icon: '🤖' },
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    switch (activeSection) {

      // ── OVERVIEW ──────────────────────────────────────────
      case 'overview':
        return (
          <div>
            <h2 style={styles.pageTitle}>مرحباً بك 👋</h2>
            <div style={styles.statsGrid}>
              {[
                { label: 'إجمالي الحجوزات', value: '420', icon: '📅', color: '#f59e0b' },
                { label: 'التقييم العام',    value: '4.9 ⭐', icon: '⭐', color: '#10b981' },
                { label: 'إجمالي العملاء',  value: '640', icon: '👥', color: '#6366f1' },
              ].map(s => (
                <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── RESTAURANT ─────────────────────────────────────────
      case 'restaurant':
        if (restaurantLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>معلومات المطعم</h3>
              <DirtyBadge dirty={restaurantDirty} />
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>اسم المطعم</label>
                <input name="name" style={styles.input} placeholder="مثال: مطعم السلطان" value={restaurantData.name} onChange={handleRestaurantChange} />
              </div>
              <div>
                <label style={styles.label}>التصنيف</label>
                <input name="category" style={styles.input} placeholder="مثال: Italian, Arabic" value={restaurantData.category} onChange={handleRestaurantChange} />
              </div>
              <div>
                <label style={styles.label}>رقم الهاتف</label>
                <input name="phone_number" style={styles.input} placeholder="+970591234567" value={restaurantData.phone_number} onChange={handleRestaurantChange} />
              </div>
              <div>
                <label style={styles.label}>الموقع الإلكتروني</label>
                <input name="website" style={styles.input} placeholder="https://myrestaurant.com" value={restaurantData.website} onChange={handleRestaurantChange} />
              </div>
              <div>
                <label style={styles.label}>العنوان</label>
                <input name="address" style={styles.input} placeholder="مثال: شارع الإرسال، رام الله" value={restaurantData.address} onChange={handleRestaurantChange} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>خط العرض (Lat)</label>
                  <input name="lat" style={styles.input} placeholder="31.9037" value={restaurantData.lat} onChange={handleRestaurantChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>خط الطول (Lon)</label>
                  <input name="lon" style={styles.input} placeholder="35.2034" value={restaurantData.lon} onChange={handleRestaurantChange} />
                </div>
              </div>
              <div>
                <label style={styles.label}>صورة المطعم</label>
                <input type="file" name="image" accept="image/*" style={styles.input} onChange={handleRestaurantChange} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={styles.label}>وصف المطعم</label>
              <textarea name="about" style={{ ...styles.input, height: 100, resize: 'vertical' }} placeholder="اكتب وصفاً جذاباً لمطعمك..." value={restaurantData.about} onChange={handleRestaurantChange} />
            </div>
            <button style={styles.btnPrimary} onClick={updateRestaurant}>💾 حفظ المعلومات</button>
          </div>
        );

      // ── RESERVATIONS ───────────────────────────────────────
      case 'reservations':
        if (reservationsLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>طلبات الحجز</h3>
              <button style={styles.btnOutline} onClick={fetchReservations}>تحديث 🔄</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['اسم العميل', 'التاريخ والوقت', 'عدد الأفراد', 'الحالة', 'إجراءات'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد حجوزات حالياً</td></tr>
                  ) : reservations.map(res => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={styles.td}><strong>{res.user_name || 'عميل خارجي'}</strong></td>
                      <td style={styles.td}>{new Date(res.reservation_datetime).toLocaleString('ar-EG')}</td>
                      <td style={styles.td}>{res.party_size} أشخاص</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: res.status === 'confirmed' ? '#d1fae5' : res.status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color: res.status === 'confirmed' ? '#065f46' : res.status === 'pending' ? '#92400e' : '#991b1b',
                        }}>
                          {res.status === 'confirmed' ? 'مؤكد' : res.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {res.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={styles.btnSuccess} onClick={() => confirmReservation(res.id)}>✓ تأكيد</button>
                            <button style={styles.btnDanger} onClick={() => setSelectedResId(res.id)}>✗ رفض</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reject Modal */}
            {selectedResId && (
              <div style={styles.modalBackdrop}>
                <div style={styles.modal}>
                  <div style={styles.modalHeader}>
                    <h5 style={{ margin: 0, fontWeight: 700 }}>سبب رفض الحجز</h5>
                    <button style={styles.closeBtn} onClick={() => setSelectedResId(null)}>✕</button>
                  </div>
                  <div style={{ padding: '16px 24px' }}>
                    <textarea
                      style={{ ...styles.input, height: 90 }}
                      placeholder="مثال: المطعم محجوز بالكامل في هذا الوقت"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div style={{ padding: '12px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button style={styles.btnOutline} onClick={() => setSelectedResId(null)}>إلغاء</button>
                    <button style={styles.btnDanger} onClick={rejectReservation}>تأكيد الرفض</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ── HOURS ──────────────────────────────────────────────
      case 'hours':
        if (hoursLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>ساعات العمل</h3>
              <DirtyBadge dirty={hoursDirty} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {workingHours.map((item, index) => {
                const isDisabled = item.is_closed || item.is_open_24h;
                return (
                  <div key={item.day} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 18px', borderRadius: 12,
                    background: item.is_closed ? '#fff5f5' : item.is_open_24h ? '#f0fdf4' : '#fff',
                    border: '1px solid #e5e7eb', flexWrap: 'wrap'
                  }}>
                    {/* Day name */}
                    <div style={{ width: 90, fontWeight: 700, fontSize: 15, color: '#374151', flexShrink: 0 }}>
                      {DAY_AR[item.day]}
                    </div>

                    {/* is_closed toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={item.is_closed}
                        onChange={e => handleHourChange(index, 'is_closed', e.target.checked)} />
                      <span style={{ color: item.is_closed ? '#ef4444' : '#6b7280' }}>🔒 مغلق</span>
                    </label>

                    {/* is_open_24h toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={item.is_open_24h}
                        onChange={e => handleHourChange(index, 'is_open_24h', e.target.checked)} />
                      <span style={{ color: item.is_open_24h ? '#10b981' : '#6b7280' }}>🌙 24 ساعة</span>
                    </label>

                    {/* Time pickers — hidden when closed or 24h */}
                    {!isDisabled && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>من</span>
                          <input type="time" style={{ ...styles.input, width: 130, padding: '6px 10px' }}
                            value={item.open_time || ''}
                            onChange={e => handleHourChange(index, 'open_time', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>إلى</span>
                          <input type="time" style={{ ...styles.input, width: 130, padding: '6px 10px' }}
                            value={item.close_time || ''}
                            onChange={e => handleHourChange(index, 'close_time', e.target.value)} />
                        </div>
                      </>
                    )}

                    {/* Status chip */}
                    <span style={{
                      marginRight: 'auto', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: item.is_closed ? '#fee2e2' : item.is_open_24h ? '#d1fae5' : '#fef3c7',
                      color: item.is_closed ? '#991b1b' : item.is_open_24h ? '#065f46' : '#92400e',
                    }}>
                      {item.is_closed ? 'مغلق' : item.is_open_24h ? 'مفتوح 24 ساعة' : 'مفتوح'}
                    </span>
                  </div>
                );
              })}
            </div>
            <button style={{ ...styles.btnPrimary, marginTop: 20 }} onClick={saveHours}>💾 حفظ المواعيد</button>
          </div>
        );

      // ── CAPACITY ───────────────────────────────────────────
      case 'capacity':
        if (capacityLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>إعدادات السعة والحجز</h3>
              <DirtyBadge dirty={capacityDirty} />
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>أقصى سعة للمطعم (شخص)</label>
                <input type="number" style={styles.input} placeholder="مثال: 60" value={capacityData.max_capacity}
                  onChange={e => { setCapacityData(p => ({ ...p, max_capacity: e.target.value })); setCapacityDirty(true); }} />
              </div>
              <div>
                <label style={styles.label}>مدة الحجز (بالدقائق)</label>
                <input type="number" style={styles.input} placeholder="مثال: 90 دقيقة" value={capacityData.slot_duration}
                  onChange={e => { setCapacityData(p => ({ ...p, slot_duration: e.target.value })); setCapacityDirty(true); }} />
              </div>
              <div>
                <label style={styles.label}>أكبر عدد أفراد للطاولة الواحدة</label>
                <input type="number" style={styles.input} placeholder="مثال: 10 أشخاص" value={capacityData.max_party_size}
                  onChange={e => { setCapacityData(p => ({ ...p, max_party_size: e.target.value })); setCapacityDirty(true); }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 28 }}>
                <div style={{
                  width: 48, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background .2s',
                  background: capacityData.auto_confirm ? '#f59e0b' : '#d1d5db', position: 'relative'
                }} onClick={() => { setCapacityData(p => ({ ...p, auto_confirm: !p.auto_confirm })); setCapacityDirty(true); }}>
                  <div style={{
                    position: 'absolute', top: 3, left: capacityData.auto_confirm ? 25 : 3,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <span style={{ fontWeight: 600, color: '#374151' }}>
                  {capacityData.auto_confirm ? '✅ تأكيد الحجوزات تلقائياً' : '⏸️ التأكيد اليدوي'}
                </span>
              </div>
            </div>
            <button style={{ ...styles.btnPrimary, marginTop: 20 }} onClick={saveCapacity}>💾 حفظ الإعدادات</button>
          </div>
        );

      // ── LICENSE ────────────────────────────────────────────
      case 'license':
        if (licenseLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>الرخصة التجارية</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {licenseExists
                  ? <span style={{ ...styles.badge, background: '#d1fae5', color: '#065f46' }}>✓ مسجلة</span>
                  : <span style={{ ...styles.badge, background: '#fee2e2', color: '#991b1b' }}>غير مسجلة</span>}
                <DirtyBadge dirty={licenseDirty} />
              </div>
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>رقم الرخصة</label>
                <input type="text" name="license_number" style={styles.input} placeholder="مثال: 123456789"
                  value={licenseData.license_number} onChange={handleLicenseChange} />
              </div>
              <div>
                <label style={styles.label}>تاريخ انتهاء الصلاحية</label>
                <input type="date" name="license_expiry" style={styles.input}
                  value={licenseData.license_expiry} onChange={handleLicenseChange} />
              </div>
              <div>
                <label style={styles.label}>صورة الرخصة</label>
                <input type="file" name="license_image" accept="image/*" style={styles.input} onChange={handleLicenseChange} />
                {licenseExists && !licenseData.license_image && (
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>📎 يوجد ملف محفوظ — ارفع ملفاً جديداً للاستبدال</p>
                )}
              </div>
              <div>
                <label style={styles.label}>صورة الهوية</label>
                <input type="file" name="id_image" accept="image/*" style={styles.input} onChange={handleLicenseChange} />
                {licenseExists && !licenseData.id_image && (
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>📎 يوجد ملف محفوظ — ارفع ملفاً جديداً للاستبدال</p>
                )}
              </div>
            </div>
            <button style={styles.btnPrimary} onClick={submitLicense}>
              {licenseExists ? '🔄 تحديث الرخصة' : '📤 رفع الرخصة'}
            </button>
          </div>
        );

      // ── IMAGES ─────────────────────────────────────────────
      case 'images':
        if (imagesLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>معرض صور المطعم</h3>
              <button style={styles.btnOutline} onClick={fetchImages}>تحديث 🔄</button>
            </div>

            {/* Upload area */}
            <div style={{
              border: '2px dashed #d1d5db', borderRadius: 16, padding: 28,
              textAlign: 'center', background: '#f9fafb', marginBottom: 24
            }}>
              <p style={{ color: '#9ca3af', marginBottom: 12, fontSize: 14 }}>اسحب الصور هنا أو اختَر من جهازك</p>
              <input type="file" multiple accept="image/*" style={{ marginBottom: 14, display: 'block', margin: '0 auto 14px' }}
                onChange={e => setSelectedFiles(Array.from(e.target.files))} />
              {selectedFiles.length > 0 && (
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                  تم اختيار {selectedFiles.length} صورة
                </p>
              )}
              <button style={styles.btnPrimary} onClick={uploadImages}>
                📤 رفع {selectedFiles.length > 0 ? selectedFiles.length : ''} صور
              </button>
            </div>

            {/* Gallery */}
            {restaurantImages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 48 }}>
                🖼️ لا توجد صور حالياً — ابدأ برفع بعض الصور!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {restaurantImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <img src={img.image} alt="Restaurant" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => deleteImage(img.id)} style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700
                    }}>حذف</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ── MENU ───────────────────────────────────────────────
      case 'menu':
        if (menuLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>إدارة المينيو</h3>
              <button style={styles.btnOutline} onClick={fetchMenu}>تحديث 🔄</button>
            </div>

            {/* Add item form */}
            <div style={{ background: '#f9fafb', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <h5 style={{ marginBottom: 14, fontWeight: 700, color: '#374151' }}>➕ إضافة وجبة جديدة</h5>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>اسم الوجبة *</label>
                  <input style={styles.input} placeholder="مثال: شاورما دجاج"
                    value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>السعر (₪) *</label>
                  <input type="number" style={styles.input} placeholder="مثال: 25.00"
                    value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>الفئة</label>
                  <select style={styles.input} value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                    <option value="Main">الطبق الرئيسي</option>
                    <option value="Appetizer">المقبلات</option>
                    <option value="Dessert">الحلويات</option>
                    <option value="Drink">المشروبات</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>صورة الوجبة</label>
                  <input type="file" accept="image/*" style={styles.input}
                    onChange={e => setNewItem(p => ({ ...p, image: e.target.files[0] }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={styles.label}>الوصف</label>
                  <textarea style={{ ...styles.input, height: 70, resize: 'vertical' }} placeholder="وصف الوجبة..."
                    value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <button style={{ ...styles.btnSuccess, marginTop: 12 }} onClick={addMenuItem}>إضافة للمينيو</button>
            </div>

            {/* Menu table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: '#1f2937' }}>
                    {['الصورة', 'الاسم', 'السعر', 'الفئة', 'الحالة', 'إجراءات'].map(h => (
                      <th key={h} style={{ ...styles.th, color: '#f9fafb', background: 'transparent' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={styles.td}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                          : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍽️</div>}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{item.name}</td>
                      <td style={styles.td}>{item.price}₪</td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: item.is_available ? '#d1fae5' : '#fee2e2',
                          color: item.is_available ? '#065f46' : '#991b1b',
                          cursor: 'pointer'
                        }} onClick={() => toggleAvailability(item)}>
                          {item.is_available ? '✓ متوفر' : '✗ غير متوفر'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnDanger} onClick={() => deleteItem(item.id)}>حذف</button>
                      </td>
                    </tr>
                  ))}
                  {menuItems.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد وجبات — أضف وجبتك الأولى!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ── ANALYTICS ──────────────────────────────────────────
      case 'analytics':
        return (
          <div>
            <h2 style={styles.pageTitle}>التحليلات</h2>
            <div style={styles.statsGrid}>
              {[
                { label: 'إجمالي الحجوزات', value: '420', icon: '📅', color: '#f59e0b' },
                { label: 'رضا العملاء',      value: '96%', icon: '😊', color: '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
                  <div style={{ fontSize: 36 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', margin: '6px 0' }}>{s.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── AI ─────────────────────────────────────────────────
      case 'ai':
        return (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🤖 AI Summary</h3>
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 16, marginBottom: 12, color: '#92400e', fontWeight: 500 }}>
              💬 العملاء راضون عن جودة الطعام.
            </div>
            <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, color: '#f9fafb', fontWeight: 500 }}>
              ⚡ يوجد ضغط في أوقات الذروة.
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
        input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
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
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Restaurant Owner Dashboard</div>
          </div>

          {sidebarItems.map(item => (
            <button key={item.key} onClick={() => handleNav(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
              borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              textAlign: 'right', direction: 'rtl', width: '100%', transition: 'all .15s',
              background: activeSection === item.key ? '#f59e0b' : 'transparent',
              color: activeSection === item.key ? '#fff' : '#9ca3af',
            }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.dirty && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '40px 36px', overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}

// ─── Shared styles ───────────────────────────────────────────────────────────
const styles = {
  pageTitle: { fontSize: 26, fontWeight: 800, marginBottom: 24, color: '#111827' },
  card: { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', alignItems: 'center', marginBottom: 24, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: '28px 24px', textAlign: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)'
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff',
    transition: 'border-color .2s', color: '#111827', direction: 'rtl'
  },
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
  modal: { background: '#fff', borderRadius: 16, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f3f4f6' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' },
};
