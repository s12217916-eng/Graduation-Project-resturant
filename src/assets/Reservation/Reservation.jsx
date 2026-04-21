import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Reservation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        date: "",
        party_size: 1,
        start_time: "",
        end_time: ""
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // دالة جبارة لتحويل أي رقم عربي أو هندي إلى إنجليزي فوراً
    const forceEnglishDigits = (str) => {
        if (!str) return "";
        return String(str).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
                          .replace(/[۰-۹]/g, d => "۰۱۲۳٤٥٦۷۸۹".indexOf(d));
    };

    // جلب الأوقات المتاحة - تأكد أن التاريخ يرسل بصيغة YYYY-MM-DD إنجليزية
    useEffect(() => {
        const fetchAvailability = async () => {
            if (formData.date) {
                setLoadingSlots(true);
                const cleanDate = forceEnglishDigits(formData.date);
                console.log("Fetching for date:", cleanDate); // لمراقبة الرقم في الكونسول

                try {
                    const res = await axios.get(`https://revvo-server.onrender.com/api/restaurants/${id}/reservations/availability`, {
                        params: { 
                            date: cleanDate,
                            party_size: formData.party_size 
                        }
                    });
                    
                    const slots = res.data?.available_slots || (Array.isArray(res.data) ? res.data : []);
                    setAvailableSlots(slots);
                } catch (error) {
                    console.error("خطأ في جلب الأوقات المتاحة:", error);
                    setAvailableSlots([]);
                } finally {
                    setLoadingSlots(false);
                }
            }
        };
        fetchAvailability();
    }, [formData.date, formData.party_size, id]);

    const handleReserve = async (e) => {
        e.preventDefault();

        // تجهيز البيانات بصيغة إنجليزية 100% مع إضافة الثواني
        const payload = {
            date: forceEnglishDigits(formData.date),
            start_time: `${forceEnglishDigits(formData.start_time)}:00`,
            end_time: `${forceEnglishDigits(formData.end_time)}:00`,
            party_size: parseInt(formData.party_size),
        };

        try {
            await axios.post(`https://revvo-server.onrender.com/api/restaurants/${id}/reservations/`, payload);
            Swal.fire('تم الحجز!', 'تم تأكيد طلبك بنجاح', 'success').then(() => navigate('/myreservations'));
        } catch (error) {
            console.error("خطأ الإرسال:", error.response?.data);
            const msg = error.response?.data?.non_field_errors?.[0] || "تأكد من اختيار وقت صحيح ومتاح";
            Swal.fire('فشل الحجز', msg, 'error');
        }
    };

    return (
        <div className="container py-5" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo' }}>
            <div className="card shadow-lg p-4 border-0 rounded-4 bg-white">
                <h2 className="text-center mb-4 fw-bold text-dark border-bottom pb-3">حجز طاولة جديدة</h2>
                
                <div className="row g-4">
                    {/* التاريخ: نستخدم lang="en-US" لإجبار المتصفح على عرض أرقام إنجليزية */}
                    <div className="col-md-6">
                        <label className="fw-bold mb-2">تاريخ الحجز</label>
                        <input 
                            type="date" 
                            className="form-control text-start" 
                            lang="en-US"
                            onChange={(e) => setFormData({...formData, date: forceEnglishDigits(e.target.value)})} 
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="fw-bold mb-2">عدد الضيوف</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            value={formData.party_size}
                            onChange={(e) => setFormData({...formData, party_size: e.target.value})} 
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="fw-bold mb-2 text-primary">وقت البداية</label>
                        <input 
                            type="time" 
                            className="form-control" 
                            lang="en-US"
                            value={formData.start_time}
                            onChange={(e) => setFormData({...formData, start_time: forceEnglishDigits(e.target.value)})} 
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="fw-bold mb-2 text-danger">وقت النهاية</label>
                        <input 
                            type="time" 
                            className="form-control" 
                            lang="en-US"
                            value={formData.end_time}
                            onChange={(e) => setFormData({...formData, end_time: forceEnglishDigits(e.target.value)})} 
                        />
                    </div>
                </div>

                {/* قسم الأوقات المتاحة */}
                <div className="mt-4 p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold mb-3">الساعات المتاحة للحجز:</h6>
                    <div className="d-flex flex-wrap gap-2">
                        {loadingSlots ? (
                            <div className="spinner-border text-warning spinner-border-sm"></div>
                        ) : availableSlots.length > 0 ? (
                            availableSlots.map(slot => (
                                <button 
                                    key={slot} 
                                    type="button" 
                                    className={`btn btn-sm ${formData.start_time === slot ? 'btn-warning shadow' : 'btn-outline-dark'}`}
                                    onClick={() => setFormData({...formData, start_time: slot, end_time: slot})} // مثال: اختيار الوقت نفسه كبداية
                                >
                                    {slot}
                                </button>
                            ))
                        ) : (
                            <p className="text-muted small m-0">يرجى اختيار تاريخ صالح لرؤية المتاح</p>
                        )}
                    </div>
                </div>

                <div className="alert alert-info mt-4 text-center py-2">
                    ملخص: الحجز لـ {formData.party_size} أشخاص بتاريخ {formData.date || '---'}
                </div>

                <button className="btn btn-warning w-100 py-3 mt-2 fw-bold fs-5 shadow-sm" onClick={handleReserve}>
                    تأكيد الحجز الآن
                </button>
            </div>
        </div>
    );
}