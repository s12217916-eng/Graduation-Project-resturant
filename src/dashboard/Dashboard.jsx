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
      'https://revvo-server.onrender.com/api/owner/restaurant/license/',
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
const [menuItems, setMenuItems] = useState([]); // لتخزين المينيو الجاي من الـ GET
const [newItem, setNewItem] = useState({
  name: '',
  price: '',
  category: 'Main',
  description: '',
  ingredients: '',
  is_available: true,
  image: null
});
const [workingHours, setWorkingHours] = useState([
  { day: "MONDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "TUESDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "WEDNESDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "THURSDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "22:00" },
  { day: "FRIDAY", is_closed: false, is_open_24h: false, open_time: "09:00", close_time: "23:00" },
  { day: "SATURDAY", is_closed: true, is_open_24h: false, open_time: null, close_time: null },
  { day: "SUNDAY", is_closed: true, is_open_24h: false, open_time: null, close_time: null },
]);
const [restaurantImages, setRestaurantImages] = useState([]); // لتخزين الصور المجلوبة
const [selectedFiles, setSelectedFiles] = useState([]); // لتخزين الملفات المحددة للرفع

// 1. جلب الصور
const fetchImages = async () => {
  try {
    const token = localStorage.getItem('access');
    const response = await axios.get('https://revvo-server.onrender.com/api/restaurant/images/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRestaurantImages(response.data);
  } catch (error) {
    console.error("خطأ في جلب الصور", error);
  }
};

// 2. رفع صور متعددة (Bulk)
const uploadImages = async () => {
  if (selectedFiles.length === 0) return alert("الرجاء اختيار صور أولاً");
  
  try {
    const token = localStorage.getItem('access');
    const formData = new FormData();
    
    // الحل الأكيد: إرسال الحقل كـ مصفوفة باستخدام [] في الاسم
    // بعض سيرفرات Django/Node تطلب هذا التنسيق لاستقبال القوائم
    selectedFiles.forEach((file) => {
      formData.append('images', file); 
    });

    await axios.post(
      'https://revvo-server.onrender.com/api/owner/restaurant/images/bulk',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // ملاحظة: لا تضع Content-Type يدوياً هنا، اترك Axios يتعامل معه مع الملفات
        }
      }
    );
    
    alert('تم رفع الصور بنجاح');
    setSelectedFiles([]); 
    fetchImages(); 
  } catch (error) {
    // لرؤية الخطأ الحقيقي من السيرفر في الـ Console
    console.log("Server Response:", error.response?.data);
    
    // إذا كان الخطأ متعلق بالحقول، سيظهر هنا
    const serverError = error.response?.data?.images ? "خطأ في صيغة الصور" : "فشل الرفع";
    alert(serverError);
  }
};

// 3. حذف صورة
const deleteImage = async (id) => {
  if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
  
  try {
    const token = localStorage.getItem('access');
    await axios.delete(`https://revvo-server.onrender.com/api/owner/restaurant/images/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchImages(); // تحديث القائمة بعد الحذف
  } catch (error) {
    alert('فشل الحذف');
  }
};
const handleHourChange = (index, field, value) => {
  const updatedHours = [...workingHours];
  updatedHours[index][field] = value;
  setWorkingHours(updatedHours);
};

const saveHours = async () => {
  try {
    const token = localStorage.getItem('access');

    // تنظيف البيانات قبل الإرسال حسب قواعد الـ API
    const cleanedHours = workingHours.map(item => {
      const isSpecial = item.is_closed || item.is_open_24h;
      return {
        ...item,
        // إذا كان مغلق أو 24 ساعة، نرسل null، وإلا نرسل الوقت المختار
        open_time: isSpecial ? null : item.open_time,
        close_time: isSpecial ? null : item.close_time,
      };
    });

    await axios.post( // تغيير إلى PUT حسب الـ API للتحديث
      'https://revvo-server.onrender.com/api/owner/restaurant/hours/',
      { days: cleanedHours },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert('تم حفظ ساعات العمل بنجاح');
  } catch (error) {
    console.error("Error Response:", error.response?.data);
    alert('فشل في حفظ الساعات: ' + (error.response?.data?.detail || 'خطأ في البيانات'));
  }
};
// 1. جلب المينيو عند فتح القسم
const fetchMenu = async () => {
  try {
    const response = await axios.get('https://revvo-server.onrender.com/api/restaurant/menu/');
    setMenuItems(response.data);
  } catch (error) {
    console.error("خطأ في جلب المينيو", error);
  }
};

// 2. إضافة وجبة جديدة
const addMenuItem = async () => {
  try {
    const token = localStorage.getItem('access');
    const formData = new FormData();
    
    // الـ API يتوقع List، لكن عند استخدام FormData مع ملفات، نرسلها كوجبة واحدة والسيرفر يعالجها
    formData.append('name', newItem.name);
    formData.append('price', newItem.price);
    formData.append('category', newItem.category);
    formData.append('description', newItem.description);
    formData.append('ingredients', newItem.ingredients);
    formData.append('is_available', newItem.is_available);
    if(newItem.image) formData.append('image', newItem.image);

    await axios.post(
      'https://revvo-server.onrender.com/api/owner/restaurant/menu/',
      formData, // ملاحظة: إذا أصر السيرفر على [List]، يجب تعديل الطريقة لـ JSON إذا لم يكن هناك صور، لكن مع الصور نستخدم FormData
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    alert('تمت إضافة الوجبة');
    fetchMenu(); // تحديث القائمة
  } catch (error) {
    alert('فشل إضافة الوجبة');
  }
};

// 3. حذف وجبة
const deleteItem = async (id) => {
  try {
    const token = localStorage.getItem('access');
    await axios.delete(`https://revvo-server.onrender.com/api/owner/restaurant/menu/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchMenu();
  } catch (error) {
    alert('فشل الحذف');
  }
};
// داخل دالة Dashboard()
const [restaurantData, setRestaurantData] = useState({
  name: '',
  about: '',
  category: '',
  address: '',
  lat: '',
  lon: '',
  phone_number: '',
  website: '',
  image: null
});

const handleRestaurantChange = (e) => {
  const { name, value, files, type } = e.target;
  setRestaurantData((prev) => ({
    ...prev,
    [name]: type === 'file' ? files[0] : value,
  }));
};

const updateRestaurant = async () => {
  try {
    const token = localStorage.getItem('access');
    const formData = new FormData();
    
    // إضافة كل الحقول للـ FormData
    Object.keys(restaurantData).forEach(key => {
      formData.append(key, restaurantData[key]);
    });

    await axios.put(
      'https://revvo-server.onrender.com/api/owner/restaurant/',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      }
    );
    alert('تم تحديث بيانات المطعم بنجاح');
  } catch (error) {
    console.error(error);
    alert('فشل التحديث');
  }
};
const [capacityData, setCapacityData] = useState({
  max_capacity: 60,
  slot_duration: 90,
  max_party_size: 10,
  auto_confirm: true
});

// دالة لجلب البيانات من السيرفر
const fetchCapacity = async () => {
  try {
    const token = localStorage.getItem('access');
    const response = await axios.get('https://revvo-server.onrender.com/api/owner/restaurant/capacity', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data) setCapacityData(response.data);
  } catch (error) {
    console.error("خطأ في جلب بيانات السعة", error);
  }
};

// دالة لحفظ أو تحديث البيانات
const saveCapacity = async () => {
  try {
    const token = localStorage.getItem('access');
    await axios.post(
      'https://revvo-server.onrender.com/api/owner/restaurant/capacity/',
      capacityData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('تم حفظ إعدادات السعة بنجاح');
  } catch (error) {
    alert('فشل في حفظ إعدادات السعة');
  }
};
  const sidebarItems = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'restaurant', label: 'معلومات المطعم' },
  { key: 'reservations', label: 'إدارة الحجوزات' },
  { key: 'hours', label: 'ساعات العمل' }, // تأكد من إضافة هذا السطر
  { key: 'capacity', label: 'السعة والحجز' },
  { key: 'license', label: 'الرخصة' },
  { key: 'images', label: 'صور المطعم' },
  { key: 'menu', label: 'المينيو' },
  { key: 'analytics', label: 'التحليلات' },
  
  { key: 'ai', label: 'AI Summary' },
];
const [reservations, setReservations] = useState([]);
const [rejectReason, setRejectReason] = useState("");
const [selectedResId, setSelectedResId] = useState(null);

// 1. جلب الحجوزات
const fetchReservations = async () => {
  try {
    const token = localStorage.getItem('access');
    const response = await axios.get('https://revvo-server.onrender.com/api/owner/restaurant/reservations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setReservations(response.data);
  } catch (error) {
    console.error("خطأ في جلب الحجوزات", error);
  }
};

// 2. تأكيد حجز
const confirmReservation = async (id) => {
  try {
    const token = localStorage.getItem('access');
    await axios.post(`https://revvo-server.onrender.com/api/owner/restaurant/reservations/${id}/confirm/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('تم تأكيد الحجز بنجاح');
    fetchReservations(); // تحديث القائمة
  } catch (error) {
    alert('فشل تأكيد الحجز');
  }
};

// 3. رفض حجز
const rejectReservation = async () => {
  if (!rejectReason) return alert("يرجى ذكر سبب الرفض");
  try {
    const token = localStorage.getItem('access');
    await axios.post(`https://revvo-server.onrender.com/api/restaurant/reservations/${selectedResId}/reject/`, 
      { reason: rejectReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('تم رفض الحجز');
    setRejectReason("");
    setSelectedResId(null);
    fetchReservations();
  } catch (error) {
    alert('فشل عملية الرفض');
  }
};
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

      <div className="row">
        <div className="col-md-6">
          <input name="name" className="form-control mb-3" placeholder="اسم المطعم" onChange={handleRestaurantChange} />
          <input name="category" className="form-control mb-3" placeholder="التصنيف (مثلاً: Italian)" onChange={handleRestaurantChange} />
          <input name="phone_number" className="form-control mb-3" placeholder="رقم الهاتف" onChange={handleRestaurantChange} />
          <input name="website" className="form-control mb-3" placeholder="الموقع الإلكتروني" onChange={handleRestaurantChange} />
        </div>
        <div className="col-md-6">
          <input name="address" className="form-control mb-3" placeholder="العنوان" onChange={handleRestaurantChange} />
          <div className="d-flex gap-2 mb-3">
            <input name="lat" className="form-control" placeholder="Lat" onChange={handleRestaurantChange} />
            <input name="lon" className="form-control" placeholder="Lon" onChange={handleRestaurantChange} />
          </div>
          <input type="file" name="image" className="form-control mb-3" onChange={handleRestaurantChange} />
        </div>
      </div>

      <textarea name="about" className="form-control mb-3" rows="4" placeholder="وصف المطعم" onChange={handleRestaurantChange}></textarea>

      <button className="btn btn-warning text-white fw-bold" onClick={updateRestaurant}>
        حفظ المعلومات
      </button>
    </div>
  );case 'reservations':
  return (
    <div className="card border-0 shadow-lg rounded-4 p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">طلبات الحجز الحالية</h3>
        <button className="btn btn-outline-warning btn-sm" onClick={fetchReservations}>تحديث البيانات 🔄</button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle text-center">
          <thead className="table-light">
            <tr>
              <th>اسم العميل</th>
              <th>التاريخ والوقت</th>
              <th>عدد الأفراد</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length > 0 ? reservations.map((res) => (
              <tr key={res.id}>
                <td className="fw-bold">{res.user_name || "عميل خارجي"}</td>
                <td>{new Date(res.reservation_datetime).toLocaleString('ar-EG')}</td>
                <td><span className="badge bg-secondary">{res.party_size} أشخاص</span></td>
                <td>
                  <span className={`badge ${res.status === 'confirmed' ? 'bg-success' : res.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                    {res.status === 'confirmed' ? 'مؤكد' : res.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                  </span>
                </td>
                <td>
                  {res.status === 'pending' && (
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-sm btn-success" onClick={() => confirmReservation(res.id)}>تأكيد</button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => setSelectedResId(res.id)}
                        data-bs-toggle="modal" 
                        data-bs-target="#rejectModal"
                      >رفض</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="text-muted py-4">لا توجد حجوزات حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal الرفض البسيط */}
      {selectedResId && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="fw-bold">سبب رفض الحجز</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedResId(null)}></button>
              </div>
              <div className="modal-body">
                <textarea 
                  className="form-control rounded-3" 
                  placeholder="مثال: المطعم محجوز بالكامل في هذا الوقت" 
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setSelectedResId(null)}>إلغاء</button>
                <button className="btn btn-danger px-4" onClick={rejectReservation}>تأكيد الرفض</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  case 'hours':
  return (
    <div className="card border-0 shadow-lg rounded-4 p-4">
      <h3 className="fw-bold mb-4">ساعات العمل</h3>
      <div className="table-responsive">
        <table className="table table-borderless align-middle">
          <thead>
            <tr className="text-muted">
              <th>اليوم</th>
              <th>مغلق؟</th>
              <th>24 ساعة؟</th>
              <th>يفتح من</th>
              <th>يغلق عند</th>
            </tr>
          </thead>
          <tbody>
            {workingHours.map((item, index) => (
              <tr key={item.day} className="border-bottom">
                <td className="fw-bold">{item.day}</td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={item.is_closed} 
                    onChange={(e) => handleHourChange(index, 'is_closed', e.target.checked)} 
                  />
                </td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={item.is_open_24h} 
                    onChange={(e) => handleHourChange(index, 'is_open_24h', e.target.checked)} 
                  />
                </td>
                <td>
                  <input 
                    type="time" 
                    className="form-control form-control-sm"
                    value={item.open_time || ''}
                    disabled={item.is_closed || item.is_open_24h}
                    onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="time" 
                    className="form-control form-control-sm"
                    value={item.close_time || ''}
                    disabled={item.is_closed || item.is_open_24h}
                    onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-warning text-white fw-bold mt-3" onClick={saveHours}>
        حفظ المواعيد
      </button>
    </div>
  );
  case 'capacity':
  return (
    <div className="card border-0 shadow-lg rounded-4 p-4">
      <h3 className="fw-bold mb-4">إعدادات السعة والحجز</h3>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">أقصى سعة للمطعم (شخص)</label>
          <input 
            type="number" 
            className="form-control" 
            value={capacityData.max_capacity}
            onChange={(e) => setCapacityData({...capacityData, max_capacity: e.target.value})}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">مدة الحجز (بالدقائق)</label>
          <input 
            type="number" 
            className="form-control" 
            value={capacityData.slot_duration}
            onChange={(e) => setCapacityData({...capacityData, slot_duration: e.target.value})}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">أكبر عدد أفراد للطاولة الواحدة</label>
          <input 
            type="number" 
            className="form-control" 
            value={capacityData.max_party_size}
            onChange={(e) => setCapacityData({...capacityData, max_party_size: e.target.value})}
          />
        </div>
        <div className="col-md-6 d-flex align-items-center">
          <div className="form-check form-switch mt-4">
            <input 
              className="form-check-input" 
              type="checkbox" 
              checked={capacityData.auto_confirm}
              onChange={(e) => setCapacityData({...capacityData, auto_confirm: e.target.checked})}
            />
            <label className="form-check-label ms-2">تأكيد الحجوزات تلقائياً</label>
          </div>
        </div>
      </div>
      <button className="btn btn-warning text-white fw-bold mt-4" onClick={saveCapacity}>
        حفظ الإعدادات
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
      <h3 className="fw-bold mb-4">معرض صور المطعم</h3>

      {/* منطقة الرفع */}
      <div className="bg-light p-4 rounded-4 mb-4 text-center border-2 border-dashed">
        <input
          type="file"
          multiple
          className="form-control mb-3"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
        />
        <button className="btn btn-warning text-white fw-bold px-5" onClick={uploadImages}>
          رفع {selectedFiles.length} صور مختارة
        </button>
      </div>

      {/* عرض الصور الحالية */}
      <div className="row g-3">
        {restaurantImages.length > 0 ? (
          restaurantImages.map((img) => (
            <div key={img.id} className="col-md-3">
              <div className="position-relative shadow-sm rounded-4 overflow-hidden group">
                <img 
                  src={img.image} 
                  alt="Restaurant" 
                  className="w-100" 
                  style={{ height: '180px', objectFit: 'cover' }} 
                />
                <button 
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 shadow"
                  onClick={() => deleteImage(img.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted py-5">لا توجد صور حالياً، ابدأ برفع بعض الصور!</div>
        )}
      </div>
    </div>
  );

     case 'menu':
  return (
    <div className="card border-0 shadow-lg rounded-4 p-4">
      <h3 className="fw-bold mb-4">إدارة المينيو</h3>

      {/* نموذج إضافة وجبة جديدة */}
      <div className="bg-light p-3 rounded-4 mb-4">
        <h5>إضافة وجبة جديدة</h5>
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control mb-2" placeholder="اسم الوجبة" onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
          </div>
          <div className="col-md-4">
            <input className="form-control mb-2" placeholder="السعر" onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
          </div>
          <div className="col-md-4">
            <select className="form-select mb-2" onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
              <option value="Main">Main</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Dessert">Dessert</option>
              <option value="Drink">Drink</option>
            </select>
          </div>
          <div className="col-12">
            <textarea className="form-control mb-2" placeholder="الوصف" rows="2" onChange={(e) => setNewItem({...newItem, description: e.target.value})}></textarea>
          </div>
          <div className="col-md-6">
            <input type="file" className="form-control mb-2" onChange={(e) => setNewItem({...newItem, image: e.target.files[0]})} />
          </div>
          <div className="col-md-6">
            <button className="btn btn-success w-100 fw-bold" onClick={addMenuItem}>إضافة للمينيو</button>
          </div>
        </div>
      </div>

      {/* عرض الوجبات الحالية */}
      <div className="table-responsive">
        <table className="table table-hover align-middle text-center">
          <thead className="table-dark">
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>السعر</th>
              <th>الفئة</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item.id}>
                <td><img src={item.image} alt={item.name} style={{width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover'}} /></td>
                <td>{item.name}</td>
                <td>{item.price}₪</td>
                <td>{item.category}</td>
                <td>
                   <span className={`badge ${item.is_available ? 'bg-success' : 'bg-danger'}`}>
                     {item.is_available ? 'متوفر' : 'غير متوفر'}
                   </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteItem(item.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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