import React, { useEffect, useState, useRef } from 'react';
import { getProfile, updateProfile, changeEmail, changePassword } from '../services/authService';
import { User, Mail, Lock, Camera, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    image_url: '',
    image: null,
    image_preview: null
  });

  const [emailData, setEmailData] = useState({
    current_password: '',
    new_email: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const customStyles = `
    .profile-page {
      min-height: 100vh;
      background-color: #f8fafc;
      padding: 40px 0;
      font-family: 'Cairo', sans-serif;
    }
    .profile-container {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.05);
      overflow: hidden;
      display: flex;
      min-height: 600px;
      direction: rtl;
    }
    .profile-sidebar {
      width: 280px;
      background: #fff;
      border-left: 1px solid #edf2f7;
      padding: 30px 0;
    }
    .profile-content {
      flex: 1;
      padding: 40px;
    }
    .tab-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 25px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      border-right: 4px solid transparent;
      font-weight: 600;
    }
    .tab-item:hover {
      background: #f1f5f9;
      color: #fd7e14;
    }
    .tab-item.active {
      background: #fff7ed;
      color: #fd7e14;
      border-right-color: #fd7e14;
    }
    .avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .avatar-upload-btn {
      position: absolute;
      bottom: 0;
      left: 0;
      background: #fd7e14;
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 3px solid #fff;
      transition: 0.2s;
    }
    .avatar-upload-btn:hover {
      background: #e66d00;
      transform: scale(1.1);
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      color: #334155;
      font-size: 0.9rem;
    }
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #fff;
      transition: 0.2s;
      font-size: 0.95rem;
    }
    .form-input:focus {
      outline: none;
      border-color: #fd7e14;
      box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.1);
    }
    .form-input:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }
    .btn-submit {
      background: #fd7e14;
      color: #fff;
      border: none;
      padding: 12px 30px;
      border-radius: 12px;
      font-weight: 700;
      transition: 0.2s;
      width: 100%;
      margin-top: 10px;
    }
    .btn-submit:hover:not(:disabled) {
      background: #e66d00;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(253, 126, 20, 0.2);
    }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .alert {
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
    }
    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    @media (max-width: 768px) {
      .profile-container {
        flex-direction: column;
      }
      .profile-sidebar {
        width: 100%;
        border-left: none;
        border-bottom: 1px solid #edf2f7;
        padding: 20px 0;
      }
      .profile-sidebar-tabs {
        display: flex;
        overflow-x: auto;
      }
      .tab-item {
        border-right: none;
        border-bottom: 3px solid transparent;
        white-space: nowrap;
      }
      .tab-item.active {
        border-bottom-color: #fd7e14;
      }
    }
  `;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        image_url: data.image_url || '',
        image: null,
        image_preview: null
      });
    } catch (error) {
      showMsg('error', 'تعذر تحميل بيانات البروفايل');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        image_preview: URL.createObjectURL(file)
      }));
    }
  };

  const handleBasicUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        image: formData.image
      });
      showMsg('success', 'تم تحديث البيانات الشخصية بنجax');
      fetchProfile();
    } catch (error) {
      showMsg('error', 'فشل تحديث البيانات الشخصية');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await changeEmail(emailData);
      showMsg('success', 'تم تحديث البريد الإلكتروني بنجاح');
      setEmailData({ current_password: '', new_email: '' });
      fetchProfile();
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'فشل تحديث البريد الإلكتروني');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      return showMsg('error', 'كلمات المرور غير متطابقة');
    }
    try {
      setSaving(true);
      await changePassword(passwordData);
      showMsg('success', 'تم تغيير كلمة المرور بنجاح');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'فشل تغيير كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <style>{customStyles}</style>
      <div className="container">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="text-center px-4 mb-4">
              <div className="avatar-wrapper">
                <img 
                  src={formData.image_preview || formData.image_url || 'https://via.placeholder.com/120'} 
                  alt="Profile" 
                  className="avatar-img"
                />
                <div className="avatar-upload-btn" onClick={() => fileInputRef.current.click()}>
                  <Camera size={18} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                />
              </div>
              <h5 className="fw-bold mb-1">{formData.first_name} {formData.last_name}</h5>
              <p className="text-muted small mb-0">{formData.email}</p>
            </div>

            <div className="profile-sidebar-tabs">
              <div 
                className={`tab-item ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                <User size={20} />
                <span>المعلومات الأساسية</span>
              </div>
              <div 
                className={`tab-item ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                <Mail size={20} />
                <span>البريد الإلكتروني</span>
              </div>
              <div 
                className={`tab-item ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <Lock size={20} />
                <span>كلمة المرور</span>
              </div>
            </div>
          </div>

          <div className="profile-content">
            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            {activeTab === 'basic' && (
              <div>
                <h4 className="fw-bold mb-4">المعلومات الأساسية</h4>
                <form onSubmit={handleBasicUpdate}>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="form-label">الاسم الأول</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label className="form-label">الاسم الأخير</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني (للعرض فقط)</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={formData.email}
                      disabled
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'email' && (
              <div>
                <h4 className="fw-bold mb-4">تحديث البريد الإلكتروني</h4>
                <form onSubmit={handleEmailUpdate}>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني الجديد</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={emailData.new_email}
                      onChange={(e) => setEmailData({...emailData, new_email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      className="form-input"
                      value={emailData.current_password}
                      onChange={(e) => setEmailData({...emailData, current_password: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={saving}>
                    {saving ? 'جاري التحديث...' : 'تحديث البريد الإلكتروني'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h4 className="fw-bold mb-4">تغيير كلمة المرور</h4>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="form-group">
                    <label className="form-label">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      className="form-input"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      className="form-input"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      className="form-input"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={saving}>
                    {saving ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}