import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Send } from 'lucide-react';
import { useToast } from '../components/Toast';

const ForgotPasswordPage = ({ appLogic }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleReset = async (e) => {
        e.preventDefault();
        if (!email) {
            toast('Please enter your email', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await appLogic.resetPassword(email);
            toast('Password reset link sent to your email', 'success');
            setSent(true);
        } catch (err) {
            toast(err.message || 'Failed to send reset email', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo-area">
                    <div className="logo-icon">
                        <KeyRound size={32} color="#99f6e4" />
                    </div>
                    <h1>Reset Password</h1>
                    <p className="subtitle">
                        {sent
                            ? 'Check your email for the reset link'
                            : "Enter your email and we'll send a reset link"}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleReset}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="icon" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    SEND RESET LINK
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'rgba(34,197,94,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}
                        >
                            <Mail size={28} color="#22c55e" />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                            We've sent a password reset link to <strong>{email}</strong>. Click the
                            link in the email to set a new password.
                        </p>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setSent(false);
                                setEmail('');
                            }}
                        >
                            Send Again
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <button onClick={() => navigate('/')}>
                        <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
