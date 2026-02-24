import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, X, Eraser, Check } from 'lucide-react';
import { useToast } from '../components/Toast';
import { generateQualityPDF } from '../utils/generatePDF';

const COMPANIES = ['JP TRUSTEES LTD', 'MOREFUEL LTD'];

const INITIAL_COMPARTMENTS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    litres: '',
    cert: '',
    prod: '',
}));

// ─── Signature Pad Modal ───
const SignatureModal = ({ title, onConfirm, onClose }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Set canvas actual pixel size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
        // Draw baseline
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(20, rect.height - 30);
        ctx.lineTo(rect.width - 20, rect.height - 30);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#000';
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches?.[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        setHasDrawn(true);
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redraw baseline
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(20, rect.height - 30);
        ctx.lineTo(rect.width - 20, rect.height - 30);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#000';
        setHasDrawn(false);
    };

    const confirmSig = () => {
        if (!hasDrawn) return;
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onConfirm(dataUrl);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: 480, padding: 0 }}>
                <div className="modal-header" style={{ padding: '16px 20px' }}>
                    <h2 style={{ fontSize: 16 }}>{title}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                        Draw your signature below using your finger or mouse
                    </p>
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: '100%',
                            height: 200,
                            background: '#fff',
                            borderRadius: 8,
                            border: '2px solid var(--border)',
                            cursor: 'crosshair',
                            touchAction: 'none',
                        }}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={endDraw}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={clearCanvas}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                            <Eraser size={16} /> Clear
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={confirmSig}
                            disabled={!hasDrawn}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: hasDrawn ? 1 : 0.5 }}
                        >
                            <Check size={16} /> Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ───
const QualityDataPage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Signature modal state
    const [sigModal, setSigModal] = useState(null); // 'inspector' | 'sealer' | null

    // 0. Company Information
    const [companyName, setCompanyName] = useState('JP TRUSTEES LTD');

    // 1. Documentation (waybill images)
    const [documents, setDocuments] = useState([]);

    // 2. Truck Details
    const [truckNo, setTruckNo] = useState('');
    const [product, setProduct] = useState('');
    const [depot, setDepot] = useState('');

    // 3. Compartment Levels
    const [compartments, setCompartments] = useState(INITIAL_COMPARTMENTS);

    // 4. Quality Parameters
    const [qualityParams, setQualityParams] = useState({
        density: '',
        diffComp: '',
        temp: '',
        additive: '',
        water: '',
        color: '',
    });

    // 5. Sign-Off
    const [inspectorName, setInspectorName] = useState(appLogic?.profile?.full_name || '');
    const [sealerName, setSealerName] = useState('');
    const [inspectorSig, setInspectorSig] = useState(null);
    const [sealerSig, setSealerSig] = useState(null);

    // --- Handlers ---

    const updateCompartment = (index, field, value) => {
        setCompartments((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const updateQuality = (field, value) => {
        setQualityParams((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddDocument = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                setDocuments((prev) => [...prev, { name: file.name, data: reader.result }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeDocument = (idx) => {
        setDocuments((prev) => prev.filter((_, i) => i !== idx));
    };

    // Signature confirm
    const handleSigConfirm = (dataUrl) => {
        if (sigModal === 'inspector') setInspectorSig(dataUrl);
        if (sigModal === 'sealer') setSealerSig(dataUrl);
        setSigModal(null);
    };

    // --- Submit ---

    const handleSubmit = async () => {
        if (!truckNo.trim()) {
            toast('Truck number is required', 'error');
            return;
        }
        if (!inspectorSig) {
            toast('Inspector signature is required', 'error');
            return;
        }
        if (!sealerSig) {
            toast('Sealer signature is required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const reportData = {
                company_name: companyName,
                truck_number: truckNo,
                product,
                depot,
                compartments,
                quality_params: qualityParams,
                inspector_name: inspectorName,
                sealer_name: sealerName,
                inspector_signature: inspectorSig,
                sealer_signature: sealerSig,
                documents,
            };

            await appLogic.saveQualityReport(reportData);

            // Generate PDF immediately
            generateQualityPDF(reportData);

            toast('Quality data saved & PDF generated!', 'success');
            navigate('/home');
        } catch (err) {
            toast(err.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="quality-page">
            {/* Signature Modal */}
            {sigModal && (
                <SignatureModal
                    title={sigModal === 'inspector' ? 'Inspector Signature' : 'Sealer Signature'}
                    onConfirm={handleSigConfirm}
                    onClose={() => setSigModal(null)}
                />
            )}

            {/* Header */}
            <div className="quality-page-header">
                <button className="quality-back-btn" onClick={() => navigate('/home')} aria-label="Go back">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="quality-page-title">QUALITY DATA</h1>
            </div>

            <div className="quality-sections">
                {/* Section 0: Company Information */}
                <section className="quality-section">
                    <h2 className="quality-section-title">0. Company Information</h2>
                    <p className="quality-section-desc">Select or Type Company Name for PDF Header</p>
                    <div className="quality-input-wrapper">
                        <input
                            type="text"
                            className="quality-input"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value.toUpperCase())}
                            placeholder="Company name"
                        />
                    </div>
                    <div className="quality-company-chips">
                        {COMPANIES.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`quality-chip ${companyName === c ? 'active' : ''}`}
                                onClick={() => setCompanyName(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section 1: Documentation */}
                <section className="quality-section">
                    <h2 className="quality-section-title">1. Documentation</h2>
                    <p className="quality-section-desc">Scan Waybills or Tickets (Will appear on Page 1, 2... of PDF)</p>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        className="quality-file-hidden"
                        onChange={handleFileChange}
                    />
                    {documents.length > 0 && (
                        <div className="quality-doc-list">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="quality-doc-item">
                                    <img
                                        src={doc.data}
                                        alt={doc.name}
                                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--border)' }}
                                    />
                                    <span>{doc.name}</span>
                                    <button type="button" className="quality-doc-remove" onClick={() => removeDocument(idx)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button type="button" className="quality-add-doc-btn" onClick={handleAddDocument}>
                        <Plus size={16} /> Add Document
                    </button>
                </section>

                {/* Section 2: Truck Details */}
                <section className="quality-section">
                    <h2 className="quality-section-title">2. Truck Details</h2>
                    <div className="quality-field">
                        <label className="quality-label">Truck No</label>
                        <input
                            type="text"
                            className="quality-input"
                            value={truckNo}
                            onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                            placeholder="e.g. GT351722"
                        />
                    </div>
                    <div className="quality-field">
                        <label className="quality-label">Product</label>
                        <input
                            type="text"
                            className="quality-input"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="e.g. PMS, AGO"
                        />
                    </div>
                    <div className="quality-field">
                        <label className="quality-label">Depot</label>
                        <input
                            type="text"
                            className="quality-input"
                            value={depot}
                            onChange={(e) => setDepot(e.target.value)}
                            placeholder="e.g. Bost Kumasi"
                        />
                    </div>
                </section>

                {/* Section 3: Compartment Levels */}
                <section className="quality-section">
                    <h2 className="quality-section-title">3. Compartment Levels</h2>
                    <div className="quality-comp-table">
                        <div className="quality-comp-header">
                            <span className="quality-comp-col no">No.</span>
                            <span className="quality-comp-col">Litres</span>
                            <span className="quality-comp-col">Cert</span>
                            <span className="quality-comp-col">Prod</span>
                        </div>
                        {compartments.map((comp, idx) => (
                            <div key={comp.id} className="quality-comp-row">
                                <span className="quality-comp-col no quality-comp-num">{comp.id}</span>
                                <div className="quality-comp-col">
                                    <input
                                        type="text"
                                        className="quality-comp-input"
                                        value={comp.litres}
                                        onChange={(e) => updateCompartment(idx, 'litres', e.target.value)}
                                    />
                                </div>
                                <div className="quality-comp-col">
                                    <input
                                        type="text"
                                        className="quality-comp-input"
                                        value={comp.cert}
                                        onChange={(e) => updateCompartment(idx, 'cert', e.target.value)}
                                    />
                                </div>
                                <div className="quality-comp-col">
                                    <input
                                        type="text"
                                        className="quality-comp-input"
                                        value={comp.prod}
                                        onChange={(e) => updateCompartment(idx, 'prod', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 4: Quality Parameters */}
                <section className="quality-section">
                    <h2 className="quality-section-title">4. Quality Parameters</h2>
                    <div className="quality-params-grid">
                        <div className="quality-field">
                            <label className="quality-label">Density</label>
                            <input type="text" className="quality-input" value={qualityParams.density}
                                onChange={(e) => updateQuality('density', e.target.value)} />
                        </div>
                        <div className="quality-field">
                            <label className="quality-label">Diff Comp Lvl</label>
                            <input type="text" className="quality-input" value={qualityParams.diffComp}
                                onChange={(e) => updateQuality('diffComp', e.target.value)} />
                        </div>
                        <div className="quality-field">
                            <label className="quality-label">Temperature</label>
                            <input type="text" className="quality-input" value={qualityParams.temp}
                                onChange={(e) => updateQuality('temp', e.target.value)} />
                        </div>
                        <div className="quality-field">
                            <label className="quality-label">Additive</label>
                            <input type="text" className="quality-input" value={qualityParams.additive}
                                onChange={(e) => updateQuality('additive', e.target.value)} />
                        </div>
                        <div className="quality-field">
                            <label className="quality-label">Water Status</label>
                            <input type="text" className="quality-input" value={qualityParams.water}
                                onChange={(e) => updateQuality('water', e.target.value)} />
                        </div>
                        <div className="quality-field">
                            <label className="quality-label">Product Color</label>
                            <input type="text" className="quality-input" value={qualityParams.color}
                                onChange={(e) => updateQuality('color', e.target.value)} />
                        </div>
                    </div>
                </section>

                {/* Section 5: Sign-Off */}
                <section className="quality-section">
                    <h2 className="quality-section-title">5. Sign-Off</h2>
                    <div className="quality-field">
                        <label className="quality-label">Inspector's Name:</label>
                        <input
                            type="text"
                            className="quality-input"
                            value={inspectorName}
                            onChange={(e) => setInspectorName(e.target.value)}
                            placeholder="Inspector full name"
                        />
                    </div>
                    <div className="quality-field">
                        <label className="quality-label">Inspector Signature: *</label>
                        {inspectorSig ? (
                            <div className="quality-sig-preview">
                                <img src={inspectorSig} alt="Inspector signature" />
                                <button
                                    type="button"
                                    className="quality-sig-clear"
                                    onClick={() => setInspectorSig(null)}
                                >
                                    Re-sign
                                </button>
                            </div>
                        ) : (
                            <div
                                className="quality-sig-placeholder"
                                onClick={() => setSigModal('inspector')}
                                style={{ cursor: 'pointer' }}
                            >
                                ✍ Tap to Sign (Inspector)
                            </div>
                        )}
                    </div>
                    <div className="quality-field">
                        <label className="quality-label">Sealer's Name:</label>
                        <input
                            type="text"
                            className="quality-input"
                            value={sealerName}
                            onChange={(e) => setSealerName(e.target.value)}
                            placeholder="Sealer full name"
                        />
                    </div>
                    <div className="quality-field">
                        <label className="quality-label">Sealer Signature: *</label>
                        {sealerSig ? (
                            <div className="quality-sig-preview">
                                <img src={sealerSig} alt="Sealer signature" />
                                <button
                                    type="button"
                                    className="quality-sig-clear"
                                    onClick={() => setSealerSig(null)}
                                >
                                    Re-sign
                                </button>
                            </div>
                        ) : (
                            <div
                                className="quality-sig-placeholder"
                                onClick={() => setSigModal('sealer')}
                                style={{ cursor: 'pointer' }}
                            >
                                ✍ Tap to Sign (Sealer)
                            </div>
                        )}
                    </div>
                </section>

                {/* Generate PDF Button */}
                <button
                    type="button"
                    className="quality-generate-btn"
                    onClick={handleSubmit}
                    disabled={isSaving}
                >
                    {isSaving ? <div className="spinner" /> : 'GENERATE PDF'}
                </button>
            </div>
        </div>
    );
};

export default QualityDataPage;
