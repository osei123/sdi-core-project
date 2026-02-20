import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useToast } from '../components/Toast';
import { generateQualityPDF } from '../utils/generatePDF';

const COMPANIES = ['JP TRUSTEES LTD', 'MOREFUEL LTD'];

const INITIAL_COMPARTMENTS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    litres: '',
    cert: '',
    prod: '',
}));

const QualityDataPage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

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

    // --- Submit ---

    const handleSubmit = async () => {
        if (!truckNo.trim()) {
            toast('Truck number is required', 'error');
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
                                    <FileText size={14} />
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
                        <label className="quality-label">Inspector Signature:</label>
                        <div className="quality-sig-placeholder">
                            Tap to Sign (Inspector)
                        </div>
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
                        <label className="quality-label">Sealer Signature:</label>
                        <div className="quality-sig-placeholder">
                            Tap to Sign (Sealer)
                        </div>
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
