import { useMemo } from "react";
import PropTypes from "prop-types";
import "../styles/WhatsappIcon.css";
import { FaWhatsapp } from "react-icons/fa";

/**
 * Floating WhatsApp action button
 * - Unique class names to avoid CSS conflicts
 * - Accessible (aria-label, keyboard support)
 * - Prefilled message includes current page
 */
const WhatsAppIcon = ({ phone = "0115820508", message = "Hello Zane Driving School! I’d like to know more about your courses." }) => {
  const encodedLink = useMemo(() => {
    const isLocal = typeof window !== "undefined";
    const page = isLocal ? window.location.pathname : "/";
    const fullMessage = `${message} (From: ${page})`;
    const urlMessage = encodeURIComponent(fullMessage);
    const intlPhone = `254${phone.replace(/\D/g, "").replace(/^0/, "")}`; // normalize to 254XXXXXXXXX
    return `https://wa.me/${intlPhone}?text=${urlMessage}`;
  }, [phone, message]);

  return (
    <a
      href={encodedLink}
      target="_blank"
      rel="noopener noreferrer"
      className="zane-whatsapp-container"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.currentTarget.click();
        }
      }}
    >
      <div className="zane-whatsapp-badge" aria-hidden="true">
        <span className="zane-badge-emoji" role="img" aria-label="sparkles">✨</span>
        Chat
      </div>
      <div className="zane-chat-bubble" aria-hidden="true">Have a question? Chat with us</div>
      <span className="zane-whatsapp-ring" aria-hidden="true" />
      <FaWhatsapp className="zane-whatsapp-icon" />
    </a>
  );
};

export default WhatsAppIcon;

WhatsAppIcon.propTypes = {
  phone: PropTypes.string,
  message: PropTypes.string,
};
