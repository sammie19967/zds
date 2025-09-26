import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminAdmissions } from '../../utils/firebase';
import '../styles/StudentsList.css';

// Proper-case a full name string (handles spaces, hyphens, apostrophes)
const properCase = (s = '') => s
  .toLowerCase()
  .replace(/\b([a-z])/g, (m) => m.toUpperCase());

const formatDate = (ts) => {
  if (!ts) return '';
  // Firestore serverTimestamp can be a Timestamp
  try {
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString();
  } catch {
    return '';
  }
};

// Helper to get YYYY-MM from a timestamp
const toYYYYMM = (ts) => {
  try {
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch {
    return '';
  }
};

const StudentsList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(''); // YYYY-MM

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listAdminAdmissions({ take: 500 });
        if (mounted) setRows(data);
      } catch (e) {
        setError(e?.message || 'Failed to fetch students');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasMonth = !!month;
    return rows.filter((r) => {
      // Month filter by createdAt
      if (hasMonth) {
        const rowMonth = toYYYYMM(r.createdAt);
        if (rowMonth !== month) return false;
      }
      // Text search
      if (hasQuery) {
        const fields = [r.firstName, r.lastName, r.course, r.admissionNumber]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return fields.some((v) => v.includes(q));
      }
      return true;
    });
  }, [rows, query, month]);

  return (
    <div className="zds-students-container">
      <div className="zds-students-card">
        <div className="zds-students-card-header">
          <div className="zds-students-header-content">
            <h2 className="zds-students-page-title">Students</h2>
            <p className="zds-students-page-subtitle">Manage and view all enrolled students</p>
          </div>
          
          <div className="zds-students-header-actions">
            <div className="zds-students-search">
              <svg className="zds-students-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="zds-students-search-input"
                placeholder="Search name, course or admission no..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="zds-students-month-filter">
              <label className="zds-students-month-label">Month</label>
              <input
                type="month"
                className="zds-students-month-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              {month && (
                <button className="zds-students-add-btn" style={{ padding: '6px 10px' }} onClick={() => setMonth('')}>
                  Clear
                </button>
              )}
            </div>
            <Link className="zds-students-add-btn" to="/admin/register">
              <svg className="zds-students-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </Link>
          </div>
        </div>

        <div className="zds-students-card-content">
          {loading && (
            <div className="zds-students-loading">
              <div className="zds-students-loading-spinner"></div>
              <p className="zds-students-loading-text">Loading students...</p>
            </div>
          )}
          
          {error && (
            <div className="zds-students-error">
              <svg className="zds-students-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="zds-students-error-text">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="zds-students-stats">
                <div className="zds-students-stat">
                  <span className="zds-students-stat-label">Total Students</span>
                  <span className="zds-students-stat-value">{rows.length}</span>
                </div>
                {(query || month) && (
                  <div className="zds-students-stat">
                    <span className="zds-students-stat-label">Filtered Results</span>
                    <span className="zds-students-stat-value">{filtered.length}</span>
                  </div>
                )}
              </div>

              <div className="zds-students-table-wrap">
                <table className="zds-students-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="zds-students-th">
                          <svg className="zds-students-th-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Student Name
                        </div>
                      </th>
                      <th>
                        <div className="zds-students-th">
                          <svg className="zds-students-th-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Admission No.
                        </div>
                      </th>
                      <th>
                        <div className="zds-students-th">
                          <svg className="zds-students-th-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Course
                        </div>
                      </th>
                      <th>
                        <div className="zds-students-th">
                          <svg className="zds-students-th-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                          Program Details
                        </div>
                      </th>
                      <th>
                        <div className="zds-students-th">
                          <svg className="zds-students-th-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Registered
                        </div>
                      </th>
                      <th>
                        <div className="zds-students-th">Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="zds-students-row">
                        <td className="zds-students-name-cell">
                          <Link to={`/admin/students/${r.id}`} className="zds-students-link">
                            <div className="zds-students-avatar">
                              {(r.firstName?.[0] || '').toUpperCase()}
                              {(r.lastName?.[0] || '').toUpperCase()}
                            </div>
                            <div className="zds-students-info">
                              <span className="zds-students-name">
                                {properCase(`${r.firstName || ''} ${r.lastName || ''}`.trim())}
                              </span>
                              <span className="zds-students-id">ID: {r.id.slice(0, 8)}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="zds-students-admission-cell">
                          <span className="zds-students-admission-badge">{r.admissionNumber || '-'}</span>
                        </td>
                        <td className="zds-students-course-cell">
                          <span className="zds-students-course-badge">{r.course}</span>
                        </td>
                        <td className="zds-students-program-cell">
                          {r.course === 'Driving' ? (
                            <span className="zds-students-program">
                              {(r.drivingType || '-')}{' '}
                              {r.drivingType ? '•' : ''}{' '}
                              {r.drivingType === 'Endorsement' ? (r.endorsementClass || '-') : ((r.drivingClass || 'B1/B2'))}
                            </span>
                          ) : (
                            <span className="zds-students-program">{r.computingLevel || '-'}</span>
                          )}
                        </td>
                        <td className="zds-students-date-cell">
                          <span className="zds-students-date">{formatDate(r.createdAt)}</span>
                        </td>
                        <td className="zds-students-actions">
                          <Link to={`/admin/payments?studentId=${r.id}`} className="zds-students-add-btn" style={{ padding: '6px 10px' }}>
                            Payments
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="zds-students-empty">
                          <div className="zds-students-empty-content">
                            <svg className="zds-students-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="zds-students-empty-title">No students found</p>
                            <p className="zds-students-empty-desc">
                              {query || month ? 'Try adjusting the search or month filter' : 'No students have been registered yet'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsList;