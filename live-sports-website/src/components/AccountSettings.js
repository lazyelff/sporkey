import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateProfile, changePassword, deleteAccount, getNotificationPreferences, updateNotificationPreferences, getSessions, revokeSession, revokeAllSessions, enable2FA, verify2FA, disable2FA, getFeedSettings, updateFeedSettings, getUserFavorites, addUserFavorite, removeUserFavorite, getPrivacySettings, updatePrivacySettings, getConnectedAccounts, disconnectAccount, exportUserData } from '../services/api';
import '../styles/AccountSettings.css';

const AccountSettings = ({ user, onBack, onAccountDeleted }) => {
    // Profile State
    const [profileData, setProfileData] = useState({ username: '', email: '' });
    const [originalProfile, setOriginalProfile] = useState({ username: '', email: '' });
    const [pendingEmail, setPendingEmail] = useState(null);
    const [profileStatus, setProfileStatus] = useState({ loading: false, error: null, success: null });

    // Password State
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdStatus, setPwdStatus] = useState({ loading: false, error: null, success: null });

    // Delete State
    const [deleteData, setDeleteData] = useState({ password: '', confirmationString: '', showConfirm: false });
    const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null });

    // Notifications State
    const [notifications, setNotifications] = useState({
        match_start: true,
        match_reminder: true,
        favorite_team_alert: true,
        platform_updates: false,
        email_notifications: true,
        push_notifications: false
    });
    const [notifStatus, setNotifStatus] = useState({ loading: false, error: null, success: null });

    // Sessions & 2FA State
    const [sessions, setSessions] = useState([]);
    const [sessionStatus, setSessionStatus] = useState({ loading: false, error: null });
    const [twoFaEnabled, setTwoFaEnabled] = useState(false);
    const [twoFaSetup, setTwoFaSetup] = useState({ active: false, qrCode: '', code: '', error: null, success: null });
    const [twoFaDisable, setTwoFaDisable] = useState({ active: false, password: '', error: null, success: null });

    // Preferences State
    const [feedSettings, setFeedSettings] = useState({
        defaultView: 'all',
        showLiveOnly: false,
        preferredLeagues: []
    });
    const [favorites, setFavorites] = useState([]);
    const [favoriteInput, setFavoriteInput] = useState('');
    const [prefStatus, setPrefStatus] = useState({ loading: false, error: null, success: null });

    // Privacy State
    const [privacySettings, setPrivacySettings] = useState({
        profileVisibility: 'public',
        showOnlineStatus: true,
        showFavorites: true
    });
    const [privacyStatus, setPrivacyStatus] = useState({ loading: false, error: null, success: null });

    // Connected Accounts State
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [connectedStatus, setConnectedStatus] = useState({ loading: false, error: null, success: null });

    // Export State
    const [exportStatus, setExportStatus] = useState({ loading: false, error: null, success: null });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await getCurrentUser();
                const userObj = res.data;
                setProfileData({ username: userObj.username, email: userObj.email });
                setOriginalProfile({ username: userObj.username, email: userObj.email });
                setPendingEmail(userObj.pendingEmail || null);
                setTwoFaEnabled(userObj.twoFaEnabled || false);

                // Fetch Sessions
                try {
                    setSessionStatus({ loading: true, error: null });
                    const sessRes = await getSessions();
                    if (sessRes.success) setSessions(sessRes.data);
                } catch (e) {
                    setSessionStatus({ loading: false, error: 'Could not load sessions' });
                } finally {
                    setSessionStatus(p => ({ ...p, loading: false }));
                }

                // Fetch Preferences & Favorites
                try {
                    const prefRes = await getNotificationPreferences();
                    if (prefRes.success && prefRes.data) {
                        setNotifications(prefRes.data);
                    }
                    const feedRes = await getFeedSettings();
                    if (feedRes.success && feedRes.data) {
                        setFeedSettings({
                            defaultView: feedRes.data.defaultView,
                            showLiveOnly: feedRes.data.showLiveOnly,
                            preferredLeagues: feedRes.data.preferredLeagues || []
                        });
                    }
                    const favsRes = await getUserFavorites();
                    if (favsRes.success && favsRes.data) {
                        setFavorites(favsRes.data);
                    }
                } catch (prefErr) {
                    console.error('Could not load preferences or favorites');
                }

                // Fetch Privacy & Connected Accounts
                try {
                    const privRes = await getPrivacySettings();
                    if (privRes.success && privRes.data) {
                        setPrivacySettings({
                            profileVisibility: privRes.data.profileVisibility,
                            showOnlineStatus: privRes.data.showOnlineStatus,
                            showFavorites: privRes.data.showFavorites
                        });
                    }
                    const connRes = await getConnectedAccounts();
                    if (connRes.success && connRes.data) {
                        setConnectedAccounts(connRes.data);
                    }
                } catch (privErr) {
                    console.error('Could not load privacy or connected accounts');
                }
            } catch (err) {
                setProfileStatus({ ...profileStatus, error: 'Failed to load profile data.' });
            }
        };
        if (user) fetchUserData();
    }, [user]);

    // Profile Handlers
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setProfileStatus({ loading: false, error: null, success: null });
    };

    const isProfileModified = profileData.username !== originalProfile.username || profileData.email !== originalProfile.email;

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileStatus({ loading: true, error: null, success: null });
        try {
            const res = await updateProfile(profileData.username, profileData.email);
            const userObj = res.data;
            setProfileStatus({ loading: false, error: null, success: res.message || 'Profile updated successfully!' });
            setOriginalProfile({ username: userObj.username, email: userObj.email });
            if (userObj.pendingEmail) {
                setPendingEmail(userObj.pendingEmail);
                // Keep the input showing their target email, though officially it remains the old one for now
                setProfileData({ ...profileData, email: userObj.email });
            }
            
            // Sync with local storage
            const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            savedUser.username = userObj.username;
            localStorage.setItem('currentUser', JSON.stringify(savedUser));
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            setProfileStatus({ loading: false, error: err.message || 'Error updating profile', success: null });
        }
    };

    // Password Handlers
    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
        setPwdStatus({ loading: false, error: null, success: null });
    };

    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        if (pwdData.newPassword.length < 8) {
            return setPwdStatus({ ...pwdStatus, error: 'New password must be at least 8 characters' });
        }
        if (pwdData.newPassword !== pwdData.confirmPassword) {
            return setPwdStatus({ ...pwdStatus, error: 'New passwords do not match' });
        }
        setPwdStatus({ loading: true, error: null, success: null });
        try {
            const res = await changePassword(pwdData.currentPassword, pwdData.newPassword);
            setPwdStatus({ loading: false, error: null, success: res.message || 'Password changed successfully!' });
            setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwdStatus({ loading: false, error: err.message || 'Error changing password', success: null });
        }
    };

    // Delete Handlers
    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        setDeleteStatus({ loading: true, error: null });
        try {
            await deleteAccount(deleteData.password, deleteData.confirmationString);
            onAccountDeleted(); // Parent component handles logout/redirect
        } catch (err) {
            setDeleteStatus({ loading: false, error: err.message || 'Error deleting account' });
        }
    };

    // Notification Handlers
    const handleNotificationToggle = async (field) => {
        const newValue = !notifications[field];
        // Optimistic UI update
        setNotifications((prev) => ({ ...prev, [field]: newValue }));
        setNotifStatus({ loading: true, error: null, success: null });
        
        try {
            await updateNotificationPreferences({ [field]: newValue });
            setNotifStatus({ loading: false, error: null, success: 'Preference saved' });
            // Clear success message after 3 seconds
            setTimeout(() => setNotifStatus(prev => ({ ...prev, success: null })), 3000);
        } catch (err) {
            // Revert on failure
            setNotifications((prev) => ({ ...prev, [field]: !newValue }));
            setNotifStatus({ loading: false, error: err.message || 'Failed to update preference', success: null });
        }
    };

    // Session Handlers
    const handleRevokeSession = async (id) => {
        try {
            await revokeSession(id);
            setSessions(sessions.filter(s => s.id !== id));
        } catch (err) {
            setSessionStatus({ loading: false, error: err.message || 'Failed to revoke session' });
        }
    };

    const handleRevokeAll = async () => {
        try {
            await revokeAllSessions();
            setSessions(sessions.filter(s => s.isCurrent));
        } catch (err) {
            setSessionStatus({ loading: false, error: err.message || 'Failed to revoke sessions' });
        }
    };

    // 2FA Handlers
    const handleInit2FA = async () => {
        setTwoFaSetup({ active: true, qrCode: '', code: '', error: null, success: null });
        try {
            const res = await enable2FA();
            if (res.success) {
                setTwoFaSetup(prev => ({ ...prev, qrCode: res.data.qrCode }));
            }
        } catch (err) {
            setTwoFaSetup(prev => ({ ...prev, error: err.message || 'Unable to init 2FA' }));
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        try {
            const res = await verify2FA(twoFaSetup.code);
            if (res.success) {
                setTwoFaEnabled(true);
                setTwoFaSetup({ active: false, qrCode: '', code: '', error: null, success: '2FA Enabled!' });
                setTimeout(() => setTwoFaSetup(p => ({ ...p, success: null })), 3000);
            }
        } catch (err) {
            setTwoFaSetup(prev => ({ ...prev, error: err.message || 'Invalid code' }));
        }
    };

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        try {
            const res = await disable2FA(twoFaDisable.password);
            if (res.success) {
                setTwoFaEnabled(false);
                setTwoFaDisable({ active: false, password: '', error: null, success: '2FA Disabled' });
                setTimeout(() => setTwoFaDisable(p => ({ ...p, success: null })), 3000);
            }
        } catch (err) {
            setTwoFaDisable(prev => ({ ...prev, error: err.message || 'Invalid password' }));
        }
    };

    // Preferences Handlers
    const handleFeedToggle = async (field, value) => {
        const newValue = value !== undefined ? value : !feedSettings[field];
        setFeedSettings((prev) => ({ ...prev, [field]: newValue }));
        setPrefStatus({ loading: true, error: null, success: null });
        
        try {
            await updateFeedSettings({ [field]: newValue });
            setPrefStatus({ loading: false, error: null, success: 'Feed settings updated' });
            setTimeout(() => setPrefStatus(prev => ({ ...prev, success: null })), 3000);
        } catch (err) {
            setFeedSettings((prev) => ({ ...prev, [field]: feedSettings[field] })); // Revert
            setPrefStatus({ loading: false, error: err.message || 'Failed to update feed settings', success: null });
        }
    };

    const handleAddFavorite = async (e) => {
        e.preventDefault();
        if (!favoriteInput.trim()) return;
        setPrefStatus({ loading: true, error: null, success: null });
        try {
            const res = await addUserFavorite('team', favoriteInput.trim().toLowerCase(), favoriteInput.trim());
            if (res.success) {
                setFavorites([...favorites, res.data]);
                setFavoriteInput('');
                setPrefStatus({ loading: false, error: null, success: 'Favorite added' });
                setTimeout(() => setPrefStatus(prev => ({ ...prev, success: null })), 3000);
            }
        } catch (err) {
            setPrefStatus({ loading: false, error: err.message || 'Failed to add favorite', success: null });
        }
    };

    const handleRemoveFavorite = async (id) => {
        setPrefStatus({ loading: true, error: null, success: null });
        try {
            await removeUserFavorite(id);
            setFavorites(favorites.filter(f => f.id !== id));
            setPrefStatus({ loading: false, error: null, success: 'Favorite removed' });
            setTimeout(() => setPrefStatus(prev => ({ ...prev, success: null })), 3000);
        } catch (err) {
            setPrefStatus({ loading: false, error: err.message || 'Failed to remove favorite', success: null });
        }
    };

    // Privacy Handlers
    const handlePrivacyToggle = async (field, value) => {
        const newValue = value !== undefined ? value : !privacySettings[field];
        setPrivacySettings((prev) => ({ ...prev, [field]: newValue }));
        setPrivacyStatus({ loading: true, error: null, success: null });
        try {
            await updatePrivacySettings({ [field]: newValue });
            setPrivacyStatus({ loading: false, error: null, success: 'Privacy settings updated' });
            setTimeout(() => setPrivacyStatus(prev => ({ ...prev, success: null })), 3000);
        } catch (err) {
            setPrivacySettings((prev) => ({ ...prev, [field]: privacySettings[field] }));
            setPrivacyStatus({ loading: false, error: err.message || 'Failed to update privacy', success: null });
        }
    };

    // Connected Account Handlers
    const handleDisconnect = async (provider) => {
        setConnectedStatus({ loading: true, error: null, success: null });
        try {
            await disconnectAccount(provider);
            setConnectedAccounts(connectedAccounts.filter(a => a.provider !== provider));
            setConnectedStatus({ loading: false, error: null, success: `${provider} disconnected` });
            setTimeout(() => setConnectedStatus(prev => ({ ...prev, success: null })), 3000);
        } catch (err) {
            setConnectedStatus({ loading: false, error: err.message || 'Failed to disconnect', success: null });
        }
    };

    // Export Handler
    const handleExportData = async () => {
        setExportStatus({ loading: true, error: null, success: null });
        try {
            const res = await exportUserData();
            if (res.success) {
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sporkey-data-export.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setExportStatus({ loading: false, error: null, success: 'Data exported successfully!' });
                setTimeout(() => setExportStatus(prev => ({ ...prev, success: null })), 5000);
            }
        } catch (err) {
            setExportStatus({ loading: false, error: err.message || 'Failed to export data', success: null });
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header animate-subtle">
                <h2>Account Settings</h2>
                <button className="back-btn" onClick={onBack}>
                    ← Back to Matches
                </button>
            </div>

            <div className="settings-content">
                {/* Profile Section */}
                <div className="settings-card animate-subtle-up animate-delay-1">
                    <h3>Profile Information</h3>
                    
                    {profileStatus.error && <div className="settings-alert error">{profileStatus.error}</div>}
                    {profileStatus.success && <div className="settings-alert success">{profileStatus.success}</div>}
                    {pendingEmail && (
                        <div className="settings-alert" style={{ background: 'rgba(255,193,7,0.1)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)' }}>
                            A verification link has been sent to <strong>{pendingEmail}</strong>. Your email will not change until it's verified.
                        </div>
                    )}
                    
                    <form onSubmit={handleProfileSubmit}>
                        <div className="settings-form-group">
                            <label>Username</label>
                            <input 
                                type="text" 
                                name="username" 
                                className="settings-input" 
                                value={profileData.username} 
                                onChange={handleProfileChange}
                                required 
                            />
                        </div>
                        <div className="settings-form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                className="settings-input" 
                                value={profileData.email} 
                                onChange={handleProfileChange}
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="settings-btn" 
                            disabled={!isProfileModified || profileStatus.loading}
                        >
                            {profileStatus.loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Security Section */}
                <div className="settings-card">
                    <h3>Security</h3>
                    
                    {/* Password Change Sub-section */}
                    <div className="toggle-group-title" style={{ marginTop: 0 }}>Change Password</div>
                    {pwdStatus.error && <div className="settings-alert error">{pwdStatus.error}</div>}
                    {pwdStatus.success && <div className="settings-alert success">{pwdStatus.success}</div>}

                    <form onSubmit={handlePwdSubmit}>
                        <div className="settings-form-group">
                            <label>Current Password</label>
                            <input 
                                type="password" 
                                name="currentPassword" 
                                className="settings-input" 
                                value={pwdData.currentPassword} 
                                onChange={handlePwdChange}
                                required 
                            />
                        </div>
                        <div className="settings-form-group">
                            <label>New Password</label>
                            <input 
                                type="password" 
                                name="newPassword" 
                                className="settings-input" 
                                value={pwdData.newPassword} 
                                onChange={handlePwdChange}
                                minLength="8"
                                placeholder="Min 8 characters"
                                required 
                            />
                        </div>
                        <div className="settings-form-group">
                            <label>Confirm New Password</label>
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                className="settings-input" 
                                value={pwdData.confirmPassword} 
                                onChange={handlePwdChange}
                                minLength="8"
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="settings-btn" 
                            disabled={!pwdData.currentPassword || !pwdData.newPassword || !pwdData.confirmPassword || pwdStatus.loading}
                        >
                            {pwdStatus.loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

                    {/* Two-Factor Authentication Sub-section */}
                    <div className="toggle-group-title" style={{ marginTop: 0 }}>Two-Factor Authentication (2FA)</div>
                    <div className="settings-toggle-container">
                        <span className="toggle-label" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>Authenticator App</span>
                            <span style={{ fontSize: '0.8rem', color: '#8892b0', marginTop: '4px', fontWeight: 'normal' }}>
                                {twoFaEnabled ? 'Your account is secured with 2FA.' : 'Add an extra layer of security to your account.'}
                            </span>
                        </span>
                        {twoFaEnabled ? (
                            <button className="danger-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setTwoFaDisable({ active: true, password: '', error: null, success: null })}>
                                Disable 2FA
                            </button>
                        ) : (
                            <button className="settings-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleInit2FA}>
                                Enable 2FA
                            </button>
                        )}
                    </div>
                    {twoFaSetup.success && <div className="settings-alert success">{twoFaSetup.success}</div>}
                    {twoFaDisable.success && <div className="settings-alert success">{twoFaDisable.success}</div>}

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

                    {/* Active Sessions Sub-section */}
                    <div className="toggle-group-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Active Sessions</span>
                        {sessions.length > 1 && (
                            <button type="button" onClick={handleRevokeAll} style={{ background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Revoke all other devices
                            </button>
                        )}
                    </div>
                    {sessionStatus.error && <div className="settings-alert error">{sessionStatus.error}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sessionStatus.loading ? <span style={{ color: '#aaa' }}>Loading sessions...</span> : sessions.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ color: '#e0e0e0', fontWeight: '500', fontSize: '0.95rem' }}>
                                        {s.deviceInfo || 'Unknown Device'} 
                                        {s.isCurrent && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'rgba(79, 172, 254, 0.2)', color: '#4facfe', padding: '2px 6px', borderRadius: '4px' }}>This Device</span>}
                                    </span>
                                    <span style={{ color: '#8892b0', fontSize: '0.85rem' }}>{s.ipAddress} • Last active: {new Date(s.lastUsedAt).toLocaleString()}</span>
                                </div>
                                {!s.isCurrent && (
                                    <button type="button" onClick={() => handleRevokeSession(s.id)} style={{ background: 'rgba(255, 23, 68, 0.15)', color: '#ff1744', border: '1px solid rgba(255, 23, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="settings-card">
                    <h3>Notification Preferences</h3>
                    
                    {notifStatus.error && <div className="settings-alert error">{notifStatus.error}</div>}
                    {notifStatus.success && <div className="settings-alert success" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>{notifStatus.success}</div>}

                    <div className="toggle-group-title">Match Alerts</div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Match Start Alerts</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.match_start} 
                                onChange={() => handleNotificationToggle('match_start')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Match Reminders (1h before)</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.match_reminder} 
                                onChange={() => handleNotificationToggle('match_reminder')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Favorite Team Updates</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.favorite_team_alert} 
                                onChange={() => handleNotificationToggle('favorite_team_alert')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="toggle-group-title">General</div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Platform Updates</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.platform_updates} 
                                onChange={() => handleNotificationToggle('platform_updates')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Receive Email Notifications</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.email_notifications} 
                                onChange={() => handleNotificationToggle('email_notifications')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className={`settings-toggle-container ${notifStatus.loading ? 'disabled' : ''}`}>
                        <span className="toggle-label">Push Notifications</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications.push_notifications} 
                                onChange={() => handleNotificationToggle('push_notifications')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                {/* Preferences Section: Feed & Favorites */}
                <div className="settings-card">
                    <h3>Preferences & Favorites</h3>
                    {prefStatus.error && <div className="settings-alert error">{prefStatus.error}</div>}
                    {prefStatus.success && <div className="settings-alert success" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>{prefStatus.success}</div>}

                    <div className="toggle-group-title">Feed Settings</div>
                    <div className="settings-form-group">
                        <label>Default Feed View</label>
                        <select 
                            className="settings-input" 
                            style={{ background: 'rgba(255,255,255,0.05)', height: '45px' }}
                            value={feedSettings.defaultView} 
                            onChange={(e) => handleFeedToggle('defaultView', e.target.value)}
                        >
                            <option value="all">All Content</option>
                            <option value="favorites">My Favorites Only</option>
                        </select>
                    </div>
                    
                    <div className="settings-toggle-container">
                        <span className="toggle-label">Show Live Matches Only</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={feedSettings.showLiveOnly} 
                                onChange={() => handleFeedToggle('showLiveOnly')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="toggle-group-title" style={{ marginTop: '2rem' }}>My Favorites</div>
                    <form onSubmit={handleAddFavorite} style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                        <input 
                            type="text" 
                            className="settings-input" 
                            placeholder="Add a team (e.g., Manchester United)" 
                            value={favoriteInput}
                            onChange={(e) => setFavoriteInput(e.target.value)}
                            required
                        />
                        <button type="submit" className="settings-btn" disabled={prefStatus.loading} style={{ width: 'auto', padding: '0 1.5rem' }}>
                            Add
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {favorites.length === 0 ? (
                            <span style={{ color: '#8892b0', fontSize: '0.9rem' }}>You haven't added any favorites yet.</span>
                        ) : (
                            favorites.map(fav => (
                                <span key={fav.id} style={{ 
                                    background: 'rgba(79, 172, 254, 0.1)', 
                                    border: '1px solid rgba(79, 172, 254, 0.3)',
                                    color: '#e0e0e0',
                                    padding: '6px 14px',
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem'
                                }}>
                                    {fav.entityName}
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveFavorite(fav.id)}
                                        style={{ background: 'none', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* Privacy & Data Section */}
                <div className="settings-card">
                    <h3>Privacy & Data</h3>
                    {privacyStatus.error && <div className="settings-alert error">{privacyStatus.error}</div>}
                    {privacyStatus.success && <div className="settings-alert success" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>{privacyStatus.success}</div>}

                    <div className="toggle-group-title">Profile Visibility</div>
                    <div className="settings-form-group">
                        <label>Who can see your profile</label>
                        <select 
                            className="settings-input" 
                            style={{ background: 'rgba(255,255,255,0.05)', height: '45px' }}
                            value={privacySettings.profileVisibility} 
                            onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                        >
                            <option value="public">Public — Everyone</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private — Only Me</option>
                        </select>
                    </div>

                    <div className="settings-toggle-container">
                        <span className="toggle-label">Show Online Status</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={privacySettings.showOnlineStatus} 
                                onChange={() => handlePrivacyToggle('showOnlineStatus')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="settings-toggle-container">
                        <span className="toggle-label">Show My Favorites Publicly</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={privacySettings.showFavorites} 
                                onChange={() => handlePrivacyToggle('showFavorites')} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="toggle-group-title" style={{ marginTop: '2rem' }}>Connected Accounts</div>
                    {connectedStatus.error && <div className="settings-alert error">{connectedStatus.error}</div>}
                    {connectedStatus.success && <div className="settings-alert success" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>{connectedStatus.success}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['google', 'twitter', 'discord'].map(provider => {
                            const account = connectedAccounts.find(a => a.provider === provider);
                            const providerNames = { google: '🔵 Google', twitter: '🐦 Twitter', discord: '🟣 Discord' };
                            return (
                                <div key={provider} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ color: '#e0e0e0', fontWeight: '500', fontSize: '0.95rem' }}>{providerNames[provider]}</span>
                                        <span style={{ color: '#8892b0', fontSize: '0.85rem' }}>
                                            {account ? `Connected • ${account.providerAccountId}` : 'Not connected'}
                                        </span>
                                    </div>
                                    {account ? (
                                        <button 
                                            type="button" 
                                            onClick={() => handleDisconnect(provider)} 
                                            disabled={connectedStatus.loading}
                                            style={{ background: 'rgba(255, 23, 68, 0.15)', color: '#ff1744', border: '1px solid rgba(255, 23, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <span style={{ color: '#555', fontSize: '0.85rem' }}>—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="toggle-group-title" style={{ marginTop: '2rem' }}>Data Export</div>
                    {exportStatus.error && <div className="settings-alert error">{exportStatus.error}</div>}
                    {exportStatus.success && <div className="settings-alert success" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>{exportStatus.success}</div>}
                    <p style={{ color: '#8892b0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Download a copy of all your SporKey data including profile, settings, favorites, and session history.
                    </p>
                    <button 
                        className="settings-btn" 
                        onClick={handleExportData} 
                        disabled={exportStatus.loading}
                        style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {exportStatus.loading ? (
                            <><span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span> Exporting...</>
                        ) : (
                            '📥 Export My Data'
                        )}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="settings-card danger-zone">
                    <h3>Danger Zone</h3>
                    <p className="danger-text">
                        Once you delete your account, there is no going back. Please be certain. All your bets, points, and profile data will be permanently erased.
                    </p>
                    
                    {!deleteData.showConfirm ? (
                        <button 
                            className="danger-btn" 
                            onClick={() => setDeleteData({ ...deleteData, showConfirm: true })}
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className="confirm-delete-box">
                            {deleteStatus.error && <div className="settings-alert error">{deleteStatus.error}</div>}
                            <form onSubmit={handleDeleteSubmit}>
                                <div className="settings-form-group">
                                    <label>Type DELETE to confirm your intention</label>
                                    <input 
                                        type="text" 
                                        className="settings-input" 
                                        value={deleteData.confirmationString} 
                                        onChange={(e) => setDeleteData({ ...deleteData, confirmationString: e.target.value, error: null })}
                                        placeholder="DELETE"
                                        required 
                                    />
                                </div>
                                <div className="settings-form-group">
                                    <label>Enter your password to authorize</label>
                                    <input 
                                        type="password" 
                                        className="settings-input" 
                                        value={deleteData.password} 
                                        onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value, error: null })}
                                        placeholder="Current Password"
                                        required 
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        type="submit" 
                                        className="danger-btn" 
                                        disabled={!deleteData.password || deleteData.confirmationString !== 'DELETE' || deleteStatus.loading}
                                    >
                                        {deleteStatus.loading ? 'Deleting...' : 'Permanently Delete Account'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="settings-btn" 
                                        onClick={() => setDeleteData({ password: '', confirmationString: '', showConfirm: false })}
                                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            {/* 2FA Setup Modal */}
            {twoFaSetup.active && (
                <div className="settings-modal-overlay">
                    <div className="settings-card" style={{ maxWidth: '400px', margin: 'auto', background: '#1a1a2e', position: 'relative' }}>
                        <h3 style={{ borderBottom: 'none' }}>Setup 2FA</h3>
                        {twoFaSetup.error && <div className="settings-alert error">{twoFaSetup.error}</div>}
                        <p style={{ color: '#8892b0', fontSize: '0.9rem', marginBottom: '1rem' }}>Scan this QR code with Google Authenticator or Authy.</p>
                        {twoFaSetup.qrCode ? (
                            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem' }}>
                                <img src={twoFaSetup.qrCode} alt="2FA QR Code" width="200" height="200" />
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', padding: '2rem' }}>Loading QR...</div>
                        )}
                        <form onSubmit={handleVerify2FA}>
                            <div className="settings-form-group">
                                <label>Verification Code</label>
                                <input 
                                    type="text" 
                                    className="settings-input" 
                                    value={twoFaSetup.code} 
                                    onChange={(e) => setTwoFaSetup({...twoFaSetup, code: e.target.value, error: null})}
                                    placeholder="6-digit code"
                                    maxLength="6"
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="settings-btn">Verify & Enable</button>
                                <button type="button" className="settings-btn" onClick={() => setTwoFaSetup({ active: false, qrCode: '', code: '', error: null, success: null })} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2FA Disable Modal */}
            {twoFaDisable.active && (
                <div className="settings-modal-overlay">
                    <div className="settings-card" style={{ maxWidth: '400px', margin: 'auto', background: '#1a1a2e' }}>
                        <h3 style={{ borderBottom: 'none' }}>Disable 2FA</h3>
                        {twoFaDisable.error && <div className="settings-alert error">{twoFaDisable.error}</div>}
                        <p style={{ color: '#8892b0', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your password to disable 2FA.</p>
                        <form onSubmit={handleDisable2FA}>
                            <div className="settings-form-group">
                                <input 
                                    type="password" 
                                    className="settings-input" 
                                    value={twoFaDisable.password} 
                                    onChange={(e) => setTwoFaDisable({...twoFaDisable, password: e.target.value, error: null})}
                                    placeholder="Current Password"
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="danger-btn">Disable</button>
                                <button type="button" className="settings-btn" onClick={() => setTwoFaDisable({ active: false, password: '', error: null, success: null })} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AccountSettings;
