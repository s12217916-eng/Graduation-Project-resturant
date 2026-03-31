import React from 'react';

export default function Reservation() {
    const customStyles = `
        .res-section {
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/hero1.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 80px 0;
        }
        .res-card {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(15px);
            border-radius: 30px;
            padding: 50px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 800px;
        }
        .form-control, .form-select {
            border-radius: 12px;
            padding: 12px 15px;
            border: 1px solid #ddd;
            transition: all 0.3s;
        }
        .form-control:focus, .form-select:focus {
            border-color: #fd7e14;
            box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.15);
        }
        .btn-reserve {
            background: linear-gradient(135deg, #212529 0%, #444 100%);
            border: none;
            color: white;
            font-weight: 600;
            padding: 15px;
            border-radius: 15px;
            transition: all 0.3s;
        }
        .btn-reserve:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            background: #000;
            color: white;
        }
        .res-title {
            color: #212529;
            font-weight: 800;
            position: relative;
            display: inline-block;
            margin-bottom: 30px;
        }
        .res-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 4px;
            background: #fd7e14;
            border-radius: 2px;
        }
    `;

    return (
        <section className="res-section">
            <style>{customStyles}</style>

            <div className="res-card mx-3">
                <div className="text-center">
                    <h2 className="res-title">احجز طاولتك</h2>
                    <p className="text-muted mb-5">استمتع بتجربة طعام لا تُنسى في أرقى المطاعم</p>
                </div>

                <form className="row g-4">
                    {/* الاسم الكامل */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold small"><i className="bi bi-person me-2"></i>الاسم الكامل</label>
                        <input type="text" className="form-control" placeholder="أدخل اسمك الثلاثي" />
                    </div>

                    {/* رقم الهاتف */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold small"><i className="bi bi-telephone me-2"></i>رقم الهاتف</label>
                        <input type="tel" className="form-control" placeholder="05xxxxxxxx" />
                    </div>

                    {/* عدد الأشخاص */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold small"><i className="bi bi-people me-2"></i>عدد الأفراد</label>
                        <input type="number" min="1" className="form-control" placeholder="عدد الضيوف" />
                    </div>

                    {/* التاريخ */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold small"><i className="bi bi-calendar-event me-2"></i>التاريخ</label>
                        <input type="date" className="form-control" />
                    </div>

                    {/* الوقت */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold small"><i className="bi bi-clock me-2"></i>الوقت</label>
                        <input type="time" className="form-control" />
                    </div>

                    {/* المناسبة */}
                    <div className="col-md-12">
                        <label className="form-label fw-bold small"><i className="bi bi-stars me-2"></i>المناسبة (اختياري)</label>
                        <select className="form-select">
                            <option value="">اختر المناسبة</option>
                            <option value="birthday">عيد ميلاد 🎂</option>
                            <option value="anniversary">ذكرى سنوية 💍</option>
                            <option value="business">عمل 💼</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>

                    {/* ملاحظات */}
                    <div className="col-md-12">
                        <label className="form-label fw-bold small"><i className="bi bi-chat-left-text me-2"></i>ملاحظات خاصة</label>
                        <textarea className="form-control" rows="3" placeholder="هل لديك أي طلبات خاصة؟ (مثلاً: طاولة بجانب النافذة)"></textarea>
                    </div>

                    {/* زر الحجز */}
                    <div className="col-md-12 mt-5">
                        <button className="btn btn-reserve w-100 shadow-sm" type="button">
                            تأكيد الحجز الآن
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}