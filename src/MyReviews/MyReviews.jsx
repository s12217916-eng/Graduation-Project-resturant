import React, { useEffect, useState } from 'react';
import { getClientReviews } from '../services/authService';
import { Star, MessageSquare, Utensils, Award, Smile, Trash2 } from 'lucide-react';

export default function MyReviews() {
  const [reviewsData, setReviewsData] = useState({ results: [], count: 0, avg_food: 0, avg_service: 0, avg_ambiance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getClientReviews();
      
      // Add random restaurant names for now
      const resultsWithNames = data.results.map(review => ({
        ...review,
        restaurant_name: 'Orgada Burger'
      }));
      
      setReviewsData({ ...data, results: resultsWithNames });
    } catch (err) {
      setError('تعذر تحميل التقييمات الخاصة بك');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-warning fill-warning' : 'text-gray-300'}
        style={{ fill: index < rating ? '#ffc107' : 'none', color: index < rating ? '#ffc107' : '#e2e8f0' }}
      />
    ));
  };

  const customStyles = `
    .reviews-page {
      min-height: 100vh;
      background-color: #f8fafc;
      padding: 60px 0;
      font-family: 'Cairo', sans-serif;
      direction: rtl;
    }
    .stats-card {
      background: #fff;
      border-radius: 20px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-bottom: 30px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      text-align: center;
    }
    .stat-item {
      flex: 1;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fd7e14;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 600;
    }
    .review-card {
      background: #fff;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
      transition: 0.3s;
    }
    .review-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .review-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-info h6 {
      margin: 0;
      font-weight: 700;
      color: #1e293b;
    }
    .restaurant-name {
      font-size: 0.9rem;
      color: #fd7e14;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .review-sentiment {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 100px;
      font-weight: 700;
    }
    .sentiment-positive { background: #dcfce7; color: #166534; }
    .sentiment-negative { background: #fef2f2; color: #991b1b; }
    .sentiment-neutral { background: #f1f5f9; color: #475569; }
    
    .ratings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 15px;
    }
    .rating-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rating-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .review-comment {
      color: #475569;
      line-height: 1.6;
      font-size: 0.95rem;
      margin-bottom: 15px;
    }
    .review-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 15px;
      border-top: 1px solid #f1f5f9;
    }
    .useful-count {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 0.85rem;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
  `;

  if (loading) {
    return (
      <div className="reviews-page d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <style>{customStyles}</style>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">تقييماتي</h2>
          <div className="text-muted">إجمالي التقييمات: {reviewsData.count}</div>
        </div>

        {error && <div className="alert alert-danger text-center">{error}</div>}

        {reviewsData.count > 0 ? (
          <>
            <div className="stats-card">
              <div className="stat-item">
                <div className="stat-value">{reviewsData.avg_food}</div>
                <div className="stat-label">متوسط الطعام</div>
              </div>
              <div className="stat-item border-start border-end">
                <div className="stat-value">{reviewsData.avg_service}</div>
                <div className="stat-label">متوسط الخدمة</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{reviewsData.avg_ambiance}</div>
                <div className="stat-label">متوسط الأجواء</div>
              </div>
            </div>

            <div className="reviews-list">
              {reviewsData.results.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-user">
                      <img 
                        src={review.user.image_url || 'https://via.placeholder.com/45'} 
                        alt="User" 
                        className="user-img"
                      />
                      <div className="user-info">
                        <h6>{review.user.first_name} {review.user.last_name}</h6>
                        <div className="d-flex gap-1 mt-1">
                          {renderStars(review.overall_rate)}
                        </div>
                      </div>
                    </div>
                    <span className={`review-sentiment sentiment-${review.sentiment.toLowerCase()}`}>
                      {review.sentiment === 'POSITIVE' ? 'إيجابي' : review.sentiment === 'NEGATIVE' ? 'سلبي' : 'متعادل'}
                    </span>
                  </div>

                  <div className="restaurant-name">
                    <Utensils size={16} />
                    <span>{review.restaurant_name}</span>
                  </div>

                  <div className="ratings-grid">
                    <div className="rating-item">
                      <span className="rating-label">الطعام</span>
                      <div className="d-flex gap-1">{renderStars(review.food_rate)}</div>
                    </div>
                    <div className="rating-item">
                      <span className="rating-label">الخدمة</span>
                      <div className="d-flex gap-1">{renderStars(review.service_rate)}</div>
                    </div>
                    <div className="rating-item">
                      <span className="rating-label">الأجواء</span>
                      <div className="d-flex gap-1">{renderStars(review.ambiance_rate)}</div>
                    </div>
                  </div>

                  <p className="review-comment">{review.comment}</p>

                  <div className="review-footer">
                    <div className="useful-count">
                      <Smile size={16} />
                      <span>{review.useful_count} شخص وجد هذا مفيداً</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <MessageSquare size={64} className="text-muted mb-4" />
            <h4 className="fw-bold">لا يوجد تقييمات بعد</h4>
            <p className="text-muted">لم تقم بإضافة أي تقييمات للمطاعم حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
