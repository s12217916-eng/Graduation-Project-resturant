import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!formData.email || !formData.password) {
            setErrorMessage('يرجى تعبئة البريد الإلكتروني وكلمة المرور');
            return;
        }

        try {
            setLoading(true);
            await loginUser(formData);
            navigate('/');
        }  catch (error) {
    console.error(error);

    const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'فشل تسجيل الدخول، تأكد من البيانات';

    setErrorMessage(message);
}finally {
            setLoading(false);
        }
    };

    return (
        <section className="login-section">
            <style>{customStyles}</style>

            <div className="login-card mx-3">
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-dark">تسجيل الدخول</h2>
                    <p className="text-muted small">أهلاً بك مجدداً في Dine Advisor</p>
                </div>

                {errorMessage && (
                    <div className="alert alert-danger text-center py-2" role="alert">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="البريد الإلكتروني"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <label htmlFor="email">
                            <i className="bi bi-envelope me-2"></i>البريد الإلكتروني
                        </label>
                    </div>

                    <div className="form-floating mb-3">
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="كلمة المرور"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <label htmlFor="password">
                            <i className="bi bi-lock me-2"></i>كلمة المرور
                        </label>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="remember" />
                            <label className="form-check-label small" htmlFor="remember">تذكرني</label>
                        </div>
                        <a href="#" className="text-decoration-none small text-warning">نسيت كلمة المرور؟</a>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-login w-100 py-3 rounded-pill mb-3"
                        disabled={loading}
                    >
                        {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
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