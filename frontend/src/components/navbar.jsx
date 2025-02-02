import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import '../styles/Navbar.css'; // Import styles
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
        
        {/* Navigation Links */}
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}>Home</NavLink>
          <NavLink to="/about-us" className={({ isActive }) => isActive ? "active-link" : ""}>About Us</NavLink>
          <NavLink to="/enroll" className={({ isActive }) => isActive ? "active-link" : ""}>Admission</NavLink>

          {/* Courses Dropdown */}
          <div className="navbar-dropdown">
            <NavLink to="/courses" className={({ isActive }) => isActive ? "active-link navbar-dropdown-link" : "navbar-dropdown-link"}>Courses</NavLink>
            <div className="navbar-dropdown-content">
              <NavLink to="/courses/computer-courses" className={({ isActive }) => isActive ? "active-link" : ""}>Computing</NavLink>
              <NavLink to="/courses/driving-courses" className={({ isActive }) => isActive ? "active-link" : ""}>Driving Courses</NavLink>
            </div>
          </div>

          <NavLink to="/our-team" className={({ isActive }) => isActive ? "active-link" : ""}>Our Team</NavLink>
          <NavLink to="/contact-us" className={({ isActive }) => isActive ? "active-link" : ""}>Contact Us</NavLink>
        </div>

        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
