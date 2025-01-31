import React from "react";
import "../styles/Refresher.css"; // Import CSS file
import refresherImage from "../assets/alice.jpg"; // Replace with actual image path

const Refresher = () => {
  return (
    <div className="refresher-container">
      <div className="refresher-content">
        <h2>🚗 Endorsement & Refresher Course</h2>
        <p>
          Do you need to **refresh your driving skills** or get an endorsement for a 
          higher category license? Our **Refresher Course** is designed for both 
          licensed drivers who need more confidence and those upgrading their driving 
          licenses.
        </p>

        <ul className="refresher-list">
          <li>✔️ Improve your driving confidence</li>
          <li>✔️ Get an endorsement for a higher category</li>
          <li>✔️ Learn defensive driving techniques</li>
          <li>✔️ Update your knowledge on new traffic laws</li>
          <li>✔️ Hands-on driving practice with certified instructors</li>
        </ul>

        <div className="refresher-price">💰 Only Ksh 9,000</div>

        <div className="refresher-buttons">
          <button className="apply-button">Apply Now</button>
          <button className="catalog-button">View More</button>
        </div>
      </div>

      <div className="refresher-image">
        <img src={refresherImage} alt="Refresher Course" />
      </div>
    </div>
  );
};

export default Refresher;
