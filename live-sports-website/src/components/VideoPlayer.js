import React, { useState, useEffect } from 'react';
import { fetchStream } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import useWatchPoints from '../hooks/useWatchPoints';
import useBetting from '../hooks/useBetting';
import BettingModal from './BettingModal';
import BetHistory from './BetHistory';

const VideoPlayer = ({ match, totalPoints, user, onPointsChange, onLoginRequired }) => {
    const [streams, setStreams] = useState([]);
    const [selectedStream, setSelectedStream] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showBettingModal, setShowBettingModal] = useState(false);
    const [showBetHistory, setShowBetHistory] = useState(false);
    const [matchStartTime, setMatchStartTime] = useState(null);
    const [bettingAllowed, setBettingAllowed] = useState(true);
    const [timeLeftForBetting, setTimeLeftForBetting] = useState(1200); // 20 minutes in seconds
    const watchPoints = useWatchPoints(!!match, user?.id);
    const betting = useBetting(user?.id);
    const BETTING_WINDOW = 1200; // 20 minutes in seconds

    useEffect(() => {
        // Set match start time from the actual match date
        if (match && match.date) {
            const matchDate = new Date(match.date).getTime();
            setMatchStartTime(matchDate);
        }
    }, [match?.id, match?.date]);

    // Track betting time window
    useEffect(() => {
        if (!matchStartTime) return;

        const checkBettingTime = () => {
            const elapsedSeconds = Math.floor((Date.now() - matchStartTime) / 1000);
            const timeLeft = Math.max(0, BETTING_WINDOW - elapsedSeconds);
            
            setTimeLeftForBetting(timeLeft);
            setBettingAllowed(timeLeft > 0);
        };

        checkBettingTime();
        const interval = setInterval(checkBettingTime, 1000);

        return () => clearInterval(interval);
    }, [matchStartTime]);

    useEffect(() => {
        if (!match || !match.sources || match.sources.length === 0) {
            setStreams([]);
            setSelectedStream(null);
            return;
        }

        // Generate odds for this match
        const homeTeam = match.teams?.home?.name || 'Home Team';
        const awayTeam = match.teams?.away?.name || 'Away Team';
        betting.generateOdds(match.id, homeTeam, awayTeam);

        const getStream = async () => {
            try {
                setLoading(true);
                setError(null);
                const source = match.sources[0];
                const data = await fetchStream(source.source, source.id);
                if (Array.isArray(data) && data.length > 0) {
                    setStreams(data);
                    setSelectedStream(data[0]);
                } else {
                    setError('No stream available');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getStream();
    }, [match]);

    if (!match) {
        return (
            <div className="player-container empty">
                <div className="empty-state">
                    <p>👈 Select a match from the list to watch</p>
                </div>
            </div>
        );
    }

    const homeTeam = match.teams?.home?.name || 'Home Team';
    const awayTeam = match.teams?.away?.name || 'Away Team';
    const date = match.date ? new Date(match.date).toLocaleString() : 'Live';
    const matchOdds = betting.odds[match.id] || { home: 2.0, away: 2.0, draw: 3.0, homeTeam, awayTeam };
    const currentPoints = user?.id ? (parseInt(localStorage.getItem(`userPoints_${user?.id}`)) || 0) : 0;

    const handlePlaceBet = async (selectedTeam, betAmount) => {
        if (!user?.id) {
            onLoginRequired?.();
            return;
        }

        const result = await betting.placeBet(
            match.id,
            match.title || `${homeTeam} vs ${awayTeam}`,
            homeTeam,
            awayTeam,
            betAmount,
            selectedTeam,
            matchOdds
        );

        if (result.success) {
            alert(result.message);
            setShowBettingModal(false);
            // Update parent component points
            if (onPointsChange) {
                onPointsChange();
            }
        } else {
            alert('Error: ' + result.message);
        }
    };

    return (
        <div className="player-container">
            <div className="player-header">
                <div className="player-title-section">
                    <h2>{match.title || `${homeTeam} vs ${awayTeam}`}</h2>
                    <p className="match-date">📅 {date}</p>
                </div>
                <div className="points-display">
                    <div className="total-points">
                        <span className="points-icon">💰</span>
                        <div className="points-info">
                            <p className="points-label">Points</p>
                            <p className="points-value">{currentPoints}</p>
                        </div>
                    </div>
                    {!watchPoints.windowFocused && (
                        <div className="warning-badge">⚠️ Window not focused</div>
                    )}
                    {watchPoints.isActive && (
                        <div className="active-badge">✅ Earning points</div>
                    )}
                </div>
                <div className="betting-controls">
                    <button 
                        className="btn-bet" 
                        onClick={() => {
                            if (!user?.id) {
                                onLoginRequired?.();
                            } else {
                                setShowBettingModal(true);
                            }
                        }}
                        disabled={!user?.id || !bettingAllowed}
                        title={!user?.id ? 'Login to place bets' : !bettingAllowed ? 'Betting closed after 20 minutes' : 'Place a bet'}
                    >
                        🎲 {user?.id ? 'Place Bet' : 'Login to Bet'}
                    </button>
                    {!user?.id && (
                        <div className="guest-badge">
                            🔒 Guest Mode
                        </div>
                    )}
                    {user?.id && !bettingAllowed && (
                        <div className="betting-closed-badge">
                            ⏱️ Betting closed
                        </div>
                    )}
                    {user?.id && bettingAllowed && (
                        <div className="betting-timer">
                            ⏱️ {Math.floor(timeLeftForBetting / 60)}:{String(timeLeftForBetting % 60).padStart(2, '0')}
                        </div>
                    )}
                    <button className="btn-history" onClick={() => {
                        if (!user?.id) {
                            onLoginRequired?.();
                        } else {
                            setShowBetHistory(true);
                        }
                    }}>
                        📊 Betting History
                    </button>
                </div>
                {streams.length > 1 && (
                    <div className="stream-selector">
                        <label>📡 Streams:</label>
                        <select 
                            value={streams.findIndex(s => s === selectedStream)} 
                            onChange={(e) => setSelectedStream(streams[parseInt(e.target.value)])}
                        >
                            {streams.map((stream, idx) => (
                                <option key={idx} value={idx}>
                                    {stream.language || `Stream ${stream.streamNo || idx + 1}`} {stream.hd ? '(HD)' : '(SD)'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading && <div className="loading">⏳ Loading stream...</div>}
            {error && <div className="error">⚠️ {error}</div>}

            {selectedStream && selectedStream.embedUrl ? (
                <div className="player-wrapper">
                    <iframe
                        src={selectedStream.embedUrl}
                        frameBorder="0"
                        allowFullScreen
                        title="Live Stream"
                    />
                </div>
            ) : !loading && (
                <div className="no-stream">📺 No stream available</div>
            )}

            {selectedStream && (
                <div className="stream-details">
                    <span className="stream-badge language">🎬 {selectedStream.language || 'Unknown'}</span>
                    {selectedStream.hd && <span className="stream-badge hd">📺 HD</span>}
                    {streams.length > 1 && <span className="stream-badge total">📡 {streams.length} Sources</span>}
                </div>
            )}

            <BettingModal 
                match={match}
                isOpen={showBettingModal}
                onClose={() => setShowBettingModal(false)}
                onPlaceBet={handlePlaceBet}
                userPoints={currentPoints}
                matchOdds={matchOdds}
                bettingAllowed={bettingAllowed}
                timeLeftForBetting={timeLeftForBetting}
                teamRatings={{
                    home: betting.getTeamRating(homeTeam),
                    away: betting.getTeamRating(awayTeam)
                }}
            />

            <BetHistory 
                bets={betting.bets}
                isOpen={showBetHistory}
                onClose={() => setShowBetHistory(false)}
            />
        </div>
    );
};

export default VideoPlayer;