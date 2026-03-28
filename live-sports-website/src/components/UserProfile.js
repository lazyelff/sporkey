import React, { useState, useEffect, useRef } from 'react';
import { getBets, uploadProfilePicture, removeProfilePicture, addUserFavorite, getUserFavorites } from '../services/api';
import '../styles/UserProfile.css';

const PRESET_AVATARS = ['👤', '🦁', '🦅', '🐺', '🦊', '🐯', '👽', '👾', '🤖', '👻', '😎', '⚽', '🏀'];
const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const POPULAR_TEAMS = [
    'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal',
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Bayern Munich', 'Borussia Dortmund',
    'Juventus', 'AC Milan', 'Inter Milan', 'Paris Saint-Germain', 'Lyon',
    'NBA Teams', 'Los Angeles Lakers', 'Golden State Warriors', 'Miami Heat', 'Boston Celtics'
];

const UserProfile = ({ user, totalPoints, onBack }) => {
    const [bets, setBets] = useState([]);
    const [avatar, setAvatar] = useState('👤');
    const [customImageUrl, setCustomImageUrl] = useState(null);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [favoriteTeam, setFavoriteTeam] = useState(null);
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [teamSearch, setTeamSearch] = useState('');
    const teamDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUserBets = async () => {
            if (user?.id) {
                try {
                    const fetchedBets = await getBets();
                    setBets(fetchedBets);
                } catch (e) {
                    console.error("Failed to load bets from API:", e);
                }
            }
        };
        
        const fetchFavorites = async () => {
            if (user?.id) {
                try {
                    const favorites = await getUserFavorites();
                    const teamFav = favorites.find(f => f.entityType === 'team');
                    if (teamFav) {
                        setFavoriteTeam(teamFav.entityName);
                    }
                } catch (e) {
                    console.error("Failed to load favorites:", e);
                }
            }
        };
        
        fetchUserBets();
        fetchFavorites();
        
        if (user?.id) {
            const savedAvatar = localStorage.getItem(`userAvatar_${user.id}`);
            if (savedAvatar) {
                setAvatar(savedAvatar);
            }
            if (user.profileImageUrl) {
                setCustomImageUrl(user.profileImageUrl);
            }
        }
    }, [user?.id, user?.profileImageUrl]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target)) {
                setShowTeamDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const totalWon = bets.filter(b => b.status === 'won').length;
    const totalLost = bets.filter(b => b.status === 'lost').length;

    const handleSelectAvatar = (selected) => {
        setAvatar(selected);
        setCustomImageUrl(null);
        localStorage.setItem(`userAvatar_${user.id}`, selected);
        setIsEditingAvatar(false);
        window.dispatchEvent(new Event('storage'));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Only JPEG, PNG, and WEBP images are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be under 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const result = await uploadProfilePicture(formData, (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percent);
            });

            setCustomImageUrl(result.profileImageUrl);
            setPreviewUrl(null);
            setIsEditingAvatar(false);

            const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            savedUser.profileImageUrl = result.profileImageUrl;
            localStorage.setItem('currentUser', JSON.stringify(savedUser));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            setUploadError(error.message || 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveCustomImage = async () => {
        try {
            await removeProfilePicture();
            setCustomImageUrl(null);
            setPreviewUrl(null);

            const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            delete savedUser.profileImageUrl;
            localStorage.setItem('currentUser', JSON.stringify(savedUser));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            setUploadError(error.message || 'Failed to remove picture.');
        }
    };

    const cancelPreview = () => {
        setPreviewUrl(null);
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSelectTeam = async (teamName) => {
        setFavoriteTeam(teamName);
        setShowTeamDropdown(false);
        setTeamSearch('');
        
        try {
            await addUserFavorite('team', teamName.toLowerCase().replace(/\s+/g, '_'), teamName);
        } catch (e) {
            console.error('Failed to save favorite team:', e);
        }
    };

    const filteredTeams = POPULAR_TEAMS.filter(team => 
        team.toLowerCase().includes(teamSearch.toLowerCase())
    );

    const avatarDisplay = customImageUrl
        ? <img src={`${BACKEND_BASE}${customImageUrl}`} alt="avatar" className="avatar-image" />
        : avatar;

    return (
        <div className="profile-container">
            <div className="profile-header animate-subtle">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Matches
                </button>
            </div>
            
            <div className="profile-content">
                <div className="profile-card animate-subtle-up animate-delay-1">
                    <div className="user-info">
                        <div className="profile-top-section">
                            <div className="avatar-section">
                                <div 
                                    className={`avatar-circle ${customImageUrl ? 'has-image' : ''}`}
                                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                                    title="Click to change avatar"
                                >
                                    {avatarDisplay}
                                </div>
                            </div>
                            
                            <div className="user-details">
                                <h2 className="username-display">@{user.username}</h2>
                                <button 
                                    className="edit-profile-btn"
                                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                                >
                                    Edit Profile
                                </button>
                                
                                <div className="favorite-team-section" ref={teamDropdownRef} style={{ position: 'relative' }}>
                                    {favoriteTeam ? (
                                        <div 
                                            className="favorite-team-tag has-team"
                                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                                        >
                                            ⭐ {favoriteTeam}
                                        </div>
                                    ) : (
                                        <div 
                                            className="favorite-team-tag dashed"
                                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                                        >
                                            + Add Favorite Team
                                        </div>
                                    )}
                                    
                                    {showTeamDropdown && (
                                        <div className="favorite-team-dropdown">
                                            <input
                                                type="text"
                                                placeholder="Search teams..."
                                                value={teamSearch}
                                                onChange={(e) => setTeamSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    marginBottom: '8px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg-primary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem'
                                                }}
                                                autoFocus
                                            />
                                            {filteredTeams.slice(0, 10).map(team => (
                                                <div 
                                                    key={team}
                                                    className="favorite-team-option"
                                                    onClick={() => handleSelectTeam(team)}
                                                >
                                                    {team}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditingAvatar && (
                            <div className="avatar-editor">
                                <div className="upload-section">
                                    <h4 className="editor-section-title">Upload Custom Avatar</h4>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleFileSelect}
                                        className="file-input-hidden"
                                        id="avatar-file-input"
                                    />
                                    
                                    {previewUrl ? (
                                        <div className="preview-container">
                                            <img src={previewUrl} alt="Preview" className="upload-preview" />
                                            <div className="preview-actions">
                                                <button 
                                                    className="upload-confirm-btn" 
                                                    onClick={handleUpload}
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? 'Uploading...' : '✓ Upload'}
                                                </button>
                                                <button 
                                                    className="upload-cancel-btn" 
                                                    onClick={cancelPreview}
                                                    disabled={isUploading}
                                                >
                                                    ✕ Cancel
                                                </button>
                                            </div>
                                            {isUploading && (
                                                <div className="progress-bar-container">
                                                    <div 
                                                        className="progress-bar-fill" 
                                                        style={{ width: `${uploadProgress}%` }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label htmlFor="avatar-file-input" className="upload-btn">
                                            📷 Choose Image
                                        </label>
                                    )}

                                    {uploadError && (
                                        <div className="upload-error">{uploadError}</div>
                                    )}

                                    {customImageUrl && !previewUrl && (
                                        <button 
                                            className="remove-custom-btn"
                                            onClick={handleRemoveCustomImage}
                                        >
                                            🗑️ Remove Custom Avatar
                                        </button>
                                    )}
                                </div>

                                <div className="preset-section">
                                    <h4 className="editor-section-title">Or Pick a Preset</h4>
                                    <div className="preset-grid">
                                        {PRESET_AVATARS.map(a => (
                                            <span 
                                                key={a} 
                                                className={`preset-avatar ${avatar === a && !customImageUrl ? 'active' : ''}`}
                                                onClick={() => handleSelectAvatar(a)}
                                            >
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="stats-grid">
                            <div className="stat-box">
                                <span className="stat-label">Total Balance</span>
                                <span className="stat-value balance">💰 {totalPoints}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Total Bets Placed</span>
                                <span className="stat-value bets">{bets.length}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Bets Won</span>
                                <span className="stat-value won">{totalWon}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Bets Lost</span>
                                <span className="stat-value lost">{totalLost}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-card">
                    <h3 className="bets-title">Betting History</h3>
                    <div className="bets-history">
                        {bets.length === 0 ? (
                            <div className="no-bets-message">
                                No bets placed yet. Go back to watch a match and place your first bet!
                            </div>
                        ) : (
                            <div className="bets-list">
                                {bets.map((bet, idx) => (
                                    <div key={idx} className={`bet-item ${bet.status}`}>
                                        <div className="bet-info">
                                            <span className="bet-match">{bet.matchTitle || bet.match} - <span style={{color: 'var(--accent-light)'}}>{bet.team || bet.selectedTeam}</span></span>
                                            <span className="bet-date">{new Date(bet.date || bet.placedAt || Date.now()).toLocaleDateString()} at {new Date(bet.date || bet.placedAt || Date.now()).toLocaleTimeString()}</span>
                                            <span className={`bet-status ${bet.status}`}>
                                                {bet.status}
                                            </span>
                                        </div>
                                        <div className="bet-details">
                                            <span className="bet-amount">{bet.amount || bet.betAmount} 💰</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
