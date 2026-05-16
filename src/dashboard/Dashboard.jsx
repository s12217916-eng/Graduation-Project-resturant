// Dashboard.jsx
import axios from 'axios';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { logoutUser, getProfile, updateProfile } from '../services/authService';
import {
  LayoutDashboard,
  Store,
  Calendar,
  FileText,
  Star,
  Radio,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Info,
  Clock,
  Image as ImageIcon,
  Menu as MenuIcon,
  Users,
  Settings,
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
  Bell,
  Search,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in React
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to handle map clicks
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });
  return position.lat && position.lng ? (
    <Marker position={[position.lat, position.lng]} icon={markerIcon} />
  ) : null;
}

// Helper component to recenter map when coordinates change
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 13);
    }
  }, [lat, lon, map]);
  return null;
}



const API = 'https://revvo-server.onrender.com/api';

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
  { day: "MONDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "TUESDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "WEDNESDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "THURSDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "FRIDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "23:00" },
  { day: "SATURDAY", is_closed: true, is_open_24h: false, open_time: null, close_time: null },
  { day: "SUNDAY", is_closed: true, is_open_24h: false, open_time: null, close_time: null },
];

// ─── SubNavItem Helper ──────────────────────────────────────────────────────
const SubNavItem = ({ label, active, onClick, icon, dirty }) => (
  <button onClick={onClick} style={{
    background: active ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
    border: 'none',
    color: active ? '#f59e0b' : '#64748b',
    textAlign: 'right',
    padding: '10px 16px',
    fontSize: 13,
    cursor: 'pointer',
    borderRadius: 12,
    fontWeight: active ? 700 : 500,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%'
  }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.color = '#cbd5e1';
      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.color = '#64748b';
      if (!active) e.currentTarget.style.background = 'transparent';
    }}>
    <span style={{ color: active ? '#f59e0b' : 'inherit', display: 'flex', opacity: active ? 1 : 0.7 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {dirty && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />}
  </button>
);

const SECTION_NAMES = {
  overview: 'نظرة عامة',
  restaurant: 'إدارة المطعم',
  reservations: 'الحجوزات',
  reviews: 'التقييمات',
  license: 'الرخصة التجارية',
  analytics: 'التحليلات',
  profile: 'الملف الشخصي',
  ai_assistant: 'المساعد الذكي'
};

const SECTION_ICONS = {
  overview: <LayoutDashboard size={20} />,
  restaurant: <Store size={20} />,
  reservations: <Calendar size={20} />,
  reviews: <Star size={20} />,
  license: <FileText size={20} />,
  analytics: <BarChart3 size={20} />,
  profile: <User size={20} />,
  ai_assistant: <Sparkles size={20} />,
};

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
    name: '', about: '', category: '', address: '', email: '',
    lat: '', lon: '', phone_number: '', website: '', image: null, image_url: '', image_preview: null
  });
  const [restaurantDirty, setRestaurantDirty] = useState(false);
  const [restaurantLoaded, setRestaurantLoaded] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const [licenseData, setLicenseData] = useState({
    license_number: '', license_expiry: '', license_image: null, id_image: null,
    license_image_url: '', id_image_url: ''
  });
  const [licenseDirty, setLicenseDirty] = useState(false);
  const [licenseExists, setLicenseExists] = useState(false);
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);
  const [hoursDirty, setHoursDirty] = useState(false);
  const [hoursExist, setHoursExist] = useState(false);
  const [hoursLoaded, setHoursLoaded] = useState(false);
  const [hoursLoading, setHoursLoading] = useState(false);

  const [capacityData, setCapacityData] = useState({
    max_capacity: 60, slot_duration: 90, max_party_size: 10, auto_confirm: true
  });
  const [capacityDirty, setCapacityDirty] = useState(false);
  const [capacityLoaded, setCapacityLoaded] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(false);

  const [menuItems, setMenuItems] = useState([]);
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
  const [isAddResModalOpen, setIsAddResModalOpen] = useState(false);
  const [newRes, setNewRes] = useState({ date: '', party_size: 2, time: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [reviews, setReviews] = useState({ results: [], count: 0, avg_food: 0, avg_service: 0, avg_ambiance: 0 });
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [restaurantStatus, setRestaurantStatus] = useState(null); // null | 'published' | 'unpublished'
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', phone_number: '', email: '', role: '',
    image_url: '', image: null, image_preview: null
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [emailData, setEmailData] = useState({ current_password: '', new_email: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [activeProfileTab, setActiveProfileTab] = useState('info'); // 'info', 'email', 'password'
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const [role, setRole] = useState(userFromStorage.role || '');


  const [activeResTab, setActiveResTab] = useState('list'); // 'list' or 'capacity'
  const [resMenuOpen, setResMenuOpen] = useState(false);
  const [activeReviewsTab, setActiveReviewsTab] = useState('list'); // 'list' or 'ai'
  const [reviewsMenuOpen, setReviewsMenuOpen] = useState(false);
  const [activeRestTab, setActiveRestTab] = useState('info'); // 'info', 'hours', 'images', 'menu'
  const [restMenuOpen, setRestMenuOpen] = useState(false);
  const [reviewsAiRange, setReviewsAiRange] = useState('7');
  const [reviewFilters, setReviewFilters] = useState({
    search: '',
    sentiment: '',
    rating: '',
    sort: 'newest',
    dateFrom: '',
    dateTo: '',
  });
  const [resAiRange, setResAiRange] = useState('7');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // ── AI ASSISTANT STATE ──
  const [aiMessages, setAiMessages] = useState([
    { text: "أهلاً بك في مساعد Dine Advisor الذكي! 🤖 كيف يمكنني مساعدتك في إدارة مطعمك اليوم؟", sender: 'bot' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const aiMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeSection === 'ai_assistant') {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, activeSection]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleAiSend = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const newMsg = { text: aiInput, sender: 'user' };
    setAiMessages(prev => [...prev, newMsg]);
    setAiInput('');
    setTimeout(() => {
      setAiMessages(prev => [...prev, { text: "أنا المساعد الذكي الخاص بك. حالياً أنا في طور التدريب وسأتمكن قريباً من الإجابة على استفساراتك بشكل دقيق! 🚀", sender: 'bot' }]);
    }, 1000);
  };

  const clearAiChat = () => {
    if (window.confirm('هل أنت متأكد من مسح المحادثة؟')) {
      setAiMessages([{ text: "أهلاً بك مجدداً! تم مسح المحادثة السابقة. كيف يمكنني مساعدتك الآن؟ 🤖", sender: 'bot' }]);
    }
  };

  // Automatically fetch data when sections or tabs change
  useEffect(() => {
    if (!profileLoaded) fetchProfileData();

    // Overview / Status
    if (activeSection === 'overview' || activeSection === 'status') {
      fetchStatus();
    }

    // Restaurant section tabs
    if (activeSection === 'restaurant') {
      if (activeRestTab === 'info') fetchRestaurant();
      if (activeRestTab === 'hours') fetchHours();
      if (activeRestTab === 'images') fetchImages();
      if (activeRestTab === 'menu') fetchMenu();
    }

    // Reservations section tabs
    if (activeSection === 'reservations') {
      if (activeResTab === 'list') fetchReservations();
      if (activeResTab === 'capacity') fetchCapacity();
    }

    // Reviews section
    if (activeSection === 'reviews' && activeReviewsTab === 'list') {
      fetchReviews();
    }

    // Profile section
    if (activeSection === 'profile') {
      fetchProfileData();
    }

    // License section
    if (activeSection === 'license') {
      fetchLicense();
    }

    // Analytics section
    if (activeSection === 'analytics') {
      // If there's an analytics fetcher, call it here
    }
  }, [activeSection, activeRestTab, activeResTab, activeReviewsTab, activeProfileTab, refreshNonce]);

  // ── section navigation: lazy-load on first visit ──
  const handleNav = async (key) => {
    if (key === 'logout') {
      await handleLogout();
      return;
    }
    setActiveSection(key);
    setRefreshNonce(prev => prev + 1); // Force re-fetch even if section is already active
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
        phone_number: d.phone_number || '', website: d.website || '',
        email: d.email || '',
        image: null,
        image_url: fixImageUrl(d.image_url),
        image_preview: null
      });
      setRestaurantLoaded(true);
      setRestaurantDirty(false);
    } catch { toast('فشل جلب بيانات المطعم', 'error'); }
    finally { setRestaurantLoading(false); }
  };

  const handleRestaurantChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setRestaurantData(prev => ({
          ...prev,
          [name]: file,
          image_preview: URL.createObjectURL(file)
        }));
      }
    } else {
      setRestaurantData(prev => ({ ...prev, [name]: value }));
    }
    setRestaurantDirty(true);
  };

  const updateRestaurant = async () => {
    try {
      const formData = new FormData();
      formData.append('name', restaurantData.name || '');
      formData.append('about', restaurantData.about || '');
      formData.append('category', restaurantData.category || '');
      formData.append('address', restaurantData.address || '');
      formData.append('phone_number', restaurantData.phone_number || '');
      formData.append('email', restaurantData.email || '');
      formData.append('website', restaurantData.website?.trim() ? restaurantData.website.trim() : '');
      formData.append('lat', restaurantData.lat || '');
      formData.append('lon', restaurantData.lon || '');

      if (restaurantData.image instanceof File) {
        formData.append('image', restaurantData.image);
      }

      await axios.put(`${API}/owner/restaurant/`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });

      toast('تم تحديث بيانات المطعم بنجاح ✅');
      setRestaurantDirty(false);
      fetchRestaurant(); // Refresh to get the new image URL
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
        license_image: null, id_image: null,
        license_image_url: d.license_image_url || '',
        id_image_url: d.id_image_url || ''
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
      if (licenseData.id_image) formData.append('id_image', licenseData.id_image);

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
          open_time: d.open_time ? d.open_time.slice(0, 5) : null,
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
        updated[index].open_time = null;
        updated[index].close_time = null;
        if (field === 'is_closed') updated[index].is_open_24h = false;
        if (field === 'is_open_24h') updated[index].is_closed = false;
      }
      return updated;
    });
    setHoursDirty(true);
  };

  const saveHours = async () => {
    try {
      const cleanedHours = workingHours.map(item => ({
        ...item,
        open_time: (item.is_closed || item.is_open_24h) ? null : item.open_time,
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
    return `https://revvo-server.onrender.com${url}`;
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

  const fetchAvailability = async (date, partySize) => {
    if (!date || !partySize) return;
    setSlotsLoading(true);
    try {
      const res = await axios.get(`${API}/owner/restaurant/reservations/availability?date=${date}&party_size=${partySize}`, { headers: authHeader() });
      setAvailableSlots(res.data.available_slots || res.data || []);
    } catch (err) {
      toast('فشل جلب الأوقات المتاحة', 'error');
    } finally {
      setSlotsLoading(false);
    }
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
      const res = await axios.get(`${API}/auth/me`, { headers: authHeader() });
      const data = res.data;
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        role: data.role || '',
        image_url: fixImageUrl(data.image_url || data.image),
        image: null,
        image_preview: null
      });
      setRole(data.role || '');
      setProfileLoaded(true);
    } catch { toast('تعذر تحميل بيانات البروفايل', 'error'); }
    setProfileLoading(false);
  };

  const handleProfileSubmit = async () => {
    try {
      setProfileSaving(true);
      const formData = new FormData();
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      formData.append('phone_number', profileData.phone_number);
      if (profileData.image instanceof File) {
        formData.append('image', profileData.image);
      }

      await axios.put(`${API}/auth/me/`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });

      toast('تم تحديث الملف الشخصي بنجاح ✅');
      fetchProfileData();
    } catch (err) {
      toast(err.response?.data?.detail || 'فشل تحديث الملف الشخصي', 'error');
    } finally { setProfileSaving(false); }
  };

  const handleChangeEmail = async () => {
    if (!emailData.current_password || !emailData.new_email) {
      toast('يرجى ملء جميع الحقول', 'warning'); return;
    }
    try {
      setProfileSaving(true);
      await axios.post(`${API}/auth/change-email/`, emailData, { headers: authHeader() });
      toast('تم تغيير البريد الإلكتروني بنجاح');
      setEmailData({ current_password: '', new_email: '' });
      fetchProfileData();
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.detail || 'فشل تغيير البريد', 'error');
    } finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast('يرجى ملء جميع الحقول', 'warning'); return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast('كلمتا المرور غير متطابقتين', 'error'); return;
    }
    try {
      setProfileSaving(true);
      await axios.post(`${API}/auth/change-password/`, passwordData, { headers: authHeader() });
      toast('تم تغيير كلمة المرور بنجاح');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.detail || 'فشل تغيير كلمة المرور', 'error');
    } finally { setProfileSaving(false); }
  };

  // ── SIDEBAR ──
  const sidebarItems = [
    { key: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard size={20} /> },
    { key: 'restaurant', label: 'معلومات المطعم', icon: <Store size={20} />, dirty: restaurantDirty || hoursDirty },
    { key: 'reservations', label: 'الحجوزات', icon: <Calendar size={20} />, dirty: capacityDirty },
    { key: 'reviews', label: 'التقييمات', icon: <Star size={20} /> },
    { key: 'license', label: 'الرخصة', icon: <FileText size={20} />, dirty: licenseDirty },
    { key: 'analytics', label: 'التحليلات', icon: <BarChart3 size={20} /> },
    { key: 'ai_assistant', label: 'المساعد الذكي', icon: <Sparkles size={20} />, isAI: true },
  ];


  // ═══════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    switch (activeSection) {

      // ── OVERVIEW ──────────────────────────────────────────
      case 'overview': {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div>
              <h2 style={styles.pageTitle}>مرحباً بك 👋</h2>
              <div style={styles.statsGrid}>
                {[
                  { label: 'إجمالي الحجوزات', value: '420', icon: '📅', color: '#f59e0b' },
                  { label: 'التقييم العام', value: '4.9 ⭐', icon: '⭐', color: '#10b981' },
                  { label: 'إجمالي العملاء', value: '640', icon: '👥', color: '#6366f1' },
                ].map(s => (
                  <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📡 حالة نشر المطعم</h3>
                <button style={styles.btnOutline} onClick={fetchStatus}>تحديث 🔄</button>
              </div>

              {statusLoading ? <Spinner /> : (
                <>
                  <div style={{
                    borderRadius: 24, padding: '30px 20px', marginBottom: 24, textAlign: 'center',
                    background: isPublished ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
                    border: `1px solid ${isPublished ? '#86efac' : '#fca5a5'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, justifyContent: 'center',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: 48, background: '#fff', width: 80, height: 80, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {isPublished ? '🌐' : '🛑'}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: isPublished ? '#166534' : '#991b1b', marginBottom: 4 }}>
                        {isPublished ? 'المطعم متاح للجميع' : 'المطعم في وضع المعاينة'}
                      </div>
                      <div style={{ fontSize: 14, color: isPublished ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
                        {isPublished ? 'يمكن للعملاء الآن العثور على مطعمك وحجز طاولاتهم بسهولة.' : 'أكمل المتطلبات أدناه لتتمكن من نشر مطعمك وجذب الزوار.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: 24, borderRadius: 20, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#374151' }}>📋 متطلبات النشر:</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isPublished ? '#ef4444' : '#10b981' }}>
                          {isPublished ? 'إلغاء النشر' : 'نشر المطعم'}
                        </span>
                        <label className="switch" style={{ width: 60, height: 30 }}>
                          <input
                            type="checkbox"
                            checked={isPublished}
                            disabled={!isReady && !isPublished}
                            onChange={() => {
                              if (isPublished) unpublishRestaurant();
                              else publishRestaurant();
                            }}
                          />
                          <span className="slider green" style={{ borderRadius: 30 }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: 22,
                              width: 22,
                              left: isPublished ? 34 : 4,
                              bottom: 4,
                              backgroundColor: 'white',
                              transition: '.3s',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {checkItems.map(item => {
                        const check = checks[item.key];
                        const ready = check?.ready;
                        return (
                          <div key={item.key} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', background: ready ? '#f0fdf4' : '#fff1f2',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                            }}>
                              {ready ? '✅' : '❌'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: ready ? '#111827' : '#ef4444', flex: 1 }}>{item.label}</div>
                            {ready ? (
                              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>مكتمل</span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (item.key === 'info') handleNav('restaurant');
                                  if (item.key === 'license') handleNav('license');
                                  if (item.key === 'capacity') { setActiveSection('reservations'); setActiveResTab('capacity'); }
                                  if (item.key === 'days') { setActiveSection('restaurant'); setActiveRestTab('hours'); }
                                  if (item.key === 'menu') { setActiveSection('restaurant'); setActiveRestTab('menu'); }
                                }}
                                style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              >إكمال الآن</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      // ── RESTAURANT ─────────────────────────────────────────
      case 'restaurant':
        // Individual tab loading handling below
        return (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 0 20px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>إدارة المطعم</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>تحكم في بيانات المطعم الأساسية، ساعات العمل، الصور، وقائمة الطعام</p>
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 32, padding: '0 28px' }}>
                {[
                  { key: 'info', label: 'البيانات الأساسية', dirty: restaurantDirty },
                  { key: 'hours', label: 'ساعات العمل', dirty: hoursDirty },
                  { key: 'images', label: 'صور المطعم' },
                  { key: 'menu', label: 'المينيو' }
                ].map(tab => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveRestTab(tab.key)}
                    style={{
                      padding: '12px 4px',
                      fontSize: 15,
                      fontWeight: activeRestTab === tab.key ? 700 : 500,
                      color: activeRestTab === tab.key ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {tab.label} {tab.dirty && <span style={{ color: '#f59e0b', fontSize: 10 }}>●</span>}
                    {activeRestTab === tab.key && (
                      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>

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
                      <div>
                        <label style={styles.label}>البريد الإلكتروني (Email)</label>
                        <input name="email" style={styles.input} placeholder="restaurant@example.com" value={restaurantData.email} onChange={handleRestaurantChange} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={styles.label}>موقع المطعم على الخريطة (انقر لتحديد الموقع)</label>
                        <div style={{
                          height: 300,
                          borderRadius: 16,
                          overflow: 'hidden',
                          border: '1px solid #eef2f6',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          marginBottom: 16,
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <MapContainer
                            center={[restaurantData.lat || 31.9037, restaurantData.lon || 35.2034]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationPicker
                              position={{ lat: restaurantData.lat, lng: restaurantData.lon }}
                              setPosition={(lat, lon) => {
                                setRestaurantData(prev => ({ ...prev, lat, lon }));
                                setRestaurantDirty(true);
                              }}
                            />
                            <RecenterMap lat={restaurantData.lat} lon={restaurantData.lon} />
                          </MapContainer>
                        </div>
                        <div style={{ display: 'flex', gap: 12, background: '#f8fafb', padding: '10px 15px', borderRadius: 12, border: '1px solid #eef2f6' }}>
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>Lat:</span> {restaurantData.lat || '-'}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>Lon:</span> {restaurantData.lon || '-'}
                          </div>
                          <div style={{ flex: 1 }} />
                          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>* سيتم استخدام هذه الإحداثيات لظهور مطعمك في نتائج البحث القريبة للعملاء.</div>
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={styles.label}>صورة غلاف المطعم</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#f8fafb', padding: 12, borderRadius: 12, border: '1px solid #eef2f6' }}>
                          <div
                            style={{
                              width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
                              border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              cursor: 'pointer', background: '#fff', flexShrink: 0
                            }}
                            onClick={() => setSelectedPreviewImage(restaurantData.image_preview || restaurantData.image_url)}
                          >
                            {(restaurantData.image_preview || restaurantData.image_url) ? (
                              <img src={restaurantData.image_preview || restaurantData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 24 }}>🖼️</div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>انقر على الصورة للمعاينة، أو اختر ملفاً جديداً للتغيير</p>
                            <button
                              style={{ ...styles.btnOutline, padding: '8px 20px', fontSize: 13 }}
                              onClick={() => document.getElementById('restaurant-main-image').click()}
                            >
                              📁 اختيار صورة المطعم
                            </button>
                            <input
                              id="restaurant-main-image"
                              type="file"
                              name="image"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleRestaurantChange}
                            />
                          </div>
                        </div>
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
                  <div style={{ animation: 'slideIn 0.3s ease' }}>
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, border: '1px solid #eef2f6' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eef2f6' }}>
                            <th style={{ ...styles.th, textAlign: 'right', padding: '10px 20px' }}>اليوم</th>
                            <th style={{ ...styles.th, padding: '10px 16px' }}>من</th>
                            <th style={{ ...styles.th, padding: '10px 16px' }}>إلى</th>
                            <th style={{ ...styles.th, padding: '10px 16px' }}>مفتوح 24 ساعة</th>
                            <th style={{ ...styles.th, padding: '10px 16px' }}>مغلق</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workingHours.map((item, index) => {
                            const isDisabled = item.is_closed || item.is_open_24h;
                            return (
                              <tr key={item.day} style={{
                                borderBottom: '1px solid #f8fafc',
                                background: item.is_closed ? '#fff9f9' : item.is_open_24h ? '#f0fdf4' : 'transparent',
                                transition: 'background 0.2s'
                              }}>
                                <td style={{ ...styles.td, textAlign: 'right', padding: '10px 20px', fontWeight: 700, color: '#1e293b' }}>
                                  {DAY_AR[item.day]}
                                </td>

                                <td style={{ ...styles.td, padding: '8px 16px' }}>
                                  <input
                                    type="time"
                                    style={{
                                      ...styles.input,
                                      width: 120,
                                      padding: '6px 10px',
                                      opacity: isDisabled ? 0.4 : 1,
                                      cursor: isDisabled ? 'not-allowed' : 'text',
                                      background: isDisabled ? '#f1f5f9' : '#fff'
                                    }}
                                    disabled={isDisabled}
                                    value={item.open_time || ''}
                                    onChange={e => handleHourChange(index, 'open_time', e.target.value)}
                                  />
                                </td>

                                <td style={{ ...styles.td, padding: '8px 16px' }}>
                                  <input
                                    type="time"
                                    style={{
                                      ...styles.input,
                                      width: 120,
                                      padding: '6px 10px',
                                      opacity: isDisabled ? 0.4 : 1,
                                      cursor: isDisabled ? 'not-allowed' : 'text',
                                      background: isDisabled ? '#f1f5f9' : '#fff'
                                    }}
                                    disabled={isDisabled}
                                    value={item.close_time || ''}
                                    onChange={e => handleHourChange(index, 'close_time', e.target.value)}
                                  />
                                </td>

                                <td style={{ ...styles.td, padding: '8px 16px' }}>
                                  <label className="switch">
                                    <input
                                      type="checkbox"
                                      checked={item.is_open_24h}
                                      onChange={e => handleHourChange(index, 'is_open_24h', e.target.checked)}
                                    />
                                    <span className="slider green"></span>
                                  </label>
                                </td>

                                <td style={{ ...styles.td, padding: '8px 16px' }}>
                                  <label className="switch">
                                    <input
                                      type="checkbox"
                                      checked={item.is_closed}
                                      onChange={e => handleHourChange(index, 'is_closed', e.target.checked)}
                                    />
                                    <span className="slider red"></span>
                                  </label>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{
                      marginTop: 16,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '0 4px'
                    }}>
                      <button
                        style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px' }}
                        onClick={saveHours}
                      >
                        <Clock size={18} /> حفظ جميع المواعيد
                      </button>
                    </div>
                  </div>
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
                              <th style={{ ...styles.th, color: '#f9fafb', background: 'transparent' }}>الوصف</th>
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
                                <td style={{ ...styles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                                  {item.description || <span style={{ color: '#9ca3af' }}>- لا يوجد وصف -</span>}
                                </td>
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
                                    <button style={{ ...styles.btnOutline, padding: '4px 10px', fontSize: 12 }} onClick={() => { setEditItem({ ...item, image: null }); setIsEditModalOpen(true); }}>تعديل</button>
                                    <button style={{ ...styles.btnDanger, padding: '4px 10px', fontSize: 12 }} onClick={() => deleteItem(item.id)}>حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {menuItems.length === 0 && (
                              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد وجبات — أضف وجبتك الأولى!</td></tr>
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

            </div>
          </div>
        );

      case 'reservations':
        return (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 0 28px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>الحجوزات</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>عرض وإدارة الحجوزات وإعدادات الحجز الخاصة بمطعمك</p>
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 32, padding: '0 28px' }}>
                {[
                  { key: 'list', label: 'قائمة الحجوزات' },
                  { key: 'capacity', label: 'إعدادات الحجوزات', dirty: capacityDirty },
                  { key: 'ai', label: 'ملخص الحجوزات الذكي' }
                ].map(tab => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveResTab(tab.key)}
                    style={{
                      padding: '12px 4px',
                      fontSize: 15,
                      fontWeight: activeResTab === tab.key ? 700 : 500,
                      color: activeResTab === tab.key ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label} {tab.dirty && <span style={{ color: '#ef4444' }}>*</span>}
                    {activeResTab === tab.key && (
                      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 28 }}>

              {activeResTab === 'list' ? (
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
                    <button style={styles.btnPrimary} onClick={() => setIsAddResModalOpen(true)}>
                      📅 إضافة حجز جديد
                    </button>

                    <button style={styles.btnOutline} onClick={fetchReservations}>
                      🔄 تحديث
                    </button>

                    <div style={{ flex: 1 }} /> {/* Spacer */}

                    {/* Filters UI */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="بحث في الحجوزات..."
                          style={{ ...styles.input, width: 180, paddingRight: 35, marginBottom: 0 }}
                        />
                      </div>
                      <select style={{ ...styles.input, width: 130, marginBottom: 0 }}>
                        <option value="">كل الحالات</option>
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="REJECTED">مرفوض</option>
                      </select>

                      <input type="date" style={{ ...styles.input, width: 150, marginBottom: 0 }} />
                    </div>
                  </div>

                  {reservationsLoading ? (
                    <div style={{ padding: '80px 0' }}><Spinner /></div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={{ background: '#1f2937' }}>
                            {[
                              { label: 'العميل', sort: true },
                              { label: 'وقت البدء', sort: true },
                              { label: 'وقت الانتهاء', sort: false },
                              { label: 'الأفراد', sort: true },
                              { label: 'ملاحظات', sort: false },
                              { label: 'السبب', sort: false },
                              { label: 'الحالة', sort: true },
                              { label: 'إجراءات', sort: false }
                            ].map(h => (
                              <th key={h.label} style={{ ...styles.th, color: '#f9fafb', background: 'transparent', cursor: h.sort ? 'pointer' : 'default' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  {h.label} {h.sort && <span style={{ fontSize: 10, opacity: 0.7 }}>⇅</span>}
                                </div>
                              </th>
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
                                <td style={{ ...styles.td, direction: 'ltr' }}>{new Date(res.start_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td style={{ ...styles.td, direction: 'ltr' }}>{new Date(res.end_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td style={styles.td}>{res.party_size} أشخاص</td>
                                <td style={{ ...styles.td, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={res.notes}>{res.notes || '-'}</td>
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
                                      <button style={{ ...styles.btnSuccess, padding: '4px 10px', fontSize: 12 }} onClick={() => confirmReservation(res.id)}>✓ تأكيد</button>
                                      <button style={{ ...styles.btnDanger, padding: '4px 10px', fontSize: 12 }} onClick={() => setSelectedResId(res.id)}>✗ رفض</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

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
                      عرض <span style={{ color: '#111827', fontWeight: 700 }}>1-10</span> من أصل <span style={{ color: '#111827', fontWeight: 700 }}>{reservations.length}</span> حجز
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...styles.btnOutline, padding: '7px 14px', borderColor: '#e5e7eb', color: '#9ca3af', cursor: 'default' }} disabled>السابق</button>
                      <button style={{
                        ...styles.btnOutline,
                        padding: '7px 14px',
                        minWidth: 40,
                        background: '#f59e0b',
                        color: '#fff',
                        borderColor: '#f59e0b',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
                      }}>1</button>
                      <button style={{ ...styles.btnOutline, padding: '7px 14px' }}>التالي</button>
                    </div>
                  </div>

                  {/* Add Reservation Modal */}
                  {isAddResModalOpen && (
                    <div style={styles.modalBackdrop}>
                      <div style={{ ...styles.modal, width: 550, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ ...styles.modalHeader, padding: '12px 20px' }}>
                          <h5 style={{ margin: 0, fontWeight: 700 }}>📅 إضافة حجز يدوي</h5>
                          <button style={styles.closeBtn} onClick={() => setIsAddResModalOpen(false)}>✕</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ ...styles.label, marginBottom: 4 }}>التاريخ</label>
                                <input
                                  type="date"
                                  style={{ ...styles.input, padding: '8px 12px' }}
                                  value={newRes.date}
                                  onChange={e => {
                                    const d = e.target.value;
                                    setNewRes(p => ({ ...p, date: d, time: '' }));
                                    fetchAvailability(d, newRes.party_size);
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ ...styles.label, marginBottom: 4 }}>عدد الأشخاص</label>
                                <input
                                  type="number"
                                  min="1"
                                  style={{ ...styles.input, padding: '8px 12px' }}
                                  value={newRes.party_size}
                                  onChange={e => {
                                    const s = e.target.value;
                                    setNewRes(p => ({ ...p, party_size: s, time: '' }));
                                    fetchAvailability(newRes.date, s);
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ ...styles.label, marginBottom: 8 }}>الأوقات المتاحة</label>
                              {slotsLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}><Spinner /></div>
                              ) : (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                  gap: 8,
                                  maxHeight: 250,
                                  overflowY: 'auto',
                                  padding: '4px'
                                }}>
                                  {availableSlots.length > 0 ? availableSlots.map(slot => (
                                    <button
                                      key={slot}
                                      onClick={() => setNewRes(p => ({ ...p, time: slot }))}
                                      style={{
                                        padding: '10px 8px',
                                        borderRadius: 10,
                                        border: '1.5px solid',
                                        borderColor: newRes.time === slot ? '#f59e0b' : '#e5e7eb',
                                        background: newRes.time === slot ? '#fffbeb' : '#fff',
                                        color: newRes.time === slot ? '#f59e0b' : '#374151',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      {slot}
                                    </button>
                                  )) : (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 0', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 13 }}>
                                      {newRes.date ? 'لا توجد أوقات متاحة لهذا التاريخ' : 'الرجاء اختيار التاريخ وعدد الأشخاص'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                            <button style={{ ...styles.btnOutline, borderColor: '#d1d5db', color: '#374151', padding: '8px 20px' }} onClick={() => setIsAddResModalOpen(false)}>إلغاء</button>
                            <button
                              style={{
                                ...styles.btnPrimary,
                                padding: '8px 24px',
                                opacity: !newRes.time ? 0.6 : 1,
                                cursor: !newRes.time ? 'not-allowed' : 'pointer'
                              }}
                              disabled={!newRes.time}
                              onClick={() => {
                                toast('تمت إضافة الحجز بنجاح ✅');
                                setIsAddResModalOpen(false);
                                fetchReservations();
                              }}
                            >
                              تأكيد الحجز 🚀
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reject Modal */}
                  {selectedResId && (
                    <div style={styles.modalBackdrop}>
                      <div style={{ ...styles.modal, width: 450 }}>
                        <div style={styles.modalHeader}>
                          <h5 style={{ margin: 0, fontWeight: 700 }}>⚠️ سبب رفض الحجز</h5>
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
              ) : activeResTab === 'ai' ? (
                <div style={{ animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h4 style={{ margin: 0, color: '#111827', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                      🤖 تحليل الحجوزات بالذكاء الاصطناعي
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>بيانات آخر:</span>
                      <select
                        value={resAiRange}
                        onChange={(e) => setResAiRange(e.target.value)}
                        style={{ ...styles.input, width: 120, marginBottom: 0, padding: '6px 12px', fontSize: 13, height: 'auto' }}
                      >
                        <option value="7">7 أيام</option>
                        <option value="14">14 يوم</option>
                        <option value="30">30 يوم</option>
                        <option value="90">90 يوم</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, borderRight: '6px solid #22c55e' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#166534', fontWeight: 700, fontSize: 16 }}>📈 أوقات الذروة المتوقعة</h5>
                      <p style={{ margin: 0, color: '#166534', fontSize: 14, lineHeight: 1.6 }}>يُظهر التحليل أن أيام الجمعة والسبت بين الساعة 7 مساءً و9 مساءً هي الأكثر طلباً. نقترح زيادة عدد الموظفين في هذه الفترات لضمان أفضل خدمة.</p>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 24, borderRight: '6px solid #3b82f6' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#1e40af', fontWeight: 700, fontSize: 16 }}>👥 سلوك العملاء</h5>
                      <p style={{ margin: 0, color: '#1e40af', fontSize: 14, lineHeight: 1.6 }}>متوسط حجم المجموعة هو 4 أشخاص. نلاحظ زيادة في حجوزات المجموعات الكبيرة (أكثر من 6 أشخاص) في عطلات نهاية الأسبوع.</p>
                    </div>
                    <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 16, padding: 24, borderRight: '6px solid #f97316' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#9a3412', fontWeight: 700, fontSize: 16 }}>🎯 توصيات التحسين</h5>
                      <p style={{ margin: 0, color: '#9a3412', fontSize: 14, lineHeight: 1.6 }}>معدل الحجوزات التي لم تحضر (No-show) منخفض جداً (2%). نقترح تفعيل خاصية التأكيد التلقائي لجميع الحجوزات لزيادة الكفاءة.</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 30, background: '#f8fafb', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>يتم تحديث هذه التحليلات أسبوعياً بناءً على بيانات الحجوزات التاريخية لمطعمك.</p>
                  </div>
                </div>
              ) : (
                capacityLoading ? <Spinner /> : (
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
                )
              )}
            </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafb', padding: '16px', borderRadius: 16, border: '1px solid #eef2f6' }}>
                  <div
                    style={{
                      width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
                      border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer', background: '#fff', position: 'relative'
                    }}
                    onClick={() => setSelectedPreviewImage(licenseData.license_image_url || 'https://images.unsplash.com/photo-1568992687345-2694432ee1a0?w=800&q=80')}
                  >
                    <img
                      src={licenseData.license_image_url || 'https://images.unsplash.com/photo-1568992687345-2694432ee1a0?w=400&h=300&fit=crop'}
                      alt="License"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {licenseData.license_image_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLicenseData(prev => ({ ...prev, license_image: null, license_image_url: '' }));
                          setLicenseDirty(true);
                        }}
                        style={{
                          position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 10
                        }}
                      >✕</button>
                    )}
                  </div>
                  <button
                    style={{ ...styles.btnOutline, width: '100%', padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => document.getElementById('license_image_input').click()}
                  >
                    📜 اختيار صورة الرخصة
                  </button>
                  <input
                    id="license_image_input"
                    type="file"
                    name="license_image"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setLicenseData(prev => ({ ...prev, license_image: file, license_image_url: URL.createObjectURL(file) }));
                        setLicenseDirty(true);
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>صورة الهوية</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafb', padding: '16px', borderRadius: 16, border: '1px solid #eef2f6' }}>
                  <div
                    style={{
                      width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
                      border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer', background: '#fff', position: 'relative'
                    }}
                    onClick={() => setSelectedPreviewImage(licenseData.id_image_url || 'https://images.unsplash.com/photo-1633265486231-22bb58482407?w=800&q=80')}
                  >
                    <img
                      src={licenseData.id_image_url || 'https://images.unsplash.com/photo-1633265486231-22bb58482407?w=400&h=300&fit=crop'}
                      alt="ID"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {licenseData.id_image_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLicenseData(prev => ({ ...prev, id_image: null, id_image_url: '' }));
                          setLicenseDirty(true);
                        }}
                        style={{
                          position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 10
                        }}
                      >✕</button>
                    )}
                  </div>
                  <button
                    style={{ ...styles.btnOutline, width: '100%', padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => document.getElementById('id_image_input').click()}
                  >
                    🪪 اختيار صورة الهوية
                  </button>
                  <input
                    id="id_image_input"
                    type="file"
                    name="id_image"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setLicenseData(prev => ({ ...prev, id_image: file, id_image_url: URL.createObjectURL(file) }));
                        setLicenseDirty(true);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <button style={styles.btnPrimary} onClick={submitLicense}>
              {licenseExists ? '🔄 تحديث الرخصة' : '📤 رفع الرخصة'}
            </button>
          </div>
        );



      // ── REVIEWS ────────────────────────────────────────────
      case 'reviews': {
        const reviewList = reviews?.results || [];
        const hasReviews = reviewList.length > 0;
        const hasActiveReviewFilters = Boolean(
          reviewFilters.search ||
          reviewFilters.sentiment ||
          reviewFilters.rating ||
          reviewFilters.dateFrom ||
          reviewFilters.dateTo
        );
        const resetReviewFilters = () => setReviewFilters({
          search: '',
          sentiment: '',
          rating: '',
          sort: 'newest',
          dateFrom: '',
          dateTo: '',
        });

        return (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 0 28px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>⭐ التقييمات والتحليلات</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>حلّل آراء العملاء واطلع على نتائج تقييمات الذكاء الاصطناعي</p>
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 32, padding: '0 28px' }}>
                {[
                  { key: 'list', label: 'تقييمات العملاء' },
                  { key: 'ai', label: 'ملخص الذكاء الاصطناعي' }
                ].map(tab => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveReviewsTab(tab.key)}
                    style={{
                      padding: '12px 4px',
                      fontSize: 15,
                      fontWeight: activeReviewsTab === tab.key ? 700 : 500,
                      color: activeReviewsTab === tab.key ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                    {activeReviewsTab === tab.key && (
                      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 28 }}>

              {activeReviewsTab === 'list' ? (
                <>
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
                    <button
                      type="button"
                      style={styles.btnOutline}
                      onClick={fetchReviews}
                      disabled={reviewsLoading}
                    >
                      {reviewsLoading ? 'جاري التحديث...' : '🔄 تحديث'}
                    </button>

                    {hasActiveReviewFilters && (
                      <button type="button" style={styles.btnOutline} onClick={resetReviewFilters}>
                        مسح الفلاتر
                      </button>
                    )}

                    <div style={{ flex: 1 }} />

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="بحث في التقييمات..."
                          value={reviewFilters.search}
                          onChange={(e) => setReviewFilters(f => ({ ...f, search: e.target.value }))}
                          style={{ ...styles.input, width: 180, paddingRight: 35, marginBottom: 0 }}
                        />
                      </div>

                      <select
                        value={reviewFilters.sentiment}
                        onChange={(e) => setReviewFilters(f => ({ ...f, sentiment: e.target.value }))}
                        style={{ ...styles.input, width: 130, marginBottom: 0 }}
                      >
                        <option value="">كل المشاعر</option>
                        <option value="POSITIVE">إيجابي</option>
                        <option value="NEUTRAL">محايد</option>
                        <option value="NEGATIVE">سلبي</option>
                      </select>

                      <select
                        value={reviewFilters.rating}
                        onChange={(e) => setReviewFilters(f => ({ ...f, rating: e.target.value }))}
                        style={{ ...styles.input, width: 130, marginBottom: 0 }}
                      >
                        <option value="">كل التقييمات</option>
                        <option value="5">5 نجوم</option>
                        <option value="4">4 نجوم فأكثر</option>
                        <option value="3">3 نجوم فأكثر</option>
                        <option value="2">2 نجوم فأكثر</option>
                        <option value="1">1 نجمة فأكثر</option>
                      </select>

                      <select
                        value={reviewFilters.sort}
                        onChange={(e) => setReviewFilters(f => ({ ...f, sort: e.target.value }))}
                        style={{ ...styles.input, width: 150, marginBottom: 0 }}
                      >
                        <option value="newest">الأحدث أولاً</option>
                        <option value="oldest">الأقدم أولاً</option>
                        <option value="highest">الأعلى تقييماً</option>
                        <option value="lowest">الأقل تقييماً</option>
                      </select>

                      <input
                        type="date"
                        value={reviewFilters.dateFrom}
                        onChange={(e) => setReviewFilters(f => ({ ...f, dateFrom: e.target.value }))}
                        title="من تاريخ"
                        style={{ ...styles.input, width: 150, marginBottom: 0 }}
                      />
                      <input
                        type="date"
                        value={reviewFilters.dateTo}
                        onChange={(e) => setReviewFilters(f => ({ ...f, dateTo: e.target.value }))}
                        title="إلى تاريخ"
                        style={{ ...styles.input, width: 150, marginBottom: 0 }}
                      />
                    </div>
                  </div>

                  {reviewsLoading && !reviewsLoaded ? (
                    <div style={{ padding: '60px 0' }}><Spinner /></div>
                  ) : !hasReviews ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60, fontSize: 15 }}>
                      لا توجد تقييمات حتى الآن
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {reviewsLoading && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 2, borderRadius: 14,
                          background: 'rgba(255,255,255,0.7)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Spinner />
                        </div>
                      )}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 14,
                        opacity: reviewsLoading ? 0.5 : 1, transition: 'opacity 0.2s ease'
                      }}>
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
                                {[1, 2, 3, 4, 5].map(s => (
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
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, color: '#374151', fontWeight: 800 }}>🤖 ملخص ذكي للتقييمات</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>بناءً على:</span>
                      <select
                        value={reviewsAiRange}
                        onChange={(e) => setReviewsAiRange(e.target.value)}
                        style={{ ...styles.input, width: 120, marginBottom: 0, padding: '6px 12px', fontSize: 13, height: 'auto' }}
                      >
                        <option value="7">آخر 7 أيام</option>
                        <option value="14">آخر 14 يوم</option>
                        <option value="30">آخر 30 يوم</option>
                        <option value="90">آخر 90 يوم</option>
                      </select>
                    </div>
                  </div>
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
                { label: 'رضا العملاء', value: '96%', icon: '😊', color: '#10b981' },
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
        return (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 0 20px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>إعدادات الحساب</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>أدر بياناتك الشخصية، البريد الإلكتروني، وكلمة المرور</p>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 32, padding: '0 28px' }}>
                {[
                  { key: 'info', label: 'البيانات الشخصية' },
                  { key: 'email', label: 'البريد الإلكتروني' },
                  { key: 'password', label: 'كلمة المرور' }
                ].map(tab => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveProfileTab(tab.key)}
                    style={{
                      padding: '12px 4px',
                      fontSize: 15,
                      fontWeight: activeProfileTab === tab.key ? 700 : 500,
                      color: activeProfileTab === tab.key ? '#111827' : '#9ca3af',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {tab.label}
                    {activeProfileTab === tab.key && (
                      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 28px', position: 'relative', minHeight: 220 }}>
              {profileLoading && !profileLoaded ? (
                <div style={{ padding: '60px 0' }}><Spinner /></div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {profileLoading && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 2, borderRadius: 12,
                      background: 'rgba(255,255,255,0.7)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Spinner />
                    </div>
                  )}
                  <div style={{
                    opacity: profileLoading ? 0.5 : 1,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: profileLoading ? 'none' : 'auto'
                  }}>
              {activeProfileTab === 'info' && (
                <div style={{ animation: 'slideIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                    <div
                      style={{
                        width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                        border: '3px solid #f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        cursor: 'pointer', background: '#f8fafb', position: 'relative'
                      }}
                      onClick={() => setSelectedPreviewImage(profileData.image_preview || profileData.image_url)}
                    >
                      {(profileData.image_preview || profileData.image_url) ? (
                        <img src={profileData.image_preview || profileData.image_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 32 }}>👤</div>
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#111827' }}>صورة الملف الشخصي</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748b' }}>يفضل استخدام صورة مربعة واضحة</p>
                      <label style={{ ...styles.btnOutline, padding: '6px 16px', fontSize: 12, display: 'inline-block' }}>
                        تغيير الصورة
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              setProfileData(prev => ({
                                ...prev,
                                image: file,
                                image_preview: URL.createObjectURL(file)
                              }));
                            }
                          }}
                        />
                      </label>
                    </div>
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
                      <label style={styles.label}>رقم الهاتف</label>
                      <input style={styles.input} value={profileData.phone_number} onChange={e => setProfileData(p => ({ ...p, phone_number: e.target.value }))} />
                    </div>
                  </div>
                  <button style={{ ...styles.btnPrimary, marginTop: 24, width: '100%' }} onClick={handleProfileSubmit} disabled={profileSaving}>
                    {profileSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              )}

              {activeProfileTab === 'email' && (
                <div style={{ animation: 'slideIn 0.3s ease', maxWidth: 500, margin: '0 auto' }}>
                  <div style={{ background: '#f8fafb', padding: 20, borderRadius: 12, border: '1px solid #eef2f6', marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>البريد الإلكتروني الحالي:</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{profileData.email}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={styles.label}>البريد الإلكتروني الجديد</label>
                      <input
                        type="email"
                        style={styles.input}
                        placeholder="example@gmail.com"
                        value={emailData.new_email}
                        onChange={e => setEmailData(prev => ({ ...prev, new_email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>كلمة المرور الحالية</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          style={styles.input}
                          placeholder="••••••••"
                          value={emailData.current_password}
                          onChange={e => setEmailData(prev => ({ ...prev, current_password: e.target.value }))}
                        />
                        <button
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        >
                          {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button style={{ ...styles.btnPrimary, marginTop: 24, width: '100%' }} onClick={handleChangeEmail} disabled={profileSaving}>
                    {profileSaving ? 'جاري التحديث...' : 'تحديث البريد الإلكتروني'}
                  </button>
                </div>
              )}

              {activeProfileTab === 'password' && (
                <div style={{ animation: 'slideIn 0.3s ease', maxWidth: 500, margin: '0 auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={styles.label}>كلمة المرور الحالية</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          style={styles.input}
                          placeholder="••••••••"
                          value={passwordData.current_password}
                          onChange={e => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        />
                        <button
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        >
                          {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ height: '1px', background: '#f3f4f6', margin: '8px 0' }} />
                    <div>
                      <label style={styles.label}>كلمة المرور الجديدة</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPass ? "text" : "password"}
                          style={styles.input}
                          placeholder="••••••••"
                          value={passwordData.new_password}
                          onChange={e => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        />
                        <button
                          onClick={() => setShowNewPass(!showNewPass)}
                          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        >
                          {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={styles.label}>تأكيد كلمة المرور الجديدة</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          style={styles.input}
                          placeholder="••••••••"
                          value={passwordData.confirm_password}
                          onChange={e => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        />
                        <button
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        >
                          {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button style={{ ...styles.btnPrimary, marginTop: 24, width: '100%' }} onClick={handleChangePassword} disabled={profileSaving}>
                    {profileSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                  </button>
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ── AI ASSISTANT ─────────────────────────────────────────
      case 'ai_assistant':
        return (
          <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={styles.pageTitle}>✨ المساعد الذكي</h2>
              <button
                onClick={clearAiChat}
                style={{ ...styles.btnOutline, color: '#ef4444', borderColor: '#fee2e2', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff' }}
              >
                🗑️ مسح المحادثة
              </button>
            </div>

            <div style={{
              flex: 1,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #eef2f6'
            }}>
              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {aiMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'slideIn 0.3s ease'
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '16px 20px',
                      borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : '#f8fafc',
                      color: msg.sender === 'user' ? '#fff' : '#334155',
                      fontSize: 15,
                      lineHeight: 1.6,
                      boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none',
                      border: msg.sender === 'user' ? 'none' : '1px solid #eef2f6'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={aiMessagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '24px 30px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <form onSubmit={handleAiSend} style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                  <input
                    type="text"
                    placeholder="اكتب سؤالك هنا للمساعد الذكي..."
                    style={{
                      ...styles.input,
                      borderRadius: 30,
                      padding: '16px 24px',
                      paddingLeft: 60,
                      marginBottom: 0,
                      background: '#f8fafc',
                      border: '2px solid transparent',
                      transition: 'all 0.3s',
                      boxShadow: 'none'
                    }}
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 44, height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    🚀
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
                  بواسطة Dine Advisor Smart Assistant • مدعوم بالذكاء الاصطناعي
                </div>
              </div>
            </div>
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
        @keyframes profileMenuIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
        input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

        /* Premium Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 22px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #e5e7eb;
          transition: .3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px; width: 16px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        input:checked + .slider { background-color: #f59e0b; }
        input:checked + .slider.green { background-color: #10b981; }
        input:checked + .slider.red { background-color: #ef4444; }
        input:focus + .slider { box-shadow: 0 0 1px #f59e0b; }
        input:checked + .slider:before { transform: translateX(22px); }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', background: '#f5f6fa' }}>
        {/* Sidebar */}
        <div style={{
          width: 280,
          background: '#0f172a',
          color: '#f8fafc',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
          zIndex: 100
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32, padding: '0 10px' }}>
            <div style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#f59e0b',
              letterSpacing: 1.5,
              textShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
            }}>DINE ADVISOR</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textTransform: 'uppercase', fontWeight: 600 }}>Restaurant Management</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>


            {sidebarItems.map(item => {
              const isSectionActive = activeSection === item.key;
              const isOpen = (item.key === 'reservations' && resMenuOpen) ||
                (item.key === 'restaurant' && restMenuOpen) ||
                (item.key === 'reviews' && reviewsMenuOpen);

              return (
                <React.Fragment key={item.key}>
                  <button
                    onClick={() => {
                      if (item.key === 'reservations') setResMenuOpen(!resMenuOpen);
                      else if (item.key === 'restaurant') setRestMenuOpen(!restMenuOpen);
                      else if (item.key === 'reviews') setReviewsMenuOpen(!reviewsMenuOpen);
                      else if (item.key === 'ai_assistant') handleNav(item.key);
                      else handleNav(item.key);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: isSectionActive ? 700 : 500,
                      fontSize: 14,
                      textAlign: 'right',
                      direction: 'rtl',
                      width: '100%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: item.isAI ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)' : (isSectionActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent'),
                      color: item.isAI ? '#a855f7' : (isSectionActive ? '#f59e0b' : '#94a3b8'),
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSectionActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      if (!isSectionActive) e.currentTarget.style.color = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSectionActive) e.currentTarget.style.background = 'transparent';
                      if (!isSectionActive) e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSectionActive ? '#f59e0b' : 'inherit'
                    }}>
                      {item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>

                    {['reservations', 'restaurant', 'reviews'].includes(item.key) && (
                      <ChevronDown
                        size={16}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.3s ease',
                          opacity: 0.7
                        }}
                      />
                    )}

                    {!isOpen && item.dirty && (
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#f59e0b',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
                        flexShrink: 0,
                        marginRight: 4
                      }} />
                    )}
                  </button>

                  {/* Sub-menu container styling like the image */}
                  {isOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      margin: '4px 0 8px 0',
                      padding: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 16,
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {item.key === 'restaurant' && (
                        <>
                          <SubNavItem
                            label="البيانات الأساسية"
                            active={activeRestTab === 'info' && activeSection === 'restaurant'}
                            onClick={() => { handleNav('restaurant'); setActiveRestTab('info'); }}
                            icon={<Info size={14} />}
                            dirty={restaurantDirty}
                          />
                          <SubNavItem
                            label="ساعات العمل"
                            active={activeRestTab === 'hours' && activeSection === 'restaurant'}
                            onClick={() => { handleNav('restaurant'); setActiveRestTab('hours'); }}
                            icon={<Clock size={14} />}
                            dirty={hoursDirty}
                          />
                          <SubNavItem
                            label="صور المطعم"
                            active={activeRestTab === 'images' && activeSection === 'restaurant'}
                            onClick={() => { handleNav('restaurant'); setActiveRestTab('images'); }}
                            icon={<ImageIcon size={14} />}
                          />
                          <SubNavItem
                            label="المينيو"
                            active={activeRestTab === 'menu' && activeSection === 'restaurant'}
                            onClick={() => { handleNav('restaurant'); setActiveRestTab('menu'); }}
                            icon={<MenuIcon size={14} />}
                          />
                        </>
                      )}

                      {item.key === 'reservations' && (
                        <>
                          <SubNavItem
                            label="قائمة الحجوزات"
                            active={activeResTab === 'list' && activeSection === 'reservations'}
                            onClick={() => { handleNav('reservations'); setActiveResTab('list'); }}
                            icon={<Calendar size={14} />}
                          />
                          <SubNavItem
                            label="إعدادات السعة"
                            active={activeResTab === 'capacity' && activeSection === 'reservations'}
                            onClick={() => { handleNav('reservations'); setActiveResTab('capacity'); }}
                            icon={<Settings size={14} />}
                            dirty={capacityDirty}
                          />
                          <SubNavItem
                            label="ملخص الحجوزات الذكي"
                            active={activeResTab === 'ai' && activeSection === 'reservations'}
                            onClick={() => { handleNav('reservations'); setActiveResTab('ai'); }}
                            icon={<Sparkles size={14} />}
                          />
                        </>
                      )}

                      {item.key === 'reviews' && (
                        <>
                          <SubNavItem
                            label="تقييمات العملاء"
                            active={activeReviewsTab === 'list' && activeSection === 'reviews'}
                            onClick={() => { handleNav('reviews'); setActiveReviewsTab('list'); }}
                            icon={<Users size={14} />}
                          />
                          <SubNavItem
                            label="ملخص الذكاء الاصطناعي"
                            active={activeReviewsTab === 'ai' && activeSection === 'reviews'}
                            onClick={() => { handleNav('reviews'); setActiveReviewsTab('ai'); }}
                            icon={<Sparkles size={14} />}
                          />
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>


        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          {/* Top Navbar */}
          <div style={{
            height: 70,
            background: '#fff',
            borderBottom: '1px solid #eef2f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            flexShrink: 0,
            zIndex: 50
          }}>
            {/* Right Side: Title & Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b'
              }}>
                {SECTION_ICONS[activeSection]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{SECTION_NAMES[activeSection]}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Dine Advisor</span>
                  <ChevronLeft size={10} />
                  <span>لوحة التحكم</span>
                  <ChevronLeft size={10} />
                  <span style={{ color: '#64748b' }}>{SECTION_NAMES[activeSection]}</span>
                </div>
              </div>
            </div>

            {/* Left Side: Search & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  style={{
                    width: '100%', padding: '10px 40px 10px 15px', borderRadius: 12, border: '1px solid #f1f5f9',
                    background: '#f8fafc', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              {/* View Public Site */}
              <button
                onClick={() => window.open(`/restaurant/${restaurantData.id || ''}`, '_blank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                  background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}
              >
                <ExternalLink size={16} /> عرض المطعم للجمهور
              </button>

              {/* Notifications */}
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, border: '1px solid #eef2f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}>
                  <Bell size={22} />
                </div>
                {/* Red Badge */}
                <div style={{
                  position: 'absolute', top: 10, left: 10, width: 10, height: 10,
                  borderRadius: '50%', background: '#ef4444', border: '2px solid #fff'
                }} />
              </div>

              {/* Profile menu */}
              <div ref={profileMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(open => !open)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  style={{
                    width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', padding: 0,
                    border: profileMenuOpen ? '2px solid #f59e0b' : '2px solid #fff',
                    boxShadow: profileMenuOpen ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer', background: 'none', transition: 'all 0.2s ease'
                  }}
                >
                  <img
                    src={profileData.image_url || 'https://via.placeholder.com/44'}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', left: 0, minWidth: 210,
                      background: '#fff', borderRadius: 14, border: '1px solid #eef2f6',
                      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)', padding: 8, zIndex: 200,
                      animation: 'profileMenuIn 0.18s ease'
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setProfileMenuOpen(false); handleNav('profile'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '11px 14px', border: 'none', borderRadius: 10, background: 'transparent',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155', textAlign: 'right'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <User size={18} color="#f59e0b" />
                      <span>إعدادات الملف الشخصي</span>
                    </button>
                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 8px' }} />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => { setProfileMenuOpen(false); await handleLogout(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '11px 14px', border: 'none', borderRadius: 10, background: 'transparent',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#dc2626', textAlign: 'right'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <LogOut size={18} />
                      <span>تسجيل خروج</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actual Section Content */}
          <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </div>
        {/* Global Image Preview Modal */}
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
