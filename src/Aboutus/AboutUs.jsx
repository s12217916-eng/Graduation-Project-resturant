import React from 'react';
import { Target, Star, Calendar, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export default function AboutUs() {
    const customStyles = `
        .about-header {
            position: relative;
            height: 450px;
            background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('/hero1.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed; /* تأثير Parallax بسيط */
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
        }

        .feature-card {
            border: 1px solid #eee;
            border-radius: 24px;
            padding: 50px 30px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            background: #fff;
            height: 100%;
        }

        .feature-card:hover {
            transform: translateY(-12px);
            border-color: #fd7e14;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }

        .icon-box {
            width: 80px;
            height: 80px;
            background: rgba(253, 126, 20, 0.05);
            color: #fd7e14;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            transition: 0.5s;
        }

        .feature-card:hover .icon-box {
            background: #fd7e14;
            color: #fff;
            transform: rotateY(180deg);
        }

        .stat-badge {
            background: #fff;
            padding: 10px 20px;
            border-radius: 100px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
            margin-bottom: 15px;
            width: fit-content;
        }

        .accent-line {
            width: 60px;
            height: 3px;
            background: #fd7e14;
            margin: 20px auto;
        }

        .story-img-wrapper {
            position: relative;
            padding: 20px;
        }

        .story-img-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 80%;
            height: 80%;
            border: 8px solid rgba(253, 126, 20, 0.1);
            border-radius: 40px;
            z-index: 0;
        }

        .story-img {
            position: relative;
            z-index: 1;
            border-radius: 40px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
        }
    `;

    return (
        <div style={{ background: '#fff' }}>
            <style>{customStyles}</style>

            {/* Header القسم العلوي */}
            <header className="about-header">
                <div className="container">
                    <span className="text-uppercase fw-bold" style={{ letterSpacing: '4px', color: '#fd7e14' }}>
                        عالم من النكهات
                    </span>
                    <h1 className="display-2 fw-black mt-3">DINE ADVISOR</h1>
                    <div className="accent-line"></div>
                    <p className="lead opacity-75">دليلك الأول لتجارب طعام لا تُنسى</p>
                </div>
            </header>

            {/* قسم المميزات */}
            <section className="py-5 mt-5">
                <div className="container py-5">
                    <div className="text-center mb-5 pb-3">
                        <h2 className="fw-bold fs-1">رؤيتنا في التميز</h2>
                        <p className="text-muted">نحن نغير الطريقة التي تكتشف بها مطاعمك المفضلة</p>
                    </div>

                    <div className="row g-4 mt-2">
                        {/* كرت الاستكشاف */}
                        <div className="col-md-4">
                            <div className="feature-card text-center">
                                <div className="icon-box">
                                    <Target size={35} />
                                </div>
                                <h4 className="fw-bold mb-3">دقة الاختيار</h4>
                                <p className="text-secondary lh-lg">نختار المطاعم بناءً على معايير صارمة تشمل الجودة، النظافة، والخدمة الاستثنائية.</p>
                            </div>
                        </div>

                        {/* كرت التقييم */}
                        <div className="col-md-4">
                            <div className="feature-card text-center">
                                <div className="icon-box">
                                    <Star size={35} />
                                </div>
                                <h4 className="fw-bold mb-3">تقييمات حقيقية</h4>
                                <p className="text-secondary lh-lg">منصة شفافة تعتمد على تجارب المستخدمين الفعلية لضمان مصداقية كل تعليق.</p>
                            </div>
                        </div>

                        {/* كرت الحجز */}
                        <div className="col-md-4">
                            <div className="feature-card text-center">
                                <div className="icon-box">
                                    <Calendar size={35} />
                                </div>
                                <h4 className="fw-bold mb-3">حجز ذكي</h4>
                                <p className="text-secondary lh-lg">نظام حجز فوري يغنيك عن عناء الانتظار، متاح على مدار الساعة لتلبية طلباتك.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* قسم القصة */}
            <section className="py-5" style={{ background: '#fafafa' }}>
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6 order-2 order-lg-1">
                            <div className="stat-badge">
                                <ShieldCheck className="text-warning" size={20} />
                                <span className="small fw-bold">موثوق بنسبة 100%</span>
                            </div>
                            <h2 className="display-5 fw-bold mb-4">قصة شغف بدأت من <span style={{ color: '#fd7e14' }}>نابلس</span></h2>
                            <p className="text-secondary mb-4 lh-lg fs-5">
                                في Dine Advisor، لا نقدم فقط قائمة مطاعم، بل نقدم "مستشاراً شخصياً" لمذاقك. بدأنا بهدف رقمنة قطاع المطاعم في فلسطين لنصل إلى منصة عالمية تجمع عشاق الطعام.
                            </p>
                            
                            <div className="row g-3">
                                <div className="col-sm-6">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <CheckCircle2 size={18} className="text-success" />
                                        <span className="fw-medium">دعم فني 24/7</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Users size={18} className="text-success" />
                                        <span className="fw-medium">مجتمع نشط من المتذوقين</span>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <CheckCircle2 size={18} className="text-success" />
                                        <span className="fw-medium">تغطية شاملة للمدن</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <CheckCircle2 size={18} className="text-success" />
                                        <span className="fw-medium">عروض حصرية للمستخدمين</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 order-1 order-lg-2">
                            <div className="story-img-wrapper">
                                <img src="/Hero.jpg" alt="Dining experience" className="img-fluid story-img" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}