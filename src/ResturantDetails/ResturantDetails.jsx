import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaMapMarkerAlt,
  FaStar,
  FaUtensils,
  FaArrowLeft,
  FaClock,
  FaCalendarCheck,
  FaCompass,
  FaImage,
  FaPhone,
} from 'react-icons/fa';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function ResturantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('menu');
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [subImages, setSubImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewForm, setReviewForm] = useState({
    comment: '',
    food_rate: 0,
    service_rate: 0,
    ambiance_rate: 0,
    menu_id: '',
  });

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);

      try {
        const baseUrl = `https://revvo-server.onrender.com/api/restaurants/${id}`;

        const [resDetails, resMenu, resReviews, resDays, resImages] =
          await Promise.all([
            axios.get(baseUrl),
            axios.get(`${baseUrl}/menu/`),
            axios.get(`${baseUrl}/reviews/`),
            axios.get(`${baseUrl}/days/`),
            axios.get(`${baseUrl}/images/`),
          ]);

        const menuData = resMenu.data || [];

        setRestaurant(resDetails.data);
        setMenu(menuData);
        setReviews(resReviews.data.results || []);
        setWorkingDays(resDays.data || []);
        setSubImages(resImages.data || []);

        if (menuData.length > 0) {
          setReviewForm((prev) => ({
            ...prev,
            menu_id: menuData[0].id,
          }));
        }
      } catch (error) {
        console.error('Fetch restaurant data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setRatingValue = (field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderReviewStars = (field, currentValue) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={() => setRatingValue(field, star)}
        style={{
          fontSize: '28px',
          cursor: 'pointer',
          color: star <= currentValue ? '#fd7e14' : '#ddd',
          marginLeft: '4px',
          transition: '0.2s',
        }}
      >
        ★
      </span>
    ));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    const access = localStorage.getItem('access');
console.log('REVIEW HANDLE RUNNING');
console.log('REVIEW ACCESS TOKEN =>', access);
console.log('REVIEW PAYLOAD =>', payload);
    if (!access) {
      setReviewError('يجب تسجيل الدخول أولاً لإضافة تقييم');
      navigate('/login');
      return;
    }

    if (
      !reviewForm.food_rate ||
      !reviewForm.service_rate ||
      !reviewForm.ambiance_rate
    ) {
      setReviewError('يرجى تعبئة جميع التقييمات');
      return;
    }

    if (!reviewForm.comment.trim()) {
      setReviewError('يرجى كتابة تعليق');
      return;
    }

    if (!reviewForm.menu_id) {
      setReviewError('يرجى اختيار صنف من القائمة');
      return;
    }

    const payload = {
      comment: reviewForm.comment.trim(),
      food_rate: Number(reviewForm.food_rate),
      service_rate: Number(reviewForm.service_rate),
      ambiance_rate: Number(reviewForm.ambiance_rate),
      menu_id: reviewForm.menu_id,
    };

    try {
      setReviewLoading(true);

      await axios.post(
  `https://revvo-server.onrender.com/api/restaurants/${id}/reviews/`,
  payload,
  {
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Debug-From': 'RestaurantDetails-review',
    },
  }
);

      const resReviews = await axios.get(
        `https://revvo-server.onrender.com/api/restaurants/${id}/reviews/`
      );

      setReviews(resReviews.data.results || []);

      setReviewForm((prev) => ({
        ...prev,
        comment: '',
        food_rate: 0,
        service_rate: 0,
        ambiance_rate: 0,
      }));

      setActiveTab('reviews');
      alert('تم إرسال التقييم بنجاح');
    } catch (error) {
      console.error('Create review error:', error?.response?.data || error);

      setReviewError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'فشل إرسال التقييم'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-white">
        <div className="spinner-grow text-warning" role="status"></div>
      </div>
    );
  }

  if (!restaurant) return null;

  const position = [parseFloat(restaurant.lat), parseFloat(restaurant.lon)];

  const customStyles = `
    .details-page {
      background: #f8f9fa;
      direction: rtl;
      font-family: 'Cairo', sans-serif;
      text-align: right;
    }

    .hero-banner {
      height: 450px;
      background: url(${restaurant.image}) center/cover;
      position: relative;
      border-radius: 0 0 60px 60px;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
      border-radius: 0 0 60px 60px;
    }

    .tabs-container {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      padding: 8px;
      border-radius: 20px;
      display: inline-flex;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border: 1px solid white;
    }

    .custom-tab {
      padding: 12px 28px;
      border-radius: 16px;
      cursor: pointer;
      font-weight: 700;
      color: #666;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .custom-tab.active {
      background: #fd7e14;
      color: white;
      box-shadow: 0 8px 20px rgba(253, 126, 20, 0.3);
      transform: translateY(-2px);
    }

    .custom-tab:hover:not(.active) {
      background: #eee;
      color: #333;
    }

    .menu-item-card {
      background: white;
      border-radius: 24px;
      padding: 20px;
      border: 1px solid #f0f0f0;
      transition: 0.3s;
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .menu-item-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.06);
      border-color: #fd7e14;
    }

    .btn-reserve-luxury {
      background: linear-gradient(45deg, #212529, #343a40);
      color: white;
      padding: 20px;
      border-radius: 20px;
      font-weight: 800;
      border: none;
      width: 100%;
      transition: 0.3s;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }

    .btn-reserve-luxury:hover {
      background: #fd7e14;
      transform: scale(1.02);
      box-shadow: 0 15px 30px rgba(253,126,20,0.3);
    }

    .map-frame {
      border-radius: 30px;
      overflow: hidden;
      border: 8px solid white;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      height: 380px;
    }
  `;

  return (
    <div className="details-page pb-5">
      <style>{customStyles}</style>

      <div className="hero-banner shadow-lg">
        <div className="hero-overlay"></div>
        <div className="container h-100 d-flex flex-column justify-content-between py-5 position-relative">
          <button
            className="btn btn-blur rounded-pill px-4 align-self-start border-0 text-white fw-bold"
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="ms-2" /> رجوع للمطاعم
          </button>

          <div className="text-white text-end">
            <span
              className="badge bg-warning text-dark mb-3 px-3 py-2 rounded-pill fw-bold text-uppercase"
              style={{ letterSpacing: '1px' }}
            >
              {restaurant.category}
            </span>

            <h1 className="display-2 fw-black mb-2">{restaurant.name}</h1>

            <p className="fs-5 opacity-75 d-flex align-items-center justify-content-end">
              {restaurant.address}
              <FaMapMarkerAlt className="me-2 text-warning" />
            </p>
          </div>
        </div>
      </div>

      <div className="container mt-n5 position-relative mt-4" style={{ zIndex: 5 }}>
        <div className="row g-4">
          <div className="col-lg-8 order-2 order-lg-1">
            <div className="text-center mb-5 w-100">
              <div className="tabs-container">
                <div
                  className={`custom-tab ${activeTab === 'menu' ? 'active' : ''}`}
                  onClick={() => setActiveTab('menu')}
                >
                  <FaUtensils /> قائمة الطعام
                </div>

                <div
                  className={`custom-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <FaStar /> التقييمات
                </div>

                <div
                  className={`custom-tab ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  <FaCompass /> عن المكان
                </div>
              </div>
            </div>

            {activeTab === 'menu' && (
              <div className="row g-4">
                {menu.map((item) => (
                  <div className="col-md-6" key={item.id}>
                    <div className="menu-item-card shadow-sm">
                      <img
                        src={item.image}
                        className="rounded-4"
                        style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                        alt="food"
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="fw-bold m-0">{item.name}</h6>
                          <span className="text-warning fw-black">{item.price} JOD</span>
                        </div>
                        <p className="text-muted small m-0 lh-sm">{item.ingredients}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white p-5 rounded-5 shadow-sm border">
                <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-4">
                  <h4 className="fw-black m-0">ماذا يقول الزوار؟</h4>

                  <button
                    className="btn btn-dark rounded-pill px-4 fw-bold shadow"
                    onClick={() => {
                      const access = localStorage.getItem('access');
                      if (!access) {
                        navigate('/login');
                        return;
                      }
                      document
                        .getElementById('review-form')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    أضف تقييمك
                  </button>
                </div>

                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="mb-4 pb-4 border-bottom border-light d-flex gap-4 align-items-start"
                    >
                      <div className="flex-grow-1 text-end">
                        <div className="d-flex justify-content-end align-items-center gap-2 mb-1">
                          <h6 className="fw-bold m-0">
                            {rev.user?.first_name || 'مستخدم'}
                          </h6>

                          <div className="text-warning small">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                color={
                                  i < Math.round(rev.overall_rate || 0)
                                    ? '#ffc107'
                                    : '#e0e0e0'
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-secondary mb-0">{rev.comment}</p>
                      </div>

                      <img
                        src={
                          rev.user?.image ||
                          'https://via.placeholder.com/60x60?text=User'
                        }
                        className="rounded-circle border-4 border-white shadow-sm"
                        width="60"
                        height="60"
                        alt="avatar"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center mb-4">لا توجد تقييمات بعد</p>
                )}

                <div id="review-form" className="mt-5 pt-4 border-top">
                  <h4 className="fw-bold mb-4 text-end">أضف تقييمك للمطعم</h4>

                  {reviewError && (
                    <div className="alert alert-danger text-center py-2" role="alert">
                      {reviewError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview}>
                    <div className="row g-4 mb-4">
                      <div className="col-md-4 text-end">
                        <label className="fw-bold d-block mb-2">جودة الطعام</label>
                        <div>{renderReviewStars('food_rate', reviewForm.food_rate)}</div>
                      </div>

                      <div className="col-md-4 text-end">
                        <label className="fw-bold d-block mb-2">مستوى الخدمة</label>
                        <div>
                          {renderReviewStars('service_rate', reviewForm.service_rate)}
                        </div>
                      </div>

                      <div className="col-md-4 text-end">
                        <label className="fw-bold d-block mb-2">أجواء المكان</label>
                        <div>
                          {renderReviewStars('ambiance_rate', reviewForm.ambiance_rate)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 text-end">
                      <label className="fw-bold d-block mb-2">اختر صنفًا من القائمة</label>
                      <select
                        name="menu_id"
                        className="form-select"
                        value={reviewForm.menu_id}
                        onChange={handleReviewChange}
                      >
                        <option value="">اختر صنفًا</option>
                        {menu.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4 text-end">
                      <label className="fw-bold d-block mb-2">اكتب تعليقك</label>
                      <textarea
                        name="comment"
                        className="form-control"
                        rows="4"
                        placeholder="اكتب رأيك بالتجربة"
                        value={reviewForm.comment}
                        onChange={handleReviewChange}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-warning w-100 fw-bold py-3 rounded-pill"
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? 'جاري إرسال التقييم...' : 'إرسال التقييم'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white p-5 rounded-5 shadow-sm border">
                <h4 className="fw-black mb-4">اكتشف موقعنا</h4>

                <div className="map-frame mb-5">
                  <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}>
                      <Popup>
                        <b>{restaurant.name}</b>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="p-4 rounded-4 bg-light border mb-4">
                  <h6 className="fw-bold mb-3 text-warning">حول المطعم</h6>
                  <p className="lh-lg text-dark m-0 fs-6">{restaurant.about}</p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 border rounded-4 d-flex align-items-center gap-3 bg-white">
                      <div className="p-3 bg-success-subtle rounded-3 text-success">
                        <FaPhone size={20} />
                      </div>
                      <div>
                        <small className="text-muted d-block">رقم الهاتف</small>
                        <span className="fw-bold">{restaurant.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 border rounded-4 d-flex align-items-center gap-3 bg-white">
                      <div className="p-3 bg-primary-subtle rounded-3 text-primary">
                        <FaCompass size={20} />
                      </div>
                      <div>
                        <small className="text-muted d-block">الموقع الدقيق</small>
                        <span className="fw-bold">
                          {restaurant.lat}, {restaurant.lon}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4 order-1 order-lg-2">
            <div className="sticky-top" style={{ top: '30px' }}>
              <div className="bg-white p-4 rounded-5 shadow-sm border-0 mb-4 text-center">
                <h5 className="fw-black mb-4">احجز طاولتك الآن</h5>

                <button
                  className="btn-reserve-luxury fs-5 shadow-lg"
                  onClick={() => navigate(`/reservation/${id}`)}
                >
                  <FaCalendarCheck className="ms-2" /> تأكيد الحجز فورا
                </button>

                <p className="text-muted small mt-3 m-0">لا توجد رسوم إضافية على الحجز</p>
              </div>

              <div className="bg-white p-4 rounded-5 shadow-sm border-0">
                <h6 className="fw-black mb-4 d-flex align-items-center gap-2">
                  <FaClock className="text-warning" /> أوقات العمل
                </h6>

                {workingDays.map((day, i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between py-2 border-bottom border-light-subtle"
                  >
                    <span className="fw-bold text-dark">{day.day}</span>
                    <span
                      className={
                        day.is_closed
                          ? 'badge bg-danger-subtle text-danger rounded-pill'
                          : 'text-muted fw-bold'
                      }
                    >
                      {day.is_closed ? 'مغلق' : `${day.start_time} - ${day.end_time}`}
                    </span>
                  </div>
                ))}

                <h6 className="fw-black mt-5 mb-3 d-flex align-items-center gap-2">
                  <FaImage className="text-warning" /> معرض الصور
                </h6>

                <div className="row g-2">
                  {subImages.slice(0, 4).map((img) => (
                    <div className="col-6" key={img.id}>
                      <img
                        src={img.image}
                        className="w-100 rounded-4 shadow-sm"
                        style={{ height: '100px', objectFit: 'cover' }}
                        alt="gallery"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}