import React from 'react';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- DATA & CONSTANTS ---
import { COLORS } from './src/constants/colors';
import { CHECKLIST_DATA } from './src/data/checklistData';
import { styles } from './src/styles/globalStyles';

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

// --- COMPONENTS ---
import BottomNav from './src/components/BottomNav';

export default function App() {
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
    handleLogout
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
      default:
        return <SplashScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        {renderScreen()}
        {(currentScreen === 'home' || currentScreen === 'history') &&
          userRole === 'inspector' && (
            <BottomNav activeTab={currentScreen} onNavigate={navigate} />
          )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
