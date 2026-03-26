import React, { useState, useMemo } from 'react';

const BetHistory = ({ bets, onClose, isOpen }) => {
    const [filter, setFilter] = useState('all'); // all, pending, won, lost

    const stats = useMemo(() => ({
        totalBets: bets.length,
        totalWon: bets.filter(b => b.status === 'won').length,
        totalLost: bets.filter(b => b.status === 'lost').length,
        totalWinnings: bets.reduce((sum, b) => sum + (b.result?.winnings || 0), 0)
    }), [bets]);

    const filteredBets = useMemo(() => {
        if (filter === 'all') return bets;
        return bets.filter(b => b.status === filter);
    }, [bets, filter]);

    const activeBets = useMemo(() => bets.filter(b => b.status === 'pending'), [bets]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="history-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <h2>📊 Betting History</h2>
                </div>

                {/* Stats Section */}
                <div className="betting-stats">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalBets}</div>
                        <div className="stat-label">Total Bets</div>
                    </div>
                    <div className="stat-card won">
                        <div className="stat-value">{stats.totalWon}</div>
                        <div className="stat-label">Won</div>
                    </div>
                    <div className="stat-card lost">
                        <div className="stat-value">{stats.totalLost}</div>
                        <div className="stat-label">Lost</div>
                    </div>
                    <div className="stat-card winnings">
                        <div className="stat-value">+{stats.totalWinnings}</div>
                        <div className="stat-label">Total Winnings</div>
                    </div>
                </div>

                {/* Active Bets */}
                {activeBets.length > 0 && (
                    <div className="active-bets-section">
                        <h3>🔴 Active Bets ({activeBets.length})</h3>
                        <div className="bets-list">
                            {activeBets.map(bet => (
                                <div key={bet.id} className="bet-item active">
                                    <div className="bet-match-info">
                                        <p className="bet-match">📺 {bet.matchTitle}</p>
                                        <p className="bet-selection">
                                            Bet on <strong>{bet.selectedTeam === 'home' ? bet.homeTeam : bet.selectedTeam === 'away' ? bet.awayTeam : 'Draw'}</strong>
                                        </p>
                                    </div>
                                    <div className="bet-amount">
                                        <span className="amount-label">Bet:</span>
                                        <span className="amount-value">{bet.betAmount}</span>
                                    </div>
                                    <div className="bet-odds">
                                        <span className="odds-label">Odds:</span>
                                        <span className="odds-value">{bet.odds}x</span>
                                    </div>
                                    <div className="bet-status pending">Pending</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Buttons */}
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'won' ? 'active' : ''}`}
                        onClick={() => setFilter('won')}
                    >
                        Won
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'lost' ? 'active' : ''}`}
                        onClick={() => setFilter('lost')}
                    >
                        Lost
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                </div>

                {/* Bets List */}
                <div className="bets-list scrollable">
                    {filteredBets.length > 0 ? (
                        filteredBets.map(bet => (
                            <div key={bet.id} className={`bet-item ${bet.status}`}>
                                <div className="bet-match-info">
                                    <p className="bet-match">📺 {bet.matchTitle}</p>
                                    <p className="bet-selection">
                                        Bet on <strong>{bet.selectedTeam === 'home' ? bet.homeTeam : bet.selectedTeam === 'away' ? bet.awayTeam : 'Draw'}</strong>
                                    </p>
                                    <p className="bet-date">
                                        {new Date(bet.placedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bet-amount">
                                    <span className="amount-label">Bet:</span>
                                    <span className="amount-value">{bet.betAmount}</span>
                                </div>
                                <div className="bet-odds">
                                    <span className="odds-label">Odds:</span>
                                    <span className="odds-value">{bet.odds}x</span>
                                </div>
                                {bet.result && (
                                    <div className="bet-result">
                                        <span className="result-label">
                                            {bet.result.won ? '✅ Won' : '❌ Lost'}
                                        </span>
                                        {bet.result.won && (
                                            <span className="result-winnings">+{bet.result.winnings}</span>
                                        )}
                                    </div>
                                )}
                                <div className={`bet-status ${bet.status}`}>
                                    {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-bets">No bets in this category</div>
                    )}
                </div>

                <button className="btn-close-modal" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default React.memo(BetHistory);
