import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaMapMarkerAlt, FaStar, FaUtensils, FaArrowLeft, FaClock, FaPhone, FaCalendarCheck, FaCompass, FaInfoCircle } from 'react-icons/fa';

export default function ResturantDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('menu'); // التبويب الافتراضي

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [workingDays, setWorkingDays] = useState([]);
    const [subImages, setSubImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const baseUrl = `https://revvo-server.onrender.com/api/restaurants/${id}`;
        Promise.all([
            axios.get(`${baseUrl}`),
            axios.get(`${baseUrl}/menu/`),
            axios.get(`${baseUrl}/reviews/`),
            axios.get(`${baseUrl}/days/`),
            axios.get(`${baseUrl}/images/`)
        ]).then(([resDetails, resMenu, resReviews, resDays, resImages]) => {
            setRestaurant(resDetails.data);
            setMenu(resMenu.data || []);
            setReviews(resReviews.data.results || []);
            setWorkingDays(resDays.data || []);
            setSubImages(resImages.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    // دالة فتح الخريطة
    const openInMaps = () => {
        const url = `https://www.google.com/maps?q=${restaurant.lat},${restaurant.lon}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="text-center py-5">جاري التحميل...</div>;
    if (!restaurant) return <div className="text-center py-5">المطعم غير موجود!</div>;

    const customStyles = `
        .nav-tabs-custom { border: none; display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #eee; }
        .nav-link-custom { border: none; padding: 10px 25px; color: #666; font-weight: bold; cursor: pointer; position: relative; }
        .nav-link-custom.active { color: #fd7e14; border-bottom: 3px solid #fd7e14; }
        .info-box { cursor: pointer; transition: 0.3s; }
        .info-box:hover { transform: translateY(-5px); background: #fff8f0 !important; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1-fr)); gap: 20px; }
    `;

    return (
        <div className="details-page text-end" dir="rtl">
            <style>{customStyles}</style>
            
            {/* Header / Hero */}
            <div style={{height: '350px', background: `url(${restaurant.image}) center/cover`, position: 'relative'}}>
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'}}></div>
                <div className="container h-100 d-flex align-items-end pb-4">
                    <div className="text-white">
                        <h1 className="display-4 fw-bold">{restaurant.name}</h1>
                        <p><FaMapMarkerAlt className="ms-2 text-danger"/>{restaurant.address}</p>
                    </div>
                </div>
            </div>

            <div className="container mt-4" style={{marginTop: '-50px'}}>
                <div className="row g-4">
                    {/* الجانب الأيمن: المحتوى المتغير */}
                    <div className="col-lg-8">
                        <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                            {/* التبويبات */}
                            <div className="nav-tabs-custom">
                                <div className={`nav-link-custom ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>قائمة الطعام</div>
                                <div className={`nav-link-custom ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>عن المطعم</div>
                                <div className={`nav-link-custom ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>التقييمات ({reviews.length})</div>
                            </div>

                            {/* محتوى التبويبات */}
                            {activeTab === 'menu' && (
                                <div className="row g-3">
                                    {menu.map(item => (
                                        <div className="col-md-6" key={item.id}>
                                            <div className="p-3 border rounded-3 d-flex gap-3 align-items-center">
                                                <img src={item.image} style={{width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover'}} />
                                                <div className="flex-grow-1">
                                                    <h6 className="fw-bold mb-0">{item.name}</h6>
                                                    <small className="text-muted d-block mb-1 text-truncate" style={{maxWidth: '150px'}}>{item.ingredients}</small>
                                                    <span className="text-orange fw-bold">{item.price} JOD</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="p-3">
                                    <h5 className="fw-bold mb-3 text-orange">قصتنا</h5>
                                    <p className="lh-lg text-secondary">{restaurant.about}</p>
                                    <hr/>
                                    <div className="row text-center mt-4">
                                        <div className="col-4 border-start" onClick={openInMaps} style={{cursor: 'pointer'}}>
                                            <FaCompass size={30} className="text-warning mb-2"/>
                                            <h6>الموقع</h6>
                                            <small className="text-primary">افتح الخريطة</small>
                                        </div>
                                        <div className="col-4 border-start">
                                            <FaPhone size={30} className="text-warning mb-2"/>
                                            <h6>اتصل بنا</h6>
                                            <small>{restaurant.phone_number}</small>
                                        </div>
                                        <div className="col-4">
                                            <FaInfoCircle size={30} className="text-warning mb-2"/>
                                            <h6>التصنيف</h6>
                                            <small>{restaurant.category}</small>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    {reviews.map(rev => (
                                        <div key={rev.id} className="border-bottom py-3">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <img src={rev.user.image} className="rounded-circle" width="40" height="40" />
                                                <span className="fw-bold">{rev.user.first_name}</span>
                                            </div>
                                            <p className="small mb-1">{rev.comment}</p>
                                            <div className="text-warning small">
                                                {[...Array(5)].map((_, i) => <FaStar key={i} color={i < rev.overall_rate ? '#ffc107' : '#eee'} />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* الجانب الأيسر: الدوام والزر */}
                    <div className="col-lg-4">
                        <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                            <button className="btn btn-warning w-100 py-3 rounded-pill fw-bold mb-4 shadow-sm" onClick={() => navigate(`/reservation/${id}`)}>
                                <FaCalendarCheck className="ms-2"/> احجز طاولتك الآن
                            </button>

                            <h6 className="fw-bold mb-3 border-bottom pb-2">أوقات الدوام</h6>
                            {workingDays.map((day, idx) => (
                                <div className="d-flex justify-content-between small py-1" key={idx}>
                                    <span className="fw-bold">{day.day}</span>
                                    <span className="text-muted">{day.is_closed ? 'مغلق' : `${day.start_time} - ${day.end_time}`}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-4 shadow-sm">
                            <h6 className="fw-bold mb-3">صور من المكان</h6>
                            <div className="row g-2">
                                {subImages.slice(0, 4).map(img => (
                                    <div className="col-6" key={img.id}>
                                        <img src={img.image} className="w-100 rounded-3" style={{height: '80px', objectFit: 'cover'}} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}