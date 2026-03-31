import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/effect-fade';

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/resturant?search=${encodeURIComponent(searchQuery)}`);
            window.scrollTo(0, 0);
        }
    };

    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .hero {
            position: relative;
            height: 100vh;
            width: 100%;
            background: #000;
        }

        .hero-img {
            width: 100%;
            height: 100vh;
            object-fit: cover;
            filter: brightness(0.5);
            transition: transform 8s ease;
        }

        .swiper-slide-active .hero-img {
            transform: scale(1.1);
        }

        .hero-overlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%),
                        linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%);
            z-index: 2;
        }

        .hero-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            width: 100%;
            max-width: 900px;
            text-align: center;
            padding: 0 20px;
        }

        .hero-badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(253, 126, 20, 0.15);
            border: 1px solid #fd7e14;
            color: #fd7e14;
            border-radius: 100px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 25px;
            animation: fadeInUp 0.8s ease forwards;
        }

        .hero-title {
            font-size: clamp(3rem, 8vw, 5.5rem);
            font-weight: 900;
            color: #fff;
            line-height: 1.1;
            margin-bottom: 15px;
            animation: fadeInUp 0.8s ease 0.2s forwards;
            opacity: 0;
        }

        .hero-subtitle {
            font-size: 1.25rem;
            color: rgba(255,255,255,0.7);
            margin-bottom: 45px;
            animation: fadeInUp 0.8s ease 0.4s forwards;
            opacity: 0;
        }

        /* تنسيق السيرش ليطابق صفحة المطاعم وفخامة الهيرو */
        .search-box-container {
            max-width: 650px;
            margin: 0 auto;
            animation: fadeInUp 0.8s ease 0.6s forwards;
            opacity: 0;
        }

        .hero-search-wrapper {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 8px;
            border-radius: 100px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
        }

        .hero-search-wrapper:focus-within {
            border-color: #fd7e14;
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .hero-input {
            flex: 1;
            background: transparent;
            border: none;
            color: #fff;
            padding: 12px 25px;
            font-size: 17px;
            outline: none;
        }

        .hero-input::placeholder {
            color: rgba(255,255,255,0.4);
        }

        .hero-search-btn {
            background: #fd7e14;
            color: #fff;
            border: none;
            padding: 12px 35px;
            border-radius: 100px;
            font-weight: 700;
            cursor: pointer;
            transition: 0.3s;
        }

        .hero-search-btn:hover {
            background: #ff8c2d;
            box-shadow: 0 0 20px rgba(253, 126, 20, 0.4);
        }

        .hero-footer-btns {
            margin-top: 30px;
            animation: fadeInUp 0.8s ease 0.8s forwards;
            opacity: 0;
            display: flex;
            justify-content: center;
            gap: 20px;
        }

        .secondary-btn {
            background: transparent;
            color: #fff;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 12px 30px;
            border-radius: 100px;
            text-decoration: none;
            font-weight: 600;
            transition: 0.3s;
        }

        .secondary-btn:hover {
            background: #fff;
            color: #000;
            border-color: #fff;
        }
    `;

    return (
        <section className="hero">
            <style>{customStyles}</style>
            
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                loop={true}
                className="hero-swiper"
            >
                <SwiperSlide><img src="/Hero.jpg" alt="Dining Experience" className="hero-img" /></SwiperSlide>
                <SwiperSlide><img src="/hero2.jpg" alt="Fine Cuisine" className="hero-img" /></SwiperSlide>
                <SwiperSlide><img src="/hero1.jpg" alt="Atmosphere" className="hero-img" /></SwiperSlide>
            </Swiper>

            <div className="hero-overlay"></div>

            <div className="hero-content">
                <span className="hero-badge">The Ultimate Food Guide</span>
                <h1 className="hero-title">DINE ADVISOR</h1>
                <p className="hero-subtitle">استكشف واحجز طاولتك في أفضل مطاعم المدينة</p>

                <div className="search-box-container">
                    <form className="hero-search-wrapper" onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="hero-input"
                            placeholder="ابحث عن مطعم، أكلة، أو منطقة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="hero-search-btn">
                            إبحث الآن
                        </button>
                    </form>
                </div>

                <div className="hero-footer-btns">
                    <button 
                        className="secondary-btn" 
                        onClick={() => { navigate('/resturant'); window.scrollTo(0, 0); }}
                    >
                        تصفح الكل
                    </button>
                </div>
            </div>
        </section>
    );
}