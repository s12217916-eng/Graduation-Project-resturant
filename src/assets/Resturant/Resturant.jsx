import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaUtensils, FaStar, FaChevronLeft, FaChevronRight, FaSortAmountDown, FaLocationArrow } from 'react-icons/fa';

export default function Resturant() {
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [ratingFilter, setRatingFilter] = useState(0);
    const [sortBy, setSortBy] = useState('default');
    const [userLocation, setUserLocation] = useState(null);
    const [isNearMeActive, setIsNearMeActive] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    
    const navigate = useNavigate();
    const location = useLocation();

    // جلب البيانات الأساسية
    useEffect(() => {
        axios.get('http://localhost:8000/api/restaurants')
            .then(res => {
                const data = res.data.results;
                setRestaurants(data);
                setFilteredRestaurants(data);
                
                // قراءة البحث القادم من الـ Hero إن وجد
                const queryParams = new URLSearchParams(location.search);
                const searchFromHero = queryParams.get('search');
                if (searchFromHero) {
                    setSearchTerm(searchFromHero);
                    applyFilters(searchFromHero, 'All', 0, false, 'default', data);
                }
                
                setLoading(false);
            })
            .catch(err => {
                console.error("خطأ في جلب البيانات:", err);
                setLoading(false);
            });
        window.scrollTo(0, 0);
    }, [location.search]);

    // دالة حساب المسافة (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    // دالة الفلترة والترتيب المشتركة
    const applyFilters = (search, category, rating, nearMe, sort, data = restaurants) => {
        let temp = [...data];

        // 1. البحث بالاسم أو الموقع
        if (search) {
            temp = temp.filter(item => 
                item.name.toLowerCase().includes(search.toLowerCase()) || 
                item.address.toLowerCase().includes(search.toLowerCase())
            );
        }

        // 2. الفلترة بالكاتيجوري
        if (category !== 'All') {
            temp = temp.filter(item => item.category === category);
        }

        // 3. الفلترة بالتقييم
        if (rating > 0) {
            temp = temp.filter(item => (item.rating || 0) >= rating);
        }

        // 4. الفلترة بالقرب مني
        if (nearMe && userLocation) {
            temp = temp.filter(item => {
                if (item.lat && item.lon) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lon);
                    return dist <= 10; // ضمن 10 كم
                }
                return false;
            });
        }

        // 5. الترتيب
        if (sort === 'rating-high') {
            temp.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'name-asc') {
            temp.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'distance' && userLocation) {
            temp.sort((a, b) => {
                const distA = (a.lat && a.lon) ? calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lon) : Infinity;
                const distB = (b.lat && b.lon) ? calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lon) : Infinity;
                return distA - distB;
            });
        }

        setFilteredRestaurants(temp);
        setCurrentPage(1); // العودة للصفحة الأولى عند تغيير الفلاتر
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(value, selectedCategory, ratingFilter, isNearMeActive, sortBy);
    };

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        applyFilters(searchTerm, cat, ratingFilter, isNearMeActive, sortBy);
    };

    const handleRatingClick = (rating) => {
        const newRating = ratingFilter === rating ? 0 : rating;
        setRatingFilter(newRating);
        applyFilters(searchTerm, selectedCategory, newRating, isNearMeActive, sortBy);
    };

    const handleSortChange = (e) => {
        const value = e.target.value;
        setSortBy(value);
        applyFilters(searchTerm, selectedCategory, ratingFilter, isNearMeActive, value);
    };

    const handleNearMeToggle = () => {
        if (!isNearMeActive && !userLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                        setUserLocation(loc);
                        setIsNearMeActive(true);
                        applyFilters(searchTerm, selectedCategory, ratingFilter, true, sortBy);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        alert("تعذر الحصول على موقعك الحالي. يرجى التأكد من تفعيل خاصية الموقع في المتصفح.");
                    }
                );
            } else {
                alert("متصفحك لا يدعم خاصية الموقع الجغرافي.");
            }
        } else {
            const newState = !isNearMeActive;
            setIsNearMeActive(newState);
            applyFilters(searchTerm, selectedCategory, ratingFilter, newState, sortBy);
        }
    };

    const categories = ['All', 'Fast Food', 'Oriental', 'Italian', 'Cafe'];

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRestaurants.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const customStyles = `
        .search-section {
            background: #f8f9fa;
            padding: 50px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 40px;
            direction: rtl;
        }
        .filter-container {
            background: white;
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            margin-top: -30px;
            position: relative;
            z-index: 5;
        }
        .search-input-group {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 5px 15px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            transition: 0.3s;
        }
        .search-input-group:focus-within {
            border-color: #fd7e14;
            background: white;
            box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.1);
        }
        .search-input-group input {
            border: none;
            padding: 10px;
            flex: 1;
            outline: none;
            background: transparent;
            font-size: 0.95rem;
        }
        .filter-label {
            font-weight: 700;
            font-size: 0.85rem;
            color: #475569;
            margin-bottom: 10px;
            display: block;
        }
        .category-chip {
            padding: 8px 18px;
            border-radius: 50px;
            border: 1px solid #e2e8f0;
            background: white;
            cursor: pointer;
            transition: 0.3s;
            font-weight: 600;
            font-size: 0.85rem;
            margin: 4px;
        }
        .category-chip.active {
            background: #fd7e14;
            color: white;
            border-color: #fd7e14;
        }
        .rating-stars {
            display: flex;
            gap: 5px;
        }
        .star-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            color: #e2e8f0;
            transition: 0.2s;
        }
        .star-btn.active {
            color: #ffc107;
        }
        .sort-select {
            width: 100%;
            padding: 10px 15px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #f8f9fa;
            outline: none;
            font-size: 0.9rem;
            font-weight: 600;
            color: #475569;
            cursor: pointer;
        }
        .near-me-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #f8f9fa;
            color: #475569;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: 0.3s;
            width: 100%;
            justify-content: center;
        }
        .near-me-btn.active {
            background: #0ea5e9;
            color: white;
            border-color: #0ea5e9;
        }
        .restaurant-card {
            border-radius: 20px;
            overflow: hidden;
            transition: 0.4s;
            background: white;
            border: 1px solid #eee;
            height: 100%;
        }
        .restaurant-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
        }
        .pagination-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 50px;
        }
        .page-btn {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: 0.3s;
            font-weight: 700;
            color: #475569;
        }
        .page-btn:hover:not(:disabled) {
            border-color: #fd7e14;
            color: #fd7e14;
        }
        .page-btn.active {
            background: #fd7e14;
            color: white;
            border-color: #fd7e14;
        }
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-warning"></div></div>;

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <style>{customStyles}</style>
            
            {/* قسم الهيدر */}
            <div className="search-section">
                <div className="container text-center">
                    <h1 className="fw-bold mb-2">استكشف مطاعمك المفضلة</h1>
                    <p className="text-muted">اكتشف أفضل تجارب الطعام في مدينتك</p>
                </div>
            </div>

            {/* قسم الفلاتر */}
            <div className="container">
                <div className="filter-container">
                    <div className="row g-4">
                        {/* البحث */}
                        <div className="col-lg-4">
                            <span className="filter-label">البحث عن مطعم</span>
                            <div className="search-input-group">
                                <FaSearch className="text-muted" />
                                <input 
                                    type="text" 
                                    placeholder="ابحث بالاسم أو الموقع..." 
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>

                        {/* التقييم */}
                        <div className="col-lg-3">
                            <span className="filter-label">الحد الأدنى للتقييم</span>
                            <div className="rating-stars py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        className={`star-btn ${ratingFilter >= star ? 'active' : ''}`}
                                        onClick={() => handleRatingClick(star)}
                                    >
                                        <FaStar size={24} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* الترتيب */}
                        <div className="col-lg-3">
                            <span className="filter-label">ترتيب حسب</span>
                            <select className="sort-select" value={sortBy} onChange={handleSortChange}>
                                <option value="default">الافتراضي</option>
                                <option value="rating-high">الأعلى تقييماً</option>
                                <option value="name-asc">الاسم (أ-ي)</option>
                                <option value="distance">الأقرب إليك</option>
                            </select>
                        </div>

                        {/* بالقرب مني */}
                        <div className="col-lg-2">
                            <span className="filter-label">الموقع</span>
                            <button 
                                className={`near-me-btn ${isNearMeActive ? 'active' : ''}`}
                                onClick={handleNearMeToggle}
                            >
                                <FaLocationArrow size={14} />
                                <span>بالقرب مني</span>
                            </button>
                        </div>

                        {/* التصنيفات */}
                        <div className="col-12 border-top pt-3">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <span className="fw-bold text-muted small">التصنيفات:</span>
                                {categories.map(cat => (
                                    <button 
                                        key={cat}
                                        className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => handleCategoryClick(cat)}
                                    >
                                        {cat === 'All' ? 'الكل' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* قائمة المطاعم */}
            <div className="container mb-5 mt-5">
                <div className="row g-4">
                    {currentItems.length > 0 ? (
                        currentItems.map((item) => (
                            <div className="col-lg-4 col-md-6" key={item.id}>
                                <div 
                                    className="restaurant-card shadow-sm" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/resturant/${item.id}`)}
                                >
                                    <div className="position-relative">
                                        <img src={item.image_url} className="w-100" alt={item.name} style={{ height: '240px', objectFit: 'cover' }} />
                                        <div className="position-absolute top-0 end-0 m-3 badge bg-dark opacity-75">
                                            {item.category || 'Luxury'}
                                        </div>
                                        {item.rating && (
                                            <div className="position-absolute bottom-0 start-0 m-3 badge bg-warning text-dark d-flex align-items-center gap-1">
                                                <FaStar size={12} /> {item.rating}
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-body p-4 text-end">
                                        <h5 className="fw-bold mb-2">{item.name}</h5>
                                        <p className="text-muted small mb-3">
                                            <FaMapMarkerAlt className="text-danger ms-1" /> {item.address}
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-warning small d-flex align-items-center gap-1">
                                                <FaUtensils size={14} /> 
                                                <span>Best Seller</span>
                                            </span>
                                            <button className="btn btn-sm btn-outline-warning rounded-pill px-4 fw-bold">التفاصيل</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 w-100">
                            <div className="mb-4">
                                <FaSearch size={50} className="text-muted opacity-25" />
                            </div>
                            <h4 className="text-muted">للأسف، لم نجد نتائج تطابق بحثك 🔍</h4>
                            <p className="text-muted small">حاول تغيير فلاتر البحث للحصول على نتائج أفضل</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination-container">
                        <button 
                            className="page-btn" 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <FaChevronRight />
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i + 1}
                                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => paginate(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button 
                            className="page-btn" 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <FaChevronLeft />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}