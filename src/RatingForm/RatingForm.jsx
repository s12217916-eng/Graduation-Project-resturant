import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

export default function RatingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [ratings, setRatings] = useState({
    food: 0,
    service: 0,
    ambience: 0,
  });

  const [hovered, setHovered] = useState({
    food: 0,
    service: 0,
    ambience: 0,
  });

  const [comment, setComment] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [menu, setMenu] = useState([]);
  const [menuId, setMenuId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(
          `https://revvo-server.onrender.com/api/restaurants/${id}/menu/`
        );

        const menuData = response.data || [];
        setMenu(menuData);

        if (menuData.length > 0) {
          setMenuId(menuData[0].id);
        }
      } catch (error) {
        console.error('Menu fetch error:', error);
        setErrorMessage('تعذر تحميل قائمة الطعام');
      } finally {
        setPageLoading(false);
      }
    };

    fetchMenu();
  }, [id]);

  const handleRating = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    const availableSlots = 5 - selectedImages.length;
    const filesToAdd = files.slice(0, availableSlots);

    const imagesArray = filesToAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...imagesArray]);
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    URL.revokeObjectURL(newImages[index].url);
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const renderStars = (category, value) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        style={{
          fontSize: '28px',
          cursor: 'pointer',
          transition: '0.2s',
          color: star <= (hovered[category] || value) ? '#fd7e14' : '#e0e0e0',
          filter:
            star <= (hovered[category] || value)
              ? 'drop-shadow(0 0 5px rgba(253, 126, 20, 0.4))'
              : 'none',
        }}
        onClick={() => handleRating(category, star)}
        onMouseEnter={() =>
          setHovered((prev) => ({ ...prev, [category]: star }))
        }
        onMouseLeave={() =>
          setHovered((prev) => ({ ...prev, [category]: 0 }))
        }
      >
        {star <= (hovered[category] || value) ? '★' : '☆'}
      </span>
    ));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');

  const access = localStorage.getItem('access');

  console.log('ACCESS TOKEN:', access);
console.log('SUBMIT CLICKED');
  if (!access) {
    setErrorMessage('يجب تسجيل الدخول أولاً لإضافة تقييم');
    navigate('/login');
    return;
  }

  if (!ratings.food || !ratings.service || !ratings.ambience) {
    setErrorMessage('يرجى تعبئة جميع التقييمات');
    return;
  }

  if (!comment.trim()) {
    setErrorMessage('يرجى كتابة تعليق');
    return;
  }

  if (!menuId) {
    setErrorMessage('يرجى اختيار صنف من القائمة');
    return;
  }

  const payload = {
    comment: comment.trim(),
    food_rate: Number(ratings.food),
    service_rate: Number(ratings.service),
    ambiance_rate: Number(ratings.ambience),
    menu_id: menuId,
  };

  try {
    setLoading(true);

    const response = await axiosInstance.post(
      `/restaurants/${id}/reviews/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );

    console.log('Review created:', response.data);

    navigate(`/resturant/${id}`);
  } catch (error) {
    console.error('Create review error:', error);
    console.error('Response data:', error?.response?.data);

    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'فشل إرسال التقييم';

    setErrorMessage(message);
  } finally {
    setLoading(false);
  }
};

  const customStyles = `
    .rating-container { background: #fcfcfc; padding: 60px 0; min-height: 100vh; direction: rtl; }
    .rating-card { background: white; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); padding: 45px; border: 1px solid #f0f0f0; }
    .category-label { font-weight: 700; color: #222; margin-bottom: 8px; display: block; font-size: 0.95rem; }
    .upload-box {
      border: 2px dashed #ddd; border-radius: 20px; padding: 30px; text-align: center;
      cursor: pointer; transition: 0.3s; background: #fafafa;
    }
    .upload-box:hover { border-color: #fd7e14; background: #fff9f5; }
    .preview-img { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; border: 2px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    .remove-btn {
      position: absolute; top: -8px; right: -8px; background: #ff4757; color: white;
      border-radius: 50%; width: 22px; height: 22px; border: none; font-size: 12px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .form-control-custom { border: 2px solid #eee; border-radius: 15px; padding: 15px; width: 100%; transition: 0.3s; }
    .form-control-custom:focus { border-color: #fd7e14; outline: none; box-shadow: 0 0 0 4px rgba(253, 126, 20, 0.1); }
    .submit-review-btn {
      background: linear-gradient(45deg, #fd7e14, #ff9800); color: white; border: none;
      padding: 18px; border-radius: 18px; font-weight: bold; width: 100%; font-size: 1.1rem;
      box-shadow: 0 10px 20px rgba(253, 126, 20, 0.3); transition: 0.3s;
    }
    .submit-review-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(253, 126, 20, 0.4); }
  `;

  if (pageLoading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-white">
        <div className="spinner-grow text-warning" role="status"></div>
      </div>
    );
  }

  return (
    <div className="rating-container text-end">
      <style>{customStyles}</style>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="rating-card">
              <div className="text-center mb-5">
                <h2 className="fw-black mb-2">أضف تقييمك للمطعم</h2>
                <p className="text-muted">
                  رأيك يساعد الآخرين في اتخاذ قراراتهم، شكراً لمشاركتنا تجربتك
                </p>
                <h2>THIS IS RATING FORM PAGE</h2>
                <div
                  className="mx-auto"
                  style={{
                    width: '60px',
                    height: '4px',
                    background: '#fd7e14',
                    borderRadius: '10px',
                  }}
                ></div>
              </div>

              {errorMessage && (
                <div className="alert alert-danger text-center py-2 mb-4" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4 mb-5">
                  {[
                    { id: 'food', label: 'جودة الطعام' },
                    { id: 'service', label: 'مستوى الخدمة' },
                    { id: 'ambience', label: 'أجواء المكان' },
                  ].map((item) => (
                    <div className="col-md-4 text-center text-md-end" key={item.id}>
                      <label className="category-label">{item.label}</label>
                      <div className="d-flex justify-content-center justify-content-md-start gap-1">
                        {renderStars(item.id, ratings[item.id])}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="category-label mb-2">اختر صنفًا من القائمة:</label>
                  <select
                    className="form-control-custom"
                    value={menuId}
                    onChange={(e) => setMenuId(e.target.value)}
                  >
                    <option value="">اختر صنفًا</option>
                    {menu.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="category-label mb-3">
                    أضف صوراً لتجربتك (اختياري - حتى 5 صور):
                  </label>
                  <div
                    className="upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaCloudUploadAlt size={40} className="text-warning mb-2" />
                    <h6 className="fw-bold mb-1">اضغط هنا لرفع الصور</h6>
                    <p className="small text-muted mb-0">
                      يمكنك رفع صور الوجبات أو المكان
                    </p>
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="d-flex flex-wrap gap-3 mt-4 justify-content-center justify-content-md-start">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="position-relative">
                          <img src={img.url} className="preview-img" alt="preview" />
                          <button
                            type="button"
                            className="remove-btn shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="category-label mb-2">اكتب تعليقك المفصل:</label>
                  <textarea
                    className="form-control-custom"
                    rows="4"
                    placeholder="ما الذي أعجبك؟ وما الذي يمكن تحسينه؟"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="submit-review-btn mt-3 shadow"
                  disabled={loading}
                >
                  {loading ? 'جاري إرسال التقييم...' : 'إرسال التقييم الآن'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}