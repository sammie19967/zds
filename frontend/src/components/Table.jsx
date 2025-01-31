import React from 'react';
import '../styles/Table.css'; // Import the styles for the table

const Table = ({ data }) => {
   
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const pdfUrl = '/feesstructure.pdf'; 

  return (
    <div className="table-container">
      <h2>Fees Structure</h2>
      <p>{currentMonth} Intake in Progress</p>
      
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Class</th>
            <th>Description</th>
            <th>Duration</th>
            <th>Fees</th>
            
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.type}</td>
              <td>{item.class}</td>
              <td>{item.description}</td>
              <td>{item.duration}</td>
              <td>{item.fees}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <a href={pdfUrl} className="download-btn" download>
        Download the Fees Structure
      </a>

      <div className="contact-section">
        <p>Contact us for more information: <a href="mailto:info@zbs.com">info@zbs.com</a></p>
      </div>
    </div>
  );
};

export default Table;
