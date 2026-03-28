import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchMatches, getFavorites, addFavorite, removeFavorite } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Constants moved outside component to prevent recreation
const CHAMPIONS_LEAGUE_KEYWORDS = ['champions league', 'ucl', 'c1', 'european cup'];
const TOP_LEAGUES = ['Premier League', 'Ligue 1', 'La Liga', 'Bundesliga', 'Serie A'];
const LEAGUE_COLORS = {
    'Champions League': '#0052CC',
    'Premier League': '#3d195b',
    'Ligue 1': '#1e3050',
    'La Liga': '#005bb3',
    'Bundesliga': '#d41028',
    'Serie A': '#003d82'
};

// Reusable Match Section Component with Navigation Arrows
const MatchSection = ({ title, children, matchCount }) => {
    const gridRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(matchCount > 4);

    const checkScroll = () => {
        if (gridRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = gridRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const grid = gridRef.current;
        if (grid) {
            grid.addEventListener('scroll', checkScroll);
            return () => grid.removeEventListener('scroll', checkScroll);
        }
    }, []);

    const scroll = (direction) => {
        if (gridRef.current) {
            const scrollDistance = 400;
            gridRef.current.scrollBy({
                left: direction === 'left' ? -scrollDistance : scrollDistance,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="match-section-wrapper">
            <h2 className="section-title">{title}</h2>
            <div className="match-grid-container">
                {showLeftArrow && (
                    <button 
                        className="scroll-arrow scroll-arrow-left" 
                        onClick={() => scroll('left')}
                        title="Scroll left"
                    >
                        ‹
                    </button>
                )}
                <div className="matches-grid" ref={gridRef}>
                    {children}
                </div>
                {showRightArrow && (
                    <button 
                        className="scroll-arrow scroll-arrow-right" 
                        onClick={() => scroll('right')}
                        title="Scroll right"
                    >
                        ›
                    </button>
                )}
            </div>
        </div>
    );
};

const MatchList = ({ sport, onSelectMatch, user, searchTerm = '' }) => {
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [championsLeagueMatches, setChampionsLeagueMatches] = useState([]);
    const [topLeagueMatches, setTopLeagueMatches] = useState([]);
    const [otherMatches, setOtherMatches] = useState([]);
    const [allFetchedMatches, setAllFetchedMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [leagueFilter, setLeagueFilter] = useState('All');
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (user?.id) {
            getFavorites().then(f => setFavorites(f.map(fav => fav.referenceId))).catch(console.error);
        } else {
            setFavorites([]);
        }
    }, [user?.id]);

    const toggleFavorite = async (e, matchId) => {
        e.stopPropagation();
        if (!user?.id) {
            alert('Please login to favorite matches');
            return;
        }
        try {
            if (favorites.includes(matchId)) {
                await removeFavorite(matchId);
                setFavorites(prev => prev.filter(id => id !== matchId));
            } else {
                await addFavorite(matchId, 'match');
                setFavorites(prev => [...prev, matchId]);
            }
        } catch (err) {
            console.error('Error toggling favorite', err);
        }
    };

    // Check if a match is actually live/ongoing
    const isLiveMatch = (match) => {
        if (!match) return false;
        
        // Check if match has live status
        if (match.live === true || match.status === 'live' || match.isLive === true) {
            return true;
        }
        
        // Check if match time is now or in the future (within 2 hours)
        if (match.date) {
            const matchTime = new Date(match.date).getTime();
            const now = new Date().getTime();
            const twoHoursAgo = now - (2 * 60 * 60 * 1000);
            const twoHoursFromNow = now + (2 * 60 * 60 * 1000);
            
            // Only show matches that started in the last 2 hours or are starting within 2 hours
            if (matchTime >= twoHoursAgo && matchTime <= twoHoursFromNow) {
                return true;
            }
        }
        
        return false;
    };

    // Check if a match is upcoming (next 30 minutes to 2 hours)
    const isUpcomingMatch = (match) => {
        if (!match || !match.date) return false;
        
        // Don't show already live matches
        if (isLiveMatch(match)) return false;
        
        const matchTime = new Date(match.date).getTime();
        const now = new Date().getTime();
        const thirtyMinutesFromNow = now + (30 * 60 * 1000);
        const twoHoursFromNow = now + (2 * 60 * 60 * 1000);
        
        // Show matches starting within 30 minutes to 2 hours
        return matchTime >= thirtyMinutesFromNow && matchTime <= twoHoursFromNow;
    };

    // Calculate time until match starts (returns string like "45m" or "1h 30m")
    const getTimeUntilMatch = (matchDate) => {
        if (!matchDate) return '';
        const matchTime = new Date(matchDate).getTime();
        const now = new Date().getTime();
        const diffMs = matchTime - now;
        const diffMinutes = Math.floor(diffMs / 60000);
        
        if (diffMinutes < 1) return 'Starting...';
        if (diffMinutes < 60) return `${diffMinutes}m`;
        
        const hours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    };

    const isChampionsLeagueMatch = (title) => {
        if (!title) return false;
        const lowerTitle = title.toLowerCase();
        return CHAMPIONS_LEAGUE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
    };

    const getLeagueFromTitle = (title) => {
        if (!title) return null;
        for (let league of TOP_LEAGUES) {
            if (title.toLowerCase().includes(league.toLowerCase())) {
                return league;
            }
        }
        return null;
    };

    const getLeagueColor = (league) => {
        return LEAGUE_COLORS[league] || '#667eea';
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchMatches(sport);
                setAllFetchedMatches(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [sport]);

    useEffect(() => {
        let allMatches = [...allFetchedMatches];
        
        // --- Apply Search and Filters ---
        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            allMatches = allMatches.filter(m => 
                (m.teams?.home?.name?.toLowerCase().includes(lowerSearch) || false) ||
                (m.teams?.away?.name?.toLowerCase().includes(lowerSearch) || false) ||
                (m.title?.toLowerCase().includes(lowerSearch) || false)
            );
        }
        if (leagueFilter !== 'All') {
            if (leagueFilter === 'Champions League') {
                allMatches = allMatches.filter(m => isChampionsLeagueMatch(m.title));
            } else if (leagueFilter === 'Other') {
                allMatches = allMatches.filter(m => !isChampionsLeagueMatch(m.title) && !getLeagueFromTitle(m.title));
            } else if (leagueFilter === 'Favorites') {
                allMatches = allMatches.filter(m => favorites.includes(m.id));
            } else {
                allMatches = allMatches.filter(m => getLeagueFromTitle(m.title) === leagueFilter);
            }
        }
        // ---------------------------------

        // Separate upcoming and live matches
        const upcomingList = allMatches.filter(match => isUpcomingMatch(match));
        const liveList = allMatches.filter(match => isLiveMatch(match));
        
        // Sort upcoming matches by time
        upcomingList.sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return timeA - timeB;
        });
        setUpcomingMatches(upcomingList.slice(0, 15));
        
        let matches = liveList;

        if (sport === 'football') {
            // Separate Champions League matches
            const cl = matches.filter(match => isChampionsLeagueMatch(match.title));
            
            // Separate top league matches
            const topLeagues = matches.filter(
                match => !isChampionsLeagueMatch(match.title) && getLeagueFromTitle(match.title)
            );
            
            // Other matches
            const other = matches.filter(
                match => !isChampionsLeagueMatch(match.title) && !getLeagueFromTitle(match.title)
            );

            // Sort by popularity
            cl.sort((a, b) => {
                const aScore = (a.popular ? 100 : 0) + (a.sources?.length || 0);
                const bScore = (b.popular ? 100 : 0) + (b.sources?.length || 0);
                return bScore - aScore;
            });

            topLeagues.sort((a, b) => {
                const leagueA = getLeagueFromTitle(a.title);
                const leagueB = getLeagueFromTitle(b.title);
                return TOP_LEAGUES.indexOf(leagueA) - TOP_LEAGUES.indexOf(leagueB);
            });

            other.sort((a, b) => {
                const aScore = (a.popular ? 100 : 0) + (a.sources?.length || 0);
                const bScore = (b.popular ? 100 : 0) + (b.sources?.length || 0);
                return bScore - aScore;
            });

            setChampionsLeagueMatches(cl.slice(0, 8));
            setTopLeagueMatches(topLeagues.slice(0, 10));
            setOtherMatches(other.slice(0, 12));
        } else {
            setChampionsLeagueMatches([]);
            setTopLeagueMatches([]);
            setOtherMatches(matches.slice(0, 30));
        }
    }, [allFetchedMatches, sport, searchTerm, leagueFilter, favorites]);

    const getPosterUrl = (poster) => {
        if (!poster) return null;
        if (poster.startsWith('http')) return poster;
        return `https://streamed.pk${poster}.webp`;
    };

    const UpcomingMatchCard = ({ match, animationDelay = 0 }) => {
        const homeTeam = match.teams?.home?.name || 'Team A';
        const awayTeam = match.teams?.away?.name || 'Team B';
        const poster = getPosterUrl(match.poster);
        const time = match.date ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const timeUntil = getTimeUntilMatch(match.date);
        
        const getDelayClass = () => {
            if (animationDelay <= 0) return 'animate-subtle-up';
            if (animationDelay === 1) return 'animate-subtle-up animate-delay-1';
            if (animationDelay === 2) return 'animate-subtle-up animate-delay-2';
            return 'animate-subtle-up animate-delay-3';
        };

        return (
            <div 
                className="match-card upcoming-match-card animate-hover-lift"
                onClick={() => onSelectMatch(match)}
            >
                <div className="match-card-image">
                    {poster ? (
                        <>
                            <img src={poster} alt={match.title} />
                            {user?.id && (
                                <button className="favorite-btn" onClick={(e) => toggleFavorite(e, match.id)} style={{position: 'absolute', top: 10, left: 10, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10}}>
                                    {favorites.includes(match.id) ? '⭐' : '☆'}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="match-card-placeholder">
                            <div className="team-logos-small">
                                <span className="team-initial">{homeTeam.charAt(0)}</span>
                                <span className="vs-separator">VS</span>
                                <span className="team-initial">{awayTeam.charAt(0)}</span>
                            </div>
                        </div>
                    )}
                    <div className="upcoming-badge">⏱️ UPCOMING</div>
                    {time && <div className="match-time">{time}</div>}
                    <div className="countdown-badge">{timeUntil}</div>
                </div>
                <div className="match-card-info">
                    <p className="match-teams">{homeTeam} vs {awayTeam}</p>
                    <p className="match-title">{match.title}</p>
                </div>
            </div>
        );
    };

    const MatchCard = ({ match, isPremium, category, league, animationDelay = 0 }) => {
        const homeTeam = match.teams?.home?.name || 'Team A';
        const awayTeam = match.teams?.away?.name || 'Team B';
        const poster = getPosterUrl(match.poster);
        const time = match.date ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        
        const getDelayClass = () => {
            if (animationDelay <= 0) return 'animate-subtle-up';
            if (animationDelay === 1) return 'animate-subtle-up animate-delay-1';
            if (animationDelay === 2) return 'animate-subtle-up animate-delay-2';
            if (animationDelay === 3) return 'animate-subtle-up animate-delay-3';
            if (animationDelay === 4) return 'animate-subtle-up animate-delay-4';
            return 'animate-subtle-up animate-delay-5';
        };

        return (
            <div 
                className={`match-card ${isPremium ? 'premium-match' : ''} animate-hover-lift ${getDelayClass()}`}
                onClick={() => onSelectMatch(match)}
                style={isPremium ? { borderLeftColor: getLeagueColor(category) } : {}}
            >
                {isPremium && (
                    <div className="premium-badge" style={{ backgroundColor: getLeagueColor(category) }}>
                        {category === 'Champions League' ? '👑' : '⭐'} {category}
                    </div>
                )}
                <div className="match-card-image">
                    {user?.id && (
                        <button className="favorite-btn" onClick={(e) => toggleFavorite(e, match.id)} style={{position: 'absolute', top: 10, left: 10, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10}}>
                            {favorites.includes(match.id) ? '⭐' : '☆'}
                        </button>
                    )}
                    {poster ? (
                        <img src={poster} alt={match.title} />
                    ) : (
                        <div className="match-card-placeholder">
                            <div className="team-logos-small">
                                <span className="team-initial">{homeTeam.charAt(0)}</span>
                                <span className="vs-separator">VS</span>
                                <span className="team-initial">{awayTeam.charAt(0)}</span>
                            </div>
                        </div>
                    )}
                    <div className="live-badge">🔴 LIVE</div>
                    {time && <div className="match-time">{time}</div>}
                    <div className="streams-badge">{match.sources?.length || 0} 📡</div>
                </div>
                <div className="match-card-info">
                    <p className="match-teams">{homeTeam} vs {awayTeam}</p>
                    <p className="match-title">{match.title}</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="matches-container"><div className="loading">⏳ Loading live matches...</div></div>;
    }

    if (error) {
        return <div className="matches-container"><div className="error">Error: {error}</div></div>;
    }

    const totalMatches = championsLeagueMatches.length + topLeagueMatches.length + otherMatches.length;

    return (
        <div className="matches-container">
            {/* Up Next Section - ALWAYS ON TOP */}
            {upcomingMatches.length > 0 && (
                <MatchSection title="⏱️ Up Next" matchCount={upcomingMatches.length}>
                    {upcomingMatches.map((match, index) => (
                        <UpcomingMatchCard key={match.id} match={match} animationDelay={index} />
                    ))}
                </MatchSection>
            )}

            {/* Champions League Section - ALWAYS ON TOP */}
            {championsLeagueMatches.length > 0 && (
                <MatchSection title="👑 UEFA Champions League" matchCount={championsLeagueMatches.length}>
                    {championsLeagueMatches.map((match, index) => (
                        <MatchCard 
                            key={match.id} 
                            match={match} 
                            isPremium={true}
                            category="Champions League"
                            animationDelay={index}
                        />
                    ))}
                </MatchSection>
            )}

            {/* Top 5 Leagues Section */}
            {topLeagueMatches.length > 0 && (
                <MatchSection title="🏆 Top 5 Leagues" matchCount={topLeagueMatches.length}>
                    {topLeagueMatches.map((match, index) => (
                        <MatchCard 
                            key={match.id} 
                            match={match} 
                            isPremium={true}
                            category={getLeagueFromTitle(match.title)}
                            animationDelay={index}
                        />
                    ))}
                </MatchSection>
            )}

            {/* Other Matches Section */}
            {otherMatches.length > 0 && (
                <MatchSection title="🎯 More Matches" matchCount={otherMatches.length}>
                    {otherMatches.map((match, index) => (
                        <MatchCard 
                            key={match.id} 
                            match={match} 
                            isPremium={false}
                            animationDelay={index}
                        />
                    ))}
                </MatchSection>
            )}

            {totalMatches === 0 && (
                <div className="no-matches">📺 No live matches available at the moment</div>
            )}
        </div>
    );
};

export default React.memo(MatchList);