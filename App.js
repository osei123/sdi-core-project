import React from 'react';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- DATA & CONSTANTS ---
import { COLORS } from './src/constants/colors';
import { CHECKLIST_DATA } from './src/data/checklistData';
import { styles } from './src/styles/globalStyles';

// --- THEME ---
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// --- HOOKS ---
import { useAppLogic } from './src/hooks/useAppLogic';

// --- SCREENS ---
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ManagerDashboard from './src/screens/ManagerDashboard';
import InspectorHomeScreen from './src/screens/InspectorHomeScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import InspectionDetailsScreen from './src/screens/InspectionDetailsScreen';
import PreInspectionScreen from './src/screens/PreInspectionScreen';
import InspectionFlow from './src/screens/InspectionFlow';
import SummaryScreen from './src/screens/SummaryScreen';
import QualityDataScreen from './src/screens/QualityDataScreen';

// --- COMPONENTS ---
import BottomNav from './src/components/BottomNav';

// Inner component that uses theme
function AppContent() {
  const { theme, colors } = useTheme();
  const {
    currentScreen,
    userRole,
    userData,
    biometricCredentials,
    registeredUsers,
    historyLog,
    selectedInspection,
    results,
    navigate,
    setUserRole,
    handleLoginCheck,
    handleNewUser,
    handleCreateManagerAccount,
    handleSaveAndExit,
    handleDeleteInspection,
    handleExportPDF,
    handleUpdateProfile,
    handleViewDetails,
    handleStartInspection,
    handleInspectionComplete,
    handleLogout,
    handleForgotPassword,
    handleVerifyOtp,
    handleUpdatePassword,
    handleVerifySignupOtp,
    fetchHistory,
    qualityReports,
    handleSaveQualityData,
    handleExportQualityPDF,
  } = useAppLogic();

  // SCREEN CONTROLLER
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboard':
        return (
          <OnboardingScreen
            onFinish={() => navigate('auth')}
            onLogin={() => navigate('auth')}
            onRegister={(googleUser) => {
              if (googleUser.username) {
                handleNewUser(googleUser);
              } else {
                navigate('signup');
              }
            }}
          />
        );
      case 'auth':
        return (
          <AuthScreen
            onLogin={handleLoginCheck}
            onSignup={() => navigate('signup')}
            onForgotPassword={() => navigate('forgotPassword')}
            savedCredentials={biometricCredentials}
          />
        );
      case 'signup':
        return (
          <SignupScreen
            onRegister={handleNewUser}
            onVerifySignup={handleVerifySignupOtp}
            onBack={() => navigate('auth')}
          />
        );
      case 'createManager':
        return (
          <SignupScreen
            onRegister={handleCreateManagerAccount}
            onBack={() => navigate('home')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            onBack={() => navigate('auth')}
            onReset={handleForgotPassword}
            onVerify={handleVerifyOtp}
            onUpdate={handleUpdatePassword}
            onComplete={() => navigate('auth')}
          />
        );
      case 'home':
        return userRole === 'manager' ? (
          <ManagerDashboard
            onLogout={handleLogout}
            userName={userData.name}
            historyData={historyLog}
            allUsers={registeredUsers}
            onViewItem={handleViewDetails}
            onAddManager={() => navigate('createManager')}
            onEditProfile={() => navigate('editProfile')}
            onDeleteAccount={handleLogout}
            qualityReports={qualityReports}
            onExportQuality={handleExportQualityPDF}
          />
        ) : (
          <InspectorHomeScreen
            onStart={() => navigate('pre-inspection')}
            userName={userData.name}
            realRole={userData.role}
            historyData={historyLog}
            onViewItem={handleViewDetails}
            onLogout={handleLogout}
            onDeleteAccount={handleLogout}
            onSwitchToManager={() => setUserRole('manager')}
            onEditProfile={() => navigate('editProfile')}
            onRefresh={() => fetchHistory(userData.role, userData.id)}
          />
        );
      case 'editProfile':
        return (
          <EditProfileScreen
            currentData={userData}
            onSave={handleUpdateProfile}
            onBack={() => navigate('home')}
            onForgotPassword={() => navigate('forgotPassword')}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            data={historyLog}
            onBack={() => navigate('home')}
            onDelete={handleDeleteInspection}
            onView={handleViewDetails}
            onExport={handleExportPDF}
          />
        );
      case 'details':
        return (
          <InspectionDetailsScreen
            item={selectedInspection}
            onBack={() =>
              userRole === 'manager' ? navigate('home') : navigate('history')
            }
            onExport={handleExportPDF}
          />
        );
      case 'pre-inspection':
        return (
          <PreInspectionScreen
            history={historyLog}
            onProceed={handleStartInspection}
            onCancel={() => navigate('home')}
          />
        );
      case 'inspection':
        return (
          <InspectionFlow
            data={CHECKLIST_DATA}
            onComplete={handleInspectionComplete}
            onCancel={() => navigate('home')}
          />
        );
      case 'summary':
        return <SummaryScreen results={results} onHome={handleSaveAndExit} />;
      case 'quality':
        return <QualityDataScreen onBack={() => navigate('home')} onSave={handleSaveQualityData} />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={colors.bgPrimary} />
      {renderScreen()}
      {(currentScreen === 'home' || currentScreen === 'history' || currentScreen === 'quality') &&
        userRole === 'inspector' && (
          <BottomNav activeTab={currentScreen} onNavigate={navigate} />
        )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
