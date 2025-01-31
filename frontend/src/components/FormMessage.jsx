import React from "react";
import "../styles/FormMessage.css"; // Import CSS file

const FormMessage = () => {
  return (
    <div className="thank-you-container">
      <div className="content">
        <h2>Thank You for Choosing Zane Driving School</h2>
        <p>We value your privacy and guarantee that your data will remain private and secure.</p>
        <button className="cta-button">Fill in the form below</button>
      </div>

      <svg className="wave-bottom" viewBox="0 0 120 28" preserveAspectRatio="none">
        <path d="M0 0 Q 30 25, 60 5 Q 90 25, 120 0 L 120 28 L 0 28 Z" fill="#ffffff"></path>
      </svg>
    </div>
  );
};

export default FormMessage;
