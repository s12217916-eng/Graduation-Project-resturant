import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterChoice() {
  const navigate = useNavigate();

  const customStyles = `
    .choice-section {
      background: linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('/hero2.jpg');
      background-size: cover;
      background-position: center;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      direction: rtl;
      padding: 40px 15px;
    }

    .choice-card {
      background: rgba(255,255,255,0.96);
      border-radius: 28px;
      padding: 45px;
      max-width: 780px;
      width: 100%;
      box-shadow: 0 20px 45px rgba(0,0,0,0.4);
      text-align: center;
    }

    .choice-btn {
      border: none;
      border-radius: 22px;
      padding: 28px 20px;
      width: 100%;
      min-height: 170px;
      transition: 0.3s;
      font-weight: bold;
    }

    .choice-btn:hover {
      transform: translateY(-6px);
      box-shadow: 0 15px 25px rgba(0,0,0,0.15);
    }

    .client-btn {
      background: linear-gradient(135deg, #fd7e14, #ff4d4d);
      color: white;
    }

    .owner-btn {
      background: linear-gradient(135deg, #212529, #444);
      color: white;
    }

    .choice-icon {
      font-size: 42px;
      margin-bottom: 15px;
      display: block;
    }
  `;

  return (
    <section className="choice-section">
      <style>{customStyles}</style>

      <div className="choice-card">
        <h2 className="fw-bold mb-2">إنشاء حساب جديد</h2>
        <p className="text-muted mb-5">اختر نوع الحساب الذي تريد إنشاءه</p>

        <div className="row g-4">
          <div className="col-md-6">
            <button
              type="button"
              className="choice-btn client-btn"
              onClick={() => navigate('/register/client')}
            >
              <span className="choice-icon">👤</span>
              <h4 className="fw-bold">سجل كمستخدم عادي</h4>
              <p className="mb-0 small">احجز طاولاتك واستكشف المطاعم</p>
            </button>
          </div>

          <div className="col-md-6">
            <button
              type="button"
              className="choice-btn owner-btn"
              onClick={() => navigate('/register/owner')}
            >
              <span className="choice-icon">🍽️</span>
              <h4 className="fw-bold">سجل كمالك مطعم</h4>
              <p className="mb-0 small">أدر مطعمك وحجوزات العملاء</p>
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="small mb-0">
            لديك حساب بالفعل؟
            <button
              type="button"
              className="btn btn-link text-warning fw-bold p-0 ms-1 text-decoration-none"
              onClick={() => navigate('/login')}
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}