import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, User, Shield, FileText } from 'lucide-react';
import { useToast } from '../components/Toast';

const SummaryPage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const results = appLogic.inspectionResults;

    const [driverSig, setDriverSig] = useState(null);
    const [inspectorSig, setInspectorSig] = useState(null);
    const [signingFor, setSigningFor] = useState(null); // 'driver' | 'inspector'
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const canvasRef = useRef(null);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const issues = results.filter((r) => r.status === 'FAIL');
    const criticalCount = issues.filter((r) => r.severity === 'CRITICAL').length;
    const isGrounded = criticalCount > 0;
    const isMonitor = issues.length > 0 && !isGrounded;

    let summaryColor = '#22c55e';
    let summaryText = 'OPERATIONAL';
    let SummaryIcon = CheckCircle;
    if (isGrounded) {
        summaryColor = '#dc2626';
        summaryText = 'GROUNDED (UNSAFE)';
        SummaryIcon = XCircle;
    } else if (isMonitor) {
        summaryColor = '#facc15';
        summaryText = 'SAFE TO DRIVE (MONITOR)';
        SummaryIcon = AlertTriangle;
    }

    // ─── Canvas signature handlers ───
    const openSignPad = (type) => {
        setSigningFor(type);
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.offsetWidth;
                canvas.height = 200;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }, 50);
    };

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        const coords = getCoords(e);
        lastPosRef.current = coords;
    };

    const draw = useCallback(
        (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const coords = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            lastPosRef.current = coords;
        },
        [isDrawing]
    );

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        if (signingFor === 'driver') setDriverSig(dataUrl);
        else setInspectorSig(dataUrl);
        setSigningFor(null);
        toast(`${signingFor === 'driver' ? 'Driver' : 'Inspector'} signature saved`, 'success');
    };

    const handleFinalSubmit = async () => {
        if (!driverSig || !inspectorSig) {
            toast('Both signatures are required', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await appLogic.saveInspection(results, driverSig, inspectorSig);
            toast('Inspection report saved!', 'success');
            appLogic.setInspectionResults([]);
            appLogic.setPreInspectionData(null);
            navigate('/home');
        } catch (err) {
            toast(err.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Signature pad modal
    if (signingFor) {
        return (
            <div className="modal-overlay modal-center">
                <div className="modal-content" style={{ maxWidth: 440 }}>
                    <div className="modal-header">
                        <h2>{signingFor === 'driver' ? 'DRIVER SIGNATURE' : 'INSPECTOR SIGNATURE'}</h2>
                        <button className="modal-close" onClick={() => setSigningFor(null)}>
                            <XCircle size={18} />
                        </button>
                    </div>
                    <div className="signature-canvas-container">
                        <canvas
                            ref={canvasRef}
                            style={{ width: '100%', height: 200, touchAction: 'none' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button className="btn-danger" onClick={clearCanvas} style={{ flex: 1 }}>
                            CLEAR
                        </button>
                        <button className="btn-primary" onClick={saveSignature} style={{ flex: 1 }}>
                            SAVE SIGNATURE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="summary-page">
            <div className="summary-ring" style={{ borderColor: summaryColor, color: summaryColor }}>
                <SummaryIcon size={64} color={summaryColor} />
            </div>

            <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
                Inspection Complete
            </h1>

            <div className="summary-card">
                <div className="summary-row">
                    <span style={{ color: 'var(--text-muted)' }}>Issues Found</span>
                    <span style={{ color: summaryColor, fontWeight: 700 }}>{issues.length}</span>
                </div>
                <div className="summary-row" style={{ borderBottom: 'none' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Result</span>
                    <span style={{ color: summaryColor, fontWeight: 700 }}>{summaryText}</span>
                </div>
            </div>

            <div className="signature-section">
                <button
                    className={`signature-btn ${driverSig ? 'signed' : ''}`}
                    onClick={() => openSignPad('driver')}
                >
                    {driverSig ? <CheckCircle size={18} /> : <User size={18} />}
                    {driverSig ? 'DRIVER SIGNED ✓' : 'SIGN AS DRIVER'}
                </button>

                <button
                    className={`signature-btn ${inspectorSig ? 'signed' : ''}`}
                    onClick={() => openSignPad('inspector')}
                >
                    {inspectorSig ? <CheckCircle size={18} /> : <Shield size={18} />}
                    {inspectorSig ? 'INSPECTOR SIGNED ✓' : 'SIGN AS INSPECTOR'}
                </button>

                {driverSig && inspectorSig && (
                    <button
                        className="btn-primary"
                        onClick={handleFinalSubmit}
                        disabled={isSaving}
                        style={{ marginTop: 8 }}
                    >
                        {isSaving ? <div className="spinner" /> : <><FileText size={18} /> FINISH & SAVE REPORT</>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SummaryPage;
