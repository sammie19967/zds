import  { useState } from 'react';
import '../styles/CampusLocations.css';

const CampusLocations = () => {
  const [activeLocation, setActiveLocation] = useState('nakuru');

  const locations = {
    nakuru: {
      name: 'Nakuru',
      address: 'Mercy Njeri, Kabarak Road, Nakuru',
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7824944727145!2d36.00234295231203!3d-0.24280619912452353!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x18298cab50774329%3A0x7f4185b6981dde32!2sZane%20Driving%20School!5e0!3m2!1sen!2ske!4v1757279878497!5m2!1sen!2ske",
      description: "Our main campus located along Nakuru-Sigor road, offering comprehensive driving and computer training programs."
    },
    kwa_gitau: {
      name: 'Kwa Gitau',
      address: 'Kwa Gitau, Nakuru County, Kenya',
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1413.054485134613!2d36.01094509758654!3d-0.16931658786393933!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1829f107b91364a7%3A0xc4d0af1dc83e8a54!2sKwa%20Gitau%20center!5e1!3m2!1sen!2ske!4v1757280062269!5m2!1sen!2ske",
      description: "Our satellite campus in Kwa Gitau, providing convenient access to quality training for local communities."
    },
    kericho: {
      name: 'Kericho',
      address: 'Kericho Town, Kenya',
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.755!2d35.2831!3d-0.3671!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMjInMDEuNiJTIDM1wrAxNid1OS4xIkU!5e0!3m2!1sen!2ske!4v1693920000002!5m2!1sen!2ske",
      description: "Our newest branch in Kericho, bringing professional training services to the tea capital of Kenya."
    }
  };

  const handleLocationChange = (locationKey) => {
    setActiveLocation(locationKey);
  };

  return (
    <div className="campus-locations-container">
      <div className="campus-header">
        <h2>Our Campuses</h2>
        <p>Visit any of our conveniently located campuses for quality training</p>
      </div>

      <div className="campus-navigation">
        <div className="campus-menu">
          <button
            className={`campus-menu-item ${activeLocation === 'nakuru' ? 'active' : ''}`}
            onClick={() => handleLocationChange('nakuru')}
          >
            <span className="campus-menu-text">Nakuru</span>
            <div className="campus-menu-indicator"></div>
          </button>
          
          <button
            className={`campus-menu-item ${activeLocation === 'kwa_gitau' ? 'active' : ''}`}
            onClick={() => handleLocationChange('kwa_gitau')}
          >
            <span className="campus-menu-text">Kwa Gitau</span>
            <div className="campus-menu-indicator"></div>
          </button>
          
          <button
            className={`campus-menu-item ${activeLocation === 'kericho' ? 'active' : ''}`}
            onClick={() => handleLocationChange('kericho')}
          >
            <span className="campus-menu-text">Kericho</span>
            <div className="campus-menu-indicator"></div>
          </button>
        </div>
      </div>

      <div className="campus-content">
        <div className="campus-info-card">
          <div className="campus-details">
            <h3 className="campus-name">{locations[activeLocation].name} Campus</h3>
            <p className="campus-address">📍 {locations[activeLocation].address}</p>
            <p className="campus-description">{locations[activeLocation].description}</p>
            
            <div className="campus-contact-info">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span className="contact-text">Call us for directions</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕐</span>
                <span className="contact-text">Open Monday - Saturday</span>
              </div>
            </div>
            
            <button className="visit-campus-btn">
              Get Directions
            </button>
          </div>
          
          <div className="campus-map-container">
            <iframe
              src={locations[activeLocation].embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${locations[activeLocation].name} Campus Location`}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusLocations;