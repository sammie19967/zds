import { useState } from "react";
import "../styles/FeesStructure.css";
import { FaDownload, FaQuestionCircle, FaChevronDown, FaInfoCircle, FaMoneyBillWave, FaPercent, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import modal from "../utils/modal";

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
    { type: "New Student", class: "A1/A2", duration: "4 weeks", fees: "7,000", description: "Motorbike/Tuktuk" },
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
      const confirmed = await modal.confirm({
        title: 'Download Fees PDF?',
        text: 'Generate and download the latest fees structure as a PDF?',
        confirmButtonText: 'Download',
        cancelButtonText: 'Cancel',
      });
      if (!confirmed) {
        setIsPdfGenerating(false);
        return;
      }
      const pdfMakeInstance = await loadPdfMake();
      
      // Convert image to base64 for the PDF
      const response = await fetch('/logo.png');
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
        // Centered logo watermark/background
        background: function(currentPage, pageSize) {
          const imgWidth = 360; // px
          const imgHeight = 360; // approximate, will scale proportionally
          const x = (pageSize.width - imgWidth) / 2;
          const y = (pageSize.height - imgHeight) / 2;
          return [{
            image: logo,
            width: imgWidth,
            opacity: 0.06,
            absolutePosition: { x, y }
          }];
        },
        // Footer with brand and page numbers
        footer: function(currentPage, pageCount) {
          return {
            margin: [40, 0, 40, 20],
            columns: [
              { text: 'Zane Driving School • Train with us, Drive with confidence', alignment: 'left', color: '#7f8c8d' },
              { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', color: '#7f8c8d' }
            ],
            fontSize: 9
          };
        },
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
        { text: "Website: zanedrivingschool.co.ke", margin: [0, 0, 0, 20] },

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
      modal.toast({ icon: 'success', title: 'Download started' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      await modal.error('PDF generation failed', 'Failed to generate PDF. Please try again later.');
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

      <div className={`zane-content-section ${activeTab === 'fees' ? 'zane-section-fees' : 'zane-section-faq'}`}>
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

      
    </div>
  );
};

export default FeesStructure;