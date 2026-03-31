import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();

    const customStyles = `
        .reg-section {
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/hero2.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 50px 0;
        }
        .reg-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 25px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            width: 100%;
            max-width: 700px;
        }
        .form-control {
            border-radius: 10px;
            padding: 12px;
            border: 1px solid #eee;
            background-color: #f8f9fa;
        }
        .form-control:focus {
            border-color: #fd7e14;
            box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.15);
            background-color: #fff;
        }
        .btn-reg {
            background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
            border: none;
            color: white;
            font-weight: bold;
            padding: 14px;
            border-radius: 50px;
            transition: all 0.3s;
        }
        .btn-reg:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(253, 126, 20, 0.3);
            color: white;
        }
        .reg-header h2 {
            font-weight: 800;
            color: #212529;
        }
    `;

    return (
        <section className="reg-section">
            <style>{customStyles}</style>

            <div className="reg-card mx-3">
                <div className="reg-header text-center mb-4">
                    <h2>إنشاء حساب جديد</h2>
                    <p className="text-muted">انضم إلى مجتمع Dine Advisor واستمتع بأفضل العروض</p>
                </div>

                <form className="row g-3">
                    {/* الاسم الأول والأخير بجانب بعض */}
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">الاسم الأول</label>
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0 rounded-start-3"><i className="bi bi-person text-muted"></i></span>
                            <input type="text" className="form-control border-start-0" placeholder="John" />
                        </div>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-bold">الاسم الأخير</label>
                        <input type="text" className="form-control" placeholder="Doe" />
                    </div>

                    {/* الإيميل */}
                    <div className="col-md-12">
                        <label className="form-label small fw-bold">البريد الإلكتروني</label>
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                            <input type="email" className="form-control border-start-0" placeholder="name@example.com" />
                        </div>
                    </div>

                    {/* الهاتف والموقع بجانب بعض */}
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">رقم الهاتف</label>
                        <input type="tel" className="form-control" placeholder="05xxxxxxxx" />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-bold">الموقع</label>
                        <input type="text" className="form-control" placeholder="رام الله، فلسطين" />
                    </div>

                    {/* كلمة المرور */}
                    <div className="col-md-12">
                        <label className="form-label small fw-bold">كلمة المرور</label>
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-lock text-muted"></i></span>
                            <input type="password" className="form-control border-start-0" placeholder="••••••••" />
                        </div>
                    </div>

                    {/* زر التسجيل */}
                    <div className="col-md-12 mt-4">
                        <button className="btn btn-reg w-100 shadow-sm" type="button">
                            إنشاء الحساب
                        </button>
                    </div>

                    <div className="text-center mt-3">
                        <p className="small">لديك حساب بالفعل؟ 
                            <button 
                                type="button" 
                                className="btn btn-link text-warning fw-bold p-0 ms-1 text-decoration-none"
                                onClick={() => navigate('/login')}
                            >
                                تسجيل الدخول
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
}