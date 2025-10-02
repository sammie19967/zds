import { useEffect, useMemo, useState } from 'react';
import {
  listEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getMonthlyExpensesTotal,
  getMonthlyPaymentsTotal,
  getMonthlyFuelCost,
} from '../../utils/firebase';
import '../styles/AdminExpenses.css';
import modal from '../../utils/modal';

const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const currency = (n) => `KSh ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
// For tables where header shows currency unit, show numbers without repeating the unit
const money = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

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

export default function AdminExpenses() {
  const [activeTab, setActiveTab] = useState('summary');
  const [month, setMonth] = useState(yyyymm());
  
  // Reports state
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Employees
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empForm, setEmpForm] = useState({ id: '', name: '', role: '', baseSalary: '', phone: '', email: '', idNumber: '' });
  const [empSaving, setEmpSaving] = useState(false);
  // Employees sub-view: 'list' | 'add'
  const [empView, setEmpView] = useState('list');

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expForm, setExpForm] = useState({ id: '', amount: '', category: 'salary', note: '', dateISO: new Date().toISOString().slice(0,10), employeeId: '' });
  const [expSaving, setExpSaving] = useState(false);
  // Expenses sub-view: 'add' | 'list'
  const [expView, setExpView] = useState('add');

  // Totals
  const [feesTotal, setFeesTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [fuelTotal, setFuelTotal] = useState(0);

  // Load initial data
  useEffect(() => {
    (async () => {
      setEmpLoading(true);
      try {
        const list = await listEmployees({ take: 1000 });
        setEmployees(list || []);
      } catch (e) {
        await modal.error({ title: 'Failed', text: e?.message || 'Could not load employees' });
      } finally {
        setEmpLoading(false);
      }
    })();
  }, []);

  // Load month-based data
  useEffect(() => {
    (async () => {
      setExpLoading(true);
      try {
        const [exps, fees, exTotal, fuel] = await Promise.all([
          listExpenses({ month, take: 2000 }),
          getMonthlyPaymentsTotal(month),
          getMonthlyExpensesTotal(month),
          getMonthlyFuelCost(month),
        ]);
        setExpenses(exps || []);
        setFeesTotal(Number(fees || 0));
        setExpensesTotal(Number(exTotal || 0));
        setFuelTotal(Number(fuel || 0));
      } catch (e) {
        await modal.error({ title: 'Failed', text: e?.message || 'Could not load monthly data' });
      } finally {
        setExpLoading(false);
      }
    })();
  }, [month]);

  const totalExpensesAll = useMemo(() => Number((Number(expensesTotal) + Number(fuelTotal)).toFixed(2)), [expensesTotal, fuelTotal]);
  const profit = useMemo(() => Number((Number(feesTotal) - totalExpensesAll).toFixed(2)), [feesTotal, totalExpensesAll]);
  
  // Report data aggregation
  const reportData = useMemo(() => {
    if (reportPeriod === 'monthly') {
      // Group by month for the selected year
      const monthlyData = {};
      for (let m = 1; m <= 12; m++) {
        const monthKey = `${reportYear}-${String(m).padStart(2, '0')}`;
        monthlyData[monthKey] = {
          month: monthKey,
          expenses: 0,
          count: 0,
          categories: {}
        };
      }
      expenses.forEach(exp => {
        const expMonth = exp.dateISO?.slice(0, 7);
        if (expMonth && expMonth.startsWith(reportYear)) {
          if (!monthlyData[expMonth]) monthlyData[expMonth] = { month: expMonth, expenses: 0, count: 0, categories: {} };
          monthlyData[expMonth].expenses += Number(exp.amount || 0);
          monthlyData[expMonth].count += 1;
          const cat = exp.category || 'other';
          monthlyData[expMonth].categories[cat] = (monthlyData[expMonth].categories[cat] || 0) + Number(exp.amount || 0);
        }
      });
      return Object.values(monthlyData);
    } else if (reportPeriod === 'yearly') {
      // Group by year
      const yearlyData = {};
      expenses.forEach(exp => {
        const year = exp.dateISO?.slice(0, 4);
        if (year) {
          if (!yearlyData[year]) yearlyData[year] = { year, expenses: 0, count: 0, categories: {} };
          yearlyData[year].expenses += Number(exp.amount || 0);
          yearlyData[year].count += 1;
          const cat = exp.category || 'other';
          yearlyData[year].categories[cat] = (yearlyData[year].categories[cat] || 0) + Number(exp.amount || 0);
        }
      });
      return Object.values(yearlyData).sort((a, b) => b.year.localeCompare(a.year));
    } else {
      // Custom date range
      const filtered = expenses.filter(exp => {
        if (!reportStartDate || !reportEndDate) return true;
        return exp.dateISO >= reportStartDate && exp.dateISO <= reportEndDate;
      });
      const total = filtered.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const categories = {};
      filtered.forEach(exp => {
        const cat = exp.category || 'other';
        categories[cat] = (categories[cat] || 0) + Number(exp.amount || 0);
      });
      return [{ period: `${reportStartDate} to ${reportEndDate}`, expenses: total, count: filtered.length, categories }];
    }
  }, [expenses, reportPeriod, reportYear, reportStartDate, reportEndDate]);
  
  // Export functions
  const exportToCSV = () => {
    // Escape text fields and output numeric values as raw numbers for proper spreadsheet parsing
    const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const num = (n) => Number(n || 0).toFixed(2); // raw number with 2 decimals, no separators

    let headers = [];
    let rows = [];

    if (reportPeriod === 'monthly') {
      headers = ['Month', 'Total Expenses (KSh)', 'Transaction Count', ...CATEGORIES.map(c => `${c.label} (KSh)`)];
      rows = reportData.map(row => [
        row.month,
        num(row.expenses),
        row.count,
        ...CATEGORIES.map(c => num(row.categories[c.key] || 0))
      ]);
    } else if (reportPeriod === 'yearly') {
      headers = ['Year', 'Total Expenses (KSh)', 'Transaction Count', ...CATEGORIES.map(c => `${c.label} (KSh)`)];
      rows = reportData.map(row => [
        row.year,
        num(row.expenses),
        row.count,
        ...CATEGORIES.map(c => num(row.categories[c.key] || 0))
      ]);
    } else {
      headers = ['Period', 'Total Expenses (KSh)', 'Transaction Count', ...CATEGORIES.map(c => `${c.label} (KSh)`)];
      rows = reportData.map(row => [
        row.period,
        num(row.expenses),
        row.count,
        ...CATEGORIES.map(c => num(row.categories[c.key] || 0))
      ]);
    }

    // Build CSV with BOM for better Excel compatibility
    const BOM = '\uFEFF';
    const headerLine = headers.map(csvEscape).join(',');
    const body = rows.map(r => r.map((val, idx) => {
      // Only escape textual columns (first column). Numbers are left unquoted for numeric interpretation.
      return idx === 0 ? csvEscape(val) : String(val);
    }).join(',')).join('\n');
    const csv = `${BOM}${headerLine}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-report-${reportPeriod}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const printReport = () => {
    window.print();
  };

  // Employee handlers
  const onEditEmployee = (e) => {
    setEmpForm({ id: e.id, name: e.name || '', role: e.role || '', baseSalary: e.baseSalary || '', phone: e.phone || '', email: e.email || '', idNumber: e.idNumber || '' });
    setEmpView('add');
  };
  const resetEmpForm = () => setEmpForm({ id: '', name: '', role: '', baseSalary: '', phone: '', email: '', idNumber: '' });
  const saveEmployee = async () => {
    try {
      setEmpSaving(true);
      const payload = { name: empForm.name, role: empForm.role, baseSalary: empForm.baseSalary, phone: empForm.phone, email: empForm.email, idNumber: empForm.idNumber };
      if (!empForm.name?.trim()) return await modal.error({ title: 'Missing Name', text: 'Name is required' });
      if (!String(empForm.baseSalary)) return await modal.error({ title: 'Missing Salary', text: 'Base salary is required' });
      if (Number(empForm.baseSalary) <= 0) return await modal.error({ title: 'Invalid Salary', text: 'Base salary must be greater than 0' });
      if (empForm.id) {
        await updateEmployee(empForm.id, payload);
        await modal.toast({ title: 'Employee updated', icon: 'success' });
      } else {
        await addEmployee(payload);
        await modal.toast({ title: 'Employee added', icon: 'success' });
      }
      const list = await listEmployees({ take: 1000 });
      setEmployees(list || []);
      resetEmpForm();
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Failed to save employee' });
    } finally {
      setEmpSaving(false);
    }
  };
  const removeEmployee = async (id) => {
    if (!id) return;
    const yes = await modal.confirm({ title: 'Delete Employee', text: 'Are you sure you want to delete this employee?' });
    if (!yes) return;
    try {
      await deleteEmployee(id);
      const list = await listEmployees({ take: 1000 });
      setEmployees(list || []);
      if (empForm.id === id) resetEmpForm();
      await modal.toast({ title: 'Employee deleted', icon: 'success' });
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Failed to delete employee' });
    }
  };

  // Expense handlers
  const onEditExpense = (x) => {
    setExpForm({ id: x.id, amount: x.amount, category: x.category, note: x.note || '', dateISO: x.dateISO, employeeId: x.employeeId || '' });
    setExpView('add');
  };
  const resetExpForm = () => setExpForm({ id: '', amount: '', category: 'salary', note: '', dateISO: new Date().toISOString().slice(0,10), employeeId: '' });
  const saveExpense = async () => {
    try {
      setExpSaving(true);
      const amt = Number(expForm.amount) || 0;
      if (amt <= 0) return await modal.error({ title: 'Invalid Amount', text: 'Enter a valid amount' });
      if (expForm.category === 'salary') {
        if (!expForm.employeeId) return await modal.error({ title: 'Missing Employee', text: 'Select an employee for salary expense' });
        const emp = employees.find(e => e.id === expForm.employeeId);
        const base = Number(emp?.baseSalary) || 0;
        if (base <= 0) return await modal.error({ title: 'No Base Salary', text: 'Selected employee has no base salary' });
        if (amt > base) return await modal.error({ title: 'Exceeds Base Salary', text: 'Salary amount cannot exceed base salary' });
      }
      const payload = { amount: amt, category: expForm.category, note: expForm.note, dateISO: expForm.dateISO, employeeId: expForm.category === 'salary' ? (expForm.employeeId || '') : '' };
      if (expForm.id) {
        await updateExpense(expForm.id, payload);
        await modal.toast({ title: 'Expense updated', icon: 'success' });
      } else {
        await addExpense(payload);
        await modal.toast({ title: 'Expense added', icon: 'success' });
      }
      const [exps, exTotal, fees] = await Promise.all([
        listExpenses({ month, take: 2000 }),
        getMonthlyExpensesTotal(month),
        getMonthlyPaymentsTotal(month),
      ]);
      setExpenses(exps || []);
      setExpensesTotal(Number(exTotal || 0));
      setFeesTotal(Number(fees || 0));
      resetExpForm();
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Failed to save expense' });
    } finally {
      setExpSaving(false);
    }
  };
  const removeExpense = async (id) => {
    if (!id) return;
    const yes = await modal.confirm({ title: 'Delete Expense', text: 'Are you sure you want to delete this expense?' });
    if (!yes) return;
    try {
      await deleteExpense(id);
      const [exps, exTotal, fees] = await Promise.all([
        listExpenses({ month, take: 2000 }),
        getMonthlyExpensesTotal(month),
        getMonthlyPaymentsTotal(month),
      ]);
      setExpenses(exps || []);
      setExpensesTotal(Number(exTotal || 0));
      setFeesTotal(Number(fees || 0));
      await modal.toast({ title: 'Expense deleted', icon: 'success' });
    } catch (e) {
      await modal.error({ title: 'Failed', text: e?.message || 'Failed to delete expense' });
    }
  };

  return (
    <div className="aexp-wrapper">
      <div className="aexp-container">
        {/* Header */}
        <div className="aexp-header">
          <div className="aexp-header-left">
            <h1 className="aexp-title">Expenses & Profit</h1>
            <p className="aexp-subtitle">Track employees, expenses, and monthly profit</p>
          </div>
          <div className="aexp-header-right">
            <label className="aexp-month-label">
              <svg className="aexp-month-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Month</span>
            </label>
            <input type="month" className="aexp-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="aexp-tabs">
          <button 
            className={`aexp-tab ${activeTab==='summary'?'aexp-tab-active':''}`} 
            onClick={()=>setActiveTab('summary')}
          >
            <svg className="aexp-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Summary
          </button>
          <button 
            className={`aexp-tab ${activeTab==='employees'?'aexp-tab-active':''}`} 
            onClick={()=>setActiveTab('employees')}
          >
            <svg className="aexp-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Employees
          </button>
          <button 
            className={`aexp-tab ${activeTab==='expenses'?'aexp-tab-active':''}`} 
            onClick={()=>setActiveTab('expenses')}
          >
            <svg className="aexp-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Expenses
          </button>
          <button 
            className={`aexp-tab ${activeTab==='reports'?'aexp-tab-active':''}`} 
            onClick={()=>setActiveTab('reports')}
          >
            <svg className="aexp-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </button>
        </div>

        {/* Tab Content */}
        <div className="aexp-content">
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="aexp-summary-wrapper">
              <div className="aexp-stats-grid">
                <div className="aexp-stat-card aexp-stat-fees">
                  <div className="aexp-stat-icon-wrapper">
                    <svg className="aexp-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="aexp-stat-content">
                    <div className="aexp-stat-label">Fees Collected</div>
                    <div className="aexp-stat-value">{currency(feesTotal)}</div>
                  </div>
                </div>

                <div className="aexp-stat-card aexp-stat-fuel">
                  <div className="aexp-stat-icon-wrapper">
                    <svg className="aexp-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="aexp-stat-content">
                    <div className="aexp-stat-label">Fuel Cost</div>
                    <div className="aexp-stat-value">{currency(fuelTotal)}</div>
                  </div>
                </div>

                <div className="aexp-stat-card aexp-stat-expenses">
                  <div className="aexp-stat-icon-wrapper">
                    <svg className="aexp-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="aexp-stat-content">
                    <div className="aexp-stat-label">Total Expenses</div>
                    <div className="aexp-stat-value">{currency(totalExpensesAll)}</div>
                  </div>
                </div>

                <div className={`aexp-stat-card ${profit>=0 ? 'aexp-stat-profit' : 'aexp-stat-loss'}`}>
                  <div className="aexp-stat-icon-wrapper">
                    <svg className="aexp-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="aexp-stat-content">
                    <div className="aexp-stat-label">Profit/Loss</div>
                    <div className="aexp-stat-value">{currency(profit)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES TAB */}
          {activeTab === 'employees' && (
            <div className="aexp-employees-layout">
              <div className="aexp-section-card">
                <div className="aexp-section-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                    <h3 className="aexp-section-title" style={{margin:0}}>Employees</h3>
                    <span className="aexp-section-count">{employees.length} employees</span>
                  </div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button className={`aexp-btn-secondary ${empView==='list'?'aexp-tab-active':''}`} onClick={()=>setEmpView('list')}>List</button>
                    <button className={`aexp-btn-secondary ${empView==='add'?'aexp-tab-active':''}`} onClick={()=>{setEmpView('add'); if(!empForm.id) resetEmpForm();}}>Add</button>
                  </div>
                </div>
                {empView === 'list' ? (
                  <div className="aexp-table-container">
                    <table className="aexp-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Base Salary</th>
                          <th>ID Number</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empLoading && (
                          <tr><td colSpan={7} className="aexp-table-loading">
                            <div className="aexp-loading-spinner"></div>
                            <span>Loading employees...</span>
                          </td></tr>
                        )}
                        {!empLoading && employees.map(e => (
                          <tr key={e.id} className="aexp-table-row">
                            <td className="aexp-table-name">{e.name}</td>
                            <td>{e.role || '-'}</td>
                            <td className="aexp-table-amount">{currency(e.baseSalary)}</td>
                            <td className="aexp-table-id">{e.idNumber || '-'}</td>
                            <td>{e.phone || '-'}</td>
                            <td>{e.email || '-'}</td>
                            <td>
                              <div className="aexp-action-buttons">
                                <button className="aexp-btn-edit" onClick={()=>onEditEmployee(e)}>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="aexp-btn-delete" onClick={()=>removeEmployee(e.id)}>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!empLoading && employees.length===0 && (
                          <tr><td colSpan={7} className="aexp-table-empty">
                            <svg className="aexp-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>No employees registered yet</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="aexp-form">
                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Name
                    </label>
                    <input className="aexp-form-input" value={empForm.name} onChange={(e)=>setEmpForm(v=>({...v, name: e.target.value}))} placeholder="Full name" />
                  </div>

                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Role
                    </label>
                    <input className="aexp-form-input" value={empForm.role} onChange={(e)=>setEmpForm(v=>({...v, role: e.target.value}))} placeholder="e.g., Instructor" />
                  </div>

                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Base Salary
                    </label>
                    <input type="number" className="aexp-form-input" value={empForm.baseSalary} onChange={(e)=>setEmpForm(v=>({...v, baseSalary: e.target.value}))} placeholder="e.g., 30000" />
                  </div>

                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      ID Number
                    </label>
                    <input className="aexp-form-input" value={empForm.idNumber} onChange={(e)=>setEmpForm(v=>({...v, idNumber: e.target.value}))} placeholder="e.g., 12345678" />
                  </div>

                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone
                    </label>
                    <input className="aexp-form-input" value={empForm.phone} onChange={(e)=>setEmpForm(v=>({...v, phone: e.target.value}))} placeholder="e.g., 07xx xxx xxx" />
                  </div>

                  <div className="aexp-form-group">
                    <label className="aexp-form-label">
                      <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <input type="email" className="aexp-form-input" value={empForm.email} onChange={(e)=>setEmpForm(v=>({...v, email: e.target.value}))} placeholder="e.g., name@domain.com" />
                  </div>

                  <div className="aexp-form-actions">
                    <button className="aexp-btn-primary" onClick={saveEmployee} disabled={empSaving}>
                      {empSaving ? (
                        <>
                          <div className="aexp-btn-spinner"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {empForm.id ? 'Update Employee' : 'Add Employee'}
                        </>
                      )}
                    </button>
                    {empForm.id && (
                      <button className="aexp-btn-secondary" onClick={resetEmpForm}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}
                  </div>
                  {/* Close aexp-form */}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="aexp-expenses-layout">
              <div className="aexp-section-card">
                <div className="aexp-section-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                    <h3 className="aexp-section-title" style={{margin:0}}>Expenses</h3>
                    <span className="aexp-section-count">{expenses.length} records</span>
                  </div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button className={`aexp-btn-secondary ${expView==='add'?'aexp-tab-active':''}`} onClick={()=>{setExpView('add'); if(!expForm.id) resetExpForm();}}>Add</button>
                    <button className={`aexp-btn-secondary ${expView==='list'?'aexp-tab-active':''}`} onClick={()=>setExpView('list')}>List</button>
                  </div>
                </div>
                {expView === 'add' ? (
                  <div className="aexp-form">
                    {/* Date */}
                    <div className="aexp-form-group">
                      <label className="aexp-form-label">
                        <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date
                      </label>
                      <input type="date" className="aexp-form-input" value={expForm.dateISO} onChange={(e)=>setExpForm(v=>({...v, dateISO: e.target.value}))} />
                    </div>
                    {/* Category */}
                    <div className="aexp-form-group">
                      <label className="aexp-form-label">
                        <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1 1 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Category
                      </label>
                      <select className="aexp-form-select" value={expForm.category} onChange={(e)=>setExpForm(v=>({...v, category: e.target.value}))}>
                        {CATEGORIES.map(c => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Employee (salary) */}
                    {expForm.category === 'salary' && (
                      <div className="aexp-form-group">
                        <label className="aexp-form-label">
                          <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Employee
                        </label>
                        <select className="aexp-form-select" value={expForm.employeeId} onChange={(e)=>{
                          const empId = e.target.value;
                          setExpForm(v=>{
                            const emp = employees.find(x=>x.id === empId);
                            const autoAmount = emp ? Number(emp.baseSalary) || '' : '';
                            return { ...v, employeeId: empId, amount: autoAmount };
                          });
                        }}>
                          <option value="">-- Select Employee --</option>
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({currency(e.baseSalary)})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* Amount */}
                    <div className="aexp-form-group">
                      <label className="aexp-form-label">
                        <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Amount (KSh)
                      </label>
                      <input type="number" className="aexp-form-input" value={expForm.amount} onChange={(e)=>setExpForm(v=>({...v, amount: e.target.value}))} placeholder="e.g., 5000" />
                    </div>
                    {/* Note */}
                    <div className="aexp-form-group aexp-form-group-full">
                      <label className="aexp-form-label">
                        <svg className="aexp-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Note (Optional)
                      </label>
                      <input className="aexp-form-input" value={expForm.note} onChange={(e)=>setExpForm(v=>({...v, note: e.target.value}))} placeholder="e.g., Car wash for KDB 123A" />
                    </div>
                    {/* Actions */}
                    <div className="aexp-form-actions">
                      <button className="aexp-btn-primary" onClick={saveExpense} disabled={expSaving}>
                        {expSaving ? (
                          <>
                            <div className="aexp-btn-spinner"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {expForm.id ? 'Update Expense' : 'Add Expense'}
                          </>
                        )}
                      </button>
                      {expForm.id && (
                        <button className="aexp-btn-secondary" onClick={resetExpForm}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aexp-table-container">
                    <table className="aexp-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Employee</th>
                          <th>Amount</th>
                          <th>Note</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expLoading && (
                          <tr><td colSpan={6} className="aexp-table-loading">
                            <div className="aexp-loading-spinner"></div>
                            <span>Loading expenses...</span>
                          </td></tr>
                        )}
                        {!expLoading && expenses.map(e => (
                          <tr key={e.id} className="aexp-table-row">
                            <td className="aexp-table-date">{e.dateISO}</td>
                            <td>
                              <span className="aexp-category-badge">
                                {CATEGORIES.find(c=>c.key===e.category)?.label || e.category}
                              </span>
                            </td>
                            <td className="aexp-table-employee">{e.employeeId ? (employees.find(x=>x.id===e.employeeId)?.name || e.employeeId) : '-'}</td>
                            <td className="aexp-table-amount">{currency(e.amount)}</td>
                            <td className="aexp-table-note" title={e.note || ''}>{e.note || '-'}</td>
                            <td>
                              <div className="aexp-action-buttons">
                                <button className="aexp-btn-edit" onClick={()=>onEditExpense(e)}>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="aexp-btn-delete" onClick={()=>removeExpense(e.id)}>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!expLoading && expenses.length===0 && (
                          <tr><td colSpan={6} className="aexp-table-empty">
                            <svg className="aexp-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>No expenses recorded for this month</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="aexp-reports-wrapper">
              <div className="aexp-section-card">
                <div className="aexp-section-header">
                  <h2 className="aexp-section-title">Expense Reports</h2>
                  <div className="aexp-report-actions">
                    <button className="aexp-btn aexp-btn-secondary" onClick={exportToCSV}>Export CSV</button>
                    <button className="aexp-btn aexp-btn-primary" onClick={printReport}>Print</button>
                  </div>
                </div>
                <div className="aexp-report-filters">
                  <div className="aexp-filter-group">
                    <label className="aexp-label">Report Period</label>
                    <select className="aexp-select" value={reportPeriod} onChange={(e)=>setReportPeriod(e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {reportPeriod === 'monthly' && (
                    <div className="aexp-filter-group">
                      <label className="aexp-label">Year</label>
                      <select className="aexp-select" value={reportYear} onChange={(e)=>setReportYear(e.target.value)}>
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {reportPeriod === 'custom' && (
                    <>
                      <div className="aexp-filter-group">
                        <label className="aexp-label">Start Date</label>
                        <input type="date" className="aexp-input" value={reportStartDate} onChange={(e)=>setReportStartDate(e.target.value)} />
                      </div>
                      <div className="aexp-filter-group">
                        <label className="aexp-label">End Date</label>
                        <input type="date" className="aexp-input" value={reportEndDate} onChange={(e)=>setReportEndDate(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                <div className="aexp-report-summary">
                  <div className="aexp-report-stat">
                    <div className="aexp-report-stat-label">Total Expenses</div>
                    <div className="aexp-report-stat-value">{currency(reportData.reduce((sum, r) => sum + r.expenses, 0))}</div>
                  </div>
                  <div className="aexp-report-stat">
                    <div className="aexp-report-stat-label">Total Transactions</div>
                    <div className="aexp-report-stat-value">{reportData.reduce((sum, r) => sum + r.count, 0)}</div>
                  </div>
                  <div className="aexp-report-stat">
                    <div className="aexp-report-stat-label">Average per Period</div>
                    <div className="aexp-report-stat-value">{currency(reportData.length > 0 ? reportData.reduce((sum, r) => sum + r.expenses, 0) / reportData.length : 0)}</div>
                  </div>
                </div>
                <div className="aexp-table-wrapper">
                  <table className="aexp-table aexp-report-table">
                    <thead>
                      <tr>
                        <th>{reportPeriod === 'yearly' ? 'Year' : reportPeriod === 'monthly' ? 'Month' : 'Period'}</th>
                        <th>Total Expenses (KSh)</th>
                        <th>Transactions</th>
                        {CATEGORIES.map(cat => (
                          <th key={cat.key}>{cat.label} (KSh)</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={idx} className="aexp-table-row">
                          <td className="aexp-table-date">{row.month || row.year || row.period}</td>
                          <td className="aexp-table-amount">{money(row.expenses)}</td>
                          <td>{row.count}</td>
                          {CATEGORIES.map(cat => (
                            <td key={cat.key} className="aexp-report-category-cell">{money(row.categories[cat.key] || 0)}</td>
                          ))}
                        </tr>
                      ))}
                      {reportData.length === 0 && (
                        <tr>
                          <td colSpan={3 + CATEGORIES.length} className="aexp-table-empty">No data available for the selected period</td>
                        </tr>
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
}