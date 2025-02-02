import React, { useState, useEffect } from 'react';
import '../styles/Carousel.css';

import drivingCourseImage from '../assets/driving-course.png';
import computerCourseImage from '../assets/computer-course.png';
import industryCertifiedImage from '../assets/industry.jpg';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    drivingCourseImage,
    computerCourseImage,
    industryCertifiedImage,
  ];

  const overlayTexts = [
    'Driving Courses',
    'Computer Courses',
    'Industry Certified',
  ];

  const overlayDescriptions = [
    'Learn to drive confidently with our certified instructors and practical training.',
    'Gain essential computer skills for today’s digital world with our expert-led courses.',
    'We provide the highest quality training for industry-recognized certifications.',
  ];

  const buttonText = 'Join Now';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel-container">
      <div className="carousel-image-container">
        <img
          src={images[currentIndex]}
          alt={overlayTexts[currentIndex]}
          className="carousel-image"
        />
      </div>
      <div className="carousel-overlay">
        <h2 className="carousel-title">{overlayTexts[currentIndex]}</h2>
        <p className="carousel-description">{overlayDescriptions[currentIndex]}</p>
        <a href="/admissions" className="join-btn">
          {buttonText}
        </a>
      </div>
    </div>
  );
};

export default Carousel;
