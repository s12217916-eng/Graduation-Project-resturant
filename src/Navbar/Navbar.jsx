import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCalendarCheck, FaSignOutAlt, FaIdCard, FaHeart } from 'react-icons/fa';
import { isAuthenticated, logoutUser } from '../services/authService';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setLoggedIn(false);
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
    .btn-reserve-nav {
      background: #fd7e14;
      color: white !important;
      border-radius: 12px;
      padding: 8px 22px !important;
      font-weight: bold;
      transition: 0.3s;
      border: none;
    }
    .btn-reserve-nav:hover {
      background: #e66d00;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(253, 126, 20, 0.4);
    }
    .auth-links .nav-link {
      font-size: 0.85rem;
      opacity: 0.95;
    }
    .logout-btn {
      background: transparent;
      border: none;
      padding: 0;
    }
    @media (max-width: 991px) {
      .navbar-collapse {
        background: #111;
        padding: 20px;
        border-radius: 20px;
        margin-top: 10px;
      }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <nav className="navbar navbar-expand-lg custom-navbar navbar-dark">
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

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto text-end">
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

              {loggedIn && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/myreservations' ? 'active' : ''}`}
                    to="/myreservations"
                  >
                    حجوزاتي
                  </Link>
                </li>
              )}
              {loggedIn && (
  <li className="nav-item">
    <Link
      className={`nav-link ${location.pathname === '/saved-restaurants' ? 'active' : ''}`}
      to="/saved-restaurants"
    >
      <FaHeart className="ms-1" />
      المفضلة
    </Link>
  </li>
)}

              {loggedIn && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    to="/profile"
                  >
                    البروفايل
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  to="/dashboard"
                >
                  لوحة التحكم
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

            <div className="d-flex align-items-center gap-3 auth-links justify-content-end mt-lg-0 mt-3">
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
                <>
                  <Link className="nav-link p-0 d-flex align-items-center gap-1" to="/profile">
                    <FaIdCard /> البروفايل
                  </Link>

                  <button
                    className="nav-link logout-btn d-flex align-items-center gap-1"
                    onClick={handleLogout}
                    type="button"
                  >
                    <FaSignOutAlt /> تسجيل خروج
                  </button>

                  <div
                    className="vr bg-white opacity-25 d-none d-lg-block"
                    style={{ height: '20px' }}
                  ></div>
                </>
              )}

              <Link
                className="nav-link btn-reserve-nav shadow-sm d-flex align-items-center gap-2"
                to="/resturant"
              >
                <FaCalendarCheck /> احجز الآن
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}