import { useEffect, useMemo, useState } from 'react';
import {
  getCountAdminAdmissions,
  getMonthlyEnquiriesCount,
  getMonthlyApplicationsCount,
  getMonthlyPaymentsTotal,
  getMonthlyFuelCost,
  getMonthlyExpensesTotal,
} from '../../utils/firebase';
import '../styles/AdminReports.css';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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
  const [totals, setTotals] = useState({ fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, profit: 0 });
  const [studentsTotal, setStudentsTotal] = useState(0);

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
            ]).then(([fees, exp, fuel, enq, app]) => ({
              key: mk,
              label: `${monthName(m)} ${year}`,
              fees: Number(fees || 0),
              expenses: Number(exp || 0),
              fuel: Number(fuel || 0),
              enquiries: Number(enq || 0),
              applications: Number(app || 0),
            })));
          }
          const data = await Promise.all(promises);
          const withProfit = data.map(r => ({ ...r, profit: Number((r.fees - (r.expenses + r.fuel)).toFixed(2)) }));
          if (!mounted) return;
          setRows(withProfit);
          const t = withProfit.reduce((acc, r) => ({
            fees: acc.fees + r.fees,
            expenses: acc.expenses + r.expenses,
            fuel: acc.fuel + r.fuel,
            enquiries: acc.enquiries + r.enquiries,
            applications: acc.applications + r.applications,
            profit: acc.profit + r.profit,
          }), { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, profit: 0 });
          setTotals(t);
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
              ]));
            }
            yearPromises.push(Promise.all(monthlyPromises).then((vals) => {
              const sums = vals.reduce((acc, [fees, exp, fuel, enq, app]) => ({
                fees: acc.fees + Number(fees || 0),
                expenses: acc.expenses + Number(exp || 0),
                fuel: acc.fuel + Number(fuel || 0),
                enquiries: acc.enquiries + Number(enq || 0),
                applications: acc.applications + Number(app || 0),
              }), { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0 });
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
          const t = withProfit.reduce((acc, r) => ({
            fees: acc.fees + r.fees,
            expenses: acc.expenses + r.expenses,
            fuel: acc.fuel + r.fuel,
            enquiries: acc.enquiries + r.enquiries,
            applications: acc.applications + r.applications,
            profit: acc.profit + r.profit,
          }), { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, profit: 0 });
          setTotals(t);
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period, year, yearsBack]);

  const exportCSV = () => {
    let header = period === 'monthly' ? 'Period,Fees,Expenses,Fuel,Profit,Enquiries,Applications\n' : 'Year,Fees,Expenses,Fuel,Profit,Enquiries,Applications\n';
    const lines = rows.map(r => [r.label, currency(r.fees), currency(r.expenses), currency(r.fuel), currency(r.profit), r.enquiries, r.applications].join(','));
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

  const grandProfit = useMemo(() => Number((totals.fees - (totals.expenses + totals.fuel)).toFixed(2)), [totals]);

  return (
    <div className="areports-container">
      <div className="areports-card">
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
                <div className="areports-stat-value">{currency(totals.fees)}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Total Expenses</div>
                <div className="areports-stat-value">{currency(totals.expenses)}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Total Fuel</div>
                <div className="areports-stat-value">{currency(totals.fuel)}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Grand Profit</div>
                <div className={`areports-stat-value ${grandProfit >= 0 ? 'areports-profit' : 'areports-loss'}`}>{currency(grandProfit)}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Enquiries</div>
                <div className="areports-stat-value">{totals.enquiries}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Applications</div>
                <div className="areports-stat-value">{totals.applications}</div>
              </div>
              <div className="areports-stat">
                <div className="areports-stat-label">Students (Total)</div>
                <div className="areports-stat-value">{studentsTotal}</div>
              </div>
            </div>

            <div className="areports-table-wrap">
              <table className="areports-table">
                <thead>
                  <tr>
                    <th>{period === 'monthly' ? 'Month' : 'Year'}</th>
                    <th>Fees</th>
                    <th>Expenses</th>
                    <th>Fuel</th>
                    <th>Profit</th>
                    <th>Enquiries</th>
                    <th>Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key}>
                      <td className="areports-col-period">{r.label}</td>
                      <td className="areports-col-money">{currency(r.fees)}</td>
                      <td className="areports-col-money">{currency(r.expenses)}</td>
                      <td className="areports-col-money">{currency(r.fuel)}</td>
                      <td className={`areports-col-money ${r.profit >= 0 ? 'areports-profit' : 'areports-loss'}`}>{currency(r.profit)}</td>
                      <td>{r.enquiries}</td>
                      <td>{r.applications}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="areports-empty">
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
