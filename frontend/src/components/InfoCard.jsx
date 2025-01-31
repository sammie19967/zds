import React from 'react';
import '../styles/InfoCard.css';

const Card = ({ title, content, backgroundColor }) => {
  return (
    <div className="card" style={{ backgroundColor }}>
      <h2>{title}</h2>
      <div className="card-content">
        {content}
      </div>
    </div>
  );
};

export default Card;
