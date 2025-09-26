import { useEffect, useMemo, useState } from 'react';
import {
  getFuelSettings,
  setFuelPricePerLitre,
  addFuelLog,
  listFuelLogs,
  listAdminAdmissions,
} from '../../utils/firebase';
import '../styles/AdminFuel.css';
import modal from '../../utils/modal';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const toYYYYMM = (d) => {
  try {
    const date = typeof d === 'number' ? new Date(d) : (d?.seconds ? new Date(d.seconds * 1000) : new Date(d));
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } catch { return ''; }
};

const AdminFuel = () => {
  const [activeTab, setActiveTab] = useState('log'); // 'settings' | 'log' | 'logs' | 'reports'

  // Settings
  const [pricePerLitre, setPricePerLitre] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Log entry (Daily Running)
  const [vehicleId, setVehicleId] = useState('');
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');
  // Fueling-only
  const [litres, setLitres] = useState('');
  const [overridePrice, setOverridePrice] = useState('');
  // Notes split
  const [noteDaily, setNoteDaily] = useState('');
  const [noteFuel, setNoteFuel] = useState('');
  const [savingDaily, setSavingDaily] = useState(false);
  const [savingFuel, setSavingFuel] = useState(false);

  // Students selection (typeahead)
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]); // [{id,name}]

  // Logs list
  const [logs, setLogs] = useState([]);
  const [month, setMonth] = useState(toYYYYMM(new Date()));
  const [loadingLogs, setLoadingLogs] = useState(false);

  // On mount: load settings, students, and logs
  useEffect(() => {
    (async () => {
      try {
        setLoadingSettings(true);
        const s = await getFuelSettings();
        setPricePerLitre(String(s.pricePerLitre || ''));
      } catch (e) {
        // no-op
      } finally {
        setLoadingSettings(false);
      }
      try {
        const sts = await listAdminAdmissions({ take: 400 });
        setStudents(sts || []);
      } catch {}
    })();
  }, []);

  // Load logs when month changes
  useEffect(() => {
    (async () => {
      try {
        setLoadingLogs(true);
        const items = await listFuelLogs({ month, take: 500 });
        setLogs(items || []);
      } catch (e) {
        // ignore
      } finally {
        setLoadingLogs(false);
      }
    })();
  }, [month]);

  // Suggestions for students
  useEffect(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) { setStudentSuggestions([]); return; }
    const results = students
      .filter(s => `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(q) || String(s.admissionNumber || '').toLowerCase().includes(q))
      .slice(0, 8);
    setStudentSuggestions(results);
  }, [studentQuery, students]);

  const distance = useMemo(() => {
    const s = Number(startOdo) || 0;
    const e = Number(endOdo) || 0;
    return Math.max(0, e - s);
  }, [startOdo, endOdo]);

  const effectivePrice = useMemo(() => {
    return Number(overridePrice) || Number(pricePerLitre) || 0;
  }, [overridePrice, pricePerLitre]);

  const fuelCost = useMemo(() => {
    const L = Number(litres) || 0;
    return Number((L * effectivePrice).toFixed(2));
  }, [litres, effectivePrice]);

  const addStudent = (st) => {
    if (selectedStudents.find(x => x.id === st.id)) return;
    const name = `${(st.firstName || '').trim()} ${(st.lastName || '').trim()}`.trim();
    setSelectedStudents(prev => [...prev, { id: st.id, name }]);
    setStudentQuery('');
    setStudentSuggestions([]);
  };

  const removeStudent = (id) => setSelectedStudents(prev => prev.filter(s => s.id !== id));

  const saveSettings = async () => {
    try {
      const val = Number(pricePerLitre);
      if (Number.isNaN(val) || val <= 0) {
        await modal.error({ title: 'Invalid price', text: 'Enter a positive price per litre.' });
        return;
      }
      await setFuelPricePerLitre(val);
      await modal.success({ title: 'Saved', text: 'Fuel price per litre updated.' });
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Could not save price.' });
    }
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const submitLog = async () => {
    const s = Number(startOdo) || 0;
    const e = Number(endOdo) || 0;
    const L = 0; // daily entry should not consider fueling litres
    if (e <= s) return modal.error({ title: 'Invalid odometer', text: 'End reading must be greater than start reading.' });
    try {
      setSavingDaily(true);
      await addFuelLog({
        dateISO: todayISO(),
        dateMs: new Date(`${todayISO()}T00:00:00`).getTime(),
        vehicleId,
        startOdo: s,
        endOdo: e,
        litres: L,
        pricePerLitre: Number(overridePrice) || 0,
        students: selectedStudents,
        note: noteDaily,
        type: 'daily',
      });
      await modal.success({ title: 'Saved', text: 'Fuel log recorded.' });
      // Reset form (keep date)
      setVehicleId('');
      setStartOdo('');
      setEndOdo('');
      setOverridePrice('');
      setNoteDaily('');
      setNoteFuel('');
      setSelectedStudents([]);
      // Refresh logs for that month
      setMonth(toYYYYMM(new Date()));
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Could not save log.' });
    } finally {
      setSavingDaily(false);
    }
  };

  const submitFueling = async () => {
    const L = Number(litres) || 0;
    if (L <= 0) return modal.error({ title: 'Invalid litres', text: 'Enter litres added (greater than zero).' });
    try {
      setSavingFuel(true);
      await addFuelLog({
        dateISO: todayISO(),
        dateMs: new Date(`${todayISO()}T00:00:00`).getTime(),
        vehicleId,
        startOdo: 0,
        endOdo: 0,
        litres: L,
        pricePerLitre: Number(overridePrice) || 0,
        students: [],
        note: noteFuel,
        type: 'fueling',
      });
      await modal.success({ title: 'Saved', text: 'Fueling entry recorded.' });
      setLitres('');
      setOverridePrice('');
      setNoteFuel('');
      setMonth(toYYYYMM(new Date()));
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Could not save fueling entry.' });
    } finally {
      setSavingFuel(false);
    }
  };

  // Aggregations
  const totals = useMemo(() => {
    const sum = (k) => logs.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);
    return {
      trips: logs.length,
      distanceKm: sum('distanceKm'),
      litres: sum('litres'),
      fuelCost: sum('fuelCost'),
    };
  }, [logs]);

  // Simple weekly and monthly rollups for current month logs
  const weekly = useMemo(() => {
    const map = new Map();
    logs.forEach(r => {
      const d = new Date(r.dateMs);
      const weekKey = `${d.getFullYear()}-W${Math.ceil(((d - new Date(d.getFullYear(),0,1)) / 86400000 + new Date(d.getFullYear(),0,1).getDay()+1) / 7)}`;
      const cur = map.get(weekKey) || { distanceKm: 0, litres: 0, fuelCost: 0 };
      cur.distanceKm += Number(r.distanceKm) || 0;
      cur.litres += Number(r.litres) || 0;
      cur.fuelCost += Number(r.fuelCost) || 0;
      map.set(weekKey, cur);
    });
    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }, [logs]);

  return (
    <div className="admin-fuel-container">
      <div className="admin-fuel-card">
        <div className="admin-fuel-card-header">
          <div className="admin-fuel-header-content">
            <h1 className="admin-fuel-page-title">Fuel Tracking</h1>
            <p className="admin-fuel-page-subtitle">Log daily mileage and fuel, track costs and efficiency</p>
          </div>
          <div className="admin-fuel-header-actions">
            <div className="admin-fuel-month-filter">
              <label className="admin-fuel-label">Month</label>
              <input 
                type="month" 
                className="admin-fuel-month-input" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="admin-fuel-stats">
          <div className="admin-fuel-stat">
            <span className="admin-fuel-stat-label">Total Distance</span>
            <span className="admin-fuel-stat-value">{totals.distanceKm} km</span>
          </div>
          <div className="admin-fuel-stat">
            <span className="admin-fuel-stat-label">Total Litres</span>
            <span className="admin-fuel-stat-value">{totals.litres}</span>
          </div>
          <div className="admin-fuel-stat">
            <span className="admin-fuel-stat-label">Fuel Cost</span>
            <span className="admin-fuel-stat-value">{currency(totals.fuelCost)}</span>
          </div>
          <div className="admin-fuel-stat">
            <span className="admin-fuel-stat-label">Efficiency</span>
            <span className="admin-fuel-stat-value">{(totals.distanceKm && totals.litres) ? `${(totals.distanceKm / totals.litres).toFixed(2)} km/L` : '-'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-fuel-nav">
          <button
            className={`admin-fuel-tab ${activeTab === 'log' ? 'admin-fuel-tab-active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            Log Entry
          </button>
          <button
            className={`admin-fuel-tab ${activeTab === 'logs' ? 'admin-fuel-tab-active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Daily Logs
          </button>
          <button
            className={`admin-fuel-tab ${activeTab === 'reports' ? 'admin-fuel-tab-active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button
            className={`admin-fuel-tab ${activeTab === 'settings' ? 'admin-fuel-tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="admin-fuel-card-content">
          {activeTab === 'settings' && (
            <div>
              <h2 className="admin-fuel-section-title">Fuel Settings</h2>
              <div className="admin-fuel-section-card">
                <div className="admin-fuel-section-card-header">Price Per Litre</div>
                <div className="admin-fuel-grid admin-fuel-grid-3">
                  <div>
                    <label className="admin-fuel-label">Current Price (KSh)</label>
                    <input 
                      type="number" 
                      className="admin-fuel-input" 
                      placeholder="e.g., 190" 
                      value={pricePerLitre} 
                      onChange={(e) => setPricePerLitre(e.target.value)} 
                      disabled={loadingSettings} 
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button 
                      className="admin-fuel-btn" 
                      onClick={saveSettings} 
                      disabled={loadingSettings || !Number(pricePerLitre)}
                    >
                      {loadingSettings ? 'Saving...' : 'Save Price'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div>
              <h2 className="admin-fuel-section-title">Fuel Log Entry</h2>
              <div className="admin-fuel-grid admin-fuel-grid-2">
                {/* Daily Running Section */}
                <div className="admin-fuel-section-card">
                  <div className="admin-fuel-section-card-header">Daily Running</div>
                  <div className="admin-fuel-grid">
                    <div>
                      <label className="admin-fuel-label">Start Odometer</label>
                      <input 
                        type="number" 
                        className="admin-fuel-input" 
                        value={startOdo} 
                        onChange={(e) => setStartOdo(e.target.value)} 
                        placeholder="Starting reading"
                      />
                    </div>
                    <div>
                      <label className="admin-fuel-label">End Odometer</label>
                      <input 
                        type="number" 
                        className="admin-fuel-input" 
                        value={endOdo} 
                        onChange={(e) => setEndOdo(e.target.value)} 
                        placeholder="Ending reading"
                      />
                    </div>
                    <div>
                      <label className="admin-fuel-label">Distance Covered</label>
                      <div className="admin-fuel-calculated">{distance} km</div>
                    </div>
                    <div>
                      <label className="admin-fuel-label">Vehicle (Optional)</label>
                      <input 
                        type="text" 
                        className="admin-fuel-input" 
                        placeholder="Registration / Name" 
                        value={vehicleId} 
                        onChange={(e) => setVehicleId(e.target.value)} 
                      />
                    </div>
                    <div className="admin-fuel-grid-full">
                      <label className="admin-fuel-label">Students Trained Today</label>
                      <div className="admin-fuel-student-selector">
                        <input 
                          className="admin-fuel-input" 
                          placeholder="Search by name or admission number..." 
                          value={studentQuery} 
                          onChange={(e) => setStudentQuery(e.target.value)} 
                        />
                        {studentSuggestions.length > 0 && (
                          <div className="admin-fuel-suggestions">
                            {studentSuggestions.map(s => (
                              <div 
                                key={s.id} 
                                className="admin-fuel-suggestion-item" 
                                onClick={() => addStudent(s)}
                              >
                                {(s.firstName || '')} {(s.lastName || '')} {s.admissionNumber ? `(${s.admissionNumber})` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedStudents.length > 0 && (
                        <div className="admin-fuel-selected-students">
                          {selectedStudents.map(st => (
                            <div key={st.id} className="admin-fuel-student-tag">
                              <span>{st.name}</span>
                              <button 
                                className="admin-fuel-student-tag-remove"
                                onClick={() => removeStudent(st.id)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="admin-fuel-grid-full">
                      <label className="admin-fuel-label">Notes (Optional)</label>
                      <input 
                        className="admin-fuel-input" 
                        value={noteDaily} 
                        onChange={(e) => setNoteDaily(e.target.value)} 
                        placeholder="e.g., Training route details" 
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <button 
                      className="admin-fuel-btn" 
                      onClick={submitLog} 
                      disabled={savingDaily || !(Number(endOdo) > Number(startOdo))}
                    >
                      {savingDaily ? 'Saving...' : 'Save Daily Running'}
                    </button>
                  </div>
                </div>

                {/* Fueling Section */}
                <div className="admin-fuel-section-card">
                  <div className="admin-fuel-section-card-header">Fueling Entry</div>
                  <div className="admin-fuel-grid">
                    <div>
                      <label className="admin-fuel-label">Litres Added</label>
                      <input 
                        type="number" 
                        className="admin-fuel-input" 
                        value={litres} 
                        onChange={(e) => setLitres(e.target.value)} 
                        placeholder="Amount in litres"
                      />
                    </div>
                    <div>
                      <label className="admin-fuel-label">Price/Litre Override</label>
                      <input 
                        type="number" 
                        className="admin-fuel-input" 
                        value={overridePrice} 
                        onChange={(e) => setOverridePrice(e.target.value)} 
                        placeholder={pricePerLitre ? `Default: ${pricePerLitre}` : 'Default from settings'} 
                      />
                    </div>
                    <div>
                      <label className="admin-fuel-label">Total Fuel Cost</label>
                      <div className="admin-fuel-calculated">{currency(fuelCost)}</div>
                    </div>
                    <div className="admin-fuel-grid-full">
                      <label className="admin-fuel-label">Notes (Optional)</label>
                      <input 
                        className="admin-fuel-input" 
                        value={noteFuel} 
                        onChange={(e) => setNoteFuel(e.target.value)} 
                        placeholder="e.g., Fueled at station details" 
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <button 
                      className="admin-fuel-btn" 
                      onClick={submitFueling} 
                      disabled={savingFuel || !(Number(litres) > 0)}
                    >
                      {savingFuel ? 'Saving...' : 'Save Fueling Entry'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="admin-fuel-section-title">Fuel Logs</h2>
              
              {/* Daily Logs */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: 600 }}>Daily Running Logs</h3>
                <FuelTable loading={loadingLogs} rows={logs.filter(l => l.type === 'daily')} showFuel={false} />
              </div>

              {/* Fueling Logs */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: 600 }}>Fueling Logs</h3>
                <FuelTable loading={loadingLogs} rows={logs.filter(l => l.type === 'fueling')} showFuel={true} />
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="admin-fuel-section-title">Fuel Reports & Analytics</h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: 600 }}>Weekly Breakdown</h3>
                {weekly.length === 0 ? (
                  <div className="admin-fuel-empty">
                    <div className="admin-fuel-empty-content">
                      <svg className="admin-fuel-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="admin-fuel-empty-title">No Weekly Data</h3>
                      <p className="admin-fuel-empty-desc">No fuel logs found for the selected month</p>
                    </div>
                  </div>
                ) : (
                  <div className="admin-fuel-table-wrap">
                    <table className="admin-fuel-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Distance</th>
                          <th>Litres</th>
                          <th>Fuel Cost</th>
                          <th>Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekly.map(w => (
                          <tr key={w.label}>
                            <td>{w.label}</td>
                            <td>{w.distanceKm} km</td>
                            <td>{w.litres}</td>
                            <td><strong>{currency(w.fuelCost)}</strong></td>
                            <td>{(w.distanceKm && w.litres) ? `${(w.distanceKm / w.litres).toFixed(2)} km/L` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable table renderer for logs
function FuelTable({ loading, rows, showFuel }) {
  return (
    <div className="admin-fuel-table-wrap">
      <table className="admin-fuel-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Vehicle</th>
            {showFuel ? null : <th>Odometer</th>}
            {showFuel ? null : <th>Distance</th>}
            {showFuel ? <th>Litres</th> : null}
            {showFuel ? <th>Price/L</th> : null}
            {showFuel ? <th>Cost</th> : null}
            {showFuel ? null : <th>Students</th>}
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={showFuel ? 6 : 6} className="admin-fuel-empty">
                <div className="admin-fuel-loading">
                  <div className="admin-fuel-loading-spinner"></div>
                  <p className="admin-fuel-loading-text">Loading...</p>
                </div>
              </td>
            </tr>
          )}
          {!loading && rows.map(r => (
            <tr key={`${r.id}`}>
              <td>{r.dateISO}</td>
              <td>{r.vehicleId || '-'}</td>
              {showFuel ? null : <td>{r.startOdo} → {r.endOdo}</td>}
              {showFuel ? null : <td>{r.distanceKm} km</td>}
              {showFuel ? <td>{r.litres}</td> : null}
              {showFuel ? <td><strong>{currency(r.pricePerLitre)}</strong></td> : null}
              {showFuel ? <td><strong>{currency(r.fuelCost)}</strong></td> : null}
              {showFuel ? null : <td>{(r.students || []).map(s => s.name).join(', ')}</td>}
              <td style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note || ''}</td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={showFuel ? 6 : 6} className="admin-fuel-empty">
                <div className="admin-fuel-empty-content">
                  <svg className="admin-fuel-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="admin-fuel-empty-title">No Records Found</p>
                  <p className="admin-fuel-empty-desc">Try selecting a different month</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminFuel;
