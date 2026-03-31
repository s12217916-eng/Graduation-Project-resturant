import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { Link } from 'react-router-dom';

export default function Footer() {
    const customStyles = `
        .main-footer {
            background-color: #0f0f0f; /* أسود أعمق للفخامة */
            color: #bbb;
            font-size: 14px;
        }
        .footer-brand {
            color: #fff;
            font-weight: 800;
            letter-spacing: 1px;
        }
        .footer-link {
            color: #bbb;
            transition: all 0.3s;
            display: inline-block;
            margin-bottom: 8px;
        }
        .footer-link:hover {
            color: #fd7e14; /* لون البراند عند الهوفر */
            transform: translateX(5px);
        }
        .social-circle {
            width: 38px;
            height: 38px;
            background: #222;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #fff;
            transition: all 0.3s;
            text-decoration: none;
        }
        .social-circle:hover {
            background: #fd7e14;
            color: #fff;
            transform: translateY(-3px);
        }
        .footer-bottom {
            background: #000;
            padding: 20px 0;
            border-top: 1px solid #222;
        }
        .newsletter-input {
            background: #1a1a1a;
            border: 1px solid #333;
            color: white;
            border-radius: 50px 0 0 50px;
            padding: 10px 20px;
        }
        .newsletter-input:focus {
            background: #222;
            color: white;
            border-color: #fd7e14;
            box-shadow: none;
        }
        .newsletter-btn {
            background: #fd7e14;
            border: none;
            color: white;
            border-radius: 0 50px 50px 0;
            padding: 0 20px;
            transition: 0.3s;
        }
        .newsletter-btn:hover {
            background: #ff4d4d;
        }
    `;

    return (
        <footer className="main-footer mt-5 pt-5">
            <style>{customStyles}</style>
            <div className="container pb-5">
                <div className="row g-4">

                    {/* معلومات البراند */}
                    <div className="col-lg-4 col-md-6 mb-4">
                        <h3 className="footer-brand mb-4 text-warning">DINE ADVISOR</h3>
                        <p className="lh-lg">
                            دليلك الأول لاستكشاف وتقييم وحجز أفضل المطاعم. نحن نجمع لك الجودة، السعر، والخدمة في مكان واحد لتجربة طعام استثنائية.
                        </p>
                        <div className="d-flex gap-2 mt-4">
                            <a href="#" className="social-circle"><FaFacebookF /></a>
                            <a href="#" className="social-circle"><FaInstagram /></a>
                            <a href="#" className="social-circle"><FaTwitter /></a>
                            <a href="#" className="social-circle"><FaLinkedinIn /></a>
                        </div>
                    </div>

                    {/* روابط سريعة */}
                    <div className="col-lg-2 col-md-6 mb-4">
                        <h5 className="text-white fw-bold mb-4">روابط سريعة</h5>
                        <ul className="list-unstyled">
                            <li><Link to="/" className="footer-link text-decoration-none">الرئيسية</Link></li>
                            <li><Link to="/resturant" className="footer-link text-decoration-none">المطاعم</Link></li>
                            <li><Link to="/reservation" className="footer-link text-decoration-none">الحجوزات</Link></li>
                            <li><Link to="/about" className="footer-link text-decoration-none">عن الموقع</Link></li>
                        </ul>
                    </div>

                    {/* تواصل معنا */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <h5 className="text-white fw-bold mb-4">تواصل معنا</h5>
                        <p className="mb-2"><i className="bi bi-geo-alt text-warning me-2"></i>نابلس، فلسطين</p>
                        <p className="mb-2"><i className="bi bi-telephone text-warning me-2"></i>+972 59 845 1366</p>
                        <p className="mb-2"><i className="bi bi-envelope text-warning me-2"></i>info@DineAdvisor.com</p>
                    </div>

                    {/* القائمة البريدية (Newsletter) */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <h5 className="text-white fw-bold mb-4">اشترك معنا</h5>
                        <p className="small mb-3">صلك أحدث المطاعم والعروض الحصرية مباشرة على بريدك.</p>
                        <div className="input-group">
                            <input type="email" className="form-control newsletter-input" placeholder="بريدك الإلكتروني" />
                            <button className="btn newsletter-btn" type="button">اشترك</button>
                        </div>
                    </div>

                </div>
            </div>

            {/* الحقوق السفلية */}
            <div className="footer-bottom text-center">
                <div className="container">
                    <p className="mb-0 text-white-50 small">
                        © 2026 <span className="text-warning fw-bold">DINE ADVISOR</span>. جميع الحقوق محفوظة. تم التطوير بكل شغف 🍕
                    </p>
                </div>
            </div>
        </footer>
    );
}