import React from 'react';

export default function ContactUs() {
    const customStyles = `
        .contact-section {
            background: linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('/Hero.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 80px 0;
        }
        .contact-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 25px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: none;
        }
        .info-side {
            background: linear-gradient(135deg, #212529 0%, #444 100%);
            color: white;
            padding: 40px;
        }
        .form-side {
            padding: 40px;
        }
        .contact-input {
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #eee;
            background-color: #f8f9fa;
            transition: all 0.3s;
        }
        .contact-input:focus {
            border-color: #fd7e14;
            box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.1);
            background-color: #fff;
        }
        .btn-send {
            background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
            border: none;
            color: white;
            font-weight: bold;
            padding: 12px;
            border-radius: 50px;
            transition: 0.3s;
        }
        .btn-send:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(253, 126, 20, 0.3);
            color: white;
        }
        .contact-icon {
            width: 40px;
            height: 40px;
            background: rgba(253, 126, 20, 0.2);
            color: #fd7e14;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
        }
    `;

    return (
        <section className="contact-section">
            <style>{customStyles}</style>
            <div className="container">
                <div className="contact-card mx-auto">
                    <div className="row g-0">
                        
                        {/* جهة المعلومات (اليسار/اليمين حسب اتجاه الموقع) */}
                        <div className="col-lg-5 info-side d-flex flex-column justify-content-center">
                            <h2 className="fw-bold mb-4">تواصل معنا</h2>
                            <p className="text-white-50 mb-5">نحن هنا للإجابة على استفساراتك ومساعدتك في الحصول على أفضل تجربة طعام.</p>
                            
                            <div className="d-flex align-items-center mb-4">
                                <div className="contact-icon me-3"><i className="bi bi-geo-alt-fill"></i></div>
                                <div>
                                    <h6 className="mb-0 fw-bold">العنوان</h6>
                                    <small className="text-white-50">نابلس، فلسطين</small>
                                </div>
                            </div>

                            <div className="d-flex align-items-center mb-4">
                                <div className="contact-icon me-3"><i className="bi bi-telephone-fill"></i></div>
                                <div>
                                    <h6 className="mb-0 fw-bold">اتصل بنا</h6>
                                    <small className="text-white-50">+970 59 000 0000</small>
                                </div>
                            </div>

                            <div className="d-flex align-items-center mb-4">
                                <div className="contact-icon me-3"><i className="bi bi-envelope-fill"></i></div>
                                <div>
                                    <h6 className="mb-0 fw-bold">البريد الإلكتروني</h6>
                                    <small className="text-white-50">support@dineadvisor.com</small>
                                </div>
                            </div>

                            <div className="mt-5">
                                <h6 className="mb-3">تابعنا على</h6>
                                <div className="d-flex gap-3">
                                    <a href="#" className="text-white fs-5"><i className="bi bi-facebook"></i></a>
                                    <a href="#" className="text-white fs-5"><i className="bi bi-instagram"></i></a>
                                    <a href="#" className="text-white fs-5"><i className="bi bi-twitter-x"></i></a>
                                </div>
                            </div>
                        </div>

                        {/* جهة الفورم (اليمين) */}
                        <div className="col-lg-7 form-side bg-white">
                            <h4 className="fw-bold mb-4 text-dark">أرسل لنا رسالة</h4>
                            <form>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">الاسم الكامل</label>
                                    <input type="text" className="form-control contact-input" placeholder="أدخل اسمك هنا" />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">البريد الإلكتروني</label>
                                    <input type="email" className="form-control contact-input" placeholder="example@mail.com" />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-bold">رسالتك</label>
                                    <textarea className="form-control contact-input" rows="5" placeholder="كيف يمكننا مساعدتك؟"></textarea>
                                </div>

                                <button className="btn btn-send w-100 shadow-sm" type="button">
                                    إرسال الرسالة
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}