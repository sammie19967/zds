import React from 'react';
import '../styles/WhyChooseUs.css';


import { FaCar, FaLaptopCode, FaUserShield, FaCertificate } from 'react-icons/fa';

const WhyChooseUs = () => {
  const features = [
    {
      icon: <FaCar />,
      title: 'Expert Driving Instructors',
      description: 'Learn from certified and experienced professionals who prioritize your safety and skill development.',
    },
    {
      icon: <FaLaptopCode />,
      title: 'Cutting-Edge Computer Courses',
      description: 'Gain essential computer skills with our industry-standard curriculum and hands-on training.',
    },
    {
      icon: <FaUserShield />,
      title: 'Personalized Support',
      description: 'We are here to guide you at every step, from admission to certification, ensuring a smooth journey.',
    },
    {
      icon: <FaCertificate />,
      title: 'Industry Certifications',
      description: 'Achieve recognized certifications that open doors to numerous career opportunities.',
    },
  ];

  return (
    <div className="whychooseus-container">
      <h2 className="section-title">Why Choose Us?</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="icon-wrapper">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhyChooseUs;
