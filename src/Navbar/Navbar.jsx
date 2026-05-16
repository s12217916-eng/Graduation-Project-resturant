import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCalendarCheck, FaSignOutAlt, FaIdCard, FaHeart, FaChevronDown, FaUserCog, FaStar } from 'react-icons/fa';
import { isAuthenticated, logoutUser, getProfile } from '../services/authService';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    if (isAuthenticated()) {
      fetchProfile();
    }
  }, [location.pathname]);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const userStr = localStorage.getItem('user');
      if (userStr) setProfileData(JSON.parse(userStr));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  if (loggedIn && (isOwner || isAdmin)) {
    return null;
  }

  const handleLogout = async () => {
    await logoutUser();
    setLoggedIn(false);
    setProfileMenuOpen(false);
    navigate('/login');
  };

  const customStyles = `
    .custom-navbar {
      position: sticky;
      top: 0;
      z-index: 1020;
      padding: 10px 0;
      background: rgba(17, 17, 17, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 2px solid #fd7e14;
      font-family: 'Cairo', sans-serif;
    }
    .nav-link {
      color: rgba(255,255,255,0.8) !important;
      font-weight: 600;
      margin: 0 8px;
      transition: 0.3s;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .nav-link:hover, .nav-link.active {
      color: #fd7e14 !important;
    }
    .navbar-brand {
      font-weight: 900;
      color: #fff !important;
      letter-spacing: 1px;
    }
    .auth-links .nav-link {
      font-size: 0.85rem;
      opacity: 0.95;
    }
    .profile-dropdown-container {
      position: relative;
    }
    .profile-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 12px;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: 0.3s;
    }
    .profile-trigger:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #fd7e14;
    }
    .profile-img {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #fd7e14;
    }
    .profile-menu {
      position: absolute;
      top: calc(100% + 10px);
      left: 0;
      min-width: 220px;
      background: #1a1a1a;
      border: 1px solid rgba(253, 126, 20, 0.2);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      padding: 15px;
      z-index: 1000;
      animation: profileMenuIn 0.2s ease-out;
    }
    @keyframes profileMenuIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .profile-menu-header {
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      text-align: left;
    }
    .profile-menu-name {
      color: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 2px;
    }
    .profile-menu-email {
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
    }
    .profile-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      border-radius: 10px;
      transition: 0.2s;
      font-size: 0.9rem;
      justify-content: flex-end;
      width: 100%;
      border: none;
      background: transparent;
    }
    .profile-menu-item:hover {
      background: rgba(253, 126, 20, 0.1);
      color: #fd7e14;
    }
    .profile-menu-item.logout {
      color: #ff4d4d;
    }
    .profile-menu-item.logout:hover {
      background: rgba(255, 77, 77, 0.1);
      color: #ff4d4d;
    }
    @media (max-width: 991px) {
      .navbar-collapse {
        background: #111;
        padding: 20px;
        border-radius: 20px;
        margin-top: 10px;
      }
      .profile-menu {
        position: static;
        width: 100%;
        margin-top: 10px;
        box-shadow: none;
        border: 1px solid rgba(255,255,255,0.1);
      }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <nav className="navbar navbar-expand-lg custom-navbar navbar-dark" dir="rtl">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src="/Logo.webp" alt="Logo" style={{ height: '40px', borderRadius: '8px' }} />
            <span className="d-none d-sm-inline">DINE ADVISOR</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
            <ul className="navbar-nav text-start">
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
                  الرئيسية
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/resturant' ? 'active' : ''}`}
                  to="/resturant"
                >
                  المطاعم
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
                  to="/about"
                >
                  من نحن
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3 auth-links mt-lg-0 mt-3">
              {!loggedIn ? (
                <>
                  <Link className="nav-link p-0 d-flex align-items-center gap-1" to="/login">
                    <FaUserCircle /> دخول
                  </Link>
                  <div
                    className="vr bg-white opacity-25 d-none d-lg-block"
                    style={{ height: '20px' }}
                  ></div>
                </>
              ) : (
                <div className="profile-dropdown-container" ref={profileMenuRef}>
                  <div 
                    className="profile-trigger" 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <FaChevronDown size={12} color="rgba(255,255,255,0.5)" />
                    <div className="text-end d-none d-sm-block">
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                        {profileData?.first_name || 'المستخدم'}
                      </div>
                    </div>
                    <img 
                      src={profileData?.image_url || 'https://via.placeholder.com/35'} 
                      alt="Profile" 
                      className="profile-img"
                    />
                  </div>

                  {profileMenuOpen && (
                    <div className="profile-menu">
                      <div className="profile-menu-header">
                        <div className="profile-menu-name">
                          {profileData?.first_name} {profileData?.last_name}
                        </div>
                        <div className="profile-menu-email">{profileData?.email}</div>
                      </div>
                      
                      <Link 
                        to="/my-reviews" 
                        className="profile-menu-item"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <span>تقييماتي</span>
                        <FaStar />
                      </Link>

                      <Link 
                        to="/myreservations" 
                        className="profile-menu-item"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <span>حجوزاتي</span>
                        <FaCalendarCheck />
                      </Link>

                      <Link 
                        to="/saved-restaurants" 
                        className="profile-menu-item"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <span>المفضلة</span>
                        <FaHeart />
                      </Link>

                      <Link 
                        to="/profile" 
                        className="profile-menu-item"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <span>إعدادات الحساب</span>
                        <FaUserCog />
                      </Link>

                      <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                      <button 
                        className="profile-menu-item logout" 
                        onClick={handleLogout}
                      >
                        <span>تسجيل خروج</span>
                        <FaSignOutAlt />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}