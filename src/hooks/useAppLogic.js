import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { CHECKLIST_DATA } from '../data/checklistData';
import {
    createSingleReportHTML,
    createFullLogHTML,
} from '../utils/pdfTemplates';
import { supabase } from '../lib/supabase';

export const useAppLogic = () => {
    // START ON 'splash'
    const [currentScreen, setCurrentScreen] = useState('splash');
    const [userRole, setUserRole] = useState('inspector');
    const [biometricCredentials, setBiometricCredentials] = useState(null);

    const [userData, setUserData] = useState({ name: '', id: '', email: '' });
    const [historyLog, setHistoryLog] = useState([]); // This should also ideally be fetched from Supabase in future
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [inspectionData, setInspectionData] = useState({});
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // We keep registeredUsers just for the 'allUsers' prop in ManagerDashboard placeholders, 
    // but in reality we should query 'profiles'. 
    // For now, let's keep it empty or mock, since real logic is auth.
    const [registeredUsers, setRegisteredUsers] = useState([]);

    // AUTH STATE LISTENER
    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                // If on splash, go to onboard. If elsewhere, stay there (auth screen handles unauth)
                if (currentScreen === 'splash') {
                    setTimeout(() => setCurrentScreen('onboard'), 2500);
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setUserData({ name: '', id: '', email: '' });
                // If we are logged out, we generally want to be on auth or onboard or home (public?)
                // Let handleLogout handle navigation usually.
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('Error fetching profile:', error);
                // If no profile, maybe keep them on some setup screen?
                return;
            }

            if (data) {
                setUserData({
                    name: data.full_name || 'User',
                    username: data.username || 'User',
                    id: data.id,
                    role: data.role
                });
                setUserRole(data.role);
                fetchHistory();
                if (data.role === 'manager') {
                    fetchAllUsers();
                }

                // Only navigate home
                if (['splash', 'onboard', 'auth', 'signup', 'forgotPassword'].includes(currentScreen)) {
                    navigate('home');
                }
            }
        } catch (e) {
            console.log('Profile fetch error:', e);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('inspections')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Error fetching history:', error);
            } else {
                setHistoryLog(data.map(item => ({
                    ...item,
                    timestamp: new Date(item.created_at).toLocaleString(), // Map created_at to timestamp
                    truck: item.truck_number || 'Unknown Truck', // Map truck_number to truck
                    inspector: item.inspector_name || 'Unknown Inspector', // Map inspector_name to inspector,
                    driverName: item.driver_name,
                })));
            }
        } catch (e) {
            console.log('History fetch error:', e);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) {
                console.log('Error fetching users:', error);
            } else {
                setRegisteredUsers(data.map(u => ({
                    name: u.full_name || 'Unknown',
                    username: u.username || 'user',
                    role: u.role || 'inspector',
                    email: u.email,
                    id: u.id,
                    registeredLocation: u.registered_location
                })));
            }
        } catch (e) {
            console.log('Users fetch error:', e);
        }
    };

    // NAVIGATION HANDLER
    const navigate = (screen) => {
        setCurrentScreen(screen);
    };

    const handleLoginCheck = async (email, password, isManagerLoginAttempt) => {
        setIsLoading(true);
        // Note: Variable name is 'email' now, but previously 'username'. 
        // Supabase needs email. We should update AuthScreen to ask for Email.
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        setIsLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    const handleNewUser = async (newUser) => { // newUser has { name, username, email, password, role ... }
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: newUser.email,
            password: newUser.password,
            options: {
                data: {
                    full_name: newUser.name,
                    username: newUser.username,
                    role: newUser.role || 'inspector',
                    staff_id: newUser.staffId,
                    registered_location: newUser.registeredLocation,
                },
            },
        });

        setIsLoading(false);

        if (error) {
            Alert.alert('Registration Failed', error.message);
            return;
        }

        if (data.user) {
            if (!data.session) {
                Alert.alert('Verification Sent', 'Please check your email to verify your account.');
            }
            // If session exists, onAuthStateChange will handle navigation
        }
    };

    const handleCreateManagerAccount = async (newManagerData) => {
        // For now, same flow.
        handleNewUser({ ...newManagerData, role: 'manager' });
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            navigate('auth');
        }
    };

    const handleSaveAndExit = (driverSig, inspectorSig) => {
        // 1. Check for specific severity types
        const hasCritical = results.some((r) => r.severity === 'CRITICAL');
        const hasMinor = results.some((r) => r.severity === 'MINOR');

        // 2. Determine the status based on severity
        let finalStatus = 'PASS';
        if (hasCritical) {
            finalStatus = 'GROUNDED'; // Red (Stop!)
        } else if (hasMinor) {
            finalStatus = 'MONITOR'; // Yellow (Safe, but watch out)
        }

        const newRecord = {
            inspector_id: userData.id,
            inspector_name: userData.name,
            truck_number: inspectionData['Truck Number'] || 'Unit #405',
            driver_name: inspectionData['Driver Name'] || 'Unknown Driver',
            depot: inspectionData['Depot'] || 'Kumasi Main',
            transporter: inspectionData['Transporter'] || 'Trustees Limited',
            status: finalStatus,
            items: results,
            driver_signature: driverSig || null,
            inspector_signature: inspectorSig || null,
        };

        // Insert into Supabase
        supabase.from('inspections').insert([newRecord]).select().then(({ data, error }) => {
            if (error) {
                Alert.alert('Error', 'Failed to save inspection to database.');
                console.log(error);
            } else {
                fetchHistory(); // Refresh list

                // --- VOICE FEEDBACK ---
                if (finalStatus === 'GROUNDED') {
                    Speech.speak('Critical Alert. Vehicle Grounded. Do not release.');
                } else if (finalStatus === 'MONITOR') {
                    Speech.speak('Inspection Complete. Monitoring required.');
                } else {
                    Speech.speak('Inspection Passed. Vehicle is safe to depart.');
                }
                // ---------------------------

                navigate('home');
            }
        });
    };

    const handleDeleteInspection = (id) => {
        Alert.alert('Delete Record', 'Remove this inspection?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                    setHistoryLog(historyLog.filter((item) => item.id !== id)),
            },
        ]);
    };

    // PDF EXPORT HANDLER
    const handleExportPDF = async (dataToExport) => {
        try {
            // Helper to load logo
            let logoBase64 = null;
            try {
                const asset = Asset.fromModule(require('../../assets/logo.png'));
                await asset.downloadAsync();
                const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                logoBase64 = `data:image/png;base64,${base64}`;
            } catch (e) {
                console.log('Error loading logo:', e);
            }

            let htmlContent = '';
            if (Array.isArray(dataToExport)) {
                if (dataToExport.length === 0) {
                    Alert.alert('Empty', 'No records found to export.');
                    return;
                }
                htmlContent = createFullLogHTML(dataToExport);
            } else if (dataToExport && typeof dataToExport === 'object') {
                htmlContent = createSingleReportHTML(dataToExport, logoBase64);
            } else {
                htmlContent = createFullLogHTML(historyLog);
            }

            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: 'Download Report',
            });
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'PDF Generation failed. Please try again.');
        }
    };

    const handleUpdateProfile = async (newData) => {
        const { error } = await supabase.from('profiles').update({
            full_name: newData.name,
            // Add more fields if needed
        }).eq('id', userData.id);

        if (!error) {
            setUserData({ ...userData, name: newData.name });
            navigate('home');
        } else {
            Alert.alert('Error', 'Could not update profile');
        }
    };

    const handleViewDetails = (item) => {
        setSelectedInspection(item);
        navigate('details');
    };

    const handleStartInspection = (data) => {
        setInspectionData({ ...data, startTime: Date.now() });
        navigate('inspection');
    };

    const handleInspectionComplete = (res) => {
        setResults(res);
        navigate('summary');
    };

    return {
        // State
        currentScreen,
        userRole,
        userData,
        registeredUsers, // kept for prop compatibility
        historyLog,
        selectedInspection,
        biometricCredentials,
        isLoading,
        results,

        // Actions
        navigate,
        setResults,
        setUserRole,

        // Handlers
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
    };
};
