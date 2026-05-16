import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getProfile } from '../services/authService';
import {
  FileText,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  User,
  ChevronLeft,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  UtensilsCrossed,
  CalendarDays,
  Star,
  Sparkles,
  BarChart3
} from 'lucide-react';

const API_BASE = 'https://revvo-server.onrender.com/api/admin';
const API_AUTH = 'https://revvo-server.onrender.com/api/auth';

const SECTION_NAMES = {
  overview: 'نظرة عامة',
  licenses: 'إدارة الرخص',
  restaurants: 'المطاعم',
  reservations: 'الحجوزات',
  reviews: 'التقييمات',
  users: 'المستخدمين',
  analytics: 'التحليلات',
  profile: 'الملف الشخصي',
  ai_assistant: 'المساعد الذكي'
};

const SECTION_ICONS = {
  overview: <LayoutDashboard size={20} />,
  licenses: <FileText size={20} />,
  restaurants: <UtensilsCrossed size={20} />,
  reservations: <CalendarDays size={20} />,
  reviews: <Star size={20} />,
  users: <Users size={20} />,
  analytics: <BarChart3 size={20} />,
  profile: <User size={20} />,
  ai_assistant: <Sparkles size={20} />
};

const DATA_SECTIONS = ['restaurants', 'reservations', 'reviews', 'users'];

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

const PAGE_SIZE = 10;

const SECTION_ITEM_LABEL = {
  restaurants: 'مطعم',
  reservations: 'حجز',
  reviews: 'تقييم',
  users: 'مستخدم',
  licenses: 'رخصة'
};

const COLUMN_NAMES_ARABIC = {
  license_number: 'رقم الرخصة',
  license_expiry: 'تاريخ الانتهاء',
  status: 'الحالة',
  name: 'الاسم',
  email: 'البريد الإلكتروني',
  phone_number: 'رقم الهاتف',
  is_active: 'الحالة',
  capacity: 'السعة',
  address: 'العنوان',
  opening_time: 'وقت الفتح',
  closing_time: 'وقت الإغلاق',
  date: 'التاريخ',
  time: 'الوقت',
  number_of_guests: 'عدد الضيوف',
  special_requests: 'طلبات خاصة',
  restaurant_name: 'اسم المطعم',
  user_email: 'بريد المستخدم',
  comment: 'التعليق',
  rating: 'التقييم',
  sentiment: 'المشاعر',
  created_at: 'تاريخ الإنشاء',
  updated_at: 'تاريخ التعديل',
  first_name: 'الاسم الأول',
  last_name: 'الاسم الأخير',
  role: 'الدور',
};

function getStatusBadgeStyle(key, value) {
  let background = '';
  let color = '';

  switch (key) {
    case 'status': // For licenses and reservations
      if (value === 'APPROVED' || value === 'CONFIRMED' || value === 'COMPLETED') {
        background = '#dcfce7'; // light green
        color = '#166534'; // dark green
      } else if (value === 'REJECTED' || value === 'CANCELLED') {
        background = '#fee2e2'; // light red
        color = '#991b1b'; // dark red
      } else if (value === 'PENDING') {
        background = '#fef3c7'; // light yellow
        color = '#92400e'; // dark yellow
      }
      break;
    case 'is_active': // For restaurants
      if (value === true) {
        background = '#dcfce7';
        color = '#166534';
      } else if (value === false) {
        background = '#fee2e2';
        color = '#991b1b';
      }
      break;
    case 'sentiment': // For reviews
      if (value === 'POSITIVE') {
        background = '#dcfce7';
        color = '#166534';
      } else if (value === 'NEGATIVE') {
        background = '#fee2e2';
        color = '#991b1b';
      } else if (value === 'NEUTRAL') {
        background = '#fef3c7';
        color = '#92400e';
      }
      break;
    default:
      return null; // No special styling
  }
  return { background, color };
}

function formatCell(val, key) {
  if (val == null || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'نعم' : 'لا';

  const badgeStyle = getStatusBadgeStyle(key, val);
  if (badgeStyle) {
    return (
      <span style={{ ...styles.badge, ...badgeStyle }}>
        {typeof val === 'boolean' ? (val ? 'مفعل' : 'غير مفعل') : val}
      </span>
    );
  }

  return String(val);
}

function getTableColumns(rows) {
  if (!rows[0]) return [];
  return Object.keys(rows[0]).filter(k => {
    const v = rows[0][k];
    return (v == null || typeof v !== 'object') && k !== 'id';
  });
}

function prepareTableData(rows, { search, sort, sortKey, sortDir, page, pageSize, statusFilter, statusKey }) {
  let list = [...rows];
  if (statusFilter && statusKey) {
    list = list.filter(r => r[statusKey] === statusFilter);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(row =>
      Object.values(row).some(v => v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q))
    );
  }
  if (sortKey) {
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'ar');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  } else if (sort === 'newest' || sort === 'oldest') {
    const key = ['created_at', 'updated_at', 'id'].find(k => list[0] && k in list[0]) || 'id';
    list.sort((a, b) => {
      const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
      return sort === 'newest' ? -cmp : cmp;
    });
  }
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    rows: list.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total)
  };
}

function getPageNumbers(current, total) {
  if (total <= 1) return [1];
  const max = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + max - 1);
  start = Math.max(1, end - max + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [licensesLoaded, setLicensesLoaded] = useState(false);
  const [licenseFilters, setLicenseFilters] = useState({
    search: '',
    status: '',
    sort: 'newest'
  });
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, add: toast, remove: removeToast } = useToast();
  const navigate = useNavigate();

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

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableFilters, setTableFilters] = useState({ search: '', sort: 'newest' });
  const [tableSort, setTableSort] = useState({ key: null, dir: 'asc' });
  const [tablePage, setTablePage] = useState(1);
  const [licensePage, setLicensePage] = useState(1);
  const [licenseSort, setLicenseSort] = useState({ key: null, dir: 'asc' });

  // ── AI ASSISTANT STATE ──
  const [aiMessages, setAiMessages] = useState([
    { text: "أهلاً بك في مساعد Dine Advisor الذكي! 🤖 كيف يمكنني مساعدتك في إدارة النظام اليوم؟", sender: 'bot' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const aiMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeSection === 'ai_assistant') {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, activeSection]);

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

  const authHeader = () => {
    const t = localStorage.getItem('access') || localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fixImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://revvo-server.onrender.com${url}`;
  };

  const fetchProfileData = async () => {
    setProfileLoading(true);
    try {
      const res = await axios.get(`${API_AUTH}/me`, { headers: authHeader() });
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
      setProfileLoaded(true);
    } catch (err) {
      toast('تعذر تحميل بيانات البروفايل', 'error');
    } finally {
      setProfileLoading(false);
    }
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

      await axios.put(`${API_AUTH}/me/`, formData, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' }
      });
      toast('تم تحديث البيانات الشخصية بنجاح');
      fetchProfileData();
    } catch (err) {
      toast(err.response?.data?.detail || 'فشل تحديث البيانات', 'error');
    } finally { setProfileSaving(false); }
  };

  const handleChangeEmail = async () => {
    try {
      setProfileSaving(true);
      await axios.post(`${API_AUTH}/change-email/`, emailData, { headers: authHeader() });
      toast('تم تغيير البريد الإلكتروني بنجاح');
      setEmailData({ current_password: '', new_email: '' });
      fetchProfileData();
    } catch (err) {
      toast(err.response?.data?.detail || 'فشل تغيير البريد الإلكتروني', 'error');
    } finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    try {
      setProfileSaving(true);
      await axios.post(`${API_AUTH}/change-password/`, passwordData, { headers: authHeader() });
      toast('تم تغيير كلمة المرور بنجاح');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.detail || 'فشل تغيير كلمة المرور', 'error');
    } finally { setProfileSaving(false); }
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/licenses`, { headers: authHeader() });
      setLicenses(res.data);
      setLicensesLoaded(true);
    } catch (err) {
      toast('فشل جلب قائمة الرخص', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    licenseFilters.search ||
    licenseFilters.status
  );

  const resetFilters = () => setLicenseFilters({
    search: '',
    status: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchLicenses();
    fetchProfileData();
  }, []);

  const fetchAdminTable = async () => {
    if (!DATA_SECTIONS.includes(activeSection)) return;
    setTableLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/${activeSection}`, { headers: authHeader() });
      const data = res.data;
      setTableData(Array.isArray(data) ? data : (data.results || []));
    } catch {
      toast('فشل جلب البيانات', 'error');
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTable();
  }, [activeSection]);

  useEffect(() => {
    setTableFilters({ search: '', sort: 'newest' });
    setTableSort({ key: null, dir: 'asc' });
    setTablePage(1);
    setLicensePage(1);
    setLicenseSort({ key: null, dir: 'asc' });
  }, [activeSection]);

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

  const handleNav = (key) => {
    if (key === 'logout') {
      handleLogout();
      return;
    }
    setActiveSection(key);
  };

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
    { key: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard size={20} /> },
    { key: 'licenses', label: 'الرخص', icon: <FileText size={20} /> },
    { key: 'restaurants', label: 'المطاعم', icon: <UtensilsCrossed size={20} /> },
    { key: 'reservations', label: 'الحجوزات', icon: <CalendarDays size={20} /> },
    { key: 'reviews', label: 'التقييمات', icon: <Star size={20} /> },
    { key: 'users', label: 'المستخدمين', icon: <Users size={20} /> },
    { key: 'analytics', label: 'التحليلات', icon: <BarChart3 size={20} /> },
    { key: 'ai_assistant', label: 'المساعد الذكي', icon: <Sparkles size={20} /> },
  ];

  const thDark = { ...styles.th, color: '#f9fafb', background: 'transparent' };

  const sortArrow = (sortState, key) => (
    <span style={{ fontSize: 10, opacity: sortState.key === key ? 1 : 0.7 }}>
      {sortState.key === key ? (sortState.dir === 'asc' ? '↑' : '↓') : '⇅'}
    </span>
  );

  const toggleTableSort = (key) => {
    setTableSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setTablePage(1);
  };

  const toggleLicenseSort = (key) => {
    setLicenseSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setLicensePage(1);
  };

  const renderToolbar = ({ onRefresh, loading, search, onSearch, sort, onSort, hasFilters, onClear, placeholder, extra }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap',
      background: '#f8fafb', padding: '12px 16px', borderRadius: 14, border: '1px solid #e5e7eb'
    }}>
      <button type="button" style={styles.btnOutline} onClick={onRefresh} disabled={loading}>
        {loading ? 'جاري التحديث...' : '🔄 تحديث'}
      </button>
      {hasFilters && (
        <button type="button" style={styles.btnOutline} onClick={onClear}>مسح الفلاتر</button>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{ ...styles.input, width: 180, paddingRight: 35, marginBottom: 0 }}
          />
        </div>
        {extra}
        <select value={sort} onChange={e => onSort(e.target.value)} style={{ ...styles.input, width: 150, marginBottom: 0 }}>
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
        </select>
      </div>
    </div>
  );

  const renderPagination = ({ result, page, setPage, itemLabel }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 12
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        عرض <span style={{ color: '#111827', fontWeight: 700 }}>{result.from}-{result.to}</span> من أصل{' '}
        <span style={{ color: '#111827', fontWeight: 700 }}>{result.total}</span> {itemLabel}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" style={{ ...styles.btnOutline, padding: '7px 14px', borderColor: '#e5e7eb', color: page <= 1 ? '#9ca3af' : '#4b5563' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>السابق</button>
        {getPageNumbers(page, result.totalPages).map(p => (
          <button key={p} type="button" onClick={() => setPage(p)} style={{ ...styles.btnOutline, padding: '7px 14px', minWidth: 40, background: p === page ? '#f59e0b' : 'transparent', color: p === page ? '#fff' : '#4b5563', borderColor: p === page ? '#f59e0b' : '#e5e7eb', boxShadow: p === page ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none' }}>{p}</button>
        ))}
        <button type="button" style={{ ...styles.btnOutline, padding: '7px 14px', borderColor: '#e5e7eb', color: page >= result.totalPages ? '#9ca3af' : '#4b5563' }} disabled={page >= result.totalPages} onClick={() => setPage(p => Math.min(result.totalPages, p + 1))}>التالي</button>
      </div>
    </div>
  );

  const renderDataTable = (title) => {
    const cols = getTableColumns(tableData);
    const result = prepareTableData(tableData, {
      search: tableFilters.search,
      sort: tableSort.key ? undefined : tableFilters.sort,
      sortKey: tableSort.key,
      sortDir: tableSort.dir,
      page: tablePage,
      pageSize: PAGE_SIZE
    });
    const itemLabel = SECTION_ITEM_LABEL[activeSection] || 'عنصر';
    const hasFilters = Boolean(tableFilters.search);

    return (
      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 0 28px' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{title}</h3>
        </div>
        <div style={{ padding: 28 }}>
          {renderToolbar({
            onRefresh: fetchAdminTable,
            loading: tableLoading,
            search: tableFilters.search,
            onSearch: v => { setTableFilters(f => ({ ...f, search: v })); setTablePage(1); setTableSort({ key: null, dir: 'asc' }); },
            sort: tableFilters.sort,
            onSort: v => { setTableFilters(f => ({ ...f, sort: v })); setTablePage(1); setTableSort({ key: null, dir: 'asc' }); },
            hasFilters,
            onClear: () => { setTableFilters({ search: '', sort: 'newest' }); setTablePage(1); setTableSort({ key: null, dir: 'asc' }); },
            placeholder: 'بحث...'
          })}
          {tableLoading && tableData.length === 0 ? <Spinner /> : (
            <div style={{ position: 'relative' }}>
              {tableLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, borderRadius: 14, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
              )}
              <div style={{ overflowX: 'auto', opacity: tableLoading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: '#1f2937' }}>
                      {cols.map(c => (
                        <th key={c} style={{ ...thDark, cursor: 'pointer' }} onClick={() => toggleTableSort(c)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{COLUMN_NAMES_ARABIC[c] || c} {sortArrow(tableSort, c)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr><td colSpan={cols.length || 1} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد بيانات</td></tr>
                    ) : result.rows.map((row, i) => (
                      <tr key={row.id ?? i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {cols.map(c => <td key={c} style={styles.td}>{formatCell(row[c], c)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.total > 0 && renderPagination({ result, page: tablePage, setPage: setTablePage, itemLabel })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const licenseResult = prepareTableData(licenses, {
      search: licenseFilters.search,
      sort: licenseSort.key ? undefined : licenseFilters.sort,
      sortKey: licenseSort.key,
      sortDir: licenseSort.dir,
      page: licensePage,
      pageSize: PAGE_SIZE,
      statusFilter: licenseFilters.status,
      statusKey: 'status'
    });

    switch (activeSection) {
      case 'overview':
        return (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>نظرة عامة</h3>
            <p style={{ color: '#6b7280' }}>هذه الصفحة قيد التطوير...</p>
          </div>
        );
      case 'licenses':
        return (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 0 28px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>إدارة الرخص</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>راجع واعتمد رخص المطاعم المسجلة في النظام</p>
            </div>

            <div style={{ padding: 28 }}>
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
                <button
                  type="button"
                  style={styles.btnOutline}
                  onClick={fetchLicenses}
                  disabled={loading}
                >
                  {loading ? 'جاري التحديث...' : '🔄 تحديث'}
                </button>

                {hasActiveFilters && (
                  <button type="button" style={styles.btnOutline} onClick={resetFilters}>
                    مسح الفلاتر
                  </button>
                )}

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
                    <input
                      type="text"
                      placeholder="بحث برقم الرخصة..."
                      value={licenseFilters.search}
                      onChange={(e) => setLicenseFilters(f => ({ ...f, search: e.target.value }))}
                      style={{ ...styles.input, width: 180, paddingRight: 35, marginBottom: 0 }}
                    />
                  </div>

                  <select
                    value={licenseFilters.status}
                    onChange={(e) => setLicenseFilters(f => ({ ...f, status: e.target.value }))}
                    style={{ ...styles.input, width: 130, marginBottom: 0 }}
                  >
                    <option value="">كل الحالات</option>
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="APPROVED">مقبول</option>
                    <option value="REJECTED">مرفوض</option>
                  </select>

                  <select
                    value={licenseFilters.sort}
                    onChange={(e) => setLicenseFilters(f => ({ ...f, sort: e.target.value }))}
                    style={{ ...styles.input, width: 150, marginBottom: 0 }}
                  >
                    <option value="newest">الأحدث أولاً</option>
                    <option value="oldest">الأقدم أولاً</option>
                  </select>
                </div>
              </div>

              {loading && !licensesLoaded ? (
                <div style={{ padding: '60px 0' }}><Spinner /></div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {loading && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 2, borderRadius: 14,
                      background: 'rgba(255,255,255,0.7)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Spinner />
                    </div>
                  )}
                  <div style={{
                    overflowX: 'auto',
                    opacity: loading ? 0.5 : 1,
                    transition: 'opacity 0.2s ease'
                  }}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={{ background: '#1f2937' }}>
                          {[
                            { key: 'license_number', label: COLUMN_NAMES_ARABIC.license_number },
                            { key: 'license_expiry', label: COLUMN_NAMES_ARABIC.license_expiry },
                            { key: 'status', label: COLUMN_NAMES_ARABIC.status }
                          ].map(col => (
                            <th key={col.key} style={{ ...thDark, cursor: 'pointer' }} onClick={() => toggleLicenseSort(col.key)}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {col.label} {sortArrow(licenseSort, col.key)}
                              </div>
                            </th>
                          ))}
                          <th style={thDark}>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {licenseResult.rows.length === 0 ? (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>لا توجد رخص حالياً</td></tr>
                        ) : licenseResult.rows.map(lic => (
                          <tr key={lic.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={styles.td}>{lic.license_number}</td>
                            <td style={styles.td}>{new Date(lic.license_expiry).toLocaleDateString('ar-EG')}</td>
                            <td style={styles.td}>{formatCell(lic.status, 'status')}</td>
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
                  {licenseResult.total > 0 && renderPagination({
                    result: licenseResult,
                    page: licensePage,
                    setPage: setLicensePage,
                    itemLabel: SECTION_ITEM_LABEL.licenses
                  })}
                </div>
              )}
            </div>
          </div>
        );
      case 'restaurants':
        return renderDataTable('المطاعم');
      case 'reservations':
        return renderDataTable('الحجوزات');
      case 'reviews':
        return renderDataTable('التقييمات');
      case 'users':
        return renderDataTable('المستخدمين');
      case 'analytics':
        return (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>التحليلات</h3>
            <p style={{ color: '#6b7280' }}>هذه الصفحة قيد التطوير...</p>
          </div>
        );
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes profileMenuIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
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
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textTransform: 'uppercase', fontWeight: 600 }}>Admin Control Panel</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sidebarItems.map(item => {
              const isSectionActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
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
                    background: isSectionActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: isSectionActive ? '#f59e0b' : '#94a3b8',
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
                </button>
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
                  <span>لوحة تحكم المسؤول</span>
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
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{profileData.first_name} {profileData.last_name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{profileData.email}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setProfileMenuOpen(false); setActiveSection('profile'); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '11px 14px', border: 'none', borderRadius: 10,
                          background: activeSection === 'profile' ? '#f8fafc' : 'transparent',
                          cursor: 'pointer', fontSize: 14, fontWeight: 600,
                          color: activeSection === 'profile' ? '#f59e0b' : '#475569', textAlign: 'right'
                        }}
                        onMouseEnter={(e) => { if (activeSection !== 'profile') e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { if (activeSection !== 'profile') e.currentTarget.style.background = 'transparent'; }}
                      >
                        <User size={18} />
                        <span>إعدادات البروفايل</span>
                      </button>
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
  input: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff',
    transition: 'border-color .2s', color: '#111827', direction: 'rtl'
  },
};
