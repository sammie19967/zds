import { useState } from 'react';
import modal from '../../utils/modal';
import { submitAdminAdmission } from '../../utils/firebase';
import { uploadAdminPassportToCloudinary } from '../../utils/cloudinary';

import '../../styles/AdmissionForm.css';
import logo from '../../assets/logo.png';
import { motion } from 'framer-motion';

const AdminAdmissionForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationalIdOrPassport: '',
    nationality: '',
    course: '', // Driving | Computing
    drivingType: '', // New Student | Endorsement | Refresher
    endorsementClass: '',
    computingLevel: '', // Beginner | Intermediate
    amountPaid: '',
    confirmationCode: '',
    passportFile: null,
  });
  const [errors, setErrors] = useState({});

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'passportFile') {
      const file = files && files[0] ? files[0] : null;
      setFormData((prev) => ({ ...prev, passportFile: file }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep = (current) => {
    const newErrors = {};
    if (current === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.nationalIdOrPassport) newErrors.nationalIdOrPassport = 'ID/Passport is required';
      if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    }
    if (current === 2) {
      if (!formData.course) newErrors.course = 'Course selection is required';
      if (formData.course === 'Driving' && !formData.drivingType) {
        newErrors.drivingType = 'Driving type is required';
      }
      if (formData.drivingType === 'Endorsement' && !formData.endorsementClass) {
        newErrors.endorsementClass = 'Endorsement class is required';
      }
      if (formData.course === 'Computing' && !formData.computingLevel) {
        newErrors.computingLevel = 'Experience level is required';
      }
    }
    if (current === 3) {
      if (!formData.amountPaid) newErrors.amountPaid = 'Amount paid is required';
      if (formData.amountPaid) {
        const amt = Number(formData.amountPaid);
        if (Number.isNaN(amt) || amt < 0) newErrors.amountPaid = 'Enter a valid amount';
      }
      if (!formData.confirmationCode) newErrors.confirmationCode = 'Confirmation code is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    if (!validateStep(1)) { setStep(1); return false; }
    if (!validateStep(2)) { setStep(2); return false; }
    if (!validateStep(3)) { setStep(3); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setIsSubmitting(true);
    try {
      let passportUrl = '';
      if (formData.passportFile) {
        passportUrl = await uploadAdminPassportToCloudinary(formData.passportFile);
      }
      await submitAdminAdmission({
        ...formData,
        dateOfBirth: formData.dateOfBirth,
        passportUrl,
        amountPaid: Number(formData.amountPaid),
      });
      await modal.success({
        title: 'Student registered!',
        text: 'The admission has been recorded successfully.',
      });
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationalIdOrPassport: '',
        nationality: '',
        course: '',
        drivingType: '',
        endorsementClass: '',
        computingLevel: '',
        amountPaid: '',
        confirmationCode: '',
        passportFile: null,
      });
      setErrors({});
      setStep(1);
    } catch (err) {
      console.error(err);
      await modal.error({
        title: 'Failed to save admission',
        text: err?.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const drivingClasses = [
    'A1 Motorbike',
    'B1 Automatic',
    'B2 Manual',
    'CI - Lorry',
    'C2 - Commercial',
    'Bus',
    'Heavy Truck',
  ];

  const beginnerCourses = [
    'MS Word',
    'Excel',
    'PPT',
    'Access',
    'Internet and Browsing',
    'Emailing',
  ];

  const intermediateCourses = [
    'DBMS',
    'Introduction to Programming and Algorithms',
    'AI and ML Basics',
    'Web Development',
    'QuickBooks',
  ];

  return (
    <div className="multi-form-container">
      <div className="form-header">
        <div className="form-logo">
          <img src={logo} alt="Logo" className="logo-img" />
        </div>
        <h1 className="form-title">Admin: Register New Student</h1>
      </div>

      <div className="multi-progress-bar">
        <div className="multi-progress" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      {step === 1 && (
        <motion.div className="multi-form-step active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 1: Personal Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" className={errors.firstName ? 'error' : ''} required />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" className={errors.lastName ? 'error' : ''} required />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? 'error' : ''}
                required
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="nationality">Nationality *</label>
              <select id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} className={errors.nationality ? 'error' : ''} required>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nationalIdOrPassport">National ID / Passport *</label>
              <input id="nationalIdOrPassport" type="text" name="nationalIdOrPassport" value={formData.nationalIdOrPassport} onChange={handleChange} placeholder="Enter ID or Passport number" className={errors.nationalIdOrPassport ? 'error' : ''} required />
              {errors.nationalIdOrPassport && <span className="error-text">{errors.nationalIdOrPassport}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="passportFile">Passport Photo (JPEG/PNG)</label>
              <input id="passportFile" type="file" name="passportFile" accept="image/*" onChange={handleChange} />
            </div>
          </div>

          <motion.button className="multi-button right" onClick={nextStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Next
          </motion.button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div className="multi-form-step active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 2: Course Selection</h2>
          <div className="form-group">
            <label htmlFor="course">Course *</label>
            <select id="course" name="course" value={formData.course} onChange={handleChange} className={errors.course ? 'error' : ''} required>
              <option value="">Select Course</option>
              <option value="Driving">Driving</option>
              <option value="Computing">Computing</option>
            </select>
            {errors.course && <span className="error-text">{errors.course}</span>}
          </div>

          {formData.course === 'Driving' && (
            <>
              <div className="form-group">
                <label htmlFor="drivingType">Driving Type *</label>
                <select
                  id="drivingType"
                  name="drivingType"
                  value={formData.drivingType}
                  onChange={handleChange}
                  className={errors.drivingType ? 'error' : ''}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="New Student">New Student</option>
                  <option value="Endorsement">Endorsement</option>
                  <option value="Refresher">Refresher</option>
                </select>
                {errors.drivingType && <span className="error-text">{errors.drivingType}</span>}
              </div>

              {formData.drivingType === 'Endorsement' && (
                <div className="form-group">
                  <label htmlFor="endorsementClass">Endorsement Class *</label>
                  <select
                    id="endorsementClass"
                    name="endorsementClass"
                    value={formData.endorsementClass}
                    onChange={handleChange}
                    className={errors.endorsementClass ? 'error' : ''}
                    required
                  >
                    <option value="">Select Class</option>
                    {drivingClasses.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.endorsementClass && <span className="error-text">{errors.endorsementClass}</span>}
                </div>
              )}
            </>
          )}

          {formData.course === 'Computing' && (
            <>
              <div className="form-group">
                <label htmlFor="computingLevel">Experience Level *</label>
                <select
                  id="computingLevel"
                  name="computingLevel"
                  value={formData.computingLevel}
                  onChange={handleChange}
                  className={errors.computingLevel ? 'error' : ''}
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                </select>
                {errors.computingLevel && <span className="error-text">{errors.computingLevel}</span>}
              </div>

              {formData.computingLevel === 'Beginner' && (
                <div className="form-group">
                  <label>Beginner Courses (All included)</label>
                  <div className="courses-list">
                    {beginnerCourses.map((course) => (
                      <div key={course} className="course-item">{course}</div>
                    ))}
                  </div>
                </div>
              )}
              {formData.computingLevel === 'Intermediate' && (
                <div className="form-group">
                  <label>Intermediate Courses (All included)</label>
                  <div className="courses-list">
                    {intermediateCourses.map((course) => (
                      <div key={course} className="course-item">{course}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="multi-button-group">
            <motion.button className="multi-button" onClick={prevStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Back
            </motion.button>
            <motion.button className="multi-button right" onClick={nextStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div className="multi-form-step active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 3: Admission Payment</h2>

          <div className="form-group">
            <label htmlFor="amountPaid">Amount Paid (at admission) *</label>
            <input id="amountPaid" type="number" name="amountPaid" value={formData.amountPaid} onChange={handleChange} placeholder="e.g., 3500" className={errors.amountPaid ? 'error' : ''} required />
            {errors.amountPaid && <span className="error-text">{errors.amountPaid}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmationCode">Payment Confirmation Code *</label>
            <input id="confirmationCode" type="text" name="confirmationCode" value={formData.confirmationCode} onChange={handleChange} placeholder="e.g., MPESA/Bank ref" className={errors.confirmationCode ? 'error' : ''} required />
            {errors.confirmationCode && <span className="error-text">{errors.confirmationCode}</span>}
          </div>

          <div className="summary-section">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div className="summary-item"><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div className="summary-item"><strong>DOB:</strong> {formData.dateOfBirth}</div>
              <div className="summary-item"><strong>Nationality:</strong> {formData.nationality}</div>
              <div className="summary-item"><strong>ID/Passport:</strong> {formData.nationalIdOrPassport}</div>
              <div className="summary-item"><strong>Course:</strong> {formData.course}</div>
              {formData.course === 'Driving' && (
                <>
                  <div className="summary-item"><strong>Driving Type:</strong> {formData.drivingType}</div>
                  {formData.drivingType === 'Endorsement' && (
                    <div className="summary-item"><strong>Endorsement Class:</strong> {formData.endorsementClass}</div>
                  )}
                </>
              )}
              {formData.course === 'Computing' && (
                <div className="summary-item"><strong>Experience Level:</strong> {formData.computingLevel}</div>
              )}
              <div className="summary-item"><strong>Amount Paid:</strong> {formData.amountPaid}</div>
              <div className="summary-item"><strong>Confirmation Code:</strong> {formData.confirmationCode}</div>
            </div>
          </div>

          <div className="multi-button-group">
            <motion.button className="multi-button" onClick={prevStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Back
            </motion.button>
            <motion.button className="multi-button right" onClick={handleSubmit} disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.05 }} whileTap={{ scale: isSubmitting ? 1 : 0.95 }}>
              {isSubmitting ? 'Submitting...' : 'Submit Admission'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminAdmissionForm;