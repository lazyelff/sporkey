import { useState, useMemo, useEffect } from 'react';

export const useUserLeaderboard = (currentUserId) => {
    const [allUsersData, setAllUsersData] = useState([]);

    // Load all users' data from localStorage
    useEffect(() => {
        const loadAllUsersData = () => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            const usersData = users.map(user => {
                const userPoints = parseInt(localStorage.getItem(`userPoints_${user.id}`)) || 0;
                const userBets = JSON.parse(localStorage.getItem(`userBets_${user.id}`)) || [];
                
                return {
                    id: user.id,
                    username: user.username,
                    points: userPoints,
                    bets: userBets,
                    createdAt: user.createdAt
                };
            });

            setAllUsersData(usersData);
        };

        loadAllUsersData();

        // Listen for any storage changes
        const handleStorageChange = () => {
            loadAllUsersData();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Calculate stats for current user
    const getCurrentUserStats = useMemo(() => {
        const userData = allUsersData.find(u => u.id === currentUserId);
        if (!userData) return { points: 0, totalBets: 0, wins: 0, losses: 0, rank: 0 };

        const wins = userData.bets.filter(b => b.status === 'won').length;
        const losses = userData.bets.filter(b => b.status === 'lost').length;
        const rank = allUsersData.sort((a, b) => b.points - a.points).findIndex(u => u.id === currentUserId) + 1;

        return {
            points: userData.points,
            totalBets: userData.bets.length,
            wins,
            losses,
            rank
        };
    }, [allUsersData, currentUserId]);

    // Get all users ranked by points
    const getLeaderboard = useMemo(() => {
        return allUsersData
            .map((user, idx) => {
                const wins = user.bets.filter(b => b.status === 'won').length;
                const losses = user.bets.filter(b => b.status === 'lost').length;
                const winRate = user.bets.length > 0 ? ((wins / user.bets.length) * 100).toFixed(1) : 0;

                return {
                    rank: idx + 1,
                    username: user.username,
                    points: user.points,
                    totalBets: user.bets.length,
                    wins,
                    losses,
                    winRate,
                    isCurrentUser: user.id === currentUserId,
                    joinDate: new Date(user.createdAt).toLocaleDateString()
                };
            })
            .sort((a, b) => b.points - a.points)
            .map((user, idx) => ({ ...user, rank: idx + 1 }));
    }, [allUsersData, currentUserId]);

    // Get top 10 users
    const getTopUsers = useMemo(() => {
        return getLeaderboard.slice(0, 10);
    }, [getLeaderboard]);

    // Get current user's position in leaderboard
    const getCurrentUserRank = useMemo(() => {
        const userRank = getLeaderboard.find(u => u.isCurrentUser);
        return userRank || { rank: 0, points: 0, totalBets: 0, wins: 0, losses: 0, winRate: 0 };
    }, [getLeaderboard]);

    return {
        allUsersData,
        getLeaderboard,
        getTopUsers,
        getCurrentUserStats,
        getCurrentUserRank
    };
};
