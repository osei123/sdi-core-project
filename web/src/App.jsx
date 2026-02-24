import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import { useAppLogic } from './hooks/useAppLogic';
import BottomNav from './components/BottomNav';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import InspectorHome from './pages/InspectorHome';
import PreInspectionPage from './pages/PreInspectionPage';
import InspectionFlowPage from './pages/InspectionFlowPage';
import SummaryPage from './pages/SummaryPage';
import HistoryPage from './pages/HistoryPage';
import InspectionDetailsPage from './pages/InspectionDetailsPage';
import QualityDataPage from './pages/QualityDataPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EditProfilePage from './pages/EditProfilePage';

const ProtectedRoute = ({ children, appLogic }) => {
  if (appLogic.loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: '#0f766e' }} />
      </div>
    );
  }
  if (!appLogic.session) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const appLogic = useAppLogic();

  return (
    <div className="app-shell">
      <div className="app-content">
        <Routes>
          {/* Auth */}
          <Route path="/" element={
            appLogic.session ? <Navigate to="/home" replace /> : <LoginPage appLogic={appLogic} />
          } />
          <Route path="/signup" element={<SignupPage appLogic={appLogic} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage appLogic={appLogic} />} />

          {/* Protected */}
          <Route path="/home" element={
            <ProtectedRoute appLogic={appLogic}>
              <InspectorHome appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/inspect" element={
            <ProtectedRoute appLogic={appLogic}>
              <PreInspectionPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/checklist" element={
            <ProtectedRoute appLogic={appLogic}>
              <InspectionFlowPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/summary" element={
            <ProtectedRoute appLogic={appLogic}>
              <SummaryPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute appLogic={appLogic}>
              <HistoryPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/details/:id" element={
            <ProtectedRoute appLogic={appLogic}>
              <InspectionDetailsPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/quality" element={
            <ProtectedRoute appLogic={appLogic}>
              <QualityDataPage appLogic={appLogic} />
            </ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute appLogic={appLogic}>
              {appLogic.role === 'manager' ? (
                <ManagerDashboard appLogic={appLogic} />
              ) : (
                <Navigate to="/home" replace />
              )}
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute appLogic={appLogic}>
              <EditProfilePage appLogic={appLogic} />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
