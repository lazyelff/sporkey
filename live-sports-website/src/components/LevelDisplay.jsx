import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/LevelDisplay.css';

const getLevelTierColor = (level) => {
    if (level >= 40) return 'gold';
    if (level >= 30) return 'orange';
    if (level >= 20) return 'purple';
    if (level >= 10) return 'blue';
    return 'gray';
};

const getXpForLevel = (level) => {
    return Math.floor(100 * Math.pow(level, 1.5));
};

const LevelDisplay = ({ userStats, compact = false }) => {
    const { level = 1, xp = 0, totalXp = 0, loginStreak = 0 } = userStats || {};
    const xpForNext = getXpForLevel(level);
    const progress = (xp / xpForNext) * 100;
    const tierColor = getLevelTierColor(level);

    if (compact) {
        return (
            <motion.div 
                className={`level-badge-compact tier-${tierColor}`}
                whileHover={{ scale: 1.05 }}
                title={`Level ${level} • ${xp}/${xpForNext} XP`}
            >
                <span className="level-number">{level}</span>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="level-display"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="level-header">
                <div className={`level-circle tier-${tierColor}`}>
                    <span className="level-number">{level}</span>
                </div>
                <div className="level-info">
                    <h3>Level {level}</h3>
                    <p className="total-xp">{totalXp.toLocaleString()} Total XP</p>
                </div>
                {loginStreak > 0 && (
                    <div className="streak-badge">
                        🔥 {loginStreak} day{loginStreak > 1 ? 's' : ''}
                    </div>
                )}
            </div>
            
            <div className="xp-progress-container">
                <div className="xp-progress-bar">
                    <motion.div 
                        className="xp-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                <p className="xp-text">{xp} / {xpForNext} XP to Level {level + 1}</p>
            </div>
        </motion.div>
    );
};

export default LevelDisplay;
