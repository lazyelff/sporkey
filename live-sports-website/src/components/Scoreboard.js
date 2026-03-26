import React, { useState } from 'react';
import { useScoreboard } from '../hooks/useScoreboard';
import { useUserLeaderboard } from '../hooks/useUserLeaderboard';
import { useAuth } from '../hooks/useAuth';
import '../styles/Scoreboard.css';

function Scoreboard({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('leaderboard');
    const { user } = useAuth();
    const { userPoints } = useScoreboard(user?.id);
    const { getLeaderboard, getTopUsers, getCurrentUserRank } = useUserLeaderboard(user?.id);

    if (!isOpen) return null;

    return (
        <>
            <div className="scoreboard-overlay" onClick={onClose}></div>
            <div className="scoreboard-modal">
                <div className="scoreboard-header">
                    <h2>USER LEADERBOARD</h2>
                    <div className="scoreboard-header-right">
                        <div className="scoreboard-current-points">
                            <span className="points-label">Your Rank:</span>
                            <span className="points-value">#{getCurrentUserRank.rank}</span>
                        </div>
                        <button className="scoreboard-close-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="scoreboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaderboard')}
                    >
                        Full Leaderboard
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'top10' ? 'active' : ''}`}
                        onClick={() => setActiveTab('top10')}
                    >
                        Top 10
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'myStats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('myStats')}
                    >
                        My Stats
                    </button>
                </div>

                <div className="scoreboard-content">
                    {activeTab === 'leaderboard' && (
                        <>
                            {getLeaderboard.length > 0 ? (
                                <div className="scoreboard-list">
                                    <div className="list-header">
                                        <div className="col-rank">Rank</div>
                                        <div className="col-username">Player</div>
                                        <div className="col-points">Points</div>
                                        <div className="col-bets">Bets</div>
                                        <div className="col-stats">W/L</div>
                                        <div className="col-winrate">Win%</div>
                                    </div>
                                    {getLeaderboard.map((user, idx) => (
                                        <div
                                            key={idx}
                                            className={`list-row ${user.isCurrentUser ? 'current-user' : ''}`}
                                        >
                                            <div className="col-rank">
                                                <span className="rank-badge">{user.rank}</span>
                                            </div>
                                            <div className="col-username">
                                                <span className="username-text">{user.username}</span>
                                                {user.isCurrentUser && <span className="you-badge">YOU</span>}
                                            </div>
                                            <div className="col-points">
                                                <span className="points-badge">{user.points.toLocaleString()}</span>
                                            </div>
                                            <div className="col-bets">{user.totalBets}</div>
                                            <div className="col-stats">
                                                <span className="wins-badge">{user.wins}</span>
                                                <span className="losses-badge">{user.losses}</span>
                                            </div>
                                            <div className="col-winrate">{user.winRate}%</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No users yet</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'top10' && (
                        <>
                            <div className="current-period-card">
                                <div className="period-card-header">
                                    <h3>TOP 10 PLAYERS</h3>
                                </div>
                            </div>
                            {getTopUsers.length > 0 ? (
                                <div className="scoreboard-list">
                                    <div className="list-header">
                                        <div className="col-rank">Rank</div>
                                        <div className="col-username">Player</div>
                                        <div className="col-points">Points</div>
                                        <div className="col-bets">Bets</div>
                                        <div className="col-stats">W/L</div>
                                        <div className="col-winrate">Win%</div>
                                    </div>
                                    {getTopUsers.map((user, idx) => (
                                        <div
                                            key={idx}
                                            className={`list-row top-user ${user.isCurrentUser ? 'current-user' : ''}`}
                                        >
                                            <div className="col-rank">
                                                <span className={`rank-badge rank-${user.rank}`}>
                                                    {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                                                </span>
                                            </div>
                                            <div className="col-username">
                                                <span className="username-text">{user.username}</span>
                                                {user.isCurrentUser && <span className="you-badge">YOU</span>}
                                            </div>
                                            <div className="col-points">
                                                <span className="points-badge">{user.points.toLocaleString()}</span>
                                            </div>
                                            <div className="col-bets">{user.totalBets}</div>
                                            <div className="col-stats">
                                                <span className="wins-badge">{user.wins}</span>
                                                <span className="losses-badge">{user.losses}</span>
                                            </div>
                                            <div className="col-winrate">{user.winRate}%</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No data yet</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'myStats' && (
                        <div className="current-period-card">
                            <div className="period-card-header">
                                <h3>YOUR STATISTICS</h3>
                            </div>
                            <div className="my-stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Global Rank</span>
                                    <span className="stat-value">#{getCurrentUserRank.rank}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Points</span>
                                    <span className="stat-value">{getCurrentUserRank.points.toLocaleString()}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Bets</span>
                                    <span className="stat-value">{getCurrentUserRank.totalBets}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Wins</span>
                                    <span className="stat-value" style={{color: '#4caf50'}}>{getCurrentUserRank.wins}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Losses</span>
                                    <span className="stat-value" style={{color: '#f44336'}}>{getCurrentUserRank.losses}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Win Rate</span>
                                    <span className="stat-value">{getCurrentUserRank.winRate}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Scoreboard;
