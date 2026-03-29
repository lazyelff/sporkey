import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LevelDisplay from '../components/LevelDisplay';
import '../styles/DailyQuests.css';

const QUEST_ICONS = {
    view_matches: '⚽',
    check_leagues: '📊',
    add_favorites: '⭐',
    login_streak: '🔥',
    complete_quiz: '🧠',
    share_result: '📤',
    early_bird: '🌅',
    night_owl: '🌙',
    update_profile: '👤',
    scores_10x: '📈'
};

const DailyQuests = () => {
    const navigate = useNavigate();
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [completing, setCompleting] = useState(null);

    useEffect(() => {
        fetchQuests();
        fetchUserStats();
    }, []);

    const fetchQuests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || '/api'}/quests/daily`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setQuests(data.quests || []);
            }
        } catch (err) {
            console.error('Error fetching quests:', err);
            // Demo data for now
            setQuests([
                { id: 1, questType: 'view_matches', questDescription: 'View 5 match scores', xpReward: 30, progress: 2, target: 5, completed: false },
                { id: 2, questType: 'check_leagues', questDescription: 'Check 3 league standings', xpReward: 40, progress: 1, target: 3, completed: false },
                { id: 3, questType: 'complete_quiz', questDescription: 'Complete your daily quiz', xpReward: 50, progress: 0, target: 1, completed: false }
            ]);
        }
        setLoading(false);
    };

    const fetchUserStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || '/api'}/users/me/level`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setUserStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const completeQuest = async (questId) => {
        setCompleting(questId);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.REACT_APP_BACKEND_URL || '/api'}/quests/${questId}/complete`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            // Refresh quests
            fetchQuests();
            fetchUserStats();
        } catch (err) {
            console.error('Error completing quest:', err);
        }
        setCompleting(null);
    };

    const getProgressPercent = (quest) => {
        return Math.min((quest.progress / quest.target) * 100, 100);
    };

    const getTimeUntilReset = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <motion.div 
            className="quests-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <button className="back-to-home" onClick={() => navigate('/')}>
                ← Back to Home
            </button>

            <div className="quests-header">
                <h1>🎯 Daily Quests</h1>
                <p className="quests-subtitle">Complete quests to earn XP and level up!</p>
                <div className="reset-timer">Resets in {getTimeUntilReset()}</div>
            </div>

            {userStats && (
                <LevelDisplay userStats={userStats} />
            )}

            <div className="quests-grid">
                {loading ? (
                    <div className="loading-quests">Loading quests...</div>
                ) : quests.length === 0 ? (
                    <div className="no-quests">
                        <p>No quests available yet. Check back soon!</p>
                    </div>
                ) : (
                    quests.map((quest, index) => (
                        <motion.div 
                            key={quest.id}
                            className={`quest-card ${quest.completed ? 'completed' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="quest-icon">
                                {QUEST_ICONS[quest.questType] || '📌'}
                            </div>
                            <div className="quest-info">
                                <h3>{quest.questDescription}</h3>
                                <div className="quest-progress">
                                    <div className="progress-bar">
                                        <motion.div 
                                            className="progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${getProgressPercent(quest)}%` }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {quest.progress} / {quest.target}
                                    </span>
                                </div>
                            </div>
                            <div className="quest-reward">
                                <span className="xp-badge">+{quest.xpReward} XP</span>
                                {quest.completed ? (
                                    <span className="completed-badge">✓</span>
                                ) : getProgressPercent(quest) >= 100 ? (
                                    <motion.button 
                                        className="collect-btn"
                                        onClick={() => completeQuest(quest.id)}
                                        disabled={completing === quest.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {completing === quest.id ? '...' : 'Collect'}
                                    </motion.button>
                                ) : null}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="quest-footer">
                <button 
                    className="quiz-btn"
                    onClick={() => navigate('/quiz')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    🧠 Take Daily Quiz
                </button>
            </div>
        </motion.div>
    );
};

export default DailyQuests;
