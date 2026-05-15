// Dashboard.jsx
import axios from 'axios';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getProfile, updateProfile } from '../services/authService';
import AdminDashboard from './AdminDashboard';


const API = 'http://localhost:8000/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const token = () =>
  localStorage.getItem('access') ||
  localStorage.getItem('token');

const authHeader = () => {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

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
  const [editItem, setEditItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [restaurantImages, setRestaurantImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const [reservations, setReservations] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedResId, setSelectedResId] = useState(null);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  const [reviews, setReviews] = useState({ results: [], count: 0, avg_food: 0, avg_service: 0, avg_ambiance: 0 });
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [restaurantStatus, setRestaurantStatus] = useState(null); // null | 'published' | 'unpublished'
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone_number: '', email: '', role: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const [role, setRole] = useState(userFromStorage.role || '');


  const [activeResTab, setActiveResTab] = useState('list'); // 'list' or 'capacity'
  const [resMenuOpen, setResMenuOpen] = useState(false);
  const [activeReviewsTab, setActiveReviewsTab] = useState('list'); // 'list' or 'ai'
  const [reviewsMenuOpen, setReviewsMenuOpen] = useState(false);
  const [activeRestTab, setActiveRestTab] = useState('info'); // 'info', 'hours', 'images', 'menu'
  const [restMenuOpen, setRestMenuOpen] = useState(false);

  // Automatically fetch data when sections or tabs change
  useEffect(() => {
    if (activeSection === 'restaurant') {
      if (activeRestTab === 'menu' && !menuLoaded) fetchMenu();
      if (activeRestTab === 'images' && !imagesLoaded) fetchImages();
      if (activeRestTab === 'hours' && !hoursLoaded) fetchHours();
    }
    if (activeSection === 'reservations') {
      if (activeResTab === 'list' && !reservationsLoaded) fetchReservations();
      if (activeResTab === 'capacity' && !capacityLoaded) fetchCapacity();
    }
    if (activeSection === 'reviews' && !reviewsLoaded) fetchReviews();
    if (activeSection === 'status' && !statusLoaded) fetchStatus();
    if (activeSection === 'profile' && !profileLoaded) fetchProfileData();
    if (activeSection === 'license' && !licenseLoaded) fetchLicense();
  }, [activeSection, activeRestTab, activeResTab]);

  // ── section navigation: lazy-load on first visit ──
  const handleNav = async (key) => {
    if (key === 'logout') {
      await handleLogout();
      return;
    }
    setActiveSection(key);
    if (key === 'profile'      && !profileLoaded)      fetchProfileData();
    if (key === 'restaurant'   && !restaurantLoaded)   fetchRestaurant();
    if (key === 'license'      && !licenseLoaded)      fetchLicense();
    if (key === 'hours'        && !hoursLoaded)        fetchHours();
    if (key === 'capacity'     && !capacityLoaded)     fetchCapacity();
    if (key === 'menu'         && !menuLoaded)         fetchMenu();
    if (key === 'images'       && !imagesLoaded)       fetchImages();
    if (key === 'reservations') {
      if (!reservationsLoaded) fetchReservations();
      if (!capacityLoaded) fetchCapacity();
    }
    if (key === 'reviews'      && !reviewsLoaded)      fetchReviews();
    if (key === 'status'       && !statusLoaded)       fetchStatus();
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
    const payload = {
      name: restaurantData.name || '',
      about: restaurantData.about || '',
      category: restaurantData.category || '',
      address: restaurantData.address || '',
      phone_number: restaurantData.phone_number || '',
      website: restaurantData.website?.trim() ? restaurantData.website.trim() : null,
    };

    await axios.put(`${API}/owner/restaurant/`, payload, {
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json',
      },
    });

    toast('تم تحديث بيانات المطعم بنجاح ✅');
    setRestaurantDirty(false);
  } catch (err) {
    console.log('UPDATE RESTAURANT ERROR:', err.response?.data || err);
    toast(err.response?.data?.detail || 'فشل تحديث بيانات المطعم', 'error');
  }
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
      const res = await axios.get(`${API}/owner/restaurant/hours/`, { headers: authHeader() });
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
    const payload = {
      max_capacity: Number(capacityData.max_capacity),
      slot_duration: Number(capacityData.slot_duration),
      max_party_size: Number(capacityData.max_party_size),
      auto_confirm: Boolean(capacityData.auto_confirm),
    };

    await axios.put(`${API}/owner/restaurant/capacity/`, payload, {
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json',
      },
    });

    toast('تم حفظ إعدادات السعة بنجاح');
    setCapacityDirty(false);
  } catch (err) {
    console.log('CAPACITY ERROR:', err.response?.data);
    toast(err.response?.data?.detail || 'فشل حفظ إعدادات السعة', 'error');
  }
};

  // ═══════════════════════════════════════════════════════════
  // MENU
  // ═══════════════════════════════════════════════════════════
  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/menu/`, { headers: authHeader() });
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

  const updateMenuItem = async () => {
    if (!editItem.name || !editItem.price) { toast('الاسم والسعر إلزاميان', 'warning'); return; }
    try {
      const formData = new FormData();
      if (editItem.name) formData.append('name', editItem.name);
      if (editItem.price) formData.append('price', editItem.price);
      if (editItem.category) formData.append('category', editItem.category);
      if (editItem.description) formData.append('description', editItem.description);
      if (editItem.ingredients) formData.append('ingredients', editItem.ingredients);
      if (editItem.is_available !== undefined) formData.append('is_available', editItem.is_available);
      if (editItem.image instanceof File) {
        formData.append('image', editItem.image);
      }

      await axios.put(`${API}/owner/restaurant/menu/${editItem.id}`, formData, { headers: authHeader() });
      toast('تم تحديث الوجبة بنجاح');
      setIsEditModalOpen(false);
      setEditItem(null);
      fetchMenu();
    } catch (err) { 
      toast(err.response?.data?.detail || 'فشل تحديث الوجبة', 'error'); 
    }
  };

  const toggleAvailability = async (item) => {
    const previousState = item.is_available;
    // Optimistic update: Update local state immediately
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: !previousState } : m));
    
    try {
      const action = previousState ? 'unavailable' : 'available';
      await axios.post(`${API}/owner/restaurant/menu/${item.id}/${action}/`, {}, { headers: authHeader() });
      // Successfully updated, no need to refresh the whole list
    } catch { 
      toast('فشل تغيير حالة الوجبة', 'error'); 
      // Rollback to previous state on failure
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: previousState } : m));
    }
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
const IMAGE_UPLOAD_URL = `${API}/owner/restaurant/images/bulk`; // بدون /
const IMAGE_LIST_URL = `${API}/owner/restaurant/images`;       // مع /

const fixImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8000${url}`;
};

const normalizeImages = (data) => {
  const list = Array.isArray(data)
    ? data
    : data?.images || data?.results || data?.data || [];

  return list.map((img, index) => {
    const imageUrl = fixImageUrl(
      img.image || img.image_url || img.url || img.file || img.path
    );

    return {
      id: img.id || img.image_id || index,
      image: imageUrl,
      image_url: imageUrl,
    };
  });
};

const fetchImages = async () => {
  setImagesLoading(true);
  try {
    const res = await axios.get(IMAGE_LIST_URL, {
      headers: authHeader(),
    });

    setRestaurantImages(normalizeImages(res.data));
    setImagesLoaded(true);
  } catch (err) {
    console.log('FETCH IMAGES ERROR:', err.response?.data || err);
    toast(err.response?.data?.detail || 'فشل جلب الصور', 'error');
  } finally {
    setImagesLoading(false);
  }
};

const uploadImages = async () => {
  if (selectedFiles.length === 0) {
    toast('الرجاء اختيار صور أولاً', 'warning');
    return;
  }

  try {
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    await axios.post(IMAGE_UPLOAD_URL, formData, {
      headers: authHeader(),
    });

    toast('تم رفع الصور بنجاح');
    setSelectedFiles([]);
    setSelectedImagePreviews([]);
    setIsUploadModalOpen(false);
    await fetchImages();
  } catch (err) {
    console.log('UPLOAD IMAGES ERROR:', err.response?.data || err);
    if (err.response?.status === 401) {
      toast('انتهت الجلسة، اعمل تسجيل دخول من جديد', 'error');
      return;
    }
    toast(err.response?.data?.detail || 'فشل رفع الصور', 'error');
  }
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  setSelectedFiles(prev => [...prev, ...files]);
  const newPreviews = files.map(file => URL.createObjectURL(file));
  setSelectedImagePreviews(prev => [...prev, ...newPreviews]);
};

const removeSelectedFile = (index) => {
  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  URL.revokeObjectURL(selectedImagePreviews[index]);
  setSelectedImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        `${API}/owner/restaurant/reservations/${selectedResId}/reject/`,
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
  // ═══════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/reviews`, { headers: authHeader() });
      setReviews(res.data);
      setReviewsLoaded(true);
    } catch { toast('فشل جلب التقييمات', 'error'); }
    setReviewsLoading(false);
  };

  // ═══════════════════════════════════════════════════════════
  // STATUS & PUBLISH
  // ═══════════════════════════════════════════════════════════
 const fetchStatus = async () => {
  setStatusLoading(true);
  try {
    const res = await axios.get(`${API}/owner/restaurant/status/`, {
      headers: authHeader()
    });

    const statusValue =
      res.data?.status ||
      (res.data?.is_published ? 'published' : 'unpublished');

    setRestaurantStatus({
      ...res.data,
      status: statusValue
    });

    setStatusLoaded(true);
  } catch (err) {
    toast(err.response?.data?.detail || 'فشل جلب حالة المطعم', 'error');
  } finally {
    setStatusLoading(false);
  }
};

 const publishRestaurant = async () => {
  if (!window.confirm('هل أنت متأكد من نشر المطعم؟')) return;

  try {
   await axios.post(
  `${API}/owner/restaurant/publish/`,
  null,
  {
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    }
  }
);

    toast('تم نشر المطعم بنجاح ✅');
    setRestaurantStatus(prev => ({
      ...(prev || {}),
      status: 'published',
      is_published: true
    }));
    setStatusLoaded(false);
    fetchStatus();
  } catch (err) {
    toast(err.response?.data?.detail || 'فشل نشر المطعم', 'error');
  }
};

  const unpublishRestaurant = async () => {
  if (!window.confirm('هل أنت متأكد من إلغاء نشر المطعم؟')) return;

  try {
  await axios.post(
  `${API}/owner/restaurant/unpublish/`,
  null,
  {
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    }
  }
);

    toast('تم إلغاء نشر المطعم');
    setRestaurantStatus(prev => ({
      ...(prev || {}),
      status: 'unpublished',
      is_published: false
    }));
    setStatusLoaded(false);
    fetchStatus();
  } catch (err) {
    toast(err.response?.data?.detail || 'فشل إلغاء النشر', 'error');
  }
};

  // ═══════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════
  const fetchProfileData = async () => {
    setProfileLoading(true);
    try {
      const data = await getProfile();
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        role: data.role || '',
      });
      setRole(data.role || '');
      setProfileLoaded(true);

    } catch { toast('تعذر تحميل بيانات البروفايل', 'error'); }
    setProfileLoading(false);
  };

  const handleProfileSubmit = async () => {
    if (!profileData.first_name || !profileData.last_name) {
      toast('الاسم الأول والأخير إلزاميان', 'warning'); return;
    }
    try {
      setProfileSaving(true);
      await updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
      });
      toast('تم تحديث الملف الشخصي بنجاح ✅');
    } catch { toast('فشل تحديث الملف الشخصي', 'error'); }
    finally { setProfileSaving(false); }
  };

  // ── SIDEBAR ──
  const sidebarItems = [
    { key: 'overview',      label: 'نظرة عامة',      icon: '🏠' },
    { key: 'restaurant',    label: 'معلومات المطعم', icon: '🍽️', dirty: restaurantDirty || hoursDirty },
    { key: 'reservations',  label: 'الحجوزات',       icon: '📅', dirty: capacityDirty },
    { key: 'license',       label: 'الرخصة',         icon: '📄', dirty: licenseDirty },
    
     { key: 'reviews',       label: 'التقييمات',      icon: '⭐' },
     { key: 'status',        label: 'النشر والحالة',  icon: '📡' },
    { key: 'analytics',     label: 'التحليلات',      icon: '📊' },
    { key: 'profile',       label: 'البروفايل',      icon: '👤' },
    { key: 'logout',        label: 'تسجيل خروج',     icon: '🚪' },
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
        // Individual tab loading handling below
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>معلومات المطعم</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeRestTab === 'info' ? '#fd7e14' : 'transparent',
                    color: activeRestTab === 'info' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveRestTab('info')}
                >
                  البيانات الأساسية
                  {restaurantDirty && <span style={{ marginLeft: 5 }}>*</span>}
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeRestTab === 'hours' ? '#fd7e14' : 'transparent',
                    color: activeRestTab === 'hours' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveRestTab('hours')}
                >
                  ساعات العمل
                  {hoursDirty && <span style={{ marginLeft: 5 }}>*</span>}
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeRestTab === 'images' ? '#fd7e14' : 'transparent',
                    color: activeRestTab === 'images' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveRestTab('images')}
                >
                  صور المطعم
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeRestTab === 'menu' ? '#fd7e14' : 'transparent',
                    color: activeRestTab === 'menu' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveRestTab('menu')}
                >
                  المينيو
                </button>
              </div>
            </div>

            {activeRestTab === 'info' && (
              restaurantLoading ? <Spinner /> : (
              <>
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
              </>
              )
            )}

            {activeRestTab === 'hours' && (
              hoursLoading ? <Spinner /> : (
              <>
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
              </>
              )
            )}

            {activeRestTab === 'images' && (
              <>
                {/* Actions Toolbar */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 24, 
                  background: '#f8fafb',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid #e5e7eb'
                }}>
                  <button style={styles.btnPrimary} onClick={() => setIsUploadModalOpen(true)}>
                    ➕ إضافة صور جديدة
                  </button>
                  <button style={styles.btnOutline} onClick={fetchImages}>
                    🔄 تحديث
                  </button>
                </div>

                {/* Upload Modal */}
                {isUploadModalOpen && (
                  <div style={styles.modalBackdrop}>
                    <div style={{ ...styles.modal, width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={styles.modalHeader}>
                        <h5 style={{ margin: 0, fontWeight: 700 }}>📤 رفع صور للمطعم</h5>
                        <button style={styles.closeBtn} onClick={() => {
                          setIsUploadModalOpen(false);
                          setSelectedFiles([]);
                          setSelectedImagePreviews([]);
                        }}>✕</button>
                      </div>
                      <div style={{ padding: '24px' }}>
                        {/* Select Area */}
                        <div 
                          style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: 12,
                            padding: '30px',
                            textAlign: 'center',
                            background: '#f9fafb',
                            cursor: 'pointer',
                            marginBottom: 20,
                            transition: 'all 0.2s'
                          }}
                          onClick={() => document.getElementById('restaurant-images-upload').click()}
                          onMouseOver={e => e.currentTarget.style.borderColor = '#f59e0b'}
                          onMouseOut={e => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                          <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                          <p style={{ margin: 0, color: '#374151', fontWeight: 600 }}>انقر لاختيار صور من جهازك</p>
                          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 12 }}>يمكنك اختيار عدة صور في وقت واحد</p>
                          <input 
                            id="restaurant-images-upload"
                            type="file" 
                            multiple 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={handleFileSelect} 
                          />
                        </div>

                        {/* Previews */}
                        {selectedImagePreviews.length > 0 && (
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                              الصور المختارة ({selectedImagePreviews.length}):
                            </div>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                              gap: 10,
                              maxHeight: 300,
                              overflowY: 'auto',
                              padding: 4,
                              border: '1px solid #f3f4f6',
                              borderRadius: 8
                            }}>
                              {selectedImagePreviews.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 100 }}>
                                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                                    style={{
                                      position: 'absolute', top: 4, right: 4,
                                      background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                                      borderRadius: '50%', width: 22, height: 22, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
                                    }}
                                  >✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                          <button 
                            style={{ ...styles.btnOutline, borderColor: '#d1d5db', color: '#374151' }} 
                            onClick={() => {
                              setIsUploadModalOpen(false);
                              setSelectedFiles([]);
                              setSelectedImagePreviews([]);
                            }}
                          >
                            إلغاء
                          </button>
                          <button 
                            style={{ 
                              ...styles.btnPrimary, 
                              padding: '10px 30px',
                              opacity: selectedFiles.length === 0 ? 0.6 : 1,
                              cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer'
                            }} 
                            onClick={uploadImages}
                            disabled={selectedFiles.length === 0}
                          >
                            بدء الرفع 🚀
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {imagesLoading ? (
                  <div style={{ padding: '60px 0' }}><Spinner /></div>
                ) : (
                  <>
                    {/* Gallery */}
                    {restaurantImages.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#9ca3af', 
                        padding: 80, 
                        background: '#fff', 
                        borderRadius: 16,
                        border: '1px dashed #e5e7eb'
                      }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>لا توجد صور حالياً</div>
                        <div style={{ fontSize: 14 }}>ابدأ برفع بعض الصور لجمالية مطعمك</div>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: 20 
                      }}>
                        {restaurantImages.map(img => (
                          <div key={img.id} style={{ 
                            position: 'relative', 
                            borderRadius: 14, 
                            overflow: 'hidden', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <img
                              src={img.image}
                              alt="Restaurant"
                              style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                              onClick={() => setSelectedPreviewImage(img.image)}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/200x180?text=No+Image';
                              }}
                            />
                            <div style={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)',
                              pointerEvents: 'none'
                            }} />
                            <button onClick={() => deleteImage(img.id)} style={{
                              position: 'absolute', top: 10, right: 10,
                              background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                              borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                            }}>حذف</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeRestTab === 'menu' && (
              <>
                {/* Actions & Filters Bar */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 24, 
                  flexWrap: 'wrap',
                  background: '#f8fafb',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid #e5e7eb'
                }}>
                  <button style={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
                    ➕ إضافة وجبة جديدة
                  </button>
                  
                  <button style={styles.btnOutline} onClick={fetchMenu}>
                    🔄 تحديث
                  </button>

                  <div style={{ flex: 1 }} /> {/* Spacer */}

                  {/* Filters UI (Placeholder) */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
                      <input 
                        type="text" 
                        placeholder="بحث في المينيو..." 
                        style={{ ...styles.input, width: 180, paddingRight: 35, marginBottom: 0 }} 
                      />
                    </div>
                    <select style={{ ...styles.input, width: 130, marginBottom: 0 }}>
                      <option value="">كل الفئات</option>
                      <option value="Main">الطبق الرئيسي</option>
                      <option value="Appetizer">المقبلات</option>
                      <option value="Dessert">الحلويات</option>
                      <option value="Drink">المشروبات</option>
                    </select>

                    <select style={{ ...styles.input, width: 130, marginBottom: 0 }}>
                      <option value="">السعر</option>
                      <option value="low-to-high">من الأقل للأعلى</option>
                      <option value="high-to-low">من الأعلى للأقل</option>
                    </select>

                    <select style={{ ...styles.input, width: 130, marginBottom: 0 }}>
                      <option value="">الحالة</option>
                      <option value="available">متوفر</option>
                      <option value="unavailable">غير متوفر</option>
                    </select>
                  </div>
                </div>

                {/* Add item Modal */}
                {isAddModalOpen && (
                  <div style={styles.modalBackdrop}>
                    <div style={{ ...styles.modal, width: 550, maxHeight: '95vh', overflowY: 'auto' }}>
                      <div style={{ ...styles.modalHeader, padding: '12px 20px' }}>
                        <h5 style={{ margin: 0, fontWeight: 700 }}>➕ إضافة وجبة جديدة</h5>
                        <button style={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>✕</button>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                             <label style={{ ...styles.label, marginBottom: 4 }}>صورة الوجبة</label>
                             <div style={{ 
                               border: '2px dashed #d1d5db', 
                               borderRadius: 12, 
                               padding: '12px', 
                               textAlign: 'center',
                               background: '#f9fafb',
                               cursor: 'pointer',
                               position: 'relative',
                               minHeight: 120,
                               display: 'flex',
                               flexDirection: 'column',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }} onClick={() => document.getElementById('menu-img-upload').click()}>
                               {newItem.image ? (
                                 <div style={{ width: '100%' }}>
                                   <img 
                                     src={URL.createObjectURL(newItem.image)} 
                                     alt="Preview" 
                                     style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} 
                                   />
                                   <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>✅ تم اختيار: {newItem.image.name} (انقر للتغيير)</div>
                                 </div>
                               ) : (
                                 <>
                                   <div style={{ fontSize: 30, marginBottom: 8 }}>📸</div>
                                   <div style={{ color: '#6b7280', fontSize: 13 }}>انقر لرفع صورة الوجبة</div>
                                 </>
                               )}
                               <input id="menu-img-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                 onChange={e => setNewItem(p => ({ ...p, image: e.target.files[0] }))} />
                             </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 2 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>اسم الوجبة *</label>
                              <input style={{ ...styles.input, padding: '8px 12px' }} placeholder="مثال: شاورما"
                                value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>السعر (₪) *</label>
                              <input type="number" style={{ ...styles.input, padding: '8px 12px' }} placeholder="25"
                                value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>الفئة</label>
                              <select style={{ ...styles.input, padding: '8px 12px' }} value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                                <option value="Main">الطبق الرئيسي</option>
                                <option value="Appetizer">المقبلات</option>
                                <option value="Dessert">الحلويات</option>
                                <option value="Drink">المشروبات</option>
                              </select>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 42, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background .2s',
                                  background: newItem.is_available ? '#10b981' : '#d1d5db', position: 'relative'
                                }} onClick={() => setNewItem(p => ({ ...p, is_available: !p.is_available }))}>
                                  <div style={{
                                    position: 'absolute', top: 3, left: newItem.is_available ? 22 : 3,
                                    width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                  }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>الوجبة متوفرة</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label style={{ ...styles.label, marginBottom: 4 }}>الوصف</label>
                            <textarea style={{ ...styles.input, height: 60, resize: 'vertical', padding: '8px 12px' }} placeholder="وصف الوجبة..."
                              value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                          <button style={{ ...styles.btnOutline, borderColor: '#d1d5db', color: '#374151', padding: '8px 20px' }} onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                          <button style={{ ...styles.btnSuccess, padding: '8px 24px' }} onClick={async () => {
                            await addMenuItem();
                            setIsAddModalOpen(false);
                          }}>إضافة</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {menuLoading ? (
                  <div style={{ padding: '80px 0' }}><Spinner /></div>
                ) : (
                  <>
                    {/* Menu table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={{ background: '#1f2937' }}>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent' }}>الصورة</th>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                الاسم <span style={{ fontSize: 10, opacity: 0.7 }}>⇅</span>
                              </div>
                            </th>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                السعر <span style={{ fontSize: 10, opacity: 0.7 }}>⇅</span>
                              </div>
                            </th>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                الفئة <span style={{ fontSize: 10, opacity: 0.7 }}>⇅</span>
                              </div>
                            </th>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                الحالة <span style={{ fontSize: 10, opacity: 0.7 }}>⇅</span>
                              </div>
                            </th>
                            <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent' }}>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuItems.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={styles.td}>
                                {item.image_url
                                  ? <img 
                                      src={item.image_url} 
                                      alt={item.name} 
                                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid #eee' }} 
                                      onClick={() => setSelectedPreviewImage(item.image_url)}
                                    />
                                  : <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍽️</div>}
                              </td>
                              <td style={{ ...styles.td, fontWeight: 600 }}>{item.name}</td>
                              <td style={styles.td}>{item.price}₪</td>
                              <td style={styles.td}>{item.category}</td>
                              <td style={styles.td}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <div style={{
                                    width: 42, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background .2s',
                                    background: item.is_available ? '#10b981' : '#d1d5db', position: 'relative'
                                  }} onClick={() => toggleAvailability(item)}>
                                    <div style={{
                                      position: 'absolute', top: 3, left: item.is_available ? 22 : 3,
                                      width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                  </div>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                  <button style={{...styles.btnOutline, padding: '4px 10px', fontSize: 12}} onClick={() => { setEditItem({...item, image: null}); setIsEditModalOpen(true); }}>تعديل</button>
                                  <button style={{...styles.btnDanger, padding: '4px 10px', fontSize: 12}} onClick={() => deleteItem(item.id)}>حذف</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {menuItems.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد وجبات — أضف وجبتك الأولى!</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination UI */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: 24,
                      paddingTop: 20,
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                        عرض <span style={{ color: '#111827', fontWeight: 700 }}>1-10</span> من أصل <span style={{ color: '#111827', fontWeight: 700 }}>42</span> وجبة
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...styles.btnOutline, padding: '7px 14px', borderColor: '#e5e7eb', color: '#9ca3af', cursor: 'default' }} disabled>السابق</button>
                        {[1, 2, 3].map(p => (
                          <button key={p} style={{ 
                            ...styles.btnOutline, 
                            padding: '7px 14px', 
                            minWidth: 40,
                            background: p === 1 ? '#f59e0b' : 'transparent',
                            color: p === 1 ? '#fff' : '#4b5563',
                            borderColor: p === 1 ? '#f59e0b' : '#e5e7eb',
                            boxShadow: p === 1 ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none'
                          }}>{p}</button>
                        ))}
                        <button style={{ ...styles.btnOutline, padding: '7px 14px' }}>التالي</button>
                      </div>
                    </div>
                  </>
                )}

                {/* Edit Menu Item Modal */}
                {isEditModalOpen && editItem && (
                  <div style={styles.modalBackdrop}>
                    <div style={{ ...styles.modal, width: 550, maxHeight: '95vh', overflowY: 'auto' }}>
                      <div style={{ ...styles.modalHeader, padding: '12px 20px' }}>
                        <h5 style={{ margin: 0, fontWeight: 700 }}>✏️ تعديل الوجبة</h5>
                        <button style={styles.closeBtn} onClick={() => { setIsEditModalOpen(false); setEditItem(null); }}>✕</button>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                             <label style={{ ...styles.label, marginBottom: 4 }}>صورة الوجبة</label>
                             <div style={{ 
                               border: '2px dashed #d1d5db', 
                               borderRadius: 12, 
                               padding: '12px', 
                               textAlign: 'center',
                               background: '#f9fafb',
                               cursor: 'pointer',
                               position: 'relative',
                               minHeight: 140,
                               display: 'flex',
                               flexDirection: 'column',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }} onClick={() => document.getElementById('edit-menu-img-upload').click()}>
                               {editItem.image ? (
                                 <div style={{ width: '100%' }}>
                                   <img 
                                     src={URL.createObjectURL(editItem.image)} 
                                     alt="New Preview" 
                                     style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} 
                                   />
                                   <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>✅ تم اختيار صورة جديدة (انقر للتغيير)</div>
                                 </div>
                               ) : editItem.image_url ? (
                                 <div style={{ width: '100%' }}>
                                   <img 
                                     src={editItem.image_url} 
                                     alt="Current" 
                                     style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} 
                                   />
                                   <div style={{ color: '#6b7280', fontSize: 13 }}>📸 انقر لتغيير الصورة الحالية</div>
                                 </div>
                               ) : (
                                 <>
                                   <div style={{ fontSize: 30, marginBottom: 8 }}>📸</div>
                                   <div style={{ color: '#6b7280', fontSize: 13 }}>انقر لرفع صورة</div>
                                 </>
                               )}
                               <input id="edit-menu-img-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                 onChange={e => setEditItem(p => ({ ...p, image: e.target.files[0] }))} />
                             </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 2 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>اسم الوجبة *</label>
                              <input style={{ ...styles.input, padding: '8px 12px' }} value={editItem.name || ''} 
                                onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>السعر (₪) *</label>
                              <input type="number" style={{ ...styles.input, padding: '8px 12px' }} value={editItem.price || ''} 
                                onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ ...styles.label, marginBottom: 4 }}>الفئة</label>
                              <select style={{ ...styles.input, padding: '8px 12px' }} value={editItem.category || 'Main'} 
                                onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))}>
                                <option value="Main">الطبق الرئيسي</option>
                                <option value="Appetizer">المقبلات</option>
                                <option value="Dessert">الحلويات</option>
                                <option value="Drink">المشروبات</option>
                              </select>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 42, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background .2s',
                                  background: editItem.is_available ? '#10b981' : '#d1d5db', position: 'relative'
                                }} onClick={() => setEditItem(p => ({ ...p, is_available: !p.is_available }))}>
                                  <div style={{
                                    position: 'absolute', top: 3, left: editItem.is_available ? 22 : 3,
                                    width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                  }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>متوفرة</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label style={{ ...styles.label, marginBottom: 4 }}>الوصف</label>
                            <textarea style={{ ...styles.input, height: 60, resize: 'vertical', padding: '8px 12px' }} 
                              value={editItem.description || ''} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                          <button style={{ ...styles.btnOutline, borderColor: '#d1d5db', color: '#374151', padding: '8px 20px' }} 
                            onClick={() => { setIsEditModalOpen(false); setEditItem(null); }}>إلغاء</button>
                          <button style={{ ...styles.btnSuccess, padding: '8px 24px' }} onClick={updateMenuItem}>حفظ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Global Image Preview Modal for Restaurant section */}
            {selectedPreviewImage && (
              <div style={styles.modalBackdrop} onClick={() => setSelectedPreviewImage(null)}>
                <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                  <button style={{
                    position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', 
                    color: '#fff', fontSize: 30, cursor: 'pointer', zIndex: 10
                  }} onClick={() => setSelectedPreviewImage(null)}>✕</button>
                  <img src={selectedPreviewImage} alt="Preview" style={{ width: '100%', height: 'auto', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                </div>
              </div>
            )}
          </div>
        );

      // ── RESERVATIONS ───────────────────────────────────────
      case 'reservations':
        if (reservationsLoading || capacityLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>الحجوزات</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeResTab === 'list' ? '#fd7e14' : 'transparent',
                    color: activeResTab === 'list' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveResTab('list')}
                >
                  طلبات الحجز
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeResTab === 'capacity' ? '#fd7e14' : 'transparent',
                    color: activeResTab === 'capacity' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveResTab('capacity')}
                >
                  إعدادات السعة
                  {capacityDirty && <span style={{ marginLeft: 5 }}>*</span>}
                </button>
              </div>
            </div>

            {activeResTab === 'list' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
                  <button style={styles.btnOutline} onClick={fetchReservations}>تحديث 🔄</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['اسم العميل', 'وقت البدء', 'وقت الانتهاء', 'عدد الأفراد', 'ملاحظات', 'سبب الإلغاء', 'الحالة', 'إجراءات'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد حجوزات حالياً</td></tr>
                      ) : reservations.map(res => {
                        const statusStr = res.status?.toUpperCase() || 'PENDING';
                        const isPending = statusStr === 'PENDING';
                        const isConfirmed = statusStr === 'CONFIRMED';
                        
                        return (
                        <tr key={res.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={styles.td}><strong>{res.user?.name || 'مجهول'}</strong></td>
                          <td style={{ ...styles.td, direction: 'ltr' }}>{new Date(res.start_at).toLocaleString('ar-EG')}</td>
                          <td style={{ ...styles.td, direction: 'ltr' }}>{new Date(res.end_at).toLocaleString('ar-EG')}</td>
                          <td style={styles.td}>{res.party_size} أشخاص</td>
                          <td style={styles.td}>{res.notes || '-'}</td>
                          <td style={styles.td}>{res.cancel_reason || '-'}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              background: isConfirmed ? '#d1fae5' : isPending ? '#fef3c7' : '#fee2e2',
                              color: isConfirmed ? '#065f46' : isPending ? '#92400e' : '#991b1b',
                            }}>
                              {isConfirmed ? 'مؤكد' : isPending ? 'قيد الانتظار' : 'مرفوض'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {isPending && (
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button style={styles.btnSuccess} onClick={() => confirmReservation(res.id)}>✓ تأكيد</button>
                                <button style={styles.btnDanger} onClick={() => setSelectedResId(res.id)}>✗ رفض</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )})}
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
              </>
            ) : (
              <>
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
              </>
            )}
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



      // ── REVIEWS ────────────────────────────────────────────
      case 'reviews':
        if (reviewsLoading) return <Spinner />;
        const reviewList = reviews?.results || [];
        const hasReviews = reviewList.length > 0;

        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>⭐ التقييمات والتحليلات</h3>
              <div style={{ display: 'flex', gap: '10px', marginRight: 'auto', marginLeft: 0 }}>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeReviewsTab === 'list' ? '#fd7e14' : 'transparent',
                    color: activeReviewsTab === 'list' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveReviewsTab('list')}
                >
                  تقييمات العملاء
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    background: activeReviewsTab === 'ai' ? '#fd7e14' : 'transparent',
                    color: activeReviewsTab === 'ai' ? '#fff' : '#fd7e14',
                    borderColor: '#fd7e14'
                  }}
                  onClick={() => setActiveReviewsTab('ai')}
                >
                  ملخص AI
                </button>
              </div>
            </div>

            {activeReviewsTab === 'list' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
                  <button style={styles.btnOutline} onClick={fetchReviews}>تحديث 🔄</button>
                </div>

                {/* Average Ratings */}
                {hasReviews && (
                  <div style={{ ...styles.statsGrid, marginBottom: 24 }}>
                    {[
                      { label: 'متوسط الطعام', value: reviews.avg_food, color: '#f59e0b' },
                      { label: 'متوسط الخدمة', value: reviews.avg_service, color: '#10b981' },
                      { label: 'متوسط الأجواء', value: reviews.avg_ambiance, color: '#6366f1' },
                    ].map(s => (
                      <div key={s.label} style={{ ...styles.statCard, padding: '16px 12px', borderTop: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value} <span style={{ fontSize: 14 }}>⭐</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {!hasReviews ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60, fontSize: 15 }}>
                    لا توجد تقييمات حتى الآن
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviewList.map((r, i) => (
                      <div key={r.id || i} style={{
                        border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px',
                        background: '#fafafa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                              overflow: 'hidden'
                            }}>
                              {r.user?.image_url ? (
                                <img src={r.user.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ color: '#9ca3af' }}>👤</span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                {r.user?.first_name} {r.user?.last_name}
                              </div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                {r.sentiment === 'POSITIVE' ? '😊 إيجابي' : r.sentiment === 'NEGATIVE' ? '😟 سلبي' : '😐 محايد'}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                              {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ fontSize: 16, color: s <= r.overall_rate ? '#f59e0b' : '#d1d5db' }}>★</span>
                              ))}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                              طعام: {r.food_rate} | خدمة: {r.service_rate} | أجواء: {r.ambiance_rate}
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <p style={{ margin: '8px 0 0 0', color: '#374151', fontSize: 14, lineHeight: 1.6, textAlign: 'right' }}>{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <h4 style={{ marginBottom: 16, color: '#374151' }}>🤖 ملخص ذكي للتقييمات</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, borderRight: '5px solid #22c55e' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#166534', fontWeight: 700 }}>✅ النقاط الإيجابية</h5>
                    <p style={{ margin: 0, color: '#166534', fontSize: 14 }}>العملاء يثنون باستمرار على جودة الطعام وسرعة الخدمة. الأجواء العامة للمطعم تعتبر مريحة وجاذبة للعائلات.</p>
                  </div>
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 12, padding: 20, borderRight: '5px solid #f97316' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#9a3412', fontWeight: 700 }}>⚠️ مجالات التحسين</h5>
                    <p style={{ margin: 0, color: '#9a3412', fontSize: 14 }}>بعض العملاء أشاروا إلى أن الضوضاء قد تكون مرتفعة في أوقات الذروة. نقترح إضافة بعض العوازل الصوتية أو توزيع الطاولات بشكل أفضل.</p>
                  </div>
                  <div style={{ background: '#f8fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontStyle: 'italic' }}>يتم تحديث هذا الملخص تلقائياً بناءً على آخر 50 تقييم من عملائك.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ── STATUS & PUBLISH ────────────────────────────────────
      case 'status': {
        if (statusLoading) return <Spinner />;
        const isPublished = restaurantStatus?.status === 'published';
        const checks = restaurantStatus?.checks || {};
        const isReady = restaurantStatus?.is_ready;

        const checkItems = [
          { key: 'info', label: 'معلومات المطعم الأساسية' },
          { key: 'license', label: 'الرخصة التجارية' },
          { key: 'capacity', label: 'إعدادات السعة' },
          { key: 'days', label: 'ساعات العمل' },
          { key: 'menu', label: 'قائمة الطعام' },
        ];

        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>📡 النشر وحالة المطعم</h3>
              <button style={styles.btnOutline} onClick={fetchStatus}>تحديث 🔄</button>
            </div>

            {/* Status card */}
            <div style={{
              borderRadius: 16, padding: 28, marginBottom: 24, textAlign: 'center',
              background: isPublished ? '#f0fdf4' : '#fff5f5',
              border: `2px solid ${isPublished ? '#86efac' : '#fca5a5'}`
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{isPublished ? '🟢' : '🔴'}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isPublished ? '#166534' : '#991b1b', marginBottom: 6 }}>
                {isPublished ? 'المطعم منشور (Published)' : 'المطعم غير منشور (Not Published)'}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {isPublished
                  ? 'مطعمك ظاهر للعملاء ويمكنهم إجراء حجوزات حالياً'
                  : 'مطعمك مخفي عن العملاء حالياً'}
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: 30, background: '#f9fafb', padding: 25, borderRadius: 14, border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: 20, fontSize: 17, fontWeight: 700, color: '#374151' }}>📋 حالة متطلبات النشر:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {checkItems.map(item => {
                  const check = checks[item.key];
                  const ready = check?.ready;
                  return (
                    <div key={item.key} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      padding: '10px 15px',
                      background: '#fff',
                      borderRadius: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <span style={{ fontSize: 20 }}>{ready ? '✅' : '❌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: ready ? '#111827' : '#ef4444', 
                          fontWeight: 600,
                          fontSize: 15
                        }}>
                          {item.label}
                        </div>
                        {item.key === 'license' && check?.status && (
                          <div style={{ fontSize: 12, color: check.status === 'APPROVED' ? '#10b981' : '#f59e0b' }}>
                            الحالة: {check.status}
                          </div>
                        )}
                        {!ready && check?.requires && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            المطلوب: {check.requires}
                          </div>
                        )}
                        {!ready && check?.missing && check.missing.length > 0 && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            نقص في: {check.missing.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {!isReady && !isPublished && (
                <div style={{ 
                  marginTop: 20, 
                  padding: '12px 16px', 
                  background: '#fffbeb', 
                  border: '1px solid #fde68a', 
                  borderRadius: 10, 
                  color: '#92400e', 
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                   <span>⚠️</span>
                   <span>يرجى استكمال المتطلبات باللون الأحمر لتتمكن من تفعيل خيار النشر.</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              {isPublished ? (
                <button 
                  style={{ ...styles.btnDanger, padding: '14px 40px', fontSize: 16, fontWeight: 700, borderRadius: 12 }} 
                  onClick={unpublishRestaurant}
                >
                  ⏸️ إلغاء النشر (Unpublish)
                </button>
              ) : (
                <button 
                  style={{ 
                    ...styles.btnSuccess, 
                    padding: '14px 40px', 
                    fontSize: 16, 
                    fontWeight: 700, 
                    borderRadius: 12,
                    opacity: isReady ? 1 : 0.6,
                    cursor: isReady ? 'pointer' : 'not-allowed',
                    boxShadow: isReady ? '0 4px 12px rgba(34, 197, 94, 0.2)' : 'none'
                  }} 
                  onClick={publishRestaurant}
                  disabled={!isReady}
                >
                  🚀 نشر المطعم (Publish)
                </button>
              )}
            </div>
          </div>
        );
      }

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



      // ── PROFILE ────────────────────────────────────────────
      case 'profile':
        if (profileLoading) return <Spinner />;
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>الملف الشخصي</h3>
            </div>
            <div style={{ background: '#fff3e8', border: '1px solid #ffd6b0', borderRight: '5px solid #fd7e14', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontWeight: 700, color: '#d97706' }}>
              نوع الحساب: {profileData.role || 'غير معروف'}
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>الاسم الأول</label>
                <input style={styles.input} value={profileData.first_name} onChange={e => setProfileData(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <label style={styles.label}>الاسم الأخير</label>
                <input style={styles.input} value={profileData.last_name} onChange={e => setProfileData(p => ({ ...p, last_name: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>البريد الإلكتروني</label>
                <input type="email" style={{ ...styles.input, background: '#f9fafb', color: '#9ca3af' }} value={profileData.email} disabled />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>رقم الهاتف</label>
                <input style={styles.input} value={profileData.phone_number} onChange={e => setProfileData(p => ({ ...p, phone_number: e.target.value }))} />
              </div>
            </div>
            <button style={{ ...styles.btnPrimary, marginTop: 20, width: '100%' }} onClick={handleProfileSubmit} disabled={profileSaving}>
              {profileSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        );

      default: return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════
  if (role === 'ADMIN') {
    return <AdminDashboard />;
  }

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
            <React.Fragment key={item.key}>
              <button onClick={() => {
                if (item.key === 'reservations') {
                  setResMenuOpen(!resMenuOpen);
                } else if (item.key === 'restaurant') {
                  setRestMenuOpen(!restMenuOpen);
                } else if (item.key === 'reviews') {
                  setReviewsMenuOpen(!reviewsMenuOpen);
                } else {
                  handleNav(item.key);
                }
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
                borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                textAlign: 'right', direction: 'rtl', width: '100%', transition: 'all .15s',
                background: activeSection === item.key ? '#f59e0b' : 'transparent',
                color: activeSection === item.key ? '#fff' : '#9ca3af',
              }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.key === 'reservations' && (
                  <span style={{ transform: resMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▼</span>
                )}
                {item.key === 'restaurant' && (
                  <span style={{ transform: restMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▼</span>
                )}
                {item.key === 'reviews' && (
                  <span style={{ transform: reviewsMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▼</span>
                )}
                {item.dirty && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />}
              </button>

              {item.key === 'restaurant' && restMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 32, marginTop: -2, marginBottom: 4 }}>
                  <button onClick={() => { handleNav('restaurant'); setActiveRestTab('info'); }} style={{
                    background: 'transparent', border: 'none', color: activeRestTab === 'info' && activeSection === 'restaurant' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeRestTab === 'info' && activeSection === 'restaurant' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - البيانات الأساسية
                  </button>
                  <button onClick={() => { handleNav('restaurant'); setActiveRestTab('hours'); }} style={{
                    background: 'transparent', border: 'none', color: activeRestTab === 'hours' && activeSection === 'restaurant' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeRestTab === 'hours' && activeSection === 'restaurant' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - ساعات العمل
                  </button>
                  <button onClick={() => { handleNav('restaurant'); setActiveRestTab('images'); }} style={{
                    background: 'transparent', border: 'none', color: activeRestTab === 'images' && activeSection === 'restaurant' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeRestTab === 'images' && activeSection === 'restaurant' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - صور المطعم
                  </button>
                  <button onClick={() => { handleNav('restaurant'); setActiveRestTab('menu'); }} style={{
                    background: 'transparent', border: 'none', color: activeRestTab === 'menu' && activeSection === 'restaurant' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeRestTab === 'menu' && activeSection === 'restaurant' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - المينيو
                  </button>
                </div>
              )}
              
              {item.key === 'reservations' && resMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 32, marginTop: -2, marginBottom: 4 }}>
                  <button onClick={() => { handleNav('reservations'); setActiveResTab('list'); }} style={{
                    background: 'transparent', border: 'none', color: activeResTab === 'list' && activeSection === 'reservations' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeResTab === 'list' && activeSection === 'reservations' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - طلبات الحجز
                  </button>
                  <button onClick={() => { handleNav('reservations'); setActiveResTab('capacity'); }} style={{
                    background: 'transparent', border: 'none', color: activeResTab === 'capacity' && activeSection === 'reservations' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeResTab === 'capacity' && activeSection === 'reservations' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - إعدادات السعة
                  </button>
                </div>
              )}

              {item.key === 'reviews' && reviewsMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 32, marginTop: -2, marginBottom: 4 }}>
                  <button onClick={() => { handleNav('reviews'); setActiveReviewsTab('list'); }} style={{
                    background: 'transparent', border: 'none', color: activeReviewsTab === 'list' && activeSection === 'reviews' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeReviewsTab === 'list' && activeSection === 'reviews' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - تقييمات العملاء
                  </button>
                  <button onClick={() => { handleNav('reviews'); setActiveReviewsTab('ai'); }} style={{
                    background: 'transparent', border: 'none', color: activeReviewsTab === 'ai' && activeSection === 'reviews' ? '#f59e0b' : '#9ca3af',
                    textAlign: 'right', padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 8,
                    fontWeight: activeReviewsTab === 'ai' && activeSection === 'reviews' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                    - ملخص الذكاء الاصطناعي
                  </button>
                </div>
              )}
            </React.Fragment>
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
