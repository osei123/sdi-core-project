import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAppLogic } from '../hooks/useAppLogic';

const LoginPage = ({ appLogic }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast('Please fill in all fields', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await appLogic.login(email, password);
            toast('Welcome back!', 'success');
            navigate('/home');
        } catch (err) {
            toast(err.message || 'Login failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo-area">
                    <div className="logo-icon">
                        <Shield size={32} color="#99f6e4" />
                    </div>
                    <h1>SDI Core</h1>
                    <p className="subtitle">Fleet Safety Inspection Platform</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="icon" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="toggle-btn"
                                onClick={() => setShowPw(!showPw)}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: 20 }}>
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? (
                            <div className="spinner" />
                        ) : (
                            <>
                                <LogIn size={18} />
                                SECURE LOGIN
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/signup')}>Create Account</button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
