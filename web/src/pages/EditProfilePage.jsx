import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save } from 'lucide-react';
import { useToast } from '../components/Toast';

const EditProfilePage = ({ appLogic }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [name, setName] = useState(appLogic.profile?.full_name || '');
    const [isSaving, setIsSaving] = useState(false);

    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast('Name is required', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await appLogic.updateProfile({ full_name: name.trim() });
            toast('Profile updated!', 'success');
            navigate('/home');
        } catch (err) {
            toast(err.message || 'Failed to update', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="modal-close" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="title-area">
                        <p className="subtitle">SETTINGS</p>
                        <h1>Edit Profile</h1>
                    </div>
                </div>
            </div>

            <div className="profile-page">
                <div className="profile-avatar">{initials}</div>

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="form-input">
                            <User size={16} className="icon" />
                            <input
                                type="text"
                                placeholder="Your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <div className="form-input" style={{ opacity: 0.5 }}>
                            <input
                                type="email"
                                value={appLogic.session?.user?.email || ''}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <div className="form-input" style={{ opacity: 0.5 }}>
                            <input
                                type="text"
                                value={appLogic.role || 'inspector'}
                                disabled
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: 16 }}>
                        {isSaving ? <div className="spinner" /> : <><Save size={18} /> SAVE CHANGES</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
