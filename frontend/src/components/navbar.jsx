import React, { useState } from 'react';
import '../styles/navbar.css';  // Importing the navbar styles
import logo from '../assets/logo.png'; // Import the logo

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and Text */}
        <div className="navbar-logo-container">
          <img src={logo} alt="Zane Driving School Logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">Zane Driving School</span>
        </div>
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="/">Home</a>
          <a href="/about-us">About Us</a>
          <a href="/enroll">Admission</a>
          
          {/* Courses Dropdown */}
          <div className="navbar-dropdown">
            <a href="/courses" className="navbar-dropdown-link">Courses</a>
            <div className="navbar-dropdown-content">
              <a href="/courses/computer-courses">Computing</a>
              <a href="/courses/driving-courses">Driving Courses</a>
            </div>
          </div>

          <a href="/our-team">Our Team</a>
          <a href="/contact-us">Contact Us</a>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
