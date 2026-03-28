import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageVariants, fadeUpVariants, staggerContainer } from '../utils/animations';
import '../styles/Standings.css';

// Sample standings data - in production this would come from API
const sampleStandings = {
  'Premier League': [
    { position: 1, team: 'Manchester City', played: 30, won: 22, drawn: 4, lost: 4, gf: 73, ga: 22, gd: 51, points: 70, form: ['W', 'W', 'W', 'D', 'W'] },
    { position: 2, team: 'Arsenal', played: 30, won: 20, drawn: 5, lost: 5, gf: 62, ga: 22, gd: 40, points: 65, form: ['W', 'W', 'D', 'W', 'L'] },
    { position: 3, team: 'Liverpool', played: 29, won: 19, drawn: 6, lost: 4, gf: 60, ga: 28, gd: 32, points: 63, form: ['W', 'D', 'W', 'W', 'W'] },
    { position: 4, team: 'Aston Villa', played: 30, won: 17, drawn: 5, lost: 8, gf: 58, ga: 40, gd: 18, points: 56, form: ['L', 'W', 'W', 'D', 'W'] },
    { position: 5, team: 'Tottenham', played: 30, won: 16, drawn: 5, lost: 9, gf: 56, ga: 45, gd: 11, points: 53, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 6, team: 'Manchester United', played: 30, won: 15, drawn: 5, lost: 10, gf: 45, ga: 40, gd: 5, points: 50, form: ['D', 'W', 'L', 'W', 'L'] },
    { position: 7, team: 'West Ham', played: 30, won: 13, drawn: 6, lost: 11, gf: 45, ga: 48, gd: -3, points: 45, form: ['W', 'D', 'L', 'W', 'W'] },
    { position: 8, team: 'Chelsea', played: 29, won: 12, drawn: 8, lost: 9, gf: 47, ga: 38, gd: 9, points: 44, form: ['D', 'D', 'W', 'L', 'W'] },
  ],
  'La Liga': [
    { position: 1, team: 'Real Madrid', played: 30, won: 22, drawn: 3, lost: 5, gf: 59, ga: 22, gd: 37, points: 69, form: ['W', 'W', 'W', 'W', 'D'] },
    { position: 2, team: 'Barcelona', played: 30, won: 19, drawn: 7, lost: 4, gf: 61, ga: 33, gd: 28, points: 64, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 3, team: 'Atletico Madrid', played: 30, won: 18, drawn: 4, lost: 8, gf: 52, ga: 35, gd: 17, points: 58, form: ['L', 'W', 'W', 'W', 'D'] },
    { position: 4, team: 'Athletic Bilbao', played: 30, won: 15, drawn: 8, lost: 7, gf: 48, ga: 28, gd: 20, points: 53, form: ['W', 'D', 'W', 'L', 'W'] },
    { position: 5, team: 'Real Sociedad', played: 30, won: 14, drawn: 6, lost: 10, gf: 44, ga: 38, gd: 6, points: 48, form: ['W', 'L', 'W', 'D', 'W'] },
  ],
  'Bundesliga': [
    { position: 1, team: 'Bayern Munich', played: 27, won: 22, drawn: 3, lost: 2, gf: 79, ga: 22, gd: 57, points: 69, form: ['W', 'W', 'W', 'W', 'D'] },
    { position: 2, team: 'Leverkusen', played: 27, won: 19, drawn: 6, lost: 2, gf: 60, ga: 22, gd: 38, points: 63, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 3, team: 'Stuttgart', played: 27, won: 16, drawn: 4, lost: 7, gf: 54, ga: 35, gd: 19, points: 52, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 4, team: 'Dortmund', played: 27, won: 14, drawn: 5, lost: 8, gf: 51, ga: 38, gd: 13, points: 47, form: ['D', 'W', 'L', 'W', 'W'] },
    { position: 5, team: 'RB Leipzig', played: 27, won: 13, drawn: 6, lost: 8, gf: 53, ga: 38, gd: 15, points: 45, form: ['W', 'W', 'L', 'D', 'W'] },
  ],
};

function Standings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState('Premier League');
  const [loading, setLoading] = useState(false);

  const leagues = Object.keys(sampleStandings);
  const standings = sampleStandings[selectedLeague] || [];

  const getPositionBadge = (position) => {
    if (position === 1) return { icon: '🥇', class: 'gold' };
    if (position === 2) return { icon: '🥈', class: 'silver' };
    if (position === 3) return { icon: '🥉', class: 'bronze' };
    return null;
  };

  const getFormColor = (result) => {
    if (result === 'W') return 'form-win';
    if (result === 'D') return 'form-draw';
    if (result === 'L') return 'form-loss';
    return '';
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const rowVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div 
      className="standings-page"
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit"
      key={location.pathname}
    >
      <button className="back-to-home" onClick={() => navigate('/')}>
        ← Back to Home
      </button>
      <div className="standings-header">
        <motion.h1 
          variants={fadeUpVariants}
          initial="initial"
          animate="animate"
        >
          League Standings
        </motion.h1>
        <motion.p 
          variants={fadeUpVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="standings-subtitle"
        >
          Current league tables and rankings
        </motion.p>
      </div>

      <motion.div 
        className="league-selector"
        variants={fadeUpVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        {leagues.map(league => (
          <button
            key={league}
            className={`league-tab ${selectedLeague === league ? 'active' : ''}`}
            onClick={() => setSelectedLeague(league)}
          >
            {league}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="standings-table-skeleton">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell" style={{ width: '40px' }}></div>
              <div className="skeleton-cell" style={{ width: '150px' }}></div>
              <div className="skeleton-cell" style={{ width: '40px' }}></div>
              <div className="skeleton-cell" style={{ width: '40px' }}></div>
              <div className="skeleton-cell" style={{ width: '40px' }}></div>
              <div className="skeleton-cell" style={{ width: '40px' }}></div>
              <div className="skeleton-cell" style={{ width: '50px' }}></div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="standings-table"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <div className="table-header">
            <span className="col-pos">Pos</span>
            <span className="col-team">Team</span>
            <span className="col-played">P</span>
            <span className="col-won">W</span>
            <span className="col-drawn">D</span>
            <span className="col-lost">L</span>
            <span className="col-gd">GD</span>
            <span className="col-pts">Pts</span>
            <span className="col-form">Form</span>
          </div>

          {standings.map((team, index) => {
            const badge = getPositionBadge(team.position);
            return (
              <motion.div
                key={team.position}
                className={`table-row ${badge ? `position-${badge.class}` : ''}`}
                variants={rowVariants}
                whileHover={{ backgroundColor: 'rgba(107, 33, 168, 0.1)' }}
              >
                <span className="col-pos">
                  {badge ? (
                    <span className="position-badge">{badge.icon}</span>
                  ) : (
                    team.position
                  )}
                </span>
                <span className="col-team">
                  <span className="team-icon">{team.team.charAt(0)}</span>
                  {team.team}
                </span>
                <span className="col-played">{team.played}</span>
                <span className="col-won">{team.won}</span>
                <span className="col-drawn">{team.drawn}</span>
                <span className="col-lost">{team.lost}</span>
                <span className={`col-gd ${team.gd > 0 ? 'positive' : team.gd < 0 ? 'negative' : ''}`}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </span>
                <span className="col-pts">{team.points}</span>
                <span className="col-form">
                  {team.form.map((result, i) => (
                    <span key={i} className={`form-result ${getFormColor(result)}`}>
                      {result}
                    </span>
                  ))}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="standings-legend">
        <span className="legend-item"><span className="legend-dot gold"></span> Champion</span>
        <span className="legend-item"><span className="legend-dot silver"></span> Champions League</span>
        <span className="legend-item"><span className="legend-dot green"></span> Europa League</span>
      </div>
    </motion.div>
  );
}

export default Standings;
