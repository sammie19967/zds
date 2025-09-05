import React, { useState } from "react";
import "../styles/FeesStructure.css";
import { FaDownload, FaQuestionCircle, FaChevronDown, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FeesStructure = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fees");
  const [openQuestion, setOpenQuestion] = useState(null);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const feesData = [
    { type: "New Student", class: "A1/A2", duration: "4 weeks", fees: "15,000", description: "Motorbike/Tuktuk" },
    { type: "Endorsement", class: "A1/A2", duration: "4 weeks", fees: "5,000", description: "" },
    { type: "New Student", class: "B1/B2", duration: "4 weeks", fees: "15,000", description: "Saloon Car" },
    { type: "Endorsement", class: "B1/B2", duration: "4 weeks", fees: "9,000", description: "" },
    { type: "Refresher", class: "B1/B2", duration: "3 weeks", fees: "9,050", description: "" },
    { type: "Endorsement", class: "C1/C2", duration: "4 weeks", fees: "9,000", description: "Trucks" },
    { type: "Endorsement", class: "D1/D2", duration: "4 weeks", fees: "9,000", description: "PSV" },
    { type: "Computer", class: "Beginner", duration: "2 months", fees: "3,000", description: "All Packages" },
    { type: "Computer", class: "Intermediate", duration: "2 months", fees: "6,000", description: "Advanced Units" },
    { type: "Boarding", class: "B/A", duration: "4 weeks", fees: "21,000", description: "Accommodation" }
  ];

  const faqData = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers. Our payment details are provided upon registration."
    },
    {
      question: "Are there any additional fees?",
      answer: "The fees listed include training materials, instruction, PDL and Test Booking fees. Additional costs are Interim and Smart DL wich you pay directly to NTSA."
    },
    {
      question: "Do you accept payment in installments?",
      answer: "Yes, we accept any payments from ksh.5,000 until payment is completed."
    },
    {
      question: "What requirements are needed?",
      answer: "You need to have a valid passport, a valid national identity card, and a valid driving license(For Endorsement)."
    },
    {
      question: "Do I need to bring my own vehicle?",
      answer: "No, we provide all training vehicles for your lessons. You'll train using our well-maintained vehicles."
    },
    {
      question: "How long does the DL processing take?",
      answer: "After completing training, and passing the exam, results will reflect on your NTSA account within 1 week.After which you can pay for your Interim and finally your Final DL."
    }
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  // Function to load image as base64
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleDownload = async () => {
    try {
      // Import jsPDF and jspdf-autotable using dynamic imports
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      
      // Try to load and add logo
      try {
        const logoUrl = '/src/assets/logo.png';
        const logoData = await loadImageAsBase64(logoUrl);
        
        if (logoData) {
          // Add logo to PDF (adjust size and position as needed)
          doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
          // Adjust title position based on logo
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(44, 62, 80);
          doc.text('ZANE DRIVING SCHOOL', pageWidth / 2, 25, { align: 'center' });
        } else {
          // If logo fails to load, show title only
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(44, 62, 80);
          doc.text('ZANE DRIVING SCHOOL', pageWidth / 2, 25, { align: 'center' });
        }
      } catch (error) {
        console.error('Error loading logo:', error);
        // Fallback to title only if logo fails to load
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('ZANE DRIVING SCHOOL', pageWidth / 2, 25, { align: 'center' });
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('Fees Structure', pageWidth / 2, 35, { align: 'center' });
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${currentMonth} ${currentYear}`, pageWidth - margin, 35, { align: 'right' });
      
      // Add a line under the header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 45, pageWidth - margin, 45);
      
      // Define table columns
      const tableColumn = ['Course Type', 'Class', 'Duration', 'Fees (Ksh)'];
      
      // Format table data and include descriptions as subtext
      const tableRows = feesData.map(item => [
        { content: item.type, styles: { fontStyle: 'bold' } },
        item.class,
        item.duration,
        { content: item.fees, styles: { halign: 'right' } }
      ]);
      
      // Add the table with improved styling
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60, // Start table further down to accommodate logo
        margin: { 
          left: margin, 
          right: margin,
          top: 10
        },
        tableWidth: 'auto',
        styles: {
          fontSize: 10,
          cellPadding: 6,
          valign: 'middle',
          overflow: 'linebreak',
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          minCellHeight: 12,
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.3,
          lineColor: [255, 255, 255]
        },
        bodyStyles: {
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 'auto', halign: 'center' },
          2: { cellWidth: 'auto', halign: 'center' },
          3: { cellWidth: 'auto', halign: 'right' }
        },
        didDrawPage: function(data) {
          // Footer with page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });
      
      // Add contact information with better spacing
      const finalY = Math.max(doc.lastAutoTable.finalY + 15, 250);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text('Contact Information:', margin, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text('Phone: 0115820508', margin, finalY + 7);
      doc.text('Email: zanedrivingschool2022@gmail.com', margin, finalY + 14);
      doc.text('Location: Mercy Njeri along Kabarak Road, Nakuru, Kenya', margin, finalY + 21);
      
      // Add a small note at the bottom
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        'Thank you for choosing Zane Driving School ',
        pageWidth / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
      
      // Save the PDF
      doc.save(`Zane-Driving-Fees-${currentMonth}-${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="fees-structure-container">
      <div className="fees-header">
        <div className="header-content">
          <h1>Transparent Pricing</h1>
          <p>Clear, competitive fees for all our driving and computer courses</p>
          <div className="header-badges">
            <span className="badge">No Hidden Costs</span>
            <span className="badge">Flexible Payment Options</span>
            <span className="badge">Quality Training</span>
          </div>
        </div>
        <div className="header-graphic">
          <div className="graphic-circle"></div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === "fees" ? "active" : ""}`}
            onClick={() => setActiveTab("fees")}
          >
            <FaInfoCircle className="tab-icon" />
            Fees Structure
          </button>
          <button 
            className={`tab-button ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            <FaQuestionCircle className="tab-icon" />
            Frequently Asked Questions
          </button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === "fees" && (
          <div className="fees-content">
            <div className="table-header">
              <div className="title-section">
                <h2>Fees Structure</h2>
                <p className="current-date">{currentMonth} {currentYear}</p>
              </div>
              <button className="download-button" onClick={handleDownload}>
                <FaDownload className="download-icon" />
                Download PDF
              </button>
            </div>
            
            <div className="table-scroll-container">
              <table id="fees-table" className="fees-table">
                <thead>
                  <tr>
                    <th>Course Type</th>
                    <th>Class</th>
                    <th>Duration</th>
                    <th>Fees (Ksh)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {feesData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                      <td data-label="Course Type">{item.type}</td>
                      <td data-label="Class">{item.class}</td>
                      <td data-label="Duration">{item.duration}</td>
                      <td data-label="Fees" className="fee-amount">{item.fees}</td>
                      <td data-label="Description">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="additional-info">
              <div className="info-card">
                <h3>💰 Payment Information</h3>
                <p>We offer flexible payment plans for all courses. Contact our office to discuss options that work for you.</p>
              </div>
              <div className="info-card">
                <h3>🎯 Special Offers</h3>
                <p>Enroll in any driving course and get a 20% discount on computer packages. Limited time offer!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="faq-content">
            <div className="faq-header">
              <h2>Frequently Asked Questions</h2>
              <p>Find answers to common questions about our courses and enrollment process</p>
            </div>
            
            <div className="faq-list">
              {faqData.map((item, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${openQuestion === index ? "active" : ""}`}
                >
                  <div 
                    className="faq-question"
                    onClick={() => toggleQuestion(index)}
                  >
                    <div className="question-content">
                      <FaQuestionCircle className="faq-icon" />
                      <span>{item.question}</span>
                    </div>
                    <div className="faq-toggle">
                      <FaChevronDown className={`toggle-icon ${openQuestion === index ? "open" : ""}`} />
                    </div>
                  </div>
                  
                  <div className="faq-answer-container">
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-prompt">
              <h3>Still have questions?</h3>
              <p>Our team is ready to assist you with any additional information you need.</p>
              <button className="contact-button" onClick={() => navigate("/contact-us")}>Contact Us</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesStructure;