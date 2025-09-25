import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import modal from '../../utils/modal';
import { getAdminAdmissionById, updateAdminAdmission, deleteAdminAdmission } from '../../utils/firebase';
import { uploadAdminPassportToCloudinary } from '../../utils/cloudinary';
import '../styles/StudentDetail.css';

const DetailRow = ({ label, children, icon }) => (
  <div className="student-detail-row">
    <div className="student-detail-label">
      {icon && <span className="student-detail-icon">{icon}</span>}
      <span>{label}</span>
    </div>
    <div className="student-detail-value">
      {children}
    </div>
  </div>
);

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState(null);
  const [original, setOriginal] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const doc = await getAdminAdmissionById(id);
        if (!doc) {
          setError('Student not found');
        } else if (mounted) {
          setData(doc);
          setOriginal(doc);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load student');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Build changes preview
    const keys = [
      'firstName','lastName','dateOfBirth','nationality','nationalIdOrPassport',
      'course','drivingType','endorsementClass','computingLevel','amountPaid','confirmationCode','passportUrl'
    ];
    const changes = keys
      .filter((k) => (original?.[k] ?? '') !== (data?.[k] ?? ''))
      .map((k) => `- ${k}: "${original?.[k] ?? ''}" → "${data?.[k] ?? ''}"`)
      .join('\n');

    if (!changes) {
      const proceed = await modal.confirm({ title: 'No changes detected', text: 'No fields were modified. Save anyway?' });
      if (!proceed) return;
    } else {
      const ok = await modal.confirm({ title: 'Confirm changes', text: `You are about to apply the following changes:\n\n${changes}` });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const payload = { ...data };
      // Never allow editing id, createdAt directly
      delete payload.id;
      await updateAdminAdmission(id, payload);
      await modal.success({ title: 'Saved', text: 'Student updated successfully.' });
      setEditing(false);
      setOriginal({ ...data });
    } catch (e) {
      await modal.error({ title: 'Update failed', text: e?.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await modal.confirm({ title: 'Delete student?', text: 'This action cannot be undone.' });
    if (!ok) return;
    try {
      await deleteAdminAdmission(id);
      await modal.success({ title: 'Deleted', text: 'Student removed.' });
      navigate('/admin/students');
    } catch (e) {
      await modal.error({ title: 'Delete failed', text: e?.message || 'Please try again.' });
    }
  };

  const validateAndUploadPassport = async (file) => {
    if (!file) return;
    const isImage = file.type && file.type.startsWith('image/');
    const isSmallEnough = file.size <= 2 * 1024 * 1024; // 2MB
    if (!isImage) {
      await modal.error({ title: 'Invalid file', text: 'Please upload an image file (JPEG/PNG).' });
      return;
    }
    if (!isSmallEnough) {
      await modal.error({ title: 'File too large', text: 'Image too large (max 2MB).' });
      return;
    }
    try {
      setUploadingPhoto(true);
      const url = await uploadAdminPassportToCloudinary(file);
      if (!url) throw new Error('No URL returned from Cloudinary');
      setData((prev) => ({ ...prev, passportUrl: url }));
      await modal.success({ title: 'Photo uploaded', text: 'Passport photo updated. Click Save Changes to persist.' });
    } catch (e) {
      await modal.error({ title: 'Upload failed', text: e?.message || 'Could not upload photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onDropPassport = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await validateAndUploadPassport(file);
  };

  if (loading) {
    return (
      <div className="student-detail-container">
        <div className="student-detail-card">
          <div className="student-detail-loading-state">
            <div className="student-detail-loading-spinner"></div>
            <p className="student-detail-loading-text">Loading student details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-detail-container">
        <div className="student-detail-card">
          <div className="student-detail-error-state">
            <svg className="student-detail-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="student-detail-error-text">{error}</p>
            <button className="student-detail-back-button" onClick={() => navigate('/admin/students')}>
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="student-detail-container">
      <div className="student-detail-card">
        {/* Header */}
        <div className="student-detail-card-header">
          <div className="student-detail-header-left">
            <button className="student-detail-back-nav" onClick={() => navigate('/admin/students')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="student-detail-header-info">
              <h1 className="student-detail-name">{data.firstName} {data.lastName}</h1>
              <div className="student-detail-meta">
                <span className="student-detail-id">ID: {id.slice(0, 8)}</span>
                {data.admissionNumber && (
                  <span className="student-detail-id">Admission No: {data.admissionNumber}</span>
                )}
                <span className="student-detail-course-badge">{data.course || 'No Course'}</span>
              </div>
            </div>
          </div>
          
          <div className="student-detail-header-actions">
            {!editing ? (
              <>
                <button className="student-detail-edit-button" onClick={() => setEditing(true)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button className="student-detail-delete-button" onClick={handleDelete}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <Link to={`/admin/payments?studentId=${id}`} className="student-detail-save-button" style={{ textDecoration: 'none' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  </svg>
                  View Payment History
                </Link>
              </>
            ) : (
              <>
                <button className="student-detail-cancel-button" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="student-detail-save-button" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="student-detail-button-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="student-detail-card-content">
          <div className="student-detail-grid">
            <DetailRow 
              label="Passport Photo"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              {data.passportUrl ? (
                <img src={data.passportUrl} alt="Passport" className="student-detail-passport-photo" />
              ) : (
                <div className="student-detail-no-photo">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>No photo uploaded</span>
                </div>
              )}
              {editing && (
                <div className="student-detail-photo-actions">
                  {/* Drag & Drop Zone */}
                  <div
                    className={`student-detail-dropzone ${dragOver ? 'is-dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDropPassport}
                    style={{
                      border: '2px dashed var(--zds-border, #d1d5db)',
                      padding: 12,
                      borderRadius: 8,
                      textAlign: 'center',
                      background: dragOver ? 'rgba(59,130,246,0.06)' : 'transparent',
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                    onClick={() => document.getElementById('passport-upload-input')?.click()}
                  >
                    <div style={{ fontSize: 13, color: 'var(--zds-muted, #6b7280)' }}>
                      Drag & drop an image here, or click to browse
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--zds-muted, #9ca3af)', marginTop: 4 }}>
                      JPEG/PNG, up to 2MB
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    id="passport-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await validateAndUploadPassport(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Fallback button */}
                  <label htmlFor="passport-upload-input" className="student-detail-upload-button">
                    {uploadingPhoto ? 'Uploading...' : (data.passportUrl ? 'Change Photo' : 'Upload Photo')}
                  </label>
                </div>
              )}
            </DetailRow>

            <DetailRow 
              label="Admission Number"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            >
              <span className="student-detail-text student-detail-code">{data.admissionNumber || '-'}</span>
            </DetailRow>

            <DetailRow 
              label="First Name"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  name="firstName" 
                  value={data.firstName || ''} 
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
              ) : (
                <span className="student-detail-text">{data.firstName || '-'}</span>
              )}
            </DetailRow>

            <DetailRow 
              label="Last Name"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  name="lastName" 
                  value={data.lastName || ''} 
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              ) : (
                <span className="student-detail-text">{data.lastName || '-'}</span>
              )}
            </DetailRow>

            <DetailRow 
              label="Date of Birth"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  type="date" 
                  name="dateOfBirth" 
                  value={data.dateOfBirth || ''} 
                  onChange={handleChange} 
                />
              ) : (
                <span className="student-detail-text">{data.dateOfBirth || '-'}</span>
              )}
            </DetailRow>

            <DetailRow 
              label="Nationality"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  name="nationality" 
                  value={data.nationality || ''} 
                  onChange={handleChange}
                  placeholder="Enter nationality"
                />
              ) : (
                <span className="student-detail-text">{data.nationality || '-'}</span>
              )}
            </DetailRow>

            <DetailRow 
              label="ID/Passport"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  name="nationalIdOrPassport" 
                  value={data.nationalIdOrPassport || ''} 
                  onChange={handleChange}
                  placeholder="Enter ID or passport number"
                />
              ) : (
                <span className="student-detail-text">{data.nationalIdOrPassport || '-'}</span>
              )}
            </DetailRow>

            <DetailRow 
              label="Course"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            >
              {editing ? (
                <select className="student-detail-select" name="course" value={data.course || ''} onChange={handleChange}>
                  <option value="">Select Course</option>
                  <option value="Driving">Driving</option>
                  <option value="Computing">Computing</option>
                </select>
              ) : (
                <span className="student-detail-text">{data.course || '-'}</span>
              )}
            </DetailRow>

            {data.course === 'Driving' ? (
              <div className="student-detail-driving">
                <DetailRow 
                  label="Driving Type"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  {editing ? (
                    <select className="student-detail-select" name="drivingType" value={data.drivingType || ''} onChange={handleChange}>
                      <option value="">Select Type</option>
                      <option value="New Student">New Student</option>
                      <option value="Endorsement">Endorsement</option>
                      <option value="Refresher">Refresher</option>
                    </select>
                  ) : (
                    <span className="student-detail-text">{data.drivingType || '-'}</span>
                  )}
                </DetailRow>
                
                {data.drivingType === 'Endorsement' && (
                  <DetailRow 
                    label="Endorsement Class"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    }
                  >
                    {editing ? (
                      <select
                        className="student-detail-select"
                        name="endorsementClass"
                        value={(data.endorsementClass || '').toUpperCase()}
                        onChange={(e) => setData((prev) => ({ ...prev, endorsementClass: e.target.value }))}
                      >
                        <option value="">Select Class</option>
                        <option value="A1/A2">A1/A2</option>
                        <option value="B1/B2">B1/B2</option>
                        <option value="C1/C2">C1/C2</option>
                        <option value="D1/D2">D1/D2</option>
                      </select>
                    ) : (
                      <span className="student-detail-text">{data.endorsementClass || '-'}</span>
                    )}
                  </DetailRow>
                )}
              </div>
            ) : null}

            {data.course === 'Computing' ? (
              <DetailRow 
                label="Experience Level"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              >
                {editing ? (
                  <select className="student-detail-select" name="computingLevel" value={data.computingLevel || ''} onChange={handleChange}>
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                  </select>
                ) : (
                  <span className="student-detail-text">{data.computingLevel || '-'}</span>
                )}
              </DetailRow>
            ) : null}

            <DetailRow 
              label="Amount Paid"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  type="number" 
                  name="amountPaid" 
                  value={data.amountPaid ?? ''} 
                  onChange={handleChange}
                  placeholder="Enter amount"
                />
              ) : (
                <span className="student-detail-text student-detail-amount">
                  {typeof data.amountPaid === 'number' ? `KSh ${data.amountPaid.toLocaleString()}` : (data.amountPaid || '-')}
                </span>
              )}
            </DetailRow>

            <DetailRow 
              label="Confirmation Code"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              {editing ? (
                <input 
                  className="student-detail-input" 
                  name="confirmationCode" 
                  value={data.confirmationCode || ''} 
                  onChange={handleChange}
                  placeholder="Enter confirmation code"
                />
              ) : (
                <span className="student-detail-text student-detail-code">{data.confirmationCode || '-'}</span>
              )}
            </DetailRow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;