import React, { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles/ContactHeader.css';

const ContactHeader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle scroll to show/hide header
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`contact-header ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="contact-header-container">
        <div className="contact-info">
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <a href="tel:+254715820508">+254 715 820 508</a>
            <span className="separator">|</span>
            <a href="tel:+254715820509">+254 715 820 509</a>
          </div>
          
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <a href="mailto:zanedrivingschool2022@gmail.com">zanedrivingschool2022@gmail.com</a>
          </div>
          
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <span>Mercy Njeri, Kabarak Road, Nakuru</span>
          </div>
        </div>
        
        <div className="header-utils">
          <div className="current-time">
            <FaClock className="time-icon" />
            <span>{formatTime(currentTime)}</span>
          </div>
          
          <div className="working-hours">
            <span>Mon-Fri: 8AM-5PM | Sat: 9AM-2PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactHeader;