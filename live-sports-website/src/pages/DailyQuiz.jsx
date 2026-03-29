import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/DailyQuiz.css';

const DIFFICULTY_COLORS = {
    easy: '#22C55E',
    medium: '#F97316',
    hard: '#EF4444'
};

const DailyQuiz = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || '/api'}/quiz/daily`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                if (data.already_completed) {
                    setAlreadyCompleted(true);
                    setQuestions(data.questions || []);
                } else {
                    setQuestions(data.questions || []);
                }
            }
        } catch (err) {
            console.error('Error fetching quiz:', err);
            // Demo data
            setQuestions([
                { id: 1, question: "How many players are on a football team?", options: ["9", "11", "13", "15"], correctAnswer: "B", difficulty: "easy" },
                { id: 2, question: "Who won the 2018 World Cup?", options: ["Germany", "Brazil", "France", "Argentina"], correctAnswer: "C", difficulty: "medium" },
                { id: 3, question: "In which year was VAR first used in World Cup?", options: ["2014", "2016", "2018", "2022"], correctAnswer: "C", difficulty: "hard" },
                { id: 4, question: "What is a hat-trick?", options: ["2 goals", "3 goals", "4 goals", "5 goals"], correctAnswer: "B", difficulty: "medium" },
                { id: 5, question: "Which club has most Champions League titles?", options: ["Barcelona", "Real Madrid", "Bayern", "AC Milan"], correctAnswer: "B", difficulty: "medium" }
            ]);
        }
        setLoading(false);
    };

    const handleAnswer = async (answer) => {
        if (showFeedback) return;
        
        setSelectedAnswer(answer);
        setShowFeedback(true);
        
        const isCorrect = answer === questions[currentIndex].correctAnswer;
        
        // Record answer
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.REACT_APP_BACKEND_URL || '/api'}/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    question_id: questions[currentIndex].id,
                    answer: answer
                })
            });
        } catch (err) {
            console.error('Error submitting answer:', err);
        }

        setAnswers(prev => ({
            ...prev,
            [questions[currentIndex].id]: { answer, isCorrect }
        }));

        // Move to next question after delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setShowFeedback(false);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    const getXpEarned = () => {
        let total = 0;
        Object.values(answers).forEach(({ isCorrect, answer }) => {
            if (isCorrect) {
                const q = questions.find(question => question.id === parseInt(Object.keys(answers).find(key => answers[key].answer === answer && answers[key].isCorrect)));
                if (q) {
                    if (q.difficulty === 'easy') total += 15;
                    else if (q.difficulty === 'medium') total += 25;
                    else total += 40;
                }
            }
        });
        return total;
    };

    const getScore = () => {
        const correct = Object.values(answers).filter(a => a.isCorrect).length;
        return { correct, total: questions.length };
    };

    const getOptionLetter = (index) => {
        return ['A', 'B', 'C', 'D'][index];
    };

    if (loading) {
        return (
            <div className="quiz-page">
                <div className="quiz-loading">Loading quiz...</div>
            </div>
        );
    }

    if (alreadyCompleted || showResult) {
        const score = getScore();
        const xpEarned = getXpEarned();
        const isPerfect = score.correct === score.total;

        return (
            <motion.div 
                className="quiz-page"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <button className="back-to-home" onClick={() => navigate('/')}>
                    ← Back to Home
                </button>

                <div className="quiz-results">
                    <motion.div 
                        className="results-card"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h1>{isPerfect ? '🏆' : '🎉'} Quiz Complete!</h1>
                        
                        <div className="score-display">
                            <span className="score-number">{score.correct}</span>
                            <span className="score-divider">/</span>
                            <span className="score-total">{score.total}</span>
                        </div>
                        <p className="score-label">Correct Answers</p>

                        <div className="xp-earned">
                            +{xpEarned} XP Earned!
                        </div>

                        {isPerfect && (
                            <div className="perfect-bonus">
                                +50 XP Perfect Score Bonus!
                            </div>
                        )}

                        <button 
                            className="try-again-btn"
                            onClick={() => navigate('/quests')}
                        >
                            Continue to Quests
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <motion.div 
            className="quiz-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <button className="back-to-home" onClick={() => navigate('/')}>
                ← Back to Home
            </button>

            <div className="quiz-header">
                <h1>🧠 Daily Football Quiz</h1>
                <div className="quiz-progress">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <div className="progress-bar">
                        <motion.div 
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentQuestion.id}
                    className="question-card"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    <div 
                        className="difficulty-badge"
                        style={{ background: DIFFICULTY_COLORS[currentQuestion.difficulty] }}
                    >
                        {currentQuestion.difficulty.toUpperCase()} (+{currentQuestion.difficulty === 'easy' ? 15 : currentQuestion.difficulty === 'medium' ? 25 : 40} XP)
                    </div>

                    <h2 className="question-text">{currentQuestion.question}</h2>

                    <div className="options-grid">
                        {currentQuestion.options.map((option, index) => {
                            const letter = getOptionLetter(index);
                            const isSelected = selectedAnswer === letter;
                            const isCorrect = letter === currentQuestion.correctAnswer;
                            const showCorrect = showFeedback && isCorrect;
                            const showWrong = showFeedback && isSelected && !isCorrect;

                            return (
                                <motion.button
                                    key={index}
                                    className={`option-btn ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                                    onClick={() => handleAnswer(letter)}
                                    disabled={showFeedback}
                                    whileHover={!showFeedback ? { scale: 1.02 } : {}}
                                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                                >
                                    <span className="option-letter">{letter}</span>
                                    <span className="option-text">{option}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default DailyQuiz;
