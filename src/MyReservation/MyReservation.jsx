import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaCalendarCheck,
  FaClock,
  FaUsers,
  FaTimesCircle,
  FaEdit,
  FaUtensils,
  FaInfoCircle,
  FaStore,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const API_BASE = 'https://revvo-server.onrender.com/api';

export default function MyReservation() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAccessToken = () => localStorage.getItem('access');

  const getRestaurantId = (res) => {
    return (
      res.restaurant_id ||
      res.restaurant?.id ||
      res.restaurant ||
      res.restaurant_uuid ||
      ''
    );
  };

  const getRestaurantName = (res) => {
    return (
      res.restaurant_name ||
      res.restaurant?.name ||
      res.restaurant?.restaurant_name ||
      'اسم المطعم غير متوفر'
    );
  };

  const getRestaurantImage = (res) => {
    return (
      res.restaurant_image ||
      res.restaurant?.image ||
      res.restaurant?.main_image ||
      'https://via.placeholder.com/150?text=Restaurant'
    );
  };

  const getRestaurantAddress = (res) => {
    return (
      res.restaurant_address ||
      res.restaurant?.address ||
      res.restaurant?.location ||
      ''
    );
  };

  const normalizeDate = (date) => {
    if (!date) return '';
    return String(date).split('T')[0];
  };

  const normalizeTime = (time) => {
    if (!time) return '';
    return String(time).slice(0, 5);
  };

  const fetchMyReservations = async () => {
    const access = getAccessToken();

    if (!access) {
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`${API_BASE}/reservations`, {
        headers: {
          Authorization: `Bearer ${access}`,
          Accept: 'application/json',
        },
      });

      const data = response?.data;
      setReservations(Array.isArray(data) ? data : data?.results || []);
      console.log('MY RESERVATIONS =>', data);
    } catch (error) {
      console.error('Error fetching reservations:', error?.response?.data || error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  const handleCancel = async (res) => {
    const access = getAccessToken();
    const restaurantId = getRestaurantId(res);
    const reservationId = res.id;

    if (!access) {
      Swal.fire('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
      return;
    }

    if (!restaurantId || !reservationId) {
      Swal.fire('خطأ', 'بيانات الحجز أو المطعم غير مكتملة', 'error');
      console.log('BAD CANCEL DATA =>', res);
      return;
    }

    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن إلغاء هذا الحجز',
      input: 'text',
      inputPlaceholder: 'سبب الإلغاء',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، ألغِ الحجز',
      cancelButtonText: 'تراجع',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(
        `${API_BASE}/restaurants/${restaurantId}/reservations/${reservationId}/cancel/`,
        {
          reason: result.value || 'تم الإلغاء من قبل المستخدم',
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      Swal.fire('تم الإلغاء!', 'تم إلغاء الحجز بنجاح', 'success');
      fetchMyReservations();
    } catch (error) {
      console.error('Cancel reservation error:', error?.response?.data || error);

      const data = error?.response?.data;
      Swal.fire(
        'خطأ',
        data?.detail || data?.message || 'فشل في إلغاء الحجز',
        'error'
      );
    }
  };

  const handleEdit = async (res) => {
    const access = getAccessToken();
    const restaurantId = getRestaurantId(res);
    const reservationId = res.id;

    if (!access) {
      Swal.fire('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
      return;
    }

    if (!restaurantId || !reservationId) {
      Swal.fire('خطأ', 'بيانات الحجز أو المطعم غير مكتملة', 'error');
      console.log('BAD EDIT DATA =>', res);
      return;
    }

    const { value } = await Swal.fire({
      title: 'تعديل الحجز',
      html: `
        <input id="swal-date" type="date" class="swal2-input" value="${normalizeDate(res.date)}">
        <input id="swal-start" type="time" class="swal2-input" value="${normalizeTime(res.start_time)}">
        <input id="swal-end" type="time" class="swal2-input" value="${normalizeTime(res.end_time)}">
        <input id="swal-party" type="number" min="1" class="swal2-input" value="${res.party_size || 1}">
        <textarea id="swal-notes" class="swal2-textarea" placeholder="ملاحظات">${res.notes || ''}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'حفظ التعديل',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const date = document.getElementById('swal-date').value;
        const start_time = document.getElementById('swal-start').value;
        const end_time = document.getElementById('swal-end').value;
        const party_size = document.getElementById('swal-party').value;
        const notes = document.getElementById('swal-notes').value;

        if (!date || !start_time || !end_time || !party_size) {
          Swal.showValidationMessage('يرجى تعبئة جميع البيانات');
          return false;
        }

        return {
          date: `${date}T00:00:00Z`,
          start_time: `${start_time}:00`,
          end_time: `${end_time}:00`,
          party_size: Number(party_size),
          notes: notes || 'updated request',
        };
      },
    });

    if (!value) return;

    try {
      await axios.put(
        `${API_BASE}/restaurants/${restaurantId}/reservations/${reservationId}`,
        value,
        {
          headers: {
            Authorization: `Bearer ${access}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      Swal.fire('تم التعديل!', 'تم تعديل الحجز بنجاح', 'success');
      fetchMyReservations();
    } catch (error) {
      console.error('Update reservation error:', error?.response?.data || error);

      const data = error?.response?.data;
      Swal.fire(
        'خطأ',
        data?.detail ||
          data?.message ||
          data?.non_field_errors?.[0] ||
          data?.date?.[0] ||
          data?.start_time?.[0] ||
          data?.end_time?.[0] ||
          'فشل تعديل الحجز',
        'error'
      );
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      confirmed: { bg: '#d4edda', color: '#155724', text: 'مؤكد' },
      pending: { bg: '#fff3cd', color: '#856404', text: 'بانتظار الموافقة' },
      cancelled: { bg: '#f8d7da', color: '#721c24', text: 'ملغي' },
      rejected: { bg: '#e2e3e5', color: '#383d41', text: 'مرفوض' },
    };

    const s = statuses[status] || statuses.pending;

    return (
      <span
        className="badge p-2 px-3 rounded-pill"
        style={{ backgroundColor: s.bg, color: s.color }}
      >
        {s.text}
      </span>
    );
  };

  const customStyles = `
    .reservation-page {
      background: #f4f7f6;
      min-height: 100vh;
      direction: rtl;
      font-family: 'Cairo', sans-serif;
      text-align: right;
    }

    .res-card {
      background: white;
      border-radius: 25px;
      transition: 0.3s;
      overflow: hidden;
      border: 1px solid #eee;
    }

    .res-img {
      width: 130px;
      height: 130px;
      object-fit: cover;
      border-radius: 20px;
      background: #f8f9fa;
    }

    .cancel-btn,
    .edit-btn {
      border: none;
      padding: 10px 18px;
      border-radius: 12px;
      transition: 0.3s;
      white-space: nowrap;
    }

    .cancel-btn {
      color: #dc3545;
      background: #fff5f5;
      border: 1px solid #ffebeb;
    }

    .cancel-btn:hover {
      background: #dc3545;
      color: white;
    }

    .edit-btn {
      color: #0d6efd;
      background: #f0f7ff;
      border: 1px solid #e1efff;
    }

    .edit-btn:hover {
      background: #0d6efd;
      color: white;
    }

    .info-pill {
      background: #f8f9fa;
      border: 1px solid #eee;
      padding: 8px 12px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-size: 14px;
      margin: 4px;
    }
  `;

  return (
    <div className="reservation-page py-5">
      <style>{customStyles}</style>

      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 className="fw-black m-0">حجوزاتي</h2>
          <div className="bg-white p-2 px-4 rounded-pill shadow-sm border">
            <small className="text-muted">إجمالي الحجوزات: </small>
            <span className="fw-bold text-warning">{reservations.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-grow text-warning" role="status"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-5 shadow-sm border">
            <FaUtensils size={50} className="text-muted mb-3" />
            <h4 className="text-secondary">لا يوجد لديك أي حجوزات حالياً</h4>
          </div>
        ) : (
          <div className="row g-4">
            {reservations.map((res) => (
              <div className="col-12" key={res.id}>
                <div className="res-card p-4 shadow-sm d-flex flex-column flex-md-row gap-4 align-items-center">
                  <img
                    src={getRestaurantImage(res)}
                    className="res-img shadow-sm"
                    alt="restaurant"
                  />

                  <div className="flex-grow-1 w-100">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <h4 className="fw-bold m-0 text-dark">
                          <FaStore className="text-warning ms-2" />
                          {getRestaurantName(res)}
                        </h4>

                        {getRestaurantAddress(res) && (
                          <p className="text-muted small mt-2 mb-0">
                            <FaMapMarkerAlt className="text-danger ms-1" />
                            {getRestaurantAddress(res)}
                          </p>
                        )}
                      </div>

                      {getStatusBadge(res.status)}
                    </div>

                    <div className="mb-2">
                      <span className="info-pill">
                        <FaCalendarCheck className="text-warning" />
                        التاريخ: {normalizeDate(res.date) || 'غير متوفر'}
                      </span>

                      <span className="info-pill">
                        <FaClock className="text-warning" />
                        الوقت: {normalizeTime(res.start_time)} - {normalizeTime(res.end_time)}
                      </span>

                      <span className="info-pill">
                        <FaUsers className="text-warning" />
                        عدد الأشخاص: {res.party_size}
                      </span>
                    </div>

                    <div className="small text-muted">
                      رقم الحجز: <span dir="ltr">{res.id}</span>
                    </div>

                    {res.notes && (
                      <div className="mt-3 p-2 rounded bg-light border-start border-warning border-3 small">
                        <FaInfoCircle className="ms-1 text-warning" />
                        {res.notes}
                      </div>
                    )}
                  </div>

                  {res.status !== 'cancelled' && res.status !== 'rejected' && (
                    <div className="d-flex flex-row flex-md-column gap-2">
                      <button
                        type="button"
                        className="edit-btn fw-bold"
                        onClick={() => handleEdit(res)}
                      >
                        <FaEdit className="ms-1" />
                        تعديل
                      </button>

                      <button
                        type="button"
                        className="cancel-btn fw-bold"
                        onClick={() => handleCancel(res)}
                      >
                        <FaTimesCircle className="ms-1" />
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}