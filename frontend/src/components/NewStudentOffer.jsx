import React from "react";
import "../styles/NewStudentOffer.css"; // Import the CSS file
import offerImage from "../assets/newstudent.jpeg"; // Replace with actual image path

const NewStudentOffer = () => {
  return (
    <div className="offer-container">
      <div className="offer-content">
        <h2>🚗 Special New Student Offer! 🎉</h2>
        <p>
          Kickstart your driving journey with Zane Driving School! For only <strong>Ksh 15,000</strong>, 
          you’ll receive expert driving lessons PLUS a <strong>FREE computer package</strong> to boost your skills. 
          Don't miss this limited-time offer—apply today!
        </p>
        <div className="offer-price">💰 Only Ksh 15,000</div>
        <div className="offer-bonus">🎁 Free Computer Package Included!</div>
        <div className="offer-buttons">
          <button className="apply-button">Apply Now</button>
          <button className="catalog-button">View Catalog</button>
        </div>
      </div>
      <div className="offer-image">
        <img src={offerImage} alt="New Student Offer" />
      </div>
    </div>
  );
};

export default NewStudentOffer;
