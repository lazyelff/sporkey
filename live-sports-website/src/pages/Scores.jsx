import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchMatches } from '../services/api';
import { cardVariants, fadeUpVariants, pageVariants, pulseVariants, staggerContainer } from '../utils/animations';
import '../styles/Scores.css';

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function Scores() {
  const location = useLocation();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sport, setSport] = useState('football');

  useEffect(() => {
    loadMatches();
  }, [sport]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await fetchMatches(sport);
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
    setLoading(false);
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'live') return match.live || match.status === 'live';
    if (filter === 'upcoming') return !match.live && match.status !== 'live';
    return true;
  });

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div 
      className="scores-page"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <button className="back-to-home" onClick={() => navigate('/')}>
        ← Back to Home
      </button>
      <div className="scores-header">
        <motion.h1 
          variants={fadeUpVariants}
          initial="initial"
          animate="animate"
        >
          Live Scores
        </motion.h1>
        <motion.p 
          variants={fadeUpVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="scores-subtitle"
        >
          Follow all the action in real-time
        </motion.p>
      </div>

      <motion.div 
        className="scores-filters"
        variants={fadeUpVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="sport-selector">
          {['football', 'basketball', 'tennis'].map(s => (
            <button
              key={s}
              className={`sport-btn ${sport === s ? 'active' : ''}`}
              onClick={() => setSport(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-tabs">
          {['all', 'live', 'upcoming'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All'}
              {f === 'live' && (
                <span className="live-indicator">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="pulse-dot"
                  />
                  Live
                </span>
              )}
              {f === 'upcoming' && 'Upcoming'}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="scores-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div 
              key={i}
              className="match-card-skeleton"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="skeleton-team skeleton-team-left"></div>
              <div className="skeleton-score">
                <div className="skeleton-score-box"></div>
                <div className="skeleton-vs">vs</div>
                <div className="skeleton-score-box"></div>
              </div>
              <div className="skeleton-team skeleton-team-right"></div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="scores-grid"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {filteredMatches.length === 0 ? (
            <motion.div 
              className="no-matches"
              variants={fadeUpVariants}
            >
              <span className="no-matches-icon">📺</span>
              <p>No matches available</p>
            </motion.div>
          ) : (
            filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                className={`score-card ${match.live || match.status === 'live' ? 'live' : ''}`}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {}}
              >
                {match.live || match.status === 'live' && (
                  <div className="live-badge-score">
                    <motion.span 
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    LIVE
                  </div>
                )}
                <div className="score-team score-team-home">
                  <div className="team-logo-placeholder">
                    {match.homeTeam?.charAt(0) || 'H'}
                  </div>
                  <span className="team-name">{match.homeTeam || 'Home Team'}</span>
                </div>
                <div className="score-result">
                  <span className="score-value">{match.homeScore ?? '-'}</span>
                  <span className="score-divider">:</span>
                  <span className="score-value">{match.awayScore ?? '-'}</span>
                </div>
                <div className="score-team score-team-away">
                  <div className="team-logo-placeholder">
                    {match.awayTeam?.charAt(0) || 'A'}
                  </div>
                  <span className="team-name">{match.awayTeam || 'Away Team'}</span>
                </div>
                <div className="match-info">
                  <span className="match-time">{match.time || match.minute || '--'}</span>
                  <span className="match-league">{match.league || match.title || ''}</span>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Scores;
