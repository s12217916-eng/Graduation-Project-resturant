import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaHeart, FaUtensils, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function SavedRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const getToken = () => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access') ||
      localStorage.getItem('accessToken')
    );
  };

  const fetchSavedRestaurants = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const token = getToken();

      if (!token) {
        setErrorMessage('يجب تسجيل الدخول لعرض المطاعم المفضلة');
        return;
      }

      const response = await axios.get(
        'http://revvo-server.onrender.com/api/user/saved/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response?.data;

      if (Array.isArray(data)) {
        setRestaurants(data);
      } else if (Array.isArray(data?.results)) {
        setRestaurants(data.results);
      } else if (Array.isArray(data?.saved)) {
        setRestaurants(data.saved);
      } else if (Array.isArray(data?.restaurants)) {
        setRestaurants(data.restaurants);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
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
            {restaurants.map((item) => {
              const restaurant = item.restaurant || item;

              return (
                <div className="col-md-6 col-lg-4" key={restaurant.id || item.id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    {restaurant.image_url || restaurant.image ? (
                      <img
                        src={restaurant.image_url || restaurant.image}
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
                        {restaurant.location ||
                          restaurant.address ||
                          restaurant.restaurant_location ||
                          'لا يوجد موقع'}
                      </p>

                      <button
                        type="button"
                        className="btn btn-warning w-100 rounded-pill fw-bold"
                        onClick={() =>
                          navigate(`/resturant/${restaurant.id || item.id}`)
                        }
                      >
                        عرض التفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}