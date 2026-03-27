import { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error loading user:', error);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const result = await loginUser(email, password);
            console.log('API response:', result);
            // Backend returns { success, data: { token, refreshToken, user } }
            if (result.success && result.data?.token && result.data?.user) {
                localStorage.setItem('currentUser', JSON.stringify(result.data.user));
                localStorage.setItem('token', result.data.token);
                setUser(result.data.user);
                return { success: true };
            }
            return { success: false, error: result.message || 'Login failed - check credentials' };
        } catch (error) {
            console.error('Login catch error:', error);
            return { success: false, error: error.message || 'Invalid credentials' };
        }
    };

    const register = async (username, email, password, confirmPassword) => {
        if (!username || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (password !== confirmPassword) {
            return { success: false, error: 'Passwords do not match' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        try {
            await registerUser(username, email, password);
            // After successful registration, login automatically
            const loginResult = await login(email, password);
            if (loginResult.success) {
                return { success: true };
            }
            return { success: false, error: 'Registration succeeded but auto-login failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        setUser(null);
    };

    return {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };
};
