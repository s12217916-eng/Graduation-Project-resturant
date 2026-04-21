import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import Footer from './assets/Footer/Footer'
import AboutUs from './Aboutus/AboutUs'
import ContactUs from './ContactUs/ContactUs'
import Login from './assets/Login/Login'
import Register from './assets/Register/Register'
import Hero from './Hero/Hero'
import Reservation from './assets/Reservation/Reservation'
import Resturant from './assets/Resturant/Resturant'
import RestaurantDetails from './ResturantDetails/ResturantDetails'
import RatingForm from './RatingForm/RatingForm'
import Chatbot from './Chatbot/Chatbot'
import MyReservation from './MyReservation/MyReservation'
import Profile from './Profile/Profile';
import Dashboard from './dashboard/Dashboard';
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        
        {/* التعديل هون: ضفنا :id عشان صفحة الحجز تستقبل رقم المطعم */}
        <Route path="/reservation/:id" element={<Reservation />} />
        
        <Route path="/resturant" element={<Resturant />} />
        <Route path="/resturant/:id" element={<RestaurantDetails />} />
        
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
       <Route path="/ratingform/:id" element={<RatingForm />} />
        <Route path="/myreservations" element={<MyReservation />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Chatbot />
      <Footer />
    </>
  )
}

export default App;