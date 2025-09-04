import { useState } from "react";
import "../styles/AdmissionForm.css";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    nationality: "",
    gender: "",
    course: "",
    drivingType: "",
    endorsementClass: "",
    computingLevel: "",
    studyMode: "",
  });

  const [errors, setErrors] = useState({});

  const nextStep = () => {
    // Validate current step before proceeding
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.nationality) newErrors.nationality = "Nationality is required";
      if (!formData.gender) newErrors.gender = "Gender is required";

      // Age validation for driving courses
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          newErrors.dateOfBirth = "Must be 18 years or older for driving courses";
        }
      }
    }

    if (currentStep === 2) {
      if (!formData.course) newErrors.course = "Course selection is required";
      if (formData.course === "Driving" && !formData.drivingType) {
        newErrors.drivingType = "Driving type is required";
      }
      if (formData.drivingType === "Endorsement" && !formData.endorsementClass) {
        newErrors.endorsementClass = "Endorsement class is required";
      }
      if (formData.course === "Computing" && !formData.computingLevel) {
        newErrors.computingLevel = "Experience level is required";
      }
    }

    if (currentStep === 3) {
      if (!formData.studyMode) newErrors.studyMode = "Study mode is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Options for dynamic dropdowns
  const drivingClasses = [
    "A1 Motorbike",
    "B1 Automatic",
    "B2 Manual",
    "CI - Lorry",
    "C2 - Commercial",
    "Bus",
    "Heavy Truck",
  ];

  const beginnerCourses = [
    "MS Word",
    "Excel",
    "PPT",
    "Access",
    "Internet and Browsing",
    "Emailing",
  ];

  const intermediateCourses = [
    "DBMS",
    "Introduction to Programming and Algorithms",
    "AI and ML Basics",
    "Web Development",
    "QuickBooks",
    
  ];

  return (
    <div className="multi-form-container">
      {/* Logo and Title */}
      <div className="form-header">
        <div className="form-logo">
          <img src={logo} alt="Logo" className="logo-img" />
        </div>
        <h1 className="form-title">Admission Form</h1>
       
      </div>

      {/* Progress Bar */}
      <div className="multi-progress-bar">
        <div className="multi-progress" style={{ width: `${(step / 4) * 100}%` }}></div>
      </div>

      {/* Step 1 - Personal Information */}
      {step === 1 && (
        <motion.div
          className="multi-form-step active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Step 1: Personal Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className={errors.firstName ? "error" : ""}
                required
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className={errors.lastName ? "error" : ""}
                required
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g., +254 712 345 678"
                className={errors.phoneNumber ? "error" : ""}
                required
              />
              {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? "error" : ""}
                required
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nationality">Nationality *</label>
              <select
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={errors.nationality ? "error" : ""}
                required
              >
                <option value="">Select Country</option>
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Burundi">Burundi</option>
                <option value="South Sudan">South Sudan</option>
                <option value="Other">Other</option>
              </select>
              {errors.nationality && <span className="error-text">{errors.nationality}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? "error" : ""}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>

          <motion.button
            className="multi-button right"
            onClick={nextStep}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next
          </motion.button>
        </motion.div>
      )}

      {/* Step 2 - Course Selection */}
      {step === 2 && (
        <motion.div
          className="multi-form-step active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Step 2: Course Selection</h2>
          
          <div className="form-group">
            <label htmlFor="course">Course *</label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              className={errors.course ? "error" : ""}
              required
            >
              <option value="">Select Course</option>
              <option value="Driving">Driving</option>
              <option value="Computing">Computing</option>
            </select>
            {errors.course && <span className="error-text">{errors.course}</span>}
          </div>

          {/* Show Driving Type if Driving is selected */}
          {formData.course === "Driving" && (
            <>
              <div className="form-group">
                <label htmlFor="drivingType">Driving Type *</label>
                <select
                  id="drivingType"
                  name="drivingType"
                  value={formData.drivingType}
                  onChange={handleChange}
                  className={errors.drivingType ? "error" : ""}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="New Student">New Student</option>
                  <option value="Endorsement">Endorsement</option>
                  <option value="Refresher">Refresher</option>
                </select>
                {errors.drivingType && <span className="error-text">{errors.drivingType}</span>}
              </div>

              {/* Show Class if Endorsement is selected */}
              {formData.drivingType === "Endorsement" && (
                <div className="form-group">
                  <label htmlFor="endorsementClass">Endorsement Class *</label>
                  <select
                    id="endorsementClass"
                    name="endorsementClass"
                    value={formData.endorsementClass}
                    onChange={handleChange}
                    className={errors.endorsementClass ? "error" : ""}
                    required
                  >
                    <option value="">Select Class</option>
                    {drivingClasses.map((classOption) => (
                      <option key={classOption} value={classOption}>
                        {classOption}
                      </option>
                    ))}
                  </select>
                  {errors.endorsementClass && <span className="error-text">{errors.endorsementClass}</span>}
                </div>
              )}
            </>
          )}

          {/* Show Computing Level if Computing is selected */}
          {formData.course === "Computing" && (
            <>
              <div className="form-group">
                <label htmlFor="computingLevel">Experience Level *</label>
                <select
                  id="computingLevel"
                  name="computingLevel"
                  value={formData.computingLevel}
                  onChange={handleChange}
                  className={errors.computingLevel ? "error" : ""}
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                </select>
                {errors.computingLevel && <span className="error-text">{errors.computingLevel}</span>}
              </div>

              {/* Show Beginner Courses if Beginner is selected */}
              {formData.computingLevel === "Beginner" && (
                <div className="form-group">
                  <label>Beginner Courses (All included)</label>
                  <div className="courses-list">
                    {beginnerCourses.map((course) => (
                      <div key={course} className="course-item">
                        {course}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Intermediate Courses if Intermediate is selected */}
              {formData.computingLevel === "Intermediate" && (
                <div className="form-group">
                  <label>Intermediate Courses (All included)</label>
                  <div className="courses-list">
                    {intermediateCourses.map((course) => (
                      <div key={course} className="course-item">
                        {course}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="multi-button-group">
            <motion.button
              className="multi-button"
              onClick={prevStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
            <motion.button
              className="multi-button right"
              onClick={nextStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Step 3 - Additional Details */}
      {step === 3 && (
        <motion.div
          className="multi-form-step active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Step 3: Additional Details</h2>
          
          <div className="form-group">
            <label htmlFor="studyMode">Study Mode *</label>
            <select
              id="studyMode"
              name="studyMode"
              value={formData.studyMode}
              onChange={handleChange}
              className={errors.studyMode ? "error" : ""}
              required
            >
              <option value="">Select Option</option>
              <option value="Boarding">Boarding</option>
              <option value="Day Scholar">Day Scholar</option>
            </select>
            {errors.studyMode && <span className="error-text">{errors.studyMode}</span>}
          </div>

          <div className="multi-button-group">
            <motion.button
              className="multi-button"
              onClick={prevStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
            <motion.button
              className="multi-button right"
              onClick={nextStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Step 4 - Summary */}
      {step === 4 && (
        <motion.div
          className="multi-form-step active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Step 4: Summary</h2>
          
          <div className="summary-section">
            <h3>Personal Information</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>First Name:</strong> {formData.firstName}
              </div>
              <div className="summary-item">
                <strong>Last Name:</strong> {formData.lastName}
              </div>
              <div className="summary-item">
                <strong>Phone Number:</strong> {formData.phoneNumber}
              </div>
              <div className="summary-item">
                <strong>Date of Birth:</strong> {formData.dateOfBirth}
              </div>
              <div className="summary-item">
                <strong>Nationality:</strong> {formData.nationality}
              </div>
              <div className="summary-item">
                <strong>Gender:</strong> {formData.gender}
              </div>
            </div>

            <h3>Course Details</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>Course:</strong> {formData.course}
              </div>
              {formData.course === "Driving" && (
                <>
                  <div className="summary-item">
                    <strong>Driving Type:</strong> {formData.drivingType}
                  </div>
                  {formData.drivingType === "Endorsement" && (
                    <div className="summary-item">
                      <strong>Endorsement Class:</strong> {formData.endorsementClass}
                    </div>
                  )}
                </>
              )}
              {formData.course === "Computing" && (
                <div className="summary-item">
                  <strong>Experience Level:</strong> {formData.computingLevel}
                </div>
              )}
              <div className="summary-item">
                <strong>Study Mode:</strong> {formData.studyMode}
              </div>
            </div>
          </div>

          <div className="multi-button-group">
            <motion.button
              className="multi-button"
              onClick={prevStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
            <motion.button
              className="multi-button right"
              onClick={() => alert("Form Submitted Successfully! We will contact you soon.")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Submit Application
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MultiStepForm;