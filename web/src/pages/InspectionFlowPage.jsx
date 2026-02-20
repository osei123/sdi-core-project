import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertTriangle,
    X,
    Upload,
    Zap,
    ChevronRight,
} from 'lucide-react';
import { useToast } from '../components/Toast';

const InspectionFlowPage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const data = appLogic.checklistData;

    const [step, setStep] = useState(0);
    const [responses, setResponses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [defectDesc, setDefectDesc] = useState('');
    const [defectImage, setDefectImage] = useState(null);
    const [selectedSeverity, setSelectedSeverity] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const fileInputRef = useRef(null);

    const currentItem = data[step];
    const progress = ((step) / data.length) * 100;

    const handlePass = () => {
        const response = {
            id: currentItem.id,
            title: currentItem.title,
            category: currentItem.category,
            desc: currentItem.desc,
            status: 'PASS',
            severity: null,
            note: '',
        };
        const updated = [...responses, response];
        setResponses(updated);
        if (step + 1 < data.length) {
            setStep(step + 1);
        } else {
            appLogic.setInspectionResults(updated);
            navigate('/summary');
        }
    };

    const handleFail = () => {
        setShowModal(true);
        setDefectDesc('');
        setDefectImage(null);
        setSelectedSeverity(null);
        setAiAnalysis(null);
    };

    const handleSubmitDefect = () => {
        if (!selectedSeverity) {
            toast('Please select a severity level', 'error');
            return;
        }
        const response = {
            id: currentItem.id,
            title: currentItem.title,
            category: currentItem.category,
            desc: currentItem.desc,
            status: 'FAIL',
            severity: selectedSeverity,
            note: defectDesc,
            image: defectImage,
        };
        const updated = [...responses, response];
        setResponses(updated);
        setShowModal(false);
        if (step + 1 < data.length) {
            setStep(step + 1);
        } else {
            appLogic.setInspectionResults(updated);
            navigate('/summary');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setDefectImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const runAiAnalysis = async () => {
        if (!defectDesc) {
            toast('Enter a defect description first', 'error');
            return;
        }
        setAiLoading(true);
        // Simulate AI analysis
        setTimeout(() => {
            const severityMap = {
                'leak': 'CRITICAL',
                'crack': 'CRITICAL',
                'broken': 'CRITICAL',
                'missing': 'MODERATE',
                'worn': 'MODERATE',
                'dirty': 'MINOR',
                'scratch': 'MINOR',
            };
            let suggested = 'MODERATE';
            for (const [keyword, severity] of Object.entries(severityMap)) {
                if (defectDesc.toLowerCase().includes(keyword)) {
                    suggested = severity;
                    break;
                }
            }
            setAiAnalysis({
                severity: suggested,
                confidence: Math.floor(Math.random() * 20 + 75) + '%',
                suggestion: `Based on the description, this appears to be a ${suggested.toLowerCase()} defect. ${suggested === 'CRITICAL'
                        ? 'Vehicle should not operate until repaired.'
                        : suggested === 'MODERATE'
                            ? 'Schedule repair within 48 hours.'
                            : 'Monitor and address in next scheduled maintenance.'
                    }`,
            });
            setAiLoading(false);
        }, 1500);
    };

    const severityOptions = [
        {
            key: 'CRITICAL',
            label: 'Critical',
            desc: 'Vehicle must be grounded',
            color: '#dc2626',
            bg: 'rgba(220,38,38,0.15)',
            icon: XCircle,
        },
        {
            key: 'MODERATE',
            label: 'Moderate',
            desc: 'Safe to drive, needs repair',
            color: '#facc15',
            bg: 'rgba(250,204,21,0.15)',
            icon: AlertTriangle,
        },
        {
            key: 'MINOR',
            label: 'Minor',
            desc: 'Note for next maintenance',
            color: '#2563eb',
            bg: 'rgba(37,99,235,0.15)',
            icon: CheckCircle,
        },
    ];

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel this inspection? All progress will be lost.')) {
            navigate('/home');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={handleCancel}>
                        <X size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">STEP {step + 1} OF {data.length}</p>
                        <h1>Inspection</h1>
                    </div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {Math.round(progress)}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="inspection-card" style={{ width: '100%', maxWidth: 500 }}>
                    <div className="category">{currentItem.category}</div>
                    <div className="title">{currentItem.title}</div>
                    <div className="desc">{currentItem.desc}</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-row" style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
                <button className="action-btn-pass" onClick={handlePass}>
                    <CheckCircle size={20} /> PASS
                </button>
                <button className="action-btn-fail" onClick={handleFail}>
                    <XCircle size={20} /> FAIL
                </button>
            </div>

            {/* Defect Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Report Defect</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* AI Analysis */}
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            padding: 16,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(37,99,235,0.2)',
                            marginBottom: 20,
                        }}>
                            <textarea
                                className="defect-textarea"
                                placeholder="Describe the defect..."
                                value={defectDesc}
                                onChange={(e) => setDefectDesc(e.target.value)}
                                rows={3}
                            />
                            <button
                                className="btn-secondary"
                                onClick={runAiAnalysis}
                                disabled={aiLoading}
                                style={{ marginTop: 10, height: 40, fontSize: 12 }}
                            >
                                {aiLoading ? <div className="spinner" /> : <><Zap size={14} /> AI SEVERITY SUGGESTION</>}
                            </button>
                            {aiAnalysis && (
                                <div style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderLeft: `3px solid ${aiAnalysis.severity === 'CRITICAL' ? '#dc2626' :
                                            aiAnalysis.severity === 'MODERATE' ? '#facc15' : '#2563eb'
                                        }`,
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '0 8px 8px 0',
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                }}>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                        AI Suggestion: {aiAnalysis.severity} ({aiAnalysis.confidence})
                                    </div>
                                    {aiAnalysis.suggestion}
                                </div>
                            )}
                        </div>

                        {/* Photo Upload */}
                        <div
                            className="photo-upload"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ marginBottom: 20 }}
                        >
                            <Upload size={18} />
                            {defectImage ? 'Photo attached ✓' : 'Upload defect photo'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {defectImage && (
                            <img
                                src={defectImage}
                                alt="Defect"
                                style={{
                                    width: '100%',
                                    height: 120,
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: 20,
                                }}
                            />
                        )}

                        {/* Severity Selection */}
                        <p className="section-title" style={{ marginBottom: 12 }}>
                            SELECT SEVERITY
                        </p>
                        {severityOptions.map((opt) => (
                            <button
                                key={opt.key}
                                className={`severity-option ${selectedSeverity === opt.key ? 'selected' : ''}`}
                                onClick={() => setSelectedSeverity(opt.key)}
                            >
                                <div className="severity-icon" style={{ background: opt.bg }}>
                                    <opt.icon size={20} color={opt.color} />
                                </div>
                                <div>
                                    <div className="severity-title">{opt.label}</div>
                                    <div className="severity-desc">{opt.desc}</div>
                                </div>
                            </button>
                        ))}

                        <button
                            className="btn-primary"
                            onClick={handleSubmitDefect}
                            style={{ marginTop: 16 }}
                        >
                            <ChevronRight size={18} /> CONFIRM & CONTINUE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionFlowPage;
