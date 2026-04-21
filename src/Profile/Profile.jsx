import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/authService';

export default function Profile() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const customStyles = `
    .profile-section {
      min-height: 100vh;
      background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/Hero.jpg');
      background-size: cover;
      background-position: center;
      padding: 60px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-card {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 35px;
      width: 100%;
      max-width: 750px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
    }
    .form-control {
      border-radius: 12px;
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
    }
    .form-control:focus {
      border-color: #fd7e14;
      box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.15);
      background: #fff;
    }
    .btn-save {
      background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
      border: none;
      color: #fff;
      font-weight: bold;
      padding: 12px 20px;
      border-radius: 50px;
    }
    .btn-save:hover {
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(253, 126, 20, 0.25);
    }
  `;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfile();

        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          email: data.email || '',
        });
      } catch (error) {
        setErrorMessage('تعذر تحميل بيانات البروفايل');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    try {
      setSaving(true);

      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });

      setMessage('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      setErrorMessage('فشل تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-section">
      <style>{customStyles}</style>

      <div className="profile-card mx-3">
        <div className="text-center mb-4">
          <h2 className="fw-bold">الملف الشخصي</h2>
          <p className="text-muted mb-0">يمكنك تعديل بياناتك الشخصية من هنا</p>
        </div>

        {loading ? (
          <div className="text-center py-4">جاري تحميل البيانات...</div>
        ) : (
          <>
            {message && <div className="alert alert-success text-center">{message}</div>}
            {errorMessage && <div className="alert alert-danger text-center">{errorMessage}</div>}

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small">الاسم الأول</label>
                <input
                  type="text"
                  className="form-control"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">الاسم الأخير</label>
                <input
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold small">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold small">رقم الهاتف</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-12 mt-4">
                <button type="submit" className="btn btn-save w-100" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}