import React from 'react';
import '../styles/NewDriverOffer.css';
import newDriverImage from '../assets/driving-course.png'; 

const NewDriverOffer = () => {
  return (
    <div className="new-driver-offer-container">
      <div className="offer-image">
        <img src={newDriverImage} alt="New Driver Offer" />
      </div>
      <div className="offer-content">
        <h2>Special Offer for New Drivers</h2>
        <p>
          Kickstart your driving journey with our comprehensive beginner's driving course! 
          Learn essential skills, traffic rules, and road safety practices from certified instructors.
        </p>
        <p className="offer-price">Price: <span>Ksh 1500</span></p>
        <a href="/catalogue" className="offer-button">View Full Catalogue</a>
      </div>
    </div>
  );
};

export default NewDriverOffer;
