import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Save } from 'lucide-react';
import { useToast } from '../components/Toast';

const QualityDataPage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        truckNumber: '',
        transporter: '',
        product: 'PMS',
        depot: '',
        compartments: [
            { number: 1, density: '', temperature: '', volume: '' },
            { number: 2, density: '', temperature: '', volume: '' },
            { number: 3, density: '', temperature: '', volume: '' },
        ],
        observation: '',
    });

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCompartmentChange = (index, field, value) => {
        setForm((prev) => {
            const comps = [...prev.compartments];
            comps[index] = { ...comps[index], [field]: value };
            return { ...prev, compartments: comps };
        });
    };

    const addCompartment = () => {
        setForm((prev) => ({
            ...prev,
            compartments: [
                ...prev.compartments,
                { number: prev.compartments.length + 1, density: '', temperature: '', volume: '' },
            ],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.truckNumber) {
            toast('Truck number is required', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await appLogic.saveQualityReport({
                truck_number: form.truckNumber,
                transporter: form.transporter,
                product: form.product,
                depot: form.depot,
                compartments: form.compartments,
                observation: form.observation,
            });
            toast('Quality data saved!', 'success');
            navigate('/home');
        } catch (err) {
            toast(err.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate('/home')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">QUALITY ASSURANCE</p>
                        <h1>Quality Data</h1>
                    </div>
                </div>
            </div>

            <div className="quality-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Truck Number *</label>
                        <div className="form-input">
                            <input
                                type="text"
                                placeholder="e.g. GR-1234-21"
                                value={form.truckNumber}
                                onChange={(e) => handleFormChange('truckNumber', e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Transporter</label>
                        <div className="form-input">
                            <input
                                type="text"
                                placeholder="Transport company"
                                value={form.transporter}
                                onChange={(e) => handleFormChange('transporter', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Product</label>
                            <div className="form-input">
                                <select
                                    value={form.product}
                                    onChange={(e) => handleFormChange('product', e.target.value)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', flex: 1 }}
                                >
                                    <option value="PMS">PMS</option>
                                    <option value="AGO">AGO</option>
                                    <option value="DPK">DPK</option>
                                    <option value="LPG">LPG</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Depot</label>
                            <div className="form-input">
                                <input
                                    type="text"
                                    placeholder="Depot name"
                                    value={form.depot}
                                    onChange={(e) => handleFormChange('depot', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section-title" style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>COMPARTMENTS</span>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={addCompartment}
                                style={{ fontSize: 11 }}
                            >
                                + Add Compartment
                            </button>
                        </div>
                    </div>

                    {form.compartments.map((comp, idx) => (
                        <div key={idx} className="compartment-card">
                            <div className="compartment-header">
                                <span className="compartment-title">
                                    <Droplets size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Compartment {comp.number}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Density</label>
                                    <div className="form-input" style={{ height: 42 }}>
                                        <input
                                            type="number"
                                            step="0.001"
                                            placeholder="kg/m³"
                                            value={comp.density}
                                            onChange={(e) => handleCompartmentChange(idx, 'density', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Temp (°C)</label>
                                    <div className="form-input" style={{ height: 42 }}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="°C"
                                            value={comp.temperature}
                                            onChange={(e) => handleCompartmentChange(idx, 'temperature', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Volume (L)</label>
                                    <div className="form-input" style={{ height: 42 }}>
                                        <input
                                            type="number"
                                            placeholder="Litres"
                                            value={comp.volume}
                                            onChange={(e) => handleCompartmentChange(idx, 'volume', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Observations</label>
                        <textarea
                            className="defect-textarea"
                            placeholder="Any observations or notes..."
                            value={form.observation}
                            onChange={(e) => handleFormChange('observation', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: 12 }}>
                        {isSaving ? <div className="spinner" /> : <><Save size={18} /> SAVE QUALITY DATA</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QualityDataPage;
