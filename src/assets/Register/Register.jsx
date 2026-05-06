import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { registerUser } from '../../services/authService';

const FIXED_RESTAURANT_ID = '24efd7fc-96f8-4259-8258-839b35e52bb9';

export default function Register() {
  const navigate = useNavigate();
  const { roleType } = useParams();

  const accountRole = useMemo(() => {
    return roleType === 'owner' ? 'owner' : 'client';
  }, [roleType]);

  const isOwner = accountRole === 'owner';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    location: '',

    license_number: '',
    license_expiry: '',
    license_image: null,
    id_image: null,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const customStyles = `
    .reg-section {
      background: linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.72)), url('/hero2.jpg');
      background-size: cover;
      background-position: center;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 50px 0;
      direction: rtl;
    }

    .reg-card {
      background: rgba(255,255,255,.96);
      border-radius: 25px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,.4);
      width: 100%;
      max-width: 760px;
    }

    .form-control {
      border-radius: 10px;
      padding: 12px;
      border: 1px solid #eee;
      background-color: #f8f9fa;
    }

    .form-control:focus {
      border-color: #fd7e14;
      box-shadow: 0 0 0 .25rem rgba(253,126,20,.15);
      background-color: #fff;
    }

    .btn-reg {
      background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
      border: none;
      color: white;
      font-weight: bold;
      padding: 14px;
      border-radius: 50px;
      transition: .3s;
    }

    .btn-reg:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(253,126,20,.3);
      color: white;
    }

    .role-badge {
      display: inline-block;
      background: ${isOwner ? '#212529' : '#fd7e14'};
      color: white;
      padding: 8px 18px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
    }

    .section-title {
      background: #fff3e8;
      border-right: 4px solid #fd7e14;
      padding: 10px 15px;
      border-radius: 10px;
      font-weight: bold;
      margin: 20px 0 10px;
    }
  `;

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const validateOwnerFields = () => {
    if (!isOwner) return true;

    if (
      !formData.license_number ||
      !formData.license_expiry ||
      !formData.license_image ||
      !formData.id_image
    ) {
      setErrorMessage('يرجى تعبئة جميع بيانات الرخصة ورفع الصور المطلوبة');
      return false;
    }

    return true;
  };

const getTokenFromRegisterResponse = (data) => {
  return (
    data?.tokens?.access ||
    data?.access ||
    data?.access_token ||
    data?.token
  );
};
  const getErrorMessage = (error) => {
    const data = error?.response?.data;

    let message = 'فشل إنشاء الحساب، تأكد من البيانات';

    if (typeof data === 'string') {
      message = data;
    } else if (data?.detail) {
      message = data.detail;
    } else if (data?.message) {
      message = data.message;
    } else if (typeof data === 'object' && data !== null) {
      const firstKey = Object.keys(data)[0];

      if (firstKey) {
        const firstError = data[firstKey];
        message = Array.isArray(firstError) ? firstError[0] : firstError;
      }
    }

    return message;
  };

  const addOwnerLicense = async (token) => {
    const licenseFormData = new FormData();

    licenseFormData.append('license_number', formData.license_number);

    licenseFormData.append(
      'license_expiry',
      new Date(formData.license_expiry).toISOString()
    );

    licenseFormData.append('license_image', formData.license_image);
    licenseFormData.append('id_image', formData.id_image);

    return axios.post(
      `https://revvo-server.onrender.com/api/owner/restaurants/${FIXED_RESTAURANT_ID}/license/`,
      licenseFormData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.phone_number ||
      !formData.password
    ) {
      setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    if (!validateOwnerFields()) return;

    try {
      setLoading(true);

 const payload = {
  first_name: formData.first_name,
  last_name: formData.last_name,
  email: formData.email,
  password: formData.password,
  phone_number: formData.phone_number,
  role: isOwner ? 'OWNER' : 'CLIENT',
};

      const registerResponse = await registerUser(payload);

      if (!isOwner) {
        navigate('/login');
        return;
      }

      const token = getTokenFromRegisterResponse(registerResponse);

      if (!token) {
        setErrorMessage('تم إنشاء الحساب لكن لم يتم استلام التوكن');
        return;
      }

      localStorage.setItem('token', token);

      await addOwnerLicense(token);

      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false)
      console.log(registerResponse.user.role);
    }
  };

  return (
    <section className="reg-section">
      <style>{customStyles}</style>

      <div className="reg-card mx-3">
        <div className="text-center mb-4">
          <h2 className="fw-bold">
            {isOwner ? 'تسجيل مالك مطعم' : 'تسجيل مستخدم عادي'}
          </h2>

          <span className="role-badge">
            {isOwner ? 'Owner' : 'Client'}
          </span>

          <p className="text-muted mt-3 mb-0">
            {isOwner
              ? 'أدخل بياناتك وبيانات الرخصة للتحقق من الحساب'
              : 'أنشئ حسابك واحجز من أفضل المطاعم'}
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger text-center py-2">
            {errorMessage}
          </div>
        )}

        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="section-title">بيانات الحساب</div>

          <div className="col-md-6">
            <label className="form-label small fw-bold">الاسم الأول</label>
            <input
              type="text"
              name="first_name"
              className="form-control"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold">الاسم الأخير</label>
            <input
              type="text"
              name="last_name"
              className="form-control"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>

          <div className="col-md-12">
            <label className="form-label small fw-bold">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold">رقم الهاتف</label>
            <input
              type="tel"
              name="phone_number"
              className="form-control"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="05xxxxxxxx"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold">الموقع</label>
            <input
              type="text"
              name="location"
              className="form-control"
              value={formData.location}
              onChange={handleChange}
              placeholder="رام الله، فلسطين"
            />
          </div>

          <div className="col-md-12">
            <label className="form-label small fw-bold">كلمة المرور</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          {isOwner && (
            <>
              <div className="section-title">بيانات الرخصة</div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">رقم الرخصة</label>
                <input
                  type="number"
                  name="license_number"
                  className="form-control"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="123456789"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  تاريخ انتهاء الرخصة
                </label>
                <input
                  type="date"
                  name="license_expiry"
                  className="form-control"
                  value={formData.license_expiry}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">صورة الرخصة</label>
                <input
                  type="file"
                  name="license_image"
                  className="form-control"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">صورة الهوية</label>
                <input
                  type="file"
                  name="id_image"
                  className="form-control"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="col-md-12 mt-4">
            <button
              className="btn btn-reg w-100 shadow-sm"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'جاري إنشاء الحساب...'
                : isOwner
                ? 'إرسال طلب تسجيل مالك مطعم'
                : 'إنشاء حساب مستخدم عادي'}
            </button>
          </div>

          <div className="text-center mt-3">
            <p className="small">
              تريد تغيير نوع الحساب؟
              <button
                type="button"
                className="btn btn-link text-warning fw-bold p-0 ms-1 text-decoration-none"
                onClick={() => navigate('/registerchoice', { replace: true })}
              >
                رجوع للاختيار
              </button>
            </p>

            <p className="small">
              لديك حساب بالفعل؟
              <button
                type="button"
                className="btn btn-link text-warning fw-bold p-0 ms-1 text-decoration-none"
                onClick={() => navigate('/login')}
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}