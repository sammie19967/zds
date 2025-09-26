import { useEffect, useMemo, useState } from 'react';
import {
  getFuelSettings,
  setFuelPricePerLitre,
  addFuelLog,
  listFuelLogs,
  listAdminAdmissions,
} from '../../utils/firebase';
import '../styles/StudentsList.css';
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

  // Log entry
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicleId, setVehicleId] = useState('');
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [litres, setLitres] = useState('');
  const [overridePrice, setOverridePrice] = useState('');
  const [note, setNote] = useState('');
  const [savingLog, setSavingLog] = useState(false);

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

  const submitLog = async () => {
    const s = Number(startOdo) || 0;
    const e = Number(endOdo) || 0;
    const L = Number(litres) || 0;
    if (!dateISO) return modal.error({ title: 'Missing date', text: 'Please pick the date.' });
    if (e <= s) return modal.error({ title: 'Invalid odometer', text: 'End reading must be greater than start reading.' });
    if (L < 0) return modal.error({ title: 'Invalid litres', text: 'Litres must be zero or positive.' });
    try {
      setSavingLog(true);
      await addFuelLog({
        dateISO,
        dateMs: new Date(`${dateISO}T00:00:00`).getTime(),
        vehicleId,
        startOdo: s,
        endOdo: e,
        litres: L,
        pricePerLitre: Number(overridePrice) || 0,
        students: selectedStudents,
        note,
      });
      await modal.success({ title: 'Saved', text: 'Fuel log recorded.' });
      // Reset form (keep date)
      setVehicleId('');
      setStartOdo('');
      setEndOdo('');
      setLitres('');
      setOverridePrice('');
      setNote('');
      setSelectedStudents([]);
      // Refresh logs for that month
      setMonth(toYYYYMM(new Date(dateISO)));
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Could not save log.' });
    } finally {
      setSavingLog(false);
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
    <div className="zds-students-container">
      <div className="zds-students-card">
        <div className="zds-students-card-header" style={{ paddingBottom: 0 }}>
          <div className="zds-students-header-content">
            <h2 className="zds-students-page-title">Fuel Tracking</h2>
            <p className="zds-students-page-subtitle">Log daily mileage and fuel, track costs and efficiency</p>
          </div>
          <div className="zds-students-header-actions">
            <button className="zds-students-add-btn" style={{ background: activeTab==='log'?'linear-gradient(135deg, #3b82f6, #2563eb)':'#e5e7eb', color: activeTab==='log'?'#fff':'#111827' }} onClick={() => setActiveTab('log')}>Log Entry</button>
            <button className="zds-students-add-btn" style={{ background: activeTab==='logs'?'linear-gradient(135deg, #3b82f6, #2563eb)':'#e5e7eb', color: activeTab==='logs'?'#fff':'#111827' }} onClick={() => setActiveTab('logs')}>Daily Logs</button>
            <button className="zds-students-add-btn" style={{ background: activeTab==='reports'?'linear-gradient(135deg, #3b82f6, #2563eb)':'#e5e7eb', color: activeTab==='reports'?'#fff':'#111827' }} onClick={() => setActiveTab('reports')}>Reports</button>
            <button className="zds-students-add-btn" style={{ background: activeTab==='settings'?'linear-gradient(135deg, #3b82f6, #2563eb)':'#e5e7eb', color: activeTab==='settings'?'#fff':'#111827' }} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>
        </div>

        <div className="zds-students-card-content" style={{ padding: '1rem 1.5rem 1.5rem' }}>
          {activeTab === 'settings' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <h3>Price Per Litre</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <input type="number" className="student-detail-input" placeholder="e.g., 190" value={pricePerLitre} onChange={(e)=>setPricePerLitre(e.target.value)} disabled={loadingSettings} />
                <button className="student-detail-save-button" onClick={saveSettings} disabled={loadingSettings || !Number(pricePerLitre)}>Save</button>
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <h3>New Daily Log</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
                <div>
                  <label className="zds-students-month-label">Date</label>
                  <input type="date" className="student-detail-input" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} />
                </div>
                <div>
                  <label className="zds-students-month-label">Vehicle (optional)</label>
                  <input type="text" className="student-detail-input" placeholder="Reg / Name" value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)} />
                </div>
                <div>
                  <label className="zds-students-month-label">Start Odo</label>
                  <input type="number" className="student-detail-input" value={startOdo} onChange={(e)=>setStartOdo(e.target.value)} />
                </div>
                <div>
                  <label className="zds-students-month-label">End Odo</label>
                  <input type="number" className="student-detail-input" value={endOdo} onChange={(e)=>setEndOdo(e.target.value)} />
                </div>
                <div>
                  <label className="zds-students-month-label">Distance</label>
                  <div className="student-detail-input" style={{ display: 'flex', alignItems: 'center', background: '#f9fafb' }}>{distance} km</div>
                </div>
                <div>
                  <label className="zds-students-month-label">Litres Added</label>
                  <input type="number" className="student-detail-input" value={litres} onChange={(e)=>setLitres(e.target.value)} />
                </div>
                <div>
                  <label className="zds-students-month-label">Price/Litre (override, optional)</label>
                  <input type="number" className="student-detail-input" value={overridePrice} onChange={(e)=>setOverridePrice(e.target.value)} placeholder={pricePerLitre ? `Default: ${pricePerLitre}` : 'Default from settings'} />
                </div>
                <div>
                  <label className="zds-students-month-label">Fuel Cost</label>
                  <div className="student-detail-input" style={{ display: 'flex', alignItems: 'center', background: '#f9fafb' }}>{currency(fuelCost)}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="zds-students-month-label">Students Trained Today</label>
                  <div style={{ position: 'relative' }}>
                    <input className="student-detail-input" placeholder="Search by name or admission no..." value={studentQuery} onChange={(e)=>setStudentQuery(e.target.value)} />
                    {studentSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, zIndex: 30, maxHeight: 220, overflowY: 'auto', width: '100%' }}>
                        {studentSuggestions.map(s => (
                          <div key={s.id} className="zds-suggestion-item" onClick={()=>addStudent(s)} style={{ padding: '8px 10px', cursor: 'pointer' }}>
                            {(s.firstName || '')} {(s.lastName || '')} {s.admissionNumber ? `(${s.admissionNumber})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedStudents.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {selectedStudents.map(st => (
                        <div key={st.id} style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{st.name}</span>
                          <button onClick={()=>removeStudent(st.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="zds-students-month-label">Note (optional)</label>
                  <input className="student-detail-input" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="e.g., Fuelled at station X" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="student-detail-save-button" onClick={submitLog} disabled={savingLog || !dateISO || !(Number(endOdo) > Number(startOdo))}>
                  {savingLog ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <div className="zds-students-header-actions" style={{ paddingBottom: 12 }}>
                <div className="zds-students-month-filter">
                  <label className="zds-students-month-label">Month</label>
                  <input type="month" className="zds-students-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
                </div>
              </div>
              <div className="zds-students-stats">
                <div className="zds-students-stat"><span className="zds-students-stat-label">Trips</span><span className="zds-students-stat-value">{totals.trips}</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Distance</span><span className="zds-students-stat-value">{totals.distanceKm} km</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Litres</span><span className="zds-students-stat-value">{totals.litres}</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Fuel Cost</span><span className="zds-students-stat-value">{currency(totals.fuelCost)}</span></div>
              </div>
              <div className="zds-students-table-wrap">
                <table className="zds-students-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Odometer</th>
                      <th>Distance</th>
                      <th>Litres</th>
                      <th>Price/L</th>
                      <th>Cost</th>
                      <th>Students</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs && (
                      <tr><td colSpan={9} className="zds-students-empty">Loading...</td></tr>
                    )}
                    {!loadingLogs && logs.map(r => (
                      <tr key={`${r.dateISO}-${r.vehicleId}-${r.createdAt?.seconds || Math.random()}`} className="zds-students-row">
                        <td>{r.dateISO}</td>
                        <td>{r.vehicleId || '-'}</td>
                        <td>{r.startOdo} → {r.endOdo}</td>
                        <td>{r.distanceKm} km</td>
                        <td>{r.litres}</td>
                        <td>{currency(r.pricePerLitre)}</td>
                        <td>{currency(r.fuelCost)}</td>
                        <td>{(r.students || []).map(s => s.name).join(', ')}</td>
                        <td style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note || ''}</td>
                      </tr>
                    ))}
                    {!loadingLogs && logs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="zds-students-empty">
                          <div className="zds-students-empty-content">
                            <p className="zds-students-empty-title">No logs found</p>
                            <p className="zds-students-empty-desc">Try a different month</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="zds-students-header-actions" style={{ paddingBottom: 12 }}>
                <div className="zds-students-month-filter">
                  <label className="zds-students-month-label">Month</label>
                  <input type="month" className="zds-students-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
                </div>
              </div>
              <div className="zds-students-stats">
                <div className="zds-students-stat"><span className="zds-students-stat-label">Total Distance</span><span className="zds-students-stat-value">{totals.distanceKm} km</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Total Litres</span><span className="zds-students-stat-value">{totals.litres}</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Fuel Cost</span><span className="zds-students-stat-value">{currency(totals.fuelCost)}</span></div>
                <div className="zds-students-stat"><span className="zds-students-stat-label">Efficiency</span><span className="zds-students-stat-value">{(totals.distanceKm && totals.litres) ? `${(totals.distanceKm / totals.litres).toFixed(2)} km/L` : '-'}</span></div>
              </div>
              <div style={{ padding: '1rem 1.5rem' }}>
                <h4>Weekly Breakdown</h4>
                <div className="zds-students-table-wrap">
                  <table className="zds-students-table">
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
                        <tr key={w.label} className="zds-students-row">
                          <td>{w.label}</td>
                          <td>{w.distanceKm} km</td>
                          <td>{w.litres}</td>
                          <td>{currency(w.fuelCost)}</td>
                          <td>{(w.distanceKm && w.litres) ? `${(w.distanceKm / w.litres).toFixed(2)} km/L` : '-'}</td>
                        </tr>
                      ))}
                      {weekly.length === 0 && (
                        <tr><td colSpan={5} className="zds-students-empty">No weekly data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFuel;
