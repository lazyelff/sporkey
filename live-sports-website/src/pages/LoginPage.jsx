import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css';

function LoginPage() {
    const navigate = useNavigate();
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

    return (
        <div className="login-page">
            <div className="login-page-bg">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
                <div className="bg-glow"></div>
            </div>
            
            <div className="login-page-container">
                <div className="login-promo-section">
                    <Link to="/" className="promo-logo-link">
                        <img src="/images/logo-dark.png" alt="SporKey Logo" className="promo-logo" />
                    </Link>
                    <div className="promo-text-content">
                        <h1 className="promo-heading">
                            SPORKEY YOUR ULTIMATE DESTINATION FOR LIVE SPORTS STREAMING
                        </h1>
                        <p className="promo-subheading">
                            WATCH EVERY MATCH, FOLLOW YOUR FAVORITE TEAMS AND NEVER MISS A MOMENT OF THE ACTION.
                        </p>
                    </div>
                </div>

                <div className="login-panel">
                    <form key={isRegistering ? 'register' : 'login'} onSubmit={handleSubmit} className="custom-login-form">
                        <img 
                            src="/images/logo-s.png" 
                            alt="Sporkey Logo" 
                            className="login-panel-logo"
                            style={{ width: '400px', height: 'auto', display: 'block', margin: '0 auto 15px auto' }}
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
        </div>
    );
}

export default LoginPage;
