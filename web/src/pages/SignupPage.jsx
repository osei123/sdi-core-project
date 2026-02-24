import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Hash, UserPlus, Shield, ClipboardCheck, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const SignupPage = ({ appLogic }) => {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        staffId: '',
        role: 'inspector',
    });
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.username || !form.email || !form.password) {
            toast('Please fill in all required fields', 'error');
            return;
        }
        if (form.password.length < 6) {
            toast('Password must be at least 6 characters', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await appLogic.signup(form.email, form.password, form.fullName, form.username, form.staffId, form.role);
            setSubmitted(true);
        } catch (err) {
            toast(err.message || 'Signup failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: '1px solid rgba(34,197,94,0.3)',
                    }}>
                        <CheckCircle size={36} color="#22c55e" />
                    </div>
                    <h1 style={{ fontSize: 24, marginBottom: 8 }}>Check Your Email</h1>
                    <p className="subtitle" style={{ marginBottom: 8, lineHeight: 1.6 }}>
                        We've sent a confirmation link to
                    </p>
                    <p style={{ color: '#99f6e4', fontWeight: 600, fontSize: 15, marginBottom: 20 }}>
                        {form.email}
                    </p>
                    <p className="subtitle" style={{ lineHeight: 1.6, marginBottom: 28 }}>
                        Click the link in your email to verify your account, then come back and sign in.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/')}
                    >
                        <Mail size={18} />
                        GO TO LOGIN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo-area" style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 32, marginBottom: 4 }}>Create Account</h1>
                    <p className="subtitle">Join the Smart Digital Inspection Core</p>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <div className="input-wrapper">
                            <User size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="Enter Fullname"
                                value={form.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username *</label>
                        <div className="input-wrapper">
                            <User size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="enter username"
                                value={form.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Staff ID (Optional)</label>
                        <div className="input-wrapper">
                            <Hash size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="Badge #000"
                                value={form.staffId}
                                onChange={(e) => handleChange('staffId', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address *</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="icon" />
                            <input
                                type="email"
                                placeholder="email@company.com"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Set Password *</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Min 6 characters"
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                autoComplete="new-password"
                            />
                            <button type="button" className="toggle-btn" onClick={() => setShowPw(!showPw)}>
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Account Type</label>
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${form.role === 'inspector' ? 'active' : ''}`}
                                onClick={() => handleChange('role', 'inspector')}
                            >
                                <ClipboardCheck size={18} />
                                Inspector
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${form.role === 'manager' ? 'active' : ''}`}
                                onClick={() => handleChange('role', 'manager')}
                            >
                                <Shield size={18} />
                                Manager
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 8 }}>
                        {isLoading ? (
                            <div className="spinner" />
                        ) : (
                            <>
                                <UserPlus size={18} />
                                REGISTER ACCOUNT
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/')}>Sign In</button>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
