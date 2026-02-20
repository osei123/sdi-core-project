import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Truck, Building2, MapPin, AlertTriangle, PlayCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const PreInspectionPage = ({ appLogic }) => {
    const [form, setForm] = useState({ driverName: '', truckNumber: '', transporter: '', depot: '' });
    const [historyAlert, setHistoryAlert] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Check truck history
    useEffect(() => {
        if (!form.truckNumber || form.truckNumber.length < 3) {
            setHistoryAlert(null);
            return;
        }
        const match = appLogic.historyData.find(
            (h) => h.truck.toLowerCase() === form.truckNumber.toLowerCase() &&
                (h.status === 'GROUNDED' || h.status === 'MONITOR')
        );
        if (match) {
            setHistoryAlert({
                truck: match.truck,
                status: match.status,
                date: match.timestamp,
            });
        } else {
            setHistoryAlert(null);
        }
    }, [form.truckNumber, appLogic.historyData]);

    const handleStart = (e) => {
        e.preventDefault();
        if (!form.driverName || !form.truckNumber) {
            toast('Driver name and truck number are required', 'error');
            return;
        }
        appLogic.setPreInspectionData(form);
        navigate('/checklist');
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate('/home')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">STEP 1 OF 3</p>
                        <h1>Pre-Inspection</h1>
                    </div>
                </div>
            </div>

            <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
                {historyAlert && (
                    <div className="history-alert">
                        <AlertTriangle size={20} color="#fca5a5" />
                        <div className="alert-text">
                            <strong>{historyAlert.truck}</strong> was previously marked as{' '}
                            <strong style={{ color: historyAlert.status === 'GROUNDED' ? '#dc2626' : '#facc15' }}>
                                {historyAlert.status}
                            </strong>{' '}
                            on {historyAlert.date}
                        </div>
                    </div>
                )}

                <form onSubmit={handleStart}>
                    <div className="form-group">
                        <label>Driver Name *</label>
                        <div className="form-input">
                            <User size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="Enter driver's full name"
                                value={form.driverName}
                                onChange={(e) => handleChange('driverName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Truck Number *</label>
                        <div className="form-input">
                            <Truck size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="e.g. GR-1234-21"
                                value={form.truckNumber}
                                onChange={(e) => handleChange('truckNumber', e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Transporter</label>
                        <div className="form-input">
                            <Building2 size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="Transport company name"
                                value={form.transporter}
                                onChange={(e) => handleChange('transporter', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Depot</label>
                        <div className="form-input">
                            <MapPin size={18} className="icon" />
                            <input
                                type="text"
                                placeholder="Loading depot"
                                value={form.depot}
                                onChange={(e) => handleChange('depot', e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: 24 }}>
                        <PlayCircle size={18} />
                        START CHECKLIST
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PreInspectionPage;
