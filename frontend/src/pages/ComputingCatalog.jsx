import React, { useState } from "react";
import "../styles/ComputingCatalog.css";

const ComputingCatalog = () => {
  const [activeTab, setActiveTab] = useState("beginner");
  
  const beginnerCourses = [
    {
      title: "MS Word",
      price: "Ksh 3,000",
      duration: "3 Weeks",
      description: "Professional document creation and formatting",
      highlights: ["Formatting mastery", "Templates & styles", "Collaboration tools"],
      gradient: "blue"
    },
    {
      title: "Excel",
      price: "Ksh 3,000",
      duration: "4 Weeks",
      description: "Spreadsheets, formulas, and data analysis",
      highlights: ["Formulas & functions", "Data visualization", "Pivot tables"],
      gradient: "green"
    },
    {
      title: "PowerPoint",
      price: "Ksh 3,000",
      duration: "3 Weeks",
      description: "Creating engaging presentations",
      highlights: ["Slide design", "Animations", "Presentation techniques"],
      gradient: "orange"
    },
    {
      title: "Publisher",
      price: "Ksh 3,000",
      duration: "4 Weeks",
      description: "Designing publications and brochures",
      highlights: ["Layout design", "Typography", "Print preparation"],
      gradient: "purple"
    },
    {
      title: "Access",
      price: "Ksh 3,000",
      duration: "5 Weeks",
      description: "Database management and reporting",
      highlights: ["Database design", "Query building", "Report generation"],
      gradient: "red"
    },
    {
      title: "Internet & Email",
      price: "Ksh 3,000",
      duration: "2 Weeks",
      description: "Web navigation and professional emailing",
      highlights: ["Online safety", "Email etiquette", "Productivity tools"],
      gradient: "teal"
    }
  ];

  const intermediateCourses = [
    {
      title: "Programming Fundamentals",
      price: "Ksh 5,000",
      duration: "8 Weeks",
      description: "Python programming and algorithm design",
      highlights: ["Python syntax", "Problem solving", "Debugging techniques"],
      gradient: "indigo"
    },
    {
      title: "Machine Learning & AI",
      price: "Ksh 5,000",
      duration: "10 Weeks",
      description: "Introduction to ML and AI concepts",
      highlights: ["ML algorithms", "Data preprocessing", "Model evaluation"],
      gradient: "pink"
    },
    {
      title: "Database Management (DBMS)",
      price: "Ksh 5,000",
      duration: "8 Weeks",
      description: "Advanced database design and SQL",
      highlights: ["SQL mastery", "Database normalization", "Performance tuning"],
      gradient: "cyan"
    },
    {
      title: "Web Development",
      price: "Ksh 5,000",
      duration: "12 Weeks",
      description: "HTML, CSS, JavaScript and responsive design",
      highlights: ["Frontend frameworks", "Responsive design", "API integration"],
      gradient: "emerald"
    },
    {
      title: "Android Development",
      price: "Ksh 5,000",
      duration: "12 Weeks",
      description: "Building mobile applications for Android",
      highlights: ["Android Studio", "UI/UX for mobile", "App publishing"],
      gradient: "lime"
    },
    {
      title: "Data Structures & Algorithms",
      price: "Ksh 5,000",
      duration: "10 Weeks",
      description: "Advanced programming concepts",
      highlights: ["Algorithm analysis", "Data structures", "Optimization techniques"],
      gradient: "violet"
    }
  ];

  return (
    <div className="computing-catalog">
      {/* Header */}
      <div className="catalog-header">
        <h1 className="catalog-title">
          Computing Courses Catalog
        </h1>
        <p className="catalog-description">
          Explore our computing courses and <span className="highlight-text">boost your digital skills</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'beginner' ? 'active' : ''}`}
            onClick={() => setActiveTab('beginner')}
          >
            Beginner Courses
          </button>
          <button 
            className={`tab-button ${activeTab === 'intermediate' ? 'active' : ''}`}
            onClick={() => setActiveTab('intermediate')}
          >
            Intermediate Courses
          </button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="course-grid">
        {(activeTab === 'beginner' ? beginnerCourses : intermediateCourses).map((course, index) => (
          <div key={index} className="course-card-wrapper">
            <div className="course-card">
              {/* Card Header with Gradient */}
              <div className={`card-header gradient-${course.gradient}`}>
                <div className="header-overlay"></div>
                <div className="level-badge">
                  {activeTab === 'beginner' ? 'Beginner' : 'Intermediate'}
                </div>
                <div className="course-title-header">
                  <h3>{course.title}</h3>
                </div>
                <div className="decorative-circle circle-1"></div>
                <div className="decorative-circle circle-2"></div>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <p className="course-description">
                  {course.description}
                </p>
                
                {/* Highlights */}
                <div className="highlights-section">
                  <div className="highlights-grid">
                    {course.highlights.map((highlight, i) => (
                      <span key={i} className="highlight-tag">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Course Details */}
                <div className="course-details">
                  <div className="detail-item">
                    <div className="detail-indicator price-indicator"></div>
                    <span className="detail-text price-text">{course.price}</span>
                  </div>
                  <div className="detail-item">
                    <div className="detail-indicator duration-indicator"></div>
                    <span className="detail-text duration-text">{course.duration}</span>
                  </div>
                </div>
                
                {/* Apply Button */}
                <button className="apply-button">
                  <span className="button-text">Apply Now</span>
                  <svg className="button-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComputingCatalog;