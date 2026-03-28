import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MatchList from './components/MatchList';
import VideoPlayer from './components/VideoPlayer';
import Scoreboard from './components/Scoreboard';
import NotificationCenter from './components/NotificationCenter';
import LoginPage from './pages/LoginPage';
import AnimationDemo from './pages/AnimationDemo';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import AccountSettings from './components/AccountSettings';
import { useNotifications } from './hooks/useNotifications';
import { useScoreTracker } from './hooks/useScoreTracker';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { fetchMatches, sendHeartbeat, fetchTeamLogo } from './services/api';

const initializeDemoUser = () => {
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
        const demoUser = { id: '1', username: 'demo', password: 'demo123', createdAt: new Date().toISOString() };
        const demoUsers = [demoUser];
        localStorage.setItem('users', JSON.stringify(demoUsers));
        localStorage.setItem('userPoints_1', '1000');
        localStorage.setItem('userBets_1', JSON.stringify([]));
    }
};

initializeDemoUser();

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const sportsList = [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'american_football', name: 'American Football' },
    { id: 'fighting', name: 'Fights UFC/Boxing' },
];

const leagues = [
    { id: 'premier', name: 'Premier League' },
    { id: 'laliga', name: 'La Liga' },
    { id: 'serie', name: 'Serie A' },
    { id: 'bundesliga', name: 'Bundesliga' },
    { id: 'ligue1', name: 'Ligue 1' },
    { id: 'champions', name: 'Champions League' },
];

function Navbar({ user, onLogout, onOpenScoreboard, currentView, setCurrentView, selectedSport, onSelectSport, onSearch, showLeaguesDropdown, setShowLeaguesDropdown, theme, toggleTheme, isMobileMenuOpen, onToggleMobileMenu }) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef(null);
    
    const handleLogout = () => {
        setShowDropdown(false);
        onLogout();
        navigate('/login');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        onSearch?.(e.target.value);
    };

    const handleSportSelect = (sportId) => {
        onSelectSport?.(sportId);
        setShowDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="new-navbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                    className={`mobile-hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={() => onToggleMobileMenu(!isMobileMenuOpen)}
                    aria-label="Open menu"
                >
                    <div className="hamburger-icon">
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </div>
                </button>
                <div className="new-navbar-logo animate-subtle" onClick={() => setCurrentView('home')}>
                    <img src={theme === 'light' ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="Sporkey" />
                </div>
            </div>
            
            <div className="new-navbar-center">
                <a 
                    className={currentView === 'home' ? 'active' : ''}
                    onClick={() => setCurrentView('home')}
                >
                    Matches
                </a>
                <div className="nav-dropdown-container animate-subtle-up animate-delay-1" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <a 
                        onClick={() => setShowLeaguesDropdown(!showLeaguesDropdown)}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                        Sports ▾
                    </a>
                    {showLeaguesDropdown && (
                        <div className="sports-dropdown" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '10px', border: '1px solid var(--accent)', borderRadius: '8px', padding: '10px', minWidth: '180px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {sportsList.map(sport => {
                                const isSelected = selectedSport === sport.id;
                                return (
                                <button
                                    key={sport.id}
                                    onClick={() => handleSportSelect(sport.id)}
                                    className={isSelected ? 'sport-selected' : ''}
                                    style={{ 
                                        background: isSelected ? 'var(--accent)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 14px',
                                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontFamily: 'League Spartan',
                                        fontSize: '0.95rem',
                                        fontWeight: isSelected ? '600' : '400'
                                    }}
                                >
                                    {sport.name}
                                </button>
                            );})}
                        </div>
                    )}
                </div>
                <a className="active" href="#">Live Now</a>
            </div>
            
            <div className="new-navbar-right">
                <div ref={searchRef} style={{ position: 'relative' }}>
                    <button className="new-navbar-scoreboard-btn" onClick={() => setShowSearch(!showSearch)} style={{ background: 'none', border: 'none', padding: '24px 10px' }}>
                        Search
                    </button>
                    {showSearch && (
                        <div className="search-overlay" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', zIndex: 9999, minWidth: '250px' }}>
                            <input 
                                type="text" 
                                placeholder="Search teams or matches..." 
                                value={searchTerm}
                                onChange={handleSearchChange}
                                autoFocus
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'League Spartan' }}
                            />
                        </div>
                    )}
                </div>
                <button className="new-navbar-scoreboard-btn" onClick={onOpenScoreboard} style={{ background: 'none', border: 'none' }}>
                    Scoreboard
                </button>
                <label className="theme-toggle-switch" title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <input 
                        type="checkbox" 
                        checked={theme === 'light'} 
                        onChange={toggleTheme} 
                    />
                    <span className="theme-toggle-slider"></span>
                </label>
                
                {user?.id ? (
                    <div style={{ position: 'relative' }}>
                        <div 
                            className="new-navbar-avatar"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className={`avatar-dropdown ${showDropdown ? 'show' : ''}`} style={{ position: 'fixed', zIndex: 9999 }}>
                            <button 
                                className="avatar-dropdown-item"
                                onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                            >
                                My Profile
                            </button>
                            <button 
                                className="avatar-dropdown-item"
                                onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                            >
                                Settings
                            </button>
                            <button 
                                className="avatar-dropdown-item danger"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        className="new-hero-watch-btn"
                        style={{ padding: '10px 24px', marginLeft: '10px' }}
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
}

function Sidebar({ selectedSport, onSelectSport, isCollapsed, onToggleCollapse }) {
    const [activeLeague, setActiveLeague] = useState('premier');
    
    return (
        <aside className={`new-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button className="sidebar-toggle" onClick={onToggleCollapse}>
                {isCollapsed ? '▶' : '◀'}
            </button>
            
            {!isCollapsed && (
                <div className="new-sidebar-header">
                    <h3>Leagues</h3>
                    <p>Quick Access</p>
                </div>
            )}
            
            {leagues.map(league => (
                <button
                    key={league.id}
                    className={`new-sidebar-league ${activeLeague === league.id ? 'active' : ''}`}
                    onClick={() => setActiveLeague(league.id)}
                >
                    {!isCollapsed && <span className="league-name">{league.name}</span>}
                </button>
            ))}
            
            {!isCollapsed && (
                <div className="new-sidebar-footer">
                    <button className="new-view-all-btn">VIEW ALL LEAGUES</button>
                </div>
            )}
        </aside>
    );
}

function HeroSection({ match, onWatchMatch }) {
    const [fetchedLogos, setFetchedLogos] = useState({ home: null, away: null });
    
    const homeTeamName = match?.teams?.home?.name || match?.homeTeam || '';
    const awayTeamName = match?.teams?.away?.name || match?.awayTeam || '';
    const homeTeamLogo = match?.teams?.home?.logo || match?.homeTeamLogo || fetchedLogos.home;
    const awayTeamLogo = match?.teams?.away?.logo || match?.awayTeamLogo || fetchedLogos.away;
    const homeScore = match?.homeScore ?? match?.scores?.home ?? null;
    const awayScore = match?.awayScore ?? match?.scores?.away ?? null;
    const isLive = match?.live === true || match?.status === 'live' || match?.isLive === true;
    const matchMinute = match?.minute || match?.time?.minute || null;
    const matchStatus = match?.status || match?.time?.status || '';
    const stats = match?.stats || match?.statistics || null;
    
    useEffect(() => {
        const loadLogos = async () => {
            if (!match) return;
            
            const newLogos = { home: null, away: null };
            
            // Try to fetch logos if not already in API response
            if (!match?.teams?.home?.logo && !match?.homeTeamLogo && homeTeamName) {
                newLogos.home = await fetchTeamLogo(homeTeamName);
            }
            if (!match?.teams?.away?.logo && !match?.awayTeamLogo && awayTeamName) {
                newLogos.away = await fetchTeamLogo(awayTeamName);
            }
            
            if (newLogos.home || newLogos.away) {
                setFetchedLogos(prev => ({
                    home: newLogos.home || prev.home,
                    away: newLogos.away || prev.away
                }));
            }
        };
        
        loadLogos();
    }, [match?.id, homeTeamName, awayTeamName]);
    
    const hasStats = stats && (
        (stats.possession?.home !== undefined) ||
        (stats.shots?.home !== undefined) ||
        (stats.shotsOnTarget?.home !== undefined)
    );
    
    const getStatusBadge = () => {
        if (isLive && matchMinute) {
            return (
                <div className="new-live-badge">
                    <span className="dot"></span>
                    <span>LIVE • {matchMinute}TH MINUTE</span>
                </div>
            );
        }
        if (matchStatus === 'finished' || matchStatus === 'FT' || matchStatus === 'Full Time') {
            return (
                <div className="new-live-badge" style={{ background: '#333' }}>
                    <span>FINISHED</span>
                </div>
            );
        }
        if (matchStatus === 'upcoming' || match?.date) {
            const matchTime = match?.date ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
                <div className="new-live-badge" style={{ background: '#2563eb' }}>
                    <span>UPCOMING {matchTime ? `• ${matchTime}` : ''}</span>
                </div>
            );
        }
        return null;
    };
    
    const TeamLogo = ({ name, logo }) => {
        if (logo) {
            return <img src={logo} alt={name} />;
        }
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return (
            <div className="team-initial-circle">
                {initial}
            </div>
        );
    };
    
    if (!match) {
        return (
            <section className="new-hero-section">
                <div className="new-hero-bg" style={{ backgroundImage: 'url(/images/screen.jpg)' }}></div>
                <div className="new-hero-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
                <div className="new-hero-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p className="new-hero-placeholder animate-subtle" style={{ textAlign: 'center' }}>Select a match to watch</p>
                </div>
            </section>
        );
    }
    
    return (
        <section className="new-hero-section">
            <div className="new-hero-bg" style={{ backgroundImage: 'url(/images/screen.jpg)' }}></div>
            <div className="new-hero-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
            
            {getStatusBadge()}
            
            <div className="new-hero-content">
                <div className="new-hero-team animate-subtle-up animate-delay-1">
                    <div className="new-hero-team-logo">
                        <TeamLogo name={homeTeamName} logo={homeTeamLogo} />
                    </div>
                    <span className="new-hero-team-name">{homeTeamName}</span>
                </div>
                
                <div className="new-hero-score animate-subtle-up animate-delay-2">
                    <div className="new-hero-score-display">
                        <span className="new-hero-score-value">{homeScore !== null ? homeScore : '-'}</span>
                        <span className="new-hero-score-divider">:</span>
                        <span className="new-hero-score-value">{awayScore !== null ? awayScore : '-'}</span>
                    </div>
                    
                    {hasStats && (
                        <div className="new-hero-stats">
                            {stats.possession?.home !== undefined && (
                                <div className="new-hero-stat">
                                    <p className="new-hero-stat-label">Possession</p>
                                    <p className="new-hero-stat-value">{stats.possession.home}%</p>
                                </div>
                            )}
                            {stats.shots?.home !== undefined && (
                                <div className="new-hero-stat">
                                    <p className="new-hero-stat-label">Shots</p>
                                    <p className="new-hero-stat-value">{stats.shots.home}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <button className="new-hero-watch-btn animate-hover-lift" onClick={onWatchMatch}>
                        WATCH NOW
                    </button>
                </div>
                
                <div className="new-hero-team animate-subtle-up animate-delay-3">
                    <div className="new-hero-team-logo">
                        <TeamLogo name={awayTeamName} logo={awayTeamLogo} />
                    </div>
                    <span className="new-hero-team-name">{awayTeamName}</span>
                </div>
            </div>
        </section>
    );
}

function AppContent({ user, logout }) {
    const [currentView, setCurrentView] = useState('home');
    const [selectedSport, setSelectedSport] = useState('football');
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLeaguesDropdown, setShowLeaguesDropdown] = useState(false);
    const { theme, toggleTheme, isDarkMode } = useTheme();
    const [totalPoints, setTotalPoints] = useState(0);
    const [liveMatches, setLiveMatches] = useState([]);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [userAvatar, setUserAvatar] = useState('👤');
    const [userProfileImage, setUserProfileImage] = useState(null);
    const { notifications, addNotification, removeNotification } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        const loadMatches = async () => {
            try {
                const matches = await fetchMatches(selectedSport);
                setLiveMatches(matches);
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        };
        loadMatches();
        const interval = setInterval(loadMatches, 10000);
        return () => clearInterval(interval);
    }, [selectedSport]);

    useScoreTracker(liveMatches, (goalData) => {
        addNotification({
            type: 'goal',
            team: goalData.team,
            opponent: goalData.team,
            matchTitle: goalData.matchTitle,
            homeTeam: goalData.homeTeam,
            awayTeam: goalData.awayTeam,
            homeScore: goalData.homeScore,
            awayScore: goalData.awayScore,
            minute: goalData.minute
        });
    });

    useEffect(() => {
        if (user?.id) {
            const saved = parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0;
            setTotalPoints(saved);
            
            const savedAvatar = localStorage.getItem(`userAvatar_${user?.id}`);
            if (savedAvatar) setUserAvatar(savedAvatar);

            const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (storedUser.profileImageUrl) setUserProfileImage(storedUser.profileImageUrl);

            const handleStorageChange = () => {
                const updated = parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0;
                setTotalPoints(updated);
                
                const updatedAvatar = localStorage.getItem(`userAvatar_${user?.id}`);
                if (updatedAvatar) setUserAvatar(updatedAvatar);

                const updatedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                setUserProfileImage(updatedUser.profileImageUrl || null);
            };

            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (user?.id) {
            sendHeartbeat();
            const interval = setInterval(sendHeartbeat, 60000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const sports = [
        { id: 'football', name: '⚽ Football', icon: '⚽' },
        { id: 'basketball', name: '🏀 Basketball', icon: '🏀' },
    ];

    const handleWatchMatch = () => {
        if (!user?.id) {
            return;
        }
        setCurrentView('video');
    };

    return (
        <div className="app">
            <NotificationCenter 
                notifications={notifications} 
                onRemove={removeNotification}
            />
            
            <Navbar 
                user={user} 
                onLogout={logout}
                onOpenScoreboard={() => setShowScoreboard(true)}
                currentView={currentView}
                setCurrentView={setCurrentView}
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
                onSearch={setSearchTerm}
                showLeaguesDropdown={showLeaguesDropdown}
                setShowLeaguesDropdown={setShowLeaguesDropdown}
                theme={theme}
                toggleTheme={toggleTheme}
                isMobileMenuOpen={isMobileMenuOpen}
                onToggleMobileMenu={setIsMobileMenuOpen}
            />
            
            <Sidebar 
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            <main className={`new-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
                <HeroSection 
                    match={selectedMatch || liveMatches[0]} 
                    onWatchMatch={handleWatchMatch}
                />
                
                {currentView === 'home' && (
                    <>
                        <MatchList sport={selectedSport} onSelectMatch={setSelectedMatch} searchTerm={searchTerm} />
                        <VideoPlayer 
                            match={selectedMatch}
                            totalPoints={totalPoints}
                            user={user}
                            onPointsChange={() => {
                                if (user?.id) {
                                    const updated = parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0;
                                    setTotalPoints(updated);
                                }
                            }}
                        />
                    </>
                )}
                
                {currentView === 'video' && (
                    <div style={{ padding: '20px' }}>
                        <button 
                            onClick={() => setCurrentView('home')}
                            style={{ 
                                background: 'rgba(107, 33, 168, 0.2)', 
                                border: '1px solid rgba(107, 33, 168, 0.3)',
                                color: '#a07dff',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '20px',
                                fontFamily: 'League Spartan'
                            }}
                        >
                            ← Back to Home
                        </button>
                        <VideoPlayer 
                            match={selectedMatch || liveMatches[0]}
                            totalPoints={totalPoints}
                            user={user}
                            onPointsChange={() => {
                                if (user?.id) {
                                    const updated = parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0;
                                    setTotalPoints(updated);
                                }
                            }}
                        />
                    </div>
                )}
                
                {currentView === 'admin' && (
                    <AdminDashboard user={user} onBack={() => setCurrentView('home')} />
                )}
            </main>
            
            <Scoreboard isOpen={showScoreboard} onClose={() => setShowScoreboard(false)} />
            
            {/* Mobile Bottom Sheet Drawer */}
            <div 
                className={`bottom-sheet-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className={`mobile-bottom-sheet ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="bottom-sheet-header">
                    <h3>Menu</h3>
                    <button 
                        className="bottom-sheet-close"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                
                {user?.id ? (
                    <div className="mobile-user-section">
                        <div className="mobile-user-avatar">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="mobile-user-info">
                            <div className="mobile-user-name">{user?.username}</div>
                            <div className="mobile-user-role">{user?.role}</div>
                        </div>
                    </div>
                ) : (
                    <div className="mobile-user-section">
                        <button 
                            className="mobile-nav-item"
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #6B21A8, #9333EA)' }}
                        >
                            <span className="nav-icon">🔑</span>
                            <span className="nav-text">Login / Sign Up</span>
                        </button>
                    </div>
                )}
                
                <div className="mobile-sidebar-section">
                    <h4>Navigation</h4>
                    <a 
                        className={`mobile-nav-item ${currentView === 'home' ? 'active' : ''}`}
                        onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}
                    >
                        <span className="nav-icon">⚽</span>
                        <span className="nav-text">Matches</span>
                    </a>
                    <a 
                        className="mobile-nav-item"
                        onClick={() => { setShowScoreboard(true); setIsMobileMenuOpen(false); }}
                    >
                        <span className="nav-icon">📊</span>
                        <span className="nav-text">Scoreboard</span>
                    </a>
                    {user?.role === 'admin' && (
                        <a 
                            className="mobile-nav-item"
                            onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                        >
                            <span className="nav-icon">⚙️</span>
                            <span className="nav-text">Admin Dashboard</span>
                        </a>
                    )}
                </div>
                
                <div className="mobile-sidebar-section">
                    <h4>Sports</h4>
                    {sportsList.map(sport => (
                        <button
                            key={sport.id}
                            className={`mobile-nav-item ${selectedSport === sport.id ? 'active' : ''}`}
                            onClick={() => { setSelectedSport(sport.id); setIsMobileMenuOpen(false); }}
                        >
                            <span className="nav-icon">🏆</span>
                            <span className="nav-text">{sport.name}</span>
                        </button>
                    ))}
                </div>
                
                <div className="mobile-sidebar-section">
                    <h4>Account</h4>
                    {user?.id && (
                        <>
                            <a 
                                className="mobile-nav-item"
                                onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                            >
                                <span className="nav-icon">👤</span>
                                <span className="nav-text">My Profile</span>
                            </a>
                            <a 
                                className="mobile-nav-item"
                                onClick={() => { setIsMobileMenuOpen(false); navigate('/settings'); }}
                            >
                                <span className="nav-icon">🔧</span>
                                <span className="nav-text">Settings</span>
                            </a>
                            <button 
                                className="mobile-nav-item"
                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                style={{ color: '#ff6b6b' }}
                            >
                                <span className="nav-icon">🚪</span>
                                <span className="nav-text">Logout</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProtectedRoute({ children, user }) {
    if (!user?.id) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function App() {
    const { user, isLoading, login, register, logout } = useAuth();

    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
            alert('Session expired, please login again');
        };
        
        const handleUserLoggedIn = () => {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                window.location.reload();
            }
        };
        
        window.addEventListener('sessionExpired', handleSessionExpired);
        window.addEventListener('userLoggedIn', handleUserLoggedIn);
        
        return () => {
            window.removeEventListener('sessionExpired', handleSessionExpired);
            window.removeEventListener('userLoggedIn', handleUserLoggedIn);
        };
    }, [logout]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1.2em',
                fontFamily: 'League Spartan'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user?.id ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/animation-demo" element={<AnimationDemo />} />
            <Route path="/" element={
                <AppContent user={user} logout={logout} />
            } />
            <Route path="/profile" element={
                <ProtectedRoute user={user}>
                    <UserProfile user={user} totalPoints={parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0} onBack={() => window.history.back()} />
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute user={user}>
                    <AccountSettings
                        user={user}
                        onBack={() => window.history.back()}
                        onAccountDeleted={() => {
                            logout();
                            navigate('/login');
                        }}
                    />
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default App;
