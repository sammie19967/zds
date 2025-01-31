import React from "react";
import "../styles/WhatsappIcon.css";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppIcon = () => {
  const phoneNumber = "0725713192";
  const whatsappLink = `https://wa.me/254${phoneNumber.slice(1)}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-icon-container"
    >
      <div className="chat-bubble">Reach Us Out</div>
      <FaWhatsapp className="whatsapp-icon" />
    </a>
  );
};

export default WhatsAppIcon;
