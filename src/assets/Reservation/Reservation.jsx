import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE = 'https://revvo-server.onrender.com/api';

export default function Reservation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: '',
    party_size: 3,
    start_time: '',
    end_time: '',
    notes: '',
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    console.log('AVAILABILITY RAW RESPONSE =>', data);

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
      return normalizeTime(
        slot.start_time ||
          slot.startTime ||
          slot.start ||
          slot.from ||
          slot.time ||
          slot.value ||
          ''
      );
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
      return normalizeTime(
        slot.end_time ||
          slot.endTime ||
          slot.end ||
          slot.to ||
          ''
      );
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
    setFormData((prev) => ({
      ...prev,
      start_time: '',
      end_time: '',
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/restaurants/${id}/reservations/availability`,
        {
          params: {
            date: cleanDate,
            party_size: String(partySizeValue || 1),
          },
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const slots = extractSlots(res.data);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Availability error:', error?.response?.data || error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchAvailability(formData.date, formData.party_size);
  }, [formData.date, formData.party_size, id]);

  const handleDateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      date: forceEnglishDigits(value),
      start_time: '',
      end_time: '',
    }));
  };

  const handlePartySizeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      party_size: value,
      start_time: '',
      end_time: '',
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

    setFormData((prev) => ({
      ...prev,
      start_time: start,
      end_time: end,
    }));
  };

  const handleReserve = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access');

    if (!accessToken) {
      Swal.fire('تنبيه', 'يجب تسجيل الدخول أولاً', 'warning');
      navigate('/login');
      return;
    }

    if (!formData.date) {
      Swal.fire('تنبيه', 'اختر تاريخ الحجز', 'warning');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      Swal.fire('تنبيه', 'اختر وقتًا من الأوقات المتاحة', 'warning');
      return;
    }

    const payload = {
      date: forceEnglishDigits(formData.date),
      start_time: normalizeTime(formData.start_time),
      end_time: normalizeTime(formData.end_time),
      party_size: String(formData.party_size),
      notes: formData.notes?.trim() || 'test',
    };

    console.log('RESERVATION PAYLOAD =>', payload);

    setSubmitting(true);

    try {
      await axios.post(
        `${API_BASE}/restaurants/${id}/reservations/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      const msg =
        data?.detail ||
        data?.message ||
        data?.non_field_errors?.[0] ||
        data?.start_time?.[0] ||
        data?.end_time?.[0] ||
        data?.date?.[0] ||
        data?.party_size?.[0] ||
        'فشل في إنشاء الحجز';

      Swal.fire('فشل الحجز', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="container py-5"
      style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}
    >
      <div className="card shadow-lg p-4 border-0 rounded-4 bg-white">
        <h2 className="text-center mb-4 fw-bold text-dark border-bottom pb-3">
          حجز طاولة جديدة
        </h2>

        <form onSubmit={handleReserve}>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="fw-bold mb-2">تاريخ الحجز</label>
             <div dir="ltr">
 <input
  type="date"
  className="form-control date-input-fixed"
  value={formData.date}
  onChange={(e) => handleDateChange(e.target.value)}
  required
  data-placeholder="اختر تاريخ الحجز"
/>
</div>
            </div>

            <div className="col-md-6">
              <label className="fw-bold mb-2">عدد الضيوف</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.party_size}
                onChange={(e) => handlePartySizeChange(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="fw-bold mb-2">الأوقات المتاحة</label>

              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex flex-wrap gap-2">
                  {loadingSlots ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className="spinner-border text-warning spinner-border-sm" />
                      <span className="text-muted small">جاري تحميل الأوقات...</span>
                    </div>
                  ) : !formData.date ? (
                    <p className="text-muted small m-0">
                      اختر تاريخًا لعرض الأوقات المتاحة
                    </p>
                  ) : availableSlots.length > 0 ? (
                    availableSlots.map((slot, index) => {
                      const label = getSlotLabel(slot);
                      const start = parseSlotStart(slot);
                      const isSelected = formData.start_time === start;

                      return (
                        <button
                          key={`${label}-${index}`}
                          type="button"
                          className={`btn btn-sm ${
                            isSelected ? 'btn-warning shadow' : 'btn-outline-dark'
                          }`}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {label}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-danger small m-0">
                      لا توجد أوقات متاحة لهذا التاريخ أو عدد الضيوف
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12">
              <label className="fw-bold mb-2">ملاحظات</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="أضف ملاحظة للحجز"
              />
            </div>
          </div>

          <div className="alert alert-info mt-4 text-center py-2">
            ملخص: الحجز لـ {formData.party_size} أشخاص بتاريخ {formData.date || '---'}{' '}
            {formData.start_time && formData.end_time
              ? `من ${formData.start_time} إلى ${formData.end_time}`
              : '— اختر وقتًا من الأوقات المتاحة'}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-warning w-100 py-3 mt-2 fw-bold fs-5 shadow-sm"
          >
            {submitting ? 'جاري تأكيد الحجز...' : 'تأكيد الحجز الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}