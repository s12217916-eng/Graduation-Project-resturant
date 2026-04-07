import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const customStyles = `
    .custom-navbar {
      /* التغيير الأساسي: جعل الناف بار يأخذ حيزاً من الصفحة */
      position: sticky;
      top: 0;
      z-index: 1020;
      padding: 12px 0;
      /* خلفية غامقة وفخمة لتناسب التصميم في الصورة الثانية */
      background: #111; 
      border-bottom: 2px solid #fd7e14; /* خط برتقالي ناعم للفصل */
    }
    .nav-link {
      color: rgba(255,255,255,0.8) !important;
      font-weight: 500;
      margin: 0 10px;
      transition: 0.3s;
    }
    .nav-link:hover, .nav-link.active {
      color: #fd7e14 !important;
    }
    .navbar-brand {
      font-weight: 800;
      color: #fff !important;
    }
    .btn-reserve-nav {
      background: #fd7e14;
      color: white !important;
      border-radius: 50px;
      padding: 8px 20px !important;
      font-weight: bold;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <nav className="navbar navbar-expand-lg custom-navbar navbar-dark">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src="/Logo.webp" alt="Logo" style={{ height: "35px" }} />
            <span>DINE ADVISOR</span>
          </Link>

          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">الرئيسية</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/resturant' ? 'active' : ''}`} to="/resturant">المطاعم</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} to="/about">من نحن</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`} to="/contact">تواصل معنا</Link>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-3">
              <Link className="nav-link small p-0" to="/login">دخول</Link>
              <Link className="nav-link small p-0" to="/register">طلب دخول</Link>
              <Link className="nav-link btn-reserve-nav shadow-sm" to="/reservation">احجز الآن</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}