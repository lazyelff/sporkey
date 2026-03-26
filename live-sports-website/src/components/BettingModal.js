import React, { useState, useMemo } from 'react';

const BettingModal = ({ match, isOpen, onClose, onPlaceBet, userPoints, matchOdds, bettingAllowed = true, timeLeftForBetting = 1200, teamRatings = {} }) => {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [betAmount, setBetAmount] = useState('');

    const potentialWinnings = useMemo(() => {
        if (!selectedTeam || !betAmount) return 0;
        const odds = selectedTeam === 'home' 
            ? matchOdds.home 
            : selectedTeam === 'away' 
            ? matchOdds.away 
            : matchOdds.draw;
        return Math.floor(parseInt(betAmount || 0) * odds);
    }, [selectedTeam, betAmount, matchOdds]);

    const handlePlaceBet = () => {
        if (!bettingAllowed) {
            alert('Betting is only allowed in the first 20 minutes of the match');
            return;
        }

        if (!selectedTeam || !betAmount) {
            alert('Please select a team and enter bet amount');
            return;
        }

        onPlaceBet(selectedTeam, parseInt(betAmount));
        setBetAmount('');
        setSelectedTeam(null);
    };

    const homeTeam = useMemo(() => match?.teams?.home?.name || 'Home Team', [match?.teams?.home?.name]);
    const awayTeam = useMemo(() => match?.teams?.away?.name || 'Away Team', [match?.teams?.away?.name]);

    if (!isOpen) return null;

    if (!bettingAllowed) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="betting-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>✕</button>
                    <div className="modal-header">
                        <h2>⚽ Betting Closed</h2>
                    </div>
                    <div className="betting-closed-message">
                        <p>🔒 Betting is only allowed in the first 20 minutes of the match.</p>
                        <p>This match has exceeded the betting window.</p>
                    </div>
                    <button className="btn-close-modal" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="betting-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <h2>⚽ Place a Bet</h2>
                    <p className="available-points">Available Points: <strong>{userPoints}</strong></p>
                </div>

                <div className="match-info">
                    <p>{match?.title || `${homeTeam} vs ${awayTeam}`}</p>
                </div>

                {/* Team Ratings Display */}
                {teamRatings.home && teamRatings.away && (
                    <div className="team-ratings-display">
                        <div className="team-rating-item">
                            <span className="rating-label">{homeTeam}</span>
                            <div className="rating-bar">
                                <div className="rating-fill" style={{width: `${teamRatings.home}%`}}></div>
                            </div>
                            <span className="rating-value">{teamRatings.home}/100</span>
                        </div>
                        <div className="rating-vs">VS</div>
                        <div className="team-rating-item">
                            <span className="rating-label">{awayTeam}</span>
                            <div className="rating-bar">
                                <div className="rating-fill" style={{width: `${teamRatings.away}%`}}></div>
                            </div>
                            <span className="rating-value">{teamRatings.away}/100</span>
                        </div>
                    </div>
                )}

                <div className="betting-options">
                    <div 
                        className={`bet-option ${selectedTeam === 'home' ? 'selected' : ''}`}
                        onClick={() => setSelectedTeam('home')}
                    >
                        <div className="team-name">{homeTeam}</div>
                        <div className="odds-display">{matchOdds.home}</div>
                        <div className="odds-label">Odds</div>
                    </div>

                    <div 
                        className={`bet-option ${selectedTeam === 'draw' ? 'selected' : ''}`}
                        onClick={() => setSelectedTeam('draw')}
                    >
                        <div className="team-name">Draw</div>
                        <div className="odds-display">{matchOdds.draw}</div>
                        <div className="odds-label">Odds</div>
                    </div>

                    <div 
                        className={`bet-option ${selectedTeam === 'away' ? 'selected' : ''}`}
                        onClick={() => setSelectedTeam('away')}
                    >
                        <div className="team-name">{awayTeam}</div>
                        <div className="odds-display">{matchOdds.away}</div>
                        <div className="odds-label">Odds</div>
                    </div>
                </div>

                <div className="bet-input-section">
                    <label>Bet Amount (Points)</label>
                    <input 
                        type="number" 
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        max={userPoints}
                    />
                    <div className="quick-bets">
                        <button onClick={() => setBetAmount('10')}>10</button>
                        <button onClick={() => setBetAmount('50')}>50</button>
                        <button onClick={() => setBetAmount('100')}>100</button>
                        <button onClick={() => setBetAmount(userPoints.toString())}>Max</button>
                    </div>
                </div>

                {potentialWinnings > 0 && (
                    <div className="winnings-calculation">
                        <div className="calc-row">
                            <span>Bet Amount:</span>
                            <strong>{betAmount} points</strong>
                        </div>
                        <div className="calc-row">
                            <span>Odds:</span>
                            <strong>{selectedTeam === 'home' ? matchOdds.home : selectedTeam === 'away' ? matchOdds.away : matchOdds.draw}x</strong>
                        </div>
                        <div className="calc-row total">
                            <span>Potential Winnings:</span>
                            <strong>{potentialWinnings} points</strong>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button 
                        className="btn-place-bet" 
                        onClick={handlePlaceBet}
                        disabled={!selectedTeam || !betAmount || parseInt(betAmount) > userPoints}
                    >
                        Place Bet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(BettingModal);
