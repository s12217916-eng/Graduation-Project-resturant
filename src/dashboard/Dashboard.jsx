// Dashboard.jsx
import axios from 'axios';
import React, { useState } from 'react';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
const [licenseData, setLicenseData] = useState({
  license_number: '',
  license_expiry: '',
  license_image: null,
  id_image: null,
});
const handleLicenseChange = (e) => {
  const { name, value, files, type } = e.target;

  setLicenseData((prev) => ({
    ...prev,
    [name]: type === 'file' ? files[0] : value,
  }));
};
const submitLicense = async () => {
  try {
    const token = localStorage.getItem('access');

    const formData = new FormData();

    formData.append(
      'license_number',
      licenseData.license_number
    );

    formData.append(
      'license_expiry',
      new Date(licenseData.license_expiry).toISOString()
    );

    formData.append(
      'license_image',
      licenseData.license_image
    );

    formData.append(
      'id_image',
      licenseData.id_image
    );

    await axios.post(
      'https://revvo-server.onrender.com/api/owner/restaurant/license',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          
        },
      }
    );

    alert('تم رفع الرخصة بنجاح');
  } catch (error) {
    console.log(error);
    alert('فشل رفع الرخصة');
  }
};
  const sidebarItems = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'restaurant', label: 'معلومات المطعم' },
    { key: 'license', label: 'الرخصة' },
    { key: 'images', label: 'صور المطعم' },
    { key: 'menu', label: 'المينيو' },
    { key: 'analytics', label: 'التحليلات' },
    { key: 'ai', label: 'AI Summary' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div>
            <h2 className="fw-bold mb-4">مرحباً بك 👋</h2>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-lg p-4 rounded-4 text-center">
                  <h5>الحجوزات</h5>
                  <h1 className="fw-bold text-warning">420</h1>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-lg p-4 rounded-4 text-center">
                  <h5>التقييم</h5>
                  <h1 className="fw-bold text-warning">4.9</h1>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-lg p-4 rounded-4 text-center">
                  <h5>العملاء</h5>
                  <h1 className="fw-bold text-warning">640</h1>
                </div>
              </div>
            </div>
          </div>
        );

      case 'restaurant':
        return (
          <div className="card border-0 shadow-lg rounded-4 p-4">
            <h3 className="fw-bold mb-4">معلومات المطعم</h3>

            <input
              className="form-control mb-3"
              placeholder="اسم المطعم"
            />

            <textarea
              className="form-control mb-3"
              rows="4"
              placeholder="وصف المطعم"
            ></textarea>

            <input
              className="form-control mb-3"
              placeholder="الموقع"
            />

            <button className="btn btn-warning text-white">
              حفظ المعلومات
            </button>
          </div>
        );
case 'license':
  return (
  <div className="card border-0 shadow-lg rounded-4 p-4">
    <h3 className="fw-bold mb-4">
      الرخصة
    </h3>

    <input
      type="text"
      name="license_number"
      className="form-control mb-3"
      placeholder="رقم الرخصة"
      onChange={handleLicenseChange}
    />

    <input
      type="date"
      name="license_expiry"
      className="form-control mb-3"
      onChange={handleLicenseChange}
    />

    <input
      type="file"
      name="license_image"
      className="form-control mb-3"
      onChange={handleLicenseChange}
    />

    <input
      type="file"
      name="id_image"
      className="form-control mb-3"
      onChange={handleLicenseChange}
    />

    <button
      className="btn btn-dark"
      onClick={submitLicense}
    >
      رفع الملفات
    </button>
  </div>
);

      case 'images':
        return (
          <div className="card border-0 shadow-lg rounded-4 p-4">
            <h3 className="fw-bold mb-4">صور المطعم</h3>

            <input
              type="file"
              multiple
              className="form-control mb-3"
            />

            <button className="btn btn-warning text-white">
              رفع الصور
            </button>
          </div>
        );

      case 'menu':
        return (
          <div className="card border-0 shadow-lg rounded-4 p-4">
            <h3 className="fw-bold mb-4">المينيو</h3>

            <input
              className="form-control mb-3"
              placeholder="اسم الوجبة"
            />

            <input
              className="form-control mb-3"
              placeholder="السعر"
            />

            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder="الوصف"
            ></textarea>

            <button className="btn btn-success">
              إضافة وجبة
            </button>
          </div>
        );

      case 'analytics':
        return (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-lg rounded-4 p-5 text-center">
                <h5>الحجوزات</h5>
                <h1 className="fw-bold text-warning">420</h1>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-lg rounded-4 p-5 text-center">
                <h5>رضا العملاء</h5>
                <h1 className="fw-bold text-warning">96%</h1>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="card border-0 shadow-lg rounded-4 p-4">
            <h3 className="fw-bold mb-4">AI Summary</h3>

            <div className="alert alert-warning border-0 rounded-4">
              العملاء راضون عن جودة الطعام.
            </div>

            <div className="alert alert-dark text-white border-0 rounded-4">
              يوجد ضغط في أوقات الذروة.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        direction: 'rtl',
        background: '#f5f6fa',
      }}
    >
      <div
        className="bg-dark text-white p-4 shadow-lg"
        style={{
          width: '290px',
        }}
      >
        <div className="text-center mb-5">
          <h3 className="fw-bold text-warning">
            DINE ADVISOR

          </h3>

          <p className="small">
            Restaurant Owner Dashboard
          </p>
        </div>

        {sidebarItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`btn w-100 text-end mb-3 py-3 rounded-4 fw-bold ${
              activeSection === item.key
                ? 'btn-warning text-white'
                : 'btn-outline-light'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-grow-1 p-5">
        {renderContent()}
      </div>
    </div>
  );
}