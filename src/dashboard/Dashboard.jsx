import React from 'react';
import {
  FaTachometerAlt,
  FaUtensils,
  FaCalendarCheck,
  FaUsers,
  FaStar,
  FaChartLine,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaPlus,
  FaEye,
  FaEdit,
  FaMapMarkerAlt,
  FaSearch,
} from 'react-icons/fa';

export default function Dashboard() {
  const stats = [
    { title: 'إجمالي الحجوزات', value: '128', icon: <FaCalendarCheck />, color: '#f59e0b' },
    { title: 'عدد المطاعم', value: '12', icon: <FaUtensils />, color: '#10b981' },
    { title: 'عدد العملاء', value: '542', icon: <FaUsers />, color: '#3b82f6' },
    { title: 'متوسط التقييم', value: '4.8', icon: <FaStar />, color: '#ef4444' },
  ];

  const reservations = [
    { id: 1, customer: 'أحمد خالد', restaurant: 'Dine Heaven', guests: 4, time: '07:30 PM', status: 'مؤكد' },
    { id: 2, customer: 'سارة محمد', restaurant: 'Italian Taste', guests: 2, time: '08:00 PM', status: 'قيد الانتظار' },
    { id: 3, customer: 'لؤي ناصر', restaurant: 'Orient Palace', guests: 6, time: '09:15 PM', status: 'مؤكد' },
  ];

  const restaurants = [
    { id: 1, name: 'Dine Heaven', location: 'رام الله', rating: 4.9, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
    { id: 2, name: 'Italian Taste', location: 'نابلس', rating: 4.7, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800' },
    { id: 3, name: 'Orient Palace', location: 'بيت لحم', rating: 4.8, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800' },
  ];

  const customStyles = `
    .dashboard-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      direction: rtl;
      font-family: 'Cairo', sans-serif;
    }

    .sidebar {
      width: 270px;
      min-height: 100vh;
      background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
      color: white;
      position: fixed;
      top: 0;
      right: 0;
      padding: 28px 20px;
      z-index: 1000;
      box-shadow: -10px 0 30px rgba(0,0,0,0.08);
    }

    .sidebar-logo {
      font-size: 1.6rem;
      font-weight: 900;
      margin-bottom: 35px;
      text-align: center;
      color: #fff;
      letter-spacing: 0.5px;
    }

    .sidebar-logo span {
      color: #f59e0b;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 16px;
      color: #d1d5db;
      text-decoration: none;
      margin-bottom: 10px;
      transition: 0.25s;
      font-weight: 600;
    }

    .sidebar-link:hover,
    .sidebar-link.active {
      background: rgba(245, 158, 11, 0.14);
      color: #fff;
      transform: translateX(-4px);
    }

    .main-content {
      margin-right: 270px;
      padding: 28px;
    }

    .topbar {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(14px);
      border-radius: 24px;
      padding: 18px 22px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      border: 1px solid rgba(255,255,255,0.7);
      margin-bottom: 26px;
    }

    .search-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-box input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      font-size: 0.95rem;
    }

    .icon-btn {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      border: none;
      background: #f8fafc;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.25s;
      border: 1px solid #e5e7eb;
    }

    .icon-btn:hover {
      background: #111827;
      color: white;
    }

    .welcome-card {
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: white;
      border-radius: 28px;
      padding: 30px;
      box-shadow: 0 18px 40px rgba(17, 24, 39, 0.18);
      position: relative;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .welcome-card::after {
      content: "";
      position: absolute;
      left: -40px;
      bottom: -40px;
      width: 180px;
      height: 180px;
      background: rgba(245, 158, 11, 0.18);
      border-radius: 50%;
    }

    .primary-btn {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 12px 20px;
      font-weight: 700;
      transition: 0.25s;
      box-shadow: 0 10px 20px rgba(245, 158, 11, 0.28);
    }

    .primary-btn:hover {
      transform: translateY(-2px);
    }

    .stat-card {
      background: white;
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
      border: 1px solid #eef2f7;
      transition: 0.25s;
      height: 100%;
    }

    .stat-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
      margin-bottom: 14px;
    }

    .section-card {
      background: white;
      border-radius: 26px;
      padding: 24px;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
      border: 1px solid #eef2f7;
      height: 100%;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 20px;
    }

    .reservation-item {
      padding: 16px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #eef2f7;
      margin-bottom: 14px;
      transition: 0.25s;
    }

    .reservation-item:hover {
      background: #fff;
      transform: translateY(-2px);
    }

    .status-badge {
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .status-confirmed {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .restaurant-card {
      border-radius: 22px;
      overflow: hidden;
      background: #fff;
      border: 1px solid #eef2f7;
      transition: 0.25s;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
    }

    .restaurant-card:hover {
      transform: translateY(-5px);
    }

    .restaurant-img {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }

    .mini-action {
      width: 42px;
      height: 42px;
      border: none;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.25s;
    }

    .mini-action:hover {
      background: #111827;
      color: white;
    }

    .quick-box {
      border-radius: 20px;
      padding: 18px;
      background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
      border: 1px solid #fde68a;
      transition: 0.25s;
    }

    .quick-box:hover {
      transform: translateY(-4px);
    }

    @media (max-width: 991px) {
      .sidebar {
        position: relative;
        width: 100%;
        min-height: auto;
        border-radius: 0 0 24px 24px;
      }

      .main-content {
        margin-right: 0;
        padding: 18px;
      }
    }
  `;

  return (
    <div className="dashboard-page">
      <style>{customStyles}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          Dine <span>Advisor</span>
        </div>

        <a href="#" className="sidebar-link active">
          <FaTachometerAlt /> الرئيسية
        </a>
        <a href="#" className="sidebar-link">
          <FaUtensils /> المطاعم
        </a>
        <a href="#" className="sidebar-link">
          <FaCalendarCheck /> الحجوزات
        </a>
        <a href="#" className="sidebar-link">
          <FaUsers /> العملاء
        </a>
        <a href="#" className="sidebar-link">
          <FaChartLine /> التقارير
        </a>
        <a href="#" className="sidebar-link">
          <FaCog /> الإعدادات
        </a>
        <a href="#" className="sidebar-link">
          <FaSignOutAlt /> تسجيل الخروج
        </a>
      </aside>

      <main className="main-content">
        <div className="topbar d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
          <div>
            <h4 className="fw-black m-0">لوحة التحكم</h4>
            <small className="text-muted">إدارة شاملة وسريعة للمطاعم والحجوزات</small>
          </div>

          <div className="d-flex align-items-center gap-2 w-100 justify-content-lg-end">
            <div className="search-box" style={{ minWidth: '280px', maxWidth: '360px', width: '100%' }}>
              <FaSearch className="text-muted" />
              <input type="text" placeholder="ابحث عن مطعم أو حجز..." />
            </div>
            <button className="icon-btn">
              <FaBell />
            </button>
          </div>
        </div>

        <div className="welcome-card">
          <div className="row align-items-center g-3">
            <div className="col-lg-8">
              <h2 className="fw-black mb-2">مرحباً بك في لوحة تحكم Dine Advisor</h2>
              <p className="mb-4 text-white-50">
                تابع أداء المطاعم، راقب الحجوزات الجديدة، وادِر كل شيء من مكان واحد بشكل عصري وسريع.
              </p>
              <button className="primary-btn">
                <FaPlus className="ms-2" />
                إضافة مطعم جديد
              </button>
            </div>
            <div className="col-lg-4 text-center">
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '28px',
                  background: 'rgba(255,255,255,0.08)',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                }}
              >
                <FaChartLine />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          {stats.map((stat, index) => (
            <div className="col-md-6 col-xl-3" key={index}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: stat.color }}>
                  {stat.icon}
                </div>
                <h3 className="fw-black mb-1">{stat.value}</h3>
                <p className="text-muted mb-0">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="section-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="section-title m-0">أحدث الحجوزات</h5>
                <button className="primary-btn px-3 py-2">عرض الكل</button>
              </div>

              {reservations.map((item) => (
                <div className="reservation-item" key={item.id}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                    <div>
                      <h6 className="fw-bold mb-1">{item.customer}</h6>
                      <div className="text-muted small mb-1">{item.restaurant}</div>
                      <div className="small text-secondary">
                        {item.guests} أشخاص • {item.time}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`status-badge ${
                          item.status === 'مؤكد' ? 'status-confirmed' : 'status-pending'
                        }`}
                      >
                        {item.status}
                      </span>

                      <button className="mini-action">
                        <FaEye />
                      </button>
                      <button className="mini-action">
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="section-card">
              <h5 className="section-title">إجراءات سريعة</h5>

              <div className="quick-box mb-3">
                <h6 className="fw-bold mb-2">إضافة مطعم جديد</h6>
                <p className="text-muted small mb-3">ابدأ بإضافة مطعم جديد إلى المنصة خلال ثوانٍ.</p>
                <button className="primary-btn w-100">
                  <FaPlus className="ms-2" />
                  إضافة الآن
                </button>
              </div>

              <div className="quick-box mb-3">
                <h6 className="fw-bold mb-2">متابعة الحجوزات الجديدة</h6>
                <p className="text-muted small mb-3">راجع الطلبات الحديثة وحدث حالتها بسرعة.</p>
                <button className="primary-btn w-100">عرض الحجوزات</button>
              </div>

              <div className="quick-box">
                <h6 className="fw-bold mb-2">مراجعة التقييمات</h6>
                <p className="text-muted small mb-3">اطلع على أحدث تقييمات العملاء وتحسينات الخدمة.</p>
                <button className="primary-btn w-100">فتح التقييمات</button>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="section-title m-0">المطاعم المضافة</h5>
            <button className="primary-btn px-3 py-2">إدارة المطاعم</button>
          </div>

          <div className="row g-4">
            {restaurants.map((restaurant) => (
              <div className="col-md-6 col-xl-4" key={restaurant.id}>
                <div className="restaurant-card">
                  <img src={restaurant.image} alt={restaurant.name} className="restaurant-img" />
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0">{restaurant.name}</h6>
                      <span className="badge bg-warning text-dark rounded-pill">
                        ⭐ {restaurant.rating}
                      </span>
                    </div>

                    <div className="text-muted small mb-3">
                      <FaMapMarkerAlt className="ms-1 text-danger" />
                      {restaurant.location}
                    </div>

                    <div className="d-flex gap-2">
                      <button className="mini-action">
                        <FaEye />
                      </button>
                      <button className="mini-action">
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}