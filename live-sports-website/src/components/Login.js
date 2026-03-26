import React, { useState } from 'react';
import '../styles/Login.css';

function Login({ onLogin, onClose }) {
    const [isRegistering, setIsRegistering] = useState(true); // Account creation by default
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
            const result = await onLogin({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                isRegistering
            });

            if (!result.success) {
                setError(result.error);
            } else {
                setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                window.location.href = '/'; // Hard redirect upon success
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" onClick={onClose}>
            {/* Background Image */}
            <div 
                className="login-background" 
                style={{ backgroundImage: `url('/images/signup-bg.png')` }}
            ></div>
            
            {/* Left Side Promotional Content */}
            <div className="login-promo-section">
                <img src="/images/logo-dark.png" alt="SporKey Logo" className="promo-logo" />
                <div className="promo-text-content">
                    <h1 className="promo-heading">
                        SPORKEY YOUR ULTIMATE DESTINATION FOR LIVE SPORTS STREAMING
                    </h1>
                    <p className="promo-subheading">
                        WATCH EVERY MATCH, FOLLOW YOUR FAVORITE TEAMS AND NEVER MISS A MOMENT OF THE ACTION.
                    </p>
                </div>
            </div>

            {/* The right side panel wrapper */}
            <div className="login-panel" onClick={(e) => e.stopPropagation()}>
                <form key={isRegistering ? 'register' : 'login'} onSubmit={handleSubmit} className="custom-login-form">
                    <img 
                        src="/images/logo-s.png" 
                        alt="Sporkey Logo" 
                        className="login-panel-logo"
                        style={{ width: '140px', height: 'auto', display: 'block', margin: '0 auto 10px auto' }}
                    />
                    <h2 className="panel-title">{isRegistering ? 'Create Account' : 'Login'}</h2>
                    
                    {error && <div className="panel-error">{error}</div>}

                    {isRegistering && (
                        <div className="panel-input-wrapper">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required={isRegistering}
                            />
                        </div>
                    )}
                    
                    <div className="panel-input-wrapper">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className="panel-input-wrapper">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    {isRegistering && (
                        <div className="panel-input-wrapper">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required={isRegistering}
                            />
                        </div>
                    )}

                    <button type="submit" className="panel-submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Enter'}
                    </button>
                    
                    <div className="panel-footer-links">
                        <button 
                            type="button" 
                            className="panel-toggle-btn"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                            }}
                        >
                            {isRegistering ? 'Login' : 'Create Account'}
                        </button>

                        {!isRegistering && (
                            <>
                                <span className="footer-divider">|</span>
                                <button 
                                    type="button" 
                                    className="panel-toggle-btn"
                                    onClick={() => alert("Forgot Password flow hasn't been implemented yet.")}
                                >
                                    Forgot Password?
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
