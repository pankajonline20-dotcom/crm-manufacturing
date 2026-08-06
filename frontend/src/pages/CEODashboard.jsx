import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatINR } from '../utils';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'daily', label: 'Daily Entry' },
  { id: 'finance', label: 'Finance' },
  { id: 'production', label: 'Production' },
  { id: 'fitting', label: 'Fitting & Testing' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'sales', label: 'Sales Team' },
  { id: 'orders', label: 'Orders' },
];

const EXPENSE_CATEGORIES = ['Material', 'Salary', 'Rent', 'Electricity', 'Courier', 'Transport', 'Marketing', 'Machine Sale', 'Misc'];
const PAYMENT_MODES = ['Cash', 'Check', 'Transfer', 'Card', 'Online'];
const ORDER_STATUSES = ['New', 'Production', 'Testing', 'Dispatch', 'Delivered', 'Cancelled'];

export default function CEODashboard() {
  const [tab, setTab] = useState('dashboard');
  const [dailyEntry, setDailyEntry] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDailyEntry();
  }, [selectedDate, refreshKey]);

  // Auto-refresh dashboard every 5 seconds when on dashboard tab
  useEffect(() => {
    if (tab === 'dashboard') {
      const interval = setInterval(() => {
        loadDailyEntry();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  const loadDailyEntry = async () => {
    try {
      const res = await api.get('/entries/daily-entry', { params: { date: selectedDate } }).catch(() => null);
      if (res?.data) {
        setDailyEntry(res.data);
        const profit = (res.data.cash_in || 0) - (res.data.cash_out || 0);
        const conversion = (res.data.sales_calls || 0) > 0 ? Math.round((res.data.orders_count / res.data.sales_calls) * 100) : 0;
        setKpis({
          cash_in: res.data.cash_in || 0,
          cash_out: res.data.cash_out || 0,
          profit,
          orders: res.data.orders_count || 0,
          manufactured: res.data.welding_completed || 0,
          tested: res.data.testing_completed || 0,
          dispatched: res.data.dispatch_count || 0,
          calls: res.data.sales_calls || 0,
          conversion
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0f1419', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2332 0%, #2d3f52 100%)',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>📊</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🚀 SalesSaathi</h1>
            <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0 0' }}>CRM & Operations Control Center</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600
          }}
        >
          ➜ Sign out
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        overflowX: 'auto',
        padding: '0 24px'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '16px 16px',
              border: 'none',
              background: 'none',
              color: tab === t.id ? '#E8500A' : 'rgba(255,255,255,0.6)',
              borderBottom: tab === t.id ? '3px solid #E8500A' : 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {tab === 'dashboard' && <DashboardSheet kpis={kpis} />}
        {tab === 'daily' && <DailyEntrySheet selectedDate={selectedDate} onDateChange={setSelectedDate} dailyEntry={dailyEntry} onSave={loadDailyEntry} />}
        {tab === 'finance' && <FinanceSheet onSave={() => setRefreshKey(k => k + 1)} />}
        {tab === 'production' && <ProductionSheet onSave={() => setRefreshKey(k => k + 1)} />}
        {tab === 'fitting' && <FittingSheet onSave={() => setRefreshKey(k => k + 1)} />}
        {tab === 'dispatch' && <DispatchSheet onSave={() => setRefreshKey(k => k + 1)} />}
        {tab === 'sales' && <SalesSheet onSave={() => setRefreshKey(k => k + 1)} />}
        {tab === 'orders' && <OrdersSheet onSave={() => setRefreshKey(k => k + 1)} />}
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function DashboardSheet({ kpis }) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [kpis]);

  if (!kpis) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>CEO Daily Dashboard</h2>
          <p style={{ fontSize: 11, opacity: 0.6, margin: '6px 0 0 0' }}>Last updated: {lastUpdate.toLocaleTimeString()} ✓</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#3B82F6',
            color: 'white',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Now
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KPIBox label="CASH IN" value={formatINR(kpis.cash_in)} color="#10B981" />
        <KPIBox label="CASH OUT" value={formatINR(kpis.cash_out)} color="#F59E0B" />
        <KPIBox label="PROFIT" value={formatINR(kpis.profit)} color={kpis.profit >= 0 ? '#10B981' : '#EF4444'} />
        <KPIBox label="ORDERS" value={kpis.orders} />
        <KPIBox label="MANUFACTURED" value={kpis.manufactured} />
        <KPIBox label="TESTED" value={kpis.tested} />
        <KPIBox label="DISPATCHED" value={kpis.dispatched} />
        <KPIBox label="CALLS" value={kpis.calls} />
        <KPIBox label="CONVERSION" value={`${kpis.conversion}%`} />
        <KPIBox label="PENDING" value="0" />
        <KPIBox label="PENDING TEST" value="1" />
        <KPIBox label="PENDING DISPATCH" value="0" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        <ChartBox title="Daily Cash Flow">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[{ date: 'Mon', in: kpis.cash_in, out: kpis.cash_out }]}>
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="out" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Production Progress">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ stage: 'Welding', value: 5 }, { stage: 'Testing', value: 3 }, { stage: 'Dispatch', value: 2 }]}>
              <XAxis dataKey="stage" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ===== DAILY ENTRY =====
function DailyEntrySheet({ selectedDate, onDateChange, dailyEntry, onSave }) {
  const [formData, setFormData] = useState(dailyEntry || {
    entry_date: selectedDate,
    cash_in: 0, cash_out: 0, welding_completed: 0, sent_to_coating: 0,
    returned_from_coating: 0, fitting_completed: 0, testing_completed: 0,
    dispatch_count: 0, sales_calls: 0, orders_count: 0, remarks: ''
  });

  useEffect(() => {
    if (dailyEntry) setFormData(dailyEntry);
  }, [dailyEntry]);

  const handleSave = async () => {
    try {
      await api.post('/entries/daily-entry', formData);
      toast.success('✓ Daily entry saved! Dashboard updating...');
      onSave();
    } catch (err) {
      toast.error('❌ Failed to save');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Daily Entry</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
        <FormField label="Date" type="date" value={formData.entry_date} onChange={(v) => { setFormData({ ...formData, entry_date: v }); onDateChange(v); }} />

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>Finance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <FormField label="Cash In (₹)" type="number" value={formData.cash_in} onChange={(v) => setFormData({ ...formData, cash_in: v })} />
          <FormField label="Cash Out (₹)" type="number" value={formData.cash_out} onChange={(v) => setFormData({ ...formData, cash_out: v })} />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>Production</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <FormField label="Welding Completed" type="number" value={formData.welding_completed} onChange={(v) => setFormData({ ...formData, welding_completed: v })} />
          <FormField label="Sent to Coating" type="number" value={formData.sent_to_coating} onChange={(v) => setFormData({ ...formData, sent_to_coating: v })} />
          <FormField label="Returned from Coating" type="number" value={formData.returned_from_coating} onChange={(v) => setFormData({ ...formData, returned_from_coating: v })} />
          <FormField label="Fitting Completed" type="number" value={formData.fitting_completed} onChange={(v) => setFormData({ ...formData, fitting_completed: v })} />
          <FormField label="Testing Completed" type="number" value={formData.testing_completed} onChange={(v) => setFormData({ ...formData, testing_completed: v })} />
          <FormField label="Dispatch Count" type="number" value={formData.dispatch_count} onChange={(v) => setFormData({ ...formData, dispatch_count: v })} />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>Sales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <FormField label="Sales Calls" type="number" value={formData.sales_calls} onChange={(v) => setFormData({ ...formData, sales_calls: v })} />
          <FormField label="Orders" type="number" value={formData.orders_count} onChange={(v) => setFormData({ ...formData, orders_count: v })} />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>Remarks</h3>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Any notes about today..."
          style={{
            width: '100%', padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 13, fontFamily: 'inherit',
            minHeight: '80px', marginBottom: 20, resize: 'vertical', boxSizing: 'border-box'
          }}
        />

        <button onClick={handleSave} style={ButtonStyle()}>💾 Save Daily Entry</button>
      </div>
    </div>
  );
}

// ===== FINANCE =====
function FinanceSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ type: 'in', customer_name: '', vendor_name: '', amount: 0, category: '', payment_mode: 'Cash', remarks: '' });

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      const res = await api.get('/entries/finance').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/finance', formData);
      toast.success('✓ Entry added! Dashboard updating...');
      setFormData({ type: 'in', customer_name: '', vendor_name: '', amount: 0, category: '', payment_mode: 'Cash', remarks: '' });
      loadFinance();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Finance</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add Entry</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={InputStyle()}>
            <option value="in">💰 Cash In</option>
            <option value="out">💸 Cash Out</option>
          </select>

          {formData.type === 'in' && <input type="text" placeholder="Customer Name" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} style={InputStyle()} />}

          {formData.type === 'out' && (
            <>
              <input type="text" placeholder="Vendor Name" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} style={InputStyle()} />
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={InputStyle()}>
                <option value="">Category</option>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </>
          )}

          <input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} style={InputStyle()} />
          <select value={formData.payment_mode} onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })} style={InputStyle()}>
            {PAYMENT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </div>

        <textarea placeholder="Remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 12, fontFamily: 'inherit', minHeight: '60px', marginBottom: 16, boxSizing: 'border-box' }} />

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Entry</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Type', 'Amount', 'Category', 'Mode', 'Remarks']}
          rows={entries.map(e => [e.entry_date, e.type === 'in' ? '💰 In' : '💸 Out', formatINR(e.amount), e.category || '-', e.payment_mode, e.remarks || '-'])}
        />
      )}
    </div>
  );
}

// ===== PRODUCTION =====
function ProductionSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ entry_date: new Date().toISOString().split('T')[0], machine_model: '', welding_done: 0, sent_to_coating: 0, returned_count: 0, pending: 0, remarks: '' });

  useEffect(() => {
    loadProduction();
  }, []);

  const loadProduction = async () => {
    try {
      const res = await api.get('/entries/production').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/production', formData);
      toast.success('✓ Entry added! Dashboard updating...');
      setFormData({ entry_date: new Date().toISOString().split('T')[0], machine_model: '', welding_done: 0, sent_to_coating: 0, returned_count: 0, pending: 0, remarks: '' });
      loadProduction();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Production</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add Production Entry</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Date" type="date" value={formData.entry_date} onChange={(v) => setFormData({ ...formData, entry_date: v })} />
          <FormField label="Machine Model" value={formData.machine_model} onChange={(v) => setFormData({ ...formData, machine_model: v })} />
          <FormField label="Welding Done" type="number" value={formData.welding_done} onChange={(v) => setFormData({ ...formData, welding_done: v })} />
          <FormField label="Sent to Coating" type="number" value={formData.sent_to_coating} onChange={(v) => setFormData({ ...formData, sent_to_coating: v })} />
          <FormField label="Returned" type="number" value={formData.returned_count} onChange={(v) => setFormData({ ...formData, returned_count: v })} />
          <FormField label="Pending" type="number" value={formData.pending} onChange={(v) => setFormData({ ...formData, pending: v })} />
        </div>

        <textarea placeholder="Remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 12, fontFamily: 'inherit', minHeight: '60px', marginBottom: 16, boxSizing: 'border-box' }} />

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Entry</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Machine', 'Welding', 'Coating', 'Returned', 'Pending']}
          rows={entries.map(e => [e.entry_date, e.machine_model, e.welding_done, e.sent_to_coating, e.returned_count, e.pending])}
        />
      )}
    </div>
  );
}

// ===== FITTING & TESTING =====
function FittingSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ entry_date: new Date().toISOString().split('T')[0], machine: '', testing_completed: 0, passed: 0, failed: 0, ready_for_dispatch: 0 });

  useEffect(() => {
    loadFitting();
  }, []);

  const loadFitting = async () => {
    try {
      const res = await api.get('/entries/fitting').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/fitting', formData);
      toast.success('✓ Entry added! Dashboard updating...');
      setFormData({ entry_date: new Date().toISOString().split('T')[0], machine: '', testing_completed: 0, passed: 0, failed: 0, ready_for_dispatch: 0 });
      loadFitting();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Fitting & Testing</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add Testing Entry</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Date" type="date" value={formData.entry_date} onChange={(v) => setFormData({ ...formData, entry_date: v })} />
          <FormField label="Machine" value={formData.machine} onChange={(v) => setFormData({ ...formData, machine: v })} />
          <FormField label="Testing Completed" type="number" value={formData.testing_completed} onChange={(v) => setFormData({ ...formData, testing_completed: v })} />
          <FormField label="Passed" type="number" value={formData.passed} onChange={(v) => setFormData({ ...formData, passed: v })} />
          <FormField label="Failed" type="number" value={formData.failed} onChange={(v) => setFormData({ ...formData, failed: v })} />
          <FormField label="Ready for Dispatch" type="number" value={formData.ready_for_dispatch} onChange={(v) => setFormData({ ...formData, ready_for_dispatch: v })} />
        </div>

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Entry</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Machine', 'Tested', 'Passed', 'Failed', 'Ready']}
          rows={entries.map(e => [e.entry_date, e.machine, e.testing_completed, e.passed, e.failed, e.ready_for_dispatch])}
        />
      )}
    </div>
  );
}

// ===== DISPATCH =====
function DispatchSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ entry_date: new Date().toISOString().split('T')[0], customer_name: '', machine_model: '', transport_company: '', lr_number: '', state: '', delivered: 0 });

  useEffect(() => {
    loadDispatch();
  }, []);

  const loadDispatch = async () => {
    try {
      const res = await api.get('/entries/dispatch').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/dispatch', formData);
      toast.success('✓ Entry added! Dashboard updating...');
      setFormData({ entry_date: new Date().toISOString().split('T')[0], customer_name: '', machine_model: '', transport_company: '', lr_number: '', state: '', delivered: 0 });
      loadDispatch();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Dispatch</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add Dispatch Entry</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Date" type="date" value={formData.entry_date} onChange={(v) => setFormData({ ...formData, entry_date: v })} />
          <FormField label="Customer" value={formData.customer_name} onChange={(v) => setFormData({ ...formData, customer_name: v })} />
          <FormField label="Machine" value={formData.machine_model} onChange={(v) => setFormData({ ...formData, machine_model: v })} />
          <FormField label="Transport Co." value={formData.transport_company} onChange={(v) => setFormData({ ...formData, transport_company: v })} />
          <FormField label="LR Number" value={formData.lr_number} onChange={(v) => setFormData({ ...formData, lr_number: v })} />
          <FormField label="State" value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={formData.delivered} onChange={(e) => setFormData({ ...formData, delivered: e.target.checked ? 1 : 0 })} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>✓ Delivered</span>
        </label>

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Entry</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Customer', 'Machine', 'Transport', 'LR', 'State', 'Delivered']}
          rows={entries.map(e => [e.entry_date, e.customer_name, e.machine_model, e.transport_company, e.lr_number, e.state, e.delivered ? '✓' : '-'])}
        />
      )}
    </div>
  );
}

// ===== SALES =====
function SalesSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ entry_date: new Date().toISOString().split('T')[0], sales_person_id: 1, calls: 0, followups: 0, videos_sent: 0, quotations: 0, orders: 0, order_value: 0 });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const res = await api.get('/entries/sales').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/sales', formData);
      toast.success('✓ Entry added! Dashboard updating...');
      setFormData({ entry_date: new Date().toISOString().split('T')[0], sales_person_id: 1, calls: 0, followups: 0, videos_sent: 0, quotations: 0, orders: 0, order_value: 0 });
      loadSales();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Sales Team</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add Sales Entry</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Date" type="date" value={formData.entry_date} onChange={(v) => setFormData({ ...formData, entry_date: v })} />
          <FormField label="Calls" type="number" value={formData.calls} onChange={(v) => setFormData({ ...formData, calls: v })} />
          <FormField label="Follow-ups" type="number" value={formData.followups} onChange={(v) => setFormData({ ...formData, followups: v })} />
          <FormField label="Videos Sent" type="number" value={formData.videos_sent} onChange={(v) => setFormData({ ...formData, videos_sent: v })} />
          <FormField label="Quotations" type="number" value={formData.quotations} onChange={(v) => setFormData({ ...formData, quotations: v })} />
          <FormField label="Orders" type="number" value={formData.orders} onChange={(v) => setFormData({ ...formData, orders: v })} />
          <FormField label="Order Value (₹)" type="number" value={formData.order_value} onChange={(v) => setFormData({ ...formData, order_value: v })} />
        </div>

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Entry</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Calls', 'Follow-ups', 'Videos', 'Quotations', 'Orders', 'Value']}
          rows={entries.map(e => [e.entry_date, e.calls, e.followups, e.videos_sent, e.quotations, e.orders, formatINR(e.order_value)])}
        />
      )}
    </div>
  );
}

// ===== ORDERS =====
function OrdersSheet({ onSave }) {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ order_date: new Date().toISOString().split('T')[0], customer_name: '', machine_model: '', quantity: 1, amount: 0, advance: 0, status: 'New' });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/entries/orders').catch(() => null);
      if (res?.data?.entries) setEntries(res.data.entries);
    } catch (err) { }
  };

  const handleAdd = async () => {
    try {
      await api.post('/entries/orders', formData);
      toast.success('✓ Order added! Dashboard updating...');
      setFormData({ order_date: new Date().toISOString().split('T')[0], customer_name: '', machine_model: '', quantity: 1, amount: 0, advance: 0, status: 'New' });
      loadOrders();
      if (onSave) onSave();
    } catch (err) {
      toast.error('❌ Failed to add');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>Orders</h2>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add New Order</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Date" type="date" value={formData.order_date} onChange={(v) => setFormData({ ...formData, order_date: v })} />
          <FormField label="Customer" value={formData.customer_name} onChange={(v) => setFormData({ ...formData, customer_name: v })} />
          <FormField label="Machine" value={formData.machine_model} onChange={(v) => setFormData({ ...formData, machine_model: v })} />
          <FormField label="Qty" type="number" value={formData.quantity} onChange={(v) => setFormData({ ...formData, quantity: v })} />
          <FormField label="Amount (₹)" type="number" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} />
          <FormField label="Advance (₹)" type="number" value={formData.advance} onChange={(v) => setFormData({ ...formData, advance: v })} />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={InputStyle()}>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button onClick={handleAdd} style={ButtonStyle()}>➕ Add Order</button>
      </div>

      {entries.length > 0 && (
        <DataTable
          columns={['Date', 'Customer', 'Machine', 'Qty', 'Amount', 'Advance', 'Balance', 'Status']}
          rows={entries.map(e => [e.order_date, e.customer_name, e.machine_model, e.quantity, formatINR(e.amount), formatINR(e.advance), formatINR(e.amount - e.advance), e.status])}
        />
      )}
    </div>
  );
}

// ===== COMPONENTS =====
function KPIBox({ label, value, color = '#3B82F6' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, border: `2px solid ${color}40` }}>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={InputStyle()}
      />
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {columns.map(col => (
              <th key={col} style={{ padding: '12px', textAlign: 'left', fontWeight: 700, opacity: 0.7 }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px', opacity: 0.8 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== STYLES =====
function InputStyle() {
  return {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontSize: 12,
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };
}

function ButtonStyle() {
  return {
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #E8500A, #FF6B2C)',
    color: 'white',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  };
}
