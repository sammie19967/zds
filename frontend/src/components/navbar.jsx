import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when clicking on a link
  const handleLinkClick = () => setIsMenuOpen(false);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo and Text */}
        <Link
          to="/"
          className="navbar-logo-container"
          onClick={handleLinkClick}
          aria-label="Go to home"
        >
          <img src={logo} alt="Zane Driving School Logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">Zane Driving School</span>
        </Link>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink to="/" end onClick={handleLinkClick} className={({ isActive }) => isActive ? 'active' : undefined}>
            Home
          </NavLink>

          <NavLink to="/about-us" onClick={handleLinkClick} className={({ isActive }) => isActive ? 'active' : undefined}>
            About Us
          </NavLink>

          <NavLink to="/enroll" onClick={handleLinkClick} className={({ isActive }) => isActive ? 'active' : undefined}>
            Admission
          </NavLink>

          {/* Courses Dropdown */}
          <div className="navbar-dropdown">
            <NavLink 
              to="/courses" 
              onClick={handleLinkClick}
              className={({ isActive }) => `navbar-dropdown-link ${isActive ? 'active' : ''}`}
            >
              Courses
            </NavLink>
            <div className="navbar-dropdown-content">
              <Link to="/computing" onClick={handleLinkClick}>Computing</Link>
              <Link to="/driving" onClick={handleLinkClick}>Driving Courses</Link>
              <Link to="/feesStructure" onClick={handleLinkClick}>Fees Structure</Link>
            </div>
          </div>

          <NavLink to="/our-team" onClick={handleLinkClick} className={({ isActive }) => isActive ? 'active' : undefined}>
            Our Team
          </NavLink>

          <NavLink to="/contact-us" onClick={handleLinkClick} className={({ isActive }) => isActive ? 'active' : undefined}>
            Contact Us
          </NavLink>
        </div>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;