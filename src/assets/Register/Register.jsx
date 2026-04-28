import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { registerUser } from '../../services/authService';

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

  restaurant_name: '',
  restaurant_location: '',
  table_capacity: '',
  national_id_image: null,
  restaurant_license: null,
  notes: '',
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
      !formData.restaurant_name ||
      !formData.restaurant_location ||
      !formData.table_capacity ||
      !formData.national_id_image ||
      !formData.restaurant_license
    ) {
      setErrorMessage('يرجى تعبئة جميع بيانات مالك المطعم ورفع الملفات المطلوبة');
      return false;
    }

    return true;
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

  try {
    setLoading(true);

    if (!isOwner) {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
      };

      await registerUser(payload);
      navigate('/login');
      return;
    }

    // مؤقتًا للمالك: ما بنشبك API الآن
    const ownerDraft = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      location: formData.location,
      restaurant_name: formData.restaurant_name,
      restaurant_location: formData.restaurant_location,
      table_capacity: formData.table_capacity,
      national_id_image_name: formData.national_id_image?.name,
      restaurant_license_name: formData.restaurant_license?.name,
      notes: formData.notes,
    };

    localStorage.setItem('ownerApplicationDraft', JSON.stringify(ownerDraft));
    navigate('/login');
  } catch (error) {
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

    setErrorMessage(message);
  } finally {
    setLoading(false);
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
              ? 'أدخل بياناتك وبيانات مطعمك للتحقق من الحساب'
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
              <div className="section-title">بيانات المطعم والتحقق</div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">اسم المطعم</label>
                <input
                  type="text"
                  name="restaurant_name"
                  className="form-control"
                  value={formData.restaurant_name}
                  onChange={handleChange}
                  placeholder="مثال: مطعم الياسمين"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">موقع المطعم</label>
                <input
                  type="text"
                  name="restaurant_location"
                  className="form-control"
                  value={formData.restaurant_location}
                  onChange={handleChange}
                  placeholder="المدينة / الشارع"
                />
              </div>

              <div className="col-md-12">
                <label className="form-label small fw-bold">كم طاولة بوسع مطعمك؟</label>
                <input
                  type="number"
                  name="table_capacity"
                  className="form-control"
                  min="1"
                  value={formData.table_capacity}
                  onChange={handleChange}
                  placeholder="مثال: 25"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">صورة الهوية</label>
                <input
                  type="file"
                  name="national_id_image"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">رخصة المطعم</label>
                <input
                  type="file"
                  name="restaurant_license"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-12">
                <label className="form-label small fw-bold">ملاحظات إضافية</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="أي معلومات إضافية عن المطعم"
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