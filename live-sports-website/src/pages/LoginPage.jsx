import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css';

const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const formVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
};

const inputVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

function LoginPage() {
    const { login, register } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isRegistering && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            let result;
            if (isRegistering) {
                result = await register(formData.username, formData.email, formData.password, formData.confirmPassword);
            } else {
                result = await login(formData.email, formData.password);
            }

            if (!result.success) {
                setError(result.error);
            } else {
                window.dispatchEvent(new CustomEvent('userLoggedIn'));
                window.location.href = '/';
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    };

    return (
        <div className="login-page">
            <div className="login-page-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
                <div className="bg-glow"></div>
            </div>
            
            <motion.div 
                className="login-split-container"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageTransition}
            >
                <motion.div 
                    className="login-promo-side"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Link to="/" className="promo-logo-clickable">
                        <img src="/images/logo-dark.png" alt="SporKey" className="promo-main-logo" />
                    </Link>
                    <motion.h1 
                        className="promo-heading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Your Ultimate Destination for Live Sports Streaming
                    </motion.h1>
                    <motion.p 
                        className="promo-description"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Watch every match, follow your favorite teams, and never miss a moment of the action.
                    </motion.p>
                </motion.div>

                <motion.div 
                    className="login-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Link to="/" className="login-logo-link">
                        <img src="/images/logo-s.png" alt="SporKey" className="login-card-logo" />
                    </Link>

                    <motion.h1 
                        className="login-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {isRegistering ? 'Join SporKey' : 'Welcome Back'}
                    </motion.h1>

                    <motion.p 
                        className="login-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                    >
                        {isRegistering ? 'Create your account to start streaming' : 'Sign in to continue watching'}
                    </motion.p>

                    <AnimatePresence mode="wait">
                        <motion.form 
                            key={isRegistering ? 'register' : 'login'}
                            onSubmit={handleSubmit} 
                            className="login-form"
                            variants={formVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <AnimatePresence>
                                {isRegistering && (
                                    <motion.div 
                                        className="input-group"
                                        variants={inputVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                    >
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            required={isRegistering}
                                            className="login-input"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div 
                                className="input-group"
                                variants={inputVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: isRegistering ? 0.1 : 0.05 }}
                            >
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="login-input"
                                />
                            </motion.div>

                            <motion.div 
                                className="input-group"
                                variants={inputVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: isRegistering ? 0.15 : 0.1 }}
                            >
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="login-input"
                                />
                            </motion.div>

                            <AnimatePresence>
                                {isRegistering && (
                                    <motion.div 
                                        className="input-group"
                                        variants={inputVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                    >
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required={isRegistering}
                                            className="login-input"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <motion.div 
                                    className="login-error"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            <motion.button 
                                type="submit" 
                                className="login-submit-btn" 
                                disabled={loading}
                                whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(107, 33, 168, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
                            </motion.button>
                        </motion.form>
                    </AnimatePresence>

                    <motion.div 
                        className="login-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button 
                            type="button" 
                            className="login-toggle-link"
                            onClick={toggleMode}
                        >
                            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>

                        {!isRegistering && (
                            <>
                                <span className="login-divider">•</span>
                                <button 
                                    type="button" 
                                    className="login-toggle-link"
                                    onClick={() => alert("Forgot Password feature coming soon")}
                                >
                                    Forgot Password?
                                </button>
                            </>
                        )}
                    </motion.div>

                    <motion.div 
                        className="guest-btn-under-panel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button 
                            type="button" 
                            className="guest-enter-btn-new"
                            onClick={() => window.location.href = '/'}
                        >
                            Enter as Guest
                        </button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default LoginPage;
