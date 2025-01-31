import React, { useEffect, useState, useRef } from "react";
import "../styles/ParallaxOffers.css";

import newStudentImage from "../assets/newstudent.jpeg";
import refresherImage from "../assets/refresher.jpeg";
import endorsementImage from "../assets/endorsement.jpeg";
import computerImage from "../assets/computer.png";

const ParallaxOffers = () => {
  const offers = [
    {
      title: "New Student Offer",
      price: "Ksh 15000",
      description:
        "Join as a new student and receive professional driving lessons at an unbeatable price and highly qualified trainers, Get Free Computer Training.",
      image: newStudentImage,
    },
    {
      title: "Refresher Course",
      price: "Ksh 9000 only",
      description:
        "Enhance your driving skills and confidence with a specially designed refresher course.",
      image: refresherImage,
    },
    {
      title: "Endorsement Training",
      price: "from Ksh 9000 only",
      description:
        "Boost your qualifications with specialized endorsement training tailored for professionals.",
      image: endorsementImage,
    },
    {
      title: "Computer Packages",
      price: "Ksh 3000",
      description:
        "Learn essential computer skills to thrive in today's digital world with affordable courses.",
      image: computerImage,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRefs = useRef([]);

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
      { threshold: 0.5 } // Adjust this threshold as needed
    );

    containerRefs.current.forEach((ref) => ref && observer.observe(ref));

    return () => {
      containerRefs.current.forEach((ref) => ref && observer.unobserve(ref));
    };
  }, []);

  return (
    <div className="parallax-offers-container">
      {offers.map((offer, index) => (
        <div
          key={index}
          className={`parallax-container ${
            activeIndex === index ? "active" : ""
          }`}
          ref={(el) => (containerRefs.current[index] = el)}
        >
          {/* Parallax Image */}
          <div
            className="parallax-image"
            style={{
              backgroundImage: `url(${offer.image})`,
              backgroundPositionY:
                activeIndex === index ? `${(window.scrollY % 400) * 0.2}px` : "center",
            }}
          >
            <div className="image-overlay">
              <h2 className="offer-title">{offer.title}</h2>
              <p className="offer-price">{offer.price}</p>
              <div className="offer-buttons">
                <button className="join-us-button">Join Us</button>
                <button className="learn-more-button">Learn More</button>
              </div>
            </div>
          </div>

          {/* Description Divider */}
          <div className="description-divider">
            <p>{offer.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParallaxOffers;
