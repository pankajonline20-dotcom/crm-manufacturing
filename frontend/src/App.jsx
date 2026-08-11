import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useIsMobile } from './hooks/useIsMobile';
import Layout from './components/Layout';
import MobileTabBar from './components/layout/MobileTabBar';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';

// Desktop pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import QuotationBuilder from './pages/QuotationBuilder';
import Quotations from './pages/Quotations';
import Chat from './pages/Chat';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Reports from './pages/Reports';
// CEO Modules
import Goals from './pages/Goals';
import BusinessIntelligence from './pages/BusinessIntelligence';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import CustomerHealth from './pages/CustomerHealth';
import Broadcast from './pages/Broadcast';
import Boardroom from './pages/Boardroom';
import Directory from './pages/Directory';
import CEODashboard from './pages/CEODashboard';
import Users from './pages/Users';

// Mobile pages
import MobileDashboard from './pages/mobile/MobileDashboard';
import MobileLeads from './pages/mobile/MobileLeads';
import MobileLeadDetail from './pages/mobile/MobileLeadDetail';
import MobileChat from './pages/mobile/MobileChat';
import MobileMore from './pages/mobile/MobileMore';

// Error pages
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';

function DesktopRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Layout><AccessDenied /></Layout>;
  return <Layout>{children}</Layout>;
}

function MobileRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      {children}
      <MobileTabBar />
    </div>
  );
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<MobileRoute><MobileDashboard /></MobileRoute>} />
        <Route path="/leads" element={<MobileRoute><MobileLeads /></MobileRoute>} />
        <Route path="/leads/:id" element={<MobileRoute><MobileLeadDetail /></MobileRoute>} />
        <Route path="/chat" element={<MobileRoute><MobileChat /></MobileRoute>} />
        <Route path="/more" element={<MobileRoute><MobileMore /></MobileRoute>} />
        {/* These pages fall back to desktop versions on mobile (work fine with scroll) */}
        <Route path="/machines" element={<MobileRoute><Machines /></MobileRoute>} />
        <Route path="/quotations" element={<MobileRoute><Quotations /></MobileRoute>} />
        <Route path="/quotations/new" element={<MobileRoute><QuotationBuilder /></MobileRoute>} />
        <Route path="/payments" element={<MobileRoute><Payments /></MobileRoute>} />
        <Route path="/deliveries" element={<MobileRoute><Deliveries /></MobileRoute>} />
        {isAdmin && <Route path="/reports" element={<MobileRoute><Reports /></MobileRoute>} />}
        <Route path="*" element={<MobileRoute><NotFound /></MobileRoute>} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<DesktopRoute><Dashboard /></DesktopRoute>} />
      <Route path="/leads" element={<DesktopRoute><Leads /></DesktopRoute>} />
      <Route path="/leads/:id" element={<DesktopRoute><LeadDetail /></DesktopRoute>} />
      <Route path="/machines" element={<DesktopRoute><Machines /></DesktopRoute>} />
      <Route path="/machines/:id" element={<DesktopRoute><MachineDetail /></DesktopRoute>} />
      <Route path="/quotations" element={<DesktopRoute><Quotations /></DesktopRoute>} />
      <Route path="/quotations/new" element={<DesktopRoute><QuotationBuilder /></DesktopRoute>} />
      <Route path="/chat" element={<DesktopRoute><Chat /></DesktopRoute>} />
      <Route path="/payments" element={<DesktopRoute><Payments /></DesktopRoute>} />
      <Route path="/deliveries" element={<DesktopRoute><Deliveries /></DesktopRoute>} />
      <Route path="/reports"    element={<DesktopRoute adminOnly><Reports /></DesktopRoute>} />
      <Route path="/ceo"        element={<DesktopRoute adminOnly><CEODashboard /></DesktopRoute>} />
      <Route path="/users"      element={<DesktopRoute adminOnly><Users /></DesktopRoute>} />
      <Route path="/directory"  element={<DesktopRoute><Directory /></DesktopRoute>} />
      <Route path="/goals"      element={<DesktopRoute adminOnly><Goals /></DesktopRoute>} />
      <Route path="/bi"         element={<DesktopRoute adminOnly><BusinessIntelligence /></DesktopRoute>} />
      <Route path="/competitor" element={<DesktopRoute adminOnly><CompetitorAnalysis /></DesktopRoute>} />
      <Route path="/health"     element={<DesktopRoute adminOnly><CustomerHealth /></DesktopRoute>} />
      <Route path="/broadcast"  element={<DesktopRoute><Broadcast /></DesktopRoute>} />
      <Route path="/boardroom"  element={<DesktopRoute adminOnly><Boardroom /></DesktopRoute>} />
      <Route path="*" element={<DesktopRoute><NotFound /></DesktopRoute>} />
    </Routes>
  );
}

function App() {
  const savedTheme = localStorage.getItem('crm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <CommandPalette />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { fontSize: 13, fontFamily: 'var(--font-primary)', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' },
              success: { iconTheme: { primary: '#E8500A', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
