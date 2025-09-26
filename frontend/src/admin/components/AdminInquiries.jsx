import { useEffect, useMemo, useState } from 'react';
import { listEnquiries, listApplications } from '../../utils/firebase';
import '../styles/StudentsList.css';

// Helpers
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

const properCase = (s = '') => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

const AdminInquiries = () => {
  const [activeTab, setActiveTab] = useState('enquiries'); // 'enquiries' | 'applications'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [applications, setApplications] = useState([]);

  const [qEnq, setQEnq] = useState('');
  const [monthEnq, setMonthEnq] = useState('');
  const [qApp, setQApp] = useState('');
  const [monthApp, setMonthApp] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [enq, apps] = await Promise.all([
          listEnquiries({ take: 500 }),
          listApplications({ take: 500 }),
        ]);
        if (mounted) {
          setEnquiries(enq || []);
          setApplications(apps || []);
        }
      } catch (e) {
        setError(e?.message || 'Failed to fetch inquiries');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredEnquiries = useMemo(() => {
    const q = qEnq.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasMonth = !!monthEnq;
    return (enquiries || []).filter((r) => {
      if (hasMonth) {
        if (toYYYYMM(r.createdAt) !== monthEnq) return false;
      }
      if (hasQuery) {
        const fields = [r.name, r.email, r.phone, r.subject, r.message]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return fields.some((v) => v.includes(q));
      }
      return true;
    });
  }, [enquiries, qEnq, monthEnq]);

  const filteredApplications = useMemo(() => {
    const q = qApp.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasMonth = !!monthApp;
    return (applications || []).filter((r) => {
      if (hasMonth) {
        if (toYYYYMM(r.createdAt) !== monthApp) return false;
      }
      if (hasQuery) {
        const fields = [r.firstName, r.lastName, r.course, r.email, r.phone]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return fields.some((v) => v.includes(q));
      }
      return true;
    });
  }, [applications, qApp, monthApp]);

  return (
    <div className="zds-students-container">
      <div className="zds-students-card">
        <div className="zds-students-card-header">
          <div className="zds-students-header-content">
            <h2 className="zds-students-page-title">Inquiries</h2>
            <p className="zds-students-page-subtitle">Track website enquiries and online applications</p>
          </div>
          <div className="zds-students-header-actions" style={{ borderBottom: 'none' }}>
            <button
              className="zds-students-add-btn"
              style={{ background: activeTab === 'enquiries' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e5e7eb', color: activeTab === 'enquiries' ? '#fff' : '#111827' }}
              onClick={() => setActiveTab('enquiries')}
            >
              Enquiries
            </button>
            <button
              className="zds-students-add-btn"
              style={{ background: activeTab === 'applications' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e5e7eb', color: activeTab === 'applications' ? '#fff' : '#111827' }}
              onClick={() => setActiveTab('applications')}
            >
              Applications
            </button>
          </div>
        </div>

        <div className="zds-students-card-content">
          {loading && (
            <div className="zds-students-loading">
              <div className="zds-students-loading-spinner"></div>
              <p className="zds-students-loading-text">Loading inquiries...</p>
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

          {!loading && !error && activeTab === 'enquiries' && (
            <>
              <div className="zds-students-stats">
                <div className="zds-students-stat">
                  <span className="zds-students-stat-label">Total Enquiries</span>
                  <span className="zds-students-stat-value">{enquiries.length}</span>
                </div>
                {(qEnq || monthEnq) && (
                  <div className="zds-students-stat">
                    <span className="zds-students-stat-label">Filtered</span>
                    <span className="zds-students-stat-value">{filteredEnquiries.length}</span>
                  </div>
                )}
              </div>

              <div className="zds-students-header-actions" style={{ padding: '0 1.5rem 1rem' }}>
                <div className="zds-students-search">
                  <svg className="zds-students-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input className="zds-students-search-input" placeholder="Search name, email, phone or subject..." value={qEnq} onChange={(e) => setQEnq(e.target.value)} />
                </div>
                <div className="zds-students-month-filter">
                  <label className="zds-students-month-label">Month</label>
                  <input type="month" className="zds-students-month-input" value={monthEnq} onChange={(e) => setMonthEnq(e.target.value)} />
                  {monthEnq && (
                    <button className="zds-students-add-btn" style={{ padding: '6px 10px' }} onClick={() => setMonthEnq('')}>Clear</button>
                  )}
                </div>
              </div>

              <div className="zds-students-table-wrap">
                <table className="zds-students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnquiries.map((r) => (
                      <tr key={r.id} className="zds-students-row">
                        <td>{properCase(r.name || '-')}</td>
                        <td>
                          <div>{r.email || '-'}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{r.phone || ''}</div>
                        </td>
                        <td>{r.subject || 'General Inquiry'}</td>
                        <td style={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.message || '-'}</td>
                        <td>{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleString?.() || ''}</td>
                      </tr>
                    ))}
                    {filteredEnquiries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="zds-students-empty">
                          <div className="zds-students-empty-content">
                            <p className="zds-students-empty-title">No enquiries found</p>
                            <p className="zds-students-empty-desc">Try adjusting the search or month filter</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && !error && activeTab === 'applications' && (
            <>
              <div className="zds-students-stats">
                <div className="zds-students-stat">
                  <span className="zds-students-stat-label">Total Applications</span>
                  <span className="zds-students-stat-value">{applications.length}</span>
                </div>
                {(qApp || monthApp) && (
                  <div className="zds-students-stat">
                    <span className="zds-students-stat-label">Filtered</span>
                    <span className="zds-students-stat-value">{filteredApplications.length}</span>
                  </div>
                )}
              </div>

              <div className="zds-students-header-actions" style={{ padding: '0 1.5rem 1rem' }}>
                <div className="zds-students-search">
                  <svg className="zds-students-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input className="zds-students-search-input" placeholder="Search name, course, email or phone..." value={qApp} onChange={(e) => setQApp(e.target.value)} />
                </div>
                <div className="zds-students-month-filter">
                  <label className="zds-students-month-label">Month</label>
                  <input type="month" className="zds-students-month-input" value={monthApp} onChange={(e) => setMonthApp(e.target.value)} />
                  {monthApp && (
                    <button className="zds-students-add-btn" style={{ padding: '6px 10px' }} onClick={() => setMonthApp('')}>Clear</button>
                  )}
                </div>
              </div>

              <div className="zds-students-table-wrap">
                <table className="zds-students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((r) => (
                      <tr key={r.id} className="zds-students-row">
                        <td>{properCase(`${r.firstName || ''} ${r.lastName || ''}`.trim())}</td>
                        <td>{r.course || '-'}</td>
                        <td>{r.email || '-'}</td>
                        <td>{r.phone || '-'}</td>
                        <td>{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleString?.() || ''}</td>
                      </tr>
                    ))}
                    {filteredApplications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="zds-students-empty">
                          <div className="zds-students-empty-content">
                            <p className="zds-students-empty-title">No applications found</p>
                            <p className="zds-students-empty-desc">Try adjusting the search or month filter</p>
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

export default AdminInquiries;
