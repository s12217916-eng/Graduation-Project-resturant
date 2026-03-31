import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    const customStyles = `
        .login-section {
            background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/Hero.jpg');
            background-size: cover;
            background-position: center;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 450px;
        }
        .form-floating > .form-control:focus {
            border-color: #fd7e14;
            box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.25);
        }
        .btn-login {
            background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
            border: none;
            color: white;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(253, 126, 20, 0.4);
            color: white;
        }
    `;

    return (
        <section className="login-section">
            <style>{customStyles}</style>
            
            <div className="login-card mx-3">
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-dark">تسجيل الدخول</h2>
                    <p className="text-muted small">أهلاً بك مجدداً في Dine Advisor</p>
                </div>

                <form>
                    {/* حقل اسم المستخدم */}
                    <div className="form-floating mb-3">
                        <input 
                            type="text" 
                            className="form-control" 
                            id="userName" 
                            placeholder="اسم المستخدم" 
                        />
                        <label htmlFor="userName"><i className="bi bi-person me-2"></i>اسم المستخدم</label>
                    </div>

                    {/* حقل كلمة المرور */}
                    <div className="form-floating mb-3">
                        <input 
                            type="password" 
                            className="form-control" 
                            id="password" 
                            placeholder="كلمة المرور" 
                        />
                        <label htmlFor="password"><i className="bi bi-lock me-2"></i>كلمة المرور</label>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="remember" />
                            <label className="form-check-label small" htmlFor="remember">تذكرني</label>
                        </div>
                        <a href="#" className="text-decoration-none small text-warning">نسيت كلمة المرور؟</a>
                    </div>

                    <button className="btn btn-login w-100 py-3 rounded-pill mb-3">
                        دخول
                    </button>

                    <div className="text-center mt-3">
                        <p className="small mb-0">ليس لديك حساب؟ 
                            <button 
                                type="button" 
                                className="btn btn-link text-warning fw-bold p-0 ms-1 text-decoration-none"
                                onClick={() => navigate('/register')}
                            >
                                سجل الآن
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
}