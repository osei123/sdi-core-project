import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Hash, ArrowLeft, UserPlus, Shield, ClipboardCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

const SignupPage = ({ appLogic }) => {
    const [step, setStep] = useState(1); // 1 = form, 2 = otp
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        staffId: '',
        role: 'inspector',
    });
    const [showPw, setShowPw] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef([]);
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
            toast('Verification code sent to your email', 'success');
            setStep(2);
        } catch (err) {
            toast(err.message || 'Signup failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[value.length - 1];
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            toast('Please enter the full verification code', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await appLogic.verifyOtp(form.email, code);
            toast('Account verified! Redirecting...', 'success');
            setTimeout(() => navigate('/home'), 1000);
        } catch (err) {
            toast(err.message || 'Verification failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="logo-area">
                        <div className="logo-icon">
                            <Mail size={32} color="#99f6e4" />
                        </div>
                        <h1>Verify Email</h1>
                        <p className="subtitle">Enter the 6-digit code sent to {form.email}</p>
                    </div>

                    <form onSubmit={handleVerify}>
                        <div className="otp-inputs">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? <div className="spinner" /> : 'VERIFY ACCOUNT'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <button onClick={() => setStep(1)}>
                            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Back to signup
                        </button>
                    </div>
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
