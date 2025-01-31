import React, { useState } from "react";
import "../styles/AdmissionForm.css"; // Import CSS file
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationality: "",
    gender: "",
    course: "",
    drivingType: "",
    endorsementClass: "",
    computingLevel: "",
    studyMode: "",
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    "Introduction to Programming",
    "AI and ML Basics",
  ];

  return (
    <div className="multi-form-container">
      {/* Logo - Only visible in Step 1 */}
      <div className="form-logo">
        <img src={logo} alt="Logo" className="logo-img" />
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

          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            required
          />

          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            required
          />

          <label>Nationality</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option value="Kenya">Kenya</option>
            <option value="Uganda">Uganda</option>
          </select>

          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

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
          <label>Course</label>
          <select
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          >
            <option value="">Select Course</option>
            <option value="Driving">Driving</option>
            <option value="Computing">Computing</option>
          </select>

          {/* Show Driving Type if Driving is selected */}
          {formData.course === "Driving" && (
            <>
              <label>Driving Type</label>
              <select
                name="drivingType"
                value={formData.drivingType}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="New Student">New Student</option>
                <option value="Endorsement">Endorsement</option>
                <option value="Refresher">Refresher</option>
              </select>

              {/* Show Class if Endorsement is selected */}
              {formData.drivingType === "Endorsement" && (
                <>
                  <label>Endorsement Class</label>
                  <select
                    name="endorsementClass"
                    value={formData.endorsementClass}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Class</option>
                    {drivingClasses.map((classOption) => (
                      <option key={classOption} value={classOption}>
                        {classOption}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}

          {/* Show Computing Level if Computing is selected */}
          {formData.course === "Computing" && (
            <>
              <label>Experience Level</label>
              <select
                name="computingLevel"
                value={formData.computingLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
              </select>

              {/* Show Beginner Courses if Beginner is selected */}
              {formData.computingLevel === "Beginner" && (
                <>
                  <label>Beginner Courses</label>
                  <ul>
                    {beginnerCourses.map((course) => (
                      <li key={course}>{course}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Show Intermediate Courses if Intermediate is selected */}
              {formData.computingLevel === "Intermediate" && (
                <>
                  <label>Intermediate Courses</label>
                  <ul>
                    {intermediateCourses.map((course) => (
                      <li key={course}>{course}</li>
                    ))}
                  </ul>
                </>
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
              disabled={!formData.course}
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
          <label>Study Mode</label>
          <select
            name="studyMode"
            value={formData.studyMode}
            onChange={handleChange}
            required
          >
            <option value="">Select Option</option>
            <option value="Boarding">Boarding</option>
            <option value="Day Scholar">Day Scholar</option>
          </select>

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
            <p><strong>First Name:</strong> {formData.firstName}</p>
            <p><strong>Last Name:</strong> {formData.lastName}</p>
            <p><strong>Nationality:</strong> {formData.nationality}</p>
            <p><strong>Gender:</strong> {formData.gender}</p>
            <p><strong>Course:</strong> {formData.course}</p>
            {formData.course === "Driving" && <p><strong>Driving Type:</strong> {formData.drivingType}</p>}
            {formData.drivingType === "Endorsement" && <p><strong>Endorsement Class:</strong> {formData.endorsementClass}</p>}
            {formData.course === "Computing" && <p><strong>Experience Level:</strong> {formData.computingLevel}</p>}
            {formData.computingLevel === "Beginner" && <p><strong>Selected Courses:</strong> {beginnerCourses.join(", ")}</p>}
            {formData.computingLevel === "Intermediate" && <p><strong>Selected Courses:</strong> {intermediateCourses.join(", ")}</p>}
            <p><strong>Study Mode:</strong> {formData.studyMode}</p>
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
              onClick={() => alert("Form Submitted!")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Submit
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MultiStepForm;
