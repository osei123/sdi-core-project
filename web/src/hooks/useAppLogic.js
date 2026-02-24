import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CHECKLIST_DATA } from '../data/checklistData';

export const useAppLogic = () => {
    // ─── Auth State ───
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState('inspector');

    // ─── App State ───
    const [historyData, setHistoryData] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [qualityReports, setQualityReports] = useState([]);

    // ─── Inspection State ───
    const [preInspectionData, setPreInspectionData] = useState(null);
    const [inspectionResults, setInspectionResults] = useState([]);

    // ─── Init: auth listener ───
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setRole('inspector');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // ─── Fetch profile ───
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            setProfile(data);
            setRole(data.role || 'inspector');
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    // ─── Fetch history ───
    const fetchHistory = useCallback(async () => {
        if (!session) return;
        try {
            let query = supabase
                .from('inspections')
                .select('*')
                .order('created_at', { ascending: false });

            if (role !== 'manager') {
                query = query.eq('inspector_id', session.user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setHistoryData(
                (data || []).map((item) => ({
                    id: item.id,
                    truck: item.truck_number || 'Unknown',
                    driver: item.driver_name || 'Unknown',
                    transporter: item.transporter || '',
                    depot: item.depot || '',
                    timestamp: new Date(item.created_at).toLocaleString(),
                    status: item.status,
                    results: item.items || [],
                    driverSignature: item.driver_signature,
                    inspectorSignature: item.inspector_signature,
                    inspectorName: item.inspector_name,
                }))
            );
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    }, [session, role]);

    // ─── Fetch all users ───
    const fetchAllUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            setAllUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    }, []);

    // ─── Fetch quality reports ───
    const fetchQualityReports = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('quality_reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setQualityReports(data || []);
        } catch (err) {
            console.error('Error fetching quality reports:', err);
        }
    }, []);

    // ─── Load data on session ───
    useEffect(() => {
        if (session) {
            fetchHistory();
            fetchAllUsers();
            fetchQualityReports();
        }
    }, [session, fetchHistory, fetchAllUsers, fetchQualityReports]);

    // ─── Auth methods ───
    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signup = async (email, password, fullName, username, role) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        if (error) throw error;
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ role: role || 'inspector', full_name: fullName, username })
                .eq('id', data.user.id);
        }
        return data;
    };

    const verifyOtp = async (email, otp) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup',
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setHistoryData([]);
    };

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    // ─── Profile methods ───
    const updateProfile = async (updates) => {
        if (!session) return;
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);
        if (error) throw error;
        await fetchProfile(session.user.id);
    };

    // ─── Inspection methods ───
    const saveInspection = async (results, driverSig, inspectorSig) => {
        if (!session || !preInspectionData) return;
        const critical = results.filter((r) => r.severity === 'CRITICAL').length;
        const issues = results.filter((r) => r.status === 'FAIL').length;
        let status = 'OPERATIONAL';
        if (critical > 0) status = 'GROUNDED';
        else if (issues > 0) status = 'MONITOR';

        const { error } = await supabase.from('inspections').insert({
            inspector_id: session.user.id,
            inspector_name: profile?.full_name || 'Inspector',
            driver_name: preInspectionData.driverName,
            truck_number: preInspectionData.truckNumber,
            transporter: preInspectionData.transporter,
            depot: preInspectionData.depot,
            status,
            items: results,
            driver_signature: driverSig,
            inspector_signature: inspectorSig,
        });
        if (error) throw error;
        await fetchHistory();
    };

    const deleteInspection = async (id) => {
        const { error } = await supabase.from('inspections').delete().eq('id', id);
        if (error) throw error;
        await fetchHistory();
    };

    // ─── Quality report methods ───
    const saveQualityReport = async (reportData) => {
        if (!session) return;
        const { error } = await supabase.from('quality_reports').insert({
            ...reportData,
            inspector_id: session.user.id,
            inspector_name: profile?.full_name || 'Inspector',
        });
        if (error) throw error;
        await fetchQualityReports();
    };

    // ─── Delete account ───
    const deleteAccount = async () => {
        if (!session) return;
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { userId: session.user.id },
        });
        if (error) throw error;
        await logout();
    };

    // ─── Register new user (manager only) ───
    const registerUser = async (email, password, fullName, userRole) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ role: userRole, full_name: fullName })
                .eq('id', data.user.id);
        }
        await fetchAllUsers();
    };

    // ─── Send password reset (manager) ───
    const sendPasswordReset = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    };

    return {
        // Auth
        session,
        loading,
        profile,
        role,
        login,
        signup,
        verifyOtp,
        logout,
        resetPassword,
        updatePassword,

        // Profile
        updateProfile,

        // Data
        historyData,
        allUsers,
        qualityReports,
        fetchHistory,
        fetchAllUsers,
        fetchQualityReports,

        // Inspection
        checklistData: CHECKLIST_DATA,
        preInspectionData,
        setPreInspectionData,
        inspectionResults,
        setInspectionResults,
        saveInspection,
        deleteInspection,

        // Quality
        saveQualityReport,

        // Account
        deleteAccount,
        registerUser,
        sendPasswordReset,
    };
};
