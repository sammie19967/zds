import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Carousel.css';

import drivingCourseImage from '../assets/probox front.jpg';
import computerCourseImage from '../assets/driving-course.png';
import industryCertifiedImage from '../assets/industry.jpg';

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
    description: "Gain essential computer skills for today's digital world with our expert-led courses.",
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

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextSlide, isAutoPlaying]);

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

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div
      className="carousel-container carousel-root"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="carousel-wrapper"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{ background: slide.bgColor }}
          >
            <div className="slide-content">
              <div className="text-content">
                <h2 className="slide-title" style={{ color: slide.textColor }}>
                  {slide.title}
                </h2>
                <p className="slide-description" style={{ color: slide.textColor }}>
                  {slide.description}
                </p>
                <Link to="/enroll" className="join-btn">
                  Join Now
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="image-container">
                <img
                  src={slide.image}
                  alt={`${slide.title} at Zane Driving School`}
                  className="slide-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
