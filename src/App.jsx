import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import Footer from './assets/Footer/Footer'
import AboutUs from './Aboutus/AboutUs'
import ContactUs from './ContactUs/ContactUs'
import Login from './assets/Login/Login'
import Register from './assets/Register/Register'
import Hero from './Hero/Hero'
import Resturant from './assets/Resturant/Resturant'
import RestaurantDetails from './ResturantDetails/ResturantDetails'
import RatingForm from './RatingForm/RatingForm'
import Chatbot from './Chatbot/Chatbot'
import MyReservation from './MyReservation/MyReservation'
import Profile from './Profile/Profile';
import Dashboard from './dashboard/Dashboard';
import Home from './Home/Home'
import RegisterChoice from './RegisterChoice/RegisterChoice'
import SavedRestaurants from './SavedRestaurants/SavedRestaurants'
import MyReviews from './MyReviews/MyReviews'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/resturant" element={<Resturant />} />
        <Route path="/resturant/:id" element={<RestaurantDetails />} />
        
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerchoice" element={<RegisterChoice />} />
       <Route path="/ratingform/:id" element={<RatingForm />} />
        <Route path="/myreservations" element={<MyReservation />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register/:roleType" element={<Register />} />
        <Route path="/saved-restaurants" element={<SavedRestaurants />} />
      </Routes>
      <Chatbot />
      <Footer />
    </>
  )
}

export default App;