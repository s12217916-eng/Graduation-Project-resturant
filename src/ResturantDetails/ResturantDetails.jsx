import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaMapMarkerAlt, FaGlobe, FaStar, FaUtensils, FaArrowLeft } from 'react-icons/fa';

export default function ResturantDetails() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`https://revvo-server.onrender.com/api/restaurants/${id}`)
            .then(res => {
                setRestaurant(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("خطأ في جلب التفاصيل:", err);
                setLoading(false);
            });
        window.scrollTo(0, 0);
    }, [id]);

    const customStyles = `
        .details-container {
            background: #fff;
            min-height: 100vh;
            padding-top: 100px;
        }
        .restaurant-img-container {
            position: relative;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .restaurant-img {
            width: 100%;
            height: 550px;
            object-fit: cover;
            transition: 0.5s;
        }
        .info-card {
            background: #f8f9fa;
            border-radius: 20px;
            padding: 30px;
            border: 1px solid #eee;
        }
        .badge-category {
            background: rgba(253, 126, 20, 0.1);
            color: #fd7e14;
            padding: 5px 15px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-action {
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: bold;
            transition: 0.3s;
        }
        .btn-reserve {
            background: #fd7e14;
            color: white;
            border: none;
        }
        .btn-reserve:hover {
            background: #e66d0d;
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(253, 126, 20, 0.2);
        }
    `;

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-warning" style={{width: '3rem', height: '3rem'}}></div>
        </div>
    );

    if (!restaurant) return <div className="text-center py-5">المطعم غير موجود!</div>;

    return (
        <div className="details-container">
            <style>{customStyles}</style>
            <div className="container pb-5">
                
                {/* زر الرجوع */}
                <button className="btn btn-light rounded-pill mb-4 px-4 shadow-sm border" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" /> رجوع للمطاعم
                </button>

                <div className="row g-5">
                    {/* الجانب الأيسر: الصورة */}
                    <div className="col-lg-6">
                        <div className="restaurant-img-container">
                            <img src={restaurant.image} className="restaurant-img" alt={restaurant.name} />
                        </div>
                    </div>

                    {/* الجانب الأيمن: التفاصيل */}
                    <div className="col-lg-6 text-end">
                        <span className="badge-category mb-3 d-inline-block">مطعم فاخر</span>
                        <h1 className="display-4 fw-bold mb-3" style={{ color: '#222' }}>{restaurant.name}</h1>
                        
                        <div className="d-flex justify-content-end align-items-center gap-3 mb-4">
                            <span className="text-muted"><FaMapMarkerAlt className="text-danger ms-1" /> {restaurant.address}</span>
                            <div className="vr mx-2"></div>
                            <span className="text-warning"><FaStar className="ms-1" /> 4.8 (تقييمات الزوار)</span>
                        </div>

                        <div className="info-card mb-4">
                            <h4 className="fw-bold mb-3 d-flex align-items-center justify-content-end">
                                عن المطعم <FaUtensils className="ms-2 text-warning" />
                            </h4>
                            <p className="text-secondary lh-lg" style={{ fontSize: '17px' }}>
                                {restaurant.about}
                            </p>
                        </div>

                        {/* أزرار الأكشن */}
                        <div className="d-flex justify-content-end gap-3 mt-5 flex-wrap">
                            <button className="btn btn-action btn-outline-dark" onClick={() => navigate('/RatingForm')}>
                                <FaStar className="me-2" /> تقييم تجربتك
                            </button>
                            
                            <a href={restaurant.website} target="_blank" rel="noreferrer" className="btn btn-action btn-light border shadow-sm">
                                <FaGlobe className="me-2" /> الموقع الإلكتروني
                            </a>

                            <button className="btn btn-action btn-reserve shadow" onClick={() => navigate('/reservation')}>
                                احجز طاولتك الآن
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}