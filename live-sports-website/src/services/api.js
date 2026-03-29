import axios from 'axios';

const API_BASE_URL = 'https://streamed.pk/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';

// Team logo cache
const teamLogoCache = {};

// Team name mappings for better API matching
const teamNameMappings = {
    'man utd': 'manchester united',
    'manchester utd': 'manchester united',
    'mufc': 'manchester united',
    'man city': 'manchester city',
    'mcfc': 'manchester city',
    'liv': 'liverpool',
    'lfc': 'liverpool',
    'che': 'chelsea',
    'cfc': 'chelsea',
    'ars': 'arsenal',
    'afc': 'arsenal',
    'rma': 'real madrid',
    'fcb': 'fc barcelona',
    'barca': 'fc barcelona',
    'bayern': 'fc bayern munchen',
    'psg': 'paris saint germain',
    'juve': 'juventus',
    'ac milan': 'ac milan',
    'inter': 'internazionale',
};

// Direct logo URLs for top teams (most reliable)
const directLogos = {
    'manchester united': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    'manchester city': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    'liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    'chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    'arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    'real madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona.svg',
    'bayern munich': 'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_M%C3%BCnchen_logo.svg',
    'paris saint-germain': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_FC.svg',
    'psg': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_FC.svg',
    'juventus': 'https://upload.wikimedia.org/wikipedia/en/b/bc/ Juventus_FC_.svg',
    'ac milan': 'https://upload.wikimedia.org/wikipedia/en/d/d0/AC_Milan.svg',
    'inter milan': 'https://upload.wikimedia.org/wikipedia/en/0/00/Inter_Milan.svg',
    'atletico madrid': 'https://upload.wikimedia.org/wikipedia/en/7/72/Atl%C3%A9tico_Madrid_logo.svg',
    'borussia dortmund': 'https://upload.wikimedia.org/wikipedia/en/6/67/Borussia_Dortmund_logo.svg',
    'ajax': 'https://upload.wikimedia.org/wikipedia/en/0/04/AFC_Ajax.svg',
    'roma': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo.svg',
    'napoli': 'https://upload.wikimedia.org/wikipedia/en/2/2d/SSC_Napoli.svg',
    'atlético madrid': 'https://upload.wikimedia.org/wikipedia/en/7/72/Atl%C3%A9tico_Madrid_logo.svg',
};

export const fetchTeamLogo = async (teamName) => {
    if (!teamName) return null;
    
    const cacheKey = teamName.toLowerCase().trim();
    if (teamLogoCache[cacheKey]) {
        return teamLogoCache[cacheKey];
    }
    
    // Check direct logos first (most reliable)
    if (directLogos[cacheKey]) {
        teamLogoCache[cacheKey] = directLogos[cacheKey];
        return directLogos[cacheKey];
    }
    
    // Check mapped names
    const mappedName = teamNameMappings[cacheKey];
    if (mappedName && directLogos[mappedName]) {
        teamLogoCache[cacheKey] = directLogos[mappedName];
        return directLogos[mappedName];
    }
    
    try {
        // Try TheSportsDB with exact name
        const response = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`, {
            timeout: 5000
        });
        
        if (response.data?.teams?.[0]?.strTeamBadge) {
            const logoUrl = response.data.teams[0].strTeamBadge;
            teamLogoCache[cacheKey] = logoUrl;
            return logoUrl;
        }
        
        // Try with mapped name
        if (mappedName) {
            const altResponse = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(mappedName)}`, {
                timeout: 5000
            });
            
            if (altResponse.data?.teams?.[0]?.strTeamBadge) {
                const logoUrl = altResponse.data.teams[0].strTeamBadge;
                teamLogoCache[cacheKey] = logoUrl;
                return logoUrl;
            }
        }
    } catch (error) {
        console.error('Error fetching team logo:', error);
    }
    
    return null;
};

// Intercept responses to handle token expiration globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const msg = error.response.data?.message?.toLowerCase() || '';
            if (msg.includes('expired')) {
                window.dispatchEvent(new CustomEvent('sessionExpired'));
            }
        }
        return Promise.reject(error);
    }
);

// Fetch all available sports
export const fetchSports = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/sports`);
        return response.data;
    } catch (error) {
        console.error('Error fetching sports:', error);
        throw error;
    }
};

// Fetch matches for a specific sport
export const fetchMatches = async (sport = 'football') => {
    try {
        const response = await axios.get(`${API_BASE_URL}/matches/${sport}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
};

// Fetch stream for a specific match
export const fetchStream = async (source, id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stream/${source}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching stream:', error);
        throw error;
    }
};

// Fetch live matches (default to football)
export const fetchLiveMatches = async () => {
    return fetchMatches('football');
};

// Auth: Register
export const registerUser = async (username, email, password) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/register`, { username, email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Auth: Login
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Fetch all users
export const fetchUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Delete user
export const deleteUser = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Heartbeat
export const sendHeartbeat = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // Heartbeat is mocked as it was not explicitly requested or we can just send it to /api/account/me to keep it alive
        await axios.get(`${BACKEND_URL}/account/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Heartbeat failed', error);
    }
};

// Bets: Get History
export const getBets = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/bets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Bets: Place Bet
export const placeBet = async (amount, team, matchId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/bets`, { amount, team, matchId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Favorites: Get All
export const getFavorites = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Favorites: Add
export const addFavorite = async (referenceId, type = 'match') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/favorites`, { referenceId, type }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Favorites: Remove
export const removeFavorite = async (referenceId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/favorites/${referenceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Ban User
export const banUser = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/admin/users/${id}/ban`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Unban User
export const unbanUser = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/admin/users/${id}/unban`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Get Stats
export const getAdminStats = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// Admin: Get Logs
export const getAdminLogs = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/admin/logs`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Upload Profile Picture
export const uploadProfilePicture = async (formData, onUploadProgress) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/avatar`, formData, {
            headers: {
                Authorization: `Bearer ${token}`
                // Do NOT set Content-Type here — axios auto-detects multipart/form-data
                // with the correct boundary when given a FormData object
            },
            onUploadProgress
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Remove Profile Picture
export const removeProfilePicture = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/account/avatar`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Get Current profile
export const getCurrentUser = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Update Profile (Username/Email)
export const updateProfile = async (username, email) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/account/profile`, { username, email }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Change Password
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/account/password`, { currentPassword, newPassword }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Delete Account
export const deleteAccount = async (password, confirmationString) => {
    try {
        const token = localStorage.getItem('token');
        // axios.delete with request body requires 'data' property
        const response = await axios.delete(`${BACKEND_URL}/account`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { password, confirmationString }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Get Notification Preferences
export const getNotificationPreferences = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Update Notification Preferences
export const updateNotificationPreferences = async (preferences) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/account/notifications`, preferences, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Get Sessions
export const getSessions = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Revoke Session
export const revokeSession = async (sessionId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/account/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Revoke All Other Sessions
export const revokeAllSessions = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/account/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Enable 2FA
export const enable2FA = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/2fa/enable`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Verify 2FA
export const verify2FA = async (code) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/2fa/verify`, { code }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Disable 2FA
export const disable2FA = async (password) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/2fa/disable`, { password }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// ==================== FAVORITES & FEED ====================

// User: Get Favorites
export const getUserFavorites = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Add Favorite
export const addUserFavorite = async (entityType, entityId, entityName) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/favorites`, { entityType, entityId, entityName }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Remove Favorite
export const removeUserFavorite = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/account/favorites/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Get Feed Settings
export const getFeedSettings = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/feed-settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Update Feed Settings
export const updateFeedSettings = async (settings) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/account/feed-settings`, settings, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// ==================== PRIVACY, CONNECTED & EXPORT ====================

// User: Get Privacy Settings
export const getPrivacySettings = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/privacy`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Update Privacy Settings
export const updatePrivacySettings = async (settings) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/account/privacy`, settings, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Get Connected Accounts
export const getConnectedAccounts = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/account/connected`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Disconnect Account
export const disconnectAccount = async (provider) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${BACKEND_URL}/account/connected/${provider}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};

// User: Export Data
export const exportUserData = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${BACKEND_URL}/account/export`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Network Error' };
    }
};