import { useState, useEffect } from 'react';
import '../styles/navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');

  // Handle scroll detection for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current page path for active link detection
  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when clicking on a link
  const handleLinkClick = (path) => {
    setActiveLink(path);
    setIsMenuOpen(false);
  };

  // Check if a link is active
  const isLinkActive = (path) => {
    if (path === '/') return activeLink === '/';
    return activeLink.startsWith(path);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo and Text */}
        <div className="navbar-logo-container" onClick={() => handleLinkClick('/')}>
          <img src={logo} alt="Zane Driving School Logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">Zane Driving School</span>
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <a 
            href="/" 
            className={isLinkActive('/') ? 'active' : ''}
            onClick={() => handleLinkClick('/')}
          >
            Home
          </a>
          
          <a 
            href="/about-us" 
            className={isLinkActive('/about-us') ? 'active' : ''}
            onClick={() => handleLinkClick('/about-us')}
          >
            About Us
          </a>
          
          <a 
            href="/enroll" 
            className={isLinkActive('/enroll') ? 'active' : ''}
            onClick={() => handleLinkClick('/enroll')}
          >
            Admission
          </a>
          
          {/* Courses Dropdown */}
          <div className="navbar-dropdown">
            <a 
              href="/courses" 
              className={`navbar-dropdown-link ${isLinkActive('/courses') ? 'active' : ''}`}
              onClick={() => handleLinkClick('/courses')}
            >
              Courses
            </a>
            <div className="navbar-dropdown-content">
              <a 
                href="/computing"
                onClick={() => handleLinkClick('/courses/computing')}
              >
                Computing
              </a>
              <a 
                href="/driving"
                onClick={() => handleLinkClick('/courses/driving')}
              >
                Driving Courses
              </a>
              <a 
                href="/feesStructure"
                onClick={() => handleLinkClick('/courses/feesStructure')}
              >
                Fees Structure
              </a>
            </div>
          </div>

          <a 
            href="/our-team" 
            className={isLinkActive('/our-team') ? 'active' : ''}
            onClick={() => handleLinkClick('/our-team')}
          >
            Our Team
          </a>
          
          <a 
            href="/contact-us" 
            className={isLinkActive('/contact-us') ? 'active' : ''}
            onClick={() => handleLinkClick('/contact-us')}
          >
            Contact Us
          </a>
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