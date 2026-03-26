import { useState, useMemo, useEffect } from 'react';

export const useScoreboard = (userId) => {
    const [userPoints, setUserPoints] = useState(0);
    const [bets, setBets] = useState([]);

    // Load data from localStorage
    useEffect(() => {
        const saved = parseInt(localStorage.getItem(`userPoints_${userId}`)) || 0;
        setUserPoints(saved);

        const savedBets = localStorage.getItem(`userBets_${userId}`);
        setBets(savedBets ? JSON.parse(savedBets) : []);

        const handleStorageChange = () => {
            const updated = parseInt(localStorage.getItem(`userPoints_${userId}`)) || 0;
            setUserPoints(updated);

            const updatedBets = localStorage.getItem(`userBets_${userId}`);
            setBets(updatedBets ? JSON.parse(updatedBets) : []);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [userId]);

    // Calculate current week number
    const getCurrentWeek = (date = new Date()) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Format: "2026-W12"
    const getWeekKey = (date = new Date()) => {
        const year = date.getFullYear();
        const week = getCurrentWeek(date);
        return `${year}-W${String(week).padStart(2, '0')}`;
    };

    // Format: "2026-03"
    const getMonthKey = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // Get all unique weeks from bets
    const getWeeksData = useMemo(() => {
        const weeks = {};

        bets.forEach(bet => {
            const betDate = new Date(bet.placedAt);
            const week = getWeekKey(betDate);

            if (!weeks[week]) {
                weeks[week] = { points: 0, betsCount: 0, wins: 0, losses: 0 };
            }

            weeks[week].betsCount++;

            // Count points earned from watching that week (first bet is watch start)
            if (bet.status === 'won') {
                const winnings = Math.floor(bet.betAmount * bet.odds);
                weeks[week].points += winnings;
                weeks[week].wins++;
            } else if (bet.status === 'lost') {
                weeks[week].losses++;
            }
        });

        return Object.keys(weeks)
            .sort()
            .reverse()
            .reduce((acc, key) => {
                acc[key] = weeks[key];
                return acc;
            }, {});
    }, [bets]);

    // Get all unique months from bets
    const getMonthsData = useMemo(() => {
        const months = {};

        bets.forEach(bet => {
            const betDate = new Date(bet.placedAt);
            const month = getMonthKey(betDate);

            if (!months[month]) {
                months[month] = { points: 0, betsCount: 0, wins: 0, losses: 0 };
            }

            months[month].betsCount++;

            if (bet.status === 'won') {
                const winnings = Math.floor(bet.betAmount * bet.odds);
                months[month].points += winnings;
                months[month].wins++;
            } else if (bet.status === 'lost') {
                months[month].losses++;
            }
        });

        return Object.keys(months)
            .sort()
            .reverse()
            .reduce((acc, key) => {
                acc[key] = months[key];
                return acc;
            }, {});
    }, [bets]);

    // Get current week data
    const getCurrentWeekData = useMemo(() => {
        const currentWeek = getWeekKey();
        return getWeeksData[currentWeek] || { points: 0, betsCount: 0, wins: 0, losses: 0 };
    }, [getWeeksData]);

    // Get current month data
    const getCurrentMonthData = useMemo(() => {
        const currentMonth = getMonthKey();
        return getMonthsData[currentMonth] || { points: 0, betsCount: 0, wins: 0, losses: 0 };
    }, [getMonthsData]);

    return {
        userPoints,
        bets,
        getWeeksData,
        getMonthsData,
        getCurrentWeekData,
        getCurrentMonthData,
        getWeekKey,
        getMonthKey,
        getCurrentWeek,
    };
};
