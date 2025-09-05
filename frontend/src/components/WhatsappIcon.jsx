import React from "react";
import "../styles/WhatsappIcon.css";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppIcon = () => {
  const phoneNumber = "0115820508";
  const whatsappLink = `https://wa.me/254${phoneNumber.slice(1)}`;



  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-icon-container"
    >
      <div className="chat-bubble">Reach Us Out for more info</div>
      <FaWhatsapp className="whatsapp-icon" />
    </a>
  );
};

export default WhatsAppIcon;
