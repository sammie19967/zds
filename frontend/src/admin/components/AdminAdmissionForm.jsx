import { useState } from 'react';
import modal from '../../utils/modal';
import { submitAdminAdmission } from '../../utils/firebase';
import { uploadAdminPassportToCloudinary } from '../../utils/cloudinary';

import '../styles/AdmissionForm.css';
import logo from '../../assets/logo.png';
import { motion } from 'framer-motion';

const AdminAdmissionForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportPreview, setPassportPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationalIdOrPassport: '',
    nationality: '',
    course: '', // Driving | Computing
    drivingType: '', // New Student | Endorsement | Refresher
    endorsementClass: '',
    drivingClass: '', // For New Student/Refresher, defaults to B1/B2
    computingLevel: '', // Beginner | Intermediate
    passportFile: null,
  });
  const [errors, setErrors] = useState({});

  // Max selectable DOB should be 18 years ago (deny under 18)
  const eighteenYearsAgo = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const isAtLeast18 = (dobStr) => {
    const dob = new Date(dobStr);
    if (Number.isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const validateAndSetPassport = (file) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, passportFile: null }));
      setErrors((prev) => ({ ...prev, passportFile: '' })); // No error, it's optional
      return;
    }
    const isImage = file.type && file.type.startsWith('image/');
    const isSmallEnough = file.size <= 2 * 1024 * 1024; // 2MB
    if (!isImage) {
      setErrors((prev) => ({ ...prev, passportFile: 'Please upload an image file (JPEG/PNG).' }));
      setFormData((prev) => ({ ...prev, passportFile: null }));
      return;
    }
    if (!isSmallEnough) {
      setErrors((prev) => ({ ...prev, passportFile: 'Image too large (max 2MB).' }));
      setFormData((prev) => ({ ...prev, passportFile: null }));
      return;
    }
    if (passportPreview) {
      URL.revokeObjectURL(passportPreview);
      setPassportPreview(null);
    }
    const url = URL.createObjectURL(file);
    setPassportPreview(url);
    setFormData((prev) => ({ ...prev, passportFile: file }));
    setErrors((prev) => ({ ...prev, passportFile: '' }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'passportFile') {
      const file = files && files[0] ? files[0] : null;
      validateAndSetPassport(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
    validateAndSetPassport(file);
  };

  const removePassport = () => {
    if (passportPreview) {
      URL.revokeObjectURL(passportPreview);
      setPassportPreview(null);
    }
    setFormData((prev) => ({ ...prev, passportFile: null }));
    setErrors((prev) => ({ ...prev, passportFile: '' }));
  };

  const validateStep = (current) => {
    const newErrors = {};
    if (current === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      } else if (!isAtLeast18(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Student must be at least 18 years old';
      }
      if (!formData.nationalIdOrPassport) newErrors.nationalIdOrPassport = 'ID/Passport is required';
      if (!formData.nationality) newErrors.nationality = 'Nationality is required';
      // Passport photo is now optional, no validation needed
    }
    if (current === 2) {
      if (!formData.course) newErrors.course = 'Course selection is required';
      if (formData.course === 'Driving' && !formData.drivingType) {
        newErrors.drivingType = 'Driving type is required';
      }
      if (formData.drivingType === 'Endorsement' && !formData.endorsementClass) {
        newErrors.endorsementClass = 'Endorsement class is required';
      }
      // For New Student / Refresher, ensure drivingClass default exists
      if (formData.course === 'Driving' && formData.drivingType && formData.drivingType !== 'Endorsement') {
        if (!formData.drivingClass) {
          setFormData((prev) => ({ ...prev, drivingClass: 'B1/B2' }));
        }
      }
      if (formData.course === 'Computing' && !formData.computingLevel) {
        newErrors.computingLevel = 'Experience level is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cropImageToSquare = (file) => new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Failed to crop image'));
            return;
          }
          const ext = file.type === 'image/png' ? 'png' : 'jpg';
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const cropped = new File([blob], `passport_square.${ext}`, { type: mime });
          resolve(cropped);
        }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92);
      };
      img.onerror = reject;
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });

  const validateAll = () => {
    if (!validateStep(1)) { setStep(1); return false; }
    if (!validateStep(2)) { setStep(2); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setIsSubmitting(true);
    try {
      let passportUrl = '';
      if (formData.passportFile) {
        const cropped = await cropImageToSquare(formData.passportFile);
        passportUrl = await uploadAdminPassportToCloudinary(cropped);
      }
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationalIdOrPassport: formData.nationalIdOrPassport,
        nationality: formData.nationality,
        course: formData.course,
        drivingType: formData.drivingType,
        endorsementClass: formData.endorsementClass,
        drivingClass: formData.drivingType === 'Endorsement' ? '' : (formData.drivingClass || 'B1/B2'),
        computingLevel: formData.computingLevel,
        passportUrl,
      };

      const result = await submitAdminAdmission(payload);
      await modal.success({
        title: 'Student registered!',
        text: result?.admissionNumber
          ? `The admission has been recorded successfully.\nAdmission No: ${result.admissionNumber}`
          : 'The admission has been recorded successfully.',
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
        drivingClass: '',
        computingLevel: '',
        passportFile: null,
      });
      if (passportPreview) {
        URL.revokeObjectURL(passportPreview);
        setPassportPreview(null);
      }
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
    <div className="admin-admission-container">
      <div className="admin-admission-header">
        <div className="admin-admission-logo">
          <img src={logo} alt="Logo" className="admin-admission-logo-img" />
        </div>
        <h1 className="admin-admission-title">Admin: Register New Student</h1>
      </div>

      <div className="admin-admission-progress-bar">
        <div className="admin-admission-progress" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      {step === 1 && (
        <motion.div className="admin-admission-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 1: Personal Information</h2>
          <div className="admin-admission-row">
            <div className="admin-admission-group">
              <label htmlFor="firstName">First Name *</label>
              <input 
                id="firstName" 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="Enter first name" 
                className={`admin-admission-input ${errors.firstName ? 'admin-admission-error' : ''}`} 
                required 
              />
              {errors.firstName && <span className="admin-admission-error-text">{errors.firstName}</span>}
            </div>
            <div className="admin-admission-group">
              <label htmlFor="lastName">Last Name *</label>
              <input 
                id="lastName" 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Enter last name" 
                className={`admin-admission-input ${errors.lastName ? 'admin-admission-error' : ''}`} 
                required 
              />
              {errors.lastName && <span className="admin-admission-error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="admin-admission-row">
            <div className="admin-admission-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`admin-admission-input ${errors.dateOfBirth ? 'admin-admission-error' : ''}`}
                required
                max={eighteenYearsAgo}
              />
              {errors.dateOfBirth && <span className="admin-admission-error-text">{errors.dateOfBirth}</span>}
            </div>
            <div className="admin-admission-group">
              <label htmlFor="nationality">Nationality *</label>
              <select 
                id="nationality" 
                name="nationality" 
                value={formData.nationality} 
                onChange={handleChange} 
                className={`admin-admission-select ${errors.nationality ? 'admin-admission-error' : ''}`} 
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
              {errors.nationality && <span className="admin-admission-error-text">{errors.nationality}</span>}
            </div>
          </div>

          <div className="admin-admission-row">
            <div className="admin-admission-group">
              <label htmlFor="nationalIdOrPassport">National ID / Passport *</label>
              <input 
                id="nationalIdOrPassport" 
                type="text" 
                name="nationalIdOrPassport" 
                value={formData.nationalIdOrPassport} 
                onChange={handleChange} 
                placeholder="Enter ID or Passport number" 
                className={`admin-admission-input ${errors.nationalIdOrPassport ? 'admin-admission-error' : ''}`} 
                required 
              />
              {errors.nationalIdOrPassport && <span className="admin-admission-error-text">{errors.nationalIdOrPassport}</span>}
            </div>
            <div className="admin-admission-group">
              <label htmlFor="passportFile">Passport Photo (JPEG/PNG, max 2MB) <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span></label>
              <div
                className={`admin-admission-upload-area ${dragActive ? 'admin-admission-drag-active' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input id="passportFile" type="file" name="passportFile" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
                <label htmlFor="passportFile" className="admin-admission-upload-label">
                  Click to choose a file or drag & drop here
                </label>
                {errors.passportFile && <span className="admin-admission-error-text">{errors.passportFile}</span>}
                {passportPreview && (
                  <div className="admin-admission-image-preview">
                    <img src={passportPreview} alt="Passport preview" className="admin-admission-preview-img" />
                    <button type="button" className="admin-admission-button admin-admission-button-secondary admin-admission-button-small" onClick={removePassport}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-admission-button-group">
            <div className="admin-admission-button-right">
              <motion.button className="admin-admission-button admin-admission-button-primary" onClick={nextStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Next
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div className="admin-admission-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 2: Course Selection</h2>
          <div className="admin-admission-group">
            <label htmlFor="course">Course *</label>
            <select 
              id="course" 
              name="course" 
              value={formData.course} 
              onChange={handleChange} 
              className={`admin-admission-select ${errors.course ? 'admin-admission-error' : ''}`} 
              required
            >
              <option value="">Select Course</option>
              <option value="Driving">Driving</option>
              <option value="Computing">Computing</option>
            </select>
            {errors.course && <span className="admin-admission-error-text">{errors.course}</span>}
          </div>

          {formData.course === 'Driving' && (
            <>
              <div className="admin-admission-group">
                <label htmlFor="drivingType">Driving Type *</label>
                <select
                  id="drivingType"
                  name="drivingType"
                  value={formData.drivingType}
                  onChange={handleChange}
                  className={`admin-admission-select ${errors.drivingType ? 'admin-admission-error' : ''}`}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="New Student">New Student</option>
                  <option value="Endorsement">Endorsement</option>
                  <option value="Refresher">Refresher</option>
                </select>
                {errors.drivingType && <span className="admin-admission-error-text">{errors.drivingType}</span>}
              </div>

              {formData.drivingType === 'Endorsement' && (
                <div className="admin-admission-group">
                  <label htmlFor="endorsementClass">Endorsement Class *</label>
                  <select
                    id="endorsementClass"
                    name="endorsementClass"
                    value={formData.endorsementClass}
                    onChange={handleChange}
                    className={`admin-admission-select ${errors.endorsementClass ? 'admin-admission-error' : ''}`}
                    required
                  >
                    <option value="">Select Class</option>
                    {drivingClasses.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.endorsementClass && <span className="admin-admission-error-text">{errors.endorsementClass}</span>}
                </div>
              )}
            </>
          )}

          {formData.course === 'Computing' && (
            <>
              <div className="admin-admission-group">
                <label htmlFor="computingLevel">Experience Level *</label>
                <select
                  id="computingLevel"
                  name="computingLevel"
                  value={formData.computingLevel}
                  onChange={handleChange}
                  className={`admin-admission-select ${errors.computingLevel ? 'admin-admission-error' : ''}`}
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                </select>
                {errors.computingLevel && <span className="admin-admission-error-text">{errors.computingLevel}</span>}
              </div>

              {formData.computingLevel === 'Beginner' && (
                <div className="admin-admission-group">
                  <label>Beginner Courses (All included)</label>
                  <div className="admin-admission-courses-list">
                    {beginnerCourses.map((course) => (
                      <div key={course} className="admin-admission-course-item">{course}</div>
                    ))}
                  </div>
                </div>
              )}
              {formData.computingLevel === 'Intermediate' && (
                <div className="admin-admission-group">
                  <label>Intermediate Courses (All included)</label>
                  <div className="admin-admission-courses-list">
                    {intermediateCourses.map((course) => (
                      <div key={course} className="admin-admission-course-item">{course}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="admin-admission-button-group">
            <motion.button className="admin-admission-button admin-admission-button-secondary" onClick={prevStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Back
            </motion.button>
            <motion.button className="admin-admission-button admin-admission-button-primary" onClick={nextStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div className="admin-admission-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <h2>Step 3: Review & Submit</h2>

          <div className="admin-admission-summary-section">
            <h3>Summary</h3>
            <div className="admin-admission-summary-grid">
              <div className="admin-admission-summary-item"><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div className="admin-admission-summary-item"><strong>DOB:</strong> {formData.dateOfBirth}</div>
              <div className="admin-admission-summary-item"><strong>Nationality:</strong> {formData.nationality}</div>
              <div className="admin-admission-summary-item"><strong>ID/Passport:</strong> {formData.nationalIdOrPassport}</div>
              <div className="admin-admission-summary-item"><strong>Course:</strong> {formData.course}</div>
              {formData.course === 'Driving' && (
                <>
                  <div className="admin-admission-summary-item"><strong>Driving Type:</strong> {formData.drivingType}</div>
                  {formData.drivingType !== 'Endorsement' && (
                    <div className="admin-admission-summary-item"><strong>Driving Class:</strong> {formData.drivingClass || 'B1/B2'}</div>
                  )}
                  {formData.drivingType === 'Endorsement' && (
                    <div className="admin-admission-summary-item"><strong>Endorsement Class:</strong> {formData.endorsementClass}</div>
                  )}
                </>
              )}
              {formData.course === 'Computing' && (
                <div className="admin-admission-summary-item"><strong>Experience Level:</strong> {formData.computingLevel}</div>
              )}
            </div>
          </div>

          <div className="admin-admission-button-group">
            <motion.button className="admin-admission-button admin-admission-button-secondary" onClick={prevStep} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Back
            </motion.button>
            <motion.button className="admin-admission-button admin-admission-button-primary" onClick={handleSubmit} disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.05 }} whileTap={{ scale: isSubmitting ? 1 : 0.95 }}>
              {isSubmitting ? 'Submitting...' : 'Submit Admission'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminAdmissionForm;