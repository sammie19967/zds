import { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getCountAdminAdmissions,
  getMonthlyEnquiriesCount,
  getMonthlyApplicationsCount,
  getMonthlyPaymentsTotal,
  getMonthlyFuelCost,
  getMonthlyExpensesTotal,
  listExpenses,
} from '../../utils/firebase';
import { dangerousWipeDemoData } from '../../utils/firebase';
import '../styles/AdminReports.css';

// Constants and utilities
const CATEGORIES = [
  { key: 'salary', label: 'Salary' },
  { key: 'mechanical', label: 'Mechanical' },
  { key: 'car_wash', label: 'Car Wash' },
  { key: 'certificate_printing', label: 'Certificate Printing' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'rent', label: 'Rent' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'other', label: 'Other' },
];

const PERIOD_OPTIONS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

const YEARS_BACK_OPTIONS = [3, 5, 7, 10];

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;
const monthName = (month) => new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'short' });
const numberFmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// Custom hooks
const useReportData = (period, year, yearsBack, includeCategories) => {
  const [data, setData] = useState({ rows: [], loading: false, error: '' });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: '' }));

        if (period === PERIOD_OPTIONS.MONTHLY) {
          await loadMonthlyData(year, includeCategories, mounted);
        } else {
          await loadYearlyData(yearsBack, includeCategories, mounted);
        }
      } catch (error) {
        if (mounted) {
          setData(prev => ({ ...prev, error: error?.message || 'Failed to load reports' }));
        }
      } finally {
        if (mounted) {
          setData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    const loadMonthlyData = async (year, includeCategories, mounted) => {
      const monthlyPromises = Array.from({ length: 12 }, (_, monthIndex) => {
        const month = monthIndex + 1;
        const monthKeyVal = monthKey(year, month);
        return fetchMonthData(monthKeyVal, includeCategories);
      });

      const monthlyData = await Promise.all(monthlyPromises);
      if (!mounted) return;

      const rowsWithProfit = monthlyData.map(row => ({
        ...row,
        profit: calculateProfit(row.fees, row.expenses, row.fuel),
      }));

      setData(prev => ({ ...prev, rows: rowsWithProfit }));
    };

    const loadYearlyData = async (yearsBack, includeCategories, mounted) => {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - (yearsBack - 1);
      
      const yearPromises = Array.from({ length: yearsBack }, (_, index) => {
        const year = startYear + index;
        return fetchYearData(year, includeCategories);
      });

      const yearlyData = await Promise.all(yearPromises);
      if (!mounted) return;

      const rowsWithProfit = yearlyData.map(row => ({
        ...row,
        profit: calculateProfit(row.fees, row.expenses, row.fuel),
      }));

      setData(prev => ({ ...prev, rows: rowsWithProfit }));
    };

    const fetchMonthData = async (monthKeyVal, includeCategories) => {
      const [fees, expenses, fuel, enquiries, applications, expensesList] = await Promise.all([
        getMonthlyPaymentsTotal(monthKeyVal),
        getMonthlyExpensesTotal(monthKeyVal),
        getMonthlyFuelCost(monthKeyVal),
        getMonthlyEnquiriesCount(monthKeyVal),
        getMonthlyApplicationsCount(monthKeyVal),
        includeCategories ? listExpenses({ month: monthKeyVal, take: 5000 }) : Promise.resolve([]),
      ]);

      const categories = includeCategories 
        ? aggregateCategories(expensesList)
        : {};

      return {
        key: monthKeyVal,
        label: `${monthName(parseInt(monthKeyVal.split('-')[1]))} ${monthKeyVal.split('-')[0]}`,
        fees: Number(fees || 0),
        expenses: Number(expenses || 0),
        fuel: Number(fuel || 0),
        enquiries: Number(enquiries || 0),
        applications: Number(applications || 0),
        categories,
      };
    };

    const fetchYearData = async (year, includeCategories) => {
      const monthlyPromises = Array.from({ length: 12 }, (_, monthIndex) => {
        const month = monthIndex + 1;
        const monthKeyVal = monthKey(year, month);
        return fetchMonthData(monthKeyVal, includeCategories);
      });

      const monthlyData = await Promise.all(monthlyPromises);
      
      return monthlyData.reduce((yearlyTotal, monthData) => ({
        key: String(year),
        label: String(year),
        fees: yearlyTotal.fees + monthData.fees,
        expenses: yearlyTotal.expenses + monthData.expenses,
        fuel: yearlyTotal.fuel + monthData.fuel,
        enquiries: yearlyTotal.enquiries + monthData.enquiries,
        applications: yearlyTotal.applications + monthData.applications,
        categories: mergeCategories(yearlyTotal.categories, monthData.categories),
      }), {
        fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, categories: {}
      });
    };

    loadData();

    return () => { mounted = false; };
  }, [period, year, yearsBack, includeCategories]);

  return data;
};

const useStudentsTotal = () => {
  const [studentsTotal, setStudentsTotal] = useState(0);

  useEffect(() => {
    const loadStudentsTotal = async () => {
      try {
        const count = await getCountAdminAdmissions();
        setStudentsTotal(Number(count || 0));
      } catch (error) {
        console.warn('Failed to load students total:', error);
        // Non-critical failure, reports can function without student total
      }
    };

    loadStudentsTotal();
  }, []);

  return studentsTotal;
};

// Utility functions
const calculateProfit = (fees, expenses, fuel) => 
  Number((fees - (expenses + fuel)).toFixed(2));

const aggregateCategories = (expensesList) => 
  (expensesList || []).reduce((acc, expense) => {
    const categoryKey = expense.category || 'other';
    acc[categoryKey] = (acc[categoryKey] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

const mergeCategories = (categories1, categories2) => {
  const merged = { ...categories1 };
  Object.keys(categories2).forEach(key => {
    merged[key] = (merged[key] || 0) + categories2[key];
  });
  return merged;
};

const calculateTotals = (rows) => 
  rows.reduce((totals, row) => ({
    fees: totals.fees + row.fees,
    expenses: totals.expenses + row.expenses,
    fuel: totals.fuel + row.fuel,
    enquiries: totals.enquiries + row.enquiries,
    applications: totals.applications + row.applications,
    profit: totals.profit + row.profit,
  }), { fees: 0, expenses: 0, fuel: 0, enquiries: 0, applications: 0, profit: 0 });

// Main component
export default function AdminReports() {
  const now = useMemo(() => new Date(), []);
  
  // State management
  const [period, setPeriod] = useState(PERIOD_OPTIONS.MONTHLY);
  const [year, setYear] = useState(now.getFullYear());
  const [yearsBack, setYearsBack] = useState(3);
  const [includeCategories, setIncludeCategories] = useState(false);
  const [onlyThisMonth, setOnlyThisMonth] = useState(false);
  const [condensed, setCondensed] = useState(false);

  // Data hooks
  const { rows, loading, error } = useReportData(period, year, yearsBack, includeCategories);
  const studentsTotal = useStudentsTotal();

  // Memoized computations
  const displayedRows = useMemo(() => {
    if (period !== PERIOD_OPTIONS.MONTHLY || !onlyThisMonth) return rows;
    
    const currentMonthKey = monthKey(year, now.getMonth() + 1);
    return rows.filter(row => row.key === currentMonthKey);
  }, [rows, period, onlyThisMonth, year, now]);

  const displayTotals = useMemo(() => calculateTotals(displayedRows), [displayedRows]);

  const chartSeries = useMemo(() => {
    const series = {
      fees: displayedRows.map(row => row.fees),
      expenses: displayedRows.map(row => row.expenses),
      fuel: displayedRows.map(row => row.fuel),
      profit: displayedRows.map(row => row.profit),
    };
    const maxValue = Math.max(1, ...Object.values(series).flat());
    return { series, maxValue };
  }, [displayedRows]);

  // Event handlers
  const handleExportCSV = useCallback(() => {
    // CSV helpers
    const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const num = (n) => Number(n || 0).toFixed(2); // emit raw numbers with 2 decimals

    const headers = period === PERIOD_OPTIONS.MONTHLY
      ? ['Period', 'Fees (KSh.)', 'Expenses (KSh.)', 'Fuel (KSh.)', 'Profit (KSh.)', 'Enquiries', 'Applications']
      : ['Year', 'Fees (KSh.)', 'Expenses (KSh.)', 'Fuel (KSh.)', 'Profit (KSh.)', 'Enquiries', 'Applications'];

    if (includeCategories) {
      headers.push(...CATEGORIES.map(category => `${category.label} (KSh.)`));
    }

    const bodyRows = displayedRows.map(row => {
      const base = [
        row.label,          // text column
        num(row.fees),      // numeric columns
        num(row.expenses),
        num(row.fuel),
        num(row.profit),
        Number(row.enquiries || 0),
        Number(row.applications || 0),
      ];

      if (includeCategories) {
        base.push(...CATEGORIES.map(category => num(row.categories?.[category.key] || 0)));
      }

      return base;
    });

    const headerLine = headers.map(csvEscape).join(',');
    const body = bodyRows
      .map(r => r.map((val, idx) => (idx === 0 ? csvEscape(val) : String(val))).join(','))
      .join('\n');
    const BOM = '\uFEFF';
    const csvContent = `${BOM}${headerLine}\n${body}`;
    downloadCSV(csvContent, `admin-reports-${period}-${Date.now()}.csv`);
  }, [displayedRows, period, includeCategories]);

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  // Render helpers
  const renderFilters = () => (
    <div className="areports-filters">
      <div className="areports-filter">
        <label className="areports-label">Period</label>
        <select 
          className="areports-select" 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value={PERIOD_OPTIONS.MONTHLY}>Monthly</option>
          <option value={PERIOD_OPTIONS.YEARLY}>Yearly</option>
        </select>
      </div>

      {period === PERIOD_OPTIONS.MONTHLY && (
        <div className="areports-filter">
          <label className="areports-label">Year</label>
          <select 
            className="areports-select" 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(yearOption => (
              <option key={yearOption} value={yearOption}>{yearOption}</option>
            ))}
          </select>
        </div>
      )}

      {period === PERIOD_OPTIONS.YEARLY && (
        <div className="areports-filter">
          <label className="areports-label">Years Back</label>
          <select 
            className="areports-select" 
            value={yearsBack} 
            onChange={(e) => setYearsBack(Number(e.target.value))}
          >
            {YEARS_BACK_OPTIONS.map(option => (
              <option key={option} value={option}>{option} years</option>
            ))}
          </select>
        </div>
      )}

      <ToggleFilter
        id="toggle-cats"
        label="Category Breakdown"
        checked={includeCategories}
        onChange={setIncludeCategories}
      />

      <ToggleFilter
        id="toggle-condensed"
        label="Condensed Table"
        checked={condensed}
        onChange={setCondensed}
      />

      {period === PERIOD_OPTIONS.MONTHLY && (
        <ToggleFilter
          id="toggle-this-month"
          label="This Month"
          checked={onlyThisMonth}
          onChange={setOnlyThisMonth}
        />
      )}
    </div>
  );

  const renderStats = () => {
    const grandProfit = displayTotals.fees - (displayTotals.expenses + displayTotals.fuel);
    
    const stats = [
      { label: 'Total Fees', value: numberFmt(displayTotals.fees), unit: 'KSh.' },
      { label: 'Total Expenses', value: numberFmt(displayTotals.expenses), unit: 'KSh.' },
      { label: 'Total Fuel', value: numberFmt(displayTotals.fuel), unit: 'KSh.' },
      { 
        label: 'Grand Profit', 
        value: numberFmt(grandProfit), 
        unit: 'KSh.',
        className: grandProfit >= 0 ? 'areports-profit' : 'areports-loss' 
      },
      { label: 'Enquiries', value: displayTotals.enquiries },
      { label: 'Applications', value: displayTotals.applications },
      { label: 'Students (Total)', value: studentsTotal },
    ];

    return (
      <div className="areports-stats">
        {stats.map((stat, index) => (
          <div key={index} className="areports-stat">
            <div className="areports-stat-label">{stat.label}</div>
            <div className={`areports-stat-value ${stat.className || ''}`}>
              {stat.value} {stat.unit && `(${stat.unit})`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMiniCharts = () => {
    const chartConfigs = [
      { key: 'fees', label: 'Fees', color: 'var(--c-fees,#1d4ed8)' },
      { key: 'expenses', label: 'Expenses', color: 'var(--c-exp,#dc2626)' },
      { key: 'fuel', label: 'Fuel', color: 'var(--c-fuel,#f59e0b)' },
      { key: 'profit', label: 'Profit', color: 'var(--c-profit,#059669)' },
    ];

    return (
      <div className="areports-mini-charts">
        {chartConfigs.map(config => (
          <MiniChart
            key={config.key}
            data={chartSeries.series[config.key]}
            label={config.label}
            color={config.color}
            maxValue={chartSeries.maxValue}
          />
        ))}
      </div>
    );
  };

  const renderTable = () => (
    <div className={`areports-table-wrap ${condensed ? 'areports-condensed' : ''}`}>
      <table className="areports-table">
        <thead>
          <tr>
            <th>{period === PERIOD_OPTIONS.MONTHLY ? 'Month' : 'Year'}</th>
            <th>Fees (KSh.)</th>
            <th>Expenses (KSh.)</th>
            <th>Fuel (KSh.)</th>
            <th>Profit (KSh.)</th>
            <th>Enquiries</th>
            <th>Applications</th>
            {includeCategories && CATEGORIES.map(category => (
              <th key={category.key}>{category.label} (KSh.)</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map(row => (
            <TableRow 
              key={row.key} 
              row={row} 
              includeCategories={includeCategories}
            />
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
  );

  return (
    <div className="areports-container">
      <div className="areports-card">
        {/* Print Header */}
        <PrintHeader period={period} year={year} yearsBack={yearsBack} />

        {/* Main Header */}
        <div className="areports-header">
          <div>
            <h1 className="areports-title">Administrative Reports</h1>
            <p className="areports-subtitle">
              Unified reporting for fees, expenses, fuel, enquiries, and applications
            </p>
          </div>
          <div className="areports-actions">
            <button 
              className="areports-btn areports-btn-secondary" 
              onClick={handleExportCSV} 
              disabled={loading}
            >
              Export CSV
            </button>
            <button 
              className="areports-btn areports-btn-secondary" 
              onClick={handlePrint} 
              disabled={loading}
            >
              Download PDF
            </button>
            <button 
              className="areports-btn" 
              onClick={handlePrint} 
              disabled={loading}
            >
              Print
            </button>
            {/* Temporary: Data reset for onboarding */}
            <button
              className="areports-btn areports-btn-secondary"
              onClick={async () => {
                const ok = window.confirm('This will permanently delete all demo data (students, payments, expenses, fuel logs, enquiries, etc.) and reset counters. Continue?');
                if (!ok) return;
                try {
                  await dangerousWipeDemoData();
                  alert('Data reset complete. The page will reload to reflect zeros.');
                  window.location.reload();
                } catch (e) {
                  alert(`Failed to reset data: ${e?.message || 'Unknown error'}`);
                }
              }}
              disabled={loading}
              title="Reset all demo data to zero"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Loading State */}
        {loading && (
          <div className="areports-loading">
            <div className="areports-spinner" />
            <p>Loading reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className="areports-error">{error}</div>}

        {/* Content */}
        {!loading && !error && (
          <>
            {renderStats()}
            {renderMiniCharts()}
            {renderTable()}
          </>
        )}
      </div>
    </div>
  );
}

// Sub-components
const ToggleFilter = ({ id, label, checked, onChange }) => (
  <div className="areports-filter areports-filter-inline">
    <label className="areports-label">{label}</label>
    <div className="areports-toggle">
      <input 
        id={id} 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      <label htmlFor={id}>{checked ? 'On' : 'Off'}</label>
    </div>
  </div>
);

ToggleFilter.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

const MiniChart = ({ data, label, color, maxValue }) => (
  <div className="areports-chart">
    <div className="areports-chart-title">{label}</div>
    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
      {data.map((value, index) => {
        const barWidth = 100 / Math.max(1, data.length);
        const barHeight = maxValue ? (value / maxValue) * 28 : 0;
        const xPosition = index * barWidth;
        const yPosition = 30 - barHeight;
        
        return (
          <rect 
            key={index}
            x={xPosition + 1}
            y={yPosition}
            width={barWidth - 2}
            height={barHeight}
            fill={color}
            rx="1"
          />
        );
      })}
    </svg>
  </div>
);

MiniChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  maxValue: PropTypes.number.isRequired,
};

const TableRow = ({ row, includeCategories }) => (
  <tr>
    <td className="areports-col-period">{row.label}</td>
    <td className="areports-col-money">{numberFmt(row.fees)}</td>
    <td className="areports-col-money">{numberFmt(row.expenses)}</td>
    <td className="areports-col-money">{numberFmt(row.fuel)}</td>
    <td className={`areports-col-money ${row.profit >= 0 ? 'areports-profit' : 'areports-loss'}`}>
      {numberFmt(row.profit)}
    </td>
    <td>{row.enquiries}</td>
    <td>{row.applications}</td>
    {includeCategories && CATEGORIES.map(category => (
      <td key={category.key} className="areports-col-money">
        {numberFmt(row.categories?.[category.key] || 0)}
      </td>
    ))}
  </tr>
);

TableRow.propTypes = {
  row: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fees: PropTypes.number.isRequired,
    expenses: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    profit: PropTypes.number.isRequired,
    enquiries: PropTypes.number.isRequired,
    applications: PropTypes.number.isRequired,
    categories: PropTypes.object,
  }).isRequired,
  includeCategories: PropTypes.bool.isRequired,
};

const PrintHeader = ({ period, year, yearsBack }) => (
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
      <div>
        Period: {period === PERIOD_OPTIONS.MONTHLY 
          ? `Monthly (${year})` 
          : `Yearly (Last ${yearsBack} years)`
        }
      </div>
    </div>
  </div>
);

PrintHeader.propTypes = {
  period: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
  year: PropTypes.number.isRequired,
  yearsBack: PropTypes.number.isRequired,
};