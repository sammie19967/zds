import { useState } from "react";
import { FaDownload, FaQuestionCircle, FaChevronDown, FaInfoCircle, FaMoneyBillWave, FaPercent, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Import pdfmake with a dynamic import to handle both CJS and ESM
let pdfMake;

const loadPdfMake = async () => {
  if (!pdfMake) {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    pdfMake = pdfMakeModule.default || pdfMakeModule;
    pdfMake.vfs = pdfFontsModule.default?.pdfMake?.vfs || pdfFontsModule.pdfMake?.vfs || {};
  }
  return pdfMake;
};

const FeesStructure = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fees");
  const [openQuestion, setOpenQuestion] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
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
    { type: "Boarding", class: "B/A", duration: "4 weeks", fees: "21,000", description: "Accommodation" },
  ];

  const faqData = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers. Our payment details are provided upon registration.",
    },
    {
      question: "Are there any additional fees?",
      answer: "The fees listed include training materials, instruction, PDL and Test Booking fees. Additional costs are Interim and Smart DL which you pay directly to NTSA.",
    },
    {
      question: "Do you accept payment in installments?",
      answer: "Yes, we accept any payments from ksh.5,000 until payment is completed.",
    },
    {
      question: "What requirements are needed?",
      answer: "You need to have a valid passport, a valid national identity card, and a valid driving license (For Endorsement).",
    },
    {
      question: "Do I need to bring my own vehicle?",
      answer: "No, we provide all training vehicles for your lessons. You'll train using our well-maintained vehicles.",
    },
    {
      question: "How long does the DL processing take?",
      answer: "After completing training, and passing the exam, results will reflect on your NTSA account within 1 week. After which you can pay for your Interim and finally your Final DL.",
    },
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  // Handle PDF download with pdfmake
  const handleDownload = async () => {
    setIsPdfGenerating(true);
    try {
      const pdfMakeInstance = await loadPdfMake();
      
      // Convert image to base64 for the PDF
      const response = await fetch('/src/assets/logo.png');
      const blob = await response.blob();
      const reader = new FileReader();
      const logoPromise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const logo = await logoPromise;

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          {
            image: logo,
            width: 120,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          { 
            text: 'ZANE DRIVING SCHOOL', 
            style: 'header',
            margin: [0, 0, 0, 5]
          },
          { 
            text: 'Train with us, Drive with confidence', 
            style: 'subtitle',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          { 
            text: 'FEES STRUCTURE', 
            style: 'title',
            margin: [0, 0, 0, 10]
          },
          { 
            text: `As of ${currentMonth} ${currentYear}`, 
            style: 'date',
            margin: [0, 0, 0, 20]
          },

        {
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1.5 : 1,
            vLineWidth: () => 0,
            hLineColor: (i) => i === 0 ? '#2c3e50' : '#e0e0e0',
            paddingTop: () => 8,
            paddingBottom: () => 8,
            fillColor: (i) => i % 2 === 0 ? '#f8f9fa' : null
          },
          table: {
            headerRows: 1,
            widths: ['25%', '15%', '15%', '20%', '25%'],
            body: [
              [
                { text: 'COURSE TYPE', style: 'tableHeader' },
                { text: 'CLASS', style: 'tableHeader' },
                { text: 'DURATION', style: 'tableHeader' },
                { text: 'FEES (KES)', style: 'tableHeader' },
                { text: 'DESCRIPTION', style: 'tableHeader' },
              ],
              ...feesData.map((fee) => [
                { text: fee.type, style: 'tableCell' },
                { text: fee.class, style: 'tableCell' },
                { text: fee.duration, style: 'tableCell' },
                { text: fee.fees, style: 'tableCell', bold: true },
                { text: fee.description || '-', style: 'tableCell' },
              ]),
            ],
          },
        },

        { text: " ", margin: [0, 10] },
        { text: "Contact Information:", style: "sectionHeader" },
        { text: "Phone: 0115820508" },
        { text: "Email: zanedrivingschool2022@gmail.com" },
        { text: "Main Office: Mercy Njeri along Kabarak Road, Nakuru, Kenya", margin: [0, 0, 0, 20] },
        { text: "Branch Office: Kericho", margin: [0, 0, 0, 20] },

        { text: "Thank you for choosing Zane Driving School", style: "footer" },
      ],

      styles: {
        header: { 
          fontSize: 20, 
          bold: true, 
          alignment: 'center', 
          color: '#2c3e50',
          margin: [0, 5, 0, 5]
        },
        title: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#2c3e50',
          margin: [0, 20, 0, 5]
        },
        subtitle: {
          fontSize: 12,
          color: '#7f8c8d',
          italics: true
        },
        date: {
          fontSize: 11,
          alignment: 'center',
          color: '#7f8c8d'
        },
        sectionHeader: { 
          fontSize: 12, 
          bold: true, 
          margin: [0, 15, 0, 8], 
          color: '#2c3e50' 
        },
        footer: { 
          fontSize: 10, 
          italics: true, 
          alignment: 'center', 
          margin: [0, 20, 0, 0] 
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white',
          fillColor: '#2c3e50',
          alignment: 'center',
          margin: [0, 5, 0, 5],
          padding: [5, 0, 5, 0]
        },
        tableCell: {
          fontSize: 10,
          margin: [0, 5, 0, 5],
          padding: [5, 5, 5, 5]
        }
      },

      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3
      },
    };

      pdfMakeInstance.createPdf(docDefinition).download(`Zane-Driving-Fees-${currentMonth}-${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again later.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="zane-fees-container">
      <div className="zane-fees-hero">
        <div className="zane-hero-content">
          <h1>Transparent Pricing</h1>
          <p>Clear, competitive fees for all our driving and computer courses</p>
          <div className="zane-hero-badges">
            <span className="zane-badge"><FaMoneyBillWave /> No Hidden Costs</span>
            <span className="zane-badge"><FaPercent /> Flexible Payment Options</span>
            <span className="zane-badge"><FaClock /> Quality Training</span>
          </div>
        </div>
        <div className="zane-hero-visual">
          <div className="zane-visual-circle"></div>
          <div className="zane-visual-bar"></div>
          <div className="zane-visual-bar"></div>
          <div className="zane-visual-bar"></div>
        </div>
      </div>

      <div className="zane-tabs-navigation">
        <div className="zane-tabs">
          <button 
            className={`zane-tab ${activeTab === "fees" ? "zane-tab-active" : ""}`} 
            onClick={() => setActiveTab("fees")}
          >
            <FaInfoCircle className="zane-tab-icon" />
            Fees Structure
          </button>
          <button 
            className={`zane-tab ${activeTab === "faq" ? "zane-tab-active" : ""}`} 
            onClick={() => setActiveTab("faq")}
          >
            <FaQuestionCircle className="zane-tab-icon" />
            Frequently Asked Questions
          </button>
        </div>
      </div>

      <div className="zane-content-section">
        {activeTab === "fees" && (
          <div className="zane-fees-content">
            <div className="zane-section-header">
              <div className="zane-header-text">
                <h2>Fees Structure</h2>
                <p className="zane-date-display">{currentMonth} {currentYear}</p>
              </div>
              <button 
                className="zane-download-btn"
                onClick={handleDownload}
                disabled={isPdfGenerating}
              >
                <FaDownload className="zane-btn-icon" />
                {isPdfGenerating ? "Generating..." : "Download PDF"}
              </button>
            </div>

            <div className="zane-table-container">
              <div className="zane-fees-table">
                <div className="zane-table-header">
                  <div className="zane-header-cell">Course Type</div>
                  <div className="zane-header-cell">Class</div>
                  <div className="zane-header-cell">Duration</div>
                  <div className="zane-header-cell">Fees (Ksh)</div>
                  <div className="zane-header-cell">Description</div>
                </div>
                <div className="zane-table-body">
                  {feesData.map((item, index) => (
                    <div key={index} className={`zane-table-row ${index % 2 === 0 ? "zane-row-even" : "zane-row-odd"}`}>
                      <div className="zane-table-cell" data-label="Course Type">
                        <span className="zane-cell-content">{item.type}</span>
                      </div>
                      <div className="zane-table-cell" data-label="Class">
                        <span className="zane-cell-content">{item.class}</span>
                      </div>
                      <div className="zane-table-cell" data-label="Duration">
                        <span className="zane-cell-content">{item.duration}</span>
                      </div>
                      <div className="zane-table-cell" data-label="Fees">
                        <span className="zane-fee-amount">{item.fees}</span>
                      </div>
                      <div className="zane-table-cell" data-label="Description">
                        <span className="zane-cell-content">{item.description || "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="zane-info-cards">
              <div className="zane-info-card">
                <div className="zane-card-icon">
                  <FaMoneyBillWave />
                </div>
                <div className="zane-card-content">
                  <h3>Payment Information</h3>
                  <p>We offer flexible payment plans for all courses. Contact our office to discuss options that work for you.</p>
                </div>
              </div>
              <div className="zane-info-card">
                <div className="zane-card-icon">
                  <FaPercent />
                </div>
                <div className="zane-card-content">
                  <h3>Special Offers</h3>
                  <p>Enroll in any driving course and get a 20% discount on computer packages. Limited time offer!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="zane-faq-content">
            <div className="zane-section-header">
              <h2>Frequently Asked Questions</h2>
              <p>Find answers to common questions about our courses and enrollment process</p>
            </div>

            <div className="zane-faq-container">
              {faqData.map((item, index) => (
                <div 
                  key={index} 
                  className={`zane-faq-item ${openQuestion === index ? "zane-faq-expanded" : ""}`}
                  onClick={() => toggleQuestion(index)}
                >
                  <div className="zane-faq-question">
                    <div className="zane-question-text">
                      <FaQuestionCircle className="zane-question-icon" />
                      <span>{item.question}</span>
                    </div>
                    <FaChevronDown className={`zane-chevron ${openQuestion === index ? "zane-chevron-open" : ""}`} />
                  </div>
                  <div className="zane-faq-answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="zane-contact-cta">
              <h3>Still have questions?</h3>
              <p>Our team is ready to assist you with any additional information you need.</p>
              <button className="zane-cta-button" onClick={() => navigate("/contact-us")}>
                Contact Us
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .zane-fees-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          color: #333;
        }
        
        .zane-fees-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #0066ff 0%, #0051cc 100%);
          color: white;
          border-radius: 16px;
          padding: 3rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .zane-hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        
        .zane-hero-content p {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        
        .zane-hero-badges {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .zane-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        
        .zane-hero-visual {
          position: relative;
          width: 200px;
          height: 200px;
        }
        
        .zane-visual-circle {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .zane-visual-bar {
          position: absolute;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.4);
        }
        
        .zane-visual-bar:nth-child(2) {
          width: 160px;
          top: 40px;
          left: 20px;
          transform: rotate(-20deg);
        }
        
        .zane-visual-bar:nth-child(3) {
          width: 140px;
          top: 90px;
          left: 30px;
          transform: rotate(15deg);
        }
        
        .zane-visual-bar:nth-child(4) {
          width: 120px;
          bottom: 40px;
          right: 30px;
          transform: rotate(-10deg);
        }
        
        .zane-tabs-navigation {
          margin-bottom: 2rem;
        }
        
        .zane-tabs {
          display: flex;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 0.5rem;
        }
        
        .zane-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
        }
        
        .zane-tab:hover {
          background: rgba(0, 102, 255, 0.1);
        }
        
        .zane-tab-active {
          background: #0066ff;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
        }
        
        .zane-tab-icon {
          font-size: 1.2rem;
        }
        
        .zane-content-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .zane-section-header {
          padding: 2rem 2rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #eaeaea;
        }
        
        .zane-section-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #212529;
        }
        
        .zane-date-display {
          color: #6c757d;
          font-weight: 500;
        }
        
        .zane-download-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #0066ff, #0051cc);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .zane-download-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 102, 255, 0.4);
        }
        
        .zane-download-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .zane-btn-icon {
          font-size: 1rem;
        }
        
        .zane-table-container {
          padding: 0 2rem;
          overflow-x: auto;
        }
        
        .zane-fees-table {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin: 1.5rem 0;
        }
        
        .zane-table-header {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr;
          background: #2c3e50;
          color: white;
          font-weight: 600;
        }
        
        .zane-header-cell {
          padding: 1rem;
          text-align: center;
        }
        
        .zane-table-body {
          background: white;
        }
        
        .zane-table-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr;
          transition: all 0.3s ease;
        }
        
        .zane-table-row:hover {
          background: #f8f9fa;
        }
        
        .zane-row-even {
          background: #f8f9fa;
        }
        
        .zane-row-even:hover {
          background: #e9ecef;
        }
        
        .zane-table-cell {
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .zane-cell-content {
          width: 100%;
        }
        
        .zane-fee-amount {
          font-weight: 700;
          color: #28a745;
        }
        
        .zane-info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }
        
        .zane-info-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .zane-info-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .zane-card-icon {
          font-size: 1.5rem;
          color: #0066ff;
          background: rgba(0, 102, 255, 0.1);
          padding: 1rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .zane-card-content h3 {
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .zane-card-content p {
          color: #6c757d;
          line-height: 1.5;
        }
        
        .zane-faq-content .zane-section-header {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .zane-faq-content .zane-section-header p {
          color: #6c757d;
        }
        
        .zane-faq-container {
          padding: 0 2rem;
        }
        
        .zane-faq-item {
          border-bottom: 1px solid #eaeaea;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .zane-faq-item:last-child {
          border-bottom: none;
        }
        
        .zane-faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
        }
        
        .zane-question-text {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .zane-question-icon {
          color: #0066ff;
          font-size: 1.2rem;
        }
        
        .zane-chevron {
          transition: transform 0.3s ease;
          color: #6c757d;
        }
        
        .zane-chevron-open {
          transform: rotate(180deg);
        }
        
        .zane-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        
        .zane-faq-expanded .zane-faq-answer {
          max-height: 200px;
          padding-bottom: 1.5rem;
        }
        
        .zane-faq-answer p {
          color: #6c757d;
          line-height: 1.6;
          margin: 0;
        }
        
        .zane-contact-cta {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 0 0 16px 16px;
        }
        
        .zane-contact-cta h3 {
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .zane-contact-cta p {
          color: #6c757d;
          margin-bottom: 1.5rem;
        }
        
        .zane-cta-button {
          background: #0066ff;
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .zane-cta-button:hover {
          background: #0051cc;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 102, 255, 0.3);
        }
        
        @media (max-width: 768px) {
          .zane-fees-container {
            padding: 1rem;
          }
          
          .zane-fees-hero {
            flex-direction: column;
            text-align: center;
            padding: 2rem 1rem;
          }
          
          .zane-hero-content h1 {
            font-size: 2rem;
          }
          
          .zane-hero-badges {
            justify-content: center;
          }
          
          .zane-hero-visual {
            margin-top: 2rem;
            width: 150px;
            height: 150px;
          }
          
          .zane-section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .zane-download-btn {
            align-self: center;
          }
          
          .zane-table-header,
          .zane-table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .zane-header-cell,
          .zane-table-cell {
            padding: 0.5rem;
            text-align: left;
            justify-content: flex-start;
          }
          
          .zane-table-cell::before {
            content: attr(data-label);
            font-weight: 700;
            margin-right: 0.5rem;
            color: #6c757d;
          }
          
          .zane-info-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FeesStructure;