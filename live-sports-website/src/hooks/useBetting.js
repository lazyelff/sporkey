import { useState, useEffect } from 'react';
import { getBets, placeBet as apiPlaceBet } from '../services/api';

const useBetting = (userId) => {
    const [bets, setBets] = useState([]);

    useEffect(() => {
        if (userId) {
            getBets().then(setBets).catch(console.error);
        }
    }, [userId]);
    const [odds, setOdds] = useState({});
    const [matchStats, setMatchStats] = useState({});

    // Generate deterministic team rating based on team name (0-100 scale)
    const getTeamRating = (teamName) => {
        if (!teamName) return 50;
        
        // Use team name to generate a deterministic rating
        let hash = 0;
        for (let i = 0; i < teamName.length; i++) {
            const char = teamName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Normalize to 40-100 range (teams are generally competitive)
        const rating = 40 + Math.abs(hash % 61);
        return rating;
    };

    // Calculate odds from win probability using bookmaker margin
    const calculateOddsFromProbability = (probability, margin = 1.04) => {
        // Add bookmaker margin (4%)
        const impliedProb = probability / margin;
        // Convert probability to decimal odds: 1 / probability
        const odds = 1 / impliedProb;
        return Math.max(1.01, Math.min(10, parseFloat(odds.toFixed(2)))); // Clamp between 1.01 and 10
    };

    // Calculate match probabilities based on team ratings
    const calculateMatchProbabilities = (homeTeam, awayTeam, matchMinute = 0) => {
        const homeRating = getTeamRating(homeTeam);
        const awayRating = getTeamRating(awayTeam);
        
        // Base probabilities from ratings
        const totalRating = homeRating + awayRating;
        const homeWinProb = homeRating / totalRating * 0.5; // 50% allocated to wins
        const awayWinProb = awayRating / totalRating * 0.5;
        const drawProb = 0.4 - (Math.abs(homeRating - awayRating) / 200 * 0.1); // Draws more likely when teams are similar
        
        // Add home advantage (3% boost)
        const homeAdvantage = 0.03;
        const adjustedHomeWinProb = homeWinProb + homeAdvantage;
        const adjustedAwayWinProb = Math.max(0.05, awayWinProb - homeAdvantage * 0.5);
        const adjustedDrawProb = Math.max(0.25, drawProb - homeAdvantage * 0.5);
        
        // Normalize to 100%
        const total = adjustedHomeWinProb + adjustedAwayWinProb + adjustedDrawProb;
        
        return {
            home: adjustedHomeWinProb / total,
            away: adjustedAwayWinProb / total,
            draw: adjustedDrawProb / total
        };
    };

    // Generate odds for a match with realistic calculations
    const generateOdds = (matchId, homeTeam, awayTeam, matchDate = null) => {
        if (odds[matchId]) return odds[matchId];

        const probs = calculateMatchProbabilities(homeTeam, awayTeam, 0);
        
        const homeOdds = calculateOddsFromProbability(probs.home);
        const awayOdds = calculateOddsFromProbability(probs.away);
        const drawOdds = calculateOddsFromProbability(probs.draw);

        const matchOdds = {
            home: homeOdds,
            away: awayOdds,
            draw: drawOdds,
            homeTeam,
            awayTeam,
            createdAt: new Date().toISOString(),
            matchDate: matchDate
        };

        // Store initial stats for dynamic adjustments
        setMatchStats(prev => ({
            ...prev,
            [matchId]: {
                initialOdds: matchOdds,
                homeRating: getTeamRating(homeTeam),
                awayRating: getTeamRating(awayTeam),
                goalDifference: 0,
                matchMinute: 0
            }
        }));

        setOdds(prev => ({ ...prev, [matchId]: matchOdds }));
        return matchOdds;
    };

    // Adjust odds dynamically as match progresses (0-90 minutes)
    const adjustOddsDynamically = (matchId, matchMinute, homeScore = 0, awayScore = 0) => {
        if (!odds[matchId] || !matchStats[matchId]) return odds[matchId];

        const stats = matchStats[matchId];
        const initialOdds = stats.initialOdds;
        
        // Time factor: odds shift more in final minutes
        const timeFactor = 1 + (matchMinute / 90) * 0.2; // Up to 20% shift by 90 min
        
        // Score factor: shift odds based on current score
        const goalDifference = homeScore - awayScore;
        const scoreFactor = goalDifference > 0 ? 1.1 : goalDifference < 0 ? 0.9 : 1.0;
        
        // Combine factors
        const adjustmentFactor = (timeFactor * scoreFactor - 1) * 0.3; // Conservative 30% of total adjustment
        
        const adjustedOdds = {
            home: parseFloat((initialOdds.home * (1 - adjustmentFactor)).toFixed(2)),
            away: parseFloat((initialOdds.away * (1 + adjustmentFactor)).toFixed(2)),
            draw: parseFloat((initialOdds.draw * (1 - Math.abs(goalDifference) * 0.1)).toFixed(2)),
            homeTeam: initialOdds.homeTeam,
            awayTeam: initialOdds.awayTeam,
            matchMinute
        };

        // Clamp odds to reasonable ranges
        adjustedOdds.home = Math.max(1.01, Math.min(10, adjustedOdds.home));
        adjustedOdds.away = Math.max(1.01, Math.min(10, adjustedOdds.away));
        adjustedOdds.draw = Math.max(1.01, Math.min(10, adjustedOdds.draw));

        setOdds(prev => ({ ...prev, [matchId]: adjustedOdds }));
        return adjustedOdds;
    };

    // Place a bet
    const placeBet = async (matchId, matchTitle, homeTeam, awayTeam, betAmount, selectedTeam, matchOdds) => {
        if (betAmount <= 0 || !selectedTeam) {
            return { success: false, message: 'Invalid bet amount or team selection' };
        }

        const userPoints = parseInt(localStorage.getItem(`userPoints_${userId}`)) || 0;
        if (betAmount > userPoints) {
            return { success: false, message: 'Insufficient points' };
        }

        try {
            const betRecord = await apiPlaceBet(betAmount, selectedTeam, matchId);
            
            // Deduct points immediately
            const newPoints = userPoints - betAmount;
            localStorage.setItem(`userPoints_${userId}`, newPoints.toString());

            // Enrich bet for immediate frontend display
            const newBet = {
                ...betRecord,
                matchTitle,
                homeTeam,
                awayTeam,
                selectedTeam,
                betAmount,
                odds: selectedTeam === 'home' ? matchOdds.home : selectedTeam === 'away' ? matchOdds.away : matchOdds.draw,
                placedAt: betRecord.createdAt || new Date().toISOString(),
                result: null
            };

            setBets(prev => [newBet, ...prev]);

            return { 
                success: true, 
                message: `Bet placed! ${betAmount} points on ${selectedTeam === 'home' ? homeTeam : selectedTeam === 'away' ? awayTeam : 'Draw'}`,
                newBet
            };
        } catch (err) {
            return { success: false, message: err.message || 'Server error placing bet' };
        }
    };

    // Settle a bet (when match result is known)
    const settleBet = (betId, winningTeam) => {
        const bet = bets.find(b => b.id === betId);
        if (!bet || bet.status !== 'pending') return null;

        let won = false;
        if (bet.selectedTeam === 'home' && winningTeam === 'home') won = true;
        if (bet.selectedTeam === 'away' && winningTeam === 'away') won = true;
        if (bet.selectedTeam === 'draw' && winningTeam === 'draw') won = true;

        const userPoints = parseInt(localStorage.getItem(`userPoints_${userId}`)) || 0;
        let newPoints = userPoints;

        if (won) {
            // Calculate winnings: betAmount * odds
            const winnings = Math.floor(bet.betAmount * bet.odds);
            newPoints = userPoints + winnings;
            bet.result = { won: true, winnings };
        } else {
            bet.result = { won: false, winnings: 0 };
        }

        bet.status = won ? 'won' : 'lost';
        const newBets = [...bets];
        setBets(newBets);
        localStorage.setItem(`userBets_${userId}`, JSON.stringify(newBets));
        localStorage.setItem(`userPoints_${userId}`, newPoints.toString());

        return bet;
    };

    // Get user's active bets
    const getActiveBets = () => {
        return bets.filter(b => b.status === 'pending');
    };

    // Get user's bet history
    const getBetHistory = () => {
        return bets.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
    };

    // Get total winnings/losses
    const getStats = () => {
        let totalWon = 0;
        let totalLost = 0;
        let totalWinnings = 0;

        bets.forEach(bet => {
            if (bet.status === 'won') {
                totalWon++;
                totalWinnings += bet.result.winnings;
            } else if (bet.status === 'lost') {
                totalLost++;
            }
        });

        return {
            totalBets: bets.length,
            totalWon,
            totalLost,
            totalWinnings,
            winRate: bets.length > 0 ? ((totalWon / bets.length) * 100).toFixed(1) : 0
        };
    };

    return {
        bets,
        odds,
        matchStats,
        placeBet,
        settleBet,
        generateOdds,
        adjustOddsDynamically,
        getTeamRating,
        calculateMatchProbabilities,
        getActiveBets,
        getBetHistory,
        getStats
    };
};

export default useBetting;
