import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaUtensils } from 'react-icons/fa';

export default function Resturant() {
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const navigate = useNavigate();
    const location = useLocation();

    // جلب البيانات الأساسية
    useEffect(() => {
        axios.get('https://revvo-server.onrender.com/api/restaurants')
            .then(res => {
                const data = res.data.results;
                setRestaurants(data);
                setFilteredRestaurants(data);
                
                // قراءة البحث القادم من الـ Hero إن وجد
                const queryParams = new URLSearchParams(location.search);
                const searchFromHero = queryParams.get('search');
                if (searchFromHero) {
                    setSearchTerm(searchFromHero);
                    applyFilters(searchFromHero, 'All', data);
                }
                
                setLoading(false);
            })
            .catch(err => {
                console.error("خطأ في جلب البيانات:", err);
                setLoading(false);
            });
        window.scrollTo(0, 0);
    }, [location.search]);

    // دالة الفلترة المشتركة
    const applyFilters = (search, category, data = restaurants) => {
        let temp = data.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                                 item.address.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category === 'All' || item.category === category;
            return matchesSearch && matchesCategory;
        });
        setFilteredRestaurants(temp);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(value, selectedCategory);
    };

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        applyFilters(searchTerm, cat);
    };

    const categories = ['All', 'Fast Food', 'Oriental', 'Italian', 'Cafe'];

    const customStyles = `
        .search-section {
            background: #f8f9fa;
            padding: 40px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 40px;
        }
        .search-input-group {
            background: white;
            border-radius: 50px;
            padding: 5px 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
            border: 1px solid #ddd;
            display: flex;
            align-items: center;
        }
        .search-input-group input {
            border: none;
            padding: 12px;
            flex: 1;
            outline: none;
        }
        .category-chip {
            padding: 8px 25px;
            border-radius: 50px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            transition: 0.3s;
            font-weight: 500;
            margin: 5px;
        }
        .category-chip.active {
            background: #fd7e14;
            color: white;
            border-color: #fd7e14;
        }
        .restaurant-card {
            border-radius: 20px;
            overflow: hidden;
            transition: 0.4s;
            background: white;
            border: 1px solid #eee;
        }
        .restaurant-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
        }
    `;

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-warning"></div></div>;

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <style>{customStyles}</style>
            
            {/* قسم البحث والكاتيجوري */}
            <div className="search-section">
                <div className="container text-center">
                    <h2 className="fw-bold mb-4">استكشف مطاعمك المفضلة</h2>
                    <div className="row justify-content-center mb-4">
                        <div className="col-md-6">
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
                    </div>
                    <div className="d-flex justify-content-center flex-wrap">
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

            {/* قائمة المطاعم */}
            <div className="container mb-5">
                <div className="row g-4">
                    {filteredRestaurants.length > 0 ? (
                        filteredRestaurants.map((item) => (
                            <div className="col-lg-4 col-md-6" key={item.id}>
                                <div 
                                    className="restaurant-card h-100 shadow-sm" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/resturant/${item.id}`)}
                                >
                                    <div className="position-relative">
                                        <img src={item.image} className="w-100" alt={item.name} style={{ height: '240px', objectFit: 'cover' }} />
                                        <div className="position-absolute top-0 end-0 m-3 badge bg-dark opacity-75">
                                            {item.category || 'Luxury'}
                                        </div>
                                    </div>
                                    <div className="card-body p-4 text-end">
                                        <h5 className="fw-bold mb-2">{item.name}</h5>
                                        <p className="text-muted small mb-3">
                                            <FaMapMarkerAlt className="text-danger ms-1" /> {item.address}
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-warning small"><FaUtensils className="me-1" /> Best Seller</span>
                                            <button className="btn btn-sm btn-outline-warning rounded-pill px-4">التفاصيل</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <h4 className="text-muted">للأسف، لم نجد نتائج تطابق بحثك 🔍</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}