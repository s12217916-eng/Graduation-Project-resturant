import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaCalendarCheck,
  FaClock,
  FaUsers,
  FaTimesCircle,
  FaEdit,
  FaUtensils,
  FaInfoCircle,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function MyReservation() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReservations = async () => {
    const access = localStorage.getItem('access');

    if (!access) {
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        'https://revvo-server.onrender.com/api/reservations',
        {
          headers: {
            Authorization: `Bearer ${access}`,
            Accept: 'application/json',
          },
        }
      );

      setReservations(response.data.results || response.data || []);
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

  const handleCancel = (restaurantId, reservationId) => {
    const access = localStorage.getItem('access');

    if (!access) {
      Swal.fire('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن إلغاء هذا الحجز!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، ألغِ الحجز',
      cancelButtonText: 'تراجع',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(
            `https://revvo-server.onrender.com/api/restaurants/${restaurantId}/reservations/${reservationId}/cancel/`,
            {
              reason: 'تم الإلغاء من قبل المستخدم',
            },
            {
              headers: {
                Authorization: `Bearer ${access}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            }
          );

          Swal.fire('تم الإلغاء!', 'تم إلغاء حجزك بنجاح.', 'success');
          fetchMyReservations();
        } catch (error) {
          console.error('Cancel reservation error:', error?.response?.data || error);
          Swal.fire(
            'خطأ',
            error?.response?.data?.detail || 'فشل في إلغاء الحجز، حاول لاحقاً.',
            'error'
          );
        }
      }
    });
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
      border: none;
      transition: 0.3s;
      overflow: hidden;
    }

    .res-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.08);
    }

    .res-img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 20px;
    }

    .cancel-btn {
      color: #dc3545;
      background: #fff5f5;
      border: 1px solid #ffebeb;
      padding: 10px 20px;
      border-radius: 12px;
      transition: 0.3s;
    }

    .cancel-btn:hover {
      background: #dc3545;
      color: white;
    }

    .edit-btn {
      color: #0d6efd;
      background: #f0f7ff;
      border: 1px solid #e1efff;
      padding: 10px 20px;
      border-radius: 12px;
      transition: 0.3s;
    }

    .edit-btn:hover {
      background: #0d6efd;
      color: white;
    }
  `;

  return (
    <div className="reservation-page py-5">
      <style>{customStyles}</style>

      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 className="fw-black m-0">حجوزاتي القادمة</h2>
          <div className="bg-white p-2 px-4 rounded-pill shadow-sm border">
            <small className="text-muted">إجمالي الحجوزات: </small>
            <span className="fw-bold text-orange">{reservations.length}</span>
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
            <button
              className="btn btn-warning mt-3 rounded-pill px-4 fw-bold"
              onClick={() => (window.location.href = '/')}
            >
              اكتشف المطاعم
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {reservations.map((res) => (
              <div className="col-12" key={res.id}>
                <div className="res-card p-4 shadow-sm d-flex flex-column flex-md-row gap-4 align-items-center">
                  <img
                    src={res.restaurant_image || 'https://via.placeholder.com/150'}
                    className="res-img shadow-sm"
                    alt="restaurant"
                  />

                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="fw-bold m-0 text-dark">
                        {res.restaurant_name || 'اسم المطعم'}
                      </h4>
                      {getStatusBadge(res.status)}
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-auto">
                        <div className="d-flex align-items-center gap-2 text-secondary small">
                          <FaCalendarCheck className="text-orange" /> {res.date}
                        </div>
                      </div>

                      <div className="col-auto">
                        <div className="d-flex align-items-center gap-2 text-secondary small">
                          <FaClock className="text-orange" /> {res.start_time} - {res.end_time}
                        </div>
                      </div>

                      <div className="col-auto">
                        <div className="d-flex align-items-center gap-2 text-secondary small">
                          <FaUsers className="text-orange" /> لعدد {res.party_size} أشخاص
                        </div>
                      </div>
                    </div>

                    {res.notes && (
                      <div className="mt-2 p-2 rounded bg-light border-start border-warning border-3 small">
                        <FaInfoCircle className="ms-1" /> {res.notes}
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-row flex-md-column gap-2">
                    {res.status !== 'cancelled' && (
                      <>
                        <button
                          className="edit-btn fw-bold"
                          onClick={() => console.log('Edit logic later')}
                        >
                          <FaEdit className="ms-1" /> تعديل
                        </button>

                        <button
                          className="cancel-btn fw-bold"
                          onClick={() => handleCancel(res.restaurant, res.id)}
                        >
                          <FaTimesCircle className="ms-1" /> إلغاء الحجز
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}