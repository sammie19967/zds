import  { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/ParallaxOffers.css";

import newStudentImage from "../assets/newstudent.jpeg";
import refresherImage from "../assets/refresher.jpeg";
import endorsementImage from "../assets/endorsement.jpeg";
import computerImage from "../assets/computer.png";

const ParallaxOffers = () => {
  const offers = [
    {
      title: "New Student Offer",
      price: "Ksh. 15,000",
      description: "Join as a new student and receive professional driving lessons at an unbeatable price and highly qualified trainers, Get Free Computer Training.",
      image: newStudentImage,
      bgGradient: "linear-gradient(135deg, #3498db, #2c3e50)",
    },
    {
      title: "Refresher Course",
      price: "Ksh. 9,000 ",
      description: "Enhance your driving skills and confidence with a specially designed refresher course.",
      image: refresherImage,
      bgGradient: "linear-gradient(135deg, #ff6b6b, #c0392b)",
    },
    {
      title: "Endorsement Training",
      price: "Ksh 9,000 ",
      description: "Boost your qualifications with specialized endorsement training tailored for professionals.",
      image: endorsementImage,
      bgGradient: "linear-gradient(135deg, #2980b9, #1a237e)",
    },
    {
      title: "Computer Packages",
      price: "Ksh. 3,000",
      description: "Learn essential computer skills to thrive in today's digital world with affordable courses.",
      image: computerImage,
      bgGradient: "linear-gradient(135deg, #9b59b6, #8e44ad)",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = containerRefs.current.indexOf(entry.target);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    containerRefs.current.forEach((ref) => ref && observer.observe(ref));

    return () => {
      containerRefs.current.forEach((ref) => ref && observer.unobserve(ref));
    };
  }, []);

  return (
    <div className="parallax-offers-container">
      <div className="parallax-offers-header">
        <h2>Special Offers</h2>
        <p>Discover our exclusive training programs designed for your success</p>
      </div>
      
      {offers.map((offer, index) => (
        <div
          key={index}
          className={`parallax-offer-item ${activeIndex === index ? "active" : ""}`}
          ref={(el) => (containerRefs.current[index] = el)}
          style={{ background: offer.bgGradient }}
        >
          <div className="parallax-content-wrapper">
            {/* Text Content */}
            <div className="offer-text-content">
              <h3 className="offer-title">{offer.title}</h3>
              <div className="price-tag">
                <span className="offer-price">{offer.price}</span>
              </div>
              <p className="offer-description">{offer.description}</p>
              <div className="offer-buttons">
                <button 
                  className="join-us-button"
                  onClick={() => navigate('/enroll')}
                >
                  Join Now
                </button>
                <button 
                  className="learn-more-button"
                  onClick={() => navigate('/courses')}
                >
                  View Courses
                </button>
              </div>
            </div>

            {/* Parallax Image */}
            <div className="parallax-image-container">
              <div 
                className="parallax-image"
                style={{ 
                  backgroundImage: `url(${offer.image})`,
                }}
              />
              <div className="image-overlay"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParallaxOffers;