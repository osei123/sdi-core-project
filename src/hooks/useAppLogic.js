import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store'; // <--- IMPORT THIS
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
    // Quality Reports state
    const [qualityReports, setQualityReports] = useState([]);

    // AUTH STATE LISTENER
    useEffect(() => {
        // Load Saved Credentials for Biometrics
        const loadCredentials = async () => {
            try {
                const credentials = await SecureStore.getItemAsync('user_credentials');
                if (credentials) {
                    setBiometricCredentials(JSON.parse(credentials));
                }
            } catch (e) {
                console.log('Error loading credentials', e);
            }
        };
        loadCredentials();

        // Check initial session
        // Check initial session
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.log('Session fetch error:', error);
                // If the refresh token is invalid, we should probably clear storage or just ensure we are logged out.
                // handleLogout() might cause a loop if it tries to call API. 
                // Best to just treat as unauthenticated.
            } else if (data.session) {
                fetchProfile(data.session.user.id);
            } else {
                // If on splash, go to onboard. If elsewhere, stay there (auth screen handles unauth)
                if (currentScreen === 'splash') {
                    setTimeout(() => setCurrentScreen('onboard'), 2500);
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                // Clear local data
                setUserData({ name: '', id: '', email: '' });
                setUserRole('inspector');

                // Clear secure store
                try {
                    await SecureStore.deleteItemAsync('user_credentials');
                    setBiometricCredentials(null);
                } catch (e) { /* ignore */ }

                navigate('auth');
            } else if (session) {
                fetchProfile(session.user.id);
                updateLastSeen(session.user.id); // Track app opens/auto-logins
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
                // Pass role and ID explicitly to avoid state race conditions
                fetchHistory(data.role, data.id);
                if (data.role === 'manager') {
                    fetchAllUsers();
                    fetchQualityReports(); // Fetch quality reports for managers
                }

                // Only navigate home if not in signup (signup handles its own navigation after OTP)
                if (['splash', 'onboard', 'auth', 'forgotPassword'].includes(currentScreen)) {
                    navigate('home');
                }
            }
        } catch (e) {
            console.log('Profile fetch error:', e);
        }
    };

    const fetchHistory = async (roleOverride, userIdOverride) => {
        try {
            // Use overrides if provided, otherwise fall back to state (though state might be stale if called immediately after set)
            const activeRole = roleOverride || userRole;
            const activeId = userIdOverride || userData.id;

            let query = supabase
                .from('inspections')
                .select('*')
                .order('created_at', { ascending: false });

            // FEATURE: Managers see ALL. Inspectors see ONLY THEIR OWN.
            if (activeRole === 'inspector' && activeId) {
                query = query.eq('inspector_id', activeId);
            }

            const { data, error } = await query;

            if (error) {
                console.log('Error fetching history:', error);
            } else {
                setHistoryLog(data.map(item => ({
                    ...item,
                    timestamp: new Date(item.created_at).toLocaleString(), // Map created_at to timestamp
                    truck: item.truck_number || 'Unknown Truck', // Map truck_number to truck
                    inspector: item.inspector_name || 'Unknown Inspector', // Map inspector_name to inspector,
                    driverName: item.driver_name,
                    driverSignature: item.driver_signature,
                    inspectorSignature: item.inspector_signature,
                })));
            }
        } catch (e) {
            console.log('History fetch error:', e);
        }
    };

    const fetchAllUsers = async () => {
        try {
            // 1. Fetch Users
            const { data: users, error: usersError } = await supabase
                .from('profiles')
                .select('*');

            if (usersError) {
                console.log('Error fetching users:', usersError);
                return;
            }

            // 2. Fetch All Inspections (Lightweight query)
            const { data: allInspections, error: inspError } = await supabase
                .from('inspections')
                .select('inspector_id, status');

            if (inspError) {
                console.log('Error fetching inspections for stats:', inspError);
            }

            // 3. Aggregate Data
            const processedUsers = users.map(u => {
                const userInspections = allInspections ? allInspections.filter(i => i.inspector_id === u.id) : [];
                const total = userInspections.length;
                const passed = userInspections.filter(i => i.status === 'PASS').length;

                // Rating Calculation: (Passed / Total) * 5. Default to 5.0 for new users to be nice :)
                const calculatedRating = total > 0 ? ((passed / total) * 5).toFixed(1) : '5.0';

                return {
                    id: u.id,
                    name: u.full_name,
                    role: u.role,
                    staffId: u.staff_id || 'N/A',
                    staffId: u.staff_id || 'N/A',
                    lastSeen: (u.updated_at || u.created_at) ? new Date(u.updated_at || u.created_at).toLocaleString() : 'Never', // Fallback to created_at
                    inspections: total,
                    rating: calculatedRating
                };
            });

            setRegisteredUsers(processedUsers);

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
        // Supabase needs email. We should update AuthScreen to ask for Email.
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        setIsLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            // Update Last Seen
            if (data?.user) {
                updateLastSeen(data.user.id);
            }

            // Save for biometric use
            try {
                await SecureStore.setItemAsync('user_credentials', JSON.stringify({ username: email, password }));
                setBiometricCredentials({ username: email, password });
            } catch (e) {
                console.log('Error saving credentials', e);
            }
        }
    };

    const updateLastSeen = async (userId) => {
        try {
            // We use 'updated_at' as a proxy for Last Seen given schema constraints
            // Or if a 'last_seen' column exists, use that. 
            // We'll update 'updated_at' by setting a dummy field or just updated_at if Supabase allows manual set,
            // or just updating a metadata field. 
            // Simplest: Update a field. 
            await supabase.from('profiles').update({ updated_at: new Date() }).eq('id', userId);
        } catch (e) {
            console.log('Error updating last seen:', e);
        }
    };

    const handleNewUser = async (newUser) => { // newUser has { name, username, email, password ... }
        setIsLoading(true);
        // 1. Sign Up with Email/Pass
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
            if (error.message.includes('already registered') || error.message.includes('unique constraint')) {
                Alert.alert('Account Exists', 'This email is already registered. Please log in instead.');
            } else {
                Alert.alert('Registration Failed', error.message);
            }
            return false;
        }

        // Regular email/pass flow
        // With 'Status: Active' and 'Email Confirm: Disabled' in Supabase, we get a session immediately.
        if (data.session) {
            // Save for biometric use
            try {
                await SecureStore.setItemAsync('user_credentials', JSON.stringify({ username: newUser.email, password: newUser.password }));
                setBiometricCredentials({ username: newUser.email, password: newUser.password });
            } catch (e) {
                console.log('Error saving credentials', e);
            }
            // Auto-login success
            navigate('home');
        } else if (data.user && !data.session) {
            // Fallback if settings change: Email verification required
            Alert.alert('Verification Sent', 'Please check your email to verify your account.');
        }
        return true;
    };

    const handleCreateManagerAccount = async (newManagerData) => {
        // For now, same flow.
        handleNewUser({ ...newManagerData, role: 'manager' });
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            // Optional: Clear credentials on logout?
            // Usually for biometrics you WANT to keep them. But user might want to clear.
            // Let's ask or just keep them for convenience. 
            // Better security: Clear them on logout.
            try {
                await SecureStore.deleteItemAsync('user_credentials');
                setBiometricCredentials(null);
            } catch (e) {
                console.log('Error deleting credentials', e);
            }
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

    // PASSWORD RESET
    // PASSWORD RESET FLOW
    // PASSWORD RESET FLOW
    const handleForgotPassword = async (contact) => {
        setIsLoading(true);
        // We only support Email for this flow now (Link based)
        if (!contact.includes('@')) {
            Alert.alert('Invalid Input', 'Please enter a valid email address.');
            setIsLoading(false);
            return null;
        }

        // Send Password Reset Link
        const { error } = await supabase.auth.resetPasswordForEmail(contact);

        setIsLoading(false);

        if (error) {
            let msg = error.message;
            if (msg.includes('Signups not allowed')) {
                msg = 'Account not found. Please check your details or register.';
            }
            Alert.alert('Error', msg);
            return null;
        }
        return 'email'; // Return 'email' to signal success
    };

    const handleVerifyOtp = async (contact, token, type) => {
        setIsLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email: type === 'email' ? contact : undefined,
            phone: type === 'sms' ? contact : undefined,
            token,
            type: type === 'email' ? 'email' : 'sms',
        });
        setIsLoading(false);

        if (error) {
            Alert.alert('Invalid Code', error.message);
            return false;
        }
        return true;
    };

    const handleUpdatePassword = async (newPassword) => {
        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        setIsLoading(false);

        if (error) {
            Alert.alert('Update Failed', error.message);
            return false;
        }
        return true;
    };

    // PDF EXPORT HANDLER
    const handleExportPDF = async (dataToExport) => {
        try {
            // Helper to load logo
            let logoBase64 = null;
            try {
                const asset = Asset.fromModule(require('../../assets/splash-icon.png'));
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

            // Generate Filename
            let filename = 'Inspection_Report';
            if (Array.isArray(dataToExport)) {
                const date = new Date().toISOString().split('T')[0];
                filename = `Inspection_Log_${date}`;
            } else if (dataToExport && typeof dataToExport === 'object') {
                const truck = dataToExport.truck || dataToExport.truck_number || 'Unknown_Truck';
                const depot = dataToExport.depot || 'Unknown_Depot';
                // Use created_at if available, else current date
                const dateRaw = dataToExport.created_at || new Date().toISOString();
                const date = dateRaw.split('T')[0];
                filename = `${truck}_${depot}_${date}`;
            }

            // Sanitize filename
            filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');

            // Rename file (Use cacheDirectory for temporary sharing files)
            const newUri = `${FileSystem.cacheDirectory}${filename}.pdf`;

            // Delete old file if it exists (idempotent: true prevents error if file doesn't exist)
            await FileSystem.deleteAsync(newUri, { idempotent: true });

            await FileSystem.moveAsync({
                from: uri,
                to: newUri,
            });

            await Sharing.shareAsync(newUri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Download ${filename}`,
            });
        } catch (error) {
            console.log(error);
            Alert.alert('PDF Error', error.message || 'Generation failed.');
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

    // --- QUALITY DATA HANDLERS ---
    const fetchQualityReports = async () => {
        try {
            const { data, error } = await supabase
                .from('quality_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Error fetching quality reports:', error);
            } else {
                setQualityReports(data.map(item => ({
                    ...item,
                    timestamp: new Date(item.created_at).toLocaleString(),
                })));
            }
        } catch (e) {
            console.log('Quality reports fetch error:', e);
        }
    };

    const handleSaveQualityData = async (qualityData) => {
        try {
            const record = {
                inspector_id: userData.id,
                inspector_name: userData.name || qualityData.inspectorName,
                company_name: qualityData.companyName,
                truck_number: qualityData.truckNo,
                product: qualityData.product,
                depot: qualityData.depot,
                compartments: qualityData.compartments,
                quality_params: qualityData.quality,
                sealer_name: qualityData.sealerName,
                inspector_signature: qualityData.inspectorSignature,
                sealer_signature: qualityData.sealerSignature,
            };

            const { data, error } = await supabase
                .from('quality_reports')
                .insert([record])
                .select();

            if (error) {
                console.log('Error saving quality data:', error);
                Alert.alert('Error', 'Failed to save quality report to database.');
                return false;
            } else {
                // Refresh the list
                fetchQualityReports();
                Alert.alert('Success', 'Quality report saved successfully!');
                return true;
            }
        } catch (e) {
            console.log('Quality save error:', e);
            Alert.alert('Error', 'An error occurred while saving.');
            return false;
        }
    };

    // --- QUALITY REPORT PDF EXPORT ---
    const handleExportQualityPDF = async (report) => {
        try {
            // Company-based theme color (matching inspector's style)
            let themeColor = '#ED7D31';
            if (report.company_name === 'MOREFUEL LTD') {
                themeColor = '#E31E24';
            } else if (report.company_name === 'JP TRUSTEES LTD') {
                themeColor = '#7CB342';
            }

            const headerTitle = `QUALITY DATA - ${(report.company_name || 'UNKNOWN').toUpperCase()}`;
            const randomNum = Math.floor(Math.random() * 99999) + 1;
            const invoiceNumber = String(randomNum).padStart(5, '0');

            // Compartments table rows
            const compartmentsHtml = Array.isArray(report.compartments)
                ? report.compartments.map((c, i) => `
                    <tr>
                        <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                        <td>${c.litres || '-'}</td>
                        <td>${c.cert || '-'}</td>
                        <td>${c.prod || '-'}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="4" style="text-align: center;">No compartment data</td></tr>';

            // Quality parameters
            const q = report.quality_params || {};

            // Signature images
            const inspectorSigImg = report.inspector_signature
                ? `<img src="${report.inspector_signature}" style="height: 50px; width: auto;" />`
                : `<span style="color: #999; font-style: italic;">(Not Signed)</span>`;
            const sealerSigImg = report.sealer_signature
                ? `<img src="${report.sealer_signature}" style="height: 50px; width: auto;" />`
                : `<span style="color: #999; font-style: italic;">(Not Signed)</span>`;

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                        .page { width: 210mm; min-height: 297mm; position: relative; overflow: hidden; box-sizing: border-box; padding: 40px; }
                        .header { border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .header-title { font-size: 28px; font-weight: bold; color: ${themeColor}; text-transform: uppercase; }
                        .header-meta { text-align: right; font-size: 12px; color: #666; }
                        .section-title { background-color: ${themeColor}; color: white; padding: 8px 15px; font-size: 16px; font-weight: bold; border-radius: 4px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px; }
                        th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; }
                        td { border: 1px solid #ddd; padding: 8px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .col { flex: 1; margin-right: 15px; }
                        .col:last-child { margin-right: 0; }
                        .key-value-box { background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 5px; }
                        .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
                        .value { font-size: 14px; font-weight: bold; color: #000; margin-top: 3px; }
                        .footer-box { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fcfcfc; }
                        .sig-block { margin-top: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; min-height: 40px; }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="header">
                            <div class="header-title">${headerTitle}</div>
                            <div class="header-meta">
                                <span style="font-size: 12px; font-weight: bold; color: #000; display: block; margin-bottom: 2px;">INVOICE #: ${invoiceNumber}</span>
                                Generated: ${new Date(report.created_at).toLocaleDateString()}<br/>Status: Final
                            </div>
                        </div>

                        <div class="section-title">Truck Information</div>
                        <div class="row">
                            <div class="col key-value-box"><div class="label">Truck Number</div><div class="value">${report.truck_number || '-'}</div></div>
                            <div class="col key-value-box"><div class="label">Product</div><div class="value">${report.product || '-'}</div></div>
                            <div class="col key-value-box"><div class="label">Depot</div><div class="value">${report.depot || '-'}</div></div>
                        </div>

                        <div class="section-title">Compartment Levels</div>
                        <table>
                            <thead><tr><th style="width: 10%">Number</th><th>Litres</th><th>Certificate Level</th><th>Product Level</th></tr></thead>
                            <tbody>${compartmentsHtml}</tbody>
                        </table>

                        <div class="section-title">Product Quality Parameters</div>
                        <div class="row">
                            <div class="col">
                                <div class="key-value-box"><div class="label">Density</div><div class="value">${q.density || '-'} kg/m³</div></div>
                                <div class="key-value-box"><div class="label">Temperature</div><div class="value">${q.temp || '-'} °C</div></div>
                                <div class="key-value-box"><div class="label">Water Status</div><div class="value">${q.water || '-'}</div></div>
                            </div>
                            <div class="col">
                                <div class="key-value-box"><div class="label">Diff Comp Level</div><div class="value">${q.diffComp || '-'} Lts</div></div>
                                <div class="key-value-box"><div class="label">Additive</div><div class="value">${q.additive || '-'} Lts</div></div>
                                <div class="key-value-box"><div class="label">Product Color</div><div class="value">${q.color || '-'}</div></div>
                            </div>
                        </div>

                        <div class="footer-box">
                            <div class="section-title" style="margin-top: 0; font-size: 14px;">Authorization</div>
                            <div class="row">
                                <div class="col"><div class="label">Inspector Name</div><div class="value">${report.inspector_name || '_________________'}</div><div style="margin-top: 15px;" class="label">Inspector Signature</div><div class="sig-block">${inspectorSigImg}</div></div>
                                <div class="col"><div class="label">Sealer Name</div><div class="value">${report.sealer_name || '_________________'}</div><div style="margin-top: 15px;" class="label">Sealer Signature</div><div class="sig-block">${sealerSigImg}</div></div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            // Generate filename
            const sanitize = (text) => (text || 'N-A').replace(/[^a-zA-Z0-9_-]/g, '_');
            const dateStr = new Date(report.created_at).toISOString().split('T')[0];
            const filename = `Quality_${sanitize(report.truck_number)}_${sanitize(report.depot)}_${dateStr}.pdf`;

            const newUri = `${FileSystem.cacheDirectory}${filename}`;
            await FileSystem.deleteAsync(newUri, { idempotent: true });
            await FileSystem.moveAsync({ from: uri, to: newUri });

            await Sharing.shareAsync(newUri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Download ${filename}`,
            });
        } catch (error) {
            console.log('Quality PDF export error:', error);
            Alert.alert('Export Error', error.message || 'Failed to export quality report.');
        }
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
        handleLogout,
        handleForgotPassword, // Export logic
        handleVerifyOtp,
        handleUpdatePassword,
        fetchHistory,
        // Quality Data
        qualityReports,
        fetchQualityReports,
        handleSaveQualityData,
        handleExportQualityPDF,
    };
};
