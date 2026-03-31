import React, { useState } from 'react';

export default function RatingForm() {
  const [ratings, setRatings] = useState({
    overall: 0,
    food: 0,
    service: 0,
    ambience: 0
  });

  const [hovered, setHovered] = useState({
    overall: 0,
    food: 0,
    service: 0,
    ambience: 0
  });

  const handleRating = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const renderStars = (category, value) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        style={{
          fontSize: "28px",
          cursor: "pointer",
          transition: "0.2s",
          color: star <= (hovered[category] || value) ? "#fd7e14" : "#e0e0e0",
          filter: star <= (hovered[category] || value) ? "drop-shadow(0 0 5px rgba(253, 126, 20, 0.4))" : "none"
        }}
        onClick={() => handleRating(category, star)}
        onMouseEnter={() => setHovered(prev => ({ ...prev, [category]: star }))}
        onMouseLeave={() => setHovered(prev => ({ ...prev, [category]: 0 }))}
      >
        {star <= (hovered[category] || value) ? '★' : '☆'}
      </span>
    ));
  };

  const customStyles = `
    .rating-container {
      background: #f8f9fa;
      padding: 80px 0;
      min-height: 100vh;
    }
    .rating-card {
      background: white;
      border: none;
      border-radius: 25px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.08);
      padding: 40px;
    }
    .category-label {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
      display: block;
    }
    .form-control-custom {
      border: 2px solid #eee;
      border-radius: 12px;
      padding: 12px 15px;
      transition: 0.3s;
    }
    .form-control-custom:focus {
      border-color: #fd7e14;
      box-shadow: 0 0 0 4px rgba(253, 126, 20, 0.1);
      outline: none;
    }
    .submit-review-btn {
      background: linear-gradient(45deg, #212529, #343a40);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 50px;
      font-weight: bold;
      transition: 0.3s;
      width: 100%;
      margin-top: 20px;
    }
    .submit-review-btn:hover {
      background: #fd7e14;
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(253, 126, 20, 0.2);
    }
  `;

  return (
    <div className="rating-container">
      <style>{customStyles}</style>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="rating-card">
              <div className="text-center mb-5">
                <span className="text-warning fw-bold text-uppercase" style={{ letterSpacing: '2px' }}>شاركنا رأيك</span>
                <h2 className="fw-bold mt-2">تقييم المطعم</h2>
                <div className="mx-auto" style={{ width: '50px', height: '3px', background: '#fd7e14' }}></div>
              </div>

              <div className="row g-4">
                {/* التقييم العام */}
                <div className="col-md-6">
                  <label className="category-label">التقييم العام :</label>
                  <div className="star-wrapper">{renderStars("overall", ratings.overall)}</div>
                </div>

                {/* جودة الطعام */}
                <div className="col-md-6">
                  <label className="category-label">جودة الطعام :</label>
                  <div className="star-wrapper">{renderStars("food", ratings.food)}</div>
                </div>

                {/* الخدمة */}
                <div className="col-md-6">
                  <label className="category-label">مستوى الخدمة :</label>
                  <div className="star-wrapper">{renderStars("service", ratings.service)}</div>
                </div>

                {/* الأجواء */}
                <div className="col-md-6">
                  <label className="category-label">أجواء المكان :</label>
                  <div className="star-wrapper">{renderStars("ambience", ratings.ambience)}</div>
                </div>
              </div>

              <hr className="my-5 opacity-50" />

              {/* مدى الرضا */}
              <div className="mb-4">
                <label className="category-label mb-2">مدى رضاك الإجمالي :</label>
                <select className="form-select form-control-custom text-secondary">
                  <option value="">اختر من القائمة</option>
                  <option value="very_satisfied">راضٍ تماماً 😍</option>
                  <option value="satisfied">راضٍ 🙂</option>
                  <option value="neutral">متوسط 😐</option>
                  <option value="unsatisfied">غير راضٍ 😞</option>
                </select>
              </div>

              {/* التعليقات */}
              <div className="mb-4">
                <label className="category-label mb-2">اكتب تعليقك (اختياري) :</label>
                <textarea 
                  className="form-control-custom w-100" 
                  rows="4" 
                  placeholder="كيف كانت تجربتك؟ أخبرنا بالتفاصيل..."
                ></textarea>
              </div>

              <button className="submit-review-btn shadow-lg">
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}