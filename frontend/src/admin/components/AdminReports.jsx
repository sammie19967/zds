import { useEffect, useMemo, useState } from 'react';
import {
  getCountAdminAdmissions,
  getMonthlyEnquiriesCount,
  getMonthlyApplicationsCount,
  getMonthlyPaymentsTotal,
  getMonthlyFuelCost,
  getMonthlyExpensesTotal,
  listExpenses,
} from '../../utils/firebase';
import '../styles/AdminReports.css';

const monthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const monthName = (m) => new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'short' });

export default function AdminReports() {
  const now = new Date();
  const [period, setPeriod] = useState('monthly'); // monthly | yearly
  const [year, setYear] = useState(now.getFullYear());
  const [yearsBack, setYearsBack] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Aggregated report rows
  const [rows, setRows] = useState([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [includeCategories, setIncludeCategories] = useState(false);
  const [onlyThisMonth, setOnlyThisMonth] = useState(false);

  const CATEGORIES = useMemo(() => ([
    { key: 'salary', label: 'Salary' },
    { key: 'mechanical', label: 'Mechanical' },
    { key: 'car_wash', label: 'Car Wash' },
    { key: 'certificate_printing', label: 'Certificate Printing' },
    { key: 'taxes', label: 'Taxes' },
    { key: 'rent', label: 'Rent' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'other', label: 'Other' },
  ]), []);

  // Load students total once
  useEffect(() => {
    (async () => {
      try {
        const count = await getCountAdminAdmissions();
        setStudentsTotal(Number(count || 0));
      } catch (_) {
        // noop: non-critical, reports can function without student total
      }
    })();
  }, []);

  // Load report data when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        if (period === 'monthly') {
          const promises = [];
          for (let m = 1; m <= 12; m++) {
            const mk = monthKey(year, m);
            promises.push(Promise.all([
              getMonthlyPaymentsTotal(mk),
              getMonthlyExpensesTotal(mk),
              getMonthlyFuelCost(mk),
              getMonthlyEnquiriesCount(mk),
              getMonthlyApplicationsCount(mk),
              includeCategories ? listExpenses({ month: mk, take: 5000 }) : Promise.resolve([]),
            ]).then(([fees, exp, fuel, enq, app, expList]) => ({
              key: mk,
              label: `${monthName(m)} ${year}`,
              fees: Number(fees || 0),
              expenses: Number(exp || 0),
              fuel: Number(fuel || 0),
              enquiries: Number(enq || 0),
              applications: Number(app || 0),
              categories: (expList || []).reduce((acc, e) => {
                const k = e.category || 'other';
                acc[k] = (acc[k] || 0) + Number(e.amount || 0);
                return acc;
              }, {}),
            })));
          }
          const data = await Promise.all(promises);
          const withProfit = data.map(r => ({ ...r, profit: Number((r.fees - (r.expenses + r.fuel)).toFixed(2)) }));
          if (!mounted) return;
          setRows(withProfit);
          // totals now computed from displayedRows (displayTotals)
        } else {
          // yearly – aggregate each of last N years
          const currentYear = new Date().getFullYear();
          const startYear = currentYear - (yearsBack - 1);
          const yearPromises = [];
          for (let y = startYear; y <= currentYear; y++) {
            const monthlyPromises = [];
            for (let m = 1; m <= 12; m++) {
              const mk = monthKey(y, m);
              monthlyPromises.push(Promise.all([
                getMonthlyPaymentsTotal(mk),
                getMonthlyExpensesTotal(mk),
                getMonthlyFuelCost(mk),
                getMonthlyEnquiriesCount(mk),
                getMonthlyApplicationsCount(mk),
                includeCategories ? listExpenses({ month: mk, take: 5000 }) : Promise.resolve([]),
              ]));
            }
            yearPromises.push(Promise.all(monthlyPromises).then((vals) => {
              const sums = vals.reduce((acc, [fees, exp, fuel, enq, app, expList]) => {
                const cats = (expList || []).reduce((cacc, e) => {
                  const k = e.category || 'other';
                  cacc[k] = (cacc[k] || 0) + Number(e.amount || 0);
                  return cacc;
                }, {});
                // merge cats into acc.categories
                Object.keys(cats).forEach(k => {
                  acc.categories[k] = (acc.categories[k] || 0) + cats[k];
                });
                return {
                  fees: acc.fees + Number(fees || 0),
                  expenses: acc.expenses + Number(exp || 0),
                  fuel: acc.fuel + Number(fuel || 0),
                  enquiries: acc.enquiries + Number(enq || 0),
                  applications: acc.applications + Number(app || 0),
                  categories: acc.categories,
                };
              }, { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, categories: {} });
              return {
                key: String(y),
                label: String(y),
                ...sums,
              };
            }));
          }
          const ydata = await Promise.all(yearPromises);
          const withProfit = ydata.map(r => ({ ...r, profit: Number((r.fees - (r.expenses + r.fuel)).toFixed(2)) }));
          if (!mounted) return;
          setRows(withProfit);
          // totals now computed from displayedRows (displayTotals)
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period, year, yearsBack, includeCategories]);

  const numberFmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // rows to display based on 'This Month' toggle
  const displayedRows = useMemo(() => {
    if (period !== 'monthly' || !onlyThisMonth) return rows;
    const now = new Date();
    const mk = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return rows.filter(r => r.key === mk);
  }, [rows, period, onlyThisMonth, year]);

  const displayTotals = useMemo(() => {
    return displayedRows.reduce((acc, r) => ({
      fees: acc.fees + r.fees,
      expenses: acc.expenses + r.expenses,
      fuel: acc.fuel + r.fuel,
      enquiries: acc.enquiries + r.enquiries,
      applications: acc.applications + r.applications,
      profit: acc.profit + r.profit,
    }), { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, profit: 0 });
  }, [displayedRows]);

  const exportCSV = () => {
    let header = period === 'monthly'
      ? 'Period,Fees (KSh.),Expenses (KSh.),Fuel (KSh.),Profit (KSh.),Enquiries,Applications'
      : 'Year,Fees (KSh.),Expenses (KSh.),Fuel (KSh.),Profit (KSh.),Enquiries,Applications';
    // add category headers if included
    if (includeCategories) {
      header += ',' + CATEGORIES.map(c => `${c.label} (KSh.)`).join(',');
    }
    header += '\n';
    const lines = displayedRows.map(r => {
      const base = [r.label, numberFmt(r.fees), numberFmt(r.expenses), numberFmt(r.fuel), numberFmt(r.profit), r.enquiries, r.applications];
      if (includeCategories) {
        base.push(...CATEGORIES.map(c => numberFmt((r.categories?.[c.key]) || 0)));
      }
      return base.join(',');
    });
    const csv = header + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-reports-${period}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPage = () => window.print();

  // grandProfit not needed as we compute from displayTotals now

  // Simple chart helpers (mini bars)
  const chartSeries = useMemo(() => {
    const vals = {
      fees: displayedRows.map(r => r.fees),
      expenses: displayedRows.map(r => r.expenses),
      fuel: displayedRows.map(r => r.fuel),
      profit: displayedRows.map(r => r.profit),
    };
    const max = Math.max(1, ...Object.values(vals).flat());
    return { vals, max };
  }, [displayedRows]);

  return (
    <div className="areports-container">
      <div className="areports-card">
        {/* Print-only Branded Header */}
        <div className="areports-print-header">
          <div className="areports-print-brand">
            <img src="/logo.png" alt="Zane Driving" />
            <div>
              <h2>Zane Driving School</h2>
              <p>Administrative Reports</p>
            </div>
          </div>
          <div className="areports-print-meta">
            <div>Date: {new Date().toLocaleString()}</div>
            <div>Period: {period === 'monthly' ? `Monthly (${year})` : `Yearly (Last ${yearsBack} years)`}</div>
          </div>
        </div>
        <div className="areports-header">
          <div>
            <h1 className="areports-title">Administrative Reports</h1>
            <p className="areports-subtitle">Unified reporting for fees, expenses, fuel, enquiries, and applications</p>
          </div>
          <div className="areports-actions">
            <button className="areports-btn areports-btn-secondary" onClick={exportCSV} disabled={loading}>Export CSV</button>
            <button className="areports-btn" onClick={printPage} disabled={loading}>Print</button>
          </div>
        </div>

        <div className="areports-filters">
          <div className="areports-filter">
            <label className="areports-label">Period</label>
            <select className="areports-select" value={period} onChange={(e)=>setPeriod(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {period === 'monthly' && (
            <div className="areports-filter">
              <label className="areports-label">Year</label>
              <select className="areports-select" value={year} onChange={(e)=>setYear(Number(e.target.value))}>
                {Array.from({length: 6}, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {period === 'yearly' && (
            <div className="areports-filter">
              <label className="areports-label">Years Back</label>
              <select className="areports-select" value={yearsBack} onChange={(e)=>setYearsBack(Number(e.target.value))}>
                {[3, 5, 7, 10].map(y => <option key={y} value={y}>{y} years</option>)}
              </select>
            </div>
          )}

          <div className="areports-filter areports-filter-inline">
            <label className="areports-label">Category Breakdown</label>
            <div className="areports-toggle">
              <input id="toggle-cats" type="checkbox" checked={includeCategories} onChange={(e)=>setIncludeCategories(e.target.checked)} />
              <label htmlFor="toggle-cats">{includeCategories ? 'Shown' : 'Hidden'}</label>
            </div>
          </div>
          {period === 'monthly' && (
            <div className="areports-filter areports-filter-inline">
              <label className="areports-label">This Month</label>
              <div className="areports-toggle">
                <input id="toggle-this-month" type="checkbox" checked={onlyThisMonth} onChange={(e)=>setOnlyThisMonth(e.target.checked)} />
                <label htmlFor="toggle-this-month">{onlyThisMonth ? 'On' : 'Off'}</label>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="areports-loading">
            <div className="areports-spinner" />
            <p>Loading reports...</p>
          </div>
        )}
        {error && (
          <div className="areports-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="areports-stats">
              <div className="areports-stat">
                <div className="areports-stat-label">Total Fees</div>
                <div className="areports-stat-value">{numberFmt(displayTotals.fees)} (KSh.)</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Total Expenses</div>
                <div className="areports-stat-value">{numberFmt(displayTotals.expenses)} (KSh.)</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Total Fuel</div>
                <div className="areports-stat-value">{numberFmt(displayTotals.fuel)} (KSh.)</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Grand Profit</div>
                <div className={`areports-stat-value ${displayTotals.fees - (displayTotals.expenses + displayTotals.fuel) >= 0 ? 'areports-profit' : 'areports-loss'}`}>{numberFmt(displayTotals.fees - (displayTotals.expenses + displayTotals.fuel))} (KSh.)</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Enquiries</div>
                <div className="areports-stat-value">{displayTotals.enquiries}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Applications</div>
                <div className="areports-stat-value">{displayTotals.applications}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Students (Total)</div>
                <div className="areports-stat-value">{studentsTotal}</div>
              </div>
            </div>

            {/* Mini Charts */}
            <div className="areports-mini-charts">
              {[{k:'fees',label:'Fees',color:'var(--c-fees,#1d4ed8)'},{k:'expenses',label:'Expenses',color:'var(--c-exp,#dc2626)'},{k:'fuel',label:'Fuel',color:'var(--c-fuel,#f59e0b)'},{k:'profit',label:'Profit',color:'var(--c-profit,#059669)'}].map(s => (
                <div className="areports-chart" key={s.k}>
                  <div className="areports-chart-title">{s.label}</div>
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                    {chartSeries.vals[s.k].map((v, i) => {
                      const w = 100 / Math.max(1, chartSeries.vals[s.k].length);
                      const h = chartSeries.max ? (v / chartSeries.max) * 28 : 0;
                      const x = i * w;
                      const y = 30 - h;
                      return <rect key={i} x={x + 1} y={y} width={w - 2} height={h} fill={s.color} rx="1" />
                    })}
                  </svg>
                </div>
              ))}
            </div>

            <div className="areports-table-wrap">
              <table className="areports-table">
                <thead>
                  <tr>
                    <th>{period === 'monthly' ? 'Month' : 'Year'}</th>
                    <th>Fees (KSh.)</th>
                    <th>Expenses (KSh.)</th>
                    <th>Fuel (KSh.)</th>
                    <th>Profit (KSh.)</th>
                    <th>Enquiries</th>
                    <th>Applications</th>
                    {includeCategories && CATEGORIES.map(c => (
                      <th key={c.key}>{c.label} (KSh.)</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map(r => (
                    <tr key={r.key}>
                      <td className="areports-col-period">{r.label}</td>
                      <td className="areports-col-money">{numberFmt(r.fees)}</td>
                      <td className="areports-col-money">{numberFmt(r.expenses)}</td>
                      <td className="areports-col-money">{numberFmt(r.fuel)}</td>
                      <td className={`areports-col-money ${r.profit >= 0 ? 'areports-profit' : 'areports-loss'}`}>{numberFmt(r.profit)}</td>
                      <td>{r.enquiries}</td>
                      <td>{r.applications}</td>
                      {includeCategories && CATEGORIES.map(c => (
                        <td key={c.key} className="areports-col-money">{numberFmt((r.categories?.[c.key]) || 0)}</td>
                      ))}
                    </tr>
                  ))}
                  {displayedRows.length === 0 && (
                    <tr>
                      <td colSpan={7 + (includeCategories ? CATEGORIES.length : 0)} className="areports-empty">
                        No data for the selected period
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
  );
}
