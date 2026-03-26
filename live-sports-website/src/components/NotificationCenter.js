import React from 'react';
import '../styles/NotificationCenter.css';

function NotificationCenter({ notifications, onRemove }) {
    if (notifications.length === 0) return null;

    return (
        <div className="notification-center">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification notification-${notification.type}`}
                >
                    <div className="notification-content">
                        {notification.type === 'goal' && (
                            <>
                                <div className="notification-header">
                                    <span className="notification-icon">⚽</span>
                                    <span className="notification-title">GOAL!</span>
                                </div>
                                <div className="notification-body">
                                    <div className="goal-team">
                                        <span className="team-name">{notification.team}</span>
                                        <span className="goal-badge">🎯</span>
                                    </div>
                                    <div className="goal-score">
                                        <span className="score-home">{notification.homeScore}</span>
                                        <span className="score-separator">-</span>
                                        <span className="score-away">{notification.awayScore}</span>
                                    </div>
                                    <div className="goal-minute">
                                        <span className="minute-label">{notification.minute}'</span>
                                    </div>
                                </div>
                                <div className="notification-footer">
                                    <span className="match-info">
                                        {notification.homeTeam} vs {notification.awayTeam}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        className="notification-close"
                        onClick={() => onRemove(notification.id)}
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

export default NotificationCenter;
