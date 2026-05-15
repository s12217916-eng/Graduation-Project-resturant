import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaHeart, FaUtensils, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000/api';

export default function SavedRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const getToken = () =>
    localStorage.getItem('access') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken');

  const getArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.saves)) return data.saves;
    if (Array.isArray(data?.saved)) return data.saved;
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    return [];
  };

  const fetchSavedRestaurants = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const token = getToken();

      if (!token) {
        setErrorMessage('يجب تسجيل الدخول لعرض المطاعم المفضلة');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API}/client/saves/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const savesData = getArray(response.data);

      const normalizedRestaurants = savesData
        .map((item) => item.restaurant || item)
        .filter(Boolean);

      setRestaurants(normalizedRestaurants);
    } catch (error) {
      console.error('Fetch saved restaurants error:', error?.response?.data || error);

      const data = error?.response?.data;

      let message = 'فشل تحميل المطاعم المفضلة';

      if (typeof data === 'string') {
        message = data;
      } else if (data?.detail) {
        message = data.detail;
      } else if (data?.message) {
        message = data.message;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedRestaurants();
  }, []);

  return (
    <div
      className="container py-5"
      style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
    >
      <div className="bg-white p-5 rounded-5 shadow-sm border">
        <div className="text-center mb-4">
          <FaHeart size={55} className="text-danger mb-3" />
          <h2 className="fw-bold mb-3">المطاعم المفضلة</h2>
        </div>

        {loading && (
          <div className="alert alert-info text-center">
            جاري تحميل المطاعم المفضلة...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="alert alert-danger text-center">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && restaurants.length === 0 && (
          <div className="text-center">
            <div className="alert alert-warning">
              لا يوجد مطاعم محفوظة حتى الآن.
            </div>

            <div className="text-muted">
              <FaUtensils className="ms-2" />
              احفظ المطاعم من صفحة تفاصيل المطعم.
            </div>
          </div>
        )}

        {!loading && !errorMessage && restaurants.length > 0 && (
          <div className="row g-4">
            {restaurants.map((restaurant, index) => (
              <div
                className="col-md-6 col-lg-4"
                key={restaurant.id || index}
              >
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                  {restaurant.image || restaurant.image_url ? (
                    <img
                      src={restaurant.image || restaurant.image_url}
                      className="card-img-top"
                      alt={restaurant.name || 'Restaurant'}
                      style={{
                        height: '190px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: '190px' }}
                    >
                      <FaUtensils size={45} className="text-muted" />
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="fw-bold mb-2">
                      {restaurant.name ||
                        restaurant.restaurant_name ||
                        'مطعم بدون اسم'}
                    </h5>

                    <p className="text-muted small mb-3">
                      <FaMapMarkerAlt className="ms-1 text-danger" />
                      {restaurant.address ||
                        restaurant.location ||
                        restaurant.restaurant_location ||
                        'لا يوجد موقع'}
                    </p>

                    <button
                      type="button"
                      className="btn btn-warning w-100 rounded-pill fw-bold"
                      onClick={() => navigate(`/resturant/${restaurant.id}`)}
                      disabled={!restaurant.id}
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}