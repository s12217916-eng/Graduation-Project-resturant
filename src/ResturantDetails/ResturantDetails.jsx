import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaStar,
  FaUtensils,
  FaArrowLeft,
  FaClock,
  FaCalendarCheck,
  FaCompass,
  FaImage,
  FaPhone,
  FaThumbsUp,
  FaInfoCircle,
} from 'react-icons/fa';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API = 'http://localhost:8000/api';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const getAccess = () =>
  localStorage.getItem('access') || localStorage.getItem('token');

export default function ResturantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('basic');
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [subImages, setSubImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usefulReviews, setUsefulReviews] = useState([]);

  // Filtering States
  const [menuSearch, setMenuSearch] = useState('');
  const [menuPriceFilter, setMenuPriceFilter] = useState('all'); // all, low (0-10), mid (10-25), high (25+)
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [reviewSort, setReviewSort] = useState('newest'); // newest, oldest, highest, lowest

  const [reviewForm, setReviewForm] = useState({
    comment: '',
    food_rate: 0,
    service_rate: 0,
    ambiance_rate: 0,
    menu_id: '',
  });

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Gallery State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // null means grid view, index means lightbox

  const openGallery = (index = null) => {
    setSelectedImageIndex(index);
    setShowGalleryModal(true);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev + 1) % subImages.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev - 1 + subImages.length) % subImages.length);
    }
  };

  // Reservation State
  const [reservationData, setReservationData] = useState({
    date: '',
    party_size: 3,
    start_time: '',
    end_time: '',
    notes: '',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingReservation, setSubmittingReservation] = useState(false);

  // Day Translation Mapping
  const arabicDays = {
    MONDAY: 'الاثنين',
    TUESDAY: 'الثلاثاء',
    WEDNESDAY: 'الأربعاء',
    THURSDAY: 'الخميس',
    FRIDAY: 'الجمعة',
    SATURDAY: 'السبت',
    SUNDAY: 'الأحد',
  };

  // Reservation Helpers
  const forceEnglishDigits = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  const normalizeTime = (value) => {
    const clean = forceEnglishDigits(value || '').trim();
    if (!clean) return '';
    if (/^\d{2}:\d{2}$/.test(clean)) return clean;
    if (/^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean.slice(0, 5);
    return clean;
  };

  const addMinutesToTime = (time, minutesToAdd = 90) => {
    const clean = normalizeTime(time);
    if (!clean) return '';
    const [hours, minutes] = clean.split(':').map(Number);
    const total = hours * 60 + minutes + minutesToAdd;
    const nextHours = Math.floor((total % (24 * 60)) / 60);
    const nextMinutes = total % 60;
    return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
  };

  const extractSlots = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.available_slots)) return data.available_slots;
    if (Array.isArray(data?.available_times)) return data.available_times;
    if (Array.isArray(data?.availableTimes)) return data.availableTimes;
    if (Array.isArray(data?.times)) return data.times;
    if (Array.isArray(data?.slots)) return data.slots;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const parseSlotStart = (slot) => {
    if (!slot) return '';
    if (typeof slot === 'string') {
      if (slot.includes('-')) return normalizeTime(slot.split('-')[0]);
      return normalizeTime(slot);
    }
    if (typeof slot === 'object') {
      return normalizeTime(slot.start_time || slot.startTime || slot.start || slot.from || slot.time || slot.value || '');
    }
    return '';
  };

  const parseSlotEnd = (slot) => {
    if (!slot) return '';
    if (typeof slot === 'string') {
      if (slot.includes('-')) return normalizeTime(slot.split('-')[1]);
      return '';
    }
    if (typeof slot === 'object') {
      return normalizeTime(slot.end_time || slot.endTime || slot.end || slot.to || '');
    }
    return '';
  };

  const getSlotLabel = (slot) => {
    const start = parseSlotStart(slot);
    const end = parseSlotEnd(slot);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return 'وقت متاح';
  };

  const fetchAvailability = async (dateValue, partySizeValue) => {
    const cleanDate = forceEnglishDigits(dateValue);
    if (!cleanDate || !id) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    setAvailableSlots([]);
    setReservationData((prev) => ({
      ...prev,
      start_time: '',
      end_time: '',
    }));
    try {
      const res = await axios.get(
        `${API}/restaurants/${id}/reservations/availability`,
        {
          params: {
            date: cleanDate,
            party_size: Number(partySizeValue || 1),
          },
          headers: { Accept: 'application/json' },
        }
      );
      setAvailableSlots(extractSlots(res.data));
    } catch (error) {
      console.error('Availability error:', error?.response?.data || error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (reservationData.date) {
      fetchAvailability(reservationData.date, reservationData.party_size);
    }
  }, [reservationData.date, reservationData.party_size, id]);

  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationData((prev) => ({
      ...prev,
      [name]: name === 'date' ? forceEnglishDigits(value) : value,
    }));
  };

  const handleSlotSelect = (slot) => {
    const start = parseSlotStart(slot);
    let end = parseSlotEnd(slot);
    if (!start) {
      Swal.fire('تنبيه', 'هذا الوقت غير صالح', 'warning');
      return;
    }
    if (!end) {
      end = addMinutesToTime(start, 90);
    }
    setReservationData((prev) => ({
      ...prev,
      start_time: start,
      end_time: end,
    }));
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    const access = getAccess();
    if (!access) {
      Swal.fire('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
      navigate('/login');
      return;
    }
    if (!reservationData.date) {
      Swal.fire('تنبيه', 'اختر تاريخ الحجز', 'warning');
      return;
    }
    if (!reservationData.start_time || !reservationData.end_time) {
      Swal.fire('تنبيه', 'اختر وقتًا من الأوقات المتاحة', 'warning');
      return;
    }
    const payload = {
      date: forceEnglishDigits(reservationData.date),
      start_time: normalizeTime(reservationData.start_time),
      end_time: normalizeTime(reservationData.end_time),
      party_size: Number(reservationData.party_size),
      notes: reservationData.notes?.trim() || '',
    };
    setSubmittingReservation(true);
    try {
      await axios.post(
        `${API}/client/restaurants/${id}/reservations/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${access}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      await Swal.fire('تم الحجز!', 'تم إرسال الحجز بنجاح', 'success');
      navigate('/myreservations');
    } catch (error) {
      console.error('Reservation error:', error?.response?.data || error);
      const data = error?.response?.data;
      const msg = data?.detail || data?.message || data?.non_field_errors?.[0] || 'فشل في إنشاء الحجز';
      Swal.fire('فشل الحجز', msg, 'error');
    } finally {
      setSubmittingReservation(false);
    }
  };

  const getArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const authHeaders = () => {
    const access = getAccess();

    return {
      Authorization: `Bearer ${access}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  };

  const fetchRestaurantData = async () => {
    setLoading(true);

    try {
      const baseUrl = `${API}/restaurants/${id}`;

      const [resDetails, resMenu, resReviews, resDays, resImages] =
        await Promise.all([
          axios.get(baseUrl),
          axios.get(`${baseUrl}/menu/`),
          axios.get(`${baseUrl}/reviews/`),
          axios.get(`${baseUrl}/days/`),
          axios.get(`${baseUrl}/images/`),
        ]);

      const menuData = getArray(resMenu.data);

      setRestaurant(resDetails.data);
      setMenu(menuData);
      setReviews(getArray(resReviews.data));
      setWorkingDays(getArray(resDays.data));
      setSubImages(getArray(resImages.data));

      if (menuData.length > 0) {
        setReviewForm((prev) => ({
          ...prev,
          menu_id: menuData[0].id,
        }));
      }
    } catch (error) {
      console.error('Fetch restaurant data error:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientActions = async () => {
    const access = getAccess();
    if (!access) return;

    try {
      const [resSaves, resUsefuls] = await Promise.allSettled([
        axios.get(`${API}/client/saves/`, { headers: authHeaders() }),
        axios.get(`${API}/client/usefuls/`, { headers: authHeaders() }),
      ]);

      if (resSaves.status === 'fulfilled') {
        const savesData = getArray(resSaves.value.data);

        const exists = savesData.some((item) => {
          const restaurantId =
            item.restaurant?.id ||
            item.restaurant_id ||
            item.restaurant ||
            item.id;

          return String(restaurantId) === String(id);
        });

        setIsSaved(exists);
      }

      if (resUsefuls.status === 'fulfilled') {
        const usefulData = getArray(resUsefuls.value.data);

        const ids = usefulData
          .map((item) => item.review?.id || item.review_id || item.review || item.id)
          .filter(Boolean)
          .map(String);

        setUsefulReviews(ids);
      }
    } catch (error) {
      console.error('Fetch client actions error:', error?.response?.data || error);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
    fetchClientActions();
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

    const access = getAccess();

    if (!access) {
      setReviewError('يجب تسجيل الدخول أولاً لإضافة تقييم');
      navigate('/login');
      return;
    }

    if (!reviewForm.food_rate || !reviewForm.service_rate || !reviewForm.ambiance_rate) {
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
        `${API}/client/restaurants/${id}/reviews/`,
        payload,
        { headers: authHeaders() }
      );

      const resReviews = await axios.get(`${API}/restaurants/${id}/reviews/`);
      setReviews(getArray(resReviews.data));

      setReviewForm((prev) => ({
        ...prev,
        comment: '',
        food_rate: 0,
        service_rate: 0,
        ambiance_rate: 0,
      }));

      setActiveTab('reviews');
      setShowReviewModal(false);
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

  const handleSaveRestaurant = async () => {
    const access = getAccess();

    if (!access) {
      alert('لازم تسجل دخول');
      navigate('/login');
      return;
    }

    try {
      setSaving(true);

      if (isSaved) {
        await axios.delete(`${API}/client/restaurants/${id}/save/`, {
          headers: authHeaders(),
        });

        setIsSaved(false);
        alert('تمت الإزالة من المفضلة');
      } else {
        await axios.post(
          `${API}/client/restaurants/${id}/save/`,
          {},
          { headers: authHeaders() }
        );

        setIsSaved(true);
        alert('تمت الإضافة للمفضلة');
      }
    } catch (error) {
      console.error('Save error:', error?.response?.data || error);

      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'فشل الحفظ'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUseful = async (reviewId) => {
    const access = getAccess();

    if (!access) {
      alert('لازم تسجل دخول');
      navigate('/login');
      return;
    }

    const reviewIdString = String(reviewId);
    const isUseful = usefulReviews.includes(reviewIdString);

    try {
      if (isUseful) {
        await axios.delete(
          `${API}/client/restaurants/${id}/reviews/${reviewId}/useful`,
          { headers: authHeaders() }
        );

        setUsefulReviews((prev) => prev.filter((x) => x !== reviewIdString));
      } else {
        await axios.post(
          `${API}/client/restaurants/${id}/reviews/${reviewId}/useful`,
          {},
          { headers: authHeaders() }
        );

        setUsefulReviews((prev) => [...prev, reviewIdString]);
      }
    } catch (error) {
      console.error('Useful error:', error?.response?.data || error);
      alert(error?.response?.data?.detail || 'فشل تحديث مفيد');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const access = getAccess();

    if (!access) {
      navigate('/login');
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف التقييم؟')) return;

    try {
      await axios.delete(
        `${API}/client/restaurants/${id}/reviews/${reviewId}`,
        { headers: authHeaders() }
      );

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setUsefulReviews((prev) => prev.filter((x) => x !== String(reviewId)));
      alert('تم حذف التقييم');
    } catch (error) {
      console.error('Delete review error:', error?.response?.data || error);
      alert(error?.response?.data?.detail || 'فشل حذف التقييم');
    }
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-white">
        <div className="spinner-grow text-warning" role="status"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-white">
        <h4 className="text-danger">فشل تحميل بيانات المطعم</h4>
      </div>
    );
  }

  const position = [
    Number(restaurant.lat) || 31.9539,
    Number(restaurant.lon) || 35.9106,
  ];

  const customStyles = `
    .details-page {
      background: #f8f9fa;
      direction: rtl;
      font-family: 'Cairo', sans-serif;
      text-align: right;
    }

    .hero-banner {
      height: 450px;
      background: url(${restaurant.image || restaurant.image_url || ''}) center/cover;
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
      flex-wrap: wrap;
      justify-content: center;
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

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .modal-content-custom {
      background: white;
      padding: 30px;
      border-radius: 30px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
      position: relative;
    }

    .close-modal {
      position: absolute;
      top: 20px;
      left: 20px;
      background: #f8f9fa;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: 0.3s;
    }

    .close-modal:hover {
      background: #eee;
      transform: rotate(90deg);
    }

    .gallery-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      z-index: 3000;
      display: flex;
      flex-direction: column;
      padding: 40px;
      overflow-y: auto;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 1200px;
      margin: 60px auto;
    }

    .gallery-grid-item {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 15px;
      cursor: pointer;
      transition: 0.3s;
      border: 2px solid transparent;
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    }

    .gallery-grid-item:hover {
      transform: scale(1.02);
      border-color: #fd7e14;
      box-shadow: 0 15px 30px rgba(253, 126, 20, 0.2);
    }

    .gallery-grid-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.98);
      z-index: 3100;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .gallery-main-img {
      max-width: 90%;
      max-height: 85vh;
      border-radius: 10px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.1);
      object-fit: contain;
    }

    .gallery-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.05);
      color: #333;
      border: none;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      transition: 0.3s;
      cursor: pointer;
    }

    .gallery-nav-btn:hover {
      background: #fd7e14;
      color: white;
    }

    .gallery-nav-prev { right: 30px; }
    .gallery-nav-next { left: 30px; }

    .gallery-counter {
      position: absolute;
      bottom: 30px;
      color: #333;
      font-weight: 600;
      background: rgba(0,0,0,0.05);
      padding: 6px 16px;
      border-radius: 50px;
    }

    .close-gallery {
      position: fixed;
      top: 30px;
      left: 30px;
      background: white;
      color: #fd7e14;
      border: 2px solid #fd7e14;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 3200;
      font-size: 1.4rem;
      font-weight: bold;
      box-shadow: 0 5px 15px rgba(253, 126, 20, 0.2);
      transition: 0.3s;
    }

    .close-gallery:hover {
      background: #fd7e14;
      color: white;
      transform: rotate(90deg);
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

      <div className="container mt-4">
        <div className="d-flex justify-content-center gap-3">
          <button
            className="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2"
            style={{ fontSize: '1.1rem' }}
            onClick={() => openGallery(null)}
          >
            <FaImage /> عرض الصور
          </button>

          <button
            className="btn btn-warning rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2"
            style={{ fontSize: '1.1rem' }}
            onClick={() => {
              const access = getAccess();
              if (!access) {
                navigate('/login');
                return;
              }
              setShowReviewModal(true);
            }}
          >
            <FaStar /> أضف تقييمك
          </button>

          <button
            className={`btn rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2 ${
              isSaved ? 'btn-danger' : 'btn-white border text-danger'
            }`}
            style={{ fontSize: '1.1rem', background: isSaved ? '' : 'white' }}
            onClick={handleSaveRestaurant}
            disabled={saving}
          >
            {isSaved ? <FaHeart /> : <FaRegHeart />}
            {saving ? 'جاري الحفظ...' : isSaved ? 'إزالة من المفضلة' : 'حفظ المطعم'}
          </button>
        </div>
      </div>

      <div className="container mt-n5 position-relative mt-4" style={{ zIndex: 5 }}>
        <div className="row g-4">
          <div className="col-lg-8 order-2 order-lg-1">
            <div className="text-center mb-5 w-100">
              <div className="tabs-container">
                <div
                  className={`custom-tab ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  <FaInfoCircle /> معلومات أساسية
                </div>

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

            {activeTab === 'basic' && (
              <div className="bg-white p-5 rounded-5 shadow-sm border">
                <h4 className="fw-black mb-4 text-end">معلومات عن المطعم</h4>
                
                <div className="p-4 rounded-4 bg-light border mb-4 text-end">
                  <h6 className="fw-bold mb-3 text-warning">نبذة عن المكان</h6>
                  <p className="lh-lg text-dark m-0 fs-6">{restaurant.about || 'لا يوجد وصف متاح حالياً'}</p>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 d-flex align-items-center gap-3 bg-white shadow-sm">
                      <div className="p-3 bg-success-subtle rounded-3 text-success">
                        <FaPhone size={24} />
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">رقم الهاتف للتواصل</small>
                        <span className="fw-bold fs-5">{restaurant.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 d-flex align-items-center gap-3 bg-white shadow-sm">
                      <div className="p-3 bg-warning-subtle rounded-3 text-warning">
                        <FaMapMarkerAlt size={24} />
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">العنوان</small>
                        <span className="fw-bold fs-5">{restaurant.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 d-flex align-items-center gap-3 bg-white shadow-sm">
                      <div className="p-3 bg-primary-subtle rounded-3 text-primary">
                        <FaUtensils size={24} />
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">نوع المطبخ</small>
                        <span className="fw-bold fs-5">{restaurant.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 d-flex align-items-center gap-3 bg-white shadow-sm">
                      <div className="p-3 bg-info-subtle rounded-3 text-info">
                        <FaClock size={24} />
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">حالة العمل</small>
                        <span className="fw-bold fs-5">راجع جدول المواعيد</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'menu' && (
              <>
                <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                          <FaUtensils className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 rounded-end-pill"
                          placeholder="ابحث في القائمة..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select rounded-pill"
                        value={menuPriceFilter}
                        onChange={(e) => setMenuPriceFilter(e.target.value)}
                      >
                        <option value="all">كل الأسعار</option>
                        <option value="low">اقتصادي (أقل من 10 JOD)</option>
                        <option value="mid">متوسط (10 - 25 JOD)</option>
                        <option value="high">فاخر (أكثر من 25 JOD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  {menu
                    .filter((item) => {
                      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                                          (item.ingredients && item.ingredients.toLowerCase().includes(menuSearch.toLowerCase()));
                      const price = Number(item.price);
                      let matchesPrice = true;
                      if (menuPriceFilter === 'low') matchesPrice = price < 10;
                      else if (menuPriceFilter === 'mid') matchesPrice = price >= 10 && price <= 25;
                      else if (menuPriceFilter === 'high') matchesPrice = price > 25;
                      
                      return matchesSearch && matchesPrice;
                    })
                    .length > 0 ? (
                    menu
                      .filter((item) => {
                        const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                                            (item.ingredients && item.ingredients.toLowerCase().includes(menuSearch.toLowerCase()));
                        const price = Number(item.price);
                        let matchesPrice = true;
                        if (menuPriceFilter === 'low') matchesPrice = price < 10;
                        else if (menuPriceFilter === 'mid') matchesPrice = price >= 10 && price <= 25;
                        else if (menuPriceFilter === 'high') matchesPrice = price > 25;
                        
                        return matchesSearch && matchesPrice;
                      })
                      .map((item) => (
                        <div className="col-md-6" key={item.id}>
                          <div className="menu-item-card shadow-sm">
                            <img
                              src={item.image || item.image_url}
                              className="rounded-4"
                              style={{
                                width: '90px',
                                height: '90px',
                                objectFit: 'cover',
                              }}
                              alt="food"
                            />

                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <h6 className="fw-bold m-0">{item.name}</h6>
                                <span className="text-warning fw-black">
                                  {item.price} JOD
                                </span>
                              </div>

                              <p className="text-muted small m-0 lh-sm">
                                {item.ingredients}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted text-center">لا توجد عناصر تطابق بحثك</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white p-5 rounded-5 shadow-sm border">
                <div className="mb-4 border-bottom pb-4">
                  <h4 className="fw-black mb-4 text-end">ماذا يقول الزوار؟</h4>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                          <FaStar className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 rounded-end-pill"
                          placeholder="ابحث في التعليقات..."
                          value={reviewSearch}
                          onChange={(e) => setReviewSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select rounded-pill"
                        value={reviewRatingFilter}
                        onChange={(e) => setReviewRatingFilter(e.target.value)}
                      >
                        <option value="all">كل التقييمات</option>
                        <option value="5">5 نجوم</option>
                        <option value="4">4 نجوم فما فوق</option>
                        <option value="3">3 نجوم فما فوق</option>
                        <option value="2">نجمتان فما فوق</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select rounded-pill"
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value)}
                      >
                        <option value="newest">الأحدث أولاً</option>
                        <option value="oldest">الأقدم أولاً</option>
                        <option value="highest">الأعلى تقييماً</option>
                        <option value="lowest">الأقل تقييماً</option>
                      </select>
                    </div>
                  </div>
                </div>

                {reviews
                  .filter((rev) => {
                    const matchesSearch = rev.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                                        (rev.user?.first_name || rev.user?.username || '').toLowerCase().includes(reviewSearch.toLowerCase());
                    const matchesRating = reviewRatingFilter === 'all' ? true : Math.round(rev.overall_rate || 0) >= Number(reviewRatingFilter);
                    return matchesSearch && matchesRating;
                  })
                  .sort((a, b) => {
                    if (reviewSort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                    if (reviewSort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                    if (reviewSort === 'highest') return (b.overall_rate || 0) - (a.overall_rate || 0);
                    if (reviewSort === 'lowest') return (a.overall_rate || 0) - (b.overall_rate || 0);
                    return 0;
                  })
                  .length > 0 ? (
                  reviews
                    .filter((rev) => {
                      const matchesSearch = rev.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                                          (rev.user?.first_name || rev.user?.username || '').toLowerCase().includes(reviewSearch.toLowerCase());
                      const matchesRating = reviewRatingFilter === 'all' ? true : Math.round(rev.overall_rate || 0) >= Number(reviewRatingFilter);
                      return matchesSearch && matchesRating;
                    })
                    .sort((a, b) => {
                      if (reviewSort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                      if (reviewSort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                      if (reviewSort === 'highest') return (b.overall_rate || 0) - (a.overall_rate || 0);
                      if (reviewSort === 'lowest') return (a.overall_rate || 0) - (b.overall_rate || 0);
                      return 0;
                    })
                    .map((rev) => {
                      const isUseful = usefulReviews.includes(String(rev.id));

                      return (
                        <div
                          key={rev.id}
                          className="mb-4 pb-4 border-bottom border-light d-flex gap-4 align-items-start"
                        >
                          <div className="flex-grow-1 text-end">
                            <div className="d-flex justify-content-end align-items-center gap-2 mb-1">
                              <h6 className="fw-bold m-0">
                                {rev.user?.first_name || rev.user?.username || 'مستخدم'}
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

                            <p className="text-secondary mb-2">{rev.comment}</p>

                            <div className="d-flex justify-content-end gap-2 flex-wrap">
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill fw-bold ${
                                  isUseful ? 'btn-warning' : 'btn-outline-warning'
                                }`}
                                onClick={() => handleToggleUseful(rev.id)}
                              >
                                <FaThumbsUp className="ms-2" />
                                {isUseful ? 'مفيد' : 'مفيد؟'}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                                onClick={() => handleDeleteReview(rev.id)}
                              >
                                حذف
                              </button>
                            </div>
                          </div>

                          <img
                            src={
                              rev.user?.image ||
                              rev.user?.image_url ||
                              'https://via.placeholder.com/60x60?text=User'
                            }
                            className="rounded-circle border-4 border-white shadow-sm"
                            width="60"
                            height="60"
                            alt="avatar"
                          />
                        </div>
                      );
                    })
                ) : (
                  <p className="text-muted text-center mb-4">لا توجد تقييمات تطابق بحثك</p>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white p-5 rounded-5 shadow-sm border">
                <h4 className="fw-black mb-4 text-end">موقعنا على الخريطة</h4>

                <div className="map-frame mb-4">
                  <MapContainer
                    center={position}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <Marker position={position}>
                      <Popup>
                        <b>{restaurant.name}</b>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="p-4 border rounded-4 d-flex align-items-center gap-3 bg-light">
                  <div className="p-3 bg-primary-subtle rounded-3 text-primary">
                    <FaCompass size={24} />
                  </div>
                  <div className="text-end">
                    <small className="text-muted d-block">الإحداثيات الجغرافية</small>
                    <span className="fw-bold">
                      {restaurant.lat}, {restaurant.lon}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4 order-1 order-lg-2">
            <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>
              <div className="bg-white p-4 rounded-5 shadow-sm border-0 mb-4">
                <h5 className="fw-black mb-4 text-center">احجز طاولتك الآن</h5>

                <form onSubmit={handleReserve}>
                  <div className="mb-3">
                    <label className="fw-bold mb-2 small">تاريخ الحجز</label>
                    <div dir="ltr">
                      <input
                        type="date"
                        name="date"
                        className="form-control rounded-3"
                        value={reservationData.date}
                        onChange={handleReservationChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="fw-bold mb-2 small">عدد الضيوف</label>
                    <input
                      type="number"
                      name="party_size"
                      min="1"
                      className="form-control rounded-3"
                      value={reservationData.party_size}
                      onChange={handleReservationChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="fw-bold mb-2 small">الأوقات المتاحة</label>
                    <div className="p-2 bg-light rounded-3 border" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      <div className="d-flex flex-wrap gap-2">
                        {loadingSlots ? (
                          <div className="d-flex align-items-center gap-2 py-1">
                            <div className="spinner-border text-warning spinner-border-sm" />
                            <span className="text-muted small">جاري التحميل...</span>
                          </div>
                        ) : !reservationData.date ? (
                          <p className="text-muted small m-0 py-1">اختر تاريخًا أولاً</p>
                        ) : availableSlots.length > 0 ? (
                          availableSlots.map((slot, index) => {
                            const label = getSlotLabel(slot);
                            const start = parseSlotStart(slot);
                            const isSelected = reservationData.start_time === start;

                            return (
                              <button
                                key={`${label}-${index}`}
                                type="button"
                                className={`btn btn-sm py-1 px-2 rounded-pill ${
                                  isSelected ? 'btn-warning shadow-sm' : 'btn-outline-dark'
                                }`}
                                style={{ fontSize: '12px' }}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                {label}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-danger small m-0 py-1">لا توجد أوقات متاحة</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="fw-bold mb-2 small">ملاحظات</label>
                    <textarea
                      name="notes"
                      className="form-control rounded-3"
                      rows="2"
                      value={reservationData.notes}
                      onChange={handleReservationChange}
                      placeholder="أي طلبات خاصة؟"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  {reservationData.start_time && (
                    <div className="alert alert-warning py-2 px-3 mb-3 small text-center rounded-3">
                      حجز لـ {reservationData.party_size} أشخاص في {reservationData.start_time}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-reserve-luxury fs-6 py-3 shadow-lg mb-3"
                    disabled={submittingReservation}
                  >
                    {submittingReservation ? (
                      <span className="spinner-border spinner-border-sm me-2" />
                    ) : (
                      <FaCalendarCheck className="ms-2" />
                    )}
                    تأكيد الحجز الآن
                  </button>
                </form>
              </div>

              <div className="bg-white p-4 rounded-5 shadow-sm border-0">
                <h6 className="fw-black mb-4 d-flex align-items-center gap-2">
                  <FaClock className="text-warning" /> أوقات العمل
                </h6>

                {workingDays.map((day, i) => (
                  <div
                    key={day.id || i}
                    className="d-flex justify-content-between py-2 border-bottom border-light-subtle align-items-center"
                  >
                    <span className="fw-bold text-dark">
                      {arabicDays[day.day] || day.day_display || day.day}
                    </span>

                    <div className="text-start">
                      {day.is_closed ? (
                        <span className="badge bg-danger-subtle text-danger rounded-pill px-3">
                          مغلق
                        </span>
                      ) : day.is_open_24h ? (
                        <span className="badge bg-success-subtle text-success rounded-pill px-3">
                          مفتوح 24 ساعة
                        </span>
                      ) : (
                        <span className="text-muted fw-bold small">
                          {day.open_time} - {day.close_time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowReviewModal(false)}>✕</button>
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
                  className="form-select rounded-3"
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
                  className="form-control rounded-3"
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

      {showGalleryModal && subImages.length > 0 && (
        <div className="gallery-modal-overlay" onClick={() => setShowGalleryModal(false)}>
          <button className="close-gallery" onClick={() => setShowGalleryModal(false)}>✕</button>
          
          <div className="container">
            <h2 className="text-dark text-center mb-5 fw-bold">معرض الصور</h2>
            <div className="gallery-grid">
              {subImages.map((img, idx) => (
                <div 
                  key={img.id} 
                  className="gallery-grid-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                >
                  <img 
                    src={img.image || img.image_url} 
                    className="gallery-grid-img" 
                    alt={`gallery-${idx}`} 
                  />
                </div>
              ))}
            </div>
          </div>

          {selectedImageIndex !== null && (
            <div className="lightbox-overlay" onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex(null);
            }}>
              <button className="close-gallery" onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(null);
              }}>✕</button>

              <button className="gallery-nav-btn gallery-nav-prev" onClick={prevImage}>
                <FaArrowLeft />
              </button>

              <img 
                src={subImages[selectedImageIndex].image || subImages[selectedImageIndex].image_url} 
                className="gallery-main-img"
                alt="gallery-large"
                onClick={(e) => e.stopPropagation()}
              />

              <button className="gallery-nav-btn gallery-nav-next" onClick={nextImage}>
                <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
              </button>

              <div className="gallery-counter">
                {selectedImageIndex + 1} / {subImages.length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}