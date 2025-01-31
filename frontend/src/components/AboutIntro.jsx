import React, { useState, useEffect } from "react";
import { FaUserPlus, FaBook, FaDollarSign } from "react-icons/fa";
import "../styles/AboutIntro.css";

const AboutIntro = () => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loop, setLoop] = useState(0);
  const typingSpeed = 150;
  const deletingSpeed = 100;
  const delayAfterTyping = 10000; // 10 seconds delay after typing

  const messages = [
    "Welcome to Zane Driving School",
    "Learn to Drive with Confidence",
    "Excel in Computer Skills",
  ];

  useEffect(() => {
    const handleTyping = () => {
      const currentMessage = messages[loop % messages.length];
      const updatedText = isDeleting
        ? currentMessage.substring(0, text.length - 1)
        : currentMessage.substring(0, text.length + 1);

      setText(updatedText);

      if (!isDeleting && updatedText === currentMessage) {
        setTimeout(() => setIsDeleting(true), delayAfterTyping);
      } else if (isDeleting && updatedText === "") {
        setIsDeleting(false);
        setLoop(loop + 1);
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loop, messages]);

  return (
    <div className="about-intro">
      <div className="overlay">
        <h1 className="typewriter">{text}</h1>
        <p className="intro-text">
          At <strong>Zane Driving School and Computing</strong>, we provide 
          <span className="highlight"> expert driving lessons</span> and 
          <span className="highlight"> cutting-edge computer skills</span> to help you excel.
        </p>
        <div className="button-container">
          <button className="action-button join-us">
            <FaUserPlus className="button-icon" />
            Join Us
          </button>
          <button className="action-button catalogue">
            <FaBook className="button-icon" />
            Catalogue
          </button>
          <button className="action-button fees-structure">
            <FaDollarSign className="button-icon" />
            Fees Structure
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutIntro;
