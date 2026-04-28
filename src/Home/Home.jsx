import React from 'react'
import Hero from '../Hero/Hero'
import { useNavigate } from 'react-router-dom'
import {
  FaUtensils,
  FaStar,
  FaCalendarCheck,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaUsers,
  FaClock,
  FaQuoteRight,
} from 'react-icons/fa'

export default function Home() {
  const navigate = useNavigate()

  const featuredRestaurants = [
    {
      id: 1,
      name: 'Dine Heaven',
      category: 'Italian',
      location: 'رام الله',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    },
    {
      id: 2,
      name: 'Orient Palace',
      category: 'Oriental',
      location: 'نابلس',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200',
    },
    {
      id: 3,
      name: 'Coffee Mood',
      category: 'Cafe',
      location: 'بيت لحم',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
    },
  ]

  const testimonials = [
    {
      id: 1,
      name: 'أحمد ناصر',
      text: 'التجربة كانت ممتازة جدًا، الحجز سهل وسريع والتقييمات فعلًا ساعدتني أختار المكان المناسب.',
    },
    {
      id: 2,
      name: 'سارة محمد',
      text: 'أكثر شيء أعجبني هو سهولة تصفح المطاعم وإمكانية الحجز بدون تعقيد.',
    },
    {
      id: 3,
      name: 'لؤي خالد',
      text: 'واجهة جميلة جدًا وتنظيم مرتب، حسيت التطبيق جاهز للاستخدام الحقيقي.',
    },
  ]

  const customStyles = `
    .home-page {
      background: #ffffff;
      direction: rtl;
      font-family: 'Cairo', sans-serif;
      text-align: right;
    }

    .section-title {
      font-weight: 900;
      color: #111827;
      margin-bottom: 12px;
    }

    .section-subtitle {
      color: #6b7280;
      max-width: 700px;
      margin: 0 auto;
    }

    .feature-card {
      background: white;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.05);
      border: 1px solid #f1f5f9;
      transition: 0.3s;
      height: 100%;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 18px 40px rgba(0,0,0,0.08);
    }

    .feature-icon {
      width: 70px;
      height: 70px;
      border-radius: 20px;
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 18px;
    }

    .stat-box {
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: white;
      border-radius: 24px;
      padding: 26px;
      box-shadow: 0 18px 35px rgba(17,24,39,0.15);
      text-align: center;
      height: 100%;
    }

    .restaurant-card {
      background: white;
      border-radius: 26px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      transition: 0.3s;
      height: 100%;
    }

    .restaurant-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 18px 40px rgba(0,0,0,0.1);
    }

    .restaurant-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
    }

    .step-card {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 24px;
      padding: 26px;
      text-align: center;
      height: 100%;
    }

    .step-number {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #f97316;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      margin: 0 auto 16px;
      font-size: 1.1rem;
    }

    .testimonial-card {
      background: #f8fafc;
      border-radius: 24px;
      padding: 26px;
      border: 1px solid #e5e7eb;
      height: 100%;
      transition: 0.3s;
    }

    .testimonial-card:hover {
      transform: translateY(-6px);
      background: #ffffff;
      box-shadow: 0 15px 35px rgba(0,0,0,0.06);
    }

    .cta-section {
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: white;
      border-radius: 32px;
      overflow: hidden;
      position: relative;
    }

    .cta-section::after {
      content: "";
      position: absolute;
      left: -50px;
      bottom: -50px;
      width: 220px;
      height: 220px;
      background: rgba(245, 158, 11, 0.15);
      border-radius: 50%;
    }

    .primary-btn {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 14px 28px;
      font-weight: 800;
      transition: 0.3s;
      box-shadow: 0 10px 20px rgba(249,115,22,0.3);
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      color: white;
    }

    .outline-btn {
      background: transparent;
      color: #111827;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: 12px 24px;
      font-weight: 700;
      transition: 0.3s;
    }

    .outline-btn:hover {
      background: #111827;
      color: white;
      border-color: #111827;
    }
  `

  return (
    <div className="home-page">
      <style>{customStyles}</style>

      <Hero />

      {/* Stats */}
      <section className="container py-5">
        <div className="row g-4">
          <div className="col-6 col-lg-3">
            <div className="stat-box">
              <h2 className="fw-black mb-1">120+</h2>
              <p className="mb-0 text-white-50">مطعم متاح</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-box">
              <h2 className="fw-black mb-1">4.8</h2>
              <p className="mb-0 text-white-50">متوسط التقييم</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-box">
              <h2 className="fw-black mb-1">2K+</h2>
              <p className="mb-0 text-white-50">حجز ناجح</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-box">
              <h2 className="fw-black mb-1">24/7</h2>
              <p className="mb-0 text-white-50">خدمة متواصلة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-5 text-center">
        <h2 className="section-title">ليش تختار Dine Advisor؟</h2>
        <p className="section-subtitle mb-5">
          كل شيء تحتاجه لاكتشاف أفضل المطاعم وحجز طاولتك بسهولة في مكان واحد.
        </p>

        <div className="row g-4">
          <div className="col-md-6 col-xl-3">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUtensils />
              </div>
              <h5 className="fw-bold mb-2">تنوع كبير</h5>
              <p className="text-muted mb-0">استكشف مطاعم متنوعة من مختلف التصنيفات والأذواق.</p>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="feature-card">
              <div className="feature-icon">
                <FaCalendarCheck />
              </div>
              <h5 className="fw-bold mb-2">حجز سهل</h5>
              <p className="text-muted mb-0">اختر الوقت المناسب لك واحجز خلال لحظات.</p>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="feature-card">
              <div className="feature-icon">
                <FaStar />
              </div>
              <h5 className="fw-bold mb-2">تقييمات حقيقية</h5>
              <p className="text-muted mb-0">اعتمد على آراء وتجارب المستخدمين لاتخاذ قرار أفضل.</p>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="feature-card">
              <div className="feature-icon">
                <FaClock />
              </div>
              <h5 className="fw-bold mb-2">توفير وقت</h5>
              <p className="text-muted mb-0">بدون اتصالات كثيرة أو انتظار طويل، كل شيء أونلاين.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured restaurants */}
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="section-title mb-2">مطاعم مميزة</h2>
            <p className="text-muted m-0">اختيارات مقترحة لك من أفضل الأماكن على المنصة</p>
          </div>

          <button className="outline-btn" onClick={() => navigate('/resturant')}>
            عرض كل المطاعم
          </button>
        </div>

        <div className="row g-4">
          {featuredRestaurants.map((restaurant) => (
            <div className="col-md-6 col-xl-4" key={restaurant.id}>
              <div className="restaurant-card">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="restaurant-img"
                />

                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold mb-0">{restaurant.name}</h5>
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                      ⭐ {restaurant.rating}
                    </span>
                  </div>

                  <p className="text-muted small mb-2">{restaurant.category}</p>

                  <p className="text-muted small mb-4">
                    <FaMapMarkerAlt className="text-danger ms-1" />
                    {restaurant.location}
                  </p>

                  <button
                    className="primary-btn w-100"
                    onClick={() => navigate('/resturant')}
                  >
                    مشاهدة التفاصيل
                    <FaArrowLeft className="me-2" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-5 text-center">
        <h2 className="section-title">كيف يعمل التطبيق؟</h2>
        <p className="section-subtitle mb-5">
          خطوات بسيطة جدًا توصلك إلى تجربة حجز مريحة وسريعة
        </p>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="step-card">
              <div className="step-number">1</div>
              <h5 className="fw-bold mb-2">ابحث عن مطعم</h5>
              <p className="text-muted mb-0">
                تصفح قائمة المطاعم واختر المكان المناسب حسب رغبتك.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="step-card">
              <div className="step-number">2</div>
              <h5 className="fw-bold mb-2">اختر الوقت المناسب</h5>
              <p className="text-muted mb-0">
                شاهد الأوقات المتاحة وحدد الوقت الذي يناسبك.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="step-card">
              <div className="step-number">3</div>
              <h5 className="fw-bold mb-2">احجز واستمتع</h5>
              <p className="text-muted mb-0">
                أكد الحجز مباشرة وتابع تفاصيله بكل سهولة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="section-title">آراء المستخدمين</h2>
          <p className="section-subtitle">
            بعض الانطباعات الجميلة من مستخدمين جرّبوا المنصة
          </p>
        </div>

        <div className="row g-4">
          {testimonials.map((item) => (
            <div className="col-md-6 col-xl-4" key={item.id}>
              <div className="testimonial-card">
                <FaQuoteRight className="text-warning fs-3 mb-3" />
                <p className="text-muted lh-lg">{item.text}</p>
                <div className="d-flex align-items-center gap-2 mt-3">
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#111827',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaUsers />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">{item.name}</h6>
                    <small className="text-muted">مستخدم في المنصة</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-5">
        <div className="cta-section p-5 text-center">
          <h2 className="fw-black mb-3">جاهز لتبدأ تجربتك؟</h2>
          <p className="text-white-50 mb-4">
            اكتشف أفضل المطاعم، اقرأ التقييمات، واحجز طاولتك الآن بسهولة.
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button className="primary-btn" onClick={() => navigate('/resturant')}>
              استكشف المطاعم
            </button>

            <button className="outline-btn text-white border-white" onClick={() => navigate('/register')}>
              إنشاء حساب
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}