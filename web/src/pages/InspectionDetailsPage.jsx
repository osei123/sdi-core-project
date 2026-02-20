import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, Truck, Building2, MapPin, Download } from 'lucide-react';
import { generateInspectionPDF } from '../utils/generatePDF';

const InspectionDetailsPage = ({ appLogic }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const item = appLogic.historyData.find((h) => h.id === id);

    if (!item) {
        return (
            <div>
                <div className="page-header">
                    <button className="modal-close" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area"><h1>Not Found</h1></div>
                </div>
                <div className="empty-state" style={{ marginTop: 60 }}>
                    <p className="text">Inspection record not found.</p>
                </div>
            </div>
        );
    }

    const results = item.results || [];
    const passes = results.filter((r) => r.status === 'PASS');
    const fails = results.filter((r) => r.status === 'FAIL');

    const getStatusColor = (status) => {
        if (status === 'GROUNDED') return '#dc2626';
        if (status === 'MONITOR') return '#facc15';
        return '#22c55e';
    };

    return (
        <div className="details-page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">INSPECTION REPORT</p>
                        <h1>{item.truck}</h1>
                    </div>
                </div>
                <button
                    className="btn-secondary"
                    onClick={() => generateInspectionPDF(item)}
                    style={{ height: 40, padding: '0 16px', fontSize: 12 }}
                >
                    <Download size={14} /> PDF
                </button>
            </div>

            {/* Status Banner */}
            <div className="detail-header">
                <div
                    className="summary-ring"
                    style={{
                        borderColor: getStatusColor(item.status),
                        color: getStatusColor(item.status),
                        margin: '0 auto 16px',
                        width: 80,
                        height: 80,
                    }}
                >
                    {item.status === 'GROUNDED' ? <XCircle size={36} /> :
                        item.status === 'MONITOR' ? <AlertTriangle size={36} /> :
                            <CheckCircle size={36} />}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getStatusColor(item.status), marginBottom: 4 }}>
                    {item.status === 'GROUNDED' ? 'GROUNDED (UNSAFE)' :
                        item.status === 'MONITOR' ? 'SAFE TO DRIVE (MONITOR)' : 'OPERATIONAL'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.timestamp}</div>
            </div>

            {/* Info */}
            <div style={{ padding: '20px 24px' }}>
                <div className="section-title">DETAILS</div>
                <div className="summary-card" style={{ maxWidth: '100%' }}>
                    <div className="summary-row">
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={14} /> Driver
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.driver}</span>
                    </div>
                    <div className="summary-row">
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Truck size={14} /> Truck
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.truck}</span>
                    </div>
                    {item.transporter && (
                        <div className="summary-row">
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={14} /> Transporter
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.transporter}</span>
                        </div>
                    )}
                    {item.depot && (
                        <div className="summary-row">
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={14} /> Depot
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.depot}</span>
                        </div>
                    )}
                    <div className="summary-row" style={{ borderBottom: 'none' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Inspector</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.inspectorName || 'N/A'}</span>
                    </div>
                </div>

                {/* Checklist Results */}
                <div className="section-title" style={{ marginTop: 24 }}>
                    CHECKLIST ({passes.length} PASS / {fails.length} FAIL)
                </div>
                {results.map((r, idx) => (
                    <div key={idx} className="detail-item">
                        <div
                            className="item-status"
                            style={{
                                background: r.status === 'PASS' ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.15)',
                            }}
                        >
                            {r.status === 'PASS' ? (
                                <CheckCircle size={18} color="#22c55e" />
                            ) : (
                                <XCircle size={18} color="#dc2626" />
                            )}
                        </div>
                        <div className="item-info">
                            <div className="item-title">{r.title}</div>
                            <div className="item-desc">{r.desc}</div>
                            {r.severity && (
                                <span
                                    className={`badge ${r.severity === 'CRITICAL' ? 'badge-red' :
                                        r.severity === 'MODERATE' ? 'badge-yellow' : 'badge-blue'
                                        }`}
                                    style={{ marginTop: 6 }}
                                >
                                    {r.severity}
                                </span>
                            )}
                            {r.note && (
                                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Note: {r.note}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InspectionDetailsPage;
