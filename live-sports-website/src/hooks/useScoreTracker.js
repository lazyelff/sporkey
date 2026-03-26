import { useState, useEffect, useRef, useCallback } from 'react';

const TOP_5_LEAGUES = [
    'Premier League',
    'Ligue 1',
    'La Liga',
    'Bundesliga',
    'Serie A'
];

const CHAMPIONS_LEAGUE_KEYWORDS = ['champions league', 'ucl', 'c1', 'european cup'];

const isTopTierMatch = (matchTitle) => {
    const title = matchTitle.toLowerCase();
    
    // Check if Champions League
    const isChampionsLeague = CHAMPIONS_LEAGUE_KEYWORDS.some(keyword => title.includes(keyword));
    if (isChampionsLeague) return true;

    // Check if top 5 leagues
    return TOP_5_LEAGUES.some(league => title.includes(league));
};

export const useScoreTracker = (matches, onGoal) => {
    const previousScoresRef = useRef({});
    const matchesRef = useRef([]);

    useEffect(() => {
        if (!matches || !Array.isArray(matches)) return;

        matches.forEach(match => {
            // Only track top tier matches
            if (!isTopTierMatch(match.title)) return;

            // Skip if not live
            if (!match.live && match.status !== 'live' && !match.isLive) return;

            const matchKey = match.id || match.title;
            
            // Initialize previous score if not exists
            if (!previousScoresRef.current[matchKey]) {
                previousScoresRef.current[matchKey] = {
                    homeScore: 0,
                    awayScore: 0,
                    matchTitle: match.title,
                    homeTeam: match.teams?.home?.name || 'Home',
                    awayTeam: match.teams?.away?.name || 'Away',
                    lastUpdate: Date.now()
                };
            }

            const prevScore = previousScoresRef.current[matchKey];
            
            // Simulate score changes based on match time and randomness
            // This creates a realistic match progression
            const matchMinute = calculateMatchMinute(match.date);
            
            if (matchMinute > 0 && matchMinute <= 95) {
                // Randomly generate goals with increasing probability over time
                const goalProbability = (matchMinute / 100) * 0.15; // Up to 15% per check
                const homeScores = Math.random() < goalProbability ? 1 : 0;
                const awayScores = Math.random() < goalProbability ? 1 : 0;

                const newHomeScore = prevScore.homeScore + homeScores;
                const newAwayScore = prevScore.awayScore + awayScores;

                if (homeScores > 0) {
                    onGoal({
                        type: 'goal',
                        team: prevScore.homeTeam,
                        opponent: prevScore.awayTeam,
                        matchTitle: match.title,
                        homeTeam: prevScore.homeTeam,
                        awayTeam: prevScore.awayTeam,
                        homeScore: newHomeScore,
                        awayScore: newAwayScore,
                        minute: matchMinute
                    });
                }

                if (awayScores > 0) {
                    onGoal({
                        type: 'goal',
                        team: prevScore.awayTeam,
                        opponent: prevScore.homeTeam,
                        matchTitle: match.title,
                        homeTeam: prevScore.homeTeam,
                        awayTeam: prevScore.awayTeam,
                        homeScore: newHomeScore,
                        awayScore: newAwayScore,
                        minute: matchMinute
                    });
                }

                // Update previous score
                previousScoresRef.current[matchKey] = {
                    ...prevScore,
                    homeScore: newHomeScore,
                    awayScore: newAwayScore,
                    lastUpdate: Date.now()
                };
            }
        });

        // Clean up old matches
        const currentMatchIds = new Set(matches.map(m => m.id || m.title));
        Object.keys(previousScoresRef.current).forEach(key => {
            if (!currentMatchIds.has(key)) {
                delete previousScoresRef.current[key];
            }
        });

    }, [matches, onGoal]);

    return previousScoresRef.current;
};

// Calculate match minute based on match start time
const calculateMatchMinute = (startDate) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate).getTime();
    const now = Date.now();
    const diffMs = now - start;
    const diffMinutes = Math.floor(diffMs / 60000);

    // If match hasn't started yet, return 0
    if (diffMinutes < 0) return 0;
    
    // If more than 95 minutes, return 95
    if (diffMinutes > 95) return 95;

    return diffMinutes;
};
