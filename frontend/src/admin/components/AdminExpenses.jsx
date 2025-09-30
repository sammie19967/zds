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
} from '../../utils/firebase';
import '../styles/AdminExpenses.css';

const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const currency = (n) => `KSh ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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
  const [activeTab, setActiveTab] = useState('summary'); // summary | employees | expenses
  const [month, setMonth] = useState(yyyymm());

  // Employees
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empForm, setEmpForm] = useState({ id: '', name: '', role: '', baseSalary: '', phone: '', email: '' });
  const [empSaving, setEmpSaving] = useState(false);

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expForm, setExpForm] = useState({ id: '', amount: '', category: 'salary', note: '', dateISO: new Date().toISOString().slice(0,10), employeeId: '' });
  const [expSaving, setExpSaving] = useState(false);

  // Totals
  const [feesTotal, setFeesTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);

  // Load initial data
  useEffect(() => {
    (async () => {
      setEmpLoading(true);
      try {
        const list = await listEmployees({ take: 1000 });
        setEmployees(list || []);
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
        const [exps, fees, exTotal] = await Promise.all([
          listExpenses({ month, take: 2000 }),
          getMonthlyPaymentsTotal(month),
          getMonthlyExpensesTotal(month),
        ]);
        setExpenses(exps || []);
        setFeesTotal(Number(fees || 0));
        setExpensesTotal(Number(exTotal || 0));
      } finally {
        setExpLoading(false);
      }
    })();
  }, [month]);

  const profit = useMemo(() => Number((Number(feesTotal) - Number(expensesTotal)).toFixed(2)), [feesTotal, expensesTotal]);

  // Employee handlers
  const onEditEmployee = (e) => setEmpForm({ id: e.id, name: e.name || '', role: e.role || '', baseSalary: e.baseSalary || '', phone: e.phone || '', email: e.email || '' });
  const resetEmpForm = () => setEmpForm({ id: '', name: '', role: '', baseSalary: '', phone: '', email: '' });
  const saveEmployee = async () => {
    try {
      setEmpSaving(true);
      const payload = { name: empForm.name, role: empForm.role, baseSalary: empForm.baseSalary, phone: empForm.phone, email: empForm.email };
      if (!empForm.name?.trim()) throw new Error('Name is required');
      if (empForm.id) {
        await updateEmployee(empForm.id, payload);
      } else {
        await addEmployee(payload);
      }
      const list = await listEmployees({ take: 1000 });
      setEmployees(list || []);
      resetEmpForm();
    } catch (e) {
      alert(e?.message || 'Failed to save employee');
    } finally {
      setEmpSaving(false);
    }
  };
  const removeEmployee = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      const list = await listEmployees({ take: 1000 });
      setEmployees(list || []);
      if (empForm.id === id) resetEmpForm();
    } catch (e) {
      alert(e?.message || 'Failed to delete employee');
    }
  };

  // Expense handlers
  const onEditExpense = (x) => setExpForm({ id: x.id, amount: x.amount, category: x.category, note: x.note || '', dateISO: x.dateISO, employeeId: x.employeeId || '' });
  const resetExpForm = () => setExpForm({ id: '', amount: '', category: 'salary', note: '', dateISO: new Date().toISOString().slice(0,10), employeeId: '' });
  const saveExpense = async () => {
    try {
      setExpSaving(true);
      const amt = Number(expForm.amount) || 0;
      if (amt <= 0) throw new Error('Enter a valid amount');
      const payload = { amount: amt, category: expForm.category, note: expForm.note, dateISO: expForm.dateISO, employeeId: expForm.category === 'salary' ? (expForm.employeeId || '') : '' };
      if (expForm.id) {
        await updateExpense(expForm.id, payload);
      } else {
        await addExpense(payload);
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
      alert(e?.message || 'Failed to save expense');
    } finally {
      setExpSaving(false);
    }
  };
  const removeExpense = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this expense?')) return;
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
    } catch (e) {
      alert(e?.message || 'Failed to delete expense');
    }
  };

  return (
    <div className="admin-expenses-container">
      <div className="admin-expenses-card">
        <div className="admin-expenses-card-header">
          <div>
            <h1 className="admin-expenses-page-title">Expenses & Profit</h1>
            <p className="admin-expenses-page-subtitle">Track employees, expenses, and monthly profit</p>
          </div>
          <div className="admin-expenses-header-controls">
            <label className="admin-expenses-month-label">Month</label>
            <input type="month" className="admin-expenses-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-expenses-nav">
          <button className={`admin-expenses-tab ${activeTab==='summary'?'admin-expenses-tab-active':''}`} onClick={()=>setActiveTab('summary')}>Summary</button>
          <button className={`admin-expenses-tab ${activeTab==='employees'?'admin-expenses-tab-active':''}`} onClick={()=>setActiveTab('employees')}>Employees</button>
          <button className={`admin-expenses-tab ${activeTab==='expenses'?'admin-expenses-tab-active':''}`} onClick={()=>setActiveTab('expenses')}>Expenses</button>
        </div>

        <div className="admin-expenses-content">
          {activeTab === 'summary' && (
            <div className="admin-expenses-grid admin-expenses-grid-3">
              <div className="admin-expenses-summary-card">
                <div className="admin-expenses-summary-label">Fees Collected</div>
                <div className="admin-expenses-summary-value">{currency(feesTotal)}</div>
              </div>
              <div className="admin-expenses-summary-card">
                <div className="admin-expenses-summary-label">Total Expenses</div>
                <div className="admin-expenses-summary-value">{currency(expensesTotal)}</div>
              </div>
              <div className="admin-expenses-summary-card">
                <div className="admin-expenses-summary-label">Profit</div>
                <div className="admin-expenses-summary-value" style={{ color: profit>=0 ? '#059669' : '#dc2626' }}>{currency(profit)}</div>
              </div>

              <div className="admin-expenses-section-card admin-expenses-grid-full">
                <div className="admin-expenses-section-card-header">This Month Expenses</div>
                <div className="admin-expenses-table-wrap">
                  <table className="admin-expenses-table">
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
                        <tr><td colSpan={6} className="admin-expenses-empty">Loading...</td></tr>
                      )}
                      {!expLoading && expenses.map(e => (
                        <tr key={e.id}>
                          <td>{e.dateISO}</td>
                          <td>{CATEGORIES.find(c=>c.key===e.category)?.label || e.category}</td>
                          <td>{e.employeeId ? (employees.find(x=>x.id===e.employeeId)?.name || e.employeeId) : '-'}</td>
                          <td><strong>{currency(e.amount)}</strong></td>
                          <td className="admin-expenses-note-cell" title={e.note || ''}>{e.note || ''}</td>
                          <td>
                            <div className="admin-expenses-actions">
                              <button className="admin-expenses-btn admin-expenses-btn-link" onClick={()=>onEditExpense(e)}>Edit</button>
                              <button className="admin-expenses-btn admin-expenses-btn-danger" onClick={()=>removeExpense(e.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!expLoading && expenses.length===0 && (
                        <tr><td colSpan={6} className="admin-expenses-empty">No expenses recorded for this month</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="admin-expenses-grid admin-expenses-grid-2">
              <div className="admin-expenses-section-card">
                <div className="admin-expenses-section-card-header">Employees</div>
                <div className="admin-expenses-table-wrap">
                  <table className="admin-expenses-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Base Salary</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empLoading && (<tr><td colSpan={6} className="admin-expenses-empty">Loading...</td></tr>)}
                      {!empLoading && employees.map(e => (
                        <tr key={e.id}>
                          <td>{e.name}</td>
                          <td>{e.role || '-'}</td>
                          <td>{currency(e.baseSalary)}</td>
                          <td>{e.phone || '-'}</td>
                          <td>{e.email || '-'}</td>
                          <td>
                            <div className="admin-expenses-actions">
                              <button className="admin-expenses-btn admin-expenses-btn-link" onClick={()=>onEditEmployee(e)}>Edit</button>
                              <button className="admin-expenses-btn admin-expenses-btn-danger" onClick={()=>removeEmployee(e.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!empLoading && employees.length===0 && (
                        <tr><td colSpan={6} className="admin-expenses-empty">No employees</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-expenses-section-card">
                <div className="admin-expenses-section-card-header">Add / Edit Employee</div>
                <div className="admin-expenses-grid admin-expenses-grid-2">
                  <div>
                    <label className="admin-expenses-label">Name</label>
                    <input className="admin-expenses-input" value={empForm.name} onChange={(e)=>setEmpForm(v=>({...v, name: e.target.value}))} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="admin-expenses-label">Role</label>
                    <input className="admin-expenses-input" value={empForm.role} onChange={(e)=>setEmpForm(v=>({...v, role: e.target.value}))} placeholder="e.g., Instructor" />
                  </div>
                  <div>
                    <label className="admin-expenses-label">Base Salary</label>
                    <input type="number" className="admin-expenses-input" value={empForm.baseSalary} onChange={(e)=>setEmpForm(v=>({...v, baseSalary: e.target.value}))} placeholder="e.g., 30000" />
                  </div>
                  <div>
                    <label className="admin-expenses-label">Phone</label>
                    <input className="admin-expenses-input" value={empForm.phone} onChange={(e)=>setEmpForm(v=>({...v, phone: e.target.value}))} placeholder="e.g., 07xx xxx xxx" />
                  </div>
                  <div>
                    <label className="admin-expenses-label">Email</label>
                    <input className="admin-expenses-input" value={empForm.email} onChange={(e)=>setEmpForm(v=>({...v, email: e.target.value}))} placeholder="e.g., name@domain.com" />
                  </div>
                  <div style={{ alignSelf: 'end' }}>
                    <button className="admin-expenses-btn" onClick={saveEmployee} disabled={empSaving}>{empSaving ? 'Saving...' : (empForm.id ? 'Update' : 'Save')}</button>
                    {empForm.id && (
                      <button className="admin-expenses-btn admin-expenses-btn-secondary" onClick={resetEmpForm} style={{ marginLeft: 8 }}>Clear</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="admin-expenses-grid admin-expenses-grid-2">
              <div className="admin-expenses-section-card">
                <div className="admin-expenses-section-card-header">Add / Edit Expense</div>
                <div className="admin-expenses-grid admin-expenses-grid-2">
                  <div>
                    <label className="admin-expenses-label">Date</label>
                    <input type="date" className="admin-expenses-input" value={expForm.dateISO} onChange={(e)=>setExpForm(v=>({...v, dateISO: e.target.value}))} />
                  </div>
                  <div>
                    <label className="admin-expenses-label">Category</label>
                    <select className="admin-expenses-input" value={expForm.category} onChange={(e)=>setExpForm(v=>({...v, category: e.target.value}))}>
                      {CATEGORIES.map(c => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {expForm.category === 'salary' && (
                    <div>
                      <label className="admin-expenses-label">Employee</label>
                      <select className="admin-expenses-input" value={expForm.employeeId} onChange={(e)=>setExpForm(v=>({...v, employeeId: e.target.value}))}>
                        <option value="">-- Select Employee --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="admin-expenses-label">Amount (KSh)</label>
                    <input type="number" className="admin-expenses-input" value={expForm.amount} onChange={(e)=>setExpForm(v=>({...v, amount: e.target.value}))} placeholder="e.g., 5000" />
                  </div>
                  <div className="admin-expenses-grid-full">
                    <label className="admin-expenses-label">Note (Optional)</label>
                    <input className="admin-expenses-input" value={expForm.note} onChange={(e)=>setExpForm(v=>({...v, note: e.target.value}))} placeholder="e.g., Car wash for KDB 123A" />
                  </div>
                  <div style={{ alignSelf: 'end' }}>
                    <button className="admin-expenses-btn" onClick={saveExpense} disabled={expSaving}>{expSaving ? 'Saving...' : (expForm.id ? 'Update' : 'Save')}</button>
                    {expForm.id && (
                      <button className="admin-expenses-btn admin-expenses-btn-secondary" onClick={resetExpForm} style={{ marginLeft: 8 }}>Clear</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-expenses-section-card">
                <div className="admin-expenses-section-card-header">This Month Expenses</div>
                <div className="admin-expenses-table-wrap">
                  <table className="admin-expenses-table">
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
                      {expLoading && (<tr><td colSpan={6} className="admin-expenses-empty">Loading...</td></tr>)}
                      {!expLoading && expenses.map(e => (
                        <tr key={e.id}>
                          <td>{e.dateISO}</td>
                          <td>{CATEGORIES.find(c=>c.key===e.category)?.label || e.category}</td>
                          <td>{e.employeeId ? (employees.find(x=>x.id===e.employeeId)?.name || e.employeeId) : '-'}</td>
                          <td><strong>{currency(e.amount)}</strong></td>
                          <td className="admin-expenses-note-cell" title={e.note || ''}>{e.note || ''}</td>
                          <td>
                            <div className="admin-expenses-actions">
                              <button className="admin-expenses-btn admin-expenses-btn-link" onClick={()=>onEditExpense(e)}>Edit</button>
                              <button className="admin-expenses-btn admin-expenses-btn-danger" onClick={()=>removeExpense(e.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!expLoading && expenses.length===0 && (
                        <tr><td colSpan={6} className="admin-expenses-empty">No expenses recorded for this month</td></tr>
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
