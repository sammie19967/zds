import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Carousel.css';

import drivingCourseImage from '../assets/driving-course.png';
import computerCourseImage from '../assets/computer-course.png';
import industryCertifiedImage from '../assets/industry.jpg';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      image: drivingCourseImage,
      title: 'Driving Courses',
      description: 'Learn to drive confidently with our certified instructors and practical training.',
      bgColor: 'linear-gradient(135deg, #3498db, #2c3e50)',
      textColor: '#ffffff'
    },
    {
      image: computerCourseImage,
      title: 'Computer Courses',
      description: 'Gain essential computer skills for todays digital world with our expert-led courses.',
      bgColor: 'linear-gradient(135deg, #ff6b6b, #c0392b)',
      textColor: '#ffffff'
    },
    {
      image: industryCertifiedImage,
      title: 'Industry Certified',
      description: 'We provide the highest quality training for industry-recognized certifications.',
      bgColor: 'linear-gradient(135deg, #2980b9, #1a237e)',
      textColor: '#ffffff'
    }
  ];

  const buttonText = 'Join Now';

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  }, [slides.length]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextSlide, isAutoPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        setIsAutoPlaying(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  // Handle mouse enter/leave for auto-play pause
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="carousel-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="carousel-wrapper">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{ 
              background: slide.bgColor,
              transform: `translateX(-${currentIndex * 100}%)` 
            }}
          >
            <div className="slide-content">
              <div className="text-content">
                <h2 className="slide-title" style={{ color: slide.textColor }}>
                  {slide.title}
                </h2>
                <p className="slide-description" style={{ color: slide.textColor }}>
                  {slide.description}
                </p>
                <a href="/enroll" className="join-btn">
                  {buttonText}
                </a>
              </div>
              <div className="image-container">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="slide-image"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        className="carousel-nav-button prev"
        onClick={() => {
          prevSlide();
          setIsAutoPlaying(false);
        }}
        aria-label="Previous slide"
      >
        &#8249;
      </button>
      
      <button
        className="carousel-nav-button next"
        onClick={() => {
          nextSlide();
          setIsAutoPlaying(false);
        }}
        aria-label="Next slide"
      >
        &#8250;
      </button>

      {/* Slide Indicators */}
      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              goToSlide(index);
              setIsAutoPlaying(false);
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;