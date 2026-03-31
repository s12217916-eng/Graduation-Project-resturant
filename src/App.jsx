import React from 'react'
import { Routes, Route, ScrollRestoration } from 'react-router-dom' // استيراد عادي
import ResturantDetails from './ResturantDetails/ResturantDetails'; // استيراد الصفحة الجديدة
import Navbar from './Navbar/Navbar'
import Footer from './assets/Footer/Footer'
import AboutUs from './Aboutus/AboutUs'
import ContactUs from './ContactUs/ContactUs'
import Login from './assets/Login/Login'
import Register from './assets/Register/Register'
import Hero from './Hero/Hero'
import Reservation from '../src/assets/Reservation/Reservation'
import Resturant from '../src/assets/Resturant/Resturant'
import RatingForm from './RatingForm/RatingForm'
import Chatbot from './Chatbot/Chatbot'
function App() {
  return (
    <>
      {/* 1. السكرول ريستوريشن مكانه هون برا الـ Routes */}
      {/* ملاحظة: إذا ما اشتغل معك هون، استخدم حل الـ useEffect اللي عطيته إياك سابقاً داخل صفحة Resturant */}
      
      <Navbar />
      <Routes>
        {/* 2. صفحة الهوم هي اللي لازم تحتوي على الـ Hero */}
        <Route path="/" element={<Hero />} />
        import ResturantDetails from './assets/Resturant/ResturantDetails'; // استيراد الصفحة الجديدة


<Route path="/resturant/:id" element={<ResturantDetails />} />
        {/* 3. باقي الصفحات رح تفتح نظيفة بدون ما يكون الـ Hero فوقها */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/resturant" element={<Resturant />} />
        <Route path="/ratingform" element={<RatingForm />} />
      </Routes>

      <Chatbot />
      <Footer />
    </>
  )
}

export default App;