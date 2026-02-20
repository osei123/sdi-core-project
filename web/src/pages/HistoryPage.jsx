import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Clock, FileText, Calendar, X, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import { generateInspectionPDF, generateBulkExportPDF } from '../utils/generatePDF';

const HistoryPage = ({ appLogic }) => {
    const { colors } = useTheme();
    const navigate = useNavigate();
    const toast = useToast();
    const [showExportModal, setShowExportModal] = useState(false);

    const data = appLogic.historyData;

    const getStatusColor = (status) => {
        if (status === 'GROUNDED') return '#dc2626';
        if (status === 'MONITOR') return '#facc15';
        return '#22c55e';
    };

    const getStatusText = (status) => {
        if (status === 'GROUNDED') return 'UNSAFE - GROUNDED';
        if (status === 'MONITOR') return 'SAFE - MONITOR';
        return 'CLEAN - OPERATIONAL';
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this inspection record?')) {
            try {
                await appLogic.deleteInspection(id);
                toast('Inspection deleted', 'info');
            } catch (err) {
                toast(err.message || 'Failed to delete', 'error');
            }
        }
    };

    const handleExportAll = () => {
        setShowExportModal(false);
        generateBulkExportPDF(data);
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate('/home')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">INSPECTION LOGS</p>
                        <h1>All Activity</h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowExportModal(true)}
                    style={{
                        background: 'rgba(37,99,235,0.1)',
                        border: '1px solid rgba(37,99,235,0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 10,
                        cursor: 'pointer',
                        color: '#2563eb',
                    }}
                >
                    <Download size={20} />
                </button>
            </div>

            <div style={{ padding: 24 }}>
                {data.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} className="icon" />
                        <p className="text">No inspections recorded yet.</p>
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={item.id} className="history-item">
                            <div
                                className="info"
                                onClick={() => navigate(`/details/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="truck">{item.truck}</div>
                                <div className="date">{item.timestamp}</div>
                                <div className="status-text" style={{ color: getStatusColor(item.status) }}>
                                    {getStatusText(item.status)}
                                </div>
                            </div>
                            <div className="actions">
                                <button
                                    className="action-btn"
                                    title="Download PDF"
                                    onClick={(e) => { e.stopPropagation(); generateInspectionPDF(item); }}
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() => navigate(`/details/${item.id}`)}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 420, maxHeight: 'auto' }}>
                        <div className="modal-header">
                            <h2>EXPORT OPTIONS</h2>
                            <button className="modal-close" onClick={() => setShowExportModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                            Select export format:
                        </p>
                        <button
                            onClick={handleExportAll}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                padding: 20,
                                background: '#2563eb',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                                    Download Full Log
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                    All dates combined
                                </div>
                            </div>
                            <FileText size={24} color="#fff" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
