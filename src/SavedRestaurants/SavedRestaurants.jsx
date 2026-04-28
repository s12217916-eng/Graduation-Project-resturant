import React from 'react';
import { FaHeart, FaUtensils } from 'react-icons/fa';

export default function SavedRestaurants() {
  return (
    <div className="container py-5" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <div className="bg-white p-5 rounded-5 shadow-sm border text-center">
        <FaHeart size={55} className="text-danger mb-3" />

        <h2 className="fw-bold mb-3">المطاعم المفضلة</h2>

        <div className="alert alert-warning">
          تم تجهيز صفحة المفضلة. نحتاج فقط API جلب المطاعم المحفوظة لعرض القائمة هنا.
        </div>

        <div className="text-muted">
          <FaUtensils className="ms-2" />
          احفظ المطاعم من صفحة تفاصيل المطعم.
        </div>
      </div>
    </div>
  );
}