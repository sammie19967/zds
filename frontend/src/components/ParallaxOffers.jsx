import  { useEffect, useState, useRef } from "react";
import { Link } from 'react-router-dom';
import "../styles/ParallaxOffers.css";

import newStudentImage from "../assets/newstudent.jpeg";
import refresherImage from "../assets/probox back.jpg";
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
  useEffect(() => {
    const nodes = containerRefs.current;
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

    nodes.forEach((ref) => ref && observer.observe(ref));

    return () => {
      nodes.forEach((ref) => ref && observer.unobserve(ref));
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
                <Link className="join-us-button" to="/enroll">
                  Join Now
                </Link>
                <Link className="learn-more-button" to="/courses">
                  View Courses
                </Link>
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
