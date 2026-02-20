import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BarChart3,
    Users,
    Truck,
    CheckCircle,
    XCircle,
    AlertTriangle,
    TrendingUp,
    Award,
    X,
    UserPlus,
    Mail,
    Lock,
    User as UserIcon,
    Shield,
    Droplets,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';

const ManagerDashboard = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { colors } = useTheme();
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showQualityDetail, setShowQualityDetail] = useState(null);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'inspector' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [filter, setFilter] = useState('all');

    const { historyData, allUsers, qualityReports, fetchHistory, fetchAllUsers, fetchQualityReports } = appLogic;

    // ─── Metrics ───
    const totalInspections = historyData.length;
    const passCount = historyData.filter((h) => h.status === 'OPERATIONAL').length;
    const failCount = historyData.filter((h) => h.status === 'GROUNDED').length;
    const monitorCount = historyData.filter((h) => h.status === 'MONITOR').length;
    const inspectors = allUsers.filter((u) => u.role === 'inspector');
    const passRate = totalInspections > 0 ? Math.round((passCount / totalInspections) * 100) : 0;

    // ─── 7-Day trend ───
    const weekData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
            const count = historyData.filter((h) => {
                const hDate = new Date(h.timestamp).toLocaleDateString();
                return hDate === dateStr;
            }).length;
            days.push({ label: dayLabel, count });
        }
        return days;
    }, [historyData]);

    const maxCount = Math.max(...weekData.map((d) => d.count), 1);

    // ─── Ranked inspectors ───
    const rankedInspectors = useMemo(() => {
        const map = {};
        historyData.forEach((h) => {
            const name = h.inspectorName || 'Unknown';
            map[name] = (map[name] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [historyData]);

    // ─── Filtered feed ───
    const filteredHistory = useMemo(() => {
        if (filter === 'all') return historyData.slice(0, 20);
        return historyData.filter((h) => h.status === filter.toUpperCase()).slice(0, 20);
    }, [historyData, filter]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!regForm.name || !regForm.email || !regForm.password) {
            toast('All fields are required', 'error');
            return;
        }
        setIsRegistering(true);
        try {
            await appLogic.registerUser(regForm.email, regForm.password, regForm.name, regForm.role);
            toast(`${regForm.role} registered!`, 'success');
            setShowRegisterForm(false);
            setRegForm({ name: '', email: '', password: '', role: 'inspector' });
        } catch (err) {
            toast(err.message || 'Registration failed', 'error');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleRefresh = () => {
        fetchHistory();
        fetchAllUsers();
        fetchQualityReports();
        toast('Dashboard refreshed', 'info');
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate('/home')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">FLEET OVERVIEW</p>
                        <h1>Manager Dashboard</h1>
                    </div>
                </div>
                <button className="modal-close" onClick={handleRefresh}>
                    <RefreshCw size={16} />
                </button>
            </div>

            <div style={{ padding: 24 }}>
                {/* Metrics Grid */}
                <div className="metrics-grid">
                    <div className="stat-box" style={{ borderLeftColor: '#2563eb' }}>
                        <div className="stat-label">Total Inspections</div>
                        <div className="stat-value">{totalInspections}</div>
                    </div>
                    <div className="stat-box" style={{ borderLeftColor: '#22c55e' }}>
                        <div className="stat-label">Pass Rate</div>
                        <div className="stat-value" style={{ color: '#22c55e' }}>{passRate}%</div>
                    </div>
                    <div className="stat-box" style={{ borderLeftColor: '#facc15' }}>
                        <div className="stat-label">Active Fleet</div>
                        <div className="stat-value">{new Set(historyData.map((h) => h.truck)).size}</div>
                    </div>
                    <div className="stat-box" style={{ borderLeftColor: '#0f766e' }}>
                        <div className="stat-label">Inspectors</div>
                        <div className="stat-value">{inspectors.length}</div>
                    </div>
                </div>

                {/* 7-Day Trend */}
                <div className="chart-section">
                    <div className="chart-title">
                        <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        7-DAY ACTIVITY TREND
                    </div>
                    <div className="bar-chart">
                        {weekData.map((d, i) => (
                            <div
                                key={i}
                                className="bar"
                                style={{
                                    height: `${(d.count / maxCount) * 100}%`,
                                    minHeight: d.count > 0 ? 8 : 2,
                                    background: d.count > 0
                                        ? 'linear-gradient(180deg, #22c55e, #0f766e)'
                                        : 'var(--border)',
                                }}
                                title={`${d.label}: ${d.count}`}
                            >
                                <span className="bar-label">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pass/Fail Ratio */}
                <div className="chart-section">
                    <div className="chart-title">PASS / FAIL RATIO</div>
                    <div className="ratio-bar" style={{ marginBottom: 12 }}>
                        <div className="pass" style={{ width: `${passRate}%` }} />
                        <div className="fail" style={{ width: `${100 - passRate}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#22c55e' }}>Pass: {passCount}</span>
                        <span style={{ color: '#facc15' }}>Monitor: {monitorCount}</span>
                        <span style={{ color: '#dc2626' }}>Fail: {failCount}</span>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="chart-section">
                    <div className="chart-title">
                        <Award size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        TOP PERFORMERS
                    </div>
                    {rankedInspectors.length === 0 ? (
                        <div className="empty-state" style={{ padding: 20 }}>
                            <p className="text">No data yet</p>
                        </div>
                    ) : (
                        rankedInspectors.map((inspector, i) => (
                            <div key={i} className="leaderboard-item">
                                <div
                                    className="leaderboard-rank"
                                    style={{
                                        background: i === 0 ? 'rgba(250,204,21,0.15)' :
                                            i === 1 ? 'rgba(156,163,175,0.15)' :
                                                i === 2 ? 'rgba(180,83,9,0.15)' : 'var(--bg-tertiary)',
                                        color: i === 0 ? '#facc15' :
                                            i === 1 ? '#9ca3af' :
                                                i === 2 ? '#b45309' : 'var(--text-muted)',
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <div className="info">
                                    <div className="name">{inspector.name}</div>
                                    <div className="count">{inspector.count} inspections</div>
                                </div>
                                <div className="score">{inspector.count}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Team Management */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setShowTeamModal(true)}
                        style={{ flex: 1 }}
                    >
                        <Users size={16} /> Manage Team
                    </button>
                </div>

                {/* Live Feed */}
                <div className="section-title">INSPECTION FEED</div>
                <div className="filter-bar">
                    {['all', 'operational', 'monitor', 'grounded'].map((f) => (
                        <button
                            key={f}
                            className={`filter-chip ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                {filteredHistory.map((item) => (
                    <div
                        key={item.id}
                        className="fleet-row"
                        style={{
                            borderLeftColor:
                                item.status === 'GROUNDED' ? '#dc2626' :
                                    item.status === 'MONITOR' ? '#facc15' : '#22c55e',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/details/${item.id}`)}
                    >
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.truck}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {item.driver} • {item.timestamp}
                            </div>
                        </div>
                        <span className={`badge ${item.status === 'GROUNDED' ? 'badge-red' :
                                item.status === 'MONITOR' ? 'badge-yellow' : 'badge-green'
                            }`}>
                            {item.status}
                        </span>
                    </div>
                ))}

                {/* Quality Reports */}
                {qualityReports.length > 0 && (
                    <>
                        <div className="section-title" style={{ marginTop: 32 }}>
                            <Droplets size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            QUALITY REPORTS
                        </div>
                        {qualityReports.slice(0, 10).map((report) => (
                            <div
                                key={report.id}
                                className="quality-item"
                                onClick={() => setShowQualityDetail(report)}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                                        {report.truck_number}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {report.product} • {new Date(report.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Team Modal */}
            {showTeamModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h2>Team Management</h2>
                            <button className="modal-close" onClick={() => { setShowTeamModal(false); setShowRegisterForm(false); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {!showRegisterForm ? (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowRegisterForm(true)}
                                    style={{ marginBottom: 20 }}
                                >
                                    <UserPlus size={16} /> REGISTER NEW INSPECTOR/MANAGER
                                </button>

                                <div className="section-title">TEAM MEMBERS ({allUsers.length})</div>
                                {allUsers.map((user) => (
                                    <div key={user.id} className="leaderboard-item">
                                        <div
                                            className="leaderboard-rank"
                                            style={{
                                                background: user.role === 'manager'
                                                    ? 'rgba(37,99,235,0.15)'
                                                    : 'rgba(15,118,110,0.15)',
                                                color: user.role === 'manager' ? '#2563eb' : '#0f766e',
                                            }}
                                        >
                                            {user.role === 'manager' ? <Shield size={14} /> : <UserIcon size={14} />}
                                        </div>
                                        <div className="info">
                                            <div className="name">{user.full_name || 'Unnamed'}</div>
                                            <div className="count">{user.role}</div>
                                        </div>
                                        <button
                                            className="btn-ghost"
                                            onClick={async () => {
                                                try {
                                                    await appLogic.sendPasswordReset(user.email || '');
                                                    toast('Password reset sent', 'success');
                                                } catch (err) {
                                                    toast('Failed to send reset', 'error');
                                                }
                                            }}
                                            style={{ fontSize: 10 }}
                                        >
                                            Reset PW
                                        </button>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <div className="form-input">
                                        <UserIcon size={16} className="icon" />
                                        <input
                                            type="text"
                                            placeholder="Full name"
                                            value={regForm.name}
                                            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <div className="form-input">
                                        <Mail size={16} className="icon" />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            value={regForm.email}
                                            onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <div className="form-input">
                                        <Lock size={16} className="icon" />
                                        <input
                                            type="password"
                                            placeholder="Temp password"
                                            value={regForm.password}
                                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <div className="form-input">
                                        <select
                                            value={regForm.role}
                                            onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                                            style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)' }}
                                        >
                                            <option value="inspector">Inspector</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setShowRegisterForm(false)}
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isRegistering} style={{ flex: 1 }}>
                                        {isRegistering ? <div className="spinner" /> : 'Register'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Quality Detail Modal */}
            {showQualityDetail && (
                <div className="modal-overlay modal-center">
                    <div className="modal-content" style={{ maxWidth: 440 }}>
                        <div className="modal-header">
                            <h2>Quality Report</h2>
                            <button className="modal-close" onClick={() => setShowQualityDetail(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="summary-card" style={{ maxWidth: '100%' }}>
                            <div className="summary-row">
                                <span style={{ color: 'var(--text-muted)' }}>Truck</span>
                                <span style={{ fontWeight: 600 }}>{showQualityDetail.truck_number}</span>
                            </div>
                            <div className="summary-row">
                                <span style={{ color: 'var(--text-muted)' }}>Product</span>
                                <span style={{ fontWeight: 600 }}>{showQualityDetail.product}</span>
                            </div>
                            <div className="summary-row">
                                <span style={{ color: 'var(--text-muted)' }}>Inspector</span>
                                <span style={{ fontWeight: 600 }}>{showQualityDetail.inspector_name}</span>
                            </div>
                            <div className="summary-row" style={{ borderBottom: 'none' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                                <span style={{ fontWeight: 600 }}>
                                    {new Date(showQualityDetail.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        {showQualityDetail.compartments && (
                            <>
                                <div className="section-title">COMPARTMENTS</div>
                                {showQualityDetail.compartments.map((c, i) => (
                                    <div key={i} className="compartment-card" style={{ padding: 14 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                                            Compartment {c.number}
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                            <span>Density: <strong style={{ color: 'var(--text-primary)' }}>{c.density || '—'}</strong></span>
                                            <span>Temp: <strong style={{ color: 'var(--text-primary)' }}>{c.temperature || '—'}°C</strong></span>
                                            <span>Vol: <strong style={{ color: 'var(--text-primary)' }}>{c.volume || '—'}L</strong></span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
